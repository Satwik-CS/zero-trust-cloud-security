const canvas = document.getElementById('login-bg');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function init() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    particles = [];
    const numParticles = Math.floor((width * height) / 10000);
    for (let i = 0; i < numParticles; i++) {
        particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * 1,
            vy: (Math.random() - 0.5) * 1,
            size: Math.random() * 2 + 1
        });
    }
}

function animate() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 212, 255, 0.5)';
    
    for (let i = 0; i < particles.length; i++) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
            let p2 = particles[j];
            let dist = Math.hypot(p.x - p2.x, p.y - p2.y);
            if (dist < 100) {
                ctx.strokeStyle = `rgba(0, 212, 255, ${1 - dist/100})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animate);
}

window.addEventListener('resize', init);
init();
animate();

// Login Logic
let failedAttempts = 0;

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const user = document.getElementById('username').value;
    const pass = document.getElementById('password').value;
    
    const errorMsg = document.getElementById('errorMsg');
    const warningMsg = document.getElementById('warningMsg');
    const loginCard = document.getElementById('loginCard');

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('token', data.token);
            // Smooth fade out
            document.body.style.opacity = 0;
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 300);
        } else {
            failedAttempts++;
            errorMsg.style.display = 'block';
            loginCard.classList.remove('shake');
            void loginCard.offsetWidth; // trigger reflow
            loginCard.classList.add('shake');
            
            if (failedAttempts >= 3) {
                warningMsg.style.display = 'block';
            }
        }
    } catch (err) {
        errorMsg.textContent = 'Network Error';
        errorMsg.style.display = 'block';
        loginCard.classList.add('shake');
    }
});
