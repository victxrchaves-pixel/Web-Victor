/*
  The opening.

  Two things happen here, both behind the writing. Underneath everything there
  is a light drawn in characters, which turns over with the theme: white on
  the dark page, ink on the paper one. Over it, the pictures the markup
  carries follow the cursor and fall behind it.

  The pictures are in the markup, in a line across the middle: that is what
  the page shows with no script, and what it keeps for anyone who has asked
  for less movement.

  Nothing here is tied to the scroll: the opening is one screen tall and goes
  by like any other.
*/
import { createTrail } from './image-trail.js';
import { createGradientAscii } from './gradient-ascii.js';

const hero = document.querySelector('.hero');
const row = hero && document.getElementById('heroRow');
const stage = hero && hero.querySelector('.hero__stage');

if (hero && row && stage) {
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
  const phone = window.matchMedia('(max-width: 1279px)');

  /* ---------- The light, in characters ---------- */

  const ascii = document.getElementById('heroAscii');
  // The same sky in both themes, turned over. On the dark page it is light
  // coming up over the curve; on paper it is ink, so the ramp runs the other
  // way. In both the wash itself is kept low and the characters carry it:
  // the opening has to stay black when it is black and white when it is
  // white, and there is writing over it that still has to be read.
  const SKIES = {
    dark: {
      colors: ['#717171', '#fafafa', '#fafafa', '#fafafa'],
      lightMode: false,
      glyphOpacity: 0.35,
      gradientOpacity: 0.25
    },
    light: {
      colors: ['#9b9b9b', '#141414', '#141414', '#141414'],
      lightMode: true,
      glyphOpacity: 0.5,
      gradientOpacity: 0.22
    }
  };
  const sky = () => SKIES[root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];

  const light = ascii
    ? createGradientAscii(ascii, Object.assign({
        shape: 'horizon',
        characters: ' =+xX0S8#@',
        cellSize: phone.matches ? 15 : 18,
        density: 0.68,
        depthOfField: 0.54,
        flicker: 0.48,
        softness: 0.31,
        flow: 1.1,
        speed: 0.4,
        variation: 5,
        scrambleRadius: 0.08
      }, sky()))
    : null;

  if (light) {
    hero.setAttribute('data-ascii', '');
    // The theme is written on <html> by main.js, so that is what is watched:
    // no second place to remember which one is on.
    new MutationObserver(() => light.set(sky()))
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    phone.addEventListener?.('change', () => light.set({ cellSize: phone.matches ? 15 : 18 }));
  }

  /* ---------- The pictures, under the hand ---------- */

  let trail = null;

  const items = Array.prototype.map.call(row.querySelectorAll('img'), img => ({
    src: img.currentSrc || img.getAttribute('src')
  }));

  const start = () => {
    if (trail || still.matches) return;
    trail = createTrail(stage, {
      container: row,
      items,
      // The numbers are the component's own: a picture every 80 pixels of
      // travel, half a second on screen, growing out of nothing, zoomed in
      // and flashed as it arrives, then shrinking away while it carries on
      // in the direction the hand was going. On a finger the step is longer,
      // or a single swipe would deal out the whole pack.
      threshold: coarse.matches ? 110 : 80,
      lifetime: 0.5,
      appearScale: 0,
      zoom: 2.4,
      flash: 0.6,
      exitScale: 0.25,
      drift: 0.8,
      sizeVariance: 0.25
    });
    if (trail) hero.setAttribute('data-trail', '');
  };

  const stop = () => {
    if (!trail) return;
    trail.destroy();
    trail = null;
    hero.removeAttribute('data-trail');
  };

  still.addEventListener?.('change', () => (still.matches ? stop() : start()));
  start();
}
