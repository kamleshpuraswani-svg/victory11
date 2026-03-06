
const mongoose = require('mongoose');
const { Match } = require('./src/models/schema');
require('dotenv').config();

async function testReset() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');

    const matchId = 'match_1';
    const match = await Match.findOne({ customId: matchId });
    if (!match) {
        console.log('Match not found');
        process.exit(1);
    }

    console.log('Current Status:', match.status);
    console.log('Current LiveScore:', JSON.stringify(match.liveScore));

    match.status = 'UPCOMING';
    match.liveSettings = {
        strikerId: null,
        nonStrikerId: null,
        bowlerId: null,
        currentOverBalls: [],
        battingTeamId: null,
        bowlingTeamId: null,
        lastBallState: null,
        awaitingNewBowler: false
    };
    match.liveScore = {
        runs: 0, wickets: 0, overs: 0, balls: 0,
        target: null, battingTeam: null, lastEvent: null
    };
    match.playerStats = [];
    match.matchConfig = {
        totalOvers: 20, oversPerBowler: 4,
        matchType: 'LIMITED_OVERS', inningsNumber: 1,
        wagonWheel: true, wideRuns: 1, noBallRuns: 1,
        wideAsLegal: false, noBallAsLegal: false, powerPlay1End: 6
    };

    match.markModified('liveSettings');
    match.markModified('liveScore');
    match.markModified('playerStats');
    match.markModified('matchConfig');

    await match.save();
    console.log('Match Reset Successful in DB');

    const updated = await Match.findOne({ customId: matchId });
    console.log('Updated Status:', updated.status);
    console.log('Updated LiveScore:', JSON.stringify(updated.liveScore));

    process.exit(0);
}

testReset();
