# Changelog

Every notable change to Cobweb, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

Add a line under **Unreleased** as you work. On release, rename that heading to the version and
date, and start a new empty **Unreleased** above it.

## [Unreleased]

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
