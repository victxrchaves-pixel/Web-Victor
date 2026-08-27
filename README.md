# Victor Chaves — portfolio landing

Landing page built from the Figma design
[`ItsVictorChaves`, node `291:488`](https://www.figma.com/design/hcXyUBt9PtmNsvvoUE86IH/ItsVictorChaves?node-id=291-488).

Static HTML, CSS and JavaScript. No build step, no dependencies, no framework:
open `index.html` and it works.

## Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

A plain double-click on `index.html` also works, though a local server is closer
to how it will behave once deployed.

## Deploying

Any static host serves this as-is — upload the whole folder. Netlify, Vercel,
GitHub Pages, Cloudflare Pages and normal shared hosting all work without
configuration.

## Structure

```
index.html              all the markup
assets/css/styles.css   tokens, layout, motion
assets/js/main.js       reveals, menu, marquee, clock
assets/img/*.webp       artwork exported from Figma (resized to 2× display size)
assets/icons/*.svg      logo, menu, arrow, status dot
assets/fonts/*.woff2    Geist + Geist Mono, self-hosted (latin subset)
```

## Editing the content

Everything editable lives in `index.html`:

- **Projects** — each one is an `<li class="row">` inside `.work__list`: the
  name, its `<span class="tag">` labels and the thumbnails in `.row__thumbs`.
  To add a project, copy a whole `<li>` and swap the text and images.
- **Thumbnails** — drop new files into `assets/img/` and point the `src` at
  them. Keep the `width`/`height` attributes matching the file so the page does
  not jump while images load. Wide thumbnails carry `class="is-wide"`.
- **Services** — the four `<ul class="services__col">` lists.
- **Links** — the social chips point at generic profile URLs
  (`https://www.instagram.com/` and friends). Replace them with the real
  profiles. The email is already `itsvictxrchaves@gmail.com`.
- **The project rows currently link to `#contact`.** When a case study exists,
  point `.row__link` at its page.

Colours, type sizes and spacing are custom properties at the top of
`styles.css`, all derived from the Figma frame.

## Motion

Scroll reveals, the outlined heading, the image marquee and the hover states are
in `styles.css` under their sections; `main.js` only adds the class that starts
them. Everything respects `prefers-reduced-motion`, hover effects are gated to
real pointers, and with JavaScript disabled the whole page renders visible and
static.

## Fidelity

The desktop layout is a trace of the comp, not an interpretation. The frame is
1728 x 4544; `--u` in `styles.css` is one frame pixel, and every element carries
the comp's own numbers in its `style` attribute:

```html
<p class="t label" style="--x:99; --y:577.871; --w:195; --fs:15.485; --lh:20">
```

`--x/--y` position, `--w/--h` size, `--fs/--lh` type. Nothing is eyeballed, so
correcting a position means editing the number the design gives you. The whole
composition scales with the viewport, so it stays the comp at any width; below
900px the same elements reflow into one column (the comp has no mobile frame).

Measured against a 1728 x 4544 render of the Figma node, 0.59% of pixels differ
strongly, and that remainder is text antialiasing plus WebP recompression of the
photography. Every text block, rule, thumbnail strip and button lands within one
pixel of the comp.

Details worth knowing, because they are easy to get wrong:

- **"Everything" is not text in the comp** — it is a frame of ten vector
  outlines (`322:1309`). Setting it as live text with `-webkit-text-stroke`
  breaks the H: Geist draws that glyph from overlapping contours, so stroking it
  exposes the internal edges. The design's own SVG ships at
  `assets/icons/everything-stroke.svg`.
- **The hairlines are pure white at 1px**, and the comp rasterises them one row
  above the stated y. Both are reproduced.
- **The right-aligned hero lines end with a space** in the comp, which sets the
  text one character in from the right edge. Preserved with `&nbsp;`.
- The nav's "Work Together" has a faint white stroke that the Figma code export
  reported as fully transparent; it is taken from the rendered comp instead.

### Known accessibility cost of the trace

`WORK TOGETHER` is white type over the bright sky: **1.44:1**, where WCAG AA
wants 4.5:1. The comp has the same issue, and tracing it faithfully was the
instruction. The rest of the hero passes (4.03:1 and 4.69:1 against the 3:1 that
large text needs). To fix it without touching any position, add to `styles.css`:

```css
.hero::after {
  content: ""; position: absolute; left: 0; top: 0; z-index: -1;
  width: calc(1728 * var(--u)); height: calc(320 * var(--u));
  background: linear-gradient(to bottom, rgba(0,0,0,.78), rgba(0,0,0,.52) 42%, transparent);
}
```

### Deliberate departures

1. **"ShEudle A call"** in the comp is spelled `Schedule A Call`.
2. **"Victor Chaves cerrejon"** ships as `Victor Chaves Cerrejón`, with the
   accent his name takes.
3. The comp is a static frame, so the motion below is additional by request.

## Motion

Scroll reveals, a clip-path wipe on the two display headings, the image band
looping, and pointer-gated hover states. The band sits exactly where the comp
puts it until the script has cloned the track, so a still page is still the
comp. Everything honours `prefers-reduced-motion`, and the hidden-before-reveal
states are armed by script only, so with JavaScript off the page renders
complete and static.
