import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Pointer from "../../src/input/pointer.ts";
import * as Vec2 from "../../src/math/vec2.ts";

function pointer(fields: Partial<Pointer.Pointer> = {}): Pointer.Pointer {
  return Object.freeze({ ...Pointer.make(), ...fields });
}

function buttons(...values: Pointer.PointerButton[]): ReadonlySet<Pointer.PointerButton> {
  return new Set(values);
}

function assertButtons(
  actual: Pointer.Pointer,
  expected: { held?: Pointer.PointerButton[]; pressed?: Pointer.PointerButton[]; released?: Pointer.PointerButton[] },
): void {
  assert.deepEqual([...actual.held].sort(), [...(expected.held ?? [])].sort(), "held");
  assert.deepEqual([...actual.pressed].sort(), [...(expected.pressed ?? [])].sort(), "pressed");
  assert.deepEqual([...actual.released].sort(), [...(expected.released ?? [])].sort(), "released");
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

function wheel(x: number, y: number): Pointer.PointerInput {
  return { kind: "wheel", amount: Vec2.make(x, y) };
}

const ENTER: Pointer.PointerInput = { kind: "enter" };
const LEAVE: Pointer.PointerInput = { kind: "leave" };

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make starts at the origin, outside, with nothing held and no movement", () => {
    const p = Pointer.make();
    assert.deepEqual(p.position, Vec2.ZERO);
    assert.deepEqual(p.delta, Vec2.ZERO);
    assert.deepEqual(p.wheel, Vec2.ZERO);
    assert.equal(p.inside, false);
    assertButtons(p, {});
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  const p = pointer({ held: buttons("left"), pressed: buttons("left"), released: buttons("right") });

  test("isHeld", () => {
    assert.equal(Pointer.isHeld(p, "left"), true);
    assert.equal(Pointer.isHeld(p, "right"), false);
  });

  test("wasPressed", () => {
    assert.equal(Pointer.wasPressed(p, "left"), true);
    assert.equal(Pointer.wasPressed(p, "right"), false);
  });

  test("wasReleased", () => {
    assert.equal(Pointer.wasReleased(p, "right"), true);
    assert.equal(Pointer.wasReleased(p, "left"), false);
  });

  test("hasMoved is true only when delta is not zero", () => {
    assert.equal(Pointer.hasMoved(pointer({ delta: Vec2.make(3, 0) })), true);
    assert.equal(Pointer.hasMoved(pointer()), false);
  });

  test("isDragging needs the button held and the pointer moving", () => {
    const moving = Vec2.make(0, 2);
    assert.equal(Pointer.isDragging(pointer({ held: buttons("left"), delta: moving }), "left"), true);
    assert.equal(Pointer.isDragging(pointer({ held: buttons("left"), delta: moving }), "right"), false);
    assert.equal(Pointer.isDragging(pointer({ delta: moving }), "left"), false);
    assert.equal(Pointer.isDragging(pointer({ held: buttons("left") }), "left"), false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("move sets the position and adds the movement to delta", () => {
    const moved = Pointer.move(pointer({ delta: Vec2.make(1, 1) }), Vec2.make(10, 20), Vec2.make(2, 3));
    assert.deepEqual(moved.position, Vec2.make(10, 20));
    assert.deepEqual(moved.delta, Vec2.make(3, 4));
  });

  test("press holds the button and marks it pressed", () => {
    assertButtons(Pointer.press(pointer(), "left"), { held: ["left"], pressed: ["left"] });
  });

  test("pressing a button that is already held changes nothing", () => {
    const p = pointer({ held: buttons("left") });
    assert.equal(Pointer.press(p, "left"), p);
  });

  test("release lets go of the button and marks it released", () => {
    assertButtons(Pointer.release(pointer({ held: buttons("left") }), "left"), { released: ["left"] });
  });

  test("releasing a button that is not held changes nothing", () => {
    const p = pointer();
    assert.equal(Pointer.release(p, "left"), p);
  });

  test("the other button is left alone", () => {
    assertButtons(Pointer.press(pointer({ held: buttons("right") }), "left"), {
      held: ["left", "right"],
      pressed: ["left"],
    });
    assertButtons(Pointer.release(pointer({ held: buttons("left", "right") }), "left"), {
      held: ["right"],
      released: ["left"],
    });
  });

  test("scroll adds the amount to wheel", () => {
    const scrolled = Pointer.scroll(pointer({ wheel: Vec2.make(0, 100) }), Vec2.make(5, 50));
    assert.deepEqual(scrolled.wheel, Vec2.make(5, 150));
  });

  test("enter and leave set inside", () => {
    assert.equal(Pointer.enter(pointer()).inside, true);
    assert.equal(Pointer.leave(pointer({ inside: true })).inside, false);
  });

  test("leaving keeps the buttons held", () => {
    assertButtons(Pointer.leave(pointer({ inside: true, held: buttons("left") })), { held: ["left"] });
  });

  test("releaseAll releases every held button and keeps pressed", () => {
    assertButtons(Pointer.releaseAll(pointer({ held: buttons("left", "right"), pressed: buttons("right") })), {
      pressed: ["right"],
      released: ["left", "right"],
    });
  });

  test("releaseAll with nothing held changes nothing", () => {
    const p = pointer();
    assert.deepEqual(Pointer.releaseAll(p), p);
  });

  test("inputs are left unchanged", () => {
    const p = pointer({ held: buttons("left"), pressed: buttons("left"), delta: Vec2.make(1, 1) });
    Pointer.move(p, Vec2.make(5, 5), Vec2.make(1, 0));
    Pointer.press(p, "right");
    Pointer.release(p, "left");
    Pointer.scroll(p, Vec2.make(0, 10));
    Pointer.enter(p);
    Pointer.releaseAll(p);
    Pointer.applyAll(p, [down("right"), up("left"), wheel(0, 1)]);
    Pointer.endStep(p);
    assertButtons(p, { held: ["left"], pressed: ["left"] });
    assert.deepEqual(p.delta, Vec2.make(1, 1));
    assert.deepEqual(p.wheel, Vec2.ZERO);
    assert.equal(p.inside, false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("applying inputs", () => {
  test("apply runs the change that matches each kind of input", () => {
    const p = pointer({ held: buttons("right") });
    assert.deepEqual(Pointer.apply(p, move(4, 5, 1, 2)), Pointer.move(p, Vec2.make(4, 5), Vec2.make(1, 2)));
    assert.deepEqual(Pointer.apply(p, down("left")), Pointer.press(p, "left"));
    assert.deepEqual(Pointer.apply(p, up("right")), Pointer.release(p, "right"));
    assert.deepEqual(Pointer.apply(p, wheel(0, 3)), Pointer.scroll(p, Vec2.make(0, 3)));
    assert.deepEqual(Pointer.apply(p, ENTER), Pointer.enter(p));
    assert.deepEqual(Pointer.apply(pointer({ inside: true }), LEAVE), Pointer.leave(pointer({ inside: true })));
  });

  test("applyAll applies the inputs in order", () => {
    const p = Pointer.applyAll(Pointer.make(), [ENTER, move(10, 0, 10, 0), move(12, 3, 2, 3), down("left"), LEAVE]);
    assert.deepEqual(p.position, Vec2.make(12, 3));
    assert.deepEqual(p.delta, Vec2.make(12, 3));
    assert.equal(p.inside, false);
    assertButtons(p, { held: ["left"], pressed: ["left"] });
  });

  test("applyAll with no inputs changes nothing", () => {
    const p = pointer({ held: buttons("left") });
    assert.equal(Pointer.applyAll(p, []), p);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("steps", () => {
  test("beginStep applies the step's inputs", () => {
    const p = Pointer.beginStep(Pointer.make(), [ENTER, down("right"), wheel(0, 40)]);
    assert.equal(p.inside, true);
    assert.deepEqual(p.wheel, Vec2.make(0, 40));
    assertButtons(p, { held: ["right"], pressed: ["right"] });
  });

  test("endStep clears delta, wheel and the edges, and keeps position, held and inside", () => {
    const p = pointer({
      position: Vec2.make(7, 8),
      delta: Vec2.make(1, 2),
      wheel: Vec2.make(0, 30),
      held: buttons("left"),
      pressed: buttons("left"),
      released: buttons("right"),
      inside: true,
    });
    const ended = Pointer.endStep(p);
    assert.deepEqual(ended.position, Vec2.make(7, 8));
    assert.deepEqual(ended.delta, Vec2.ZERO);
    assert.deepEqual(ended.wheel, Vec2.ZERO);
    assert.equal(ended.inside, true);
    assertButtons(ended, { held: ["left"] });
  });

  test("a quick click within one step still counts as pressed", () => {
    assertButtons(Pointer.beginStep(Pointer.make(), [down("left"), up("left")]), {
      pressed: ["left"],
      released: ["left"],
    });
  });

  test("a click is seen by one step only", () => {
    const first = Pointer.beginStep(Pointer.make(), [down("left")]);
    assert.equal(Pointer.wasPressed(first, "left"), true);
    const second = Pointer.beginStep(Pointer.endStep(first), []);
    assert.equal(Pointer.wasPressed(second, "left"), false);
    assert.equal(Pointer.isHeld(second, "left"), true);
  });

  test("delta and wheel cover one step only", () => {
    const first = Pointer.beginStep(Pointer.make(), [move(5, 0, 5, 0), wheel(0, 10)]);
    const second = Pointer.beginStep(Pointer.endStep(first), [move(6, 0, 1, 0)]);
    assert.deepEqual(second.delta, Vec2.make(1, 0));
    assert.deepEqual(second.wheel, Vec2.ZERO);
    assert.deepEqual(second.position, Vec2.make(6, 0));
  });

  test("a drag across steps reads as dragging only while moving", () => {
    let p = Pointer.make();
    const steps: Pointer.PointerInput[][] = [[down("left")], [move(3, 0, 3, 0)], [], [up("left")]];
    const dragging: boolean[] = [];
    for (const inputs of steps) {
      p = Pointer.beginStep(p, inputs);
      dragging.push(Pointer.isDragging(p, "left"));
      p = Pointer.endStep(p);
    }
    assert.deepEqual(dragging, [false, true, false, false]);
  });
});
