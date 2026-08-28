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

  var nav = document.getElementById('nav');

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

  /* ---------- The pill label names the section you are in ---------- */

  var navLabel = document.getElementById('navLabel');

  if (navLabel) {
    // Measured from real elements, not comp coordinates: the desktop canvas and
    // the mobile flow layout place these very differently.
    var SECTIONS = [
      { el: null,                                        text: 'It\u2019s V\u00edctxr Chaves' },
      { el: document.querySelector('.row__hit'),         text: 'Work' },
      { el: document.querySelector('.services .display'), text: 'What I Do' },
      { el: document.querySelector('.contact .display'), text: 'Contact' }
    ];
    var current = -1;

    var applyLabel = function (index) {
      if (index === current) return;
      current = index;
      var text = SECTIONS[index].text;
      if (reduced) { navLabel.textContent = text; return; }
      navLabel.classList.add('is-swapping');
      window.setTimeout(function () {
        navLabel.textContent = text;
        navLabel.classList.remove('is-swapping');
      }, 140);
    };

    var updateLabel = function () {
      // A section takes over once its top passes three quarters down the
      // viewport; at the very bottom the last one always wins, since a short
      // page can never scroll its threshold past the probe.
      var probe = window.innerHeight * 0.75;
      var index = 0;
      for (var i = 1; i < SECTIONS.length; i++) {
        var el = SECTIONS[i].el;
        if (el && el.getBoundingClientRect().top <= probe) index = i;
      }
      if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 4) {
        index = SECTIONS.length - 1;
      }
      applyLabel(index);
    };

    window.addEventListener('scroll', updateLabel, { passive: true });
    window.addEventListener('resize', updateLabel);
    updateLabel();
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
