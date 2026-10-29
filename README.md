# Cobweb

A TypeScript game engine for the browser: the game-agnostic parts any web game needs (math,
timing, input, rendering helpers, randomness, storage), written by hand as a learning project and
shared by games that live in their own repos.

The engine is its own repo, and a game depends on a tagged release:

```json
"dependencies": { "cobweb": "github:liujerry7/Cobweb#v0.2.0" }
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

- Files and folders are lowercase kebab-case (`vec2.ts`, `key-state.ts`); tests mirror them under
  `test/` as `<name>.test.ts`.
- Functions and variables are camelCase, types are PascalCase, constants are UPPER_SNAKE.
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

| folder  | holds                                |
| ------- | ------------------------------------ |
| `src/`  | engine modules, one concept per file |
| `test/` | `node:test` tests, one per module    |
| `dist/` | build output, not committed          |

## Contributing

This is a personal learning project, so issues and pull requests aren't being accepted. You're
welcome to fork it.

## License

[MIT](LICENSE)
