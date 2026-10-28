import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Vec2 from "../src/vec2.ts";

// A frozen vector: any function that tries to change its input throws instead of passing quietly.
function vec(x: number, y: number): Vec2.Vec2 {
  return Object.freeze({ x, y });
}

// Compares part by part within epsilon. Floating-point maths rarely lands exactly (cos(π/2) is 6e-17, not 0),
// and -0 vs 0 would fail assert.deepEqual although they are the same number for a game.
function assertVec(actual: Vec2.Vec2, expected: Vec2.Vec2, epsilon = 1e-9): void {
  const close = Math.abs(actual.x - expected.x) <= epsilon && Math.abs(actual.y - expected.y) <= epsilon;
  assert.ok(close, `expected (${expected.x}, ${expected.y}), got (${actual.x}, ${actual.y})`);
}

function assertNumber(actual: number, expected: number, epsilon = 1e-9): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `expected ${expected}, got ${actual}`);
}

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("the constants point the screen's way: y down, so UP is (0, -1)", () => {
    assertVec(Vec2.ZERO, vec(0, 0));
    assertVec(Vec2.ONE, vec(1, 1));
    assertVec(Vec2.UP, vec(0, -1));
    assertVec(Vec2.DOWN, vec(0, 1));
    assertVec(Vec2.LEFT, vec(-1, 0));
    assertVec(Vec2.RIGHT, vec(1, 0));
  });

  test("make", () => {
    assert.deepEqual(Vec2.make(3, -4), { x: 3, y: -4 });
  });

  test("makeFromAngleRadians: 0 is right, π/2 is down", () => {
    assertVec(Vec2.makeFromAngleRadians(0), Vec2.RIGHT);
    assertVec(Vec2.makeFromAngleRadians(Math.PI / 2), Vec2.DOWN);
    assertVec(Vec2.makeFromAngleRadians(Math.PI), Vec2.LEFT);
    assertVec(Vec2.makeFromAngleRadians(-Math.PI / 2), Vec2.UP);
  });

  test("makeFromAngleRadians with a length", () => {
    assertVec(Vec2.makeFromAngleRadians(Math.PI / 2, 5), vec(0, 5));
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("arithmetic", () => {
  test("add", () => {
    assert.deepEqual(Vec2.add(vec(1, 2), vec(3, 4)), { x: 4, y: 6 });
  });

  test("subtract takes the second from the first", () => {
    assert.deepEqual(Vec2.subtract(vec(5, 7), vec(2, 3)), { x: 3, y: 4 });
  });

  test("scale", () => {
    assert.deepEqual(Vec2.scale(vec(1, -2), 3), { x: 3, y: -6 });
  });

  test("multiply and divide work part by part", () => {
    assert.deepEqual(Vec2.multiply(vec(2, 3), vec(4, 5)), { x: 8, y: 15 });
    assert.deepEqual(Vec2.divide(vec(8, 15), vec(4, 5)), { x: 2, y: 3 });
  });

  test("negate", () => {
    assert.deepEqual(Vec2.negate(vec(1, -2)), { x: -1, y: 2 });
  });

  test("inputs are left unchanged", () => {
    const a = vec(1, 2);
    const b = vec(3, 4);
    Vec2.add(a, b);
    assert.deepEqual(a, { x: 1, y: 2 });
    assert.deepEqual(b, { x: 3, y: 4 });
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("measuring", () => {
  test("dot is 0 for vectors at right angles", () => {
    assert.equal(Vec2.dot(vec(1, 2), vec(3, 4)), 11);
    assert.equal(Vec2.dot(Vec2.RIGHT, Vec2.DOWN), 0);
  });

  test("cross is positive when b is clockwise from a on screen", () => {
    assert.equal(Vec2.cross(Vec2.RIGHT, Vec2.DOWN), 1);
    assert.equal(Vec2.cross(Vec2.DOWN, Vec2.RIGHT), -1);
    assert.equal(Vec2.cross(vec(2, 0), vec(4, 0)), 0);
  });

  test("length and lengthSquared", () => {
    assert.equal(Vec2.length(vec(3, 4)), 5);
    assert.equal(Vec2.lengthSquared(vec(3, 4)), 25);
    assert.equal(Vec2.length(Vec2.ZERO), 0);
  });

  test("distance and distanceSquared", () => {
    assert.equal(Vec2.distance(vec(1, 1), vec(4, 5)), 5);
    assert.equal(Vec2.distanceSquared(vec(1, 1), vec(4, 5)), 25);
    assert.equal(Vec2.distance(vec(4, 5), vec(1, 1)), 5);
  });

  test("angle: 0 is right, π/2 is down, -π/2 is up", () => {
    assertNumber(Vec2.angle(Vec2.RIGHT), 0);
    assertNumber(Vec2.angle(Vec2.DOWN), Math.PI / 2);
    assertNumber(Vec2.angle(Vec2.UP), -Math.PI / 2);
    assertNumber(Vec2.angle(Vec2.LEFT), Math.PI);
  });

  test("angleBetween is signed: positive is clockwise on screen", () => {
    assertNumber(Vec2.angleBetween(Vec2.RIGHT, Vec2.DOWN), Math.PI / 2);
    assertNumber(Vec2.angleBetween(Vec2.DOWN, Vec2.RIGHT), -Math.PI / 2);
    assertNumber(Vec2.angleBetween(Vec2.RIGHT, Vec2.LEFT), Math.PI);
  });

  test("angleBetween ignores length", () => {
    assertNumber(Vec2.angleBetween(vec(5, 0), vec(0, 0.1)), Math.PI / 2);
  });

  test("angleBetween stays small across the left side, where angles jump from π to -π", () => {
    assertNumber(Vec2.angleBetween(vec(-1, 0.01), vec(-1, -0.01)), 0.02, 1e-4);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("direction and length", () => {
  test("normalize gives length 1 and keeps the direction", () => {
    assertVec(Vec2.normalize(vec(3, 4)), vec(0.6, 0.8));
    assertVec(Vec2.normalize(vec(0, -10)), Vec2.UP);
  });

  test("normalize(ZERO) is ZERO, not NaN", () => {
    assertVec(Vec2.normalize(Vec2.ZERO), Vec2.ZERO);
  });

  test("rotateClockwise90 turns a quarter turn clockwise on screen", () => {
    assertVec(Vec2.rotateClockwise90(Vec2.RIGHT), Vec2.DOWN);
    assertVec(Vec2.rotateClockwise90(Vec2.DOWN), Vec2.LEFT);
    assert.equal(Vec2.dot(Vec2.rotateClockwise90(vec(3, 7)), vec(3, 7)), 0);
  });

  test("rotateClockwise by a positive angle turns clockwise on screen", () => {
    assertVec(Vec2.rotateClockwise(Vec2.RIGHT, Math.PI / 2), Vec2.DOWN);
    assertVec(Vec2.rotateClockwise(Vec2.RIGHT, -Math.PI / 2), Vec2.UP);
    assertVec(Vec2.rotateClockwise(vec(2, 0), Math.PI), vec(-2, 0));
  });

  test("rotateClockwise keeps the length", () => {
    assertNumber(Vec2.length(Vec2.rotateClockwise(vec(3, 4), 1.234)), 5);
  });

  test("rotateClockwise by angleBetween turns a to b's direction", () => {
    const a = vec(-1, 0.01);
    const b = vec(-1, -0.01);
    assertVec(Vec2.normalize(Vec2.rotateClockwise(a, Vec2.angleBetween(a, b))), Vec2.normalize(b));
  });

  test("clampLength shortens long vectors and leaves short ones alone", () => {
    assertVec(Vec2.clampLength(vec(10, 0), 5), vec(5, 0));
    assertVec(Vec2.clampLength(vec(1, 0), 5), vec(1, 0));
    assertVec(Vec2.clampLength(vec(3, 4), 5), vec(3, 4));
    assertVec(Vec2.clampLength(vec(6, 8), 5), vec(3, 4));
  });

  test("reflect flips the part going into the surface and keeps the part along it", () => {
    assertVec(Vec2.reflect(vec(1, 1), Vec2.UP), vec(1, -1));
    assertVec(Vec2.reflect(vec(2, -3), Vec2.DOWN), vec(2, 3));
    assertVec(Vec2.reflect(vec(3, 0), Vec2.LEFT), vec(-3, 0));
  });

  test("project keeps the part of a along onto, whatever onto's length", () => {
    assertVec(Vec2.project(vec(3, 4), vec(1, 0)), vec(3, 0));
    assertVec(Vec2.project(vec(3, 4), vec(2, 0)), vec(3, 0));
    assertVec(Vec2.project(vec(3, 4), vec(0, -7)), vec(0, 4));
  });

  test("project onto ZERO is ZERO", () => {
    assertVec(Vec2.project(vec(3, 4), Vec2.ZERO), Vec2.ZERO);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("blending and comparing", () => {
  test("lerp: t = 0 is a, t = 1 is b", () => {
    assertVec(Vec2.lerp(vec(0, 0), vec(10, 20), 0), vec(0, 0));
    assertVec(Vec2.lerp(vec(0, 0), vec(10, 20), 0.25), vec(2.5, 5));
    assertVec(Vec2.lerp(vec(0, 0), vec(10, 20), 1), vec(10, 20));
  });

  test("lerp goes past the ends when t is outside 0 to 1", () => {
    assertVec(Vec2.lerp(vec(0, 0), vec(10, 0), 2), vec(20, 0));
    assertVec(Vec2.lerp(vec(0, 0), vec(10, 0), -1), vec(-10, 0));
  });

  test("min and max work part by part", () => {
    assertVec(Vec2.min(vec(1, 5), vec(3, 2)), vec(1, 2));
    assertVec(Vec2.max(vec(1, 5), vec(3, 2)), vec(3, 5));
  });

  test("round and floor work part by part", () => {
    assertVec(Vec2.round(vec(1.4, 1.6)), vec(1, 2));
    assertVec(Vec2.floor(vec(1.9, -1.1)), vec(1, -2));
  });

  test("round sends halves up, toward +∞, as Math.round does", () => {
    assertVec(Vec2.round(vec(2.5, -2.5)), vec(3, -2));
  });

  test("equals is exact", () => {
    assert.equal(Vec2.equals(vec(1, 2), vec(1, 2)), true);
    assert.equal(Vec2.equals(vec(1, 2), vec(1, 3)), false);
    assert.equal(Vec2.equals(vec(0.1 + 0.2, 0), vec(0.3, 0)), false);
  });

  test("nearlyEquals allows floating-point noise", () => {
    assert.equal(Vec2.nearlyEquals(vec(0.1 + 0.2, 0), vec(0.3, 0)), true);
    assert.equal(Vec2.nearlyEquals(Vec2.rotateClockwise(Vec2.RIGHT, Math.PI / 2), Vec2.DOWN), true);
    assert.equal(Vec2.nearlyEquals(vec(1, 2), vec(1, 2.1)), false);
  });

  test("nearlyEquals takes an epsilon", () => {
    assert.equal(Vec2.nearlyEquals(vec(1, 2), vec(1, 2.1), 0.5), true);
  });
});
