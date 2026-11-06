import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Keyboard from "../../src/input/keyboard.ts";
import * as KeyboardListener from "../../src/input/keyboard-listener.ts";

function fakeTarget() {
  const target = new EventTarget();
  const listener = KeyboardListener.start(target);

  return {
    listener,
    keyDown: (code: string, repeat = false) => target.dispatchEvent(keyEvent("keydown", code, repeat)),
    keyUp: (code: string) => target.dispatchEvent(keyEvent("keyup", code, false)),
    blur: () => target.dispatchEvent(new Event("blur")),
  };
}

function keyEvent(type: "keydown" | "keyup", code: string, repeat: boolean): Event {
  return Object.assign(new Event(type), { code, repeat });
}

function down(code: string): Keyboard.KeyEvent {
  return { kind: "down", code };
}

function up(code: string): Keyboard.KeyEvent {
  return { kind: "up", code };
}

function byCode(events: readonly Keyboard.KeyEvent[]): Keyboard.KeyEvent[] {
  return [...events].sort((a, b) => a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------------------------------------------------

describe("listening", () => {
  test("nothing is queued before any key event", () => {
    const { listener } = fakeTarget();
    assert.deepEqual(listener.drain(), []);
  });

  test("a keydown queues a down event", () => {
    const { listener, keyDown } = fakeTarget();
    keyDown("Space");
    assert.deepEqual(listener.drain(), [down("Space")]);
  });

  test("a keyup queues an up event", () => {
    const { listener, keyDown, keyUp } = fakeTarget();
    keyDown("Space");
    keyUp("Space");
    assert.deepEqual(listener.drain(), [down("Space"), up("Space")]);
  });

  test("events are queued in the order they arrive", () => {
    const { listener, keyDown, keyUp } = fakeTarget();
    keyDown("KeyA");
    keyDown("Space");
    keyUp("KeyA");
    assert.deepEqual(listener.drain(), [down("KeyA"), down("Space"), up("KeyA")]);
  });

  test("auto-repeat keydowns are ignored", () => {
    const { listener, keyDown } = fakeTarget();
    keyDown("KeyD");
    keyDown("KeyD", true);
    keyDown("KeyD", true);
    assert.deepEqual(listener.drain(), [down("KeyD")]);
  });

  test("a keyup for a key that was never down is still queued", () => {
    const { listener, keyUp } = fakeTarget();
    keyUp("KeyE");
    assert.deepEqual(listener.drain(), [up("KeyE")]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("draining", () => {
  test("drain empties the queue", () => {
    const { listener, keyDown } = fakeTarget();
    keyDown("Space");
    listener.drain();
    assert.deepEqual(listener.drain(), []);
  });

  test("events after a drain wait for the next drain", () => {
    const { listener, keyDown, keyUp } = fakeTarget();
    keyDown("Space");
    listener.drain();
    keyUp("Space");
    assert.deepEqual(listener.drain(), [up("Space")]);
  });

  test("a drained list is not changed by later events", () => {
    const { listener, keyDown } = fakeTarget();
    keyDown("KeyA");
    const drained = listener.drain();
    keyDown("KeyB");
    assert.deepEqual(drained, [down("KeyA")]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("losing focus", () => {
  test("blur releases every key that is down", () => {
    const { listener, keyDown, blur } = fakeTarget();
    keyDown("KeyA");
    keyDown("Space");
    listener.drain();
    blur();
    assert.deepEqual(byCode(listener.drain()), [up("KeyA"), up("Space")]);
  });

  test("blur skips keys that were already let go", () => {
    const { listener, keyDown, keyUp, blur } = fakeTarget();
    keyDown("KeyA");
    keyDown("Space");
    keyUp("KeyA");
    listener.drain();
    blur();
    assert.deepEqual(listener.drain(), [up("Space")]);
  });

  test("blur with nothing down queues nothing", () => {
    const { listener, blur } = fakeTarget();
    blur();
    assert.deepEqual(listener.drain(), []);
  });

  test("a second blur queues nothing", () => {
    const { listener, keyDown, blur } = fakeTarget();
    keyDown("Space");
    blur();
    listener.drain();
    blur();
    assert.deepEqual(listener.drain(), []);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("stopping", () => {
  test("stop drops the queued events", () => {
    const { listener, keyDown } = fakeTarget();
    keyDown("Space");
    listener.stop();
    assert.deepEqual(listener.drain(), []);
  });

  test("after stop, key events and blur are no longer heard", () => {
    const { listener, keyDown, keyUp, blur } = fakeTarget();
    keyDown("KeyA");
    listener.stop();
    keyDown("Space");
    keyUp("Space");
    blur();
    assert.deepEqual(listener.drain(), []);
  });

  test("stopping twice is harmless", () => {
    const { listener } = fakeTarget();
    listener.stop();
    listener.stop();
    assert.deepEqual(listener.drain(), []);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("with a Keyboard", () => {
  test("a tap between two steps reaches the next step as pressed and released", () => {
    const { listener, keyDown, keyUp } = fakeTarget();
    keyDown("Space");
    keyUp("Space");
    const keyboard = Keyboard.beginStep(Keyboard.make(), listener.drain());
    assert.equal(Keyboard.wasPressed(keyboard, "Space"), true);
    assert.equal(Keyboard.wasReleased(keyboard, "Space"), true);
    assert.equal(Keyboard.isHeld(keyboard, "Space"), false);
  });

  test("losing focus while holding a key leaves nothing held", () => {
    const { listener, keyDown, blur } = fakeTarget();
    keyDown("KeyD");
    let keyboard = Keyboard.endStep(Keyboard.beginStep(Keyboard.make(), listener.drain()));
    assert.equal(Keyboard.isHeld(keyboard, "KeyD"), true);
    blur();
    keyboard = Keyboard.beginStep(keyboard, listener.drain());
    assert.equal(Keyboard.isHeld(keyboard, "KeyD"), false);
    assert.equal(Keyboard.wasReleased(keyboard, "KeyD"), true);
  });
});
