/* ============================================================
   masthead v5 — behaviour
   Ports masthead/reveal.js (initReveals) plus the DCLogic
   components from Home / About / Projects / Contact.
   Classic script, so it also works over file://.
   ============================================================ */
(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var reduced = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  /* ---------- "falls into place" ----------------------------
     [data-reveal="N"] elements stay still until scrolled to,
     then land in reading order with an 85ms stagger.
     Each animates exactly once.
     -------------------------------------------------------- */

  function initReveals(root) {
    root = root || document;
    if (reduced() || !('IntersectionObserver' in window)) return;

    var els = Array.prototype.slice.call(root.querySelectorAll('[data-reveal]'));
    els.forEach(function (el) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
    });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var d = (parseInt(el.dataset.reveal, 10) || 0) * 85;
        var t = el.dataset.revealDur || '450';
        el.style.transition =
          'opacity ' + t + 'ms ' + EASE + ' ' + d + 'ms, ' +
          'transform ' + t + 'ms ' + EASE + ' ' + d + 'ms';
        requestAnimationFrame(function () {
          el.style.opacity = '1';
          el.style.transform = 'translateY(0)';
        });
        el.addEventListener('transitionend', function () {
          el.style.transition = '';
        }, { once: true });
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -48px 0px' });

    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- hero: layered ampersand drifts on scroll ------
     Extrusion slices separate over the first 320px of scroll.
     -------------------------------------------------------- */

  function initAmpParallax() {
    var back = document.querySelector('.amp-back');
    var mid = document.querySelector('.amp-mid');
    if ((!back && !mid) || reduced()) return;

    var onScroll = function () {
      var p = Math.min(window.scrollY, 320) / 320;
      if (back) back.style.transform =
        'translate(' + (0.07 + p * 0.06) + 'em, ' + (0.07 + p * 0.06) + 'em)';
      if (mid) mid.style.transform =
        'translate(' + (0.035 + p * 0.03) + 'em, ' + (0.035 + p * 0.03) + 'em)';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- disclosures ---------------------------------- */

  function initDisclosures() {
    var groups = document.querySelectorAll('[data-disclosure-group]');

    Array.prototype.forEach.call(groups, function (group) {
      var items = group.querySelectorAll('[data-disclosure]');
      var openLabel = group.dataset.labelOpen || '− CLOSE';
      var shutLabel = group.dataset.labelShut || '+ DETAILS';

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
     anything. Wire the submit handler to a real endpoint to
     actually deliver mail.
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
      email: '— ENTER A VALID ADDRESS',
      message: '— AT LEAST 10 CHARACTERS'
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
        if (flag) flag.textContent = bad ? (FLAGS[f.key] || '— REQUIRED') : '';
        if (err[f.key]) count++;
      });

      if (banner) {
        var show = tried && count > 0;
        banner.hidden = !show;
        if (show) {
          banner.textContent = count === 1
            ? '1 FIELD NEEDS ATTENTION ↓'
            : count + ' FIELDS NEED ATTENTION ↓';
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

      var nameInput = form.querySelector('#name');
      var firstName = nameInput ? nameInput.value.trim().split(/\s+/)[0] : '';
      var stamp = new Date().toTimeString().slice(0, 5) + ' WAT';

      var nameSlot = document.getElementById('sent-name');
      var stampSlot = document.getElementById('sent-stamp');
      if (nameSlot) nameSlot.textContent = firstName + '.';
      if (stampSlot) stampSlot.textContent = stamp;

      form.hidden = true;
      if (sentPanel) {
        sentPanel.hidden = false;
        var heading = sentPanel.querySelector('.sent-title');
        if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus(); }
      }
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
          btn.textContent = 'COPIED ✓';
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
    initReveals(document);
    initAmpParallax();
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
