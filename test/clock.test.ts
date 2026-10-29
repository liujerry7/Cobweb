import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Clock from "../src/clock.ts";

function clock(fields: Partial<Clock.Clock> = {}): Clock.Clock {
  return Object.freeze({
    step: 0.25,
    maxDelta: 1,
    timeScale: 1,
    paused: false,
    accumulator: 0,
    time: 0,
    ticks: 0,
    ...fields,
  });
}

function assertNumber(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${expected}, got ${actual}`);
}

function assertAdvance(
  actual: Clock.Advance,
  expected: { steps: number; accumulator: number; time: number; ticks: number },
): void {
  assert.equal(actual.steps, expected.steps, "steps");
  assertNumber(actual.clock.accumulator, expected.accumulator);
  assertNumber(actual.clock.time, expected.time);
  assert.equal(actual.clock.ticks, expected.ticks, "ticks");
}

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make starts at zero, running at normal speed", () => {
    assert.deepEqual(Clock.make(0.25, 1), clock());
  });

  test("make defaults to 60 steps a second and a quarter-second cap", () => {
    const c = Clock.make();
    assertNumber(c.step, 1 / 60);
    assertNumber(c.maxDelta, 0.25);
  });

  test("makeFromRate turns steps per second into a step length", () => {
    assert.deepEqual(Clock.makeFromRate(4, 1), clock());
    assertNumber(Clock.makeFromRate(60).step, 1 / 60);
    assertNumber(Clock.makeFromRate(60).maxDelta, 0.25);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("advancing", () => {
  test("less than a step banks the time and runs no steps", () => {
    assertAdvance(Clock.advance(clock(), 0.125), { steps: 0, accumulator: 0.125, time: 0, ticks: 0 });
  });

  test("exactly one step runs one step", () => {
    assertAdvance(Clock.advance(clock(), 0.25), { steps: 1, accumulator: 0, time: 0.25, ticks: 1 });
  });

  test("several steps keep the leftover in the bank", () => {
    assertAdvance(Clock.advance(clock(), 0.625), { steps: 2, accumulator: 0.125, time: 0.5, ticks: 2 });
  });

  test("leftovers from earlier frames add up to a step", () => {
    const first = Clock.advance(clock(), 0.125);
    assertAdvance(Clock.advance(first.clock, 0.125), { steps: 1, accumulator: 0, time: 0.25, ticks: 1 });
  });

  test("time and ticks keep counting from where they were", () => {
    const c = clock({ time: 10, ticks: 40 });
    assertAdvance(Clock.advance(c, 0.5), { steps: 2, accumulator: 0, time: 10.5, ticks: 42 });
  });

  test("a long frame is capped at maxDelta", () => {
    assertAdvance(Clock.advance(clock(), 5), { steps: 4, accumulator: 0, time: 1, ticks: 4 });
  });

  test("negative real time counts as zero", () => {
    const c = clock({ accumulator: 0.125 });
    const result = Clock.advance(c, -1);
    assert.equal(result.steps, 0);
    assert.deepEqual(result.clock, c);
  });

  test("a time scale of 2 runs twice as many steps", () => {
    assertAdvance(Clock.advance(clock({ timeScale: 2 }), 0.5), { steps: 4, accumulator: 0, time: 1, ticks: 4 });
  });

  test("a time scale of 0.5 runs half as many steps", () => {
    assertAdvance(Clock.advance(clock({ timeScale: 0.5 }), 0.25), { steps: 0, accumulator: 0.125, time: 0, ticks: 0 });
  });

  test("the cap applies to real time, before the time scale", () => {
    assertAdvance(Clock.advance(clock({ timeScale: 2 }), 5), { steps: 8, accumulator: 0, time: 2, ticks: 8 });
  });

  test("a paused clock runs no steps and keeps its bank", () => {
    const c = clock({ paused: true, accumulator: 0.125 });
    const result = Clock.advance(c, 1);
    assert.equal(result.steps, 0);
    assert.deepEqual(result.clock, c);
  });

  test("with the default 1/60 step, a second of 60 frames runs 60 steps", () => {
    let c = Clock.make();
    let steps = 0;
    for (let frame = 0; frame < 60; frame++) {
      const result = Clock.advance(c, 1 / 60);
      c = result.clock;
      steps += result.steps;
    }
    assert.ok(steps === 59 || steps === 60, `expected about 60 steps, got ${steps}`);
    assert.equal(c.ticks, steps);
    assert.ok(c.accumulator >= 0 && c.accumulator < c.step, `accumulator ${c.accumulator} out of range`);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("alpha is how far the bank is toward the next step", () => {
    assertNumber(Clock.alpha(clock()), 0);
    assertNumber(Clock.alpha(clock({ accumulator: 0.125 })), 0.5);
    assertNumber(Clock.alpha(clock({ accumulator: 0.1875 })), 0.75);
  });

  test("alpha after advancing is the leftover fraction", () => {
    assertNumber(Clock.alpha(Clock.advance(clock(), 0.625).clock), 0.5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("controlling", () => {
  test("pause and resume flip paused and keep everything else", () => {
    const c = clock({ accumulator: 0.125, time: 3, ticks: 12 });
    assert.deepEqual(Clock.pause(c), { ...c, paused: true });
    assert.deepEqual(Clock.resume(Clock.pause(c)), c);
  });

  test("a resumed clock advances again", () => {
    const resumed = Clock.resume(clock({ paused: true }));
    assert.equal(Clock.advance(resumed, 0.25).steps, 1);
  });

  test("setTimeScale changes only the time scale", () => {
    const c = clock({ time: 3, ticks: 12 });
    assert.deepEqual(Clock.setTimeScale(c, 0.5), { ...c, timeScale: 0.5 });
  });

  test("a negative time scale becomes 0", () => {
    assert.equal(Clock.setTimeScale(clock(), -2).timeScale, 0);
  });

  test("reset clears time, ticks and the bank, and keeps the settings", () => {
    const c = clock({ timeScale: 2, paused: true, accumulator: 0.125, time: 3, ticks: 12 });
    assert.deepEqual(Clock.reset(c), clock({ timeScale: 2, paused: true }));
  });
});
