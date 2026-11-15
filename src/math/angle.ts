export const FULL_TURN = 2 * Math.PI;
export const HALF_TURN = Math.PI;
export const QUARTER_TURN = Math.PI / 2;

const DEGREES_PER_HALF_TURN = 180;

// ---------------------------------------------------------------------------------------------------------------------

export function convertDegreesToRadians(degrees: number): number {
  return (degrees * HALF_TURN) / DEGREES_PER_HALF_TURN;
}

export function convertRadiansToDegrees(radians: number): number {
  return (radians * DEGREES_PER_HALF_TURN) / HALF_TURN;
}

// ---------------------------------------------------------------------------------------------------------------------

export function getShortestDisplacement(from: number, to: number): number {
  return normalize(to - from);
}

// ---------------------------------------------------------------------------------------------------------------------

export function normalize(radians: number): number {
  return HALF_TURN - wrapIntoTurn(HALF_TURN - radians);
}

export function turnToward(current: number, goal: number, maxDelta: number): number {
  const displacement = getShortestDisplacement(current, goal);

  if (Math.abs(displacement) <= maxDelta) {
    return goal;
  }

  return current + Math.sign(displacement) * maxDelta;
}

// ---------------------------------------------------------------------------------------------------------------------

export function lerp(from: number, to: number, t: number): number {
  return from + getShortestDisplacement(from, to) * t;
}

export function nearlyEquals(a: number, b: number, epsilon = 1e-9): boolean {
  return Math.abs(getShortestDisplacement(a, b)) <= epsilon;
}

// ---------------------------------------------------------------------------------------------------------------------

function wrapIntoTurn(radians: number): number {
  return ((radians % FULL_TURN) + FULL_TURN) % FULL_TURN;
}
