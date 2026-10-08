# AGENTS.md

Single-page p5.js sketch ("pelota que rebota" / bouncing ball). Two files:
`index.html` (page + CDN script tags) and `sketch.js` (all app logic).

## Running

There is **no** package.json, build step, linter, or test suite. Do not run `npm`/`node`.

- Open `index.html` directly in a browser (`file://` works), or serve the folder
  with any static server.
- Verification is visual only. The ball is pastel blue, turns pastel pink when it
  hits any edge (then back to blue in the air), plays a short blip per bounce,
  and freezes while the cursor is over it.
- Audio only starts after a user gesture (browser autoplay policy). `mousePressed`
  / `touchStarted` call `userStartAudio()`; the on-canvas hint disappears after that.

## Gotchas

- p5 and p5.sound are pulled from a CDN, so the sketch needs network access:
  `p5@2.3.3` and `p5.sound@0.4.1`. p5.sound is a separate npm package now — there
  is no `p5/lib/addons/p5.sound.js` in p5 2.x. Pin both versions together.
- `index.html` also loads Google Fonts (`Chewy`) for the "Pelotita Loca" title
  and holds the CSS reset (no body margin, full-window canvas). The title is a
  fixed, `pointer-events:none` overlay so it never blocks the canvas.
- The p5.sound API changed from the old library. `p5.Envelope` wraps a Tone.js
  `AmplitudeEnvelope` (`setADSR`, `play`, `triggerAttack/Release`; there is no
  `setRange`), and `p5.MonoSynth` is deprecated. Sound chain: `p5.Oscillator` ->
  `p5.Envelope` -> output, built in `iniciarSonido()`.
- `sketch.js` is loaded as a plain global script, not an ES module. It relies on
  p5 globals (`setup`, `draw`, `createCanvas`, `windowWidth`, `windowHeight`,
  `userStartAudio`); keep the `<script>` tag non-module or these break.
- Canvas is full-window and `windowResized` resizes it.
- Physics lives in helpers, not inline in `draw()`: `moverPelota()`,
  `rebotarEnBordes()`, `cursorEncima()`, `emitirSonido()`; tuning constants are
  `RADIO` and `GRAVEDAD` at the top. The ball freezes when `cursorEncima()` is
  true, so `draw()` returns before moving it.
