document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('signUpModal');
    const signUpBtn = document.getElementById('signUpBtn');
    const closeModal = document.querySelector('.close-modal');

    signUpBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Add particle animation around CareerConnect
document.addEventListener('DOMContentLoaded', function() {
    // Background Particles
    const bgCanvas = document.getElementById('backgroundParticles');
    const bgCtx = bgCanvas.getContext('2d');
    
    // Brand Particles
    const brandCanvas = document.getElementById('brandParticles');
    const brandCtx = brandCanvas.getContext('2d');

    // Resize functions
    function resizeBgCanvas() {
        bgCanvas.width = window.innerWidth;
        bgCanvas.height = window.innerHeight;
    }

    function resizeBrandCanvas() {
        const container = document.querySelector('.brand-container');
        brandCanvas.width = container.offsetWidth;
        brandCanvas.height = container.offsetHeight;
    }

    resizeBgCanvas();
    resizeBrandCanvas();
    window.addEventListener('resize', () => {
        resizeBgCanvas();
        resizeBrandCanvas();
    });

    // Background Particle class
    class BgParticle {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * bgCanvas.width;
            this.y = Math.random() * bgCanvas.height;
            this.size = Math.random() * 3 + 0.5; // Slightly larger particles
            this.speedX = (Math.random() - 0.5) * 1.5; // Increased speed range
            this.speedY = (Math.random() - 0.5) * 1.5;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.pulseSpeed = 0.02;
            this.pulse = Math.random() * Math.PI;
            this.glowSize = this.size * 2;
        }

        update() {
            // Update position
            this.x += this.speedX;
            this.y += this.speedY;

            // Bounce off edges
            if (this.x < 0 || this.x > bgCanvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > bgCanvas.height) this.speedY *= -1;

            // Pulse animation
            this.pulse += this.pulseSpeed;
            this.currentSize = this.size * (1 + 0.2 * Math.sin(this.pulse));
            this.currentOpacity = this.opacity * (0.8 + 0.2 * Math.sin(this.pulse));
        }

        draw() {
            // Draw glow
            bgCtx.beginPath();
            const gradient = bgCtx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.glowSize
            );
            gradient.addColorStop(0, `rgba(0, 247, 255, ${this.currentOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 247, 255, 0)');
            bgCtx.fillStyle = gradient;
            bgCtx.arc(this.x, this.y, this.glowSize, 0, Math.PI * 2);
            bgCtx.fill();

            // Draw particle
            bgCtx.beginPath();
            bgCtx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            bgCtx.fillStyle = `rgba(0, 247, 255, ${this.currentOpacity})`;
            bgCtx.fill();
        }
    }

    // Brand Particle class
    class BrandParticle {
        constructor() {
            this.reset();
        }

        reset() {
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 100;
            const centerX = brandCanvas.width / 2;
            const centerY = brandCanvas.height / 2;
            
            this.x = centerX + Math.cos(angle) * distance;
            this.y = centerY + Math.sin(angle) * distance;
            this.size = Math.random() * 2 + 1;
            
            // Orbital motion parameters
            this.orbit = angle;
            this.orbitSpeed = (Math.random() * 0.002 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
            this.orbitRadius = distance;
            this.opacity = Math.random() * 0.5 + 0.2;
            
            // Pulse parameters
            this.pulse = Math.random() * Math.PI;
            this.pulseSpeed = 0.02;
        }

        update() {
            // Update orbital position
            this.orbit += this.orbitSpeed;
            this.x = brandCanvas.width / 2 + Math.cos(this.orbit) * this.orbitRadius;
            this.y = brandCanvas.height / 2 + Math.sin(this.orbit) * this.orbitRadius;
            
            // Update pulse
            this.pulse += this.pulseSpeed;
            this.currentSize = this.size * (1 + 0.2 * Math.sin(this.pulse));
        }

        draw() {
            brandCtx.beginPath();
            brandCtx.arc(this.x, this.y, this.currentSize, 0, Math.PI * 2);
            brandCtx.fillStyle = `rgba(0, 247, 255, ${this.opacity})`;
            brandCtx.fill();
        }
    }

    const bgParticles = Array(200).fill().map(() => new BgParticle()); // Increased from 150 to 200

    const brandParticles = [];
    const brandParticleCount = 50;

    for (let i = 0; i < brandParticleCount; i++) {
        brandParticles.push(new BrandParticle());
    }

    function animateBg() {
        bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
        
        bgParticles.forEach((particle, i) => {
            particle.update();
            particle.draw();

            // Enhanced connections
            bgParticles.slice(i + 1).forEach(particle2 => {
                const dx = particle.x - particle2.x;
                const dy = particle.y - particle2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 200) { // Increased connection distance
                    const opacity = 0.15 * (1 - distance/200);
                    bgCtx.beginPath();
                    bgCtx.strokeStyle = `rgba(0, 247, 255, ${opacity})`;
                    bgCtx.lineWidth = 0.5;
                    bgCtx.moveTo(particle.x, particle.y);
                    bgCtx.lineTo(particle2.x, particle2.y);
                    bgCtx.stroke();
                }
            });
        });

        requestAnimationFrame(animateBg);
    }

    function animateBrand() {
        brandCtx.clearRect(0, 0, brandCanvas.width, brandCanvas.height);
        
        brandParticles.forEach((particle, i) => {
            particle.update();
            particle.draw();

            // Draw connections
            for (let j = i + 1; j < brandParticles.length; j++) {
                const dx = brandParticles[j].x - particle.x;
                const dy = brandParticles[j].y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 70) {
                    brandCtx.beginPath();
                    brandCtx.strokeStyle = `rgba(0, 247, 255, ${0.2 * (1 - distance/70)})`;
                    brandCtx.lineWidth = 0.5;
                    brandCtx.moveTo(particle.x, particle.y);
                    brandCtx.lineTo(brandParticles[j].x, brandParticles[j].y);
                    brandCtx.stroke();
                }
            }
        });

        requestAnimationFrame(animateBrand);
    }

    animateBg();
    animateBrand();
});

// Get the server URL dynamically
const getServerURL = () => {
    // Check if running on Vercel
    if (window.location.hostname.includes('vercel.app')) {
        return `https://${window.location.hostname}`;
    }
    // Local development
    return 'http://localhost:3000';
};

const SERVER_URL = getServerURL();

// Function to handle registration
async function handleRegister(event) {
    event.preventDefault();
    
    const username = document.getElementById('signupUsername').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${SERVER_URL}/api/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert('Registration successful!');
            // Switch to login form
            document.querySelector('.form-box.login').style.transform = 'translateX(0px)';
            document.querySelector('.form-box.register').style.transform = 'translateX(400px)';
        } else {
            alert(data.message || 'Registration failed');
        }
    } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
    }
}

// Function to handle login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${SERVER_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (response.ok) {
            alert(`Welcome back, ${data.username}!`);
            // You can redirect to another page or update UI here
        } else {
            alert(data.message || 'Login failed');
        }
    } catch (error) {
        alert('Error connecting to server');
        console.error('Error:', error);
    }
}

// Add event listeners to forms
document.querySelector('.register form').addEventListener('submit', handleRegister);
document.querySelector('.login form').addEventListener('submit', handleLogin); 