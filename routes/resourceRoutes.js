const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const policyEngine = require('../middleware/policy');
const logEvent = require('../middleware/logging');

// Public route
router.get('/public', (req, res) => {
    logEvent({
        type: 'ACCESS_PUBLIC',
        user: 'anonymous',
        role: 'guest',
        ip: req.ip,
        path: '/public',
        severity: 'INFO'
    });
    res.json({ message: "This is public data, accessible by anyone." });
});

// Protected: User Level
router.get('/user/data', verifyToken, (req, res, next) => {
    // Log the attempt before policy check
    if (!req.user || !['user', 'admin'].includes(req.user.role)) {
        logEvent({
            type: 'ACCESS_DENIED',
            user: req.user?.username || 'unknown',
            role: req.user?.role || 'guest',
            ip: req.ip,
            path: '/user/data',
            reason: 'Insufficient role',
            severity: 'CRITICAL'
        });
        return res.status(403).json({ message: 'Access Denied: Insufficient privileges' });
    }
    logEvent({
        type: 'ACCESS_GRANTED',
        user: req.user.username,
        role: req.user.role,
        ip: req.ip,
        path: '/user/data',
        severity: 'SUCCESS'
    });
    res.json({
        message: `Hello ${req.user.username}, you have accessed protected user data.`,
        level: "CONFIDENTIAL",
        timestamp: new Date()
    });
});

// Protected: Admin Level
router.get('/admin/config', verifyToken, (req, res) => {
    if (!req.user || req.user.role !== 'admin') {
        logEvent({
            type: 'ACCESS_DENIED',
            user: req.user?.username || 'unknown',
            role: req.user?.role || 'guest',
            ip: req.ip,
            path: '/admin/config',
            reason: 'Admin only resource',
            severity: 'CRITICAL'
        });
        return res.status(403).json({ message: 'Access Denied: Admin only' });
    }
    logEvent({
        type: 'ACCESS_GRANTED',
        user: req.user.username,
        role: req.user.role,
        ip: req.ip,
        path: '/admin/config',
        severity: 'SUCCESS'
    });
    res.json({
        message: `Welcome Admin ${req.user.username}. Critical system configuration accessed.`,
        status: "SECURE",
        system_uptime: process.uptime()
    });
});

module.exports = router;