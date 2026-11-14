# Cobweb

A TypeScript game engine for the browser: the game-agnostic parts any web game needs (math,
timing, input, rendering helpers, randomness, storage), written by hand as a learning project and
shared by games that live in their own repos.

The engine is its own repo, and a game depends on a tagged release:

```json
"dependencies": { "cobweb": "github:liujerry7/Cobweb#v0.3.0" }
```

npm builds `dist/` (plain `.js` plus `.d.ts` types) when it installs, so a game imports plain
JavaScript: `import { Vec2 } from "cobweb"`.

## Rules

- **Game-agnostic.** No game, brand or product names; nothing that only one game would want.
- **Complete over minimal.** A module models its whole concept, even the parts no game calls yet.
  Unused engine code is expected.
- **One level of abstraction per function.** A function either orchestrates or does detail
  work, never both.
- **Immutable data, plain functions.** A type is a `type` for its shape plus the functions on it,
  in one module; functions return new values and never change their inputs.
- **Types only.** TypeScript with `erasableSyntaxOnly`: annotations and nothing else (no `enum`,
  `namespace` or parameter properties), so removing the types leaves plain JavaScript.
- **No dependencies at runtime.**

## Conventions

- Files and folders are lowercase kebab-case (`vec2.ts`, `keyboard-listener.ts`). Modules are grouped by
  area in `src/` (`math/`, `time/`, `input/`, `renderer/`, `data-structures/`), and tests mirror them under `test/` as
  `<name>.test.ts` (`test/input/keyboard.test.ts`).
- Functions and variables are camelCase, types are PascalCase, constants are UPPER_SNAKE. A
  constant is a value fixed in the source and the same on every run (`ZERO`, `BROWSER`); a `const`
  computed or looked up at run time is still camelCase.
- Function names start with a verb. A read that would otherwise be a noun takes `get`
  (`getLength`, `getArea`, `getAlpha`); conversions take `convert` (`convertWorldToScreen`); checks
  take `is`, `has` or `was` (`isEmpty`, `hasMoved`, `wasPressed`); makers are `make` / `makeFromX`. Math
  operations whose names are already verbs keep them (`dot`, `cross`, `min`, `max`, `union`,
  `intersection`, `lerp`).
- A module reads top to bottom: imports, types, constants, then exported functions in sections
  split by the divider (making, reading, changing, comparing), then private helpers.
- One-off bookings are `requestX` / `cancelX` and return an `XId`; ongoing processes are
  `start` / `stop` and return a handle; listeners are `addX` / `removeX`.
- A type that takes input has a `<Device>Input` type (`KeyInput`, `PointerInput`), `apply(x, input)`,
  which returns the new `x`, and `applyAll(x, inputs)`, which applies them in order
  (`inputs.reduce(apply, x)`). Browser events keep the name `event`.
- A queue that hands over everything it holds and empties itself has `drain()`.
- In a pure module, every function returns a new value and changes nothing. In a shell module (listeners, renderers),
  functions change something outside, such as the browser or the canvas, and return `void` or a handle. The module
  says which; the verb says what.
- Verbs keep one meaning each:
  - `apply` turns an input into a new value (`apply(x, input)`); nothing else is called `apply`.
  - `set` gives a field or setting a value (`Camera.setZoom`, `CanvasRenderer.setCamera`).
  - `trace` adds an outline to a path without painting it; `fill` and `stroke` paint a path.
  - `draw` paints one thing from start to finish: style, trace, fill or stroke (`drawRect`, `drawText`).
  - `render` produces a whole frame from many draws.
- Named exports only, no `export default`. `src/index.ts` re-exports each type module as a
  namespace (`export * as Vec2 from "./vec2.ts"`).
- Relative imports name the real file, `.ts` included; the build rewrites them to `.js`.

## Commands

```bash
npm install
npm test               # node --test: every *.test.ts under test/, run directly by Node
npm run typecheck      # tsc: type errors in src/ and test/
npm run build          # tsc: src/ → dist/ (.js + .d.ts)
npm run format         # Prettier rewrites every file
npm run format:check   # fails if any file is unformatted
```

Files are formatted on save in VS Code (`.vscode/settings.json`; needs the Prettier extension,
recommended in `.vscode/extensions.json`).

## Layout

| folder      | holds                                                            |
| ----------- | ---------------------------------------------------------------- |
| `src/`      | engine modules, one concept per file, grouped in folders by area |
| `test/`     | `node:test` tests, one per module, in the same folders           |
| `dist/`     | build output, not committed                                      |
| `examples/` | pages that try the engine in a browser                           |

To open an example, build, serve the repo root and open the page:

```bash
npm run build
python -m http.server 8080   # then http://localhost:8080/examples/drawing.html
```

## Contributing

This is a personal learning project, so issues and pull requests aren't being accepted. You're
welcome to fork it.

## License

[MIT](LICENSE)
