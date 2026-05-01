const API_URL = 'http://localhost:3000/api';
let token = localStorage.getItem('token');
let currentUser = null;
let currentLogs = [];

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
let currentTheme = localStorage.getItem('theme') || 'dark';
document.documentElement.setAttribute('data-theme', currentTheme);
if (themeToggle) {
    themeToggle.textContent = currentTheme === 'dark' ? '☀' : '🌙';
    themeToggle.addEventListener('click', () => {
        currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', currentTheme);
        localStorage.setItem('theme', currentTheme);
        themeToggle.textContent = currentTheme === 'dark' ? '☀' : '🌙';
    });
}

// Auth Check & Session Timer
if (!token) {
    window.location.href = 'login.html';
} else {
    try {
        currentUser = JSON.parse(atob(token.split('.')[1]));
        const userBadge = document.getElementById('userBadge');
        if (userBadge) userBadge.textContent = `${currentUser.username} (${currentUser.role})`;

        // Timer Logic
        const sessionTimer = document.getElementById('sessionTimer');
        const exp = currentUser.exp * 1000;

        const updateTimer = () => {
            const now = Date.now();
            const diff = exp - now;
            if (diff <= 0) {
                logout();
            } else {
                const mins = Math.floor(diff / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                if (sessionTimer) sessionTimer.textContent = `Session expires in: ${mins}:${secs.toString().padStart(2, '0')}`;
            }
        };
        setInterval(updateTimer, 1000);
        updateTimer();
    } catch (e) {
        logout();
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = 'login.html';
}

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', logout);

// Resource Access
async function requestAccess(endpoint) {
    const resBox = document.getElementById('resourceResult');
    try {
        const res = await fetch(endpoint, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await res.json();

        resBox.style.display = 'block';
        if (res.ok) {
            resBox.style.background = 'rgba(0, 255, 136, 0.1)';
            resBox.style.border = '1px solid var(--success)';
            resBox.style.color = 'var(--success)';
            resBox.textContent = `[ACCESS GRANTED] ${data.message}`;
        } else {
            resBox.style.background = 'rgba(255, 68, 68, 0.1)';
            resBox.style.border = '1px solid var(--danger)';
            resBox.style.color = 'var(--danger)';
            resBox.textContent = `[ACCESS DENIED] ${data.message || 'Forbidden'}`;
        }
        fetchLogs(); // Refresh logs immediately after action
    } catch (err) {
        resBox.style.display = 'block';
        resBox.textContent = 'Network Error';
    }
}

// IP Geocache
const ipCache = {};

async function getIpGeo(ip) {
    if (!ip || ip === 'localhost' || ip === '::1' || ip === '127.0.0.1') return '🏳️ Local';
    if (ipCache[ip]) return ipCache[ip];
    try {
        const res = await fetch(`http://ip-api.com/json/${ip}`);
        const data = await res.json();
        if (data.status === 'success') {
            ipCache[ip] = `📍 ${data.countryCode}`;
            return ipCache[ip];
        }
    } catch (e) { }
    return ip;
}

// Fetch & Render Logs
async function fetchLogs() {
    try {
        const res = await fetch(`${API_URL}/logs`);
        if (!res.ok) return;
        const logs = await res.json();
        if (!Array.isArray(logs)) return;

        currentLogs = logs;
        renderLogs(logs);
        updateStats(logs);
        renderHeatmap(logs);
    } catch (err) {
        console.error("Failed to fetch logs:", err);
    }
}

async function renderLogs(logs) {
    const panel = document.getElementById('logPanel');
    if (!panel) return;

    let html = '';
    for (const log of logs) {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const badgeClass = `badge-${log.severity.toLowerCase()}`;

        const action = log.action || log.type || 'UNKNOWN';
        const details = log.message || (log.details ? JSON.stringify(log.details) : '');
        const ipText = await getIpGeo(log.ip);

        html += `
            <div class="log-row slide-in">
                <div><span class="badge ${badgeClass}">${log.severity}</span></div>
                <div>${time}</div>
                <div>${action}</div>
                <div style="color: var(--text-mut); font-size: 0.8rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title='${details}'>${details}</div>
                <div class="text-cyan">${log.ip || ''} <span style="color:#aaa;font-size:0.7rem">${ipText}</span></div>
            </div>
        `;
    }
    panel.innerHTML = html || '<div class="text-muted" style="padding: 20px;">No logs found.</div>';
}

function updateStats(logs) {
    const statTotal = document.getElementById('statTotal');
    const statBlocked = document.getElementById('statBlocked');
    const statSuccess = document.getElementById('statSuccess');
    const threatIndicator = document.getElementById('threatIndicator');

    if (!statTotal) return;

    statTotal.textContent = logs.length;

    const blocked = logs.filter(l => l.severity === 'CRITICAL' || l.type === 'ACCESS_DENIED').length;
    statBlocked.textContent = blocked;

    const success = logs.filter(l => l.severity === 'SUCCESS' || l.type === 'LOGIN_SUCCESS' || l.type === 'ACCESS_GRANTED').length;
    statSuccess.textContent = success;

    // Threat Level calculation
    const criticalRatio = logs.length > 0 ? blocked / logs.length : 0;
    let level = 'LOW';
    let color = 'var(--success)';
    if (criticalRatio > 0.5) { level = 'CRITICAL'; color = 'var(--danger)'; }
    else if (criticalRatio > 0.3) { level = 'HIGH'; color = 'var(--warning)'; }
    else if (criticalRatio > 0.1) { level = 'MEDIUM'; color = '#ffff00'; }

    threatIndicator.textContent = `Threat Level: ${level}`;
    threatIndicator.style.background = color;
    threatIndicator.style.color = '#000';
}

function renderHeatmap(logs) {
    const map = document.getElementById('activityHeatmap');
    if (!map) return;

    // Create a 7x24 grid simulation
    let html = '';
    for (let i = 0; i < 7 * 24; i++) {
        // Randomly simulate heat for now, combined with actual log count
        const intensity = Math.random();
        let bg = '#1e2d3d';
        if (intensity > 0.9) bg = 'var(--danger)';
        else if (intensity > 0.7) bg = 'var(--warning)';
        else if (intensity > 0.4) bg = 'rgba(0, 212, 255, 0.5)';

        html += `<div class="heat-cell" style="background: ${bg}; opacity: 0.8" title="Activity"></div>`;
    }
    map.innerHTML = html;
}

// CSV Export
const exportCsvBtn = document.getElementById('exportCsvBtn');
if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
        if (currentLogs.length === 0) return;

        let csv = 'Severity,Timestamp,Action,Details,IP\n';
        currentLogs.forEach(log => {
            csv += `${log.severity},${new Date(log.timestamp).toISOString()},${log.type},"${log.message || ''}",${log.ip || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', 'zero_trust_logs.csv');
        a.click();
    });
}

// Refresh logic
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', fetchLogs);
}

// Start auto-refresh only if on dashboard
if (document.getElementById('logPanel')) {
    setInterval(fetchLogs, 3000);
    fetchLogs();
}