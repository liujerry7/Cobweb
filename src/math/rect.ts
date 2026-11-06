import * as Vec2 from "./vec2.ts";

export type Rect = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

// ---------------------------------------------------------------------------------------------------------------------

export function make(x: number, y: number, width: number, height: number): Rect {
  return { x, y, width, height };
}

export function makeFromPositionSize(position: Vec2.Vec2, size: Vec2.Vec2): Rect {
  return { x: position.x, y: position.y, width: size.x, height: size.y };
}

export function makeFromCenter(center: Vec2.Vec2, size: Vec2.Vec2): Rect {
  return { x: center.x - size.x / 2, y: center.y - size.y / 2, width: size.x, height: size.y };
}

export function makeFromCorners(v1: Vec2.Vec2, v2: Vec2.Vec2): Rect {
  const topLeft = Vec2.min(v1, v2);
  const bottomRight = Vec2.max(v1, v2);
  const size = Vec2.subtract(bottomRight, topLeft);
  return makeFromPositionSize(topLeft, size);
}

export function makeFromPoints(points: readonly Vec2.Vec2[]): Rect | undefined {
  const first = points[0];

  if (first === undefined) return undefined;

  let topLeft = first;
  let bottomRight = first;

  for (const point of points) {
    topLeft = Vec2.min(topLeft, point);
    bottomRight = Vec2.max(bottomRight, point);
  }

  return makeFromCorners(topLeft, bottomRight);
}

// ---------------------------------------------------------------------------------------------------------------------

export function getLeft(r: Rect): number {
  return r.x;
}

export function getRight(r: Rect): number {
  return r.x + r.width;
}

export function getTop(r: Rect): number {
  return r.y;
}

export function getBottom(r: Rect): number {
  return r.y + r.height;
}

export function getPosition(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x, r.y);
}

export function getSize(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.width, r.height);
}

export function getCenter(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x + r.width / 2, r.y + r.height / 2);
}

export function getTopLeft(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x, r.y);
}

export function getTopRight(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x + r.width, r.y);
}

export function getBottomLeft(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x, r.y + r.height);
}

export function getBottomRight(r: Rect): Vec2.Vec2 {
  return Vec2.make(r.x + r.width, r.y + r.height);
}

export function getArea(r: Rect): number {
  return r.width * r.height;
}

export function isEmpty(r: Rect): boolean {
  return r.width <= 0 || r.height <= 0;
}

// ---------------------------------------------------------------------------------------------------------------------

export function translate(r: Rect, offset: Vec2.Vec2): Rect {
  return { x: r.x + offset.x, y: r.y + offset.y, width: r.width, height: r.height };
}

export function moveTo(r: Rect, position: Vec2.Vec2): Rect {
  return { x: position.x, y: position.y, width: r.width, height: r.height };
}

export function moveCenterTo(r: Rect, center: Vec2.Vec2): Rect {
  return { x: center.x - r.width / 2, y: center.y - r.height / 2, width: r.width, height: r.height };
}

export function resize(r: Rect, size: Vec2.Vec2): Rect {
  return { x: r.x, y: r.y, width: size.x, height: size.y };
}

export function expand(r: Rect, amount: number): Rect {
  return { x: r.x - amount, y: r.y - amount, width: r.width + 2 * amount, height: r.height + 2 * amount };
}

// ---------------------------------------------------------------------------------------------------------------------

export function containsPoint(r: Rect, p: Vec2.Vec2): boolean {
  return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height;
}

export function containsRect(outer: Rect, inner: Rect): boolean {
  return (
    getLeft(outer) <= getLeft(inner) &&
    getRight(inner) <= getRight(outer) &&
    getTop(inner) >= getTop(outer) &&
    getBottom(inner) <= getBottom(outer)
  );
}

export function intersects(r1: Rect, r2: Rect): boolean {
  return (
    getLeft(r1) < getRight(r2) && getLeft(r2) < getRight(r1) && getTop(r1) < getBottom(r2) && getTop(r2) < getBottom(r1)
  );
}

export function intersection(r1: Rect, r2: Rect): Rect | undefined {
  if (!intersects(r1, r2)) {
    return undefined;
  }

  return makeFromCorners(Vec2.max(getTopLeft(r1), getTopLeft(r2)), Vec2.min(getBottomRight(r1), getBottomRight(r2)));
}

export function union(r1: Rect, r2: Rect): Rect {
  return makeFromCorners(Vec2.min(getTopLeft(r1), getTopLeft(r2)), Vec2.max(getBottomRight(r1), getBottomRight(r2)));
}

export function clampPoint(r: Rect, p: Vec2.Vec2): Vec2.Vec2 {
  return Vec2.min(Vec2.max(getTopLeft(r), p), getBottomRight(r));
}

// ---------------------------------------------------------------------------------------------------------------------

export function equals(r1: Rect, r2: Rect): boolean {
  return r1.x === r2.x && r1.y === r2.y && r1.width === r2.width && r1.height === r2.height;
}

export function nearlyEquals(r1: Rect, r2: Rect, epsilon = 1e-9): boolean {
  return (
    Math.abs(r1.x - r2.x) <= epsilon &&
    Math.abs(r1.y - r2.y) <= epsilon &&
    Math.abs(r1.width - r2.width) <= epsilon &&
    Math.abs(r1.height - r2.height) <= epsilon
  );
}
