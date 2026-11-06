import type { PointerButton, PointerInput } from "./pointer.ts";
import * as Vec2 from "../math/vec2.ts";
import * as Sets from "../data-structures/sets.ts";

export type PointerListener = {
  readonly drain: () => readonly PointerInput[];
  readonly stop: () => void;
};

export type PointerTarget = Pick<HTMLElement, "addEventListener" | "setPointerCapture">;

export type FocusTarget = Pick<Window, "addEventListener">;

const BUTTON_BITS = new Map<PointerButton, number>([
  ["left", 1],
  ["right", 2],
]);

// ---------------------------------------------------------------------------------------------------------------------

export function start(element: PointerTarget, focus: FocusTarget = window): PointerListener {
  const controller = new AbortController();
  const options = { signal: controller.signal };
  let queue: readonly PointerInput[] = [];
  let down: ReadonlySet<PointerButton> = Sets.make<PointerButton>();

  const enqueue = (inputs: readonly PointerInput[]) => {
    queue = [...queue, ...inputs];
  };

  const syncButtons = (buttons: number) => {
    const now = heldIn(buttons);
    enqueue([...Sets.map(Sets.difference(now, down), buttonDown), ...Sets.map(Sets.difference(down, now), buttonUp)]);
    down = now;
  };

  const onPointerMove = (event: PointerEvent) => {
    if (!event.isPrimary) {
      return;
    }
    enqueue([moveTo(event)]);
    syncButtons(event.buttons);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary) {
      return;
    }
    element.setPointerCapture(event.pointerId);
    syncButtons(event.buttons);
  };

  const onPointerUp = (event: PointerEvent) => {
    if (!event.isPrimary) {
      return;
    }
    syncButtons(event.buttons);
  };

  element.addEventListener("pointermove", onPointerMove, options);
  element.addEventListener("pointerdown", onPointerDown, options);
  element.addEventListener("pointerup", onPointerUp, options);
  element.addEventListener("pointercancel", () => syncButtons(0), options);
  element.addEventListener("pointerenter", () => enqueue([{ kind: "enter" }]), options);
  element.addEventListener("pointerleave", () => enqueue([{ kind: "leave" }]), options);
  element.addEventListener("wheel", (event) => enqueue([scrollBy(event)]), options);
  element.addEventListener("contextmenu", (event) => event.preventDefault(), options);
  focus.addEventListener("blur", () => syncButtons(0), options);

  return {
    drain: () => {
      const drained = queue;
      queue = [];
      return drained;
    },
    stop: () => {
      controller.abort();
      queue = [];
      down = Sets.clear(down);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------

function heldIn(buttons: number): ReadonlySet<PointerButton> {
  let held = Sets.make<PointerButton>();

  for (const [button, bit] of BUTTON_BITS) {
    if ((buttons & bit) !== 0) {
      held = Sets.add(held, button);
    }
  }

  return held;
}

function moveTo(event: PointerEvent): PointerInput {
  return {
    kind: "move",
    position: Vec2.make(event.offsetX, event.offsetY),
    movement: Vec2.make(event.movementX, event.movementY),
  };
}

function scrollBy(event: WheelEvent): PointerInput {
  return { kind: "wheel", amount: Vec2.make(event.deltaX, event.deltaY) };
}

function buttonDown(button: PointerButton): PointerInput {
  return { kind: "down", button };
}

function buttonUp(button: PointerButton): PointerInput {
  return { kind: "up", button };
}
