/* ============================================================
   terminal-editorial v5 — behaviour
   Ports reveal.js (initFlow) plus the DCLogic components from
   Home / About / Projects / Contact into plain browser JS.
   Classic script, so it also works over file://.
   ============================================================ */
(function () {
  'use strict';

  var reduced = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* Motion timings live in site.css :root so the token sheet stays
     the single source of truth. Read once at boot. */
  var TOKENS = (function () {
    var cs = getComputedStyle(document.documentElement);
    var ms = function (name, fallback) {
      var v = parseFloat(cs.getPropertyValue(name));
      return isFinite(v) ? v : fallback;
    };
    return {
      flow: ms('--t-flow', 1100),
      hero: ms('--t-hero', 1500),
      stagger: ms('--stagger', 120),
      flowRM: ms('--t-flow-rm', 520),
      staggerRM: ms('--stagger-rm', 70)
    };
  })();

  /* ---------- "flows into place" ----------------------------
     [data-flow="left|right|up"] elements ease 44–56px into final
     position when scrolled to, staggered in reading order via
     data-flow-i (--stagger apart), over --t-flow (data-flow-dur
     overrides; the hero runs longer). Each animates exactly once.

     Under reduced motion they still fade in, in the same order —
     just without the travel. See the reduced-motion block in
     site.css for why that split is safe.
     -------------------------------------------------------- */

  var OFFSETS = {
    left:  'translateX(-56px)',
    right: 'translateX(56px)',
    up:    'translateY(44px)'
  };

  function initFlow(root) {
    root = root || document;
    if (!('IntersectionObserver' in window)) return; /* bail before hiding */

    var soft = reduced();
    var els = Array.prototype.slice.call(root.querySelectorAll('[data-flow]'));

    els.forEach(function (el) {
      el.style.opacity = '0';
      if (!soft) el.style.transform = OFFSETS[el.dataset.flow] || OFFSETS.up;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);

        var i = parseInt(el.dataset.flowI, 10) || 0;
        var delay = i * (soft ? TOKENS.staggerRM : TOKENS.stagger);
        /* data-flow-dur="hero" defers to --t-hero rather than
           restating it in markup; a number still wins if given */
        var dur = soft
          ? TOKENS.flowRM
          : (el.dataset.flowDur === 'hero'
              ? TOKENS.hero
              : (parseFloat(el.dataset.flowDur) || TOKENS.flow));

        el.style.setProperty('--flow-dur', dur + 'ms');
        el.style.setProperty('--flow-delay', delay + 'ms');
        el.classList.add('flow-armed');

        requestAnimationFrame(function () {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });

        /* transitionend bubbles: a child's hover or bar-fill
           transition finishing mid-reveal would otherwise strip the
           parent's transition and snap it to its end state. */
        el.addEventListener('transitionend', function done(e) {
          if (e.target !== el) return;
          el.classList.remove('flow-armed');
          el.style.removeProperty('--flow-dur');
          el.style.removeProperty('--flow-delay');
          el.removeEventListener('transitionend', done);
        });
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: offset planes drift on scroll ----------
     Planes drift +10/+5px over the first 360px of scroll.
     Static under reduced motion; cursor blink switched off.
     -------------------------------------------------------- */

  function initHeroPlanes() {
    var back = document.querySelector('[data-plane="back"]');
    var mid = document.querySelector('[data-plane="mid"]');
    var cursor = document.querySelector('.cursor');
    if (!back && !mid) return;

    if (reduced()) {
      if (cursor) cursor.style.animation = 'none';
      return;
    }

    /* Latch scroll events to one rAF-aligned write per frame. */
    var ticking = false;
    var apply = function () {
      ticking = false;
      var p = Math.min(window.scrollY, 360) / 360;
      if (back) back.style.transform =
        'translate(' + (18 + p * 10) + 'px, ' + (18 + p * 10) + 'px)';
      if (mid) mid.style.transform =
        'translate(' + (9 + p * 5) + 'px, ' + (9 + p * 5) + 'px)';
    };
    var onScroll = function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(apply);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    apply();
  }

  /* ---------- masthead condenses on scroll ------------------
     A 72px sentinel at the top of the page drives an
     IntersectionObserver: once it leaves the viewport the
     sticky masthead gets .is-condensed (tighter padding,
     smaller wordmark). No scroll math. The reduced-motion CSS
     block makes the toggle instant, so no reduced() bail here —
     condensing is a functional state, not decoration.
     -------------------------------------------------------- */

  function initMasthead() {
    var head = document.querySelector('.masthead');
    if (!head || !('IntersectionObserver' in window)) return;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText =
      'position:absolute;top:0;left:0;width:1px;height:72px;pointer-events:none;';
    document.body.prepend(sentinel);
    new IntersectionObserver(function (entries) {
      head.classList.toggle('is-condensed', !entries[0].isIntersecting);
    }).observe(sentinel);
  }

  /* ---------- disclosures ----------------------------------
     One open at a time within a group; clicking the open one
     closes it. Matches the DCLogic `state.open` behaviour.
     -------------------------------------------------------- */

  function initDisclosures() {
    var groups = document.querySelectorAll('[data-disclosure-group]');

    Array.prototype.forEach.call(groups, function (group) {
      var items = group.querySelectorAll('[data-disclosure]');
      var openLabel = group.dataset.labelOpen || '[-] close';
      var shutLabel = group.dataset.labelShut || '[+] details';

      var paint = function () {
        Array.prototype.forEach.call(items, function (item) {
          var btn = item.querySelector('[data-disclosure-btn]');
          var toggle = item.querySelector('.disclosure-toggle, .deadend-toggle');
          var open = item.classList.contains('is-open');
          if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
          if (toggle) toggle.textContent = open ? openLabel : shutLabel;
        });
      };

      Array.prototype.forEach.call(items, function (item) {
        var btn = item.querySelector('[data-disclosure-btn]');
        if (!btn) return;
        btn.addEventListener('click', function () {
          var wasOpen = item.classList.contains('is-open');
          Array.prototype.forEach.call(items, function (other) {
            other.classList.remove('is-open');
          });
          if (!wasOpen) item.classList.add('is-open');
          paint();
        });
      });

      paint();
    });
  }

  /* ---------- contact form ---------------------------------
     Client-side validation only — this is a static build, so
     submitting shows the confirmation panel without sending
     anything. Wire `onValid` to a real endpoint to send mail.
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
      var updateCount = function () {
        counter.textContent = message.value.length + ' / 600';
      };
      message.addEventListener('input', updateCount);
      updateCount();
    }

    fields.forEach(function (f) {
      f.input.addEventListener('input', function () { if (tried) paint(); });
    });

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

      /* Loading state — disable submit and reflect progress. */
      var submitBtn = form.querySelector('button[type="submit"]');
      var btnLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'sending…';
      }
      if (banner) banner.hidden = true;

      /* Deliver to the Google Apps Script endpoint. no-cors gives an opaque
         response, so fetch resolves on any server reply and rejects only on a
         real network failure (offline) — enough to drive success vs. error. */
      var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBiGV9ihPpi-xZfgoWJGsZeHtCg9OP7rI-AnzbNQULdqwsHmZosEoCbt3kUk2IYMQXog/exec';
      var payload = new URLSearchParams();
      ['name', 'email', 'subject', 'message'].forEach(function (k) {
        var el = form.querySelector('#' + k);
        payload.append(k, el ? el.value.trim() : '');
      });

      var showSent = function () {
        var nameInput = form.querySelector('#name');
        var firstName = nameInput ? nameInput.value.trim().split(/\s+/)[0] : '';
        var stamp = new Date().toTimeString().slice(0, 5) + ' wat';
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

      var showSendError = function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = btnLabel;
        }
        if (banner) {
          banner.hidden = false;
          banner.textContent = "couldn't send — email adelugbaadejare03@gmail.com directly ↗";
          banner.focus && banner.setAttribute('tabindex', '-1');
          if (banner.focus) banner.focus();
        }
      };

      if (!window.fetch) { showSent(); return; }
      fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString()
      }).then(showSent, showSendError);
    });

    var reset = document.getElementById('write-another');
    if (reset) {
      reset.addEventListener('click', function () {
        form.reset();
        tried = false;
        paint();
        if (counter) counter.textContent = '0 / 600';
        if (sentPanel) sentPanel.hidden = true;
        form.hidden = false;
        var nameField = form.querySelector('#name');
        if (nameField) nameField.focus();
      });
    }

    paint();
  }

  /* ---------- copy-to-clipboard ---------------------------- */

  function initCopy() {
    var btns = document.querySelectorAll('[data-copy]');
    Array.prototype.forEach.call(btns, function (btn) {
      var idle = btn.textContent;
      var timer;
      btn.addEventListener('click', function () {
        var value = btn.dataset.copy;
        var done = function () {
          btn.textContent = 'copied ✓';
          btn.classList.add('is-copied');
          clearTimeout(timer);
          timer = setTimeout(function () {
            btn.textContent = idle;
            btn.classList.remove('is-copied');
          }, 1800);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(value).then(done, done);
        } else {
          done();
        }
      });
    });
  }

  /* ---------- top progress loader -------------------------
     A thin accent bar at the top. Fills briefly on page load,
     and creeps while an internal navigation is in flight so
     multi-page moves get feedback. Skipped under reduced motion.
     -------------------------------------------------------- */

  function initTopLoader() {
    if (reduced()) return;
    var bar = document.createElement('div');
    bar.className = 'top-loader';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);
    var to;
    var start = function () {
      clearTimeout(to);
      bar.classList.add('is-active');
      bar.style.width = '0%';
      void bar.offsetWidth; /* commit 0% so the creep has a start state */
      requestAnimationFrame(function () { bar.style.width = '85%'; });
    };
    var finish = function () {
      bar.style.width = '100%';
      clearTimeout(to);
      to = setTimeout(function () {
        bar.classList.remove('is-active');
        bar.style.width = '0%';
      }, 350);
    };
    /* page just rendered */
    start();
    setTimeout(finish, 240);
    /* internal navigation starting */
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; /* same page / anchor */
      start();
    }, true);
  }

  /* ---------- page veil ------------------------------------
     The veil markup is static in each page, so it covers from the
     first paint and lifts on a CSS animation — it clears itself
     even with JS off. This adds the other half: on internal
     navigation the veil re-covers with the destination's label, so
     the exit and the next page's intro read as one movement.
     Under reduced motion the veil still greets on arrival (as a
     cross-fade, see site.css) but navigation is left alone — no
     interception, so those visitors never wait on an exit animation.
     -------------------------------------------------------- */

  var ROUTES = {
    'index.html':    '$ cd ~/',
    '':              '$ cd ~/',
    'about.html':    '$ cd ~/about',
    'projects.html': '$ cd ~/projects',
    'contact.html':  '$ cd ~/contact',
    'tokens.html':   '$ cat tokens.spec',
    '404.html':      '$ cd ~/404'
  };

  function initVeil() {
    var veil = document.querySelector('.veil');
    if (!veil) return;

    var lift = function () { veil.classList.add('is-lifted'); };

    var clear = function () {
      veil.classList.remove('is-leaving');
      veil.style.opacity = '';
      veil.style.visibility = '';
      veil.style.transition = '';
      lift();
    };

    /* The CSS animation clears the veil on its own (so it works with
       JS off), but a throttled or unsupported animation would leave
       the page covered. Force it open either way. */
    veil.addEventListener('animationend', function (e) {
      if (e.target === veil) lift();
    });
    setTimeout(lift, 1600);

    /* restoring from bfcache would otherwise show the covered state */
    window.addEventListener('pageshow', function (e) { if (e.persisted) clear(); });

    /* arrival veil only: intercepting would add an exit delay these
       visitors did not ask for */
    if (reduced()) return;

    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;

      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; /* same page / anchor */

      e.preventDefault();
      var file = url.pathname.split('/').pop();
      var label = veil.querySelector('.veil-cmd');
      if (label && ROUTES[file]) label.textContent = ROUTES[file];

      veil.classList.remove('is-lifted');
      veil.classList.add('is-leaving');
      veil.style.visibility = 'visible';
      veil.style.opacity = '0';
      void veil.offsetWidth;
      veil.style.opacity = '1';
      setTimeout(function () { location.href = url.href; }, 300);
    });
  }

  /* ---------- animated benchmark bars ---------------------
     .bar-fill grows from 0 to its inline target width when
     scrolled into view. Static (at target) under reduced motion.
     -------------------------------------------------------- */

  function initBars() {
    var fills = Array.prototype.slice.call(document.querySelectorAll('.bar-fill'));
    if (!fills.length) return;
    fills.forEach(function (f) { f.dataset.w = f.style.width || ''; });
    if (reduced() || !('IntersectionObserver' in window)) return;
    fills.forEach(function (f) { if (f.dataset.w) f.style.width = '0%'; });
    var restore = function (f) { if (f.dataset.w) f.style.width = f.dataset.w; };
    var ioAlive = false;
    var io = new IntersectionObserver(function (entries) {
      ioAlive = true;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        var f = en.target;
        requestAnimationFrame(function () { restore(f); });
      });
    }, { threshold: 0.3 });
    fills.forEach(function (f) { io.observe(f); });
    /* Safety net for an observer that never fires at all. It must not
       run on a blind timer: below-fold bars would be filled in while
       off-screen and the grow would never be seen. A live observer
       always delivers an initial batch, so this proves it. */
    setTimeout(function () { if (!ioAlive) fills.forEach(restore); }, 2500);
  }

  /* ---------- count-up numbers ----------------------------
     Animates the numeric part of .metric-num and .bar-val on
     scroll-in, preserving surrounding markup (e.g. the % sup).
     -------------------------------------------------------- */

  function makeCounter(node) {
    var raw = node.nodeType === 3 ? node.nodeValue : node.textContent;
    var m = raw.match(/(\d[\d,]*(?:\.\d+)?)/);
    if (!m) return null;
    var numStr = m[1];
    var target = parseFloat(numStr.replace(/,/g, ''));
    if (!isFinite(target)) return null;
    var decimals = (numStr.split('.')[1] || '').length;
    var pre = raw.slice(0, m.index);
    var post = raw.slice(m.index + numStr.length);
    var write = function (v) {
      var s = pre + Number(v).toFixed(decimals) + post;
      if (node.nodeType === 3) node.nodeValue = s; else node.textContent = s;
    };
    write(0);
    var ran = false;
    return {
      start: function () {
        if (ran) return; ran = true;
        var t0 = null, dur = 1100;
        (function frame(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / dur, 1);
          write(target * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(frame); else write(target);
        })(performance.now());
      },
      /* direct write of the final value — never depends on rAF firing */
      done: function () { ran = true; write(target); }
    };
  }

  function initCounters() {
    if (reduced() || !('IntersectionObserver' in window)) return;
    var items = [];
    var add = function (owner, node) {
      var c = makeCounter(node);
      if (c) items.push({ owner: owner, ctl: c });
    };
    Array.prototype.forEach.call(document.querySelectorAll('.bar-val'), function (el) {
      add(el, el.firstChild && el.firstChild.nodeType === 3 ? el.firstChild : el);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.metric-num'), function (el) {
      if (el.firstChild && el.firstChild.nodeType === 3) add(el, el.firstChild);
    });
    if (!items.length) return;
    var ioAlive = false;
    var io = new IntersectionObserver(function (entries) {
      ioAlive = true;
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        items.forEach(function (it) { if (it.owner === en.target) it.ctl.start(); });
      });
    }, { threshold: 0.4 });
    items.forEach(function (it) { io.observe(it.owner); });
    /* same reasoning as initBars: only fire if the observer is dead,
       otherwise below-fold counters finish before they're ever seen */
    setTimeout(function () {
      if (!ioAlive) items.forEach(function (it) { it.ctl.done(); });
    }, 2600);
  }

  /* ---------- image fade-in on load ----------------------- */

  function initImgReveal() {
    if (reduced()) return;
    var imgs = document.querySelectorAll('.portrait-frame img');
    Array.prototype.forEach.call(imgs, function (img) {
      img.classList.add('reveal-img');
      var show = function () { img.classList.add('is-loaded'); };
      /* cached image: commit the hidden frame first, or both classes
         land in one style flush and the fade never runs */
      if (img.complete && img.naturalWidth) { void img.offsetWidth; show(); }
      else {
        img.addEventListener('load', show);
        img.addEventListener('error', show);
        setTimeout(show, 3000); /* never leave it hidden */
      }
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    initVeil();
    initTopLoader();
    initFlow(document);
    initHeroPlanes();
    initMasthead();
    initDisclosures();
    initContactForm();
    initCopy();
    initBars();
    initCounters();
    initImgReveal();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
