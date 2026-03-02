const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { Team } = require('../models/schema');

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

const matchesData = require('../data/matches.json');
const playersData = require('../data/players.json');
const contestsData = require('../data/contests.json');

// 2. Fetch Upcoming Matches
router.get('/matches/upcoming', async (req, res) => {
    res.json({ matches: matchesData });
});

// 2.1 Fetch Players for a Match
router.get('/players/:matchId', async (req, res) => {
    const match = matchesData.find(m => m.id === req.params.matchId);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const teamA = playersData[match.teams[0]] || [];
    const teamB = playersData[match.teams[1]] || [];

    // Combine players and add team info
    const allPlayers = [
        ...teamA.map(p => ({ ...p, team: match.teams[0] })),
        ...teamB.map(p => ({ ...p, team: match.teams[1] }))
    ];

    res.json({ players: allPlayers });
});

// 3. Team Creation with Validation
router.post('/teams/create', async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).json({ message: 'Request body is empty' });
        }

        const { matchId, playerIds, captainId, viceCaptainId } = req.body;
        console.log("Team Creation Request Received:", { matchId, playerIds, captainId, viceCaptainId });

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

        const updatedTeam = await Team.findByIdAndUpdate(
            req.params.teamId,
            { players: playerIds, captainId, viceCaptainId },
            { new: true }
        );

        if (!updatedTeam) return res.status(404).json({ message: 'Team not found' });

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

// 5.1 Fetch details for a specific team
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

// 5. Fetch Contests for a Match
router.get('/contests/:matchId', async (req, res) => {
    // For now, return the same dummy contests for all matches
    res.json({ contests: contestsData });
});

module.exports = router;
