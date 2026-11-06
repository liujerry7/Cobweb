import * as Clock from "./clock.ts";

export type Game = {
  readonly update: (step: number) => void;
  readonly render: (alpha: number) => void;
};

export type Scheduler = {
  readonly now: () => number;
  readonly requestFrame: (callback: () => void) => number;
  readonly cancelFrame: (id: number) => void;
};

export type Ticker = {
  readonly stop: () => void;
  readonly isRunning: () => boolean;
  readonly clock: () => Clock.Clock;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly setTimeScale: (timeScale: number) => void;
};

export const BROWSER: Scheduler = {
  now: () => performance.now(),
  requestFrame: (callback) => requestAnimationFrame(callback),
  cancelFrame: (id) => cancelAnimationFrame(id),
};

export function start(game: Game, clock = Clock.make(), scheduler = BROWSER): Ticker {
  let currentClock = clock;
  let lastTime = scheduler.now();
  let running = true;
  let frameId = scheduler.requestFrame(runFrame);

  function runFrame(): void {
    const now = scheduler.now();
    const catchUp = Clock.advance(currentClock, (now - lastTime) / 1000);

    currentClock = catchUp.clock;
    lastTime = now;

    for (let i = 0; i < catchUp.steps && running; ++i) {
      game.update(currentClock.step);
    }

    game.render(Clock.alpha(currentClock));

    if (running) {
      frameId = scheduler.requestFrame(runFrame);
    }
  }

  return {
    stop: () => {
      running = false;
      scheduler.cancelFrame(frameId);
    },
    isRunning: () => {
      return running;
    },
    clock: () => {
      return currentClock;
    },
    pause: () => {
      currentClock = Clock.pause(currentClock);
    },
    resume: () => {
      currentClock = Clock.resume(currentClock);
    },
    setTimeScale: (timeScale) => {
      currentClock = Clock.setTimeScale(currentClock, timeScale);
    },
  };
}
