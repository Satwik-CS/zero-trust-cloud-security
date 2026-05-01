require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const logger = require('morgan');

const authRoutes = require('./routes/authRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const logEvent = require('./middleware/logging');

const mongoose = require('mongoose');
const Log = require('./models/Log');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/zerotrust_demo';

mongoose.connect(MONGO_URI).then(() => {
    console.log("✅ Connected to MongoDB Atlas");
    logEvent({ type: 'SYSTEM_START', message: `Server started on port ${PORT}`, ip: 'localhost', severity: 'INFO' });
}).catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api', authRoutes);

// ✅ Logs endpoint BEFORE resourceRoutes to avoid conflict
app.get('/api/logs', async (req, res) => {
    try {
        const logs = await Log.find({}).sort({ timestamp: -1 }).limit(50).lean();
        res.json(logs);
    } catch (err) {
        console.error('Log fetch error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.use('/api', resourceRoutes);

// Root Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});