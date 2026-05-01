const Log = require('../models/Log');

// Map event types to severity levels
const getSeverity = (type) => {
    if (type.includes('DENIED') || type.includes('VIOLATION') || type.includes('FAILED')) return 'CRITICAL';
    if (type.includes('WARNING')) return 'WARN';
    if (type.includes('SUCCESS') || type.includes('GRANTED')) return 'SUCCESS';
    return 'INFO';
};

const logEvent = async (event) => {
    try {
        const severity = event.severity || getSeverity(event.type);

        await Log.create({
            action: event.type,
            user: event.user || 'Guest',
            role: event.role || 'guest',
            ip: event.ip || 'unknown',
            severity: severity,
            details: {
                path: event.path,
                reason: event.reason,
                message: event.message
            },
            timestamp: new Date()
        });

        // Console output for dev debugging
        console.log(`[${severity}] ${event.type} - ${event.user || 'Guest'} (${event.ip})`);

    } catch (err) {
        console.error("Failed to write log to DB:", err);
    }
};

module.exports = logEvent;
