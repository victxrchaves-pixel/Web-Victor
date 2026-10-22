/*
  The opening.

  The pictures are in the markup, in a line across the middle: that is what
  the page shows with no script, and what it keeps for anyone who has asked
  for less movement. Where movement is welcome, the line steps aside and the
  same pictures become a trail that follows the cursor across the opening -
  one of them laid down every so many pixels of travel, zoomed in and bright,
  settling into its frame and fading.

  Nothing here is tied to the scroll: the opening is one screen tall and goes
  by like any other.
*/
import { createTrail } from './image-trail.js';

const hero = document.querySelector('.hero');
const row = hero && document.getElementById('heroRow');
const stage = hero && hero.querySelector('.hero__stage');

if (hero && row && stage) {
  const still = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = window.matchMedia('(pointer: coarse)');
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
