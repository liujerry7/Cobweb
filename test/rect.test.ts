import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Rect from "../src/rect.ts";
import * as Vec2 from "../src/vec2.ts";

function rect(x: number, y: number, width: number, height: number): Rect.Rect {
  return Object.freeze({ x, y, width, height });
}

function vec(x: number, y: number): Vec2.Vec2 {
  return Object.freeze({ x, y });
}

function assertRect(actual: Rect.Rect | undefined, expected: Rect.Rect, epsilon = 1e-9): void {
  const show = (r: Rect.Rect) => `(${r.x}, ${r.y}, ${r.width}, ${r.height})`;
  assert.ok(actual !== undefined, `expected ${show(expected)}, got undefined`);
  const close =
    Math.abs(actual.x - expected.x) <= epsilon &&
    Math.abs(actual.y - expected.y) <= epsilon &&
    Math.abs(actual.width - expected.width) <= epsilon &&
    Math.abs(actual.height - expected.height) <= epsilon;
  assert.ok(close, `expected ${show(expected)}, got ${show(actual)}`);
}

function assertVec(actual: Vec2.Vec2, expected: Vec2.Vec2, epsilon = 1e-9): void {
  const close = Math.abs(actual.x - expected.x) <= epsilon && Math.abs(actual.y - expected.y) <= epsilon;
  assert.ok(close, `expected (${expected.x}, ${expected.y}), got (${actual.x}, ${actual.y})`);
}

const R = rect(1, 2, 3, 4);

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make", () => {
    assert.deepEqual(Rect.make(1, 2, 3, 4), { x: 1, y: 2, width: 3, height: 4 });
  });

  test("makeFromPositionSize", () => {
    assertRect(Rect.makeFromPositionSize(vec(1, 2), vec(3, 4)), R);
  });

  test("makeFromCenter puts the center where asked", () => {
    assertRect(Rect.makeFromCenter(vec(5, 5), vec(4, 2)), rect(3, 4, 4, 2));
  });

  test("makeFromCorners takes the corners in either order", () => {
    assertRect(Rect.makeFromCorners(vec(1, 2), vec(4, 6)), R);
    assertRect(Rect.makeFromCorners(vec(4, 6), vec(1, 2)), R);
    assertRect(Rect.makeFromCorners(vec(1, 6), vec(4, 2)), R);
  });

  test("makeFromPoints is the bounding box", () => {
    assertRect(Rect.makeFromPoints([vec(1, 5), vec(3, 2), vec(-1, 4)]), rect(-1, 2, 4, 3));
  });

  test("makeFromPoints of one point is an empty rect at that point", () => {
    assertRect(Rect.makeFromPoints([vec(7, 8)]), rect(7, 8, 0, 0));
  });

  test("makeFromPoints of no points is undefined", () => {
    assert.equal(Rect.makeFromPoints([]), undefined);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("edges: y grows downward, so bottom is y + height", () => {
    assert.equal(Rect.left(R), 1);
    assert.equal(Rect.right(R), 4);
    assert.equal(Rect.top(R), 2);
    assert.equal(Rect.bottom(R), 6);
  });

  test("position, size and center", () => {
    assertVec(Rect.position(R), vec(1, 2));
    assertVec(Rect.size(R), vec(3, 4));
    assertVec(Rect.center(R), vec(2.5, 4));
  });

  test("corners", () => {
    assertVec(Rect.topLeft(R), vec(1, 2));
    assertVec(Rect.topRight(R), vec(4, 2));
    assertVec(Rect.bottomLeft(R), vec(1, 6));
    assertVec(Rect.bottomRight(R), vec(4, 6));
  });

  test("area", () => {
    assert.equal(Rect.area(R), 12);
    assert.equal(Rect.area(rect(5, 5, 0, 3)), 0);
  });

  test("isEmpty when width or height is 0 or less", () => {
    assert.equal(Rect.isEmpty(R), false);
    assert.equal(Rect.isEmpty(rect(0, 0, 0, 5)), true);
    assert.equal(Rect.isEmpty(rect(0, 0, 5, 0)), true);
    assert.equal(Rect.isEmpty(rect(0, 0, -1, 5)), true);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("moving and resizing", () => {
  test("translate moves by an offset", () => {
    assertRect(Rect.translate(R, vec(10, -1)), rect(11, 1, 3, 4));
  });

  test("moveTo puts the top-left corner at a position", () => {
    assertRect(Rect.moveTo(R, vec(0, 0)), rect(0, 0, 3, 4));
  });

  test("moveCenterTo puts the center at a position", () => {
    assertRect(Rect.moveCenterTo(rect(0, 0, 4, 2), vec(10, 10)), rect(8, 9, 4, 2));
  });

  test("resize keeps the top-left corner", () => {
    assertRect(Rect.resize(R, vec(5, 6)), rect(1, 2, 5, 6));
  });

  test("expand grows every side; a negative amount shrinks", () => {
    assertRect(Rect.expand(R, 1), rect(0, 1, 5, 6));
    assertRect(Rect.expand(R, -1), rect(2, 3, 1, 2));
  });

  test("expand keeps the center", () => {
    assertVec(Rect.center(Rect.expand(R, 3)), Rect.center(R));
  });

  test("inputs are left unchanged", () => {
    const r = rect(1, 2, 3, 4);
    Rect.translate(r, vec(5, 5));
    Rect.expand(r, 2);
    assert.deepEqual(r, { x: 1, y: 2, width: 3, height: 4 });
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("testing against points and rects", () => {
  const BOX = rect(0, 0, 10, 10);

  test("containsPoint: inside, and on the left and top edges", () => {
    assert.equal(Rect.containsPoint(BOX, vec(5, 5)), true);
    assert.equal(Rect.containsPoint(BOX, vec(0, 0)), true);
    assert.equal(Rect.containsPoint(BOX, vec(0, 9.99)), true);
  });

  test("containsPoint: not on the right or bottom edge, and not outside", () => {
    assert.equal(Rect.containsPoint(BOX, vec(10, 5)), false);
    assert.equal(Rect.containsPoint(BOX, vec(5, 10)), false);
    assert.equal(Rect.containsPoint(BOX, vec(-0.1, 5)), false);
    assert.equal(Rect.containsPoint(BOX, vec(5, 11)), false);
  });

  test("side-by-side rects never both contain the point on their shared edge", () => {
    const leftTile = rect(0, 0, 10, 10);
    const rightTile = rect(10, 0, 10, 10);
    const onEdge = vec(10, 5);
    assert.equal(Rect.containsPoint(leftTile, onEdge), false);
    assert.equal(Rect.containsPoint(rightTile, onEdge), true);
  });

  test("containsRect: inside, or exactly the same", () => {
    assert.equal(Rect.containsRect(BOX, rect(2, 2, 3, 3)), true);
    assert.equal(Rect.containsRect(BOX, BOX), true);
  });

  test("containsRect: not when sticking out", () => {
    assert.equal(Rect.containsRect(BOX, rect(8, 8, 3, 3)), false);
    assert.equal(Rect.containsRect(rect(2, 2, 3, 3), BOX), false);
  });

  test("intersects when overlapping or one inside the other", () => {
    assert.equal(Rect.intersects(BOX, rect(5, 5, 10, 10)), true);
    assert.equal(Rect.intersects(BOX, rect(2, 2, 3, 3)), true);
    assert.equal(Rect.intersects(rect(2, 2, 3, 3), BOX), true);
  });

  test("intersects is false for rects that only touch, or are apart", () => {
    assert.equal(Rect.intersects(BOX, rect(10, 0, 5, 5)), false);
    assert.equal(Rect.intersects(BOX, rect(0, 10, 5, 5)), false);
    assert.equal(Rect.intersects(BOX, rect(20, 20, 1, 1)), false);
  });

  test("intersection is the overlapping part", () => {
    assertRect(Rect.intersection(BOX, rect(5, 5, 10, 10)), rect(5, 5, 5, 5));
    assertRect(Rect.intersection(BOX, rect(-2, 3, 4, 2)), rect(0, 3, 2, 2));
    assertRect(Rect.intersection(BOX, rect(2, 2, 3, 3)), rect(2, 2, 3, 3));
  });

  test("intersection is undefined when they only touch or are apart", () => {
    assert.equal(Rect.intersection(BOX, rect(10, 0, 5, 5)), undefined);
    assert.equal(Rect.intersection(BOX, rect(20, 20, 1, 1)), undefined);
  });

  test("union covers both", () => {
    assertRect(Rect.union(rect(0, 0, 2, 2), rect(5, 5, 1, 1)), rect(0, 0, 6, 6));
    assertRect(Rect.union(BOX, rect(2, 2, 3, 3)), BOX);
  });

  test("clampPoint leaves inside points alone and pulls outside ones to the nearest edge", () => {
    assertVec(Rect.clampPoint(BOX, vec(5, 5)), vec(5, 5));
    assertVec(Rect.clampPoint(BOX, vec(-3, 4)), vec(0, 4));
    assertVec(Rect.clampPoint(BOX, vec(12, 15)), vec(10, 10));
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("comparing", () => {
  test("equals is exact", () => {
    assert.equal(Rect.equals(R, rect(1, 2, 3, 4)), true);
    assert.equal(Rect.equals(R, rect(1, 2, 3, 5)), false);
    assert.equal(Rect.equals(rect(0.1 + 0.2, 0, 1, 1), rect(0.3, 0, 1, 1)), false);
  });

  test("nearlyEquals allows floating-point noise", () => {
    assert.equal(Rect.nearlyEquals(rect(0.1 + 0.2, 0, 1, 1), rect(0.3, 0, 1, 1)), true);
    assert.equal(Rect.nearlyEquals(R, rect(1, 2, 3, 4.1)), false);
  });

  test("nearlyEquals takes an epsilon", () => {
    assert.equal(Rect.nearlyEquals(R, rect(1, 2, 3, 4.1), 0.5), true);
  });
});
