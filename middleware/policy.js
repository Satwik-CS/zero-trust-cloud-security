const logEvent = require('./logging');

// Simple in-memory tracker for failed attempts (for demo purposes)
const failedAttempts = {};

const policyEngine = (allowedRoles = []) => {
    return (req, res, next) => {
        const ip = req.ip || req.connection.remoteAddress;
        const user = req.user;

        // 1. Context: Brute Force / Suspicious Behavior Detection
        if (failedAttempts[ip] > 5) {
            logEvent({
                type: 'POLICY_VIOLATION_BLOCKED_IP',
                reason: 'Too Many Failed Attempts',
                user: user?.username,
                ip,
                details: { path: req.path },
                severity: 'CRITICAL'
            });
            return res.status(429).json({ message: 'Access denied: Suspicious activity detected from this IP' });
        }

        // 2. Identity: Role-Based Access Control (RBAC)
        if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            logEvent({
                type: 'ACCESS_DENIED_ROLE_MISMATCH',
                reason: 'Insufficient Permissions',
                user: user.username,
                role: user.role,
                details: { required: allowedRoles, path: req.path },
                ip,
                severity: 'CRITICAL'
            });

            // Track failed attempt
            failedAttempts[ip] = (failedAttempts[ip] || 0) + 1;
            return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
        }

        // 3. Verification Success
        logEvent({
            type: 'ACCESS_GRANTED',
            user: user.username,
            role: user.role,
            ip,
            details: { path: req.path },
            severity: 'SUCCESS'
        });

        // Reset failed attempts on success
        failedAttempts[ip] = 0;

        next();
    };
};

module.exports = policyEngine;
