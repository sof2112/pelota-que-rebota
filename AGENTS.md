# AGENTS.md

Single-page p5.js sketch ("Pelotita Loca" / bouncing shape). Two files:
`index.html` (page + CDN script tags + CSS reset/title) and `sketch.js` (all logic).

## Running

There is **no** package.json, build step, linter, or test suite. Do not run `npm`/`node`.

- Open `index.html` directly in a browser (`file://` works), or serve the folder
  with any static server.
- Verification is visual: a shape moves on its own with real physics, bounces off
  all four edges **changing shape** (círculo → triángulo → cuadrado → pentágono →
  círculo), plays a blip and flashes pastel pink per bounce, freezes while the
  cursor is over it, and the mouse emits pastel particles that fade after 10 s.
- Audio only after a user gesture; `mousePressed`/`touchStarted` call `userStartAudio()`.
- Testing tip: this agent's browser tab does not run `requestAnimationFrame`
  (`frameCount` stays 0). To exercise the logic, call `draw()` and
  `world.physicsUpdate()` manually in a loop.

## Gotchas

- **Script load order is pinned and matters** (`index.html`):
  `p5@1.11.4` → `p5.sound@0.4.1` → `p5play@3.35.5/planck.min.js` →
  `p5play@3.35.5/p5play.min.js` → `sketch.js`. `planck.min.js` must load before
  p5play. p5play only supports p5 1.10–1.11: with p5 2.x it logs
  "does not support p5.js" and the loop won't start, so don't bump p5 to 2.x
  without removing p5play (and vice versa).
- p5.sound 0.4.1 is a separate package (no `p5/lib/addons/p5.sound.js` in p5 2.x)
  with a Tone.js-based API: `p5.Envelope` wraps a Tone `AmplitudeEnvelope`
  (`setADSR`/`play`/`triggerAttack`/`triggerRelease`; there is no `setRange`), and
  `p5.MonoSynth` is deprecated. Sound chain: `p5.Oscillator` → `p5.Envelope`.
- Physics is p5play (planck.js): `world.gravity`, four static wall sprites placed
  just off-screen, and a dynamic ball. The ball changes shape by **rebuilding its
  collider**: `pelota.removeColliders()` then `pelota.addCollider(0, 0, d)` for a
  circle, or `addCollider(0, 0, side, name)` for a regular polygon (name:
  `triangle`/`square`/`pentagon`). This preserves position/rotation/velocity.
  Because of that, `pelota.shape` is NOT updated by a change — read the current
  shape from the fixture (`pelota.fixture.m_shape`).
- p5play auto-steps physics and auto-draws all sprites inside p5's pre/post hooks,
  so `sketch.js` never draws the ball itself; it only sets `pelota.color`. Wall
  sprites use `visible = false`.
- Particles are **plain p5 objects** (`particulas` in `sketch.js`), NOT p5play
  sprites: `emitirParticulas` / `actualizarParticulas` / `dibujarParticulas` run
  inside `draw()` using `millis()` for the 10 s lifetime (cap `MAX_PARTICULAS`).
  Keep them out of the physics world for performance; there can be hundreds alive.
- `index.html` holds the CSS reset (no body margin, full-window canvas) and the
  fixed `pointer-events:none` "Pelotita Loca" title; it loads Google Fonts
  (`Chewy`), so the page needs network.
