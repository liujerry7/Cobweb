import * as Vec2 from "../math/vec2.ts";
import * as Sets from "../data-structures/sets.ts";

export type PointerButton = "left" | "right";

export type Pointer = {
  readonly position: Vec2.Vec2;
  readonly delta: Vec2.Vec2;
  readonly held: ReadonlySet<PointerButton>;
  readonly pressed: ReadonlySet<PointerButton>;
  readonly released: ReadonlySet<PointerButton>;
  readonly wheel: Vec2.Vec2;
  readonly inside: boolean;
};

export type PointerInput =
  | { readonly kind: "move"; readonly position: Vec2.Vec2; readonly movement: Vec2.Vec2 }
  | { readonly kind: "down"; readonly button: PointerButton }
  | { readonly kind: "up"; readonly button: PointerButton }
  | { readonly kind: "wheel"; readonly amount: Vec2.Vec2 }
  | { readonly kind: "enter" }
  | { readonly kind: "leave" };

// ---------------------------------------------------------------------------------------------------------------------

export function make(): Pointer {
  return {
    position: Vec2.ZERO,
    delta: Vec2.ZERO,
    held: Sets.make<PointerButton>(),
    pressed: Sets.make<PointerButton>(),
    released: Sets.make<PointerButton>(),
    wheel: Vec2.ZERO,
    inside: false,
  };
}

// ---------------------------------------------------------------------------------------------------------------------

export function isHeld(pointer: Pointer, button: PointerButton): boolean {
  return pointer.held.has(button);
}

export function wasPressed(pointer: Pointer, button: PointerButton): boolean {
  return pointer.pressed.has(button);
}

export function wasReleased(pointer: Pointer, button: PointerButton): boolean {
  return pointer.released.has(button);
}

export function hasMoved(pointer: Pointer): boolean {
  return !Vec2.equals(pointer.delta, Vec2.ZERO);
}

export function isDragging(pointer: Pointer, button: PointerButton): boolean {
  return isHeld(pointer, button) && hasMoved(pointer);
}

// ---------------------------------------------------------------------------------------------------------------------

export function move(pointer: Pointer, position: Vec2.Vec2, movement: Vec2.Vec2): Pointer {
  return {
    ...pointer,
    position,
    delta: Vec2.add(pointer.delta, movement),
  };
}

export function press(pointer: Pointer, button: PointerButton): Pointer {
  if (isHeld(pointer, button)) {
    return pointer;
  }

  return {
    ...pointer,
    held: Sets.add(pointer.held, button),
    pressed: Sets.add(pointer.pressed, button),
  };
}

export function release(pointer: Pointer, button: PointerButton): Pointer {
  if (!isHeld(pointer, button)) {
    return pointer;
  }

  return {
    ...pointer,
    held: Sets.remove(pointer.held, button),
    released: Sets.add(pointer.released, button),
  };
}

export function scroll(pointer: Pointer, amount: Vec2.Vec2): Pointer {
  return {
    ...pointer,
    wheel: Vec2.add(pointer.wheel, amount),
  };
}

export function enter(pointer: Pointer): Pointer {
  return {
    ...pointer,
    inside: true,
  };
}

export function leave(pointer: Pointer): Pointer {
  return {
    ...pointer,
    inside: false,
  };
}

export function releaseAll(pointer: Pointer): Pointer {
  let next = pointer;

  for (const button of pointer.held) {
    next = release(next, button);
  }

  return next;
}

export function beginStep(pointer: Pointer, inputs: readonly PointerInput[]): Pointer {
  return applyAll(pointer, inputs);
}

export function endStep(pointer: Pointer): Pointer {
  return {
    ...pointer,
    delta: Vec2.ZERO,
    pressed: Sets.clear(pointer.pressed),
    released: Sets.clear(pointer.released),
    wheel: Vec2.ZERO,
  };
}

// ---------------------------------------------------------------------------------------------------------------------

export function apply(pointer: Pointer, input: PointerInput): Pointer {
  switch (input.kind) {
    case "move":
      return move(pointer, input.position, input.movement);
    case "down":
      return press(pointer, input.button);
    case "up":
      return release(pointer, input.button);
    case "wheel":
      return scroll(pointer, input.amount);
    case "enter":
      return enter(pointer);
    case "leave":
      return leave(pointer);
  }
}

export function applyAll(pointer: Pointer, inputs: readonly PointerInput[]): Pointer {
  return inputs.reduce(apply, pointer);
}
