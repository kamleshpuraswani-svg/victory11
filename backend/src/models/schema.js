const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: String,
  email: { type: String, unique: true, sparse: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String, required: true },
  walletBalance: { type: Number, default: 0 },
  kycStatus: { type: String, enum: ['PENDING', 'VERIFIED', 'REJECTED'], default: 'PENDING' },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  createdAt: { type: Date, default: Date.now }
});

const matchSchema = new Schema({
  customId: { type: String, unique: true }, // For 'match_1', 'match_2' reference
  title: String,
  league: String,
  date: String,
  time: String,
  venue: String,
  status: { type: String, enum: ['UPCOMING', 'LIVE', 'COMPLETED'], default: 'UPCOMING' },
  startTime: Date,
  teams: [String],
  players: [{
    playerId: String,
    name: String,
    role: String,
    credits: Number
  }],
  liveScore: {
    runs: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    overs: { type: Number, default: 0 },
    balls: { type: Number, default: 0 },
    target: { type: Number },
    battingTeam: { type: String },
    lastEvent: { type: String } // e.g., "4 runs by Sanskar"
  },
  matchConfig: {
    // Match basics
    matchType: { type: String, enum: ['LIMITED_OVERS', 'BOX_TURF', 'PAIR', 'TEST', 'HUNDRED'], default: 'LIMITED_OVERS' },
    totalOvers: { type: Number, default: 20 },
    oversPerBowler: { type: Number, default: 4 },
    city: { type: String, default: '' },
    ground: { type: String, default: '' },
    matchDateTime: { type: Date },
    // Ball & pitch
    ballType: { type: String, enum: ['TENNIS', 'LEATHER', 'OTHER'], default: 'LEATHER' },
    pitchType: { type: String, enum: ['ROUGH', 'CEMENT', 'TURF', 'ASTROTURF', 'MATTING'], default: 'TURF' },
    // Power play configuration
    powerPlay1End: { type: Number, default: 6 },
    powerPlay2Start: { type: Number },
    powerPlay2End: { type: Number },
    powerPlay3Start: { type: Number },
    powerPlay3End: { type: Number },
    // Match rules
    wagonWheel: { type: Boolean, default: true },
    wideRuns: { type: Number, default: 1 },
    noBallRuns: { type: Number, default: 1 },
    wideAsLegal: { type: Boolean, default: false },
    noBallAsLegal: { type: Boolean, default: false },
    // Toss
    tossWinner: { type: String, default: '' },
    tossChoice: { type: String, enum: ['BAT', 'BOWL'], default: 'BAT' },
    // Officials
    umpires: [String],
    scorers: [String],
    inningsNumber: { type: Number, default: 1 }
  },
  liveSettings: {
    strikerId: String,
    nonStrikerId: String,
    bowlerId: String,
    currentOverBalls: [String],
    battingTeamId: String,
    bowlingTeamId: String,
    lastBallState: { type: Schema.Types.Mixed },
    awaitingNewBowler: { type: Boolean, default: false }
  },
  playerStats: [{
    playerId: String,
    // Batting stats
    runs: { type: Number, default: 0 },
    ballsFaced: { type: Number, default: 0 },
    fours: { type: Number, default: 0 },
    sixes: { type: Number, default: 0 },
    // Bowling stats
    overs: { type: Number, default: 0 }, // whole overs
    bowledBalls: { type: Number, default: 0 }, // partial over balls (0-5)
    runsConceded: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    maidens: { type: Number, default: 0 },
    // Fielding
    catches: { type: Number, default: 0 },
    stumpings: { type: Number, default: 0 },
    // Calculation
    fantasyPoints: { type: Number, default: 0 }
  }]
});

const teamSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  matchId: String, // String to support both real IDs and hardcoded ones like 'match_1'
  players: [String],
  captainId: String,
  viceCaptainId: String,
  totalPoints: { type: Number, default: 0 }
});

const contestSchema = new Schema({
  matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
  name: String,
  entryFee: Number,
  prizePool: Number,
  maxSpots: Number,
  filledSpots: { type: Number, default: 0 },
  participants: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team' }
  }]
});

module.exports = {
  User: mongoose.model('User', userSchema),
  Match: mongoose.model('Match', matchSchema),
  Team: mongoose.model('Team', teamSchema),
  Contest: mongoose.model('Contest', contestSchema)
};
