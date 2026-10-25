/* Victor Chaves — landing behaviour.
   No dependencies. Everything degrades to a working static page if JS fails. */

(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Which hand is on the page ----------
     The focus ring is for someone finding their way with the keyboard. It is
     not for someone who has just clicked: there, what they clicked is already
     what they are looking at. :focus-visible gets that right for focus the
     reader moves, but not for focus the page moves for them - opening the menu
     puts the caret on the first link, a window puts it on its close button -
     and that is where the ring was turning up uninvited, on a click. So the
     page says plainly which hand is on it and the ring is drawn for only one
     of them. Tab is the only key that can start keyboard navigation from
     nothing; every other key leaves the mode as it was, so closing a window
     with Escape after clicking does not light anything up either. */
  var inputMode = function (mode) {
    if (document.documentElement.getAttribute('data-input') !== mode) {
      document.documentElement.setAttribute('data-input', mode);
    }
  };
  inputMode('pointer');
  document.addEventListener('pointerdown', function () { inputMode('pointer'); }, true);
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Tab') inputMode('key');
  }, true);
  var setLabel = function () {};
  var updateLabel = function () {};
  var sheetLabel = function (el) {
    return el.getAttribute('data-sheet-label') || '';
  };

  /* ---------- Films in the strips ----------
     A few of the pieces are films, not photographs, so their slot plays rather
     than showing one frame. Nothing is fetched or played until it is actually
     on screen: a page of fourteen rows would otherwise pull every clip at once
     and keep them all decoding. Each one carries its own first frame as a
     poster, so the slot is never empty while the file is on its way, and that
     is all anyone sees if the reader has asked for less motion. */

  var seen = null;
  var playIfSeen = function (el) { if (seen) seen.observe(el); };

  /* Every clip is meant to be met at its first frame, so it is wound back
     rather than picked up where it was left: a film that comes back on screen
     starts again, not halfway through. currentTime cannot be set before the
     file has a duration, so if nothing has arrived yet the rewind waits for
     the metadata and happens then. */
  var rewind = function (v) {
    if (v.readyState >= 1) {
      if (v.currentTime) { try { v.currentTime = 0; } catch (e) {} }
      return;
    }
    v.addEventListener('loadedmetadata', function () {
      try { v.currentTime = 0; } catch (e) {}
    }, { once: true });
  };

  var replay = function (v) {
    rewind(v);
    var p = v.play();
    if (p && p.catch) p.catch(function () {});
  };

  if (!reduced && 'IntersectionObserver' in window) {
    seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target;
        if (entry.isIntersecting) {
          if (v.preload === 'none') { v.preload = 'auto'; v.load(); }
          replay(v);
        } else {
          if (!v.paused) v.pause();
          rewind(v);
        }
      });
    }, { rootMargin: '200px 0px' });
    Array.prototype.forEach.call(document.querySelectorAll('.thumbs__video, .piece--film'), function (v) {
      seen.observe(v);
    });
  }

  /* A click on a film takes it back to the top and runs it again. The strip is
     a scroller, so a click that ends a drag is not a click: the pointer has to
     have stayed put. A thumbnail in a closed row never gets here - it does not
     answer the pointer at all, the row's own button does. */
  var pressAt = null;
  document.addEventListener('pointerdown', function (e) {
    pressAt = { x: e.clientX, y: e.clientY };
  }, true);
  document.addEventListener('click', function (e) {
    var v = e.target.closest && e.target.closest('video');
    if (!v) return;
    if (pressAt && Math.abs(e.clientX - pressAt.x) + Math.abs(e.clientY - pressAt.y) > 10) return;
    replay(v);
  });

  /* ---------- Holding the page still ----------
     Anything that takes over the screen - the menu, the About window - owns
     it while it is up: the landing behind must not scroll and must not answer
     a pointer. overflow:hidden on the body alone does not hold on iOS, so the
     page is taken out of the scroll flow and put back exactly where it was.
     The count is there so two overlays cannot release each other's hold. */

  var locks = 0;
  var lockedAt = 0;

  function lockPage() {
    if (locks++) return;
    lockedAt = window.scrollY || window.pageYOffset || 0;
    document.body.style.top = (-lockedAt) + 'px';
    document.documentElement.classList.add('is-locked');
  }

  function unlockPage() {
    if (!locks || --locks) return;
    document.documentElement.classList.remove('is-locked');
    document.body.style.top = '';
    // The page scrolls smoothly by default; putting it back is not a journey.
    try { window.scrollTo({ top: lockedAt, left: 0, behavior: 'instant' }); }
    catch (err) { window.scrollTo(0, lockedAt); }
  }

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
    var opening = document.querySelector('.hero');
    var groups = {};
    revealables.forEach(function (el) {
      var key = el.closest('section, header, footer');
      var id = key ? (key.id || key.className) : 'root';
      groups[id] = (groups[id] || 0) + 1;
      el.style.setProperty('--reveal-delay', (groups[id] - 1) * 60 + 'ms');
      // The opening is already on the screen when the page arrives, and parts
      // of it sit low enough to fall outside what the observer counts as in
      // view. It comes in on its own, still one after another.
      if (opening && opening.contains(el)) { el.classList.add('is-in'); return; }
      revealObserver.observe(el);
    });
  }

  var nav = document.getElementById('nav');

  /* ---------- Two settings that outlive the visit ----------
     The language and the light. Both are written on <html>, where the stylesheet
     can see them, and remembered in the browser; the little script in the head
     puts it back before the first paint, so nothing is drawn twice.

     The language is not one of them any more: each language has its own
     address, so the page arrives in the language it is, says so on <html>,
     and the selector in the menu is a pair of links rather than a switch.
     What is left here are the few words this script says on its own. */

  var root = document.documentElement;
  var KEY = { theme: 'vc-theme' };

  // The few words the script says on its own: the rest live in the markup.
  var WORDS = {
    menu:    { es: 'Men\u00fa',      en: 'Menu' },
    work:    { es: 'Proyectos',  en: 'Work' },
    what:    { es: 'Qu\u00e9 hago',  en: 'What I Do' },
    contact: { es: 'Contacto',   en: 'Contact' }
  };
  var say = function (key) {
    var w = WORDS[key];
    if (!w) return key;
    return w[root.getAttribute('data-lang') === 'es' ? 'es' : 'en'] || w.en;
  };

  var remember = function (key, value) {
    try { window.localStorage.setItem(key, value); } catch (e) {}
  };

  var markSeg = function (name, value, attr) {
    var seg = document.querySelector('.seg[data-seg="' + name + '"]');
    if (!seg) return;
    var opts = seg.querySelectorAll('.seg__opt');
    var i = 0;
    Array.prototype.forEach.call(opts, function (opt, n) {
      var on = opt.getAttribute(attr) === value;
      opt.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) i = n;
    });
    seg.setAttribute('data-i', i);
  };


  /* The booking window is someone else's page opened inside ours, so it is
     told which way this one is turned rather than left to read the system's
     setting: every trigger carries the answer in its own configuration, which
     is what the embed reads when it opens, and the embed itself is told again
     once it has loaded. */
  var CAL_NS = '30min';
  /* Set once the badge exists; until then there is nothing to re-dress. */
  var dressBadge = function () {};
  var dressCal = function (theme) {
    var config = '{"layout":"month_view","useSlotsViewOnSmallScreen":"true","theme":"' + theme + '"}';
    Array.prototype.forEach.call(document.querySelectorAll('[data-cal-link]'), function (el) {
      el.setAttribute('data-cal-config', config);
    });
    try {
      if (window.Cal && window.Cal.ns && window.Cal.ns[CAL_NS]) window.Cal.ns[CAL_NS]('ui', { theme: theme });
    } catch (err) {}
  };

  var setTheme = function (theme, save) {
    root.setAttribute('data-theme', theme);
    // The bar at the top of the phone's browser is painted by the page, and it
    // has to turn over with everything else.
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#f4f2ee' : '#111111');
    markSeg('theme', theme, 'data-set-theme');
    dressCal(theme);
    dressBadge();
    if (save) remember(KEY.theme, theme);
  };

  setTheme(root.getAttribute('data-theme') || 'dark', false);

  document.addEventListener('click', function (event) {
    var opt = event.target.closest ? event.target.closest('[data-set-theme]') : null;
    if (!opt) return;
    setTheme(opt.getAttribute('data-set-theme'), true);
  });

  /* ---------- The mark goes home ----------
     On any other page that is a plain link to the landing. On the landing
     itself it is the top of this page, and the scroll is done here rather
     than left to the browser so that the address stays the address: a
     fragment in the bar would be a worse answer than none. */

  document.addEventListener('click', function (event) {
    var home = event.target.closest ? event.target.closest('[data-home]') : null;
    if (!home) return;
    if (root.getAttribute('data-page') !== 'home') return;
    event.preventDefault();
    closeMenu(false);
    try { window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' }); }
    catch (err) { window.scrollTo(0, 0); }
  });

  /* ---------- The bar unfolds into the menu ---------- */

  var menuBtn = document.getElementById('menuBtn');
  var panel = document.getElementById('navPanel');
  var scrim = document.getElementById('navScrim');
  var menuOpen = false;
  var folded = panel ? panel.querySelectorAll('.pill__links, .pill__actions, .pill__prefs') : [];

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
    lockPage();
    setLabel(say('menu'));
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
    unlockPage();
    // The menu can be opened over a window, which is still there underneath;
    // the bar goes back to naming it rather than to naming the page.
    if (openSheetEl) setLabel(sheetLabel(openSheetEl));
    else updateLabel();
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
      if (event.key !== 'Escape' || !menuOpen) return;
      // The menu can be unfolded over an open window. This Escape puts the
      // menu away and does nothing else: the handlers registered after this
      // one - the window's, the open row's - do not get the same key.
      event.stopImmediatePropagation();
      closeMenu(true);
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

  if (track) {
    var band = track.parentNode;

    /* Whatever the band holds, its films run like every other one here. */
    var watchBand = function () {
      Array.prototype.forEach.call(track.querySelectorAll('video'), function (v) {
        if (v.__watched) return;
        v.__watched = true;
        playIfSeen(v);
      });
    };
    watchBand();

    if (!reduced) {
      /* A second run of the same frames, so the wrap lands on an identical
         picture and nobody sees the seam. */
      Array.prototype.slice.call(track.children).forEach(function (node) {
        var clone = node.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        if (clone.tagName === 'IMG') clone.setAttribute('alt', '');
        track.appendChild(clone);
      });
      watchBand();

      /* 36 of the comp's own pixels a second: the rate the band had before,
         kept whatever the window's width and however many frames it holds. */
      var SPEED = 36;
      var onScreen = true, last = 0, started = false, pos = null;

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          onScreen = entries[0].isIntersecting;
        }, { rootMargin: '200px 0px' }).observe(band);
      }

      var drift = function (now) {
        window.requestAnimationFrame(drift);
        var half = track.scrollWidth / 2;
        if (!half || !onScreen) { last = now; return; }
        if (!started) { band.scrollLeft = pos = half; started = true; last = now; return; }
        /* One comp pixel is the band's own width over the width the comp gives
           it, so the drift reads the same on every screen. */
        var u = band.clientWidth / 2157;
        var dt = Math.min(100, now - last);
        last = now;
        /* The place is kept here, to the fraction: a frame's worth of drift is
           less than a pixel, and scrollLeft would round every one of them up
           and run the band at a pixel a frame. A hand on the scroller changes
           it by more than that, which is how the two are told apart. */
        var cur = band.scrollLeft;
        if (Math.abs(cur - pos) > 1.5) pos = cur;
        pos += SPEED * u * dt / 1000;
        if (pos >= half * 1.5) pos -= half;
        else if (pos < half * 0.5) pos += half;
        band.scrollLeft = pos;
      };
      window.requestAnimationFrame(drift);
    }
  }

  /* ---------- The pill label names the section you are in ---------- */

  var navLabel = document.getElementById('navLabel');

  if (navLabel) {
    // Measured from real elements, not comp coordinates: the two canvases put
    // these in very different places.
    // The page's own opening name is whatever the markup says, in either
    // language; the rest are the script's own words, asked for when needed.
    var home = {
      es: navLabel.getAttribute('data-es') || (navLabel.textContent || '').trim(),
      en: navLabel.getAttribute('data-en') || (navLabel.textContent || '').trim()
    };
    var SECTIONS = [
      { el: null, key: 'home' },
      { el: document.querySelector('.row__toggle'),       key: 'work' },
      { el: document.querySelector('.services .display'), key: 'what' },
      { el: document.querySelector('.contact .display'),  key: 'contact' }
    ];
    var textOf = function (section) {
      if (section.key !== 'home') return say(section.key);
      return home[document.documentElement.getAttribute('data-lang') === 'es' ? 'es' : 'en']
             || 'ChavesCerrejon';
    };
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
      setLabel(textOf(SECTIONS[index]));
    };

    updateLabel = function () {
      // A window over the landing names itself in the bar, and locking the
      // page fires one last scroll event that would otherwise undo that.
      if (menuOpen || openSheetEl) return;
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
  var DESK_STEP = 198;            /* a closed row, on each canvas: what the */
  var PHONE_STEP = 290;           /* last row is worth when the filter counts */
  var openRow = null;
  var folding = 0;
  var FOLD_MS = 700;              /* --dur-fold plus the longest stagger */

  var isPhone = function () { return window.matchMedia('(max-width: 1279px)').matches; };
  var push = function () { return isPhone() ? PHONE_PUSH : DESKTOP_PUSH; };

  /* The large shots stay out of the initial payload; a row fetches its own the
     first time someone shows interest in it. */
  var films = function (scope) { return scope.querySelectorAll('video'); };
  var halt = function (v) { if (!v.paused) v.pause(); rewind(v); };

  var promote = function (scope, watch) {
    Array.prototype.forEach.call(scope.querySelectorAll('img[data-src]'), function (img) {
      img.src = img.getAttribute('data-src');
      img.removeAttribute('data-src');
    });
    /* A film's sources are held back the same way, one step deeper: the <source>
       elements carry the address and the <video> only starts looking once they
       have it. */
    Array.prototype.forEach.call(scope.querySelectorAll('video'), function (video) {
      var held = video.querySelectorAll('source[data-src]');
      if (held.length) {
        Array.prototype.forEach.call(held, function (source) {
          source.src = source.getAttribute('data-src');
          source.removeAttribute('data-src');
        });
        video.preload = 'auto';
        video.load();
        if (watch !== false) playIfSeen(video);
      }
    });
  };

  /* Past the last thumbnail, a strip holds the rest of the project - pieces the
     closed row has nothing on screen for, waiting off to the right. Those are
     not part of the opening, so they are fetched when the reader scrolls the
     strip to them rather than on the click. The strip itself is the frame of
     reference, not the window: a row can be open while the page is scrolled
     somewhere else entirely, and what counts is how far along the strip is. */
  var moreSeen = function (shots) {
    if (!('IntersectionObserver' in window)) return null;
    if (shots.__seen) return shots.__seen;
    shots.__seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          promote(e.target, false);
          if (!reduced) Array.prototype.forEach.call(films(e.target), replay);
        } else {
          Array.prototype.forEach.call(films(e.target), halt);
        }
      });
    }, { root: shots, rootMargin: '0px 300px' });
    return shots.__seen;
  };

  var loadShots = function (row) {
    var seen = moreSeen(row.querySelector('.row__shots'));
    Array.prototype.forEach.call(row.querySelectorAll('.row__track > li'), function (li) {
      if (li.classList.contains('more') && seen) seen.observe(li);
      else promote(li);
    });
    /* A row whose strip is a typeface has no photographs to fetch: what it
       needs warmed is the face its specimen is set in. */
    warmFace(row);
  };

  /* data-face names a webfont this row is set in. The face blocks rather than
     swaps, so asking for it early is what keeps the strip from arriving late. */
  var warmFace = function (row) {
    var face = row.getAttribute('data-face');
    if (!face || !document.fonts || !document.fonts.load) return null;
    try { return document.fonts.load('1em "' + face + '"'); } catch (e) { return null; }
  };

  /* The shots start life on top of their own thumbnails, so the thumbnails are
     what covers for them until their bytes arrive: the swap only happens once
     every shot in the row can actually be drawn. */
  var handOver = function (row) {
    /* Only the shots that fly out of a thumbnail: the ones further along the
       strip are off to the right, with nothing of theirs on screen to cover. */
    var shots = row.querySelectorAll('.row__track > li:not(.more) img, .row__track > li:not(.more) video');
    var pending = shots.length;
    /* Nothing to load means nothing to wait for - unless the strip is type,
       in which case the face is what the thumbnails are covering for. */
    if (!pending) {
      var hand = function () {
        if (row.classList.contains('is-open')) row.classList.add('is-handed');
      };
      var face = warmFace(row);
      if (face && face.then) face.then(hand, hand); else hand();
      return;
    }
    var ready = function () {
      if (--pending > 0) return;
      if (row.classList.contains('is-open')) row.classList.add('is-handed');
    };
    Array.prototype.forEach.call(shots, function (el) {
      if (el.tagName === 'VIDEO') {
        /* A film is ready as soon as there is a frame to draw; until then its
           poster is already showing, so nothing is missing either way. */
        if (el.readyState >= 2) { ready(); return; }
        el.addEventListener('loadeddata', ready, { once: true });
        el.addEventListener('error', ready, { once: true });
        return;
      }
      if (el.complete && el.naturalWidth) { ready(); return; }
      el.addEventListener('load', ready, { once: true });
      el.addEventListener('error', ready, { once: true });
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
    /* And the closed strip with it, for the same reason: the alphabet of the
       typeface row is a scroller too, and the next flight starts on its A. */
    var closed = row.querySelector('.thumbs');
    if (closed && closed.scrollLeft) {
      if (reduced) closed.scrollLeft = 0;
      else closed.scrollTo({ left: 0, behavior: 'smooth' });
    }
    /* The strip stays laid out under the closed row, so nothing tells its films
       they have left the screen: the fold does. They stop and wind back, and
       the thumbnails coming up take over from their own first frame. */
    Array.prototype.forEach.call(row.querySelectorAll('.row__track video'), halt);
    if (!reduced) Array.prototype.forEach.call(row.querySelectorAll('.thumbs video'), replay);
  };

  var unfold = function (row) {
    loadShots(row);
    var shots = row.querySelector('.row__shots');
    if (shots) shots.scrollLeft = 0;   /* the flight is measured from the strip's start */
    var closed = row.querySelector('.thumbs');
    if (closed) closed.scrollLeft = 0; /* and from the strip's own start, too */
    row.classList.add('is-open');
    /* The same exchange the other way: the thumbnails go out under the shots,
       so they stop, and every shot that has a thumbnail to fly from starts at
       its first frame. The ones further along the strip wait for the reader to
       scroll to them. */
    Array.prototype.forEach.call(row.querySelectorAll('.thumbs video'), halt);
    if (!reduced) {
      Array.prototype.forEach.call(row.querySelectorAll('.row__track > li:not(.more) video'), replay);
    }
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

    /* Crossing the breakpoint swaps which comp the push is measured in - and
       which comp the filter's arithmetic is measured in with it. */
    window.addEventListener('resize', function () {
      if (openRow) frame.style.setProperty('--push', push());
      if (activeFilter) layOut();
    });
  }

  /* ---------- Filter the list by category ----------
     The rows are placed at the comp's own coordinates, so hiding one cannot
     close the gap it leaves on its own: the rows under it have to be told how
     far up to come. Each row carries that distance as --ry, and the blocks
     below the list ride --trim, the whole height the filter has taken out.
     One category at a time, because the comp offers no way to show two. */

  var filters = document.getElementById('filters');
  var filterStatus = document.getElementById('filterStatus');
  var activeFilter = '';

  if (filters && rows.length) {
    /* A row's place and its height, in whichever comp is on screen. The last
       row has no next rule to measure against, so it takes the common step. */
    var ruleAt = function (row) {
      var hr = row.querySelector('.rule');
      var v = hr && hr.style.getPropertyValue(isPhone() ? '--my' : '--y');
      return v ? parseFloat(v) : 0;
    };
    var heightOf = function (i) {
      if (i < rows.length - 1) return ruleAt(rows[i + 1]) - ruleAt(rows[i]);
      return isPhone() ? PHONE_STEP : DESK_STEP;
    };

    var trim = 0, untrimming = 0;
    var layOut = function () {
      var top = ruleAt(rows[0]);
      var cursor = top, full = top;
      rows.forEach(function (row, i) {
        var h = heightOf(i);
        full += h;
        if (row.classList.contains('is-filtered')) { row.style.setProperty('--ry', 0); return; }
        row.style.setProperty('--ry', cursor - ruleAt(row));
        cursor += h;
      });
      var next = cursor - full;
      /* The frame takes a smaller height only once everything has finished
         moving into it, so the ground is never missing from under the footer -
         but a list that is growing back needs the room straight away. */
      if (next > trim) {
        frame.classList.add('is-untrimming');
        window.clearTimeout(untrimming);
        untrimming = window.setTimeout(function () {
          frame.classList.remove('is-untrimming');
        }, FOLD_MS);
      }
      trim = next;
      frame.style.setProperty('--trim', next);
    };

    var applyFilter = function (name) {
      activeFilter = name;
      /* An open row would be left hanging over the gap it used to fill. */
      if (openRow) toggleRow(openRow);
      var shown = 0;
      rows.forEach(function (row) {
        var cats = (row.getAttribute('data-cat') || '').split(' ');
        var keep = !name || cats.indexOf(name) !== -1;
        row.classList.toggle('is-filtered', !keep);
        if (keep) shown++;
      });
      Array.prototype.forEach.call(filters.querySelectorAll('[data-filter]'), function (btn) {
        btn.setAttribute('aria-pressed', btn.getAttribute('data-filter') === name ? 'true' : 'false');
      });
      layOut();
      if (filterStatus) {
        filterStatus.textContent = name
          ? shown + (shown === 1 ? ' project' : ' projects') + ' in this category'
          : 'Showing all ' + rows.length + ' projects';
      }
    };

    filters.addEventListener('click', function (event) {
      var btn = event.target.closest('[data-filter]');
      if (!btn) return;
      var name = btn.getAttribute('data-filter');
      /* Pressing the pressed one is how you get the whole list back. */
      applyFilter(name === activeFilter ? '' : name);
    });
  }

  /* ---------- Cal.com: the booking window, fetched only when it is wanted ---
     Cal's embed is ninety-odd kilobytes and the only thing on this site that
     leaves a cookie behind, so it is no longer part of the opening load:
     anyone who never goes near a booking button pays for none of it.

     It is sent for at the first sign that someone wants it - a pointer coming
     to rest on one of these buttons, a finger landing on one, a tab stopping
     there - so that by the time the click arrives it is usually ready. The
     click asks as well, for the hand that goes straight to it.

     Cal's own click handler opens the window but does not stop the link, so an
     <a> would navigate away underneath it. We stop the navigation, stop the
     event reaching Cal's delegated handler, and call the API ourselves. The
     href stays as the fallback: for no script at all, for a middle click, and
     for the case where the embed never arrives. */

  var CAL_SRC = 'https://app.cal.com/embed/embed.js';
  var calBooted = false;
  var calFailed = false;

  var bootCal = function () {
    if (calBooted) return;
    calBooted = true;

    /* Cal's own loader. It keeps a queue, so calls made while the script is
       still coming are replayed the moment it lands - which is the whole
       reason a click can be answered before the download has finished. */
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); };
      var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal, ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          var s = d.head.appendChild(d.createElement('script'));
          s.src = A;
          s.onerror = function () { calFailed = true; };
          cal.loaded = true;
        }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, CAL_SRC, 'init');

    window.Cal('init', CAL_NS, { origin: 'https://app.cal.com' });
    window.Cal.config = window.Cal.config || {};
    window.Cal.config.forwardQueryParams = true;
    /* Told in the same breath which way the page is turned, so the window
       never opens white over a dark page. */
    window.Cal.ns[CAL_NS]('ui', {
      hideEventTypeDetails: false,
      layout: 'month_view',
      theme: root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
    });
  };

  var openCal = function (el) {
    bootCal();

    var ns = el.getAttribute('data-cal-namespace');
    var api = (ns && window.Cal.ns && window.Cal.ns[ns]) ? window.Cal.ns[ns] : window.Cal;
    var config = {};
    try { config = JSON.parse(el.getAttribute('data-cal-config') || '{}'); } catch (err) {}
    api('modal', { calLink: el.getAttribute('data-cal-link'), config: config });

    /* The press has a download behind it now, so the button has to say it
       heard: silence for a second reads as a dead button. */
    el.setAttribute('data-cal-waiting', '');

    /* And if the window never comes - blocked, offline, a network that gave
       up - the booking page itself is where they go. The wait is long because
       a slow connection is not a broken one: the three seconds this used to
       allow sent people to the foot of the page while the window was still on
       its way, and then opened it on top of them. */
    var waited = 0;
    (function waitForModal() {
      if (document.querySelector('cal-modal-box')) {
        el.removeAttribute('data-cal-waiting');
        return;
      }
      waited += 200;
      if (calFailed || waited > 15000) {
        el.removeAttribute('data-cal-waiting');
        if (el.href) window.location.href = el.href;
        return;
      }
      window.setTimeout(waitForModal, 200);
    })();
  };

  Array.prototype.forEach.call(document.querySelectorAll('[data-cal-link]'), function (el) {
    /* Intent, in the three ways it shows. None of these opens anything: they
       only start the download early. */
    el.addEventListener('pointerenter', bootCal);
    el.addEventListener('touchstart', bootCal, { passive: true });
    el.addEventListener('focus', bootCal);

    el.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      openCal(el);
      // Stopping propagation also stops the panel's own close handler.
      if (el.closest('#navPanel')) closeMenu(false);
    });
  });

  /* ---------- Windows over the landing ----------
     About and Contact are the same thing twice: a window that takes the
     screen, holds the page still behind it, and gives it back where it was.
     Each is a .sheet with its own content; everything below is the shell they
     share. Each one is a fragment target too, so the menu's links work and
     both close controls lead back out with the script off. */

  var sheets = Array.prototype.slice.call(document.querySelectorAll('.sheet'));
  var FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
  var openSheetEl = null;
  var sheetReturn = null;
  var onSheetOpen = {};          /* id -> what that window wants doing on open */

  function openSheet(el) {
    if (!el || openSheetEl === el) return;
    if (openSheetEl) closeSheet(false);
    openSheetEl = el;
    sheetReturn = document.activeElement;
    el.classList.add('is-open');
    document.documentElement.classList.add('sheet-is-open');
    lockPage();
    setLabel(sheetLabel(el) || say('menu'));
    // One forced reflow rather than a frame callback: it gives the transition
    // a start value to run from and any measuring a box to work on, both
    // synchronously. A requestAnimationFrame would do the same only once the
    // engine chooses to paint, which it need not do at once.
    void el.offsetWidth;
    el.classList.add('is-visible');
    if (onSheetOpen[el.id]) onSheetOpen[el.id]();
    /* Said out loud so the hero can give its sky's graphics memory back while
       this window is over it - on a phone the badge inside needs it more. */
    tellSheet(true);
    var close = el.querySelector('.sheet__close');
    if (close) close.focus({ preventScroll: true });
  }

  function tellSheet(open) {
    try {
      document.dispatchEvent(new CustomEvent('vc:sheet', { detail: { open: open } }));
    } catch (e) {}
  }

  function closeSheet(returnFocus) {
    var el = openSheetEl;
    if (!el) return;
    openSheetEl = null;
    tellSheet(false);
    el.classList.remove('is-visible');
    document.documentElement.classList.remove('sheet-is-open');
    // The hash would hold it open through :target, so it goes with it.
    if (window.location.hash === '#' + el.id && window.history.replaceState) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    unlockPage();
    updateLabel();
    var hide = function () { if (openSheetEl !== el) el.classList.remove('is-open'); };
    if (reduced) hide(); else window.setTimeout(hide, 320);
    // The link that opened this lives in the menu, which is closed and inert
    // by now, so focusing it would quietly do nothing. The button that owns
    // the menu is where the caret belongs.
    var back = sheetReturn;
    if (back && back.closest && back.closest('#navPanel')) back = menuBtn;
    if (returnFocus && back && back.focus) back.focus({ preventScroll: true });
    sheetReturn = null;
  }

  if (sheets.length) {
    document.addEventListener('click', function (event) {
      var target = event.target;
      if (!target || !target.closest) return;

      var opener = target.closest('[data-sheet-open]');
      if (opener) {
        var wanted = document.querySelector(opener.getAttribute('href'));
        if (wanted && wanted.classList.contains('sheet')) {
          event.preventDefault();
          closeMenu(false);
          openSheet(wanted);
          return;
        }
      }
      if (target.closest('.sheet__scrim, .sheet__close')) {
        event.preventDefault();
        closeSheet(true);
      }
    });

    document.addEventListener('keydown', function (event) {
      // The menu can be unfolded over a window; while it is, it owns the keys
      // and the ring, and Escape puts it away before the window.
      if (!openSheetEl || menuOpen) return;
      if (event.key === 'Escape') { closeSheet(true); return; }
      if (event.key !== 'Tab') return;
      // aria-modal only tells assistive tech; the tab ring has to be held here.
      var items = Array.prototype.filter.call(
        openSheetEl.querySelectorAll(FOCUSABLE),
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

    // Landing on a window's own fragment with JS on: take it over so it
    // behaves like any other opening, rather than being held open by the hash.
    var landed = window.location.hash && document.querySelector(window.location.hash);
    if (landed && landed.classList.contains('sheet')) {
      landed.classList.add('is-visible');
      openSheet(landed);
    }
  }

  /* ---------- The About window's rail ----------
     A minimap of the information: the bright segment is the part you are
     looking at and every tick is a section you can jump to. */

  var about = document.getElementById('about');
  var aboutScroll = document.getElementById('aboutScroll');
  var aboutRail = document.getElementById('aboutRail');
  var aboutFill = document.getElementById('aboutFill');

  if (about && aboutScroll && aboutRail && aboutFill) {
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
    var placed = [];

    function layoutRail() {
      var total = aboutScroll.scrollHeight;
      if (!total) return;
      placed = [];
      marks.forEach(function (el, i) {
        ticks[i].hidden = !!el.hidden;
        if (el.hidden) return;
        var at = offsetOf(el);
        ticks[i].style.setProperty('--t', Math.min(0.995, at / total));
        placed.push({ i: i, at: at });
      });
      placed.sort(function (a, b) { return a.at - b.at; });
      // The phone comp reads the record in a different order from the wide
      // one, which CSS does with `order`. The rail answers to the eye, not to
      // the markup, so its marks are re-hung in the order they are seen.
      placed.forEach(function (o) { aboutRail.appendChild(ticks[o.i]); });
      drawRail();
    }

    function drawRail() {
      var total = aboutScroll.scrollHeight;
      var seen = aboutScroll.clientHeight;
      if (!total || !placed.length) return;
      aboutFill.style.setProperty('--p0', aboutScroll.scrollTop / total);
      aboutFill.style.setProperty('--ph', Math.min(1, seen / total));

      // The section you are in is the last one whose rule has passed the top
      // of the window, with a little tolerance for a jump that lands short.
      var probe = aboutScroll.scrollTop + padTop() + 4;
      var current = placed[0].i;
      placed.forEach(function (o) { if (o.at <= probe) current = o.i; });
      if (aboutScroll.scrollTop + seen >= total - 2) current = placed[placed.length - 1].i;
      ticks.forEach(function (tick, i) { tick.classList.toggle('is-current', i === current); });
    }

    aboutScroll.addEventListener('scroll', drawRail, { passive: true });

    onSheetOpen.about = function () { layoutRail(); };

    window.addEventListener('resize', function () { if (openSheetEl === about) layoutRail(); });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { if (openSheetEl === about) layoutRail(); });
    }
    // The portrait is lazy and arrives after the first measure on the phone
    // layout, where it sits in the flow and moves every section below it.
    var portrait = about.querySelector('.about__photo');
    if (portrait) portrait.addEventListener('load', function () { if (openSheetEl === about) layoutRail(); });
  }

  /* ---------- The badge on its lanyard ----------
     Victor's photograph, printed on a card that hangs from a strap and can be
     pulled about and flipped over.

     It is drawn with three.js, which is half a megabyte even cut to the parts
     this needs, so nothing is sent for until the About panel is actually
     opened - and then only once. Until it arrives, and if it never does, the
     photograph that was always there is what shows: no WebGL, a slow line, a
     file that fails, and the panel is exactly as it was.

     A hand that has asked for less movement is not given a swinging card at
     all, and is not made to download one either. */

  var badge = document.querySelector('[data-lanyard]');
  if (badge) {
    var hung = null;
    var sentFor = false;

    // The strap reads against the panel it hangs on, so it turns over with it.
    var badgeLook = function () {
      var light = root.getAttribute('data-theme') === 'light';
      return {
        cardColor: light ? '#f4f4f4' : '#141414',
        strapColor: light ? '#111111' : '#e8e8e8'
      };
    };

    var hangBadge = function () {
      if (sentFor) {
        if (hung) hung.wake();
        return;
      }
      if (reduced) return;
      sentFor = true;
      /* Addressed from the root: this file is a classic script, so a relative
         specifier would be resolved against the page's address rather than
         this script's - and under /en/ that is a different folder. */
      import('/assets/js/lanyard.js').then(function (module) {
        var look = badgeLook();
        var common = {
          frontImage: badge.getAttribute('data-portrait'),
          imageFit: 'cover',
          cardColor: look.cardColor,
          strapColor: look.strapColor,
          orientation: 'portrait',
          finish: 'glossy',
          cornerRadius: 0.26,
          strapWidth: 0.6,
          metal: 'silver',
          breeze: 0.35,
          interactive: true,
          intro: true
        };

        /* The card is drawn on a sheet of its own, laid over the window and
           reaching the edges of the screen, so it can swing over the writing
           and out of the frame. The portrait's box stays where it is, holding
           the column's shape and the photograph that shows if none of this
           arrives.

           Where it hangs differs with the canvas. On the desktop one the
           window is a panel on the page and the badge falls over the column
           to its right. On the phone the window IS the screen: the band comes
           from the very top of it and the card hangs large down the middle,
           with the name, the links and the mail beneath it. */
        var wide = window.matchMedia('(min-width: 1280px)').matches;
        var dialog = about.querySelector('.sheet__dialog');
        if (!dialog) return;
        var stage = document.createElement('div');
        stage.className = 'about__stage';
        dialog.appendChild(stage);

        hung = module.createLanyard(stage, Object.assign(common, {
          /* The sheet hears the pointer, because the drawing surface must not:
             it lies over the writing, and would swallow every click. */
          surface: about
        }, wide ? {
          /* The band falls over the right-hand column. The stage is the window
             plus 360 units of screen on each side, so the column's middle -
             717 across the window, 239 wide - sits at this fraction of it. */
          anchor: 0.681,
          size: 0.4,
          strapLength: 0.12
        } : {
          /* Down the middle of the screen, from the very top of it. */
          anchor: 0.5,
          /* The band is cut off at the top of the screen, so what a reader
             sees of it is just the drop to the card's head. The card keeps
             that drop and grows downward instead; the room the column holds
             open grows with it, so the name keeps its distance. */
          /* Both are fractions of the stage, and the stage is now 700 tall
             rather than 1114, so they are scaled to match: the card and its
             drop stay exactly where they were on screen. */
          size: 0.491,
          strapLength: 0.305
        }));
        if (hung) badge.classList.add('is-hung');
        else stage.remove();

        /* On the phone the badge travels with the page. Its stage hangs off
           the window, which does not scroll, so it would otherwise sit there
           while the writing went by underneath; moved by as much as the
           column has scrolled, it rides up and off the top with everything
           else. The desktop keeps it still, because the column it hangs over
           is still too. */
        if (hung && !wide) {
          var scroller = about.querySelector('.sheet__scroll');
          if (scroller) {
            var ride = function () {
              stage.style.transform = 'translateY(' + -scroller.scrollTop + 'px)';
            };
            scroller.addEventListener('scroll', ride, { passive: true });
            ride();
          }
        }
      }).catch(function () {
        // Nothing to say: the photograph is already there.
      });
    };

    dressBadge = function () { if (hung) hung.set(badgeLook()); };

    var openedAbout = onSheetOpen.about;
    onSheetOpen.about = function () {
      if (openedAbout) openedAbout();
      hangBadge();
    };
  }

  /* ---------- Footer clock, in Barcelona time ---------- */

  var clock = document.getElementById('clock');
  if (clock) {
    // The comp writes the date the same way in both languages - the month, the
    // day and the year - so the line keeps its shape and only the month's name
    // changes. Intl would write '11 de junio de 2027' in Spanish, which is
    // right but not what the comp draws, so the three parts are asked for
    // separately and put together here.
    var parts = {};
    var fmtFor = function () {
      var l = document.documentElement.getAttribute('data-lang') === 'es' ? 'es-ES' : 'en-US';
      if (!parts[l]) {
        parts[l] = ['month', 'day', 'year'].map(function (k) {
          var o = { timeZone: 'Europe/Madrid' };
          o[k] = k === 'month' ? 'long' : 'numeric';
          return new Intl.DateTimeFormat(l, o);
        });
      }
      return { format: function (d) {
        var p = parts[l];
        return p[0].format(d) + ' ' + p[1].format(d) + ', ' + p[2].format(d);
      } };
    };
    var timeFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    var tick = function () {
      var now = new Date();
      clock.textContent = fmtFor().format(now) + '  ' + timeFmt.format(now);
      clock.setAttribute('datetime', now.toISOString());
    };
    tick();
    window.setInterval(tick, 1000);
  }
})();
