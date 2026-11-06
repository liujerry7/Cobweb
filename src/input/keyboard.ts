import * as Sets from "../data-structures/sets.ts";

export type Keyboard = {
  readonly held: ReadonlySet<string>;
  readonly pressed: ReadonlySet<string>;
  readonly released: ReadonlySet<string>;
};

export type KeyInput = {
  readonly kind: "down" | "up";
  readonly code: string;
};

// ---------------------------------------------------------------------------------------------------------------------

export function make(): Keyboard {
  return {
    held: Sets.make<string>(),
    pressed: Sets.make<string>(),
    released: Sets.make<string>(),
  };
}

// ---------------------------------------------------------------------------------------------------------------------

export function isHeld(keyboard: Keyboard, code: string): boolean {
  return keyboard.held.has(code);
}

export function wasPressed(keyboard: Keyboard, code: string): boolean {
  return keyboard.pressed.has(code);
}

export function wasReleased(keyboard: Keyboard, code: string): boolean {
  return keyboard.released.has(code);
}

export function axis(keyboard: Keyboard, negative: string, positive: string): number {
  return getHeldValue(keyboard, positive) - getHeldValue(keyboard, negative);
}

// ---------------------------------------------------------------------------------------------------------------------

export function press(keyboard: Keyboard, code: string): Keyboard {
  if (isHeld(keyboard, code)) {
    return keyboard;
  }

  return {
    ...keyboard,
    held: Sets.add(keyboard.held, code),
    pressed: Sets.add(keyboard.pressed, code),
  };
}

export function release(keyboard: Keyboard, code: string): Keyboard {
  if (!isHeld(keyboard, code)) {
    return keyboard;
  }

  return {
    ...keyboard,
    held: Sets.remove(keyboard.held, code),
    released: Sets.add(keyboard.released, code),
  };
}

export function beginStep(keyboard: Keyboard, inputs: readonly KeyInput[]): Keyboard {
  return applyAll(keyboard, inputs);
}

export function endStep(keyboard: Keyboard): Keyboard {
  return {
    ...keyboard,
    pressed: Sets.clear(keyboard.pressed),
    released: Sets.clear(keyboard.released),
  };
}

export function releaseAll(keyboard: Keyboard): Keyboard {
  let next = keyboard;

  for (const code of keyboard.held) {
    next = release(next, code);
  }

  return next;
}

// ---------------------------------------------------------------------------------------------------------------------

export function apply(keyboard: Keyboard, input: KeyInput): Keyboard {
  return input.kind === "down" ? press(keyboard, input.code) : release(keyboard, input.code);
}

export function applyAll(keyboard: Keyboard, inputs: readonly KeyInput[]): Keyboard {
  return inputs.reduce(apply, keyboard);
}

// ---------------------------------------------------------------------------------------------------------------------

function getHeldValue(keyboard: Keyboard, code: string): number {
  return isHeld(keyboard, code) ? 1 : 0;
}
