/* Victor Chaves — landing behaviour.
   No dependencies. Everything degrades to a working static page if JS fails. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var setLabel = function () {};
  var updateLabel = function () {};

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

  /* ---------- The bar unfolds into the menu ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  var scrim = document.getElementById('navScrim');
  var menuOpen = false;
  var folded = panel ? panel.querySelectorAll('.pill__links, .pill__actions') : [];

  // Clipped content stays out of the tab order until the panel is open.
  var setFolded = function (isInert) {
    Array.prototype.forEach.call(folded, function (el) {
      if (isInert) el.setAttribute('inert', ''); else el.removeAttribute('inert');
    });
  };

  // The panel's open height is measured rather than hard-coded, so it fits its
  // content exactly at any scale and on the mobile layout too.
  var panelHeight = function () {
    var previous = panel.style.height;
    panel.style.height = 'auto';
    var natural = panel.getBoundingClientRect().height;
    panel.style.height = previous;
    return natural;
  };

  function openMenu() {
    if (menuOpen) return;
    menuOpen = true;
    setFolded(false);
    panel.classList.add('is-open');
    panel.style.height = panelHeight() + 'px';
    menuBtn.setAttribute('aria-expanded', 'true');
    scrim.hidden = false;
    requestAnimationFrame(function () { scrim.classList.add('is-visible'); });
    document.body.style.overflow = 'hidden';
    setLabel('Menu');
    var first = panel.querySelector('.pill__links a');
    if (first) first.focus({ preventScroll: true });
  }

  function closeMenu(returnFocus) {
    if (!menuOpen) return;
    menuOpen = false;
    panel.classList.remove('is-open');
    panel.style.height = '';
    setFolded(true);
    menuBtn.setAttribute('aria-expanded', 'false');
    scrim.classList.remove('is-visible');
    document.body.style.overflow = '';
    updateLabel();
    var hide = function () { if (!menuOpen) scrim.hidden = true; };
    if (reduced) hide(); else window.setTimeout(hide, 320);
    if (returnFocus) menuBtn.focus({ preventScroll: true });
  }

  if (menuBtn && panel && scrim) {
    menuBtn.addEventListener('click', function () {
      menuOpen ? closeMenu(false) : openMenu();
    });

    scrim.addEventListener('click', function () { closeMenu(true); });

    panel.addEventListener('click', function (event) {
      if (event.target.closest('.pill__links a, .pill__btn')) closeMenu(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && menuOpen) closeMenu(true);
    });

    // Keep the open panel fitted when the viewport changes under it.
    window.addEventListener('resize', function () {
      if (menuOpen) panel.style.height = panelHeight() + 'px';
    });
  }

  /* ---------- Marquee: clone the track so the loop is seamless ---------- */

  var track = document.getElementById('marqueeTrack');

  /* The band starts off the left edge of the phone canvas, so its first frames
     never enter the viewport and lazy loading never fires for them. Hand them
     over the moment the band itself comes near. */
  if (track && 'IntersectionObserver' in window) {
    var bandWatch = new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      Array.prototype.forEach.call(track.querySelectorAll('img[loading="lazy"]'), function (img) {
        img.loading = 'eager';
      });
      obs.disconnect();
    }, { rootMargin: '400px 0px' });
    bandWatch.observe(track.parentNode);
  }

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
    // Measured from real elements, not comp coordinates: the two canvases put
    // these in very different places.
    var SECTIONS = [
      { el: null,                                        text: 'ItsVictorChaves' },
      { el: document.querySelector('.row__toggle'),      text: 'Work' },
      { el: document.querySelector('.services .display'), text: 'What I Do' },
      { el: document.querySelector('.contact .display'), text: 'Contact' }
    ];
    var current = -1;

    var labelTarget = navLabel.textContent;
    setLabel = function (text) {
      if (labelTarget === text) return;
      labelTarget = text;
      if (reduced) { navLabel.textContent = text; return; }
      navLabel.classList.add('is-swapping');
      window.setTimeout(function () {
        navLabel.textContent = text;
        navLabel.classList.remove('is-swapping');
      }, 140);
    };

    var applyLabel = function (index) {
      current = index;
      setLabel(SECTIONS[index].text);
    };

    updateLabel = function () {
      if (menuOpen) return;
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

  /* ---------- Featured work: one row open at a time ----------
     The page is a traced canvas, so a row cannot simply grow: everything below
     it has to move. One custom property carries that distance - the rows after
     the open one translate by it, the blocks below the list ride the same
     value, and the frame grows by exactly as much so the footer keeps its
     ground. In the mobile flow layout none of that applies and the panel folds
     on a height measured from its own content. */

  var frame = document.querySelector('.frame');
  var rows = Array.prototype.slice.call(document.querySelectorAll('.row'));
  /* Each comp has its own idea of how much taller an open row is. */
  var DESKTOP_PUSH = 536;         /* 734 open - 198 closed */
  var PHONE_PUSH = 400;           /* 690 open - 290 closed */
  var openRow = null;
  var folding = 0;
  var FOLD_MS = 700;              /* --dur-fold plus the longest stagger */

  var isPhone = function () { return window.matchMedia('(max-width: 1279px)').matches; };
  var push = function () { return isPhone() ? PHONE_PUSH : DESKTOP_PUSH; };

  /* The large shots stay out of the initial payload; a row fetches its own the
     first time someone shows interest in it. */
  var loadShots = function (row) {
    Array.prototype.forEach.call(row.querySelectorAll('.row__track img[data-src]'), function (img) {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
  };

  /* The shots start life on top of their own thumbnails, so the thumbnails are
     what covers for them until their bytes arrive: the swap only happens once
     every shot in the row can actually be drawn. */
  var handOver = function (row) {
    var shots = row.querySelectorAll('.row__track img');
    var pending = shots.length;
    var ready = function () {
      if (--pending > 0) return;
      if (row.classList.contains('is-open')) row.classList.add('is-handed');
    };
    Array.prototype.forEach.call(shots, function (img) {
      if (img.complete && img.naturalWidth) { ready(); return; }
      img.addEventListener('load', ready, { once: true });
      img.addEventListener('error', ready, { once: true });
    });
  };

  var fold = function (row) {
    row.classList.remove('is-open');
    row.classList.remove('is-handed');
    row.classList.remove('is-settled');
    row.querySelector('.row__toggle').setAttribute('aria-expanded', 'false');
    /* Rewind the strip as it folds, so the shots land back on the thumbnails
       they came from rather than wherever the reader left them. */
    var shots = row.querySelector('.row__shots');
    if (shots && shots.scrollLeft) {
      if (reduced) shots.scrollLeft = 0;
      else shots.scrollTo({ left: 0, behavior: 'smooth' });
    }
  };

  var unfold = function (row) {
    loadShots(row);
    var shots = row.querySelector('.row__shots');
    if (shots) shots.scrollLeft = 0;   /* the flight is measured from the strip's start */
    row.classList.add('is-open');
    handOver(row);
    row.querySelector('.row__toggle').setAttribute('aria-expanded', 'true');
  };

  var toggleRow = function (row) {
    var closing = row === openRow;
    if (openRow) fold(openRow);
    openRow = closing ? null : row;
    if (openRow) unfold(openRow);
    /* The page never moves under the reader: the row they clicked stays put and
       the panel grows from it. has-open lets the frame take its new scroll
       height at once on the way open, and give it back only once the fold has
       finished on the way closed. */
    frame.style.setProperty('--push', openRow ? push() : 0);
    frame.classList.toggle('has-open', !!openRow);

    frame.classList.add('is-folding');
    window.clearTimeout(folding);
    folding = window.setTimeout(function () {
      frame.classList.remove('is-folding');
      /* The flight is over: the scroller can give up the band it needed above
         the strip and start taking the gestures meant for it. */
      if (openRow) openRow.classList.add('is-settled');
    }, FOLD_MS);
  };

  rows.forEach(function (row) {
    var toggle = row.querySelector('.row__toggle');
    if (!toggle) return;
    var warm;

    toggle.addEventListener('click', function () { toggleRow(row); });

    /* The strip sits above the toggle on the phone so it can be swiped, which
       would otherwise cost the row its tap. Anything that moved the strip is a
       scroll, not a tap. */
    var strip = row.querySelector('.thumbs');
    if (strip) {
      var startX = 0, startLeft = 0;
      strip.addEventListener('pointerdown', function (event) {
        startX = event.clientX;
        startLeft = strip.scrollLeft;
      });
      strip.addEventListener('click', function (event) {
        if (Math.abs(event.clientX - startX) > 6 || strip.scrollLeft !== startLeft) return;
        toggleRow(row);
      });
    }

    /* A hover that lasts long enough to be a decision, not a sweep. Opening a
       row shifts the ones under it, which fires pointerenter on whichever now
       sits beneath a still pointer - so wait for real movement instead. */
    toggle.addEventListener('pointermove', function () {
      if (warm) return;
      warm = window.setTimeout(function () { loadShots(row); }, 120);
    });
    toggle.addEventListener('pointerleave', function () { window.clearTimeout(warm); warm = 0; });
  });

  if (rows.length) {
    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape' || !openRow) return;
      var row = openRow;
      toggleRow(row);
      row.querySelector('.row__toggle').focus();
    });

    /* Crossing the breakpoint swaps which comp the push is measured in. */
    window.addEventListener('resize', function () {
      if (openRow) frame.style.setProperty('--push', push());
    });
  }

  /* ---------- Cal.com: open the booking modal, never navigate ----------
     Cal's own click handler opens the modal but does not prevent the link's
     default action, so an <a> would navigate away underneath it. These
     triggers keep their href purely as the no-JS fallback: with the script
     present we stop the navigation, stop the event reaching Cal's delegated
     handler (so only one modal opens) and call the API ourselves. The inline
     snippet queues that call, so it also works if the embed is still loading. */

  Array.prototype.forEach.call(document.querySelectorAll('[data-cal-link]'), function (el) {
    el.addEventListener('click', function (event) {
      if (typeof window.Cal !== 'function') return;   // no snippet: follow the href
      event.preventDefault();
      event.stopPropagation();

      var ns = el.getAttribute('data-cal-namespace');
      var api = (ns && window.Cal.ns && window.Cal.ns[ns]) ? window.Cal.ns[ns] : window.Cal;
      var config = {};
      try { config = JSON.parse(el.getAttribute('data-cal-config') || '{}'); } catch (err) {}
      api('modal', { calLink: el.getAttribute('data-cal-link'), config: config });

      // Stopping propagation also stops the panel's own close handler.
      if (el.closest('#navPanel')) closeMenu(false);

      // If the embed never arrives (blocked, offline), fall back to the page.
      var tries = 0;
      (function waitForModal() {
        if (document.querySelector('cal-modal-box')) return;
        if (++tries > 15) { window.location.href = el.href; return; }
        window.setTimeout(waitForModal, 200);
      })();
    });
  });

  /* ---------- About: a pop-up over the landing ----------
     The window is a fragment target, so it opens and closes without this file.
     What JS adds is the fade, the focus handling, and the rail: a minimap of
     the information, where the bright segment is the part you are looking at
     and every tick is a section you can jump to. */

  var about = document.getElementById('about');
  var aboutScroll = document.getElementById('aboutScroll');
  var aboutRail = document.getElementById('aboutRail');
  var aboutFill = document.getElementById('aboutFill');

  if (about && aboutScroll && aboutRail && aboutFill) {
    var aboutOpen = false;
    var aboutReturn = null;
    var marks = Array.prototype.slice.call(aboutScroll.querySelectorAll('[data-about-sec]'));
    var ticks = marks.map(function (el) {
      var tick = document.createElement('button');
      tick.type = 'button';
      tick.className = 'about__tick';
      tick.innerHTML = '<span class="u-sr-only">' + el.getAttribute('data-about-sec') + '</span>';
      tick.addEventListener('click', function () { jumpTo(el); });
      aboutRail.appendChild(tick);
      return tick;
    });

    // The scroller's own padding is the air above the first line; a jump that
    // lands on a section should put its rule where that air ends.
    var padTop = function () {
      return parseFloat(window.getComputedStyle(aboutScroll).paddingTop) || 0;
    };
    var offsetOf = function (el) {
      return el.getBoundingClientRect().top
        - aboutScroll.getBoundingClientRect().top
        + aboutScroll.scrollTop;
    };

    function jumpTo(el) {
      var target = Math.max(0, offsetOf(el) - padTop());
      if (reduced) { aboutScroll.scrollTop = target; return; }
      aboutScroll.scrollTo({ top: target, behavior: 'smooth' });
    }

    // Everything the rail draws is a fraction of the whole content, so the
    // ticks and the window segment share one scale and always line up.
    function layoutRail() {
      var total = aboutScroll.scrollHeight;
      if (!total) return;
      marks.forEach(function (el, i) {
        ticks[i].hidden = !!el.hidden;
        if (el.hidden) return;
        ticks[i].style.setProperty('--t', Math.min(0.995, offsetOf(el) / total));
      });
      drawRail();
    }

    function drawRail() {
      var total = aboutScroll.scrollHeight;
      var seen = aboutScroll.clientHeight;
      if (!total) return;
      aboutFill.style.setProperty('--p0', aboutScroll.scrollTop / total);
      aboutFill.style.setProperty('--ph', Math.min(1, seen / total));

      // The section you are in is the last one whose rule has passed the top
      // of the window, with a little tolerance for a jump that lands short.
      var probe = aboutScroll.scrollTop + padTop() + 4;
      var current = 0;
      marks.forEach(function (el, i) { if (!el.hidden && offsetOf(el) <= probe) current = i; });
      if (aboutScroll.scrollTop + seen >= total - 2) current = marks.length - 1;
      ticks.forEach(function (tick, i) { tick.classList.toggle('is-current', i === current); });
    }

    aboutScroll.addEventListener('scroll', drawRail, { passive: true });

    /* The CV row is in the design, but the PDF is Victor's to drop in. Rather
       than hand a visitor a 404, the row asks for the file once and takes
       itself out of the window if it is not there yet; the day it lands, the
       row comes back on its own. */
    var cvAsked = false;
    function checkCv() {
      var dl = about.querySelector('.about__dl');
      if (cvAsked || !dl || !window.fetch) return;
      cvAsked = true;
      var sec = dl.closest('.about__sec');
      window.fetch(dl.getAttribute('href'), { method: 'HEAD' }).then(function (res) {
        if (res.ok) return;
        sec.hidden = true;
        if (aboutOpen) layoutRail();
      }).catch(function () {});
    }

    /* ---------- Opening and closing ---------- */

    var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openAbout() {
      if (aboutOpen) return;
      aboutOpen = true;
      aboutReturn = document.activeElement;
      about.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setLabel('About');
      // One forced reflow rather than a frame callback: it gives the
      // transition a start value to run from and the rail a box to measure,
      // both synchronously. A requestAnimationFrame would do the same only
      // once the engine chooses to paint, which it need not do at once.
      void about.offsetWidth;
      about.classList.add('is-visible');
      layoutRail();
      checkCv();
      var close = document.getElementById('aboutClose');
      if (close) close.focus({ preventScroll: true });
    }

    function closeAbout(returnFocus) {
      if (!aboutOpen) return;
      aboutOpen = false;
      about.classList.remove('is-visible');
      // The hash would hold it open through :target, so it goes with it.
      if (window.location.hash === '#about' && window.history.replaceState) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      document.body.style.overflow = '';
      updateLabel();
      var hide = function () { if (!aboutOpen) about.classList.remove('is-open'); };
      if (reduced) hide(); else window.setTimeout(hide, 320);
      // The link that opened this lives in the menu, which is closed and inert
      // by now, so focusing it would quietly do nothing. The button that owns
      // the menu is where the caret belongs.
      var back = aboutReturn;
      if (back && back.closest && back.closest('#navPanel')) back = menuBtn;
      if (returnFocus && back && back.focus) back.focus({ preventScroll: true });
      aboutReturn = null;
    }

    document.addEventListener('click', function (event) {
      var opener = event.target.closest('[data-about-open]');
      if (opener) {
        event.preventDefault();
        closeMenu(false);
        openAbout();
        return;
      }
      if (event.target.closest('.about__scrim, #aboutClose')) {
        event.preventDefault();
        closeAbout(true);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (!aboutOpen) return;
      if (event.key === 'Escape') { closeAbout(true); return; }
      if (event.key !== 'Tab') return;
      // aria-modal only tells assistive tech; the tab ring has to be held here.
      var items = Array.prototype.filter.call(
        about.querySelectorAll(FOCUSABLE),
        function (el) { return el.offsetParent !== null || el === document.activeElement; }
      );
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault(); first.focus();
      }
    });

    window.addEventListener('resize', function () { if (aboutOpen) layoutRail(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (aboutOpen) layoutRail(); });
    }
    // The portrait is lazy and arrives after the first measure on the phone
    // layout, where it sits in the flow and moves every section below it.
    var portrait = about.querySelector('.about__photo');
    if (portrait) portrait.addEventListener('load', function () { if (aboutOpen) layoutRail(); });

    // Landing on /#about with JS on: take it over so it behaves like any
    // other opening, rather than being held open by the hash.
    if (window.location.hash === '#about') {
      about.classList.add('is-visible');
      openAbout();
    }
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
