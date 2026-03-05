// =========================================
// 1. NEURAL BACKGROUND ANIMATION
// =========================================
(function initNeuralBackground() {
    const canvas = document.getElementById("neural-bg");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let particles = [];
    const particleCount = window.matchMedia('(pointer: coarse)').matches ? 40 : 80;
    const connectionDistance = 120;
    const mouseRadius = 150;
    let mouse = { x: null, y: null };
    let animationId;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    window.addEventListener("mousemove", (e) => {
        mouse.x = e.x;
        mouse.y = e.y;
    });

    window.addEventListener("mouseout", () => {
        mouse.x = null;
        mouse.y = null;
    });

    class Particle {
        constructor() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 1.5;
            this.speedX = (Math.random() - 0.5) * 0.8;
            this.speedY = (Math.random() - 0.5) * 0.8;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;

            if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
            if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;

            if (mouse.x !== null) {
                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < mouseRadius) {
                    const force = (mouseRadius - distance) / mouseRadius;
                    this.x -= (dx / distance) * force * 2;
                    this.y -= (dy / distance) * force * 2;
                }
            }
        }

        draw() {
            ctx.fillStyle = "rgba(0, 229, 255, 0.6)";
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function connectParticles() {
        for (let a = 0; a < particles.length; a++) {
            for (let b = a + 1; b < particles.length; b++) {
                const dx = particles[a].x - particles[b].x;
                const dy = particles[a].y - particles[b].y;
                const distanceSq = dx * dx + dy * dy;
                if (distanceSq < connectionDistance * connectionDistance) {
                    const distance = Math.sqrt(distanceSq);
                    const opacity = 1 - (distance / connectionDistance);
                    ctx.strokeStyle = `rgba(0, 229, 255, ${opacity * 0.15})`;
                    ctx.lineWidth = 1;
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
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.update();
            p.draw();
        });
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
    const progressBar = document.querySelector('.scroll-progress');
    if (!progressBar) return;

    window.addEventListener('scroll', () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });
})();

// =========================================
// 3. MOBILE MENU
// =========================================
(function initMobileMenu() {
    const toggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const isOpen = navLinks.classList.contains('active');
        toggle.setAttribute('aria-expanded', isOpen);
        
        // Animate hamburger
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
            spans[0].style.transform = '';
            spans[1].style.opacity = '1';
            spans[2].style.transform = '';
        });
    });
})();

// =========================================
// 4. TYPING EFFECT
// =========================================
(function initTypeWriter() {
    const txtElement = document.querySelector(".txt-type");
    if (!txtElement) return;

    const words = JSON.parse(txtElement.getAttribute("data-words"));
    const wait = parseInt(txtElement.getAttribute("data-wait")) || 2000;
    
    let txt = '';
    let wordIndex = 0;
    let isDeleting = false;

    function type() {
        const current = wordIndex % words.length;
        const fullTxt = words[current];

        if (isDeleting) {
            txt = fullTxt.substring(0, txt.length - 1);
        } else {
            txt = fullTxt.substring(0, txt.length + 1);
        }

        txtElement.innerHTML = `<span class="txt">${txt}</span><span class="cursor">|</span>`;

        let typeSpeed = isDeleting ? 50 : 100;

        if (!isDeleting && txt === fullTxt) {
            typeSpeed = wait;
            isDeleting = true;
        } else if (isDeleting && txt === '') {
            isDeleting = false;
            wordIndex++;
            typeSpeed = 500;
        }

        setTimeout(type, typeSpeed);
    }

    type();
})();

// =========================================
// 5. COUNTER ANIMATION
// =========================================
(function initCounters() {
    const counters = document.querySelectorAll(".counter");
    if (counters.length === 0) return;

    const observerOptions = { threshold: 0.5 };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute("data-target"));
                const duration = 2000;
                const startTime = performance.now();

                function updateCounter(currentTime) {
                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    const current = Math.floor(easeOut * target);
                    
                    counter.innerText = current;
                    
                    if (progress < 1) {
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.innerText = target + (target >= 100 ? "+" : "");
                    }
                }

                requestAnimationFrame(updateCounter);
                observer.unobserve(counter);
            }
        });
    }, observerOptions);

    counters.forEach(counter => observer.observe(counter));
})();

// =========================================
// 6. SCROLL ANIMATIONS
// =========================================
(function initScrollAnimations() {
    const animatedElements = document.querySelectorAll(".scroll-animate, .timeline-item, .glow-card, .stat-item");
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

    animatedElements.forEach(el => observer.observe(el));
})();

// =========================================
// 7. PROJECT DATA & MODAL
// =========================================
const projectData = {
    'cancer_fusion': {
        title: 'Multimodal Breast Cancer Detection',
        desc: `<strong>Overview:</strong><br>Final year thesis project combining ultrasound imaging with clinical data for early breast cancer detection.<br><br>
               <strong>Technical Approach:</strong>
               <ul>
                   <li>Used <strong>MedCLIP</strong> for extracting semantic embeddings from medical images</li>
                   <li>Implemented <strong>TabNet</strong> for processing tabular clinical data</li>
                   <li>Early Fusion strategy combining both modalities</li>
               </ul>
               <strong>Results:</strong> 82.7% Accuracy, 87.1% ROC-AUC`,
        code: `# Multimodal Fusion Architecture
class CancerDetectionModel(nn.Module):
    def __init__(self):
        self.medclip = MedCLIPModel()
        self.tabnet = TabNetEncoder()
        self.fusion = nn.Linear(576, 2)
    
    def forward(self, image, tabular):
        img_emb = self.medclip(image)      # 512-dim
        tab_emb = self.tabnet(tabular)     # 64-dim
        combined = torch.cat([img_emb, tab_emb], dim=1)
        return self.fusion(combined)`,
        link: 'https://github.com/adelugbaadejare034-blip/Breast_cancer_detention_using_muilt_modal_analysis'
    },
    'polling': {
        title: 'Nigeria Polling Unit Scraper',
        desc: `<strong>Overview:</strong><br>Large-scale web scraping system for electoral data collection across all 36 Nigerian states.<br><br>
               <strong>Features:</strong>
               <ul>
                   <li>Automated navigation of multi-layered government websites</li>
                   <li>Robust error handling and retry mechanisms</li>
                   <li>Real-time data validation and cleaning</li>
                   <li>Direct PostgreSQL database integration</li>
               </ul>
               <strong>Impact:</strong> 99.9% accuracy, 90% time reduction`,
        code: `from selenium import webdriver
from selenium.webdriver.common.by import By
import pandas as pd
from sqlalchemy import create_engine

class PollingUnitScraper:
    def __init__(self):
        self.driver = webdriver.Chrome()
        self.db = create_engine('postgresql://...')
    
    def scrape_state(self, state_code):
        # Navigate state portal
        # Extract LGA data
        # Store in PostgreSQL
        pass`,
        link: '#'
    },
    'automation': {
        title: 'TETFund Workflow Automation',
        desc: `<strong>Overview:</strong><br>Python automation pipeline for institutional report processing.<br><br>
               <strong>Components:</strong>
               <ul>
                   <li>PDF and Excel report parsing</li>
                   <li>Data validation and standardization</li>
                   <li>Automated classification and routing</li>
                   <li>Excel generation with formatting</li>
               </ul>`,
        code: `import pandas as pd
from pathlib import Path
import openpyxl

class ReportAutomator:
    def process_reports(self, input_dir):
        reports = Path(input_dir).glob("*.xlsx")
        for report in reports:
            df = pd.read_excel(report)
            cleaned = self.validate_data(df)
            self.generate_summary(cleaned)`,
        link: '#'
    },
    'salary': {
        title: 'Global Tech Salary Prediction',
        desc: `<strong>Overview:</strong><br>Machine learning model predicting global tech salaries based on job metadata.<br><br>
               <strong>Techniques:</strong>
               <ul>
                   <li>Feature engineering for categorical data</li>
                   <li>Random Forest and XGBoost regression</li>
                   <li>Cross-validation and hyperparameter tuning</li>
               </ul>`,
        code: `from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import GridSearchCV

model = RandomForestRegressor(n_estimators=100)
model.fit(X_train, y_train)
predictions = model.predict(X_test)`,
        link: 'https://github.com/adelugbaadejare034-blip/Salary-Prediction-Using-Global-Tech-Job-Metadata-Regression-Model-'
    },
    'har': {
        title: 'Human Activity Recognition',
        desc: `<strong>Overview:</strong><br>Deep learning system for activity recognition using wearable sensor data.<br><br>
               <strong>Architecture:</strong>
               <ul>
                   <li>Transformer-based time series processing</li>
                   <li>HAR-70 dataset with 12 activity classes</li>
                   <li>Real-time inference optimization</li>
               </ul>`,
        code: `class HARTransformer(nn.Module):
    def __init__(self, input_dim=6, d_model=128):
        super().__init__()
        self.embedding = nn.Linear(input_dim, d_model)
        self.encoder = nn.TransformerEncoder(
            nn.TransformerEncoderLayer(d_model, nhead=8), 
            num_layers=4
        )
        self.classifier = nn.Linear(d_model, 12)`,
        link: 'https://github.com/adelugbaadejare034-blip/Real-Time-Human-Activity-Recognition-Using-Time-Series-Transformers-Wearable-Sensors-HAR-70-Dataset-'
    },
    'heart': {
        title: 'Heart Disease Prediction',
        desc: `<strong>Overview:</strong><br>Clinical decision support system for heart disease risk assessment.<br><br>
               <strong>Methodology:</strong>
               <ul>
                   <li>Comprehensive EDA and feature selection</li>
                   <li>Multiple algorithm comparison (RF, XGBoost, LR)</li>
                   <li>Optimized for recall to minimize false negatives</li>
               </ul>`,
        code: `from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score

model = RandomForestClassifier(n_estimators=200, class_weight='balanced')
model.fit(X_train, y_train)
print(f"ROC-AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:,1]):.3f}")`,
        link: 'https://github.com/adelugbaadejare034-blip/Heart_disease_risk_prediction_system'
    },
    'bac': {
        title: 'Bunmi Adelugba & Co. Website',
        desc: `<strong>Overview:</strong><br>Professional corporate website for chartered accounting firm.<br><br>
               <strong>Features:</strong>
               <ul>
                   <li>Responsive design for all devices</li>
                   <li>Service portfolio showcase</li>
                   <li>Contact integration and SEO optimization</li>
               </ul>`,
        code: `<!-- Responsive Navigation -->
<nav class="navbar">
  <div class="logo">BAC Chartered</div>
  <ul class="nav-links">
    <li><a href="#services">Services</a></li>
    <li><a href="#contact">Contact</a></li>
  </ul>
</nav>`,
        link: 'https://github.com/2kkiller/BAC'
    },
    'calc': {
        title: 'C# Calculator',
        desc: `<strong>Overview:</strong><br>Desktop calculator application with advanced features.<br><br>
               <strong>Capabilities:</strong>
               <ul>
                   <li>Basic arithmetic operations</li>
                   <li>Memory functions and history</li>
                   <li>Error handling and input validation</li>
               </ul>`,
        code: `public class Calculator {
    public double Calculate(double a, double b, string operation) {
        return operation switch {
            "+" => a + b,
            "-" => a - b,
            "*" => a * b,
            "/" => b != 0 ? a / b : throw new DivideByZeroException(),
            _ => throw new InvalidOperationException()
        };
    }
}`,
        link: 'https://github.com/lifeishardtomove/CALCULATOR'
    }
};

// Modal functions
window.openModal = function (id) {
    const modal = document.getElementById("projectModal");
    const data = projectData[id];
    
    if (!data || !modal) return;
    
    document.getElementById("modalTitle").innerText = data.title;
    document.getElementById("modalDescription").innerHTML = data.desc;
    
    const link = document.getElementById("modalLink");
    link.href = data.link;
    link.style.display = data.link === '#' ? 'none' : 'inline-flex';
    
    const codeBlock = document.getElementById("modalCodeBlock");
    let codeHtml = data.code
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, '<br>')
        .replace(/(def|import|from|return|class|self|if|else|for|while|try|except|public|private|switch|case|void|int|float)/g, '<span class="code-keyword">$1</span>')
        .replace(/(#.*$)/gm, '<span style="color: #64748b;">$1</span>');
        
    codeBlock.innerHTML = `<code>${codeHtml}</code>`;
    
    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
};

window.closeModal = function () {
    const modal = document.getElementById("projectModal");
    if (modal) {
        modal.style.display = "none";
        document.body.style.overflow = "";
    }
};

// Close modal on outside click
window.onclick = function (e) {
    const modal = document.getElementById("projectModal");
    if (e.target === modal) {
        closeModal();
    }
};

// Close on Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeModal();
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href"));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});
