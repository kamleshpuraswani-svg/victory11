const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { User, Team, Match } = require('../models/schema');

// Helper to extract userId from token
const getUserIdFromToken = (req) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            return decoded.id;
        }
    } catch (err) {
        console.error("Token verification failed in api.js:", err.message);
    }
    return null;
};

// 1. Matches and Teams Logic below


// 2. Fetch All Matches from DB
router.get('/matches/upcoming', async (req, res) => {
    try {
        const matches = await Match.find().sort({ startTime: 1 });
        // Map customId back to 'id' for frontend compatibility
        const formattedMatches = matches.map(m => ({
            ...m.toObject(),
            id: m.customId
        }));
        res.json({ matches: formattedMatches });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching matches' });
    }
});

// 2.1 Fetch Players for a Match
router.get('/players/:matchId', async (req, res) => {
    try {
        const match = await Match.findOne({ customId: req.params.matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        const playersData = require('../data/players.json');
        const teamA = playersData[match.teams[0]] || [];
        const teamB = playersData[match.teams[1]] || [];

        const allPlayers = [
            ...teamA.map(p => ({ ...p, playerId: p.id, team: match.teams[0] })),
            ...teamB.map(p => ({ ...p, playerId: p.id, team: match.teams[1] }))
        ];

        res.json({ players: allPlayers });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching players' });
    }
});

// 3. Team Creation with Validation
router.post('/teams/create', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        const { matchId, playerIds, captainId, viceCaptainId } = req.body;

        // CHECK MATCH STATUS
        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (match.status !== 'UPCOMING') {
            return res.status(403).json({
                message: `Cannot create team. Match is ${match.status.toLowerCase()}`
            });
        }

        if (!matchId || !playerIds || playerIds.length !== 11 || !captainId || !viceCaptainId) {
            return res.status(400).json({
                message: 'Invalid team data. Exactly 11 players, a Captain, and a Vice-Captain are required.',
                received: {
                    matchId,
                    playerCount: Array.isArray(playerIds) ? playerIds.length : 'not an array',
                    captainId,
                    viceCaptainId
                }
            });
        }

        // Extract userId from token if available
        const userId = getUserIdFromToken(req);

        // Create new team in DB
        const newTeam = new Team({
            userId,
            matchId,
            players: playerIds,
            captainId,
            viceCaptainId
        });

        await newTeam.save();

        res.json({ message: 'Team created successfully!', team: newTeam });
    } catch (err) {
        console.error("Team creation exception:", err);
        res.status(500).json({
            message: 'Internal server error during team creation',
            error: err.message
        });
    }
});

// 4. Update an existing team
router.put('/teams/:teamId', async (req, res) => {
    console.log(`[${new Date().toISOString()}] PUT /teams/${req.params.teamId} called`);
    try {
        const { playerIds, captainId, viceCaptainId } = req.body;
        console.log("Update Data:", { playerIds, captainId, viceCaptainId });

        const teamToUpdate = await Team.findById(req.params.teamId);
        if (!teamToUpdate) return res.status(404).json({ message: 'Team not found' });

        // CHECK MATCH STATUS
        const match = await Match.findOne({ customId: teamToUpdate.matchId });
        if (match && match.status !== 'UPCOMING') {
            return res.status(403).json({
                message: `Cannot edit team. Match is ${match.status.toLowerCase()}`
            });
        }

        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.teamId,
            { players: playerIds, captainId, viceCaptainId },
            { new: true }
        );

        res.json({ message: 'Team updated successfully!', team: updatedTeam });
    } catch (err) {
        console.error("Update team error:", err);
        res.status(500).json({ message: 'Error updating team' });
    }
});

// 5. Fetch Saved Teams for a Match
router.get('/teams/:matchId', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        let query = { matchId: req.params.matchId };

        // If a user is logged in, only return their teams. Otherwise return all (or handle differently)
        if (userId) query.userId = userId;

        const teams = await Team.find(query);
        res.json({ teams });
    } catch (err) {
        console.error("Fetch teams error:", err);
        res.status(500).json({ message: 'Error fetching teams' });
    }
});

// 5.1 Fetch details for a specific team (owner only)
router.get('/teams/details/:teamId', async (req, res) => {
    try {
        const userId = getUserIdFromToken(req);
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const team = await Team.findOne({ _id: req.params.teamId, userId });
        if (!team) return res.status(404).json({ message: 'Team not found' });

        res.json({ team });
    } catch (err) {
        console.error("Fetch team details error:", err);
        res.status(500).json({ message: 'Error fetching team details' });
    }
});

// 5.2 Fetch public details for a team (used by leaderboard)
router.get('/team-public/:teamId', async (req, res) => {
    try {
        const team = await Team.findById(req.params.teamId);
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Expose team details, don't strictly require owner mapping since it's for the leaderboard UI
        res.json({ team });
    } catch (err) {
        console.error("Fetch public team error:", err);
        res.status(500).json({ message: 'Error fetching public team details' });
    }
});

// 5. Fetch Contests for a Match
router.get('/contests/:matchId', async (req, res) => {
    try {
        const match = await Match.findOne({ customId: req.params.matchId });
        const contestsData = require('../data/contests.json');
        res.json({
            contests: contestsData,
            matchStatus: match ? match.status : 'UPCOMING'
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching contests' });
    }
});

// 6. Leaderboard - Global Ranking
router.get('/leaderboard', async (req, res) => {
    try {
        // Aggregate total points for each user across all their teams
        const leaderboardData = await Team.aggregate([
            {
                $group: {
                    _id: "$userId",
                    totalPoints: { $sum: "$totalPoints" },
                    teamCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: "users", // the collection name in MongoDB is usually pluralized 'users'
                    localField: "_id",
                    foreignField: "_id",
                    as: "userInfo"
                }
            },
            {
                $unwind: {
                    path: "$userInfo",
                    preserveNullAndEmptyArrays: false // Only include teams with valid users
                }
            },
            {
                $project: {
                    _id: 1,
                    totalPoints: 1,
                    teamCount: 1,
                    name: "$userInfo.name",
                    email: "$userInfo.email"
                }
            },
            {
                $sort: { totalPoints: -1 } // Sort by highest points first
            }
        ]);

        res.json({ leaderboard: leaderboardData });
    } catch (err) {
        console.error("Leaderboard fetch error:", err);
        res.status(500).json({ message: 'Error fetching leaderboard data' });
    }
});

// 6.1 Get teams for a specific user (for viewing from Leaderboard)
router.get('/leaderboard/:userId/teams', async (req, res) => {
    try {
        const { userId } = req.params;
        const teams = await Team.find({ userId }).sort({ _id: -1 });

        // Fetch user info for the header
        const user = await User.findById(userId).select('name email');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user, teams });
    } catch (err) {
        console.error("Fetch user teams from leaderboard error:", err);
        res.status(500).json({ message: 'Error fetching user teams' });
    }
});

module.exports = router;
