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

// Match Scorecard & Points Calculation API (Legacy)
router.put('/matches/:matchId/player-stats', authenticateAdmin, async (req, res) => {
    try {
        const matchId = req.params.matchId;
        const { playerStats } = req.body;

        if (!playerStats || !Array.isArray(playerStats)) {
            return res.status(400).json({ message: 'Invalid playerStats array' });
        }

        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        const processedStats = playerStats.map(stat => {
            const runs = Number(stat.runs) || 0;
            const wickets = Number(stat.wickets) || 0;
            const catches = Number(stat.catches) || 0;
            const stumpings = Number(stat.stumpings) || 0;
            const fantasyPoints = (runs * 1) + (wickets * 25) + (catches * 8) + (stumpings * 12);
            return { playerId: stat.playerId, runs, wickets, catches, stumpings, fantasyPoints };
        });

        match.playerStats = processedStats;
        await match.save();

        const pointsMap = {};
        processedStats.forEach(p => { pointsMap[p.playerId] = p.fantasyPoints; });

        const teams = await Team.find({ matchId });
        const bulkOps = teams.map(team => {
            let totalTeamPoints = 0;
            team.players.forEach(playerId => {
                let playerPts = pointsMap[playerId] || 0;
                if (playerId === team.captainId) playerPts *= 2;
                else if (playerId === team.viceCaptainId) playerPts *= 1.5;
                totalTeamPoints += playerPts;
            });
            return {
                updateOne: {
                    filter: { _id: team._id },
                    update: { $set: { totalPoints: totalTeamPoints } }
                }
            };
        });

        if (bulkOps.length > 0) await Team.bulkWrite(bulkOps);

        const io = req.app.get('io');
        if (io) io.emit('statsUpdate', { matchId });

        res.json({ message: 'Player stats updated and team points calculated successfully.' });
    } catch (err) {
        console.error("Update player stats error:", err);
        res.status(500).json({ message: 'Error updating player stats', error: err.message });
    }
});

// Ball-by-Ball Live Scoring Engine

// 1. Start match / Setup Innings
router.post('/matches/:matchId/start-innings', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { battingTeamId, bowlingTeamId, strikerId, nonStrikerId, bowlerId } = req.body;

        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        match.liveSettings = {
            battingTeamId,
            bowlingTeamId,
            strikerId,
            nonStrikerId,
            bowlerId,
            currentOverBalls: []
        };

        // Ensure playerStats exist for these players
        [strikerId, nonStrikerId, bowlerId].forEach(id => {
            if (!match.playerStats.find(ps => ps.playerId === id)) {
                match.playerStats.push({ playerId: id });
            }
        });

        match.liveScore.battingTeam = battingTeamId;
        match.status = 'LIVE';

        await match.save();

        const io = req.app.get('io');
        if (io) io.emit('statsUpdate', { matchId });

        res.json({ message: 'Innings started successfully', match });

    } catch (err) {
        console.error("Start innings error:", err);
        res.status(500).json({ message: 'Server error starting innings' });
    }
});

const getPlayerStat = (match, playerId) => {
    let stat = match.playerStats.find(ps => ps.playerId === playerId);
    if (!stat) {
        stat = { playerId, runs: 0, ballsFaced: 0, fours: 0, sixes: 0, overs: 0, bowledBalls: 0, runsConceded: 0, wickets: 0, maidens: 0, catches: 0, stumpings: 0, fantasyPoints: 0 };
        match.playerStats.push(stat);
        stat = match.playerStats[match.playerStats.length - 1];
    }
    return stat;
};

// 2. Process Ball
router.post('/matches/:matchId/process-ball', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { action, runs, extraType, wicketType, fielderId, outPlayerId, newBatterId, newBowlerId } = req.body;

        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        const settings = match.liveSettings;
        if (!settings || !settings.strikerId || !settings.bowlerId) {
            return res.status(400).json({ message: 'Innings not started or missing players setup' });
        }

        // SNAPSHOT STATE FOR UNDO
        // Convert to plain object, stringify/parse to deep clone, and save to lastBallState
        // We explicitly omit lastBallState from the clone so we don't nest infinitely
        const currentStateObj = match.toObject();
        delete currentStateObj.liveSettings.lastBallState;
        match.liveSettings.lastBallState = currentStateObj;

        const striker = getPlayerStat(match, settings.strikerId);
        const bowler = getPlayerStat(match, settings.bowlerId);

        let ballString = '';
        let isLegalBall = true;
        let requiresRotation = false;

        if (action === 'RUN') {
            const r = Number(runs) || 0;
            striker.runs += r;
            striker.ballsFaced += 1;
            bowler.runsConceded += r;

            if (r === 4) { striker.fours += 1; ballString = '4'; }
            else if (r === 6) { striker.sixes += 1; ballString = '6'; }
            else { ballString = r.toString(); }

            match.liveScore.runs += r;
            if (r % 2 !== 0) requiresRotation = true;

        } else if (action === 'EXTRAS') {
            const extraRuns = Number(runs) || 0;
            if (extraType === 'WD') {
                isLegalBall = false;
                match.liveScore.runs += (1 + extraRuns);
                bowler.runsConceded += (1 + extraRuns);
                ballString = extraRuns > 0 ? `${1 + extraRuns}Wd` : 'Wd';
                if (extraRuns % 2 !== 0) requiresRotation = true;

            } else if (extraType === 'NB') {
                isLegalBall = false;
                match.liveScore.runs += (1 + extraRuns);
                bowler.runsConceded += (1 + extraRuns);
                striker.ballsFaced += 1; // NB counts as ball faced

                if (extraRuns > 0) {
                    striker.runs += extraRuns;
                    if (extraRuns === 4) striker.fours += 1;
                    if (extraRuns === 6) striker.sixes += 1;
                    ballString = `${extraRuns}Nb`;
                } else {
                    ballString = 'Nb';
                }
                if (extraRuns % 2 !== 0) requiresRotation = true;

            } else if (extraType === 'LB' || extraType === 'B') {
                striker.ballsFaced += 1;
                const r = extraRuns > 0 ? extraRuns : 1; // Default back to 1 if LB/B pressed but 0 returned
                match.liveScore.runs += r;
                ballString = `${r}${extraType.charAt(0)}`;
                if (r % 2 !== 0) requiresRotation = true;
            }

        } else if (action === 'WICKET') {
            const extraRuns = Number(runs) || 0;

            // Handle Extras stacked with Wicket (e.g. Stumped off a Wide, Run Out off NB)
            if (extraType === 'WD') {
                isLegalBall = false;
                match.liveScore.runs += (1 + extraRuns);
                bowler.runsConceded += (1 + extraRuns);
                ballString = extraRuns > 0 ? `${1 + extraRuns}Wd+W` : 'Wd+W';
                if (extraRuns % 2 !== 0) requiresRotation = true;
            } else if (extraType === 'NB') {
                isLegalBall = false;
                match.liveScore.runs += (1 + extraRuns);
                bowler.runsConceded += (1 + extraRuns);
                striker.ballsFaced += 1; // NB counts as ball faced
                ballString = extraRuns > 0 ? `${extraRuns}Nb+W` : 'Nb+W';
                if (extraRuns > 0) {
                    striker.runs += extraRuns;
                    if (extraRuns === 4) striker.fours += 1;
                    if (extraRuns === 6) striker.sixes += 1;
                }
                if (extraRuns % 2 !== 0) requiresRotation = true;
            } else {
                striker.ballsFaced += 1;
                // If it's a legal ball and it's a Run Out where batsmen completed some runs
                if (wicketType === 'RUN_OUT' && extraRuns > 0) {
                    match.liveScore.runs += extraRuns;
                    bowler.runsConceded += extraRuns;
                    striker.runs += extraRuns;
                    if (extraRuns === 4) striker.fours += 1;
                    if (extraRuns === 6) striker.sixes += 1;
                    if (extraRuns % 2 !== 0) requiresRotation = true;
                }
                ballString = extraRuns > 0 ? `W+${extraRuns}` : 'W';
            }

            match.liveScore.wickets += 1;

            if (wicketType !== 'RUN_OUT') {
                bowler.wickets += 1;
            }

            if (fielderId) {
                const fielder = getPlayerStat(match, fielderId);
                if (wicketType === 'CAUGHT') fielder.catches += 1;
                else if (wicketType === 'STUMPED') fielder.stumpings += 1;
            }

            if (newBatterId) {
                if (outPlayerId === settings.strikerId) {
                    settings.strikerId = newBatterId;
                } else if (outPlayerId === settings.nonStrikerId) {
                    settings.nonStrikerId = newBatterId;
                }
            } else {
                return res.status(400).json({ message: 'newBatterId required for WICKET action' });
            }
        }

        if (ballString) settings.currentOverBalls.push(ballString);
        match.liveScore.lastEvent = ballString;

        if (isLegalBall) {
            match.liveScore.balls += 1;
            if (match.liveScore.balls === 6) {
                match.liveScore.overs += 1;
                match.liveScore.balls = 0;
            }

            bowler.bowledBalls += 1;
            if (bowler.bowledBalls === 6) {
                bowler.overs += 1;
                bowler.bowledBalls = 0;
            }
        }

        if (requiresRotation) {
            const temp = settings.strikerId;
            settings.strikerId = settings.nonStrikerId;
            settings.nonStrikerId = temp;
        }

        // Count AFTER ball is pushed so we detect the 6th ball correctly
        const filterNonLegal = b => !b.toLowerCase().includes('wd') && !b.toLowerCase().includes('nb');
        const legalBallsInOver = settings.currentOverBalls.filter(filterNonLegal).length;

        let overJustCompleted = false;
        if (legalBallsInOver === 6) {
            overJustCompleted = true;
            settings.currentOverBalls = [];

            // Rotate strike at end of over
            const temp2 = settings.strikerId;
            settings.strikerId = settings.nonStrikerId;
            settings.nonStrikerId = temp2;

            // Mark as awaiting bowler selection
            settings.awaitingNewBowler = true;
        }

        // Recalculate fantasy points
        match.playerStats.forEach(p => {
            const ptsRuns = p.runs || 0;
            const ptsFours = p.fours * 1;
            const ptsSixes = p.sixes * 2;
            const ptsWickets = (p.wickets || 0) * 25;
            const ptsCatches = (p.catches || 0) * 8;
            const ptsStumpings = (p.stumpings || 0) * 12;

            p.fantasyPoints = ptsRuns + ptsFours + ptsSixes + ptsWickets + ptsCatches + ptsStumpings;
        });

        await match.save();

        // Update user teams
        const pointsMap = {};
        match.playerStats.forEach(p => { pointsMap[p.playerId] = p.fantasyPoints; });

        const teams = await Team.find({ matchId });
        const bulkOps = teams.map(team => {
            let totalTeamPoints = 0;
            team.players.forEach(pid => {
                let pts = pointsMap[pid] || 0;
                if (pid === team.captainId) pts *= 2;
                else if (pid === team.viceCaptainId) pts *= 1.5;
                totalTeamPoints += pts;
            });
            return {
                updateOne: {
                    filter: { _id: team._id },
                    update: { $set: { totalPoints: totalTeamPoints } }
                }
            };
        });

        if (bulkOps.length > 0) await Team.bulkWrite(bulkOps);

        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', match.liveScore);
            io.emit('statsUpdate', {
                matchId,
                overCompleted: overJustCompleted
            });
        }

        res.json({ message: 'Ball processed successfully', overCompleted: overJustCompleted, match });

    } catch (err) {
        console.error("Process ball error:", err);
        res.status(500).json({ message: 'Server error processing ball' });
    }
});

// 3. Undo Last Ball
router.post('/matches/:matchId/undo-ball', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (!match.liveSettings || !match.liveSettings.lastBallState) {
            return res.status(400).json({ message: 'No previous action to undo.' });
        }

        // Revert State
        const prevState = match.liveSettings.lastBallState;

        match.liveScore = prevState.liveScore;
        match.liveSettings = prevState.liveSettings;
        match.playerStats = prevState.playerStats;

        // Clear the state so we can only undo once at a time
        match.liveSettings.lastBallState = null;

        await match.save();

        // Recalculate fantasy points for teams based on reverted stats
        const pointsMap = {};
        match.playerStats.forEach(p => { pointsMap[p.playerId] = p.fantasyPoints; });

        const teams = await Team.find({ matchId });
        const bulkOps = teams.map(team => {
            let totalTeamPoints = 0;
            team.players.forEach(pid => {
                let pts = pointsMap[pid] || 0;
                if (pid === team.captainId) pts *= 2;
                else if (pid === team.viceCaptainId) pts *= 1.5;
                totalTeamPoints += pts;
            });
            return {
                updateOne: {
                    filter: { _id: team._id },
                    update: { $set: { totalPoints: totalTeamPoints } }
                }
            };
        });

        if (bulkOps.length > 0) await Team.bulkWrite(bulkOps);

        const io = req.app.get('io');
        if (io) {
            io.emit('scoreUpdate', match.liveScore);
            io.emit('statsUpdate', { matchId });
        }

        res.json({ message: 'Undo successful', match });

    } catch (err) {
        console.error("Undo ball error:", err);
        res.status(500).json({ message: 'Server error undoing ball' });
    }
});

// 4. Swap Strike Manually
router.post('/matches/:matchId/swap-strike', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        if (!match.liveSettings || !match.liveSettings.strikerId) {
            return res.status(400).json({ message: 'Innings not started' });
        }

        const temp = match.liveSettings.strikerId;
        match.liveSettings.strikerId = match.liveSettings.nonStrikerId;
        match.liveSettings.nonStrikerId = temp;

        await match.save();

        const io = req.app.get('io');
        if (io) io.emit('statsUpdate', { matchId });

        res.json({ message: 'Strike swapped successfully', match });
    } catch (err) {
        console.error("Swap strike error:", err);
        res.status(500).json({ message: 'Server error swapping strike' });
    }
});

// 5. Change Bowler (after over completes)
router.post('/matches/:matchId/change-bowler', authenticateAdmin, async (req, res) => {
    try {
        const { matchId } = req.params;
        const { bowlerId } = req.body;
        if (!bowlerId) return res.status(400).json({ message: 'bowlerId is required' });

        const match = await Match.findOne({ customId: matchId });
        if (!match) return res.status(404).json({ message: 'Match not found' });

        // Only update the bowler, preserve everything else
        match.liveSettings.bowlerId = bowlerId;
        match.liveSettings.awaitingNewBowler = false;

        // Make sure this bowler has a playerStat entry
        if (!match.playerStats.find(ps => ps.playerId === bowlerId)) {
            match.playerStats.push({ playerId: bowlerId });
        }

        await match.save();

        const io = req.app.get('io');
        if (io) io.emit('statsUpdate', { matchId });

        res.json({ message: 'Bowler changed successfully', match });
    } catch (err) {
        console.error("Change bowler error:", err);
        res.status(500).json({ message: 'Server error changing bowler' });
    }
});

module.exports = router;
