import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Pointer from "../../src/input/pointer.ts";
import * as PointerListener from "../../src/input/pointer-listener.ts";
import * as Vec2 from "../../src/math/vec2.ts";

type PointerFields = {
  buttons?: number;
  isPrimary?: boolean;
  pointerId?: number;
  offsetX?: number;
  offsetY?: number;
  movementX?: number;
  movementY?: number;
};

function fakeTargets() {
  const captured: number[] = [];
  const element = Object.assign(new EventTarget(), {
    setPointerCapture: (pointerId: number) => {
      captured.push(pointerId);
    },
  });
  const focus = new EventTarget();
  const listener = PointerListener.start(element, focus);

  return {
    listener,
    captured,
    pointerDown: (fields: PointerFields) => element.dispatchEvent(pointerEvent("pointerdown", fields)),
    pointerMove: (fields: PointerFields) => element.dispatchEvent(pointerEvent("pointermove", fields)),
    pointerUp: (fields: PointerFields) => element.dispatchEvent(pointerEvent("pointerup", fields)),
    pointerCancel: () => element.dispatchEvent(pointerEvent("pointercancel", {})),
    pointerEnter: () => element.dispatchEvent(new Event("pointerenter")),
    pointerLeave: () => element.dispatchEvent(new Event("pointerleave")),
    wheel: (deltaX: number, deltaY: number) =>
      element.dispatchEvent(Object.assign(new Event("wheel"), { deltaX, deltaY })),
    contextMenu: () => {
      const event = new Event("contextmenu", { cancelable: true });
      element.dispatchEvent(event);
      return event;
    },
    blur: () => focus.dispatchEvent(new Event("blur")),
  };
}

function pointerEvent(type: string, fields: PointerFields): Event {
  return Object.assign(new Event(type), {
    buttons: 0,
    isPrimary: true,
    pointerId: 1,
    offsetX: 0,
    offsetY: 0,
    movementX: 0,
    movementY: 0,
    ...fields,
  });
}

function move(x: number, y: number, movementX: number, movementY: number): Pointer.PointerInput {
  return { kind: "move", position: Vec2.make(x, y), movement: Vec2.make(movementX, movementY) };
}

function down(button: Pointer.PointerButton): Pointer.PointerInput {
  return { kind: "down", button };
}

function up(button: Pointer.PointerButton): Pointer.PointerInput {
  return { kind: "up", button };
}

const LEFT = 1;
const RIGHT = 2;
const MIDDLE = 4;

// ---------------------------------------------------------------------------------------------------------------------

describe("listening", () => {
  test("nothing is queued before any pointer event", () => {
    const { listener } = fakeTargets();
    assert.deepEqual(listener.drain(), []);
  });

  test("a pointerdown queues a down input for the button", () => {
    const { listener, pointerDown } = fakeTargets();
    pointerDown({ buttons: LEFT });
    assert.deepEqual(listener.drain(), [down("left")]);
  });

  test("a pointerdown captures the pointer", () => {
    const { captured, pointerDown } = fakeTargets();
    pointerDown({ buttons: LEFT, pointerId: 7 });
    assert.deepEqual(captured, [7]);
  });

  test("a pointerup queues an up input for the button", () => {
    const { listener, pointerDown, pointerUp } = fakeTargets();
    pointerDown({ buttons: RIGHT });
    pointerUp({ buttons: 0 });
    assert.deepEqual(listener.drain(), [down("right"), up("right")]);
  });

  test("a pointermove queues a move with the offset position and the movement", () => {
    const { listener, pointerMove } = fakeTargets();
    pointerMove({ offsetX: 30, offsetY: 40, movementX: 3, movementY: -2 });
    assert.deepEqual(listener.drain(), [move(30, 40, 3, -2)]);
  });

  test("pressing a second button while one is held arrives as a move and still queues a down", () => {
    const { listener, pointerDown, pointerMove } = fakeTargets();
    pointerDown({ buttons: LEFT });
    pointerMove({ buttons: LEFT | RIGHT, offsetX: 5, offsetY: 5 });
    assert.deepEqual(listener.drain(), [down("left"), move(5, 5, 0, 0), down("right")]);
  });

  test("letting go of one of two held buttons queues an up for that button only", () => {
    const { listener, pointerDown, pointerMove, pointerUp } = fakeTargets();
    pointerDown({ buttons: LEFT });
    pointerMove({ buttons: LEFT | RIGHT });
    listener.drain();
    pointerUp({ buttons: RIGHT });
    assert.deepEqual(listener.drain(), [up("left")]);
  });

  test("buttons other than left and right are ignored", () => {
    const { listener, pointerDown, pointerUp } = fakeTargets();
    pointerDown({ buttons: MIDDLE });
    pointerUp({ buttons: 0 });
    assert.deepEqual(listener.drain(), []);
  });

  test("pointers other than the primary one are ignored", () => {
    const { listener, captured, pointerDown, pointerMove, pointerUp } = fakeTargets();
    pointerDown({ buttons: LEFT, isPrimary: false, pointerId: 2 });
    pointerMove({ buttons: LEFT, isPrimary: false, offsetX: 9 });
    pointerUp({ buttons: 0, isPrimary: false });
    assert.deepEqual(listener.drain(), []);
    assert.deepEqual(captured, []);
  });

  test("a pointercancel releases every held button", () => {
    const { listener, pointerDown, pointerMove, pointerCancel } = fakeTargets();
    pointerDown({ buttons: LEFT });
    pointerMove({ buttons: LEFT | RIGHT });
    listener.drain();
    pointerCancel();
    assert.deepEqual(listener.drain(), [up("left"), up("right")]);
  });

  test("pointerenter and pointerleave queue enter and leave", () => {
    const { listener, pointerEnter, pointerLeave } = fakeTargets();
    pointerEnter();
    pointerLeave();
    assert.deepEqual(listener.drain(), [{ kind: "enter" }, { kind: "leave" }]);
  });

  test("a wheel event queues the scroll amount", () => {
    const { listener, wheel } = fakeTargets();
    wheel(0, 120);
    assert.deepEqual(listener.drain(), [{ kind: "wheel", amount: Vec2.make(0, 120) }]);
  });

  test("the context menu is blocked so right-click reaches the game", () => {
    const { contextMenu } = fakeTargets();
    assert.equal(contextMenu().defaultPrevented, true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("draining", () => {
  test("drain empties the queue", () => {
    const { listener, pointerDown } = fakeTargets();
    pointerDown({ buttons: LEFT });
    listener.drain();
    assert.deepEqual(listener.drain(), []);
  });

  test("inputs after a drain wait for the next drain", () => {
    const { listener, pointerDown, pointerUp } = fakeTargets();
    pointerDown({ buttons: LEFT });
    listener.drain();
    pointerUp({ buttons: 0 });
    assert.deepEqual(listener.drain(), [up("left")]);
  });

  test("a drained list is not changed by later pointer events", () => {
    const { listener, pointerDown, pointerUp } = fakeTargets();
    pointerDown({ buttons: LEFT });
    const drained = listener.drain();
    pointerUp({ buttons: 0 });
    assert.deepEqual(drained, [down("left")]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("losing focus", () => {
  test("blur releases every held button", () => {
    const { listener, pointerDown, blur } = fakeTargets();
    pointerDown({ buttons: LEFT | RIGHT });
    listener.drain();
    blur();
    assert.deepEqual(listener.drain(), [up("left"), up("right")]);
  });

  test("blur with nothing held queues nothing", () => {
    const { listener, blur } = fakeTargets();
    blur();
    assert.deepEqual(listener.drain(), []);
  });

  test("a second blur queues nothing", () => {
    const { listener, pointerDown, blur } = fakeTargets();
    pointerDown({ buttons: LEFT });
    blur();
    listener.drain();
    blur();
    assert.deepEqual(listener.drain(), []);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("stopping", () => {
  test("stop drops the queued inputs", () => {
    const { listener, pointerDown } = fakeTargets();
    pointerDown({ buttons: LEFT });
    listener.stop();
    assert.deepEqual(listener.drain(), []);
  });

  test("after stop, pointer events and blur are no longer heard", () => {
    const { listener, captured, pointerDown, pointerMove, pointerUp, pointerEnter, wheel, contextMenu, blur } =
      fakeTargets();
    pointerDown({ buttons: LEFT });
    listener.stop();
    pointerDown({ buttons: LEFT | RIGHT, pointerId: 3 });
    pointerMove({ buttons: LEFT, offsetX: 4 });
    pointerUp({ buttons: 0 });
    pointerEnter();
    wheel(0, 10);
    blur();
    assert.deepEqual(listener.drain(), []);
    assert.deepEqual(captured, [1]);
    assert.equal(contextMenu().defaultPrevented, false);
  });

  test("stopping twice is harmless", () => {
    const { listener } = fakeTargets();
    listener.stop();
    listener.stop();
    assert.deepEqual(listener.drain(), []);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("with a Pointer", () => {
  test("a drag reaches the Pointer as held and moving", () => {
    const { listener, pointerEnter, pointerDown, pointerMove } = fakeTargets();
    pointerEnter();
    pointerDown({ buttons: LEFT, offsetX: 10, offsetY: 10 });
    pointerMove({ buttons: LEFT, offsetX: 14, offsetY: 13, movementX: 4, movementY: 3 });
    const p = Pointer.beginStep(Pointer.make(), listener.drain());
    assert.equal(p.inside, true);
    assert.equal(Pointer.isDragging(p, "left"), true);
    assert.deepEqual(p.position, Vec2.make(14, 13));
    assert.deepEqual(p.delta, Vec2.make(4, 3));
  });

  test("losing focus while holding a button leaves nothing held", () => {
    const { listener, pointerDown, blur } = fakeTargets();
    pointerDown({ buttons: RIGHT });
    let p = Pointer.endStep(Pointer.beginStep(Pointer.make(), listener.drain()));
    assert.equal(Pointer.isHeld(p, "right"), true);
    blur();
    p = Pointer.beginStep(p, listener.drain());
    assert.equal(Pointer.isHeld(p, "right"), false);
    assert.equal(Pointer.wasReleased(p, "right"), true);
  });
});
