# Changelog

Every notable change to Cobweb, newest first. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

Add a line under **Unreleased** as you work. On release, rename that heading to the version and
date, and start a new empty **Unreleased** above it.

## [Unreleased]

### Added

- MIT license.

### Changed

- The engine is written in TypeScript (types only, `erasableSyntaxOnly`). Games import the
  compiled `dist/`, which npm builds on install; Node runs the `.ts` tests directly.

## [0.1.0] - 2026-10-20

### Added

- Repo setup: Prettier, EditorConfig and the `node:test` runner.
- `src/index.js`, the public entry point: everything a game may import is exported from here.
- CI on GitHub Actions: formatting and tests run on every push and pull request.
