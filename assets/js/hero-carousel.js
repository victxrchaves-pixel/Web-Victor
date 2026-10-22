/*
  The row of work behind the opening words.

  It is the FlexCarousel idea from React Bits, written out as a plain module so
  it can live in a site that has no build step and no framework: the drawing is
  the same - every card is painted into a buffer and the buffer is read back
  through an invisible piece of glass, so the row bends where the edge of that
  glass crosses it - and the parts that were React (refs, state, the caption)
  are gone. What is new is the way it is driven: on the page the row does not
  spin on its own, it is tied to the scroll (see hero.js), so a turn of the
  wheel is a step along the row rather than a step down the page.

  It needs WebGL 2. Where there is none - or no script at all - the markup's
  own pictures stay where they are and the hero is a still row; nothing here
  removes them until it knows it can draw.
*/
import { Renderer, Program, Mesh, Triangle, Plane, Texture, RenderTarget } from './vendor/ogl.mjs';

const TAPS = 12;
const PIXEL_BUDGET = 4.5e6;
const FIT_ASPECT = { portrait: 0.75, square: 1, landscape: 4 / 3 };
const INTRO_DURATION = { rise: 2.1, bloom: 1.6, spin: 2.2, deal: 1.5, fade: 0.35 };

const PRESETS = {
  liquid: { lensWidth: 0.74, lensHeight: 1.18, tilt: 62, roundness: 1, bend: 0.34, reach: 0.38, curl: 'twist', dispersion: 0.45, liquid: 0, followCursor: false },
  ribbon: { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.34, reach: 0.34, curl: 'twist', dispersion: 0.4, liquid: 0, followCursor: false },
  vortex: { lensWidth: 0.7, lensHeight: 0.95, tilt: 30, roundness: 1, bend: 0.46, reach: 0.3, curl: 'twist', dispersion: 0.5, liquid: 0, followCursor: false },
  arch:   { lensWidth: 0.8, lensHeight: 0.8, tilt: 0, roundness: 1, bend: 0.3, reach: 0.36, curl: 'rise', dispersion: 0.4, liquid: 0, followCursor: false }
};

const wrap = (value, size) => ((((value + size / 2) % size) + size) % size) - size / 2;
const clamp01 = v => Math.min(Math.max(v, 0), 1);
const easeOut = v => 1 - Math.pow(1 - clamp01(v), 3);
const easeOutQuint = v => 1 - Math.pow(1 - clamp01(v), 5);
const easeInOut = v => {
  const t = clamp01(v);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const cardVertex = `#version 300 es
in vec3 position;
in vec2 uv;
uniform vec4 uRect;
uniform vec2 uResolution;
out vec2 vUv;
out vec2 vLocal;
void main() {
  vUv = uv;
  vLocal = vec2(position.x, -position.y) * uRect.zw;
  vec2 px = uRect.xy + vLocal;
  gl_Position = vec4(px.x / uResolution.x * 2.0 - 1.0, 1.0 - px.y / uResolution.y * 2.0, 0.0, 1.0);
}
`;

const cardFragment = `#version 300 es
precision highp float;
uniform sampler2D tMap;
uniform vec2 uSize;
uniform vec2 uImage;
uniform float uRadius;
uniform float uAlpha;
uniform float uReady;
uniform float uShift;
uniform float uDpr;
uniform vec3 uPlaceholder;
in vec2 vUv;
in vec2 vLocal;
out vec4 fragColor;

float roundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float sd = roundedBox(vLocal, uSize * 0.5, min(uRadius, min(uSize.x, uSize.y) * 0.5));
  float mask = clamp(0.5 - sd * uDpr, 0.0, 1.0);
  vec2 local = vLocal / uSize + 0.5;
  float cardAspect = uSize.x / uSize.y;
  float imageAspect = uImage.x / max(uImage.y, 1.0);
  vec2 scale = imageAspect > cardAspect ? vec2(cardAspect / imageAspect, 1.0) : vec2(1.0, imageAspect / cardAspect);
  scale /= 1.08;
  vec2 uv = vec2(local.x, 1.0 - local.y);
  uv = (uv - 0.5) * scale + 0.5;
  uv.x += uShift * (1.0 - scale.x) * 0.5;
  vec3 image = texture(tMap, uv).rgb;
  vec3 color = mix(uPlaceholder, image, uReady);
  float alpha = mask * uAlpha;
  fragColor = vec4(color * alpha, alpha);
}
`;

const lensVertex = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const lensFragment = `#version 300 es
precision highp float;
uniform sampler2D tScene;
uniform vec2 uResolution;
uniform float uDpr;
uniform vec2 uCenter;
uniform vec2 uHalf;
uniform float uAngle;
uniform float uExponent;
uniform float uInner;
uniform float uOuter;
uniform float uFlow;
uniform float uCurl;
uniform float uDispersion;
uniform float uStrength;
uniform float uSceneAlpha;
out vec4 fragColor;

void main() {
  vec2 frag = gl_FragCoord.xy / uDpr;
  vec2 uv = frag / uResolution;
  vec2 rel = frag - vec2(uCenter.x, uResolution.y - uCenter.y);
  float ca = cos(uAngle);
  float sa = sin(uAngle);
  vec2 local = vec2(ca * rel.x + sa * rel.y, -sa * rel.x + ca * rel.y);
  vec2 k = max(abs(local) / uHalf, vec2(1e-5));
  float nd = pow(pow(k.x, uExponent) + pow(k.y, uExponent), 1.0 / uExponent);
  vec2 grad = pow(k, vec2(uExponent - 1.0)) * sign(local) / uHalf * pow(nd, 1.0 - uExponent);
  float glen = max(length(grad), 1e-6);
  float edge = (nd - 1.0) / glen;
  vec2 outward = grad / glen;
  vec2 normal = vec2(ca * outward.x - sa * outward.y, sa * outward.x + ca * outward.y);
  vec2 along = vec2(-normal.y, normal.x);

  float t = clamp((edge + uInner) / (uInner + uOuter), 0.0, 1.0);
  float ramp = t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  float slope = 16.0 * t * t * (1.0 - t) * (1.0 - t);
  float reachX = rel.x / (uResolution.x * 0.5);
  float side = smoothstep(0.02, 0.3, abs(reachX)) * (uCurl == 0.0 ? sign(reachX) : uCurl);
  float lift = ramp * side * uFlow * uStrength;
  vec2 swirl = along * along.y * side * slope * uFlow * uStrength * 0.35;
  vec2 drift = vec2(0.0, -lift) - swirl;
  vec2 shifted = uv + drift / uResolution;

  vec2 texels = uResolution * uDpr;
  vec2 gx = dFdx(shifted);
  vec2 gy = dFdy(shifted);
  gx *= min(1.0, 3.0 / max(length(gx * texels), 1e-4));
  gy *= min(1.0, 3.0 / max(length(gy * texels), 1e-4));

  vec4 color = textureGrad(tScene, shifted, gx, gy);
  vec2 spread = vec2(0.0, side * slope * uFlow * uStrength) / uResolution * uDispersion;
  float spreadPx = length(spread * texels);
  if (color.a > 0.002 && spreadPx > 0.25) {
    vec3 base = color.rgb / color.a;
    vec3 sumColor = vec3(0.0);
    vec3 sumWeight = vec3(0.0);
    for (int i = 0; i < ${TAPS}; i++) {
      float s = (float(i) + 0.5) / float(${TAPS});
      vec4 c = textureGrad(tScene, shifted + spread * (s - 0.5), gx, gy);
      vec3 w = max(1.0 - abs(vec3(s) - vec3(0.15, 0.5, 0.85)) * 2.6, 0.0) * c.a;
      sumColor += c.rgb * (w / max(c.a, 0.002));
      sumWeight += w;
    }
    vec3 split = mix(base, sumColor / max(sumWeight, vec3(1e-4)), clamp(sumWeight * 2.0, 0.0, 1.0));
    color.rgb = mix(color.rgb, clamp(split, 0.0, 1.0) * color.a, smoothstep(0.25, 1.5, spreadPx));
  }

  fragColor = color * uSceneAlpha;
}
`;

export function createCarousel(container, options = {}) {
  const preset = PRESETS[options.preset] || PRESETS.liquid;
  const pick = (value, key) => (value === undefined || value === null ? preset[key] : value);
  const s = {
    intro: options.intro || 'rise',
    cardHeight: options.cardHeight ?? 0.5,
    gap: options.gap ?? 12,
    radius: options.radius ?? 0,
    fit: options.fit || 'natural',
    lensWidth: pick(options.lensWidth, 'lensWidth'),
    lensHeight: pick(options.lensHeight, 'lensHeight'),
    tilt: pick(options.tilt, 'tilt'),
    roundness: pick(options.roundness, 'roundness'),
    bend: pick(options.bend, 'bend'),
    reach: pick(options.reach, 'reach'),
    curl: pick(options.curl, 'curl'),
    dispersion: pick(options.dispersion, 'dispersion'),
    liquid: pick(options.liquid, 'liquid'),
    followCursor: pick(options.followCursor, 'followCursor'),
    squeeze: options.squeeze ?? 0.2,
    onChange: options.onChange || null
  };

  // A browser with WebGL turned off hands back no context at all, and asking
  // for one then throws rather than failing quietly, so the whole attempt is
  // guarded: anything short of WebGL 2 leaves the markup's own pictures alone.
  let renderer;
  try {
    renderer = new Renderer({
      dpr: Math.min(window.devicePixelRatio || 1, 2),
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false
    });
  } catch (err) {
    return null;
  }
  const gl = renderer.gl;
  if (!gl || !renderer.isWebgl2) {
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
  gl.clearColor(0, 0, 0, 0);
  const canvas = gl.canvas;
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.setAttribute('aria-hidden', 'true');
  container.prepend(canvas);

  const cardProgram = new Program(gl, {
    vertex: cardVertex,
    fragment: cardFragment,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tMap: { value: new Texture(gl) },
      uRect: { value: [0, 0, 1, 1] },
      uResolution: { value: [1, 1] },
      uSize: { value: [1, 1] },
      uImage: { value: [1, 1] },
      uRadius: { value: 16 },
      uAlpha: { value: 1 },
      uReady: { value: 0 },
      uShift: { value: 0 },
      uDpr: { value: 1 },
      uPlaceholder: { value: [0.5, 0.5, 0.5] }
    }
  });
  cardProgram.setBlendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const cardMesh = new Mesh(gl, { geometry: new Plane(gl), program: cardProgram });

  const target = new RenderTarget(gl, {
    width: 2,
    height: 2,
    depth: false,
    minFilter: gl.LINEAR_MIPMAP_LINEAR,
    magFilter: gl.LINEAR
  });

  const lensUniforms = {
    tScene: { value: target.texture },
    uResolution: { value: [1, 1] },
    uDpr: { value: 1 },
    uCenter: { value: [0, 0] },
    uHalf: { value: [1, 1] },
    uAngle: { value: 0 },
    uExponent: { value: 2 },
    uInner: { value: 60 },
    uOuter: { value: 80 },
    uFlow: { value: 0 },
    uCurl: { value: 0 },
    uDispersion: { value: 0 },
    uStrength: { value: 0 },
    uSceneAlpha: { value: 0 }
  };
  const lensMesh = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex: lensVertex,
      fragment: lensFragment,
      uniforms: lensUniforms,
      depthTest: false,
      depthWrite: false
    })
  });

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const anisotropy = renderer.getExtension('EXT_texture_filter_anisotropic') ? 8 : 0;

  let slots = [];
  let width = 1;
  let height = 1;
  let pos = 0;
  let vel = 0;
  let goal = 0;
  let raf = 0;
  let last = performance.now();
  let visible = true;
  let alive = true;
  let dirty = true;
  let activeIndex = -1;
  let layout = null;
  let resnap = false;
  let energy = 0;
  let lastPos = 0;
  const lens = { x: 0, y: 0, vx: 0, vy: 0, ready: false };
  const intro = { kind: 'none', t: 0, running: false, done: false, readyAt: 0 };

  const loadSlot = (item, index) => {
    const texture = new Texture(gl, {
      generateMipmaps: true,
      minFilter: gl.LINEAR_MIPMAP_LINEAR,
      magFilter: gl.LINEAR,
      anisotropy
    });
    const slot = {
      item, index, texture,
      aspect: item.aspect || 0.8,
      loaded: false,
      failed: false,
      ready: 0,
      color: [0.5, 0.5, 0.5],
      image: [1, 1],
      dispose: () => {}
    };
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (!alive || !slots.includes(slot)) return;
      texture.image = image;
      texture.update();
      slot.image = [image.naturalWidth || 1, image.naturalHeight || 1];
      slot.aspect = slot.image[0] / slot.image[1];
      try {
        const probe = document.createElement('canvas');
        probe.width = 8;
        probe.height = 8;
        const ctx = probe.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(image, 0, 0, 8, 8);
          const data = ctx.getImageData(0, 0, 8, 8).data;
          const avg = [0, 0, 0];
          for (let i = 0; i < data.length; i += 4) {
            avg[0] += data[i];
            avg[1] += data[i + 1];
            avg[2] += data[i + 2];
          }
          slot.color = avg.map(v => v / 64 / 255);
        }
      } catch {
        slot.color = [0.5, 0.5, 0.5];
      }
      slot.loaded = true;
      dirty = true;
      start();
    };
    image.onerror = () => {
      if (!alive) return;
      slot.failed = true;
      dirty = true;
      start();
    };
    image.src = item.src;
    slot.dispose = () => {
      image.onload = null;
      image.onerror = null;
      gl.deleteTexture(texture.texture);
    };
    return slot;
  };

  const setItems = next => {
    slots.forEach(slot => slot.dispose());
    slots = next.map(loadSlot);
    activeIndex = -1;
    layout = null;
    resnap = true;
    intro.readyAt = performance.now();
    dirty = true;
    start();
  };

  const metrics = () => {
    const cardH = Math.max(24, s.cardHeight * height);
    const fixed = FIT_ASPECT[s.fit];
    const widths = slots.map(slot => (fixed || slot.aspect) * cardH);
    const centers = [];
    let cursor = 0;
    for (let i = 0; i < widths.length; i++) {
      centers.push(cursor + widths[i] / 2);
      cursor += widths[i] + s.gap;
    }
    return { cardH, widths, centers, gap: s.gap, loop: Math.max(cursor, 1) };
  };

  const nearest = (m, at) => {
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < m.centers.length; i++) {
      const dist = Math.abs(wrap(m.centers[i] - at, m.loop));
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return best;
  };

  const remap = (from, to, at) => {
    const i = nearest(from, at);
    const offset = wrap(at - from.centers[i], from.loop);
    const cycles = Math.round((at - offset - from.centers[i]) / from.loop);
    return cycles * to.loop + to.centers[i] + offset * (to.widths[i] / from.widths[i]);
  };

  const introEffects = () => {
    const t = intro.running ? intro.t : intro.done ? 1 : 0;
    const e = { sceneAlpha: 1, strength: 1, card: null };
    if (!intro.done && !intro.running) {
      e.sceneAlpha = 0;
      e.strength = 0;
      return e;
    }
    if (t >= 1) return e;
    if (intro.kind === 'rise') {
      e.strength = easeInOut((t - 0.3) / 0.65);
      e.card = rel => {
        const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.34;
        const local = clamp01((t - delay) / 0.6);
        return {
          alpha: clamp01(local * 4),
          x: 0,
          y: (1 - easeOutQuint(local)) * height * 0.62,
          scale: 0.5 + 0.5 * easeInOut((local - 0.18) / 0.82)
        };
      };
    } else if (intro.kind === 'bloom') {
      e.strength = easeInOut((t - 0.2) / 0.8);
      e.card = rel => {
        const delay = Math.min(Math.abs(rel) / (width * 0.6), 1) * 0.25;
        const local = easeOut((t - delay) / 0.55);
        return { alpha: local, x: 0, y: 0, scale: 0.92 + 0.08 * local };
      };
    } else {
      e.sceneAlpha = easeOut(t);
      e.strength = easeOut(t);
    }
    return e;
  };

  const beginIntro = () => {
    const kind = reducedMotion && s.intro !== 'none' ? 'fade' : s.intro;
    intro.kind = INTRO_DURATION[kind] ? kind : 'none';
    intro.running = intro.kind !== 'none';
    intro.done = !intro.running;
    intro.t = 0;
    if (intro.done) container.setAttribute('data-revealed', '');
  };

  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    renderer.dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(PIXEL_BUDGET / (width * height)));
    renderer.setSize(width, height);
    target.setSize(Math.max(2, Math.round(width * renderer.dpr)), Math.max(2, Math.round(height * renderer.dpr)));
    lensUniforms.tScene.value = target.texture;
    dirty = true;
    start();
  };

  const frame = now => {
    raf = 0;
    if (!alive) return;
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    if (!slots.length) {
      if (visible) raf = requestAnimationFrame(frame);
      return;
    }

    const m = metrics();
    const n = slots.length;
    let animating = false;

    if (resnap) {
      pos = goal;
      vel = 0;
      resnap = false;
    } else if (layout && layout.loop !== m.loop) {
      pos = remap(layout, m, pos);
      goal = remap(layout, m, goal);
      animating = true;
    }
    layout = m;

    if (!intro.running && !intro.done) {
      const settled = slots.every(slot => slot.loaded || slot.failed);
      if (settled || now - intro.readyAt > 3500) beginIntro();
    }
    if (intro.running) {
      intro.t = Math.min(1, intro.t + dt / (INTRO_DURATION[intro.kind] || 1));
      if (intro.t >= 1) {
        intro.running = false;
        intro.done = true;
        container.setAttribute('data-revealed', '');
      }
      animating = true;
    }

    // The row is driven from outside - by the scroll - so there is no spring
    // here: it follows the hand that holds it, and only eases the last little
    // distance so a jump of the wheel does not land as a jolt.
    const follow = 1 - Math.exp(-dt / 0.085);
    const delta = goal - pos;
    if (Math.abs(delta) > 0.05) {
      pos += delta * follow;
      animating = true;
    } else {
      pos = goal;
    }

    if (Math.abs(pos) > m.loop * 8) {
      const shift = Math.round(pos / m.loop) * m.loop;
      pos -= shift;
      goal -= shift;
    }

    const current = nearest(m, pos);
    if (current !== activeIndex) {
      activeIndex = current;
      s.onChange?.(current, slots[current]?.item);
    }

    const travel = Math.abs(pos - lastPos) / dt;
    lastPos = pos;
    const energyTarget = reducedMotion ? 0 : Math.min(travel / 2600, 1);
    energy += (energyTarget - energy) * (1 - Math.exp(-dt / (energyTarget > energy ? 0.07 : 0.35)));
    if (energy > 0.001) animating = true;

    const homeX = width / 2;
    const homeY = height / 2;
    if (!lens.ready) {
      lens.x = homeX;
      lens.y = homeY;
      lens.ready = true;
    }
    const lensK = 110;
    const lensC = 2 * Math.sqrt(lensK) * 0.8;
    lens.vx += (lensK * (homeX - lens.x) - lensC * lens.vx) * dt;
    lens.vy += (lensK * (homeY - lens.y) - lensC * lens.vy) * dt;
    lens.x += lens.vx * dt;
    lens.y += lens.vy * dt;
    if (Math.abs(homeX - lens.x) + Math.abs(homeY - lens.y) > 0.2) animating = true;

    const cardH = m.cardH;
    const halfW = (s.lensWidth * width) / 2;
    const halfH = (s.lensHeight * width) / 2;

    for (let i = 0; i < n; i++) {
      const slot = slots[i];
      if (slot.loaded && slot.ready < 1) {
        slot.ready = Math.min(1, slot.ready + dt / 0.45);
        animating = true;
      }
    }

    const waiting = !intro.done;
    if (dirty || animating) {
      dirty = false;
      const effects = introEffects();
      const dpr = renderer.dpr;
      cardProgram.uniforms.uResolution.value = [width, height];
      cardProgram.uniforms.uDpr.value = dpr;
      cardProgram.uniforms.uRadius.value = s.radius;
      const shrink = 1 - clamp01(s.squeeze) * energy;
      const draws = [];
      for (let i = 0; i < n; i++) {
        const w = m.widths[i];
        const baseRel = wrap(m.centers[i] - pos, m.loop);
        for (let k = -3; k <= 3; k++) {
          const rel = baseRel + k * m.loop;
          if (Math.abs(rel) - w / 2 > width + 40) continue;
          const fx = effects.card ? effects.card(rel) : null;
          const x = homeX + rel + (fx ? fx.x : 0);
          const scale = shrink * (fx ? fx.scale : 1);
          const alpha = fx ? fx.alpha : 1;
          const cw = w * scale;
          if (alpha <= 0.001 || x + cw / 2 < -40 || x - cw / 2 > width + 40) continue;
          draws.push({ i, rel, x, y: homeY + (fx ? fx.y : 0), cw, ch: cardH * scale, alpha });
        }
      }
      draws.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
      let first = true;
      for (const draw of draws) {
        const slot = slots[draw.i];
        cardProgram.uniforms.tMap.value = slot.texture;
        cardProgram.uniforms.uRect.value = [draw.x, draw.y, draw.cw + 2, draw.ch + 2];
        cardProgram.uniforms.uSize.value = [draw.cw, draw.ch];
        cardProgram.uniforms.uImage.value = slot.image;
        cardProgram.uniforms.uAlpha.value = draw.alpha;
        cardProgram.uniforms.uReady.value = slot.ready;
        cardProgram.uniforms.uShift.value = reducedMotion ? 0 : Math.max(-1, Math.min(1, draw.rel / (width * 0.75)));
        cardProgram.uniforms.uPlaceholder.value = slot.color;
        renderer.render({ scene: cardMesh, target, clear: first });
        first = false;
      }
      if (first) {
        renderer.bindFramebuffer(target);
        gl.viewport(0, 0, target.width, target.height);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      renderer.bindFramebuffer();
      target.texture.bind();
      gl.generateMipmap(gl.TEXTURE_2D);

      lensUniforms.uResolution.value = [width, height];
      lensUniforms.uDpr.value = dpr;
      lensUniforms.uCenter.value = [lens.x, lens.y];
      lensUniforms.uHalf.value = [Math.max(halfW, 1), Math.max(halfH, 1)];
      lensUniforms.uAngle.value = (s.tilt * Math.PI) / 180;
      lensUniforms.uExponent.value = 2 + Math.pow(1 - clamp01(s.roundness), 1.5) * 10;
      const spanW = Math.max(halfW, 1);
      const spanH = Math.max(halfH, 1);
      const inner = Math.max(4, s.reach * (spanW + spanH) * 0.5);
      lensUniforms.uInner.value = inner;
      lensUniforms.uOuter.value = inner * 1.6;
      lensUniforms.uFlow.value = s.bend * (spanW + spanH) * 0.45;
      lensUniforms.uCurl.value = s.curl === 'rise' ? 1 : s.curl === 'fall' ? -1 : 0;
      lensUniforms.uDispersion.value = s.dispersion * 0.12;
      lensUniforms.uStrength.value = effects.strength;
      lensUniforms.uSceneAlpha.value = effects.sceneAlpha;
      renderer.render({ scene: lensMesh });
    }

    if (visible && (animating || waiting || dirty)) raf = requestAnimationFrame(frame);
  };

  const start = () => {
    if (raf || !visible || !alive) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  const onVisibility = () => { if (!document.hidden) start(); };
  document.addEventListener('visibilitychange', onVisibility);

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    start();
  });
  intersectionObserver.observe(container);

  resize();
  setItems(options.items || []);

  return {
    /* Where the row is asked to be, in pixels along it. */
    drive(value) {
      goal = value;
      dirty = true;
      start();
    },
    /* The length of one turn of the row, so the page can map a scroll onto it. */
    loop() {
      return (layout || metrics()).loop;
    },
    /* The shape of the row, when the canvas changes between phone and desk. */
    set(next) {
      Object.assign(s, next);
      dirty = true;
      start();
    },
    wake() {
      dirty = true;
      start();
    },
    destroy() {
      alive = false;
      visible = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      slots.forEach(slot => slot.dispose());
      slots = [];
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }
  };
}
