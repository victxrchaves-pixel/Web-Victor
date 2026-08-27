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

## Notes on fidelity

Three deliberate departures from the comp, all recorded here so they are easy to
revert:

1. **Contact heading leading.** The comp sets `BRIEF ME / SOMETHING.` at 66%
   line height, which makes the two lines collide in a browser (the F of BRIEF
   is eaten by the line below). It ships at 86%, matching the other display
   heading.
2. **Hero scrim.** A gradient darkens the top of the hero image so the nav and
   `WORK TOGETHER` clear WCAG AA contrast (2.2:1 in the comp, 5.5:1 now).
3. **"ShEudle A call"** in the comp is spelled `Schedule A Call`.

The empty thumbnail slots in the Figma frame were component instances whose
fills were not inlined in the export; they are rendered from node screenshots so
no artwork is missing.
