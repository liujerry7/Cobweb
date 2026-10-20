# Cobweb

A plain-JavaScript game engine for the browser: the game-agnostic parts any web game needs
(math, timing, input, rendering helpers, randomness, storage), written by hand as a learning
project and shared by games that live in their own repos.

It plays the role for web games that Jumble plays for the C++ games: the engine is its own repo,
and a game checks it out alongside.

```
D:/GameDev/
  Cobweb/       ← this repo
  Purgatory/    ← LSAT Game Night (a game that will draw on it)
```

## Rules

- **Game-agnostic.** No game, brand or product names; nothing that only one game would want.
- **Complete over minimal.** A module models its whole concept, even the parts no game calls yet.
  Unused engine code is expected.
- **One level of abstraction per function.** A function either orchestrates or does detail
  work, never both.
- **No dependencies at runtime.** Plain ES modules that run in a browser and under Node's test runner.

## Commands

```bash
npm install
npm test               # node --test: every *.test.js under test/
npm run format         # Prettier rewrites every file
npm run format:check   # fails if any file is unformatted
```

Files are formatted on save in VS Code (`.vscode/settings.json`; needs the Prettier extension,
recommended in `.vscode/extensions.json`).

## Layout

| folder  | holds                                |
| ------- | ------------------------------------ |
| `src/`  | engine modules, one concept per file |
| `test/` | `node:test` tests, one per module    |
