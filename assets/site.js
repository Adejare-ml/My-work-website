/* ============================================================
   Adejare Adelugba — site script
   Motion rule: animate graphics around text that is already on
   the page. Nothing here hides or dims text. With reduced motion
   every graphic is drawn in its finished state and left still.
   ============================================================ */
(function () {
  'use strict';

  var reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
  var reduce = !!(reduceMQ && reduceMQ.matches);

  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function clamp(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function easeOut(x) { x = clamp(x); return 1 - Math.pow(1 - x, 3); }
  function easeInOut(x) { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
  function hasIO() { return 'IntersectionObserver' in window; }

  function watch(el, onChange, options) {
    if (!hasIO()) { onChange(true, el); return null; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { onChange(e.isIntersecting, e.target, e); });
    }, options || { threshold: 0.15 });
    io.observe(el);
    return io;
  }

  /* ---------- hero stage: "mess → meaning" ------------------
     One clock drives three scenes. render(t) is a pure function of
     time, so the finished frame is simply render(END). The markup
     already holds that finished frame, which is what visitors see
     without JavaScript or with reduced motion.
     -------------------------------------------------------- */

  function initStage() {
    var stage = document.getElementById('stage');
    if (!stage) return;
    var svg = stage.querySelector('.stage-svg');
    var scenes = $$('[data-scene]', svg);
    var tabs = $$('[data-scene-tab]', stage);
    var caps = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    var timers = tabs.map(function (t) { return t.querySelector('.tab-timer'); });
    var pauseBtn = stage.querySelector('[data-stage-pause]');
    var packets = $$('#packets circle', svg);

    var BUILD = 6.4;      /* seconds for one scene to assemble */
    var HOLD = 6;         /* then it idles before the next scene */
    var cur = 0, t = BUILD, T = 0, last = 0, raf = 0;
    var auto = !reduce, userPaused = false, visible = true;

    /* scene 0 parts */
    var cells = $$('[data-scene="0"] .s-cell', svg).map(function (c) {
      return { el: c, base: +c.getAttribute('data-o'), ph: +c.getAttribute('data-p'), y: +c.getAttribute('y') + 7 };
    });
    var scan = svg.querySelector('#s1-scan');
    var layers = $$('[data-scene="0"] [data-layer]', svg);
    var barA = svg.querySelector('#s1-bar-a'), barB = svg.querySelector('#s1-bar-b');
    var barAW = barA ? +barA.getAttribute('width') : 0, barBW = barB ? +barB.getAttribute('width') : 0;

    /* scene 1 parts */
    var docs = $$('.s2-doc', svg).map(function (d) {
      return { el: d, x: +d.getAttribute('data-x'), y: +d.getAttribute('data-y'), r: +d.getAttribute('data-r') };
    });
    var ring = svg.querySelector('#s2-ring');
    var edges = $$('[data-scene="1"] [data-edge]', svg).map(function (e) {
      return { el: e, level: +e.getAttribute('data-edge'), len: +e.getAttribute('data-len') };
    });
    var nodes = $$('[data-scene="1"] [data-level]', svg).map(function (n) {
      return { el: n, level: +n.getAttribute('data-level'), cx: +n.getAttribute('cx'), cy: +n.getAttribute('cy') };
    });

    /* scene 2 parts */
    var feed = svg.querySelector('#s3-feed');
    var llm = $$('[data-scene="2"] [data-llm]', svg);
    var llmEdges = $$('[data-scene="2"] [data-llm-edge]', svg);
    var sums = $$('[data-scene="2"] .s3-sum', svg).map(function (s) {
      return { el: s, x: +s.getAttribute('x'), y: +s.getAttribute('y') };
    });
    var marks = $$('[data-scene="2"] .s3-mark', svg).map(function (m) {
      return { el: m, x: +m.getAttribute('data-x'), y: +m.getAttribute('data-y') };
    });

    function scaleAbout(el, cx, cy, sx, sy) {
      el.setAttribute('transform', 'translate(' + cx + ' ' + cy + ') scale(' + sx + ' ' + sy + ') translate(' + (-cx) + ' ' + (-cy) + ')');
    }

    /* packets stream through the two gaps between the panels */
    var SEG = [[150, 205], [345, 400]];
    function streams(tt, TT) {
      var building = tt < BUILD;
      packets.forEach(function (c, i) {
        var seg = i < 3 ? 0 : 1, k = i % 3;
        var on, p;
        if (building) {
          var w0 = seg === 0 ? 0.9 : 3.3, w1 = seg === 0 ? 3.1 : 5.3;
          on = tt >= w0 && tt <= w1;
          p = ((tt - w0) / 0.8 + k / 3) % 1;
        } else {
          on = true;
          p = ((TT / 1.8) + k / 3 + seg * 0.17) % 1;
        }
        var x = SEG[seg][0] + (SEG[seg][1] - SEG[seg][0]) * p;
        c.setAttribute('cx', x.toFixed(1));
        c.setAttribute('cy', '170');
        c.setAttribute('opacity', on ? (Math.sin(Math.PI * p) * (building ? 1 : 0.7)).toFixed(2) : '0');
      });
    }

    var render = [
      function (tt, TT) { /* ultrasound → classifier → accuracy */
        var scanP = tt / 1.7;
        var scanY = 64 + 222 * easeInOut(scanP);
        if (scan) {
          scan.setAttribute('y', scanY.toFixed(1));
          scan.setAttribute('opacity', scanP > 0 && scanP < 1 ? '1' : '0');
        }
        cells.forEach(function (c) {
          var o = c.base * (0.72 + 0.28 * Math.sin(TT * 1.7 + c.ph));
          if (scanP > 0 && scanP < 1 && Math.abs(c.y - scanY) < 12) o += 0.35;
          c.el.setAttribute('opacity', o.toFixed(2));
        });
        layers.forEach(function (l, j) {
          var s = 2.0 + j * 0.3;
          var lit = tt < BUILD ? (tt >= s && tt <= s + 1.0) : (Math.floor(TT * 2.2) % layers.length === j);
          l.classList.toggle('s-layer-on', lit);
        });
        var b = easeOut((tt - 4.8) / 1.3);
        if (barA) barA.setAttribute('width', (barAW * b).toFixed(1));
        if (barB) barB.setAttribute('width', (barBW * easeOut((tt - 5.0) / 1.2)).toFixed(1));
      },
      function (tt, TT) { /* scattered records → scraper → hierarchy */
        docs.forEach(function (d, i) {
          var settle = easeOut((tt - 1.0 - i * 0.2) / 1.6);
          var r = d.r * (1 - 0.65 * settle) + 1.6 * Math.sin(TT * 1.3 + i);
          d.el.setAttribute('transform', 'translate(' + d.x + ' ' + d.y + ') rotate(' + r.toFixed(2) + ')');
        });
        if (ring) ring.setAttribute('transform', 'rotate(' + ((TT * 140) % 360).toFixed(1) + ' 275 160)');
        edges.forEach(function (e) {
          var p = easeOut((tt - (3.9 + (e.level - 1) * 0.65)) / 0.75);
          e.el.setAttribute('stroke-dashoffset', (e.len * (1 - p)).toFixed(1));
          e.el.classList.toggle('s-edge-on', p > 0.98 && tt < BUILD + 0.6);
        });
        nodes.forEach(function (n) {
          var at = n.level === 0 ? 3.7 : 3.9 + (n.level - 1) * 0.65 + 0.6;
          var p = easeOut((tt - at) / 0.45);
          n.el.classList.toggle('s-node-on', p > 0.5);
          scaleAbout(n.el, n.cx, n.cy, (0.4 + 0.6 * p).toFixed(3), (0.4 + 0.6 * p).toFixed(3));
        });
      },
      function (tt, TT) { /* headlines → LLM cascade → brief */
        if (feed) feed.setAttribute('transform', 'translate(0 ' + (-((TT * 20) % 224)).toFixed(1) + ')');
        llm.forEach(function (n, i) {
          var s = 2.0 + i * 0.55;
          var lit = tt < BUILD ? (tt >= s) : (Math.floor(TT * 1.6) % 4 === i);
          n.classList.toggle('s-node-on', lit);
        });
        llmEdges.forEach(function (e, i) {
          e.classList.toggle('s-edge-on', tt >= 2.3 + i * 0.55);
        });
        sums.forEach(function (s, i) {
          var p = easeOut((tt - 4.3 - i * 0.18) / 0.8);
          scaleAbout(s.el, s.x, s.y, Math.max(p, 0.001).toFixed(3), 1);
        });
        marks.forEach(function (m, i) {
          var p = easeOut((tt - 5.0 - i * 0.18) / 0.5);
          m.el.setAttribute('transform', 'translate(' + m.x + ' ' + m.y + ') scale(' + (0.4 + 0.6 * p).toFixed(3) + ')');
          m.el.setAttribute('opacity', (0.15 + 0.85 * p).toFixed(2));
        });
      }
    ];

    function draw() {
      render[cur](t, T);
      if (!reduce) streams(t, T); else packets.forEach(function (c) { c.setAttribute('opacity', '0'); });
      timers.forEach(function (el, i) {
        if (!el) return;
        var p = (auto && i === cur) ? clamp(t / (BUILD + HOLD)) : 0;
        el.style.transform = 'scaleX(' + p.toFixed(3) + ')';
      });
    }

    function show(i, byUser) {
      cur = (i + scenes.length) % scenes.length;
      scenes.forEach(function (g, k) {
        if (k === cur) g.removeAttribute('display'); else g.setAttribute('display', 'none');
      });
      tabs.forEach(function (tab, k) {
        tab.setAttribute('aria-selected', k === cur ? 'true' : 'false');
        tab.tabIndex = k === cur ? 0 : -1;
        if (caps[k]) caps[k].hidden = k !== cur;
      });
      if (byUser) auto = false;
      t = reduce ? BUILD : 0;
      draw();
    }

    function frame(now) {
      raf = 0;
      var dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      t += dt; T += dt;
      /* one pass through the scenes, then it stays on the last one */
      if (auto && t > BUILD + HOLD) {
        if (cur === scenes.length - 1) { auto = false; draw(); }
        else show(cur + 1, false);
      }
      else draw();
      schedule();
    }

    function running() { return !reduce && !userPaused && visible && !document.hidden; }
    function schedule() {
      if (running() && !raf) raf = requestAnimationFrame(frame);
    }
    function halt() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; last = 0;
    }

    tabs.forEach(function (tab, k) {
      tab.addEventListener('click', function () { show(k, true); halt(); schedule(); });
      tab.addEventListener('keydown', function (e) {
        var dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (e.key === 'Home') dir = -k; else if (e.key === 'End') dir = tabs.length - 1 - k;
        if (!dir) return;
        e.preventDefault();
        var next = (k + dir + tabs.length) % tabs.length;
        tabs[next].focus();
        show(next, true); halt(); schedule();
      });
    });

    if (pauseBtn) {
      pauseBtn.addEventListener('click', function () {
        userPaused = !userPaused;
        pauseBtn.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
        pauseBtn.setAttribute('aria-label', userPaused ? 'Play animation' : 'Pause animation');
        if (userPaused) halt(); else schedule();
      });
    }

    watch(stage, function (inView) { visible = inView; if (inView) schedule(); else halt(); }, { threshold: 0.1 });
    document.addEventListener('visibilitychange', function () { if (document.hidden) halt(); else schedule(); });

    if (reduce) {
      stage.classList.add('is-static');
      show(0, false);
    } else {
      show(0, false);
      schedule();
    }
  }

  /* ---------- case-study pipelines --------------------------
     A packet runs down each pipeline and each step lights as it
     passes. Labels never move. Runs only while on screen.
     -------------------------------------------------------- */

  function initPipes() {
    $$('[data-pipe]').forEach(function (pipe) {
      var steps = pipe.querySelector('.pipe-steps');
      var dots = $$('.pipe-dot', pipe);
      var packet = pipe.querySelector('.pipe-packet');
      var rail = pipe.querySelector('.pipe-rail');
      if (!steps || dots.length < 2 || !packet) return;
      var run = parseFloat(getComputedStyle(pipe).getPropertyValue('--run')) || 4.8;

      function measure() {
        var base = steps.getBoundingClientRect();
        var first = dots[0].getBoundingClientRect();
        var lastDot = dots[dots.length - 1].getBoundingClientRect();
        var y0 = first.top - base.top + first.height / 2;
        var y1 = lastDot.top - base.top + lastDot.height / 2;
        var len = Math.max(y1 - y0, 1);
        packet.style.top = (y0 - 5) + 'px';
        packet.style.left = (first.left - base.left + first.width / 2 - 5) + 'px';
        packet.style.setProperty('--len', len + 'px');
        if (rail) {
          rail.style.top = y0 + 'px';
          rail.style.height = len + 'px';
          rail.style.bottom = 'auto';
          rail.style.left = (first.left - base.left + first.width / 2 - 1) + 'px';
        }
        dots.forEach(function (d) {
          var r = d.getBoundingClientRect();
          var off = (r.top - base.top + r.height / 2 - y0) / len;
          d.style.animationDelay = (off * 0.82 * run).toFixed(3) + 's';
        });
      }
      measure();
      if ('ResizeObserver' in window) new ResizeObserver(measure).observe(steps);
      if (!reduce) watch(pipe, function (inView) { pipe.classList.toggle('is-live', inView); }, { threshold: 0.3 });
    });
  }

  /* ---------- comparison bars grow when first seen ---------- */

  function initBars() {
    $$('[data-bars]').forEach(function (b) {
      if (reduce) { b.classList.add('is-shown'); return; }
      var io = watch(b, function (inView) {
        if (!inView) return;
        b.classList.add('is-shown');
        if (io) io.disconnect();
      }, { threshold: 0.4 });
    });
  }

  /* ---------- result meters grow; the numbers never change ---- */

  function initMeters() {
    var strip = document.querySelector('.proof');
    if (!strip) return;
    if (reduce) { strip.classList.add('is-shown'); return; }
    var io = watch(strip, function (inView) {
      if (!inView) return;
      strip.classList.add('is-shown');
      if (io) io.disconnect();
    }, { threshold: 0.4 });
  }

  /* ---------- project cards: a line draws, a packet runs it ---- */

  function initCards() {
    var cards = $$('.pcard');
    if (!cards.length) return;
    if (reduce || !hasIO()) { cards.forEach(function (c) { c.classList.add('is-live'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var k = 0;
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.style.setProperty('--k', String(k++));
        e.target.classList.add('is-live');
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    cards.forEach(function (c) { io.observe(c); });
  }

  /* ---------- featured diagram: two inputs merge ------------- */

  function initFusion() {
    var svg = document.querySelector('[data-fusion]');
    if (!svg || reduce) return;
    var paths = $$('.s-track', svg);
    var dots = $$('[data-fp]', svg);
    var hub = svg.querySelector('.s-node-on');
    if (paths.length < 3 || dots.length < 3 || !paths[0].getTotalLength) return;
    var lens = paths.map(function (p) { return p.getTotalLength(); });
    var raf = 0, t0 = 0;
    function place(i, p) {
      var pt = paths[i].getPointAtLength(lens[i] * p);
      dots[i].setAttribute('cx', pt.x.toFixed(1));
      dots[i].setAttribute('cy', pt.y.toFixed(1));
      dots[i].setAttribute('opacity', p > 0 && p < 1 ? '1' : '0');
    }
    function frame(now) {
      if (!t0) t0 = now;
      var s = ((now - t0) / 1000) % 3.4;
      place(0, easeInOut(s / 1.5));
      place(1, easeInOut((s - 0.15) / 1.5));
      place(2, easeInOut((s - 1.75) / 0.8));
      if (hub) hub.style.opacity = (s > 1.5 && s < 1.9) ? '0.6' : '1';
      raf = requestAnimationFrame(frame);
    }
    watch(svg, function (inView) {
      if (inView && !raf) { t0 = 0; raf = requestAnimationFrame(frame); }
      if (!inView && raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0.3 });
  }

  /* ---------- portrait scan line ---------------------------- */

  function initPortrait() {
    var fig = document.querySelector('.portrait');
    var scanLine = fig && fig.querySelector('.portrait-scan');
    var img = fig && fig.querySelector('img');
    if (!scanLine || !img) return;
    var set = function () { scanLine.style.setProperty('--h', img.getBoundingClientRect().height + 'px'); };
    set();
    if ('ResizeObserver' in window) new ResizeObserver(set).observe(img);
  }

  /* ---------- phone action bar ------------------------------
     Appears once the first screen has scrolled away; steps aside
     when the closing contact block is on screen.
     -------------------------------------------------------- */

  function initMobileBar() {
    var bar = document.querySelector('.mobile-bar');
    if (!bar) return;
    var first = document.querySelector('.hero, .intro, .about-top');
    var closingBlock = document.getElementById('contact-links');
    var pastTop = false, nearEnd = false;
    var update = function () { bar.classList.toggle('is-shown', pastTop && !nearEnd); };
    if (first) watch(first, function (inView, el, e) {
      pastTop = !inView && (!e || e.boundingClientRect.top < 0);
      update();
    }, { threshold: 0 });
    if (closingBlock) watch(closingBlock, function (inView) { nearEnd = inView; update(); }, { threshold: 0 });
  }

  /* ---------- project filters ------------------------------- */

  function initFilters() {
    var buttons = $$('.filter-btn');
    if (!buttons.length) return;
    var cards = $$('.pcard[data-category]');
    var status = document.querySelector('[data-filter-status]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var k = 0, shown = 0;
        cards.forEach(function (card) {
          var cats = (card.getAttribute('data-category') || '').split(/\s+/);
          var match = cat === 'all' || cats.indexOf(cat) !== -1;
          card.hidden = !match;
          card.classList.remove('is-entering');
          if (match) {
            shown++;
            card.style.setProperty('--k', String(Math.min(k++, 10)));
            void card.offsetWidth;
            card.classList.add('is-entering');
          }
        });
        if (status) status.textContent = 'Showing ' + shown + ' project' + (shown === 1 ? '' : 's') + '.';
      });
    });
  }

  /* ---------- contact form ---------------------------------
     Client-side validation, then POST to the Google Apps Script
     endpoint. The script validates again, writes a row to the
     sheet, mails me, and auto-replies to the sender.
     -------------------------------------------------------- */

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var sentPanel = document.getElementById('sent-panel');
    var banner = document.getElementById('error-banner');
    var message = form.querySelector('#message');
    var counter = document.getElementById('counter');
    var tried = false;

    var fields = ['name', 'email', 'subject', 'message'].map(function (key) {
      return { key: key, input: form.querySelector('#' + key) };
    }).filter(function (f) { return f.input; });

    var FLAGS = {
      email: '— enter a valid address',
      message: '— at least 10 characters'
    };

    var errorsFor = function () {
      var v = {};
      fields.forEach(function (f) {
        var val = f.input.value.trim();
        if (f.key === 'email') v[f.key] = !EMAIL_RE.test(val);
        else if (f.key === 'message') v[f.key] = val.length < 10;
        else v[f.key] = val === '';
      });
      return v;
    };

    var paint = function () {
      var err = errorsFor();
      var count = 0;

      fields.forEach(function (f) {
        var bad = tried && err[f.key];
        var wrap = f.input.closest('.field');
        var flag = wrap && wrap.querySelector('.field-flag');
        if (wrap) wrap.classList.toggle('is-invalid', !!bad);
        f.input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (flag) flag.textContent = bad ? (FLAGS[f.key] || '— required') : '';
        if (err[f.key]) count++;
      });

      if (banner) {
        var show = tried && count > 0;
        banner.hidden = !show;
        if (show) {
          banner.textContent = 'error: ' + (count === 1
            ? '1 field needs attention ↓'
            : count + ' fields need attention ↓');
        }
      }
    };

    if (message && counter) {
      var limit = message.getAttribute('maxlength') || 600;
      var updateCount = function () {
        counter.textContent = message.value.length + ' / ' + limit;
      };
      message.addEventListener('input', updateCount);
      updateCount();
    }

    fields.forEach(function (f) {
      f.input.addEventListener('input', function () { if (tried) paint(); });
    });

    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBiGV9ihPpi-xZfgoWJGsZeHtCg9OP7rI-AnzbNQULdqwsHmZosEoCbt3kUk2IYMQXog/exec';
    var SEND_TIMEOUT_MS = 15000;

    /* FormData picks up every named input, so the honeypot and the hidden
       source field travel automatically. No id lookups to keep in sync. */
    function encodeForm() {
      var parts = [];
      new FormData(form).forEach(function (value, key) {
        parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value).trim()));
      });
      return parts.join('&');
    }

    function post(body, opaque) {
      var controller = window.AbortController ? new AbortController() : null;
      var timer = controller
        ? setTimeout(function () { controller.abort(); }, SEND_TIMEOUT_MS)
        : null;
      var clear = function () { if (timer) clearTimeout(timer); };

      var options = {
        method: 'POST',
        body: body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      };
      if (opaque) options.mode = 'no-cors';
      if (controller) options.signal = controller.signal;

      return fetch(SCRIPT_URL, options).then(
        function (response) { clear(); return response; },
        function (error) { clear(); throw error; }
      );
    }

    /* Last resort for browsers without fetch, and for the case where the
       browser blocks the CORS read. The server throttles repeat submissions
       from the same address, so a retry cannot duplicate the row. */
    function postLegacy(body, onDone, onFail) {
      try {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', SCRIPT_URL, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.timeout = SEND_TIMEOUT_MS;
        xhr.onload = function () {
          var ok = xhr.status >= 200 && xhr.status < 400;
          try { ok = JSON.parse(xhr.responseText).result === 'success'; } catch (err) {}
          if (ok) { onDone(); } else { onFail(); }
        };
        xhr.onerror = onFail;
        xhr.ontimeout = onFail;
        xhr.send(body);
      } catch (err) {
        onFail();
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var err = errorsFor();
      var bad = Object.keys(err).some(function (k) { return err[k]; });
      if (bad) {
        tried = true;
        paint();
        var first = fields.filter(function (f) { return err[f.key]; })[0];
        if (first) first.input.focus();
        return;
      }

      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
      }
      form.classList.add('is-sending');
      if (banner) banner.hidden = true;

      var showSent = function () {
        var nameInput = form.querySelector('#name');
        var firstName = nameInput ? nameInput.value.trim().split(/\s+/)[0] : '';
        /* Stamp in Lagos time regardless of where the visitor sits, since the
           label says wat. */
        var stamp;
        try {
          stamp = new Date().toLocaleTimeString('en-GB', {
            timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit'
          }) + ' wat';
        } catch (tzError) {
          stamp = new Date().toTimeString().slice(0, 5);
        }
        var nameSlot = document.getElementById('sent-name');
        var stampSlot = document.getElementById('sent-stamp');
        if (nameSlot) nameSlot.textContent = firstName;
        if (stampSlot) stampSlot.textContent = stamp;
        form.hidden = true;
        if (sentPanel) {
          sentPanel.hidden = false;
          var heading = sentPanel.querySelector('.sent-title');
          if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
        }
      };

      var showSendError = function (serverMessage) {
        form.classList.remove('is-sending');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
        }
        if (banner) {
          banner.hidden = false;
          banner.textContent = serverMessage
            ? 'error: ' + serverMessage
            : "couldn't send — email adelugbaadejare03@gmail.com directly ↗";
          banner.setAttribute('tabindex', '-1');
          if (banner.focus) banner.focus();
        }
      };

      var body = encodeForm();

      var fallback = function () {
        if (!window.fetch) {
          postLegacy(body, showSent, function () { showSendError(); });
          return;
        }
        post(body, true).then(showSent, function () { showSendError(); });
      };

      if (!window.fetch) { fallback(); return; }

      post(body, false)
        .then(function (response) { return response.json(); })
        .then(
          function (data) {
            if (data && data.result === 'success') {
              showSent();
            } else {
              showSendError(data && data.message);
            }
          },
          /* Rejection here means the network died, the request timed out, or
             the browser refused the cross-origin read. Retry opaquely rather
             than telling someone their message failed when it may have landed. */
          fallback
        );
    });

    var reset = document.getElementById('write-another');
    if (reset) {
      reset.addEventListener('click', function () {
        form.reset();
        tried = false;
        paint();
        if (counter && message) {
          counter.textContent = '0 / ' + (message.getAttribute('maxlength') || 600);
        }
        if (sentPanel) sentPanel.hidden = true;
        form.hidden = false;
        var nameField = form.querySelector('#name');
        if (nameField) nameField.focus();
      });
    }

    paint();
  }

  /* ---------- boot ---------- */

  function boot() {
    initStage();
    initPipes();
    initBars();
    initMeters();
    initCards();
    initFusion();
    initPortrait();
    initMobileBar();
    initFilters();
    initContactForm();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
