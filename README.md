# Reveal - TouchControls

[![reveal.js plugin](https://img.shields.io/badge/reveal.js-plugin-2C4A6E.svg)](https://revealjs.com) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

On-screen controls that make [reveal.js](https://revealjs.com) easy to operate on touch displays and smartboards: annotate with a pen, open a whiteboard, focus on a detail, run a countdown timer, blank the screen, open the overview, go fullscreen. No keyboard or mouse needed. Standalone (ships its own CSS) and a natural companion to [Smallcontrol](https://github.com/Martinomagnifico/reveal.js-smallcontrol).

**[Live demo](https://florianloyns.github.io/reveal.js-touchcontrols/demo.html)**

[![Screenshot](screenshot.svg)](https://florianloyns.github.io/reveal.js-touchcontrols/demo.html)

## Installation

Copy the `touchcontrols` folder into your reveal.js `plugin/` folder — or install from npm.

```console
npm install reveal.js-touchcontrols
```

## Setup

**Regular**

```html
<script src="dist/reveal.js"></script>
<script src="plugin/touchcontrols/touchcontrols.js"></script>
<script>
  Reveal.initialize({ plugins: [ RevealTouchControls ] });
</script>
```

**As a module**

```html
<script type="module">
  import Reveal from './dist/reveal.esm.js';
  import RevealTouchControls from './plugin/touchcontrols/touchcontrols.esm.js';
  Reveal.initialize({ plugins: [ RevealTouchControls ] });
</script>
```

## Usage

- **Pen** — tap cycles off → colour 1 → colour 2 → off; the button shows the active colour. Marks belong to the slide they were drawn on: move on, come back later, and they are still there. That way a diagram you annotated in the first half is still annotated when you return to it, and you can build up a slide over several passes. Long-press the pen to erase the current slide; reloading the page starts clean. Set `keepAnnotations: false` for the old behaviour, where every slide change wipes the marks.
- **Whiteboard** — one tap opens a white surface and switches the pen on, so you can write immediately; tap again (or change slides) to close and discard it.
- **Focus** — tap the magnifier, then tap a spot on the slide. The surroundings dim while staying readable, so the audience keeps the context: useful for pointing at one row of a table or one region of a diagram. Tap again and that spot is zoomed in — it stays exactly where it is on screen, so the circle keeps framing it. A third tap resets. While the spotlight is on, drag it with your finger to sweep across a table or walk through a diagram. Set `lupeMode` to `'spot'` or `'zoom'` if you only want one of the two.
- **Timer** — tap to cycle through 5 · 10 · 15 minutes (configurable); a large countdown appears above the toolbar, pulses red at 0:00, and keeps running across slide changes. One more tap turns it off.
- **Pause · Overview · Fullscreen** — one tap each.

Buttons turn white automatically on dark slides, and the toolbar fades out when idle (returns on movement — the timer countdown always stays visible).

Drawing is palm-friendly: only the first touch draws, extra fingers are ignored, and strokes render crisply on high-DPI displays.

## Configuration

All options are optional.

```js
Reveal.initialize({
  touchcontrols: {
    side: 'left',                 // 'left' | 'right'
    bottom: 32,                   // offset from the bottom, px
    accent: '#2C4A6E',            // button colour
    hover: 'rgba(44,74,110,.10)', // button hover colour
    inks: ['#D14A4A', '#2B6CB0'], // pen colours, cycled
    penWidth: 4,                  // stroke width
    buttons: ['pen','whiteboard','zoom','timer','pause','overview','fullscreen'], // which buttons + order
    timerMinutes: [5, 10, 15],    // timer steps, cycled per tap
    autohide: true,
    autohideDelay: 3500,          // ms before hiding
    lupeMode: 'both',             // 'both' | 'spot' | 'zoom'
    spotRadius: 120,              // spotlight radius, px
    spotDim: 0.55,                // how much the surroundings dim, 0–1
    zoomScale: 2,                 // magnification of the zoom step
    keepAnnotations: true         // marks stay on their slide instead of being wiped
  },
  plugins: [ RevealTouchControls ]
});
```

| Option | Default | Description |
|---|---|---|
| `side` | `'left'` | Corner: `'left'` or `'right'` |
| `bottom` | `32` | Offset from the bottom (px) |
| `accent` | `'#2C4A6E'` | Button colour |
| `hover` | `'rgba(44,74,110,.10)'` | Button hover colour |
| `inks` | `['#D14A4A','#2B6CB0']` | Pen colours, cycled |
| `penWidth` | `4` | Stroke width |
| `buttons` | all seven | Buttons shown, and their order |
| `timerMinutes` | `[5,10,15]` | Timer steps in minutes, cycled per tap |
| `autohide` | `true` | Hide the toolbar when idle |
| `autohideDelay` | `3500` | ms before hiding |
| `lupeMode` | `'both'` | Focus behaviour: `'both'` (dim, then zoom), `'spot'` (dim only), `'zoom'` (zoom only, pre-1.2 behaviour) |
| `spotRadius` | `120` | Radius of the spotlight circle (px) |
| `spotDim` | `0.55` | How much the surroundings are dimmed (0–1) |
| `zoomScale` | `2` | Magnification of the zoom step |
| `keepAnnotations` | `true` | Keep pen marks on their slide for the session; `false` clears them on every slide change |

The default button order groups writing (pen, whiteboard), showing (focus), classroom (timer) and presentation controls (pause, overview, fullscreen).

## Changelog

**1.3.0**

- Pen marks now **stay on their slide** for the whole session instead of disappearing at the next slide change. Leave a slide and come back and your annotation is still there — useful for building up a diagram across several passes, or for referring back to what the group worked out earlier.
- Marks survive a window resize or a change of display, scaled to the new size.
- Only the painted region is kept, so remembering a whole lecture's annotations stays cheap. Nothing is written to disk: reloading the page starts with clean slides.
- New option `keepAnnotations`; set it to `false` for the previous behaviour.

**1.2.0**

- The magnifier became a **two-stage focus tool**: the first tap dims the surroundings without hiding them, the second zooms in on the marked point. Because the zoom origin *is* the tapped point, it never drifts away under the spotlight.
- The spotlight can be **dragged** across the slide — sweep a table row by row, or walk through a diagram, without losing the overview.
- New options `lupeMode`, `spotRadius`, `spotDim` and `zoomScale`. `lupeMode: 'zoom'` restores the previous behaviour exactly.
- Pen and focus now switch each other off instead of competing for the same tap.
- The reveal navigation arrows stay usable while focus is active.

**1.1.0**

- New **whiteboard** button: white writing surface, pen switches on automatically.
- New **timer** button: tap-through countdown steps with a large, always-visible display.
- Crisp pen strokes on high-DPI displays (devicePixelRatio-aware canvas).
- Palm rejection: only the primary pointer draws; interrupted gestures end cleanly (pointer capture, `pointercancel`).
- Long-press erase no longer fights the browser context menu on touch devices.
- Faster drawing: only new stroke segments are rendered (with coalesced pointer events).

**1.0.0** — initial release.

## Like it?

Star the repo.

## License

MIT — see [LICENSE](LICENSE). Thanks to Hakim El Hattab (reveal.js) and Martijn De Jongh (Smallcontrol).
