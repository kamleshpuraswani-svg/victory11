const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Team, Match } = require('../models/schema');

// Middleware to verify admin role
const authenticateAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');

        const user = await User.findById(decoded.id);
        if (!user || user.role !== 'ADMIN') {
            return res.status(403).json({ message: 'Forbidden: Admin access required' });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error in admin middleware:', err.message);
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

// GET all registered users
router.get('/users', authenticateAdmin, async (req, res) => {
    try {
        const users = await User.find({ role: { $ne: 'ADMIN' } }).select('-password').sort({ createdAt: -1 });
        res.json({ users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ message: 'Server error fetching users' });
    }
});

// GET teams for a specific user
router.get('/users/:userId/teams', authenticateAdmin, async (req, res) => {
    try {
        const { userId } = req.params;

        // Find teams and populate necessary details if refs were set up perfectly.
        // For our simplified schema, we'll fetch teams and maybe attach basic match info.
        const teams = await Team.find({ userId }).sort({ _id: -1 });

        res.json({ teams });
    } catch (err) {
        console.error('Error fetching user teams:', err);
        res.status(500).json({ message: 'Server error fetching user teams' });
    }
});

// GET a specific team by ID
router.get('/teams/:teamId', authenticateAdmin, async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        res.json({ team });
    } catch (err) {
        console.error('Error fetching team details:', err);
        res.status(500).json({ message: 'Server error fetching team details' });
    }
});

// GET all teams for a specific match (with user info)
router.get('/matches/:matchId/teams', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        console.log(`[Admin] Fetching teams for matchId: ${matchId}`);

        // Find all teams for this match and populate user details (name, email)
        const teams = await Team.find({ matchId })
            .populate('userId', 'name email phone')
            .sort({ _id: -1 });

        res.json({ teams });
    } catch (err) {
        console.error('Error fetching match teams:', err);
        res.status(500).json({
            message: 'Server error fetching match teams',
            error: err.message
        });
    }
});

// 5. Update match status (UPCOMING -> LIVE -> COMPLETED)
router.patch('/matches/:matchId/status', authenticateAdmin, async (req, res) => {
    try {
        const { status } = req.body;

        if (!['UPCOMING', 'LIVE', 'COMPLETED'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const match = await Match.findOneAndUpdate(
            { customId: req.params.matchId },
            { status },
            { new: true }
        );

        if (!match) return res.status(404).json({ message: 'Match not found' });

        res.json({ message: `Match status updated to ${status}`, match });
    } catch (err) {
        console.error('Error updating match status:', err);
        res.status(500).json({ message: 'Server error updating status' });
    }
});

// 6. Update match live score
router.put('/matches/:matchId/score', authenticateAdmin, async (req, res) => {
    try {
        const { liveScore } = req.body;

        const match = await Match.findOneAndUpdate(
            { customId: req.params.matchId },
            { liveScore },
            { new: true }
        );

        if (!match) return res.status(404).json({ message: 'Match not found' });

        // Emit real-time update
        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', { matchId: req.params.matchId, liveScore: match.liveScore });
            console.log(`[Socket] Emitted scoreUpdate for ${req.params.matchId}`);
        }

        res.json({ message: 'Score updated successfully', liveScore: match.liveScore });
    } catch (err) {
        console.error('Error updating match score:', err);
        res.status(500).json({ message: 'Server error updating score' });
    }
});

// Match Scorecard & Points Calculation API
router.put('/matches/:matchId/player-stats', authenticateAdmin, async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const { playerStats } = req.body; // Array of { playerId, runs, wickets, catches, stumpings }

        if (!playerStats || !Array.isArray(playerStats)) {
            return res.status(400).json({ message: 'Invalid playerStats array' });
        }

        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        // 1. Calculate base fantasy points for each player
        // Point System: Run=1, Wicket=25, Catch=8, Stumping=12
        const processedStats = playerStats.map(stat => {
            const runs = Number(stat.runs) || 0;
            const wickets = Number(stat.wickets) || 0;
            const catches = Number(stat.catches) || 0;
            const stumpings = Number(stat.stumpings) || 0;

            const fantasyPoints = (runs * 1) + (wickets * 25) + (catches * 8) + (stumpings * 12);

            return {
                playerId: stat.playerId,
                runs, wickets, catches, stumpings, fantasyPoints
            };
        });

        // 2. Save stats to the Match document
        match.playerStats = processedStats;
        await match.save();

        // Create a quick lookup map for player points
        const pointsMap = {};
        processedStats.forEach(p => {
            pointsMap[p.playerId] = p.fantasyPoints;
        });

        // 3. Update all Teams that belong to this match
        const teams = await Team.find({ matchId });

        const bulkOps = teams.map(team => {
            let totalTeamPoints = 0;

            team.players.forEach(playerId => {
                let playerPts = pointsMap[playerId] || 0;

                // Apply Multipliers
                if (playerId === team.captainId) {
                    playerPts *= 2;
                } else if (playerId === team.viceCaptainId) {
                    playerPts *= 1.5;
                }

                totalTeamPoints += playerPts;
            });

            return {
                updateOne: {
                    filter: { _id: team._id },
                    update: { $set: { totalPoints: totalTeamPoints } }
                }
            };
        });

        if (bulkOps.length > 0) {
            await Team.bulkWrite(bulkOps);
        }

        // Emit socket event if we want the frontend to refresh stats instantly
        const io = req.app.get('io');
        if (io) {
            io.emit('statsUpdate', { matchId });
        }

        res.json({ message: 'Player stats updated and team points calculated successfully.' });
    } catch (err) {
        console.error("Update player stats error:", err);
        res.status(500).json({ message: 'Error updating player stats', error: err.message });
    }
});

module.exports = router;
