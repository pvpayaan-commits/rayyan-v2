/* =========================================================
   Rayyan — Portfolio v2
   Vanilla JS, no dependencies. Every feature is optional:
   if its markup is missing the script simply skips it.
   ========================================================= */
(function () {
  'use strict';

  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  /* ---------- 1. Header state + scroll progress ---------- */
  var header = qs('#siteHeader');
  var progress = qs('#scrollProgress');
  var backToTop = qs('#backToTop');
  var stickyWa = qs('#stickyWa');
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY || window.pageYOffset;
    var max = document.documentElement.scrollHeight - window.innerHeight;

    if (header) header.classList.toggle('is-scrolled', y > 12);
    if (backToTop) backToTop.classList.toggle('is-visible', y > 480);
    if (stickyWa) stickyWa.classList.toggle('is-visible', y > 520);
    if (progress && max > 0) progress.style.width = (y / max) * 100 + '%';

    ticking = false;
  }

  function requestScrollUpdate() {
    if (!ticking) {
      ticking = true;
      window.requestAnimationFrame(onScrollFrame);
    }
  }

  window.addEventListener('scroll', requestScrollUpdate, { passive: true });
  window.addEventListener('resize', requestScrollUpdate, { passive: true });
  onScrollFrame();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ---------- 2. Mobile navigation ---------- */
  var nav = qs('#nav');
  var hamburger = qs('#hamburger');
  var scrim = qs('#navScrim');

  function setNav(open) {
    if (!nav) return;
    nav.classList.toggle('is-open', open);
    document.body.classList.toggle('nav-open', open);
    if (hamburger) hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (scrim) {
      if (open) {
        scrim.hidden = false;
        window.requestAnimationFrame(function () { scrim.classList.add('is-open'); });
      } else {
        scrim.classList.remove('is-open');
        window.setTimeout(function () { scrim.hidden = true; }, 320);
      }
    }
  }

  if (hamburger) {
    hamburger.addEventListener('click', function () {
      setNav(hamburger.getAttribute('aria-expanded') !== 'true');
    });
  }
  if (scrim) scrim.addEventListener('click', function () { setNav(false); });

  qsa('.nav-link').forEach(function (link) {
    link.addEventListener('click', function () { setNav(false); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav && nav.classList.contains('is-open')) {
      setNav(false);
      if (hamburger) hamburger.focus();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 860 && nav && nav.classList.contains('is-open')) setNav(false);
  });

  /* ---------- 3. Active nav link (scroll spy) ---------- */
  var navLinks = qsa('.nav-link');
  var spyTargets = qsa('section[id]');

  if (navLinks.length && spyTargets.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navLinks.forEach(function (link) {
          link.classList.toggle('is-active', link.getAttribute('href') === '#' + id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    spyTargets.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- 4. Reveal on scroll ---------- */
  var revealables = qsa('.reveal');
  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var revealer = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var siblings = Array.prototype.indexOf.call(el.parentNode.children, el);
          el.style.transitionDelay = Math.min(siblings, 5) * 70 + 'ms';
          el.classList.add('is-in');
          obs.unobserve(el);
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      revealables.forEach(function (el) { revealer.observe(el); });
    }
  }

  /* ---------- 5. Animated counters ---------- */
  var counters = qsa('.stat-num[data-target]');
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-target')) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) { el.textContent = target + suffix; return; }
    var duration = 1500;
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!('IntersectionObserver' in window)) {
      counters.forEach(runCounter);
    } else {
      var counterObs = new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          obs.unobserve(entry.target);
        });
      }, { threshold: 0.5 });
      counters.forEach(function (c) { counterObs.observe(c); });
    }
  }

  /* ---------- 6. Typing effect ---------- */
  var typedEl = qs('#typedText');
  var phrases = [
    'Professional websites for businesses worldwide',
    'Clean designs that load fast on every device',
    'From school sites to restaurant pages',
    'Affordable pricing, premium quality',
    'WhatsApp support from start to finish'
  ];

  if (typedEl) {
    if (reduceMotion) {
      typedEl.textContent = phrases[0];
    } else {
      var pIdx = 0, cIdx = 0, deleting = false;
      (function type() {
        var word = phrases[pIdx];
        typedEl.textContent = deleting ? word.slice(0, --cIdx) : word.slice(0, ++cIdx);
        var delay = deleting ? 28 : 52;
        if (!deleting && cIdx === word.length) { deleting = true; delay = 2100; }
        else if (deleting && cIdx === 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; delay = 380; }
        window.setTimeout(type, delay);
      })();
    }
  }

  /* ---------- 7. Testimonial slider ---------- */
  var slider = qs('#tSlider');
  if (slider) {
    var slides = qsa('.t-card', slider);
    var dots = qsa('.t-dot', slider);
    var prevBtn = qs('#tPrev');
    var nextBtn = qs('#tNext');
    var current = 0;
    var timer = null;
    var DELAY = 6000;

    function show(i) {
      if (!slides.length) return;
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, n) {
        s.classList.toggle('is-active', n === current);
        s.hidden = n !== current;
      });
      dots.forEach(function (d, n) {
        d.classList.toggle('is-active', n === current);
        d.setAttribute('aria-selected', n === current ? 'true' : 'false');
      });
    }

    function start() {
      if (reduceMotion || slides.length < 2) return;
      stop();
      timer = window.setInterval(function () { show(current + 1); }, DELAY);
    }
    function stop() { if (timer) { window.clearInterval(timer); timer = null; } }

    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        show(parseInt(dot.getAttribute('data-index'), 10) || 0);
        start();
      });
    });
    if (prevBtn) prevBtn.addEventListener('click', function () { show(current - 1); start(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); start(); });

    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);

    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(current - 1); start(); }
      if (e.key === 'ArrowRight') { show(current + 1); start(); }
    });

    // touch swipe
    var startX = null;
    slider.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; stop(); }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var diff = e.changedTouches[0].clientX - startX;
      if (Math.abs(diff) > 45) show(current + (diff < 0 ? 1 : -1));
      startX = null;
      start();
    });

    show(0);
    start();
  }

  /* ---------- 8. FAQ accordion ---------- */
  qsa('.faq-item').forEach(function (item) {
    var btn = qs('.faq-q', item);
    var panel = qs('.faq-a', item);
    if (!btn || !panel) return;

    btn.addEventListener('click', function () {
      var isOpen = item.classList.contains('is-open');

      qsa('.faq-item.is-open').forEach(function (other) {
        if (other === item) return;
        other.classList.remove('is-open');
        var ob = qs('.faq-q', other), op = qs('.faq-a', other);
        if (ob) ob.setAttribute('aria-expanded', 'false');
        if (op) op.style.maxHeight = '';
      });

      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      } else {
        item.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = '';
      }
    });
  });

  window.addEventListener('resize', function () {
    qsa('.faq-item.is-open').forEach(function (item) {
      var panel = qs('.faq-a', item);
      if (panel) panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });

  /* ---------- 9. Pricing comparison table ---------- */
  var compareToggle = qs('#compareToggle');
  var compareTable = qs('#compareTable');
  var compareLabel = qs('#compareToggleLabel');

  if (compareToggle && compareTable) {
    compareToggle.addEventListener('click', function () {
      var open = compareTable.hasAttribute('hidden');
      if (open) {
        compareTable.removeAttribute('hidden');
      } else {
        compareTable.setAttribute('hidden', '');
      }
      compareToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (compareLabel) {
        compareLabel.textContent = open ? 'Hide comparison table' : 'Compare packages side-by-side';
      }
    });
  }

  /* ---------- 10. Subtle 3D tilt on work cards ---------- */
  if (finePointer && !reduceMotion) {
    qsa('.work-card').forEach(function (card) {
      var raf = null;
      card.addEventListener('mousemove', function (e) {
        if (raf) return;
        raf = window.requestAnimationFrame(function () {
          raf = null;
          var rect = card.getBoundingClientRect();
          var x = (e.clientX - rect.left) / rect.width - 0.5;
          var y = (e.clientY - rect.top) / rect.height - 0.5;
          card.style.transform = 'perspective(900px) rotateX(' + (-y * 5).toFixed(2) + 'deg) rotateY(' +
            (x * 6).toFixed(2) + 'deg) translateY(-5px)';
        });
      });
      card.addEventListener('mouseleave', function () {
        card.style.transition = 'transform .5s cubic-bezier(.22,.61,.36,1)';
        card.style.transform = '';
        window.setTimeout(function () { card.style.transition = ''; }, 520);
      });
    });
  }

  /* ---------- 11. Gentle magnetic effect on hero CTAs ---------- */
  if (finePointer && !reduceMotion) {
    qsa('.hero-actions .btn').forEach(function (btn) {
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var dx = (e.clientX - rect.left - rect.width / 2) * 0.11;
        var dy = (e.clientY - rect.top - rect.height / 2) * 0.16;
        btn.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', function () { btn.style.transform = ''; });
    });
  }
})();
