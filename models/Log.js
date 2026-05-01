const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    user: { type: String, default: 'Guest' },
    role: { type: String, default: 'guest' },
    action: { type: String, required: true }, // e.g., 'LOGIN_SUCCESS', 'ACCESS_DENIED'
    severity: {
        type: String,
        enum: ['INFO', 'WARN', 'CRITICAL', 'SUCCESS'],
        default: 'INFO'
    },
    ip: { type: String, default: 'unknown' },
    details: { type: Object }, // Store extra context like path, reason, etc.
    userAgent: { type: String }
});

module.exports = mongoose.model('Log', LogSchema);
