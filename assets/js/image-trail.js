/*
  The trail of pictures behind the cursor.

  It is the ImageTrail idea from React Bits, written out as a plain module so
  it can live in a site that has no build step and no framework: the movement
  is the same one, tween for tween, and what was React - the refs, the state,
  the list rendered from props - is gone. The frames are built here from the
  pictures the markup already carries, so the opening says something before
  any of this runs.

  Every so many pixels of travel the next picture in the list is laid down
  where the cursor is, zoomed in and bright, and it settles into its frame and
  fades. The cursor is followed twice: once exactly, which is where a new
  picture lands, and once lagging behind, which is where it comes from - that
  gap is what makes the trail lean into the movement.
*/
import { gsap } from './vendor/gsap.mjs';

const lerp = (a, b, n) => (1 - n) * a + n * b;

export function createTrail(surface, options = {}) {
  const container = options.container || surface;
  const sources = options.items || [];
  if (!sources.length) return null;

  const cfg = {
    threshold: options.threshold ?? 80,
    lifetime: options.lifetime ?? 0.4,
    appearScale: options.appearScale ?? 1,
    zoom: options.zoom ?? 1,
    flash: options.flash ?? 0,
    exitScale: options.exitScale ?? 0.2,
    drift: options.drift ?? 0,
    rotation: options.rotation ?? 0,
    sizeVariance: options.sizeVariance ?? 0,
    alignToMotion: options.alignToMotion ?? false,
    stack: options.stack ?? 0,
    tilt: options.tilt ?? 0
  };

  // One frame per picture, and a second box inside it that holds the picture
  // itself: the frame is what moves, the inner one is what zooms, so neither
  // has to undo the other's transform.
  const images = sources.map(item => {
    const el = document.createElement('div');
    el.className = 'trail__img';
    const inner = document.createElement('div');
    inner.className = 'trail__img-inner';
    inner.style.backgroundImage = 'url("' + item.src + '")';
    el.appendChild(inner);
    container.appendChild(el);
    return { el, inner };
  });

  const total = images.length;
  const mouse = { x: 0, y: 0 };
  const last = { x: 0, y: 0 };
  const cache = { x: 0, y: 0 };
  const visible = [];
  let started = false;
  let raf = 0;
  let index = -1;
  let zIndex = 1;
  let active = 0;
  let lastAngle = 0;
  let destroyed = false;

  const settle = () => {
    active = Math.max(0, active - 1);
    if (!active && !visible.length) zIndex = 1;
  };

  const retire = img => {
    gsap.to(img.el, {
      duration: 0.4,
      ease: 'power4',
      opacity: 0,
      scale: cfg.exitScale,
      onComplete: () => {
        if (!active && !visible.length) zIndex = 1;
      }
    });
  };

  const spawn = () => {
    index = (index + 1) % total;
    const img = images[index];
    const width = img.el.offsetWidth;
    const height = img.el.offsetHeight;
    const dx = mouse.x - last.x;
    const dy = mouse.y - last.y;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    let fromAngle = gsap.utils.random(-cfg.rotation, cfg.rotation);
    let toAngle = fromAngle * 0.4;
    if (cfg.alignToMotion) {
      fromAngle = lastAngle;
      toAngle = angle;
      while (toAngle - fromAngle > 180) toAngle -= 360;
      while (toAngle - fromAngle < -180) toAngle += 360;
      lastAngle = toAngle;
    }
    const scale = 1 + gsap.utils.random(-0.5, 0.6) * cfg.sizeVariance;
    const box = container.getBoundingClientRect();
    const tiltX = box.height ? -((mouse.y - box.height / 2) / (box.height / 2)) * cfg.tilt : 0;
    const tiltY = box.width ? ((mouse.x - box.width / 2) / (box.width / 2)) * cfg.tilt : 0;
    const drift = cfg.drift > 0;
    const slide = drift ? 0.6 * cfg.drift : 0;

    ++zIndex;
    ++active;
    gsap.killTweensOf(img.el);
    gsap.killTweensOf(img.inner);
    const visibleIndex = visible.indexOf(img);
    if (visibleIndex >= 0) visible.splice(visibleIndex, 1);

    const timeline = gsap.timeline({ onComplete: settle });
    timeline.fromTo(
      img.el,
      {
        opacity: 1,
        scale: cfg.appearScale * scale,
        zIndex,
        x: cache.x - width / 2,
        y: cache.y - height / 2,
        rotation: fromAngle,
        rotationX: tiltX * 0.5,
        rotationY: tiltY * 0.5
      },
      {
        duration: drift ? 0.9 : 0.4,
        ease: drift ? 'power2' : 'power1',
        scale,
        x: mouse.x - width / 2 + dx * slide,
        y: mouse.y - height / 2 + dy * slide,
        rotation: toAngle,
        rotationX: tiltX,
        rotationY: tiltY
      },
      0
    );
    if (cfg.zoom !== 1 || cfg.flash > 0) {
      timeline.fromTo(
        img.inner,
        { scale: cfg.zoom, filter: 'brightness(' + (1 + cfg.flash * 1.5) + ')' },
        { duration: 0.5, ease: 'power1', scale: 1, filter: 'brightness(1)' },
        0
      );
    }

    if (cfg.stack > 0) {
      visible.push(img);
      const keep = Math.max(1, Math.min(Math.round(cfg.stack), total - 1));
      while (visible.length > keep) {
        const old = visible.shift();
        if (old) retire(old);
      }
      return;
    }

    timeline.to(
      img.el,
      {
        duration: 0.4,
        ease: drift ? 'expo' : 'power3',
        opacity: 0,
        scale: cfg.exitScale * scale
      },
      cfg.lifetime
    );
    if (drift) {
      timeline.to(
        img.el,
        {
          duration: 1.5,
          ease: 'power4',
          x: '+=' + dx * cfg.drift * 1.2,
          y: '+=' + dy * cfg.drift * 1.2
        },
        cfg.lifetime
      );
    }
  };

  const loop = () => {
    raf = 0;
    if (destroyed) return;
    cache.x = lerp(cache.x, mouse.x, 0.1);
    cache.y = lerp(cache.y, mouse.y, 0.1);
    if (Math.hypot(mouse.x - last.x, mouse.y - last.y) > cfg.threshold) {
      spawn();
      last.x = mouse.x;
      last.y = mouse.y;
    }
    if (Math.abs(cache.x - mouse.x) > 0.5 || Math.abs(cache.y - mouse.y) > 0.5) {
      raf = requestAnimationFrame(loop);
    }
  };

  const onMove = e => {
    const rect = container.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : e;
    if (!point) return;
    mouse.x = point.clientX - rect.left;
    mouse.y = point.clientY - rect.top;
    if (!started) {
      started = true;
      cache.x = last.x = mouse.x;
      cache.y = last.y = mouse.y;
    }
    if (!raf) raf = requestAnimationFrame(loop);
  };

  // The listening is done by the whole stage rather than by the box the
  // frames live in, so the writing in the middle and the links at the foot
  // are not holes in it; both boxes have the same corner, so a point measured
  // against one is the same point in the other.
  surface.addEventListener('mousemove', onMove);
  surface.addEventListener('touchmove', onMove, { passive: true });

  return {
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      surface.removeEventListener('mousemove', onMove);
      surface.removeEventListener('touchmove', onMove);
      images.forEach(img => {
        gsap.killTweensOf(img.el);
        gsap.killTweensOf(img.inner);
        if (img.el.parentNode) img.el.parentNode.removeChild(img.el);
      });
    }
  };
}
