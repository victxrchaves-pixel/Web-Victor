# Victor Chaves — portfolio

Two pages built from the Figma file `ItsVictorChaves`: the
[landing, node `291:488`](https://www.figma.com/design/hcXyUBt9PtmNsvvoUE86IH/ItsVictorChaves?node-id=291-488),
and the
[projects list, node `465:2154`](https://www.figma.com/design/hcXyUBt9PtmNsvvoUE86IH/ItsVictorChaves?node-id=465-2154).

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
index.html              the landing, in Spanish
projects.html           the full list of projects, in Spanish
<project>.html          one page per project, in Spanish
en/                     the same sixteen pages in English
404.html                answers for every address that has none
tools/                  the two scripts that split the languages, once
assets/css/styles.css   tokens, layout, motion
assets/js/main.js       reveals, menu, marquee, clock
assets/img/*.webp       row thumbnails, cut from the originals (2× display size)
assets/img/large/*.webp the same shots at 705px tall, for an expanded row
assets/video/*.mp4|webm the slots whose piece is a film, at thumbnail size
assets/video/large/*    the same films at 705px tall, for an expanded row
assets/img/about-portrait.webp  the portrait in the About window
assets/icons/*.svg      logo, menu, arrow, status dot
assets/icons/soft/*.svg the ten tool marks in About
assets/icons/social/*.svg  Instagram, TikTok and LinkedIn, in the About card
assets/cv/              where the CV PDF goes (see below)
assets/fonts/*.woff2    Geist + Geist Mono, self-hosted (latin subset),
                        and Nuvra, the typeface the Nuvra row is set in
```

## Two languages, two trees

Each language has its own address: the Spanish pages at the root and the
English ones under `/en/`. A page carries one language and says so on
`<html>`; the selector in the menu is a pair of links to the same page on
the other side, and each page names its twin with `hreflang`.

It was not always so. Until October 2026 both languages travelled in the
same markup — the Spanish written out, the English waiting in a twin block
or in an attribute — and one address served both. That reads well in a
browser and badly in a search engine, where there was no English address at
all. `tools/split_languages.py` and `tools/build_english.py` are the two
scripts that cut it in two, kept here as the record of how. **They are not
meant to be run again**: they read a bilingual page, and there are none
left.

What that means day to day: **a change to the content has to be made on
both sides**. The two trees have the same shape file for file, so the same
edit applies twice.

## Editing the content

Everything editable lives in `index.html` and `projects.html` (and their
English twins under `en/`):

- **Projects** — each one is an `<li class="row">` inside `.work__list`: the
  name, its `<span class="tag">` labels, the thumbnails in `.thumbs` and the
  `.row__panel` the toggle opens. To add a project, copy a whole `<li>`, swap
  the text and images, and shift every `--y` below it by 198.
- **Thumbnails** — drop new files into `assets/img/` and point the `src` at
  them. A row's strip can hold any number of shots: the one thing that has to
  be recomputed is each large shot's `--dx`, which is
  `thumbnail left − (shots --x + the widths and 33.571 gaps of the shots before
  it)`; `--mdx` is the same sum on the phone canvas, with the scroller at 15
  and a 22.857 gap. Keep the `width`/`height` attributes matching the file so the page does
  not jump while images load; a thumbnail's `--w` sets its width. Each one has a
  705px-tall twin in `assets/img/large/` for the expanded strip, whose `--w` is
  `470 x (thumbnail width / thumbnail height)`.
- **Services** — the four `<ul class="services__col">` lists.
- **Links** — the social chips in the hero and the footer, and the three icons
  in the About window, all point at `@chavescerrejon` on Instagram, TikTok and
  LinkedIn, and every `mailto:` on the site is `chavescerrejon@gmail.com`. The
  Cal.com handle for a call is still `itsvictxrchaves`.
- **Row copy** — an open row shows a `.row__desc` paragraph. BareFolio's is the
  designer's own; IDLE CBD Oil, Fernet Branca and Atlas carry placeholders
  written from what their images show, and should be replaced with real project
  copy.
- **The View Project buttons currently link to `#contact`.** When a case study
  exists, point each row's `.row__cta` at its page.
- **The CV PDF is missing.** The About window's first row offers
  `assets/cv/victor-chaves-cv.pdf` for download. Put the file there and the row
  appears; until then the window asks for it once on opening, finds nothing and
  takes the row out rather than handing a visitor a 404. Nothing else to change.
- **About** — the copy lives in `#about` at the end of `index.html`, one
  `<section class="about__sec">` per record. Each carries a `data-about-sec`
  name, which is the label the rail's tick announces, so adding a section adds
  its tick with it.

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
- **A transformed ancestor becomes the containing block for `position: fixed`
  descendants.** Centring `.nav` on the phone column with
  `transform: translateX(-50%)` quietly re-anchored the menu's scrim to it, and
  `.nav` is `height: 0` — so the scrim measured 390 × 0 and the page behind the
  open menu was never dimmed. It is centred by arithmetic instead:
  `left: calc(50% - 201 * var(--u))`.

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

The fold animates transforms only. The frame owns the page's scroll height, so
it takes its new height in one step — at once on the way open, and after the
fold on the way closed, so the ground is never missing from under the footer —
rather than being transitioned, which would relay out the whole canvas on every
frame. Nothing scrolls the page: the row you clicked stays where it is and the
panel grows from it.

A fold promotes the layers it moves only while they are moving: `is-folding`
goes on the frame for the length of the transition and comes off again, so the
marquee and the row layers are not held in compositor memory for nothing.

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

A pan is handed to the scroll container under the finger, and WebKit will not
hand it to one that is `pointer-events: none` however reachable its contents
are — Chromium will, which is why the expanded strip only ever scrolled there.
So the scroller only wears that while a shot is in flight and needs the band
above the strip: once the fold lands, `is-settled` shrinks it onto the strip,
whose floor does not move because the track is bottom-aligned, and it takes
its pointer events back. Test touch behaviour in WebKit, not only in Chromium.

The thumbnail only lets go once the shot covering it can be drawn — `is-handed`
lands when every image in the row has loaded — so a cold click never shows a
gap.

The phone canvas has no intro paragraph — the comp drops it — and since this
is a canvas of absolute coordinates, hiding it is not enough: everything below
carries its own `--my`, so the whole page under it closes the 186px it used to
occupy.

The band that runs between the services and the contact block starts off the
left edge of the phone canvas, so its first frames never enter the viewport and
lazy loading never fires for them — they would stay grey for good. An observer
on the band hands them over as it comes near.

The large shots are not in the initial payload. A row fetches its own the first
time the pointer settles on it, or when it opens.

## The projects page

`projects.html` is the same canvas as the landing, traced from node `465:2154`
(1728 x 3907). It reuses every rule and every script the landing has: the rows,
the fold, the two pop-ups and the menu are the same code, so a change to a row
is a change on both pages.

Three things are page-level rather than shared:

- **The frame's height.** `.frame` now reads `--frame-h` and `--mframe-h`, and
  each page states its own comp heights inline (`4484`/`4406` for the landing,
  `3907`/`5457` here). The CSS keeps the landing's as fallbacks.
- **The opening label.** The pill starts on whatever `#navLabel` already says
  in the markup — `ChavesCerrejon` on the landing, `Work` here — and the spy
  takes over from there.
- **The phone column.** The comp has no phone frame for this page, so the phone
  canvas is an interpretation: the filter wraps under the heading, the rows keep
  the landing's own rhythm (one every 290, starting at 310), and the contact
  block and footer keep the offsets the phone comp already set for them, rebased
  onto the display line at 4470.

The list runs to fourteen projects. The landing's "Work ( + )" button and the
"Work" item in both menus come here.

### Filtering by category

The chips beside the heading show one category at a time; pressing the pressed
one gives the whole list back. Each row names its own categories in `data-cat`,
taken from the tags the comp gives it.

On a traced canvas hiding a row cannot close the gap it leaves, so the rows
under it have to be told how far up to come. Two custom properties carry that,
alongside the fold's own `--push`:

- `--ry`, on each row: the distance from its place in the comp to the place it
  takes once the rows above it are gone. Zero with no filter on, so the comp's
  coordinates stand.
- `--trim`, on `.frame`: the whole height the filter has taken out. `.shift`
  rides it with `--push`, and the frame's height adds both.

Row heights come from the comp itself - the distance from one rule to the next -
rather than from a single step, so a filtered list keeps the spacing the comp
gives each row. The frame gives height back only once everything has moved
(`.is-untrimming` drops that delay when the list is growing again, the way
`.has-open` does for the fold), and a row that is open when the filter changes
is folded shut first, since the gap it was filling is about to move.

Three tags in the comp - Typeface, Photography and Clothes - have no chip of
their own, so Nuvra, and nothing else, falls out of the list under every filter.
That is the comp's data, not a rule in the code: give the row a category a chip
names and it comes back.

### The Nuvra row is a specimen

Nuvra is a typeface of his own, so that row is the face rather than photographs
of it, open or closed. Closed, the strip is one line of the alphabet interleaved
— `AaBbCc…Zz` — set at 124 and running off the frame's right edge, exactly as
the comp draws it. Open, the same line runs at 400 and scrolls sideways like any
other row's strip. The row is marked `.row--type` and carries
`data-face="Nuvra"`.

The closed line's size and position were read off the comp rather than guessed:
the render of node `465:2154` puts the capital A's ink at x 1165, its cap height
at 93px and its baseline 143 under the row's rule, which is a 124 font-size on
the text box the comp puts at x 1160.

Three things follow from it, and all three are general rather than special-cased:

- **The face is warmed, not swapped.** `@font-face` for Nuvra is
  `font-display: block`, because a specimen shown in Geist for a moment is worse
  than one that arrives a moment late. `loadShots()` — the same hook that
  fetches a row's photographs on a deliberate hover — asks for any `data-face`
  the row names at the same time.
- **The hand-over waits for the face.** `handOver()` holds the thumbnails in
  place until every shot can be drawn; with no shots to wait for it waits on
  `document.fonts.load()` instead, and only then fades them.
- **The strip makes the flight, not the letters.** The other rows' shots each
  start on their own thumbnail, so each carries its own `--dx`/`--dy`/`--s`.
  Closed and open, the alphabet is the same line of the same face at two sizes,
  so one transform does for all of it: `--ts` is the ratio of the two sizes and
  `--tdx`/`--tdy` the distance between the two lines' origins. The letters only
  fade in behind it. The glyphs carry no `--w`/`--dx`/`--s` of their own, so the
  track's declarations for them are invalid and fall back to `auto` and `none` —
  which is what a line of type wants anyway. The start of the flight lands on
  the closed line to 0.01px in both Chromium and WebKit.

The open line is centred on its ink, not on the face's own box: Nuvra's ascent
and descent make the box sit low, so the glyph's `line-height` is set below its
`font-size` to put the same air over the capitals as under the descenders.
Fifty-two letters make a long strip — about eight screens on a desktop and
rather more on a phone. That is the point of it.

`assets/img/nuvra-0*.webp` are the four specimen posters the row used to show.
Nothing points at them now; they are kept for the case study.

### Where the pictures come from

Every thumbnail and every expanded shot is cut from the project's own original,
centred on the comp's box: the thumbnail at twice the box, the shot at 705 tall.
Four slots in the BareFolio row and one in Fernet Branca have no still of their
own, so they are frames lifted from that project's video.

Nothing is exported from Figma any more. Figma's own renders were only ever a
stand-in while the originals were out of reach.

Seven slots are films rather than photographs, so they play instead of showing
one frame: the five in BareFolio, Bruma's second and NOX's second. The last two
were found rather than chosen - the picture the comp puts in those slots turns
out to be a frame of that project's own video, which is what says the slot is a
film. Each clip is cut to its box, trimmed to the eight seconds around that
frame, and shipped twice: H.264 first, because it is both smaller here and what
every shipping browser decodes, then VP9 for the builds without it.

The poster on each one is that clip's own first frame, so the still and the loop
agree and nothing jumps when the file lands. Nothing is fetched until the slot is
near the screen, and a clip that scrolls away is paused; with
`prefers-reduced-motion` nothing is fetched or played at all and the poster is
the whole of it. Without JavaScript the same poster is what shows, which is why
the films are addressed through `<source>` children rather than a `src`: the
element can then be left entirely alone until something asks for it.

## A project's own page

`barefolio.html` is the first of fourteen, traced from node `330:2020`
(1728 x 5204). It is the same canvas again - the same `--u`, the same bar, the
same two pop-ups - laid out as a column of writing on the left and the work on
the right, piece under piece with no gutter between them: the comp butts them
edge to edge and so does this.

**The writing holds still while the work goes past.** `.project__info` is given
the mosaic's whole height to live in, and `.project__info-in` sticks to the top
inside it, so the column travels with the reader and comes to rest exactly as
the last piece arrives. Sticky needs a containing block to be bounded by, which
is what that outer box is for; it also means the column's children are placed
against the block rather than the frame, so their numbers are the comp's minus
the block's own top. On a phone there is no second column to pass, so the
pinning is dropped and the writing simply comes first.

A piece is a film wherever the piece itself is a film - on this page eight of
the ten are - and plays under the same rules as the strips: nothing fetched
until it is near the screen, paused when it leaves, poster only under
`prefers-reduced-motion` or without JavaScript. The project's own logotype is a
piece of the mosaic too, and it is the drawing itself: an SVG straight out of
the comp, so it is sharp at any size and takes the page's own ground rather
than a picture's.

**The writing is the comp's, line break for line break.** Each paragraph is a
list of lines in the project's table and the breaks are set where the comp sets
them, since they are placed by hand and not by the measure. They are
`u-desk` breaks: the comp tuned them to a 635 column and a phone's 372 would
make nonsense of them, so the phone lets the text find its own.

The phone canvas for these pages is on hold at the author's request, so the
numbers below the breakpoint are laid out but not tuned.

The thirteen other pages follow this one. `projects.html` points "View Project"
at a page as soon as that page exists; until then it still points at the
contact block.

## The two pop-ups

About and Contact are windows over the landing, not pages: both sit at the end
of `index.html`, outside the canvas, and the menu's links open them. They are
the same thing twice — a `.sheet` with the shell they share (`.sheet__scrim`,
`.sheet__dialog`, `.sheet__head`, `.sheet__close`, `.sheet__scroll`) and its own
content inside. One controller in `main.js` opens, closes, locks and traps focus
for whichever is up; `data-sheet-open` on a link says which, `data-sheet-label`
on the window says what the bar should read while it is. Adding a third is a
`.sheet` with a size rule and a link.

**Contact** is traced from Figma · Contact View (`468:2538`) and Mobile Contact
(`468:3011`): 1036 x 565.935 comp pixels, the display line and the two buttons
down a 625 column, the marks and the address at the foot of a 239 one beside it.
The phone comp folds the two into one and puts the address straight after the
note, so that is the order of the markup and the wide canvas lifts the
right-hand pair out of the flow at the comp's own coordinates. Its block is
named `touch__` rather than `contact__`, which the landing's own contact section
already owns.

**About** is traced from Figma · About View (`450:1399`) for the window, the
phone About (`450:1797`) for the small one, About Info (`448:507`) for the copy.
The wide
window is 1036 x 733 comp pixels and rides the same `--u`, so it scales with
everything else and hangs from y=90, just clear of the pill. The phone one
takes the whole screen: full bleed, full height, and the bar hidden while it is
up, so the window is the view rather than something laid over it. Its head sits
at 47 rather than 11 and is inset further than the information under it, so the
dash comes in off the corner; it is the only way out, so it carries a 44px
target under the comp's 24px mark.

Five things are worth knowing.

**The landing is held still behind it.** Every overlay here - the menu and the
About window - locks the page while it is up: `html.is-locked` takes the body
out of the scroll flow with `position: fixed` and `main.js` holds the offset so
it goes back exactly where it was. `overflow: hidden` on the body alone does not
hold on iOS, which is why. A count keeps two overlays from releasing each
other's hold, and while the About window is up the bar answers nothing - a tap
on it falls through to the scrim, which closes the window. Anything added later
that takes over the screen should call `lockPage()` / `unlockPage()` the same
way.

**Only the information moves.** The portrait, the three social icons and the
contact lines are `position: absolute` against the dialog while the text beside
them is inside the scroller, so the block stays put without `sticky` and without
a second scroll container. The phone comp makes that same block the head of the
column - portrait beside the name, the contact at the foot of it - so it leads
the markup and the desktop position is the one that is lifted out.

**The phone reads the record in a different order.** The wide comp puts Events
second, the phone one fourth. `.about__sections` is a flex column, so the order
is CSS rather than a second copy of the markup; the rail then re-hangs its own
marks by measured position, so what the eye sees and what the tab key does stay
the same. The comp also leaves 116 between the name and the social marks, which
on a phone reads as a hole rather than as air, so the contact block comes up
under the name instead.

**The rail is the scrollbar.** The real one is taken away and the left gutter
carries a 1px track instead. The phone comp leaves no gutter - the column needs
its full 366 for the portrait and the name beside it - so there the rail goes
under the window's own padding, against the edge, with smaller marks. The bright segment on it is the window you are
looking through - its length is how much of the information fits on screen, its
place is where that is - and each tick is a section you can jump to, named for
a screen reader by its `data-about-sec`. Ticks and segment share one scale
(a fraction of the whole content), so they always line up, and a hidden section
takes its tick with it.

**They open without JavaScript.** `.sheet:target` is the way in, so the menu's
`href="#about"` and `href="#get-in-touch"` work on their own and the close control and the scrim are real
links back out. With JavaScript the class takes over, the hash is left alone,
and closing clears it if a deep link set it. Opening reveals through one forced
reflow rather than a frame callback: a callback only runs when the engine
chooses to paint, and in WebKit that need not be at once - the window stayed at
opacity 0 until something else asked for a frame.

Escape closes it, focus is held inside while it is open and handed back to the
menu button after - not to the link that opened it, which is inert by then.

**The menu unfolds over them.** The bar stays live with a window up: opening the
menu does not put the window away, it comes down on top of it with its own
scrim, and closing the menu leaves the window where it was. While the menu is
up it owns the keys and the focus ring, so its Escape stops there - that is what
`stopImmediatePropagation` in its handler is for, since the window's own handler
is registered after it and would otherwise see the same key. On the phone the
bar is hidden with a window up, so this is a wide-canvas affair.

**They open with a pop and shut without one.** `--ease-pop` overshoots a little
and `--ease-shut` does not; the window grows out of the top edge it hangs from
on the wide canvas and rises from the bottom one on the phone, where it fills
the screen and a scale would pull its own edges in. Each direction has its own
curve because a transition is the one declared on the state being moved to: the
shut one sits on `.sheet__dialog`, the open one on `.sheet.is-visible`.

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
3. **"CURRICULUM VIATE"** and **"LENGUAGES"** in About Info ship as
   `Curriculum Vitae` and `Languages`.
4. The About window's opening paragraphs wrap to their column rather than
   keeping the comp's hand-placed line breaks, which only hold at one width.
5. The window's glass is blurred by 12px, not the comp's 3.3px. At comp size
   3.3 is enough to wash the page out; on a phone the window covers nearly the
   whole screen and the display type behind it read straight through.
6. The comp is a static frame, so the motion below is additional by request.
7. The projects list sits 90 higher than the comp places it, and the filter's
   chips become one scrolling line on the phone. The comp leaves nearly 300 of
   air over the heading, which at a laptop's height ends the page exactly on
   the second row: two rows, perfectly framed, and no sign that there are
   twelve more. Taking 90 of that air back lets the third row show about a
   quarter of itself above the fold, which is what tells the reader to scroll.
8. Two thumbnails in the projects comp — Bruma's second and NOX's second — are
   drawn as empty boxes. The slot is kept rather than closed up, as a grey
   `.thumbs__slot` / `.shot--slot`, so the strip holds the comp's rhythm and the
   picture drops straight in when it is shot.
9. Every row description except BareFolio's is placeholder copy, and every
   "View Project" points at the contact block until the case studies exist.

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
