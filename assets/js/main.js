/* Victor Chaves — landing behaviour.
   No dependencies. Everything degrades to a working static page if JS fails. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Scroll reveal (fires once per element) ---------- */

  var revealables = document.querySelectorAll('[data-reveal]');

  function revealAll() {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  }

  if (!('IntersectionObserver' in window)) {
    revealAll();
  } else {
    // Arm the hidden states only now that they can be undone again.
    document.documentElement.classList.add('js-anim');

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    // Stagger the members of each group so nothing arrives all at once.
    var groups = {};
    revealables.forEach(function (el) {
      var key = el.closest('section, header, footer');
      var id = key ? (key.id || key.className) : 'root';
      groups[id] = (groups[id] || 0) + 1;
      el.style.setProperty('--reveal-delay', (groups[id] - 1) * 60 + 'ms');
      revealObserver.observe(el);
    });
  }

  /* ---------- Nav retracts on the way down, returns on the way up ---------- */

  var nav = document.getElementById('nav');
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var goingDown = y > lastY;
    if (Math.abs(y - lastY) > 6) {
      nav.classList.toggle('is-hidden', goingDown && y > 240 && !menuOpen);
      lastY = y;
    }
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  /* ---------- Overlay menu ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var menuPanel = document.getElementById('menuPanel');
  var menuOpen = false;

  function openMenu() {
    menuOpen = true;
    menuPanel.hidden = false;
    // Let the browser paint the hidden state before transitioning opacity in.
    requestAnimationFrame(function () { menuPanel.classList.add('is-open'); });
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    nav.classList.remove('is-hidden');
    var first = menuPanel.querySelector('.menu__link');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu() {
    menuOpen = false;
    menuPanel.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    var done = function () { if (!menuOpen) menuPanel.hidden = true; };
    if (reduced) { done(); } else { window.setTimeout(done, 220); }
  }

  if (menuBtn && menuPanel) {
    menuBtn.addEventListener('click', function () {
      menuOpen ? closeMenu() : openMenu();
    });

    menuPanel.addEventListener('click', function (event) {
      if (event.target === menuPanel || event.target.classList.contains('menu__link')) {
        closeMenu();
        if (event.target.classList.contains('menu__link')) menuBtn.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuOpen) {
        closeMenu();
        menuBtn.focus({ preventScroll: true });
      }
    });
  }

  /* ---------- Marquee: clone the track so the loop is seamless ---------- */

  var track = document.getElementById('marqueeTrack');
  if (track && !reduced) {
    Array.prototype.slice.call(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.setAttribute('alt', '');
      track.appendChild(clone);
    });
    // Only start moving once the loop is seamless; at rest the band sits
    // exactly where the comp puts it.
    track.parentNode.classList.add('marquee--anim');
  }

  /* ---------- Footer clock, in Barcelona time ---------- */

  var clock = document.getElementById('clock');
  if (clock) {
    var dateFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Europe/Madrid', month: 'long', day: 'numeric', year: 'numeric'
    });
    var timeFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    var tick = function () {
      var now = new Date();
      clock.textContent = dateFmt.format(now) + '  ' + timeFmt.format(now);
      clock.setAttribute('datetime', now.toISOString());
    };
    tick();
    window.setInterval(tick, 1000);
  }
})();
