export type Clock = {
  readonly step: number;
  readonly maxDelta: number;
  readonly timeScale: number;
  readonly paused: boolean;
  readonly accumulator: number;
  readonly time: number;
  readonly ticks: number;
};

export type Advance = {
  readonly clock: Clock;
  readonly steps: number;
};

// ---------------------------------------------------------------------------------------------------------------------

export function make(step = 1 / 60, maxDelta = 0.25): Clock {
  return {
    step,
    maxDelta,
    timeScale: 1,
    paused: false,
    accumulator: 0,
    time: 0,
    ticks: 0,
  };
}

export function makeFromRate(stepsPerSecond: number, maxDelta = 0.25): Clock {
  return make(1 / stepsPerSecond, maxDelta);
}

// ---------------------------------------------------------------------------------------------------------------------

export function advance(clock: Clock, realSeconds: number): Advance {
  if (clock.paused) {
    return { clock, steps: 0 };
  }

  const banked = clock.accumulator + scaledDelta(clock, realSeconds);
  const steps = Math.floor(banked / clock.step);

  return {
    clock: {
      ...clock,
      accumulator: Math.max(banked - steps * clock.step, 0),
      time: clock.time + steps * clock.step,
      ticks: clock.ticks + steps,
    },
    steps,
  };
}

export function alpha(clock: Clock): number {
  return clock.accumulator / clock.step;
}

// ---------------------------------------------------------------------------------------------------------------------

export function pause(clock: Clock): Clock {
  return { ...clock, paused: true };
}

export function resume(clock: Clock): Clock {
  return { ...clock, paused: false };
}

export function setTimeScale(clock: Clock, timeScale: number): Clock {
  return { ...clock, timeScale: Math.max(timeScale, 0) };
}

export function reset(clock: Clock): Clock {
  return { ...clock, accumulator: 0, time: 0, ticks: 0 };
}

// ---------------------------------------------------------------------------------------------------------------------

function scaledDelta(clock: Clock, realSeconds: number): number {
  const capped = Math.min(Math.max(realSeconds, 0), clock.maxDelta);
  return capped * clock.timeScale;
}
