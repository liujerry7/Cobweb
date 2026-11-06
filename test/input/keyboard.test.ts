import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Keyboard from "../../src/input/keyboard.ts";

function keyboard(held: string[] = [], pressed: string[] = [], released: string[] = []): Keyboard.Keyboard {
  return Object.freeze({ held: new Set(held), pressed: new Set(pressed), released: new Set(released) });
}

function down(code: string): Keyboard.KeyEvent {
  return { kind: "down", code };
}

function up(code: string): Keyboard.KeyEvent {
  return { kind: "up", code };
}

function assertKeys(
  actual: Keyboard.Keyboard,
  expected: { held?: string[]; pressed?: string[]; released?: string[] },
): void {
  assert.deepEqual([...actual.held].sort(), [...(expected.held ?? [])].sort(), "held");
  assert.deepEqual([...actual.pressed].sort(), [...(expected.pressed ?? [])].sort(), "pressed");
  assert.deepEqual([...actual.released].sort(), [...(expected.released ?? [])].sort(), "released");
}

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make starts with nothing held, pressed, or released", () => {
    assertKeys(Keyboard.make(), {});
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  const k = keyboard(["KeyA", "Space"], ["Space"], ["KeyE"]);

  test("isHeld", () => {
    assert.equal(Keyboard.isHeld(k, "KeyA"), true);
    assert.equal(Keyboard.isHeld(k, "KeyE"), false);
  });

  test("wasPressed", () => {
    assert.equal(Keyboard.wasPressed(k, "Space"), true);
    assert.equal(Keyboard.wasPressed(k, "KeyA"), false);
  });

  test("wasReleased", () => {
    assert.equal(Keyboard.wasReleased(k, "KeyE"), true);
    assert.equal(Keyboard.wasReleased(k, "Space"), false);
  });

  test("axis is -1, 0 or 1 from two held keys", () => {
    assert.equal(Keyboard.axis(keyboard(["ArrowLeft"]), "ArrowLeft", "ArrowRight"), -1);
    assert.equal(Keyboard.axis(keyboard(["ArrowRight"]), "ArrowLeft", "ArrowRight"), 1);
    assert.equal(Keyboard.axis(keyboard(), "ArrowLeft", "ArrowRight"), 0);
  });

  test("axis is 0 when both keys are held", () => {
    assert.equal(Keyboard.axis(keyboard(["ArrowLeft", "ArrowRight"]), "ArrowLeft", "ArrowRight"), 0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("press holds the key and marks it pressed", () => {
    assertKeys(Keyboard.press(keyboard(), "Space"), { held: ["Space"], pressed: ["Space"] });
  });

  test("pressing a key that is already held changes nothing", () => {
    assertKeys(Keyboard.press(keyboard(["Space"]), "Space"), { held: ["Space"] });
  });

  test("release lets go of the key and marks it released", () => {
    assertKeys(Keyboard.release(keyboard(["Space"]), "Space"), { released: ["Space"] });
  });

  test("releasing a key that is not held changes nothing", () => {
    assertKeys(Keyboard.release(keyboard(), "Space"), {});
  });

  test("other keys are left alone", () => {
    assertKeys(Keyboard.press(keyboard(["KeyA"]), "Space"), { held: ["KeyA", "Space"], pressed: ["Space"] });
    assertKeys(Keyboard.release(keyboard(["KeyA", "Space"]), "Space"), { held: ["KeyA"], released: ["Space"] });
  });

  test("releaseAll releases every held key", () => {
    assertKeys(Keyboard.releaseAll(keyboard(["KeyA", "Space"], ["Space"])), {
      pressed: ["Space"],
      released: ["KeyA", "Space"],
    });
  });

  test("releaseAll with nothing held changes nothing", () => {
    assertKeys(Keyboard.releaseAll(keyboard([], [], ["KeyE"])), { released: ["KeyE"] });
  });

  test("inputs are left unchanged", () => {
    const k = keyboard(["KeyA"], ["KeyA"]);
    Keyboard.press(k, "Space");
    Keyboard.release(k, "KeyA");
    Keyboard.releaseAll(k);
    Keyboard.beginStep(k, [down("KeyW"), up("KeyA")]);
    Keyboard.endStep(k);
    assertKeys(k, { held: ["KeyA"], pressed: ["KeyA"] });
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("steps", () => {
  test("beginStep applies the step's events in order", () => {
    assertKeys(Keyboard.beginStep(Keyboard.make(), [down("KeyA"), down("Space")]), {
      held: ["KeyA", "Space"],
      pressed: ["KeyA", "Space"],
    });
  });

  test("beginStep with no events changes nothing", () => {
    assertKeys(Keyboard.beginStep(keyboard(["KeyA"]), []), { held: ["KeyA"] });
  });

  test("endStep clears pressed and released and keeps held", () => {
    assertKeys(Keyboard.endStep(keyboard(["KeyA"], ["KeyA"], ["KeyE"])), { held: ["KeyA"] });
  });

  test("a quick tap within one step still counts as pressed", () => {
    assertKeys(Keyboard.beginStep(Keyboard.make(), [down("Space"), up("Space")]), {
      pressed: ["Space"],
      released: ["Space"],
    });
  });

  test("a press is seen by one step only", () => {
    const first = Keyboard.beginStep(Keyboard.make(), [down("Space")]);
    assert.equal(Keyboard.wasPressed(first, "Space"), true);
    const second = Keyboard.beginStep(Keyboard.endStep(first), []);
    assert.equal(Keyboard.wasPressed(second, "Space"), false);
    assert.equal(Keyboard.isHeld(second, "Space"), true);
  });

  test("a key held across steps is pressed once and released once", () => {
    let k = Keyboard.make();
    const steps: Keyboard.KeyEvent[][] = [[down("KeyD")], [], [], [up("KeyD")]];
    let presses = 0;
    let releases = 0;
    for (const events of steps) {
      k = Keyboard.beginStep(k, events);
      presses += Keyboard.wasPressed(k, "KeyD") ? 1 : 0;
      releases += Keyboard.wasReleased(k, "KeyD") ? 1 : 0;
      k = Keyboard.endStep(k);
    }
    assert.equal(presses, 1);
    assert.equal(releases, 1);
    assertKeys(k, {});
  });
});
