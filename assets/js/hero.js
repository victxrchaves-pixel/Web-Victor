/*
  The opening.

  Two things happen here, both behind the writing. Underneath everything there
  is a curtain of light that turns over with the theme - grey light on the
  dark page, a grey wash on the paper one - and leans towards the cursor when
  it is near. Over it, the pictures the markup carries follow the cursor and
  fall behind it.

  The pictures are in the markup, in a line across the middle: that is what
  the page shows with no script, and what it keeps for anyone who has asked
  for less movement.

  Nothing here is tied to the scroll: the opening is one screen tall and goes
  by like any other.
*/
import { createTrail } from './image-trail.js';
import { createAurora } from './aurora.js';

const hero = document.querySelector('.hero');
const row = hero && document.getElementById('heroRow');
const stage = hero && hero.querySelector('.hero__stage');

if (hero && row && stage) {
  const root = document.documentElement;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');

  /* ---------- The light ---------- */

  const sky = document.getElementById('heroSky');
  // The same curtain in both themes, turned over, and with no colour in it:
  // greys over the dark page, where it reads as light; greys over paper,
  // where the component's light mode turns it into a wash of shadow. The
  // whole thing is kept low either way - there is writing over it.
  const SKIES = {
    dark: { colorStops: ['#1c1c1c', '#5e5e5e', '#1c1c1c'], lightMode: false, brightness: 0.7 },
    light: { colorStops: ['#bcbcbc', '#747474', '#bcbcbc'], lightMode: true, brightness: 1 }
  };
  const look = () => SKIES[root.getAttribute('data-theme') === 'light' ? 'light' : 'dark'];

  const SKY = {
    amplitude: 1.7,
    blend: 0.18,
    height: 0.36,
    speed: 1.1,
    scale: 1.2,
    glow: 0.25,
    layers: 3,
    direction: 'top'
  };

  let light = sky ? createAurora(sky, Object.assign({}, SKY, look())) : null;

  if (light) {
    hero.setAttribute('data-sky', '');
    // The theme is written on <html> by main.js, so that is what is watched:
    // no second place to remember which one is on.
    new MutationObserver(() => light && light.set(look()))
      .observe(root, { attributes: true, attributeFilter: ['data-theme'] });

    /* A phone has one pool of graphics memory and this page asks a lot of it:
       this sky, the badge in the About window, and the films. Asking for all
       of it at once is what leaves the badge drawing pieces of itself in the
       wrong places, and on a phone the window covers the screen, so while it
       is open the sky is behind it and nobody can see it anyway. It is given
       back for that time - destroy() releases the context, where pausing
       would only stop the drawing and keep the memory - and built again on
       the way out. */
    const narrow = window.matchMedia('(max-width: 1279px)');
    document.addEventListener('vc:sheet', event => {
      if (!narrow.matches) return;
      if (event.detail && event.detail.open) {
        if (light) { light.destroy(); light = null; }
      } else if (!light && sky) {
        light = createAurora(sky, Object.assign({}, SKY, look()));
      }
    });
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

  still.addEventListener?.('change', () => {
    if (still.matches) stop();
    else start();
    bare();
  });
  start();

  /* Neither a sky nor a trail - no WebGL 2 and a hand that has asked for less
     movement - and the opening would be the writing on its own. That is when
     the markup's own line of pictures is let through. */
  const bare = () => {
    const none = !light && !trail;
    if (none) hero.setAttribute('data-bare', '');
    else hero.removeAttribute('data-bare');
  };
  bare();
}
