require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const cors = require('cors');
app.use(cors());
app.use(express.json());

// Diagnostic Ping Route
app.get('/ping', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        message: 'Backend is reachable!'
    });
});


// Request Logger
app.use((req, res, next) => {
    const start = Date.now();
    if (req.method === 'POST') {
        console.log(`[${new Date().toISOString()}] POST Request to ${req.originalUrl}`);
        console.log("Body:", JSON.stringify(req.body, null, 2));
    }
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Global Error Handler
const errorHandler = (err, req, res, next) => {
    console.error("!!! GLOBAL SERVER ERROR !!!");
    console.error(err);
    res.status(500).json({
        message: "Internal Server Error (Captured by Global Handler)",
        error: err.message,
        path: req.originalUrl
    });
};


// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fantasy_cricket';
mongoose.connect(MONGODB_URI)
    .then(() => console.log('Successfully connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');

// Mount Auth routes FIRST to prevent shadowing by Generic API routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Error handler must be last
app.use(errorHandler);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Emit real-time score updates to users viewing a specific match
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinMatchRoom', (matchId) => {
        socket.join(matchId);
        console.log(`User joined room for match ${matchId}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
