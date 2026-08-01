/* ============================================================
   terminal-editorial v5 — behaviour
   Ports reveal.js (initFlow) plus the DCLogic components from
   Home / About / Projects / Contact into plain browser JS.
   Classic script, so it also works over file://.
   ============================================================ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
  var reduced = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ---------- "flows into place" ----------------------------
     [data-flow="left|right|up"] elements glide 36–48px into
     final position when scrolled to, staggered 90ms via
     data-flow-i, 700ms (data-flow-dur overrides; hero uses 900).
     Each animates exactly once.
     -------------------------------------------------------- */

  var OFFSETS = {
    left:  'translateX(-48px)',
    right: 'translateX(48px)',
    up:    'translateY(36px)'
  };

  function initFlow(root) {
    root = root || document;
    if (reduced() || !('IntersectionObserver' in window)) return;

    var els = Array.prototype.slice.call(root.querySelectorAll('[data-flow]'));
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = OFFSETS[el.dataset.flow] || OFFSETS.up;
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var d = (parseInt(el.dataset.flowI, 10) || 0) * 90;
        var t = el.dataset.flowDur || '700';
        el.style.transition =
          'opacity ' + t + 'ms ' + EASE + ' ' + d + 'ms, ' +
          'transform ' + t + 'ms ' + EASE + ' ' + d + 'ms';
        requestAnimationFrame(function () {
          el.style.opacity = '1';
          el.style.transform = 'none';
        });
        el.addEventListener('transitionend', function () {
          el.style.transition = '';
        }, { once: true });
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

    var onScroll = function () {
      var p = Math.min(window.scrollY, 360) / 360;
      if (back) back.style.transform =
        'translate(' + (18 + p * 10) + 'px, ' + (18 + p * 10) + 'px)';
      if (mid) mid.style.transform =
        'translate(' + (9 + p * 5) + 'px, ' + (9 + p * 5) + 'px)';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
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

  /* ---------- boot ---------- */

  function boot() {
    initFlow(document);
    initHeroPlanes();
    initDisclosures();
    initContactForm();
    initCopy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
