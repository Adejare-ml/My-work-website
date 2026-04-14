/* ============================================
   ADEJARE.AI v5 — script.js
   No inline scripts in HTML. All JS here.
   ============================================ */
(function() {
  'use strict';

  /* ====== NEURAL BACKGROUND CANVAS ====== */
  var canvas = document.getElementById('neural-bg');
  if (canvas) {
    var ctx = canvas.getContext('2d');
    var nodes = [], NODE_COUNT = 55, MAX_DIST = 140, RAF_ID;
    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize, { passive: true });
    for (var i = 0; i < NODE_COUNT; i++) {
      nodes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35, r: Math.random() * 1.8 + 0.8 });
    }
    function drawNeural() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      nodes.forEach(function(n) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > canvas.width)  n.vx *= -1;
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1;
      });
      for (var a = 0; a < nodes.length; a++) {
        for (var b = a + 1; b < nodes.length; b++) {
          var dx = nodes[a].x - nodes[b].x, dy = nodes[a].y - nodes[b].y;
          var dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < MAX_DIST) {
            ctx.beginPath(); ctx.moveTo(nodes[a].x, nodes[a].y); ctx.lineTo(nodes[b].x, nodes[b].y);
            ctx.strokeStyle = 'rgba(88,166,255,' + ((1 - dist/MAX_DIST) * 0.18) + ')';
            ctx.lineWidth = 0.7; ctx.stroke();
          }
        }
      }
      nodes.forEach(function(n) {
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,229,255,0.35)'; ctx.fill();
      });
      RAF_ID = requestAnimationFrame(drawNeural);
    }
    drawNeural();
    document.addEventListener('visibilitychange', function() {
      if (document.hidden) cancelAnimationFrame(RAF_ID); else drawNeural();
    });
  }

  /* ====== SCROLL PROGRESS BAR ====== */
  var bar = document.querySelector('.scroll-progress');
  if (bar) {
    window.addEventListener('scroll', function() {
      bar.style.width = Math.min(window.scrollY / (document.documentElement.scrollHeight - window.innerHeight) * 100, 100) + '%';
    }, { passive: true });
  }

  /* ====== NAV SHRINK ON SCROLL ====== */
  var nav = document.querySelector('.site-nav');
  if (nav) {
    window.addEventListener('scroll', function() {
      nav.classList[window.scrollY > 60 ? 'add' : 'remove']('scrolled');
    }, { passive: true });
  }

  /* ====== SCROLL-REVEAL ====== */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length) {
    var revObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('revealed'); revObs.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function(el) { revObs.observe(el); });
  }

  /* ====== MOBILE NAV ====== */
  var toggle = document.querySelector('.nav-toggle');
  var navList = document.querySelector('.nav-links');
  if (toggle && navList) {
    toggle.addEventListener('click', function() {
      var open = navList.classList.toggle('open');
      var s = toggle.querySelectorAll('span');
      if (open) { s[0].style.transform='rotate(45deg) translate(4px,4px)'; s[1].style.opacity='0'; s[2].style.transform='rotate(-45deg) translate(4px,-4px)'; }
      else { s[0].style.transform=''; s[1].style.opacity='1'; s[2].style.transform=''; }
    });
    navList.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() {
        navList.classList.remove('open');
        var s = toggle.querySelectorAll('span');
        s[0].style.transform=''; s[1].style.opacity='1'; s[2].style.transform='';
      });
    });
  }

  /* ====== TYPING EFFECT ====== */
  var typedEl = document.querySelector('.typed-word');
  if (typedEl) {
    var words = ['ML pipelines', 'data infrastructure', 'automation systems', 'AI solutions'];
    var wi = 0, ci = 0, deleting = false;
    function tick() {
      var word = words[wi % words.length];
      if (!deleting) {
        typedEl.textContent = word.slice(0, ci + 1); ci++;
        if (ci === word.length) { deleting = true; setTimeout(tick, 1800); return; }
      } else {
        typedEl.textContent = word.slice(0, ci - 1); ci--;
        if (ci === 0) { deleting = false; wi++; }
      }
      setTimeout(tick, deleting ? 40 : 85);
    }
    tick();
  }

  /* ====== ANIMATED COUNTERS ====== */
  var counters = document.querySelectorAll('.counter');
  if (counters.length) {
    var cObs = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-target'));
        var decimal = el.getAttribute('data-decimal') || '';
        var suffix  = el.getAttribute('data-suffix')  || '';
        var start = performance.now();
        (function step(now) {
          var t = Math.min((now - start) / 1600, 1);
          var e = 1 - Math.pow(1 - t, 4);
          el.textContent = (t >= 1 ? target : Math.floor(e * target)) + decimal + suffix;
          if (t < 1) requestAnimationFrame(step);
        })(performance.now());
        cObs.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach(function(c) { cObs.observe(c); });
  }

  /* ====== PROFICIENCY BARS ====== */
  var profPanel = document.querySelector('.proficiency-panel');
  if (profPanel) {
    var pObs = new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting) return;
      profPanel.querySelectorAll('.prof-fill').forEach(function(fill, i) {
        setTimeout(function() { fill.classList.add('animate'); }, i * 90);
      });
      pObs.disconnect();
    }, { threshold: 0.2 });
    pObs.observe(profPanel);
  }

  /* ====== RADAR CHART ====== */
  var radarSvg = document.getElementById('radarChart');
  if (radarSvg) {
    var cx=200, cy=200, R=150, N=6;
    var axes = [
      { label:'ML / AI',    value:0.88 }, { label:'Data Eng.',  value:0.82 },
      { label:'Automation', value:0.90 }, { label:'SQL / DB',   value:0.76 },
      { label:'Python',     value:0.92 }, { label:'Docs',       value:0.78 }
    ];
    var ns = 'http://www.w3.org/2000/svg';
    var rStep = (Math.PI*2)/N, rStart = -Math.PI/2;
    function rPt(a,r){ return { x: cx+r*Math.cos(a), y: cy+r*Math.sin(a) }; }
    function rPath(pts){ return pts.map(function(p,i){ return (i?'L':'M')+p.x.toFixed(1)+','+p.y.toFixed(1); }).join(' ')+'Z'; }
    /* Defs: gradient */
    var defs=document.createElementNS(ns,'defs'), grad=document.createElementNS(ns,'linearGradient');
    grad.setAttribute('id','radarGrad'); grad.setAttribute('x1','0%'); grad.setAttribute('y1','0%'); grad.setAttribute('x2','100%'); grad.setAttribute('y2','100%');
    var s1=document.createElementNS(ns,'stop'); s1.setAttribute('offset','0%'); s1.setAttribute('stop-color','#58a6ff');
    var s2=document.createElementNS(ns,'stop'); s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#00e5ff');
    grad.appendChild(s1); grad.appendChild(s2); defs.appendChild(grad); radarSvg.insertBefore(defs, radarSvg.firstChild);
    /* Grid */
    for (var l=1; l<=5; l++) {
      var gp=document.createElementNS(ns,'path');
      gp.setAttribute('d', rPath(axes.map(function(_,i){ return rPt(rStart+i*rStep, R/5*l); })));
      gp.setAttribute('fill','none');
      gp.setAttribute('stroke', l===5?'rgba(88,166,255,.25)':'rgba(255,255,255,.05)');
      gp.setAttribute('stroke-width','1'); radarSvg.appendChild(gp);
    }
    /* Spokes + labels */
    axes.forEach(function(ax,i) {
      var angle=rStart+i*rStep, tip=rPt(angle,R), lpt=rPt(angle,R+26);
      var line=document.createElementNS(ns,'line');
      line.setAttribute('x1',cx); line.setAttribute('y1',cy);
      line.setAttribute('x2',tip.x.toFixed(1)); line.setAttribute('y2',tip.y.toFixed(1));
      line.setAttribute('stroke','rgba(88,166,255,.15)'); line.setAttribute('stroke-width','1');
      radarSvg.appendChild(line);
      var txt=document.createElementNS(ns,'text');
      txt.setAttribute('x',lpt.x.toFixed(1)); txt.setAttribute('y',lpt.y.toFixed(1));
      txt.setAttribute('text-anchor','middle'); txt.setAttribute('dominant-baseline','middle');
      txt.setAttribute('fill','#8b949e'); txt.setAttribute('font-size','11');
      txt.setAttribute('font-family','Plus Jakarta Sans, sans-serif'); txt.setAttribute('font-weight','600');
      txt.textContent=ax.label; radarSvg.appendChild(txt);
    });
    /* Data polygon */
    var dataPath=document.createElementNS(ns,'path');
    dataPath.setAttribute('fill','rgba(0,229,255,.1)'); dataPath.setAttribute('stroke','url(#radarGrad)');
    dataPath.setAttribute('stroke-width','2'); dataPath.setAttribute('stroke-linejoin','round');
    dataPath.setAttribute('opacity','0'); radarSvg.appendChild(dataPath);
    /* Vertex circles */
    axes.forEach(function(ax,i) {
      var p=rPt(rStart+i*rStep, R*ax.value);
      var c=document.createElementNS(ns,'circle');
      c.setAttribute('cx',p.x.toFixed(1)); c.setAttribute('cy',p.y.toFixed(1));
      c.setAttribute('r','4'); c.setAttribute('fill','#00e5ff');
      c.setAttribute('stroke','#0d1117'); c.setAttribute('stroke-width','2'); c.setAttribute('opacity','0');
      c.style.transition='opacity .3s '+(0.8+i*.06)+'s'; radarSvg.appendChild(c);
    });
    function drawRadar(prog) {
      dataPath.setAttribute('d', rPath(axes.map(function(ax,i){ return rPt(rStart+i*rStep, R*ax.value*prog); })));
    }
    drawRadar(0);
    var drawn=false;
    var rdObs=new IntersectionObserver(function(entries) {
      if (!entries[0].isIntersecting||drawn) return; drawn=true;
      dataPath.setAttribute('opacity','1');
      radarSvg.querySelectorAll('circle').forEach(function(c){ c.setAttribute('opacity','1'); });
      var t0=performance.now();
      (function anim(now){ var p=Math.min((now-t0)/1200,1); drawRadar(1-Math.pow(1-p,3)); if(p<1)requestAnimationFrame(anim); })(performance.now());
      rdObs.disconnect();
    }, { threshold:0.3 });
    rdObs.observe(radarSvg);
  }

  /* ====== GITHUB FEATURED REPOS ====== */
  /*
   * CONFIGURE THIS: Add / remove repo names below to control
   * which repos appear in the "All Public Repositories" section.
   * Names must match exactly as they appear on GitHub.
   * Leave the array empty ([]) to show all public repos.
   */
  var FEATURED_REPOS = [
    'Breast_cancer_detention_using_muilt_modal_analysis',
    'Real-Time-Human-Activity-Recognition-Using-Time-Series-Transformers-Wearable-Sensors-HAR-70-Dataset-',
    'Heart_disease_risk_prediction_system',
    'Salary-Prediction-Using-Global-Tech-Job-Metadata-Regression-Model-',
    'Credit-Card-Fraud-Detection-System'
  ];

  var ghGrid = document.getElementById('gh-repos-grid');
  if (ghGrid) {
    var ghStatus = document.getElementById('gh-status');
    /* Try both accounts in sequence */
    var ghAccounts = ['adejare-dev', 'adelugbaadejare034-blip'];
    var allRepos = [];
    var fetched = 0;

    function renderRepos() {
      if (ghStatus) ghStatus.style.display = 'none';
      var repos = allRepos;
      /* Filter to featured list (if any specified) */
      if (FEATURED_REPOS.length > 0) {
        repos = repos.filter(function(r) {
          return FEATURED_REPOS.indexOf(r.name) !== -1;
        });
        /* Sort by FEATURED_REPOS order */
        repos.sort(function(a, b) {
          return FEATURED_REPOS.indexOf(a.name) - FEATURED_REPOS.indexOf(b.name);
        });
      } else {
        repos = repos.filter(function(r) { return !r.fork; });
      }
      if (!repos.length) {
        ghGrid.innerHTML = '<p style="color:var(--muted);padding:16px 0;">No matching repositories found. <a href="https://github.com/adejare-dev" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">View on GitHub &rarr;</a></p>';
        return;
      }
      repos.forEach(function(repo) {
        var card = document.createElement('a');
        card.href = repo.html_url; card.target = '_blank'; card.rel = 'noopener noreferrer';
        card.className = 'gh-repo-card reveal';
        var desc = repo.description || 'No description provided.';
        var updated = new Date(repo.updated_at).toLocaleDateString('en-US',{year:'numeric',month:'short'});
        card.innerHTML =
          '<div class="gh-repo-top">' +
            '<i class="fas fa-code-branch gh-repo-icon"></i>' +
            '<span class="gh-repo-name">' + repo.name + '</span>' +
          '</div>' +
          '<p class="gh-repo-desc">' + desc.slice(0,120) + (desc.length>120?'&hellip;':'') + '</p>' +
          '<div class="gh-repo-meta">' +
            (repo.language ? '<span class="gh-lang"><span class="gh-lang-dot"></span>' + repo.language + '</span>' : '') +
            (repo.stargazers_count ? '<span class="gh-stars"><i class="fas fa-star"></i> ' + repo.stargazers_count + '</span>' : '') +
            '<span class="gh-updated">' + updated + '</span>' +
          '</div>';
        ghGrid.appendChild(card);
      });
      var newCards = ghGrid.querySelectorAll('.reveal');
      var dynObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(e) { if (e.isIntersecting) { e.target.classList.add('revealed'); dynObs.unobserve(e.target); } });
      }, { threshold: 0.1 });
      newCards.forEach(function(c) { dynObs.observe(c); });
    }

    function fetchAccount(username) {
      return fetch('https://api.github.com/users/' + username + '/repos?sort=updated&per_page=50', {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
      }).then(function(res) {
        if (!res.ok) return [];
        return res.json();
      }).then(function(repos) {
        allRepos = allRepos.concat(repos);
      }).catch(function() {});
    }

    Promise.all(ghAccounts.map(fetchAccount)).then(function() {
      if (!allRepos.length) {
        if (ghStatus) ghStatus.innerHTML = 'Could not load repositories. <a href="https://github.com/adejare-dev" target="_blank" rel="noopener noreferrer" style="color:var(--accent)">View on GitHub &rarr;</a>';
        return;
      }
      renderRepos();
    });
  }

  /* ====== CONTACT FORM ====== */
  var form = document.getElementById('contactForm');
  if (form) {
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBiGV9ihPpi-xZfgoWJGsZeHtCg9OP7rI-AnzbNQULdqwsHmZosEoCbt3kUk2IYMQXog/exec';
    var msgEl=document.getElementById('senderMessage'), charEl=document.getElementById('charCount');
    var submitBtn=document.getElementById('submitBtn'), statusEl=document.getElementById('formStatus');
    if (msgEl && charEl) {
      msgEl.addEventListener('input', function() {
        var l=this.value.length; charEl.textContent=l+' / 500';
        charEl.style.color=l>450?'#f85149':l>350?'#e3b341':'#8b949e';
      });
    }
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name=(document.getElementById('senderName')||{}).value||'';
      var email=(document.getElementById('senderEmail')||{}).value||'';
      var subject=(document.getElementById('senderSubject')||{}).value||'';
      var message=msgEl?msgEl.value:'';
      name=name.trim(); email=email.trim(); subject=subject.trim(); message=message.trim();
      if (!name||!email||!subject||!message){ showStatus('Please fill in all fields.','error'); return; }
      if (submitBtn){ submitBtn.disabled=true; submitBtn.textContent='Sending\u2026'; }
      var payload=new URLSearchParams();
      payload.append('name',name); payload.append('email',email);
      payload.append('subject',subject); payload.append('message',message);
      fetch(SCRIPT_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:payload.toString()})
        .then(function(){ showStatus("Message sent! I'll get back to you within 24 hours.",'success'); form.reset(); if(charEl)charEl.textContent='0 / 500'; })
        .catch(function(){ showStatus('Error. Please email: adelugbaadejare03@gmail.com','error'); })
        .finally(function(){ if(submitBtn){submitBtn.disabled=false;submitBtn.textContent='Send Message';} });
    });
    function showStatus(msg,type){
      if(!statusEl)return; statusEl.textContent=msg;
      statusEl.className='form-status '+type; statusEl.style.display='block';
      if(type==='success')setTimeout(function(){statusEl.style.display='none';},6000);
    }
  }

  /* ====== COPY BUTTONS ====== */
  document.querySelectorAll('.ci-copy').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var el=document.getElementById(this.getAttribute('data-copy')); if(!el)return;
      var text=el.textContent.trim(), icon=this.querySelector('i');
      function onOk(){ if(icon)icon.className='fas fa-check'; setTimeout(function(){if(icon)icon.className='fas fa-copy';},2000); }
      if(navigator.clipboard&&window.isSecureContext) navigator.clipboard.writeText(text).then(onOk).catch(function(){fallback(text,onOk);}); else fallback(text,onOk);
    });
  });
  function fallback(text,cb){ var ta=document.createElement('textarea'); ta.value=text; ta.style.cssText='position:fixed;top:0;left:0;opacity:0;'; document.body.appendChild(ta); ta.focus(); ta.select(); try{document.execCommand('copy');cb();}catch(e){} document.body.removeChild(ta); }

  /* ====== FILTER TABS ====== */
  document.querySelectorAll('.filter-tab').forEach(function(tab) {
    tab.addEventListener('click', function() {
      document.querySelectorAll('.filter-tab').forEach(function(t){t.classList.remove('active');});
      this.classList.add('active');
      var filter=this.getAttribute('data-filter');
      document.querySelectorAll('.project-card[data-category]').forEach(function(card){
        card.classList[filter==='all'||card.getAttribute('data-category')===filter?'remove':'add']('hidden-card');
      });
    });
  });

})();