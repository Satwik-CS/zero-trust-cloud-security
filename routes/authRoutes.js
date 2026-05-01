const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const logEvent = require('../middleware/logging');

const router = express.Router();
const usersPath = path.join(__dirname, '../data/users.json');

router.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Simulate reading from DB
    fs.readFile(usersPath, 'utf8', (err, data) => {
        if (err) {
            logEvent({ type: 'ERROR', message: 'Database Read Error', severity: 'CRITICAL' });
            return res.status(500).send("Internal Server Error");
        }

        const users = JSON.parse(data);
        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            // Sign Token
            const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                process.env.TOKEN_KEY || "secret_key",
                { expiresIn: "5m" } // Short expiry for Zero Trust
            );

            logEvent({
                type: 'LOGIN_SUCCESS',
                user: user.username,
                role: user.role,
                ip: req.ip,
                severity: 'SUCCESS'
            });
            return res.json({ token, user: { username: user.username, role: user.role } });
        } else {
            logEvent({
                type: 'LOGIN_FAILED',
                user: username,
                ip: req.ip,
                reason: 'Invalid Credentials',
                severity: 'WARN'
            });
            return res.status(401).send("Invalid Credentials");
        }
    });
});

module.exports = router;
