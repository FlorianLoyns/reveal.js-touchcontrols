# Reveal - TouchControls

[![reveal.js plugin](https://img.shields.io/badge/reveal.js-plugin-2C4A6E.svg)](https://revealjs.com) [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

On-screen controls that make [reveal.js](https://revealjs.com) easy to operate on touch displays and smartboards: annotate with a pen, zoom into a spot, blank the screen, open the overview, go fullscreen. No keyboard or mouse needed. Standalone (ships its own CSS) and a natural companion to [Smallcontrol](https://github.com/Martinomagnifico/reveal.js-smallcontrol).

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

- **Pen** — tap cycles off → colour 1 → colour 2 → off; the button shows the active colour. Long-press the pen to erase the current slide. Marks clear on the next slide.
- **Zoom** — tap the magnifier, then tap the spot you want to enlarge; tap again to reset.
- **Pause · Overview · Fullscreen** — one tap each.

Buttons turn white automatically on dark slides, and the toolbar fades out when idle (returns on movement).

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
    buttons: ['pen','zoom','pause','overview','fullscreen'], // which buttons + order
    autohide: true,
    autohideDelay: 3500           // ms before hiding
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
| `buttons` | all five | Buttons shown, and their order |
| `autohide` | `true` | Hide the toolbar when idle |
| `autohideDelay` | `3500` | ms before hiding |

## Like it?

Star the repo.

## License

MIT — see [LICENSE](LICENSE). Thanks to Hakim El Hattab (reveal.js) and Martijn De Jongh (Smallcontrol).
