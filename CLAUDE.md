# CLAUDE.md

**Cobweb** is a hand-written, plain-JavaScript web game engine (see `README.md`). Its owner is **learning
programming by writing it**.

## Working here

- **Teach; don't write.** Explain the design, name the files, sketch the shape of the code and
  review what the owner writes. Write engine code yourself only when the owner gives the green
  light for that piece. Tooling and config they ask for directly are fine.
- **Completeness.** A type models its whole concept, not just what one game calls today. A
  `Human` with only `punch()` is confusing: give it `kick()`, `fight()`… so it reads as what it
  is. Suggest the natural complete set of operations.
- **Unused code is fine.** Never flag or delete code for being unused. Most of an engine goes
  unused by any one game.
- **Consistent abstraction levels.** Every line in a function sits at the same level: it either
  orchestrates named steps or does one step's detail.
- **Game-agnostic.** No game, brand or product names in this repo.
- Prettier formats everything (`.prettierrc.json`); don't hand-format against it.

## Commits and releases

- **Conventional Commits**: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`,
  then an imperative summary (`feat: add Vector2 dot product`). `!` after the type marks a
  breaking change (`feat!: rename Vector2.len to length`).
- Commit to `main` freely; CI (`.github/workflows/ci.yml`) must stay green. Big or experimental
  work goes on a short-lived, plainly named branch and a pull request.
- Every user-visible change adds a line under **Unreleased** in `CHANGELOG.md`.
- Releases follow SemVer: bump `version` in `package.json`, date the changelog section, commit
  `chore: release vX.Y.Z`, tag `vX.Y.Z`, push the tag, publish a GitHub Release. Never move a
  pushed tag. The owner is practising releases: walk them through it rather than doing it.
- The public API is whatever `src/index.js` exports; everything else is internal.

## Commands

```bash
npm test               # node --test
npm run format:check   # Prettier check
```
