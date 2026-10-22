/*
  The opening, tied to the scroll.

  The stage sticks to the top of the window while the page scrolls past it, and
  that movement is handed to the row instead of to the page: one turn of the
  row over the pinned stretch. The words sit in the middle and step aside as
  soon as the row starts to move, and come back when it comes back, because
  their opacity is read from the same number - nothing is remembered, so
  scrolling up undoes it exactly.

  When the pinned stretch is over the stage lets go and the page carries on,
  which is the plain behaviour of a sticky box: no scroll is intercepted, no
  wheel is swallowed, and a trackpad, a keyboard or a scrollbar all work.
*/
import { createCarousel } from './hero-carousel.js';

const hero = document.querySelector('.hero');
const row = document.getElementById('heroRow');
const stage = hero && hero.querySelector('.hero__stage');

if (hero && row && stage) {
  const phone = window.matchMedia('(max-width: 1279px)');
  const shape = () => ({
    cardHeight: phone.matches ? 0.40 : 0.44,
    gap: phone.matches ? 20 : 36
  });

  const items = Array.prototype.map.call(row.querySelectorAll('img'), img => ({
    src: img.getAttribute('src'),
    alt: img.getAttribute('alt') || '',
    aspect: (Number(img.getAttribute('width')) || 4) / (Number(img.getAttribute('height')) || 3)
  }));

  const first = shape();
  const carousel = items.length ? createCarousel(row, {
    items,
    preset: 'liquid',
    intro: 'rise',
    cardHeight: first.cardHeight,
    gap: first.gap,
    squeeze: 0.18
  }) : null;

  if (carousel) {
    // The pictures in the markup were the standing-still version; from here the
    // row is drawn instead.
    hero.setAttribute('data-gl', '');

    let gap = first.gap;
    let frame = 0;

    const read = () => {
      frame = 0;
      const travel = Math.max(1, hero.offsetHeight - stage.offsetHeight);
      const passed = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), travel);
      const p = passed / travel;
      // The row starts on the seam between the last picture and the first, so
      // the middle is clear and the words have the room the comp gives them.
      const loop = carousel.loop();
      carousel.drive(loop - gap / 2 + p * loop);
      // Out of the way in the first tenth of the travel, back on the way up.
      hero.style.setProperty('--hero-words', String(Math.max(0, 1 - p / 0.1)));
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    phone.addEventListener?.('change', () => {
      const next = shape();
      gap = next.gap;
      carousel.set?.(next);
      onScroll();
    });
    read();
  }
}
