# Changelog

Every notable change to Cobweb, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

Add a line under **Unreleased** as you work. On release, rename that heading to the version and
date, and start a new empty **Unreleased** above it.

## [Unreleased]

## [0.3.0] - 2026-11-06

### Added

- `Clock`, a fixed-timestep clock as plain immutable data: steps per frame, a cap on long frames, time scale, pausing
  and an interpolation alpha.
- `Ticker`, which drives a game's `update` and `render` from a `Clock` once per animation frame: start and stop,
  pause, resume and time scale, with a swappable `Scheduler` so it runs without a browser in tests.
- `Keyboard`, the keyboard's state as plain immutable data: held keys, keys pressed or released this step, an axis
  from two keys, and `apply` / `applyAll` for key inputs, with `beginStep` / `endStep` so a press lasts one step.
- `KeyboardListener`, which queues browser key events for `Keyboard` to `drain` once per step, ignoring auto-repeat
  and releasing every held key when the window loses focus.
- `Pointer`, the mouse, pen or touch pointer as plain immutable data: position, movement and wheel this step, left and
  right buttons held, pressed or released, whether it is inside, and dragging, with `apply` / `applyAll` and
  `beginStep` / `endStep`.
- `PointerListener`, which queues an element's pointer events for `Pointer` to `drain` once per step: reads buttons
  from the browser's bitmask so chords register, captures the pointer while a button is down, blocks the right-click
  menu, follows only the primary pointer and releases every button on blur or cancel.

## [0.2.0] - 2026-10-28

### Added

- MIT license.
- `Vec2`, a 2D vector as plain immutable data: arithmetic, length, distance and angles, rotation,
  normalizing, clamping, reflecting, projecting, lerp, min/max, rounding and comparison.
- `Rect`, an axis-aligned rectangle as plain immutable data: making from corners, center or points, edges and corners,
  moving and resizing, point and rect containment, intersection, union, clamping and comparison.

### Changed

- The engine is written in TypeScript (types only, `erasableSyntaxOnly`). Games import the
  compiled `dist/`, which npm builds on install; Node runs the `.ts` tests directly.

## [0.1.0] - 2026-10-20

### Added

- Repo setup: Prettier, EditorConfig and the `node:test` runner.
- `src/index.js`, the public entry point: everything a game may import is exported from here.
- CI on GitHub Actions: formatting and tests run on every push and pull request.
