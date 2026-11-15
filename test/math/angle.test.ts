import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Angle from "../../src/math/angle.ts";

function assertNumber(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${expected}, got ${actual}`);
}

const PI = Math.PI;

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("the turns are fractions of a full circle in radians", () => {
    assertNumber(Angle.FULL_TURN, 2 * PI);
    assertNumber(Angle.HALF_TURN, PI);
    assertNumber(Angle.QUARTER_TURN, PI / 2);
  });

  test("convertDegreesToRadians", () => {
    assertNumber(Angle.convertDegreesToRadians(0), 0);
    assertNumber(Angle.convertDegreesToRadians(90), PI / 2);
    assertNumber(Angle.convertDegreesToRadians(180), PI);
    assertNumber(Angle.convertDegreesToRadians(-360), -2 * PI);
  });

  test("convertRadiansToDegrees undoes convertDegreesToRadians", () => {
    assertNumber(Angle.convertRadiansToDegrees(PI / 2), 90);
    assertNumber(Angle.convertRadiansToDegrees(-PI), -180);
    assertNumber(Angle.convertRadiansToDegrees(Angle.convertDegreesToRadians(300)), 300);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("getShortestDisplacement is to minus from when that is under a half turn", () => {
    assertNumber(Angle.getShortestDisplacement(0, PI / 2), PI / 2);
    assertNumber(Angle.getShortestDisplacement(PI / 2, 0), -PI / 2);
  });

  test("getShortestDisplacement goes the short way round", () => {
    const from = Angle.convertDegreesToRadians(350);
    const to = Angle.convertDegreesToRadians(10);
    assertNumber(Angle.getShortestDisplacement(from, to), Angle.convertDegreesToRadians(20));
    assertNumber(Angle.getShortestDisplacement(to, from), Angle.convertDegreesToRadians(-20));
  });

  test("getShortestDisplacement ignores whole turns", () => {
    assertNumber(Angle.getShortestDisplacement(0, 4 * PI + PI / 4), PI / 4);
    assertNumber(Angle.getShortestDisplacement(-6 * PI, PI / 4), PI / 4);
  });

  test("getShortestDisplacement of exactly a half turn is positive", () => {
    assertNumber(Angle.getShortestDisplacement(0, PI), PI);
    assertNumber(Angle.getShortestDisplacement(PI, 0), PI);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("normalize keeps angles already above minus a half turn and up to a half turn", () => {
    assertNumber(Angle.normalize(0), 0);
    assertNumber(Angle.normalize(PI / 3), PI / 3);
    assertNumber(Angle.normalize(-PI / 3), -PI / 3);
    assertNumber(Angle.normalize(PI), PI);
  });

  test("normalize wraps everything else into that range", () => {
    assertNumber(Angle.normalize(-PI), PI);
    assertNumber(Angle.normalize((3 * PI) / 2), -PI / 2);
    assertNumber(Angle.normalize(-(3 * PI) / 2), PI / 2);
    assertNumber(Angle.normalize(2 * PI), 0);
    assertNumber(Angle.normalize(101 * PI + PI / 4), -PI + PI / 4);
  });

  test("turnToward steps by maxDelta toward the goal", () => {
    assertNumber(Angle.turnToward(0, PI / 2, 0.1), 0.1);
    assertNumber(Angle.turnToward(0, -PI / 2, 0.1), -0.1);
  });

  test("turnToward steps the short way round", () => {
    const current = Angle.convertDegreesToRadians(350);
    const goal = Angle.convertDegreesToRadians(10);
    const step = Angle.convertDegreesToRadians(5);
    assertNumber(Angle.turnToward(current, goal, step), Angle.convertDegreesToRadians(355));
  });

  test("turnToward lands exactly on the goal when it is within maxDelta", () => {
    assert.equal(Angle.turnToward(0, 0.05, 0.1), 0.05);
    assert.equal(Angle.turnToward(0, 0.1, 0.1), 0.1);
  });

  test("turnToward with no maxDelta stays put", () => {
    assert.equal(Angle.turnToward(1, 2, 0), 1);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("blending and comparing", () => {
  test("lerp goes the short way round", () => {
    const from = Angle.convertDegreesToRadians(350);
    const to = Angle.convertDegreesToRadians(10);
    assertNumber(Angle.lerp(from, to, 0), from);
    assertNumber(Angle.lerp(from, to, 0.5), Angle.convertDegreesToRadians(360));
    assertNumber(Angle.lerp(from, to, 1), Angle.convertDegreesToRadians(370));
  });

  test("nearlyEquals treats whole turns apart as the same angle", () => {
    assert.ok(Angle.nearlyEquals(0, 2 * PI));
    assert.ok(Angle.nearlyEquals(PI, -PI));
    assert.ok(Angle.nearlyEquals(0.1, 0.1 + 1e-12));
  });

  test("nearlyEquals is false beyond epsilon", () => {
    assert.ok(!Angle.nearlyEquals(0, 0.01));
    assert.ok(Angle.nearlyEquals(0, 0.01, 0.02));
  });
});
