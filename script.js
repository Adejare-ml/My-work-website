// =========================================
// 1. ENHANCED NEURAL BACKGROUND
// =========================================
(function initNeuralBackground() {
    const canvas = document.getElementById("neural-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const particleCount = isMobile ? 45 : 90;
    const connectionDistance = 130;
    const mouseRadius = 160;
    let mouse = { x: null, y: null };
    let animationId;
    let particles = [];
    let time = 0;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    let resizeTimer;
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => { resizeCanvas(); init(); }, 200);
    });
    resizeCanvas();

    window.addEventListener("mousemove", (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener("mouseout", () => { mouse.x = null; mouse.y = null; });

    class Particle {
        constructor() { this.reset(true); }

        reset(randomY = false) {
            this.x = Math.random() * canvas.width;
            this.y = randomY ? Math.random() * canvas.height : Math.random() * canvas.height;
            this.baseSize = Math.random() * 1.5 + 0.8;
            this.size = this.baseSize;
            this.speedX = (Math.random() - 0.5) * 0.6;
            this.speedY = (Math.random() - 0.5) * 0.6;
            this.opacity = Math.random() * 0.5 + 0.2;
            this.pulseSpeed = Math.random() * 0.02 + 0.01;
            this.pulseOffset = Math.random() * Math.PI * 2;
            // Occasional "hot" nodes
            this.isHot = Math.random() < 0.08;
        }

        update(t) {
            this.x += this.speedX;
            this.y += this.speedY;

            // Pulse size
            this.size = this.baseSize + Math.sin(t * this.pulseSpeed + this.pulseOffset) * 0.5;

            // Wrap edges with a soft margin
            const margin = 10;
            if (this.x < -margin) this.x = canvas.width + margin;
            if (this.x > canvas.width + margin) this.x = -margin;
            if (this.y < -margin) this.y = canvas.height + margin;
            if (this.y > canvas.height + margin) this.y = -margin;

            // Mouse repulsion (smooth)
            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < mouseRadius) {
                    const force = (mouseRadius - dist) / mouseRadius;
                    const angle = Math.atan2(dy, dx);
                    this.x -= Math.cos(angle) * force * 2.5;
                    this.y -= Math.sin(angle) * force * 2.5;
                }
            }
        }

        draw() {
            // Hot nodes glow brighter
            const alpha = this.isHot ? Math.min(this.opacity * 1.8, 0.9) : this.opacity;
            const color = this.isHot ? `rgba(0, 180, 255, ${alpha})` : `rgba(0, 229, 255, ${alpha})`;

            ctx.save();
            if (this.isHot) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = 'rgba(0, 229, 255, 0.6)';
            }
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a + 1; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distSq = dx * dx + dy * dy;
                if (distSq < connectionDistance * connectionDistance) {
                    const dist = Math.sqrt(distSq);
                    const t = 1 - dist / connectionDistance;
                    // Hot connections glow brighter
                    const isHotLink = particles[a].isHot || particles[b].isHot;
                    const base = isHotLink ? 0.22 : 0.1;
                    const alpha = t * base;

                    const gradient = ctx.createLinearGradient(
                        particles[a].x, particles[a].y, particles[b].x, particles[b].y
                    );
                    gradient.addColorStop(0, `rgba(0, 229, 255, ${alpha})`);
                    gradient.addColorStop(0.5, `rgba(0, 100, 255, ${alpha * 0.6})`);
                    gradient.addColorStop(1, `rgba(0, 229, 255, ${alpha})`);

                    ctx.strokeStyle = gradient;
                    ctx.lineWidth = isHotLink ? 1.2 : 0.7;
                    ctx.beginPath();
                    ctx.moveTo(particles[a].x, particles[a].y);
                    ctx.lineTo(particles[b].x, particles[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function init() {
        particles = [];
        for (let i = 0; i < particleCount; i++) particles.push(new Particle());
    }

    function animate() {
        time++;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(time); p.draw(); });
        connectParticles();
        animationId = requestAnimationFrame(animate);
    }

    init();
    animate();

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            cancelAnimationFrame(animationId);
        } else {
            animate();
        }
    });
})();

// =========================================
// 2. SCROLL PROGRESS
// =========================================
(function initScrollProgress() {
    const bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    window.addEventListener('scroll', () => {
        const pct = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        bar.style.width = pct + '%';
    }, { passive: true });
})();

// =========================================
// 3. MOBILE MENU
// =========================================
(function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('active');
        toggle.setAttribute('aria-expanded', isOpen);
        const spans = toggle.querySelectorAll('span');
        if (isOpen) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        }
    });

    navLinks.querySelectorAll('.nav-item').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            toggle.setAttribute('aria-expanded', 'false');
            const spans = toggle.querySelectorAll('span');
            spans.forEach(s => s.style.transform = '');
            spans[1].style.opacity = '1';
        });
    });
})();

// =========================================
// 4. TYPING EFFECT
// =========================================
(function initTypeWriter() {
    const el = document.querySelector(".txt-type");
    if (!el) return;

    const words = JSON.parse(el.getAttribute("data-words"));
    const wait = parseInt(el.getAttribute("data-wait")) || 2000;
    let txt = '', wordIndex = 0, isDeleting = false;

    function type() {
        const full = words[wordIndex % words.length];
        txt = isDeleting ? full.substring(0, txt.length - 1) : full.substring(0, txt.length + 1);
        el.innerHTML = txt + '<span class="cursor">|</span>';

        let speed = isDeleting ? 45 : 95;
        if (!isDeleting && txt === full) { speed = wait; isDeleting = true; }
        else if (isDeleting && txt === '') { isDeleting = false; wordIndex++; speed = 500; }

        setTimeout(type, speed);
    }
    type();
})();

// =========================================
// 5. COUNTER ANIMATION
// =========================================
(function initCounters() {
    const counters = document.querySelectorAll(".counter");
    if (!counters.length) return;

    const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const counter = entry.target;
            const target = parseInt(counter.getAttribute("data-target"));
            let start = 0;
            const duration = 1500;
            const startTime = performance.now();

            function step(now) {
                const elapsed = now - startTime;
                const progress = Math.min(elapsed / duration, 1);
                // Ease out cubic
                const eased = 1 - Math.pow(1 - progress, 3);
                const value = Math.ceil(eased * target);
                counter.textContent = value + (progress === 1 && target >= 100 ? '+' : '');
                if (progress < 1) requestAnimationFrame(step);
            }
            requestAnimationFrame(step);
            obs.unobserve(counter);
        });
    }, { threshold: 0.5 });

    counters.forEach(c => obs.observe(c));
})();

// =========================================
// 6. SCROLL ANIMATIONS
// =========================================
(function initScrollAnimations() {
    const els = document.querySelectorAll(".scroll-animate, .glow-card, .stat-item, .timeline-item");
    const obs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add("visible");
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
})();

// =========================================
// 7. CONTACT PAGE — DATA STREAMS ANIMATION
// =========================================
(function initContactPageEffects() {
    // Only run on contact page
    if (!document.querySelector('.contact-container')) return;

    // Inject orb elements
    const orbsContainer = document.createElement('div');
    orbsContainer.className = 'contact-orbs';
    orbsContainer.innerHTML = `
        <div class="contact-orb contact-orb-1"></div>
        <div class="contact-orb contact-orb-2"></div>
        <div class="contact-orb contact-orb-3"></div>
    `;
    document.body.prepend(orbsContainer);

    // Inject data streams
    const streamsContainer = document.createElement('div');
    streamsContainer.className = 'data-streams';

    const streamCount = 12;
    for (let i = 0; i < streamCount; i++) {
        const stream = document.createElement('div');
        stream.className = 'data-stream';
        stream.style.left = (Math.random() * 100) + '%';
        stream.style.height = (Math.random() * 80 + 60) + 'px';
        stream.style.animationDuration = (Math.random() * 6 + 4) + 's';
        stream.style.animationDelay = (Math.random() * 8) + 's';
        stream.style.opacity = '0';
        streamsContainer.appendChild(stream);
    }
    document.body.prepend(streamsContainer);

    // Typed greeting on page load
    const header = document.querySelector('.page-header h1');
    if (header) {
        header.style.opacity = '0';
        header.style.transform = 'translateY(20px)';
        header.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            header.style.opacity = '1';
            header.style.transform = 'translateY(0)';
        }, 300);
    }

    // Stagger contact panels
    const panels = document.querySelectorAll('.contact-info, .contact-form');
    panels.forEach((panel, i) => {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(30px)';
        panel.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
        setTimeout(() => {
            panel.style.opacity = '1';
            panel.style.transform = 'translateY(0)';
        }, 400 + i * 180);
    });

    // Magnetic effect on social buttons
    document.querySelectorAll('.social-btn').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = (e.clientX - cx) * 0.3;
            const dy = (e.clientY - cy) * 0.3;
            btn.style.transform = `translate(${dx}px, ${dy - 4}px)`;
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = '';
            btn.style.transition = 'all 0.4s ease';
        });
    });

    // Input focus glow ripple
    document.querySelectorAll('.form-group input, .form-group textarea').forEach(input => {
        input.addEventListener('focus', () => {
            const group = input.closest('.form-group');
            group.style.transform = 'scale(1.01)';
            group.style.transition = 'transform 0.2s ease';
        });
        input.addEventListener('blur', () => {
            const group = input.closest('.form-group');
            group.style.transform = '';
        });
    });
})();

// =========================================
// 8. SMOOTH SCROLL
// =========================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        const target = document.querySelector(href);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
