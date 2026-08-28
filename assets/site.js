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

  /* Going back is the most common move on a four-page site, and it
     should not replay a first arrival: the visitor has read this page.
     Used by initVeil (shorter hold, "cd -" label) and initFlow (content
     already on screen is resolved rather than re-animated). */
  var isReturn = (function () {
    try {
      var nav = performance.getEntriesByType('navigation')[0];
      if (nav) return nav.type === 'back_forward';
      return !!(performance.navigation && performance.navigation.type === 2);
    } catch (e) { return false; }
  })();

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

  /* How long until the arrival veil starts dissolving. The veil holds
     opaque for --t-veil, and an above-the-fold reveal fires ~2 frames
     after DOMContentLoaded — so without this the entire hero assembly
     plays out behind an opaque screen and the visitor arrives at an
     already-built page. Reveals are pushed to the moment the cover
     begins to fade, so the two read as one cross-dissolve. Returns 0
     for scroll reveals, veil-less pages, and browsers without
     getAnimations — all of which keep today's behaviour. */
  function veilRemaining() {
    var v = document.querySelector('.veil');
    if (!v || v.classList.contains('is-lifted') || !v.getAnimations) return 0;
    var a = v.getAnimations()[0];
    if (!a || !a.effect) return 0;
    /* the opaque hold is the animation-delay (--t-veil), so this is
       exact — no constant here to fall out of step with the CSS */
    var hold = a.effect.getComputedTiming().delay || 0;
    return Math.max(0, hold - (a.currentTime || 0));
  }

  function initFlow(root) {
    root = root || document;
    if (!('IntersectionObserver' in window)) return; /* bail before hiding */

    var soft = reduced();
    var all = Array.prototype.slice.call(root.querySelectorAll('[data-flow]'));

    /* Below the 2-up breakpoint every paired grid (.hero, .about-hero,
       .contact-grid, .cta) collapses to one column, so side travel stops
       encoding column position — and +56px of right travel would hold the
       document wider than the viewport while armed. Stacked flows up. */
    var stacked = window.matchMedia('(max-width: 767px)').matches;

    /* On a back/forward, anything at or above the restored viewport has
       already been read — leave it alone entirely: never hidden, never
       observed, never re-animated. This also fixes a real bug, since
       elements ABOVE the restored scroll position never intersect and
       would otherwise sit hidden forever, then assemble themselves again
       when the visitor scrolled back up. Content genuinely below the fold
       still reveals normally, so reading onward keeps its choreography. */
    var els = isReturn
      ? all.filter(function (el) {
          return el.getBoundingClientRect().top >= window.innerHeight;
        })
      : all;

    els.forEach(function (el) {
      el.style.opacity = '0';
      if (!soft) el.style.transform =
        (stacked ? OFFSETS.up : OFFSETS[el.dataset.flow]) || OFFSETS.up;
    });

    var io = new IntersectionObserver(function (entries) {
      var step = soft ? TOKENS.staggerRM : TOKENS.stagger;
      var hold = veilRemaining();

      /* The stagger describes elements that ARRIVE TOGETHER, so the offset
         is this element's rank among the data-flow-i values in the current
         batch, not its raw authored index. A whole grid landing at once
         still cascades 0,1,2…; a lone late arrival starts immediately
         instead of sitting blank for most of a second. Distinct indices
         are ranked rather than entries, so authored ties (the code figure
         shares i=2 with the role line) keep firing on the same beat. */
      var rank = [];
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var n = parseInt(en.target.dataset.flowI, 10) || 0;
        if (rank.indexOf(n) === -1) rank.push(n);
      });
      rank.sort(function (a, b) { return a - b; });

      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);

        var i = parseInt(el.dataset.flowI, 10) || 0;
        var delay = hold + rank.indexOf(i) * step;
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

        /* Remove the inline start values rather than overwriting them
           with their defaults. An inline `transform: none` outranks any
           author rule, so leaving one behind would permanently disable
           the :hover lift on every card, panel, job, mini and banner. */
        requestAnimationFrame(function () {
          el.style.removeProperty('opacity');
          el.style.removeProperty('transform');
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
      /* a batch can hold several snapshots of the same sentinel when
         frames coalesce; the last one is the current state */
      head.classList.toggle(
        'is-condensed',
        !entries[entries.length - 1].isIntersecting
      );
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
      var btnLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.setAttribute('aria-busy', 'true');
        submitBtn.textContent = 'sending…';
      }
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
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.removeAttribute('aria-busy');
          submitBtn.textContent = btnLabel;
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
    var to, guard;
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
      /* a modified click opens a tab and leaves this document in place —
         creeping the bar for a navigation that isn't happening here */
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
      var url;
      try { url = new URL(a.href, location.href); } catch (err) { return; }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) return; /* same page / anchor */
      start();
      /* same reasoning as the veil's watchdog: never leave the bar
         pinned at 85% if the navigation never commits */
      clearTimeout(guard);
      guard = setTimeout(finish, 3000);
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

    /* A return is the fastest transition on the site: shorter hold, and
       the shell's own idiom for "the directory I came from". Stamped
       before initFlow runs, so veilRemaining() reads the shortened hold. */
    if (isReturn) {
      veil.dataset.nav = 'return';
      var cmd = veil.querySelector('.veil-cmd');
      if (cmd) cmd.textContent = '$ cd -';
    }

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
      setTimeout(function () {
        location.href = url.href;
        /* The navigation may never commit — the load is stopped, the
           request stalls, or the response downloads instead of replacing
           the document. This page would then sit sealed under an opaque,
           click-blocking cover with no way out but a reload. On a normal
           navigation the document is torn down and this timer dies with
           it, so it is unobservable in the healthy case. */
        setTimeout(clear, 6000);
      }, 300);
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

  /* ---------- scroll progress ----------------------------- */

  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress-bar';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var update = function () {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      var p = h > 0 ? (window.scrollY / h) * 100 : 0;
      bar.style.width = Math.min(100, Math.max(0, p)) + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /* ---------- command palette (`ctrl + k`) ---------------- */

  function initCommandPalette() {
    var itemsData = [
      { title: 'Home', tag: 'page', url: 'index.html' },
      { title: 'Case Studies / Selected Work', tag: 'section', url: 'index.html#work' },
      { title: 'Projects Showcase', tag: 'page', url: 'projects.html' },
      { title: 'About & Background', tag: 'page', url: 'about.html' },
      { title: 'Experience & Timeline', tag: 'section', url: 'about.html#experience' },
      { title: 'Capabilities & Tech Stack', tag: 'section', url: 'index.html#capabilities' },
      { title: 'Contact / Reach Out', tag: 'page', url: 'contact.html' },
      { title: 'GitHub Profile (Adejare-ml)', tag: 'external', url: 'https://github.com/Adejare-ml', external: true },
      { title: 'Download CV (PDF)', tag: 'download', url: 'Adejare_Adelugba_Machine%20learning_engineer.pdf', download: true }
    ];

    var backdrop = document.createElement('div');
    backdrop.className = 'cmd-palette-backdrop';
    backdrop.id = 'cmd-palette';
    backdrop.setAttribute('aria-hidden', 'true');

    backdrop.innerHTML =
      '<div class="cmd-palette-dialog" role="dialog" aria-modal="true" aria-label="Command Palette">' +
        '<div class="cmd-palette-header">' +
          '<span class="cmd-palette-search-icon">⌘/ctrl+k</span>' +
          '<input type="text" class="cmd-palette-input" placeholder="Search pages, projects, actions..." aria-label="Search portfolio">' +
          '<span class="cmd-palette-esc">ESC</span>' +
        '</div>' +
        '<div class="cmd-palette-list" role="listbox"></div>' +
      '</div>';

    document.body.appendChild(backdrop);

    var input = backdrop.querySelector('.cmd-palette-input');
    var list = backdrop.querySelector('.cmd-palette-list');
    var selectedIndex = 0;
    var currentItems = itemsData.slice();

    var renderList = function () {
      list.innerHTML = '';
      if (!currentItems.length) {
        list.innerHTML = '<div style="padding:14px 18px; color:var(--muted); font-family:var(--mono); font-size:12px;">No matching results</div>';
        return;
      }
      currentItems.forEach(function (it, idx) {
        var el = document.createElement('div');
        el.className = 'cmd-palette-item' + (idx === selectedIndex ? ' is-selected' : '');
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', idx === selectedIndex ? 'true' : 'false');
        el.innerHTML =
          '<span>' + it.title + '</span>' +
          '<span class="cmd-palette-item-tag">// ' + it.tag + '</span>';

        el.addEventListener('click', function () {
          execItem(it);
        });
        list.appendChild(el);
      });
    };

    var execItem = function (it) {
      closePalette();
      if (it.external) {
        window.open(it.url, '_blank', 'noopener');
      } else if (it.download) {
        var a = document.createElement('a');
        a.href = it.url;
        a.download = '';
        a.click();
      } else {
        location.href = it.url;
      }
    };

    var openPalette = function () {
      backdrop.classList.add('is-open');
      backdrop.setAttribute('aria-hidden', 'false');
      input.value = '';
      currentItems = itemsData.slice();
      selectedIndex = 0;
      renderList();
      setTimeout(function () { input.focus(); }, 50);
    };

    var closePalette = function () {
      backdrop.classList.remove('is-open');
      backdrop.setAttribute('aria-hidden', 'true');
      input.blur();
    };

    input.addEventListener('input', function () {
      var q = input.value.trim().toLowerCase();
      if (!q) {
        currentItems = itemsData.slice();
      } else {
        currentItems = itemsData.filter(function (it) {
          return it.title.toLowerCase().indexOf(q) !== -1 || it.tag.toLowerCase().indexOf(q) !== -1;
        });
      }
      selectedIndex = 0;
      renderList();
    });

    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) closePalette();
    });

    document.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (backdrop.classList.contains('is-open')) closePalette(); else openPalette();
        return;
      }
      if (!backdrop.classList.contains('is-open')) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closePalette();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentItems.length) {
          selectedIndex = (selectedIndex + 1) % currentItems.length;
          renderList();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentItems.length) {
          selectedIndex = (selectedIndex - 1 + currentItems.length) % currentItems.length;
          renderList();
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentItems[selectedIndex]) {
          execItem(currentItems[selectedIndex]);
        }
      }
    });
  }

  /* ---------- custom cursor ------------------------------- */

  function initCustomCursor() {
    if (reduced() || window.matchMedia('(pointer: coarse)').matches) return;

    var cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.innerHTML = '<span class="custom-cursor-badge"></span>';
    document.body.appendChild(cursor);
    document.body.classList.add('cursor-active');

    var badge = cursor.querySelector('.custom-cursor-badge');
    var mouseX = -100, mouseY = -100;
    var posX = -100, posY = -100;

    window.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    var render = function () {
      posX += (mouseX - posX) * 0.25;
      posY += (mouseY - posY) * 0.25;
      cursor.style.transform = 'translate(' + posX + 'px, ' + posY + 'px) translate(-50%, -50%)';
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);

    document.addEventListener('pointerover', function (e) {
      var target = e.target && e.target.closest ? e.target.closest('a, button, .card, .viz-node, .pipeline-card, [data-cursor-badge]') : null;
      if (target) {
        cursor.classList.add('is-hovering');
        var customText = target.dataset.cursorBadge;
        if (customText) {
          badge.textContent = customText;
        } else if (target.closest('.card') || target.closest('.pipeline-card')) {
          badge.textContent = 'VIEW';
        } else {
          badge.textContent = '→';
        }
      }
    });

    document.addEventListener('pointerout', function (e) {
      var target = e.target && e.target.closest ? e.target.closest('a, button, .card, .viz-node, .pipeline-card, [data-cursor-badge]') : null;
      if (target) {
        cursor.classList.remove('is-hovering');
        badge.textContent = '';
      }
    });
  }

  /* ---------- magnetic buttons ---------------------------- */

  function initMagneticButtons() {
    if (reduced() || window.matchMedia('(pointer: coarse)').matches) return;

    var btns = document.querySelectorAll('.btn-primary, .btn-ghost, [data-magnetic]');
    Array.prototype.forEach.call(btns, function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var cx = rect.left + rect.width / 2;
        var cy = rect.top + rect.height / 2;
        var dx = (e.clientX - cx) * 0.2;
        var dy = (e.clientY - cy) * 0.2;
        btn.style.transform = 'translate(' + Math.max(-6, Math.min(6, dx)) + 'px, ' + Math.max(-6, Math.min(6, dy)) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = 'none';
      });
    });
  }

  /* ---------- project filters ----------------------------- */

  function initProjectFilters() {
    var filters = document.querySelectorAll('.filter-btn');
    if (!filters.length) return;

    Array.prototype.forEach.call(filters, function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.dataset.filter;
        Array.prototype.forEach.call(filters, function (f) { f.classList.remove('is-active'); f.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-pressed', 'true');

        var items = document.querySelectorAll('[data-category]');
        Array.prototype.forEach.call(items, function (item) {
          var itemCats = (item.dataset.category || '').split(/\s+/);
          if (cat === 'all' || itemCats.indexOf(cat) !== -1) {
            item.style.display = '';
            item.style.opacity = '1';
          } else {
            item.style.opacity = '0';
            item.style.display = 'none';
          }
        });
      });
    });
  }

  /* ---------- boot ---------- */

  function boot() {
    initVeil();
    initTopLoader();
    initScrollProgress();
    initFlow(document);
    initHeroPlanes();
    initMasthead();
    initDisclosures();
    initContactForm();
    initCopy();
    initBars();
    initCounters();
    initImgReveal();
    initCommandPalette();
    initCustomCursor();
    initMagneticButtons();
    initProjectFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();

