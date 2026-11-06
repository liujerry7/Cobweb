export type Vec2 = { readonly x: number; readonly y: number };

// ---------------------------------------------------------------------------------------------------------------------

export const ZERO: Vec2 = { x: 0, y: 0 };
export const ONE: Vec2 = { x: 1, y: 1 };
export const UP: Vec2 = { x: 0, y: -1 };
export const DOWN: Vec2 = { x: 0, y: 1 };
export const LEFT: Vec2 = { x: -1, y: 0 };
export const RIGHT: Vec2 = { x: 1, y: 0 };

export function make(x: number, y: number): Vec2 {
  return { x, y };
}

export function makeFromAngleRadians(radians: number, length = 1): Vec2 {
  const x = length * Math.cos(radians);
  const y = length * Math.sin(radians);
  return { x, y };
}

// ---------------------------------------------------------------------------------------------------------------------

export function add(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x + v2.x, y: v1.y + v2.y };
}

export function subtract(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x - v2.x, y: v1.y - v2.y };
}

export function scale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

export function multiply(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x * v2.x, y: v1.y * v2.y };
}

export function divide(v1: Vec2, v2: Vec2): Vec2 {
  return { x: v1.x / v2.x, y: v1.y / v2.y };
}

export function negate(v: Vec2): Vec2 {
  return { x: -v.x, y: -v.y };
}

// ---------------------------------------------------------------------------------------------------------------------

export function dot(v1: Vec2, v2: Vec2): number {
  return v1.x * v2.x + v1.y * v2.y;
}

export function cross(v1: Vec2, v2: Vec2): number {
  return v1.x * v2.y - v1.y * v2.x;
}

export function length(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function lengthSquared(v: Vec2): number {
  return v.x * v.x + v.y * v.y;
}

export function distance(v1: Vec2, v2: Vec2): number {
  return length(subtract(v2, v1));
}

export function distanceSquared(v1: Vec2, v2: Vec2): number {
  return lengthSquared(subtract(v2, v1));
}

export function angle(v: Vec2): number {
  return Math.atan2(v.y, v.x);
}

export function angleBetween(v1: Vec2, v2: Vec2): number {
  return Math.atan2(cross(v1, v2), dot(v1, v2));
}

// ---------------------------------------------------------------------------------------------------------------------

export function normalize(v: Vec2): Vec2 {
  const vLength = length(v);
  return vLength === 0 ? ZERO : { x: v.x / vLength, y: v.y / vLength };
}

export function rotateClockwise90(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

export function rotateClockwise(v: Vec2, radians: number): Vec2 {
  const cosResult = Math.cos(radians);
  const sinResult = Math.sin(radians);
  return {
    x: v.x * cosResult - v.y * sinResult,
    y: v.x * sinResult + v.y * cosResult,
  };
}

export function clampLength(v: Vec2, max: number): Vec2 {
  return lengthSquared(v) <= max * max ? v : scale(normalize(v), max);
}

export function reflect(v: Vec2, normal: Vec2): Vec2 {
  const normalComponent = scale(normal, dot(v, normal));
  const tangentComponent = subtract(v, normalComponent);
  return add(negate(normalComponent), tangentComponent);
}

export function project(from: Vec2, onto: Vec2): Vec2 {
  const normalized = normalize(onto);
  return scale(normalized, dot(from, normalized));
}

// ---------------------------------------------------------------------------------------------------------------------

export function lerp(v1: Vec2, v2: Vec2, t: number): Vec2 {
  return add(v1, scale(subtract(v2, v1), t));
}

export function min(v1: Vec2, v2: Vec2): Vec2 {
  return { x: Math.min(v1.x, v2.x), y: Math.min(v1.y, v2.y) };
}

export function max(v1: Vec2, v2: Vec2): Vec2 {
  return { x: Math.max(v1.x, v2.x), y: Math.max(v1.y, v2.y) };
}

export function round(v: Vec2): Vec2 {
  return { x: Math.round(v.x), y: Math.round(v.y) };
}

export function floor(v: Vec2): Vec2 {
  return { x: Math.floor(v.x), y: Math.floor(v.y) };
}

export function equals(v1: Vec2, v2: Vec2): boolean {
  return v1.x === v2.x && v1.y === v2.y;
}

export function nearlyEquals(v1: Vec2, v2: Vec2, epsilon = 1e-9): boolean {
  return Math.abs(v1.x - v2.x) < epsilon && Math.abs(v1.y - v2.y) < epsilon;
}
