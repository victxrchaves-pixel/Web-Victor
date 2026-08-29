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
assets/img/*.webp       row thumbnails, exported from Figma (2× display size)
assets/img/large/*.webp the same shots at 705px tall, for an expanded row
assets/icons/*.svg      logo, menu, arrow, status dot
assets/fonts/*.woff2    Geist + Geist Mono, self-hosted (latin subset)
```

## Editing the content

Everything editable lives in `index.html`:

- **Projects** — each one is an `<li class="row">` inside `.work__list`: the
  name, its `<span class="tag">` labels, the thumbnails in `.thumbs` and the
  `.row__panel` the toggle opens. To add a project, copy a whole `<li>`, swap
  the text and images, and shift every `--y` below it by 198.
- **Thumbnails** — drop new files into `assets/img/` and point the `src` at
  them. Keep the `width`/`height` attributes matching the file so the page does
  not jump while images load; a thumbnail's `--w` sets its width. Each one has a
  705px-tall twin in `assets/img/large/` for the expanded strip, whose `--w` is
  `470 x (thumbnail width / thumbnail height)`.
- **Services** — the four `<ul class="services__col">` lists.
- **Links** — the social chips point at generic profile URLs
  (`https://www.instagram.com/` and friends). Replace them with the real
  profiles. The email is already `itsvictxrchaves@gmail.com`.
- **Row copy** — an open row shows a `.row__desc` paragraph. BareFolio's is the
  designer's own; the other three are placeholders written from what their
  images show, and should be replaced with real project copy.
- **The View Project buttons currently link to `#contact`.** When a case study
  exists, point each row's `.row__cta` at its page.

Colours, type sizes and spacing are custom properties at the top of
`styles.css`, all derived from the Figma frame.

## Two canvases

There are two comps, not one design that stretches: 1728 wide for the desktop
and 402 for the phone. Both are traced the same way, so every element carries
two sets of coordinates — `--x/--y/--w/--h` for the wide comp and `--m*` for the
narrow one — and the mobile rule reads `var(--mx, var(--x))`, falling back to
the desktop number wherever the two comps agree.

Two things that technique will bite you with:

- **Custom properties inherit.** `var(--mw, var(--w))` happily picks up an
  ancestor's `--mw` instead of falling back to the element's own `--w`. The
  mobile block clears the whole `--m*` set on the same selector list first;
  an inline value still wins over a stylesheet one, so only the elements that
  were never given mobile coordinates fall through.
- **A `var()` that cannot resolve computes to the property's initial value**,
  not to the declaration above it. An element with neither `--mw` nor `--w`
  ends up `width: auto`, not at the width its own rule set two lines earlier.
  Anything sized outside the shared rule — the nav pill — has to restate its
  box inside the mobile block.

The unit is `100vw / 402` up to 430px and then stops, so the phone column
centres on a tablet rather than being blown up to fill it, and the desktop
canvas takes over at 1280.

The two canvases cannot meet seamlessly. A phone comp pixel is 1/402 of the
viewport and a desktop one 1/1728, so the phone canvas is always the larger of
the two per viewport pixel; solving `cap/402 = W/1728` for a cap no narrower
than the comp itself puts the crossover at 1728px, which is no use. All that
is left is to make the step small: holding the column at 430 and handing over
at 1280, where the desktop unit is 0.741, takes the jump from 1.93x to 1.28x.

A third trap, on top of the two above: `.tag` is deliberately left out of the
`--m*` reset so it can inherit its height from `.tags`, the way it inherits
`--h` on the desktop canvas — which means it inherits the container's left and
width too unless those are cleared on it by name.

## The work rows

Clicking a row expands it: a description, a View Project button and a strip of
large shots you can scroll sideways. Only one row is ever open, and the design
gives an open row 734 comp pixels against a closed row's 198.

On a traced canvas a row cannot simply grow — everything under it has to move.
One custom property carries that distance:

- `.frame` sets `--push` (536, the difference between the two heights);
- `.row.is-open ~ .row` translates by it, so the rows after the open one drop;
- `.shift` puts the same translation on the blocks below the list, and
  `.shift-layer` first flattens a section into a zero-height layer whose origin
  sits on the frame's, so its absolutely positioned children keep the comp's
  coordinates while the section itself moves;
- the frame's own height adds `--push`, so the footer keeps its ground.

The phone canvas works the same way, on its own numbers: an open row there is
690 comp pixels against a closed row's 290, so `--push` is 400 instead of 536,
and `main.js` picks the one that matches the breakpoint. The phone comp shows
`( VIEW + )` at rest on every row, since a finger has no hover to reveal it
with.

Opening a row does not swap one set of pictures for another: each shot begins
life as its own thumbnail. `--dx`, `--dy` and `--s` on every `<li>` carry the
distance between the two boxes and the ratio of their heights, all measured
from the comp, so the shot starts exactly on top of the thumbnail and travels
down into the strip as it grows. The scroller reaches 206px above the strip so
that starting position is not clipped; it takes no pointer events itself, only
its track does, which leaves the row header clickable through it.

The panel that holds the description, the button and the strip is positioned
so its `z-index` actually applies — static, its stacking order is inert and the
row's toggle underneath swallows every click meant for the button.

The thumbnail only lets go once the shot covering it can be drawn — `is-handed`
lands when every image in the row has loaded — so a cold click never shows a
gap.

The band that runs between the services and the contact block starts off the
left edge of the phone canvas, so its first frames never enter the viewport and
lazy loading never fires for them — they would stay grey for good. An observer
on the band hands them over as it comes near.

The large shots are not in the initial payload. A row fetches its own the first
time the pointer settles on it, or when it opens.

## Motion

Scroll reveals, the outlined heading, the image marquee and the hover states are
in `styles.css` under their sections; `main.js` only adds the class that starts
them. Everything respects `prefers-reduced-motion`, hover effects are gated to
real pointers, and with JavaScript disabled the whole page renders visible and
static.

## Fidelity

The desktop layout is a trace of the comp, not an interpretation. The frame is
1728 x 4418; `--u` in `styles.css` is one frame pixel, and every element carries
the comp's own numbers in its `style` attribute:

```html
<p class="t label" style="--x:99; --y:577.871; --w:195; --fs:15.485; --lh:20">
```

`--x/--y` position, `--w/--h` size, `--fs/--lh` type. Nothing is eyeballed, so
correcting a position means editing the number the design gives you. The whole
composition scales with the viewport, so it stays the comp at any width; below
900px the same elements reflow into one column (the comp has no mobile frame).

Measured against a 1728 x 4418 render of the Figma node, 0.78% of pixels differ
strongly, and that remainder is text antialiasing plus WebP recompression of the
photography. Every text block, rule, thumbnail strip and button lands within one
pixel of the comp.

**Line height comes from the box, not from the export.** Figma's code export
reports percentages that do not reproduce (the intro paragraph says 89.31%,
which renders at 37.8px; the real pitch is 49px). Divide the text node's height
by its number of lines instead — that is what `--lh` carries.

Details worth knowing, because they are easy to get wrong:

- **"Everything" is not text in the comp** — it is a frame of ten vector
  outlines (`322:1309`). Setting it as live text with `-webkit-text-stroke`
  breaks the H: Geist draws that glyph from overlapping contours, so stroking it
  exposes the internal edges. The design's own SVG ships at
  `assets/icons/everything-stroke.svg`.
- **The outlined word is a 2px stroke at 122.31px.** Derived by solving the
  comp's own glyph boxes: only a 2px stroke makes the implied size agree from
  both width and height, on every letter. `assets/icons/everything-fill.svg` is
  the matching solid word, built from the font with each glyph placed at the x
  the comp gives it, so the fill registers on the outline exactly.
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

- **The word fills in.** Reaching the services section, "Everything" draws its
  outline in and a solid twin then sweeps over it. This is the one thing that
  changes a resting state the comp defines: after the sweep the word is filled,
  where the comp leaves it outlined. It was asked for. To keep the comp's
  resting state instead, delete the `.stroke-word__fill` span; under
  `prefers-reduced-motion` that is already what happens.
- The hero image settles from a 5% scale on load.
- Section content reveals on scroll with a 60ms stagger; the two display
  headings wipe in with `clip-path`.
- Project rows tint, their `( + )` turns and greens, and the thumbnail strip
  slides. Each row also has a full-width hit area, so the whole band is
  clickable rather than just the text and images.
- The image band loops, pausing on hover. It sits exactly where the comp puts
  it until the script clones the track, so a still page is still the comp.

Hover effects are gated to real pointers, everything honours
`prefers-reduced-motion`, and the hidden-before-reveal states are armed by
script only — with JavaScript off the page renders complete and static.
