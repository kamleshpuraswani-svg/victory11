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
