import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Clock from "../../src/time/clock.ts";
import * as Ticker from "../../src/time/ticker.ts";

function fakeScheduler(startTime = 0) {
  let time = startTime;
  let nextId = 1;
  let pending: { id: number; onFrame: () => void } | undefined;

  const scheduler: Ticker.Scheduler = {
    now: () => time,
    requestFrame: (onFrame) => {
      pending = { id: nextId++, onFrame };
      return pending.id;
    },
    cancelFrame: (id) => {
      if (pending?.id === id) {
        pending = undefined;
      }
    },
  };

  return {
    scheduler,
    hasPendingFrame: () => pending !== undefined,
    advanceTime: (milliseconds: number) => {
      time += milliseconds;
      const frame = pending;
      pending = undefined;
      frame?.onFrame();
    },
  };
}

function recordingGame(hooks: { onUpdate?: () => void; onRender?: () => void } = {}) {
  const updates: number[] = [];
  const renders: number[] = [];

  const game: Ticker.Game = {
    update: (step) => {
      updates.push(step);
      hooks.onUpdate?.();
    },
    render: (alpha) => {
      renders.push(alpha);
      hooks.onRender?.();
    },
  };

  return { game, updates, renders };
}

function assertNumber(actual: number | undefined, expected: number, epsilon = 1e-9): void {
  assert.ok(actual !== undefined && Math.abs(actual - expected) <= epsilon, `expected ${expected}, got ${actual}`);
}

const QUARTER = Clock.make(0.25, 1);

// ---------------------------------------------------------------------------------------------------------------------

describe("starting", () => {
  test("start books a frame and runs nothing yet", () => {
    const { scheduler, hasPendingFrame } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    const ticker = Ticker.start(game, QUARTER, scheduler);
    assert.equal(hasPendingFrame(), true);
    assert.equal(ticker.isRunning(), true);
    assert.deepEqual(updates, []);
    assert.deepEqual(renders, []);
  });

  test("start uses the clock it is given", () => {
    const { scheduler } = fakeScheduler();
    assert.deepEqual(Ticker.start(recordingGame().game, QUARTER, scheduler).clock(), QUARTER);
  });

  test("start defaults to a fresh Clock.make()", () => {
    const { scheduler } = fakeScheduler();
    assert.deepEqual(Ticker.start(recordingGame().game, undefined, scheduler).clock(), Clock.make());
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("running frames", () => {
  test("a frame shorter than a step renders but runs no updates", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(125);
    assert.deepEqual(updates, []);
    assert.equal(renders.length, 1);
    assertNumber(renders[0], 0.5);
  });

  test("a frame one step long runs one update with the step length", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(250);
    assert.deepEqual(updates, [0.25]);
    assertNumber(renders[0], 0);
  });

  test("a long frame runs several updates, then renders once with the leftover", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(625);
    assert.deepEqual(updates, [0.25, 0.25]);
    assert.equal(renders.length, 1);
    assertNumber(renders[0], 0.5);
  });

  test("time is measured from when start was called", () => {
    const { scheduler, advanceTime } = fakeScheduler(5000);
    const { game, updates } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(250);
    assert.equal(updates.length, 1);
  });

  test("each frame books the next one", () => {
    const { scheduler, advanceTime, hasPendingFrame } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(250);
    advanceTime(250);
    advanceTime(250);
    assert.equal(updates.length, 3);
    assert.equal(renders.length, 3);
    assert.equal(hasPendingFrame(), true);
  });

  test("leftover time carries into the next frame", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(125);
    advanceTime(125);
    assert.equal(updates.length, 1);
  });

  test("a frame after a long freeze is capped at maxDelta", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates } = recordingGame();
    Ticker.start(game, QUARTER, scheduler);
    advanceTime(5000);
    assert.equal(updates.length, 4);
  });

  test("clock() is the latest clock", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const ticker = Ticker.start(recordingGame().game, QUARTER, scheduler);
    advanceTime(500);
    assert.equal(ticker.clock().ticks, 2);
    assertNumber(ticker.clock().time, 0.5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("stopping", () => {
  test("stop cancels the booked frame", () => {
    const { scheduler, advanceTime, hasPendingFrame } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    const ticker = Ticker.start(game, QUARTER, scheduler);
    ticker.stop();
    advanceTime(1000);
    assert.equal(ticker.isRunning(), false);
    assert.equal(hasPendingFrame(), false);
    assert.deepEqual(updates, []);
    assert.deepEqual(renders, []);
  });

  test("stop during update runs no more updates and books no next frame", () => {
    const { scheduler, advanceTime, hasPendingFrame } = fakeScheduler();
    let ticker: Ticker.Ticker | undefined;
    const { game, updates } = recordingGame({ onUpdate: () => ticker?.stop() });
    ticker = Ticker.start(game, QUARTER, scheduler);
    advanceTime(750);
    assert.equal(updates.length, 1);
    assert.equal(hasPendingFrame(), false);
    assert.equal(ticker.isRunning(), false);
  });

  test("stop during render books no next frame", () => {
    const { scheduler, advanceTime, hasPendingFrame } = fakeScheduler();
    let ticker: Ticker.Ticker | undefined;
    const { game, renders } = recordingGame({ onRender: () => ticker?.stop() });
    ticker = Ticker.start(game, QUARTER, scheduler);
    advanceTime(250);
    advanceTime(250);
    assert.equal(renders.length, 1);
    assert.equal(hasPendingFrame(), false);
  });

  test("stopping twice is harmless", () => {
    const { scheduler } = fakeScheduler();
    const ticker = Ticker.start(recordingGame().game, QUARTER, scheduler);
    ticker.stop();
    ticker.stop();
    assert.equal(ticker.isRunning(), false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("controlling the clock", () => {
  test("a paused ticker keeps rendering but runs no updates", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates, renders } = recordingGame();
    const ticker = Ticker.start(game, QUARTER, scheduler);
    ticker.pause();
    advanceTime(500);
    advanceTime(500);
    assert.deepEqual(updates, []);
    assert.equal(renders.length, 2);
    assert.equal(ticker.clock().paused, true);
  });

  test("resume runs updates again", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates } = recordingGame();
    const ticker = Ticker.start(game, QUARTER, scheduler);
    ticker.pause();
    advanceTime(500);
    ticker.resume();
    advanceTime(250);
    assert.equal(updates.length, 1);
    assert.equal(ticker.clock().paused, false);
  });

  test("setTimeScale speeds the game up or slows it down", () => {
    const { scheduler, advanceTime } = fakeScheduler();
    const { game, updates } = recordingGame();
    const ticker = Ticker.start(game, QUARTER, scheduler);
    ticker.setTimeScale(2);
    advanceTime(250);
    assert.equal(updates.length, 2);
    ticker.setTimeScale(0.5);
    advanceTime(500);
    assert.equal(updates.length, 3);
  });

  test("setTimeScale goes through Clock, so a negative scale becomes 0", () => {
    const { scheduler } = fakeScheduler();
    const ticker = Ticker.start(recordingGame().game, QUARTER, scheduler);
    ticker.setTimeScale(-1);
    assert.equal(ticker.clock().timeScale, 0);
  });
});
