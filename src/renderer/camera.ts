import * as Vec2 from "../math/vec2.ts";
import * as Rect from "../math/rect.ts";

export type Camera = {
  readonly position: Vec2.Vec2;
  readonly zoom: number;
  readonly viewport: Vec2.Vec2;
};

const MIN_ZOOM = 0.001;

// ---------------------------------------------------------------------------------------------------------------------

export function make(viewport: Vec2.Vec2, position = Vec2.ZERO, zoom = 1): Camera {
  return {
    position,
    zoom: clampZoom(zoom),
    viewport,
  };
}

// ---------------------------------------------------------------------------------------------------------------------

export function convertWorldToScreen(camera: Camera, point: Vec2.Vec2): Vec2.Vec2 {
  const fromCamera = Vec2.subtract(point, camera.position);
  return Vec2.add(Vec2.scale(fromCamera, camera.zoom), getHalfViewport(camera));
}

export function convertScreenToWorld(camera: Camera, point: Vec2.Vec2): Vec2.Vec2 {
  const fromCenter = Vec2.subtract(point, getHalfViewport(camera));
  return Vec2.add(Vec2.scale(fromCenter, 1 / camera.zoom), camera.position);
}

export function getVisibleSize(camera: Camera): Vec2.Vec2 {
  return Vec2.scale(camera.viewport, 1 / camera.zoom);
}

export function getVisibleRect(camera: Camera): Rect.Rect {
  return Rect.makeFromCenter(camera.position, getVisibleSize(camera));
}

export function isVisible(camera: Camera, rect: Rect.Rect): boolean {
  return Rect.intersects(getVisibleRect(camera), rect);
}

// ---------------------------------------------------------------------------------------------------------------------

export function moveTo(camera: Camera, position: Vec2.Vec2): Camera {
  return {
    ...camera,
    position,
  };
}

export function translate(camera: Camera, offset: Vec2.Vec2): Camera {
  return {
    ...camera,
    position: Vec2.add(camera.position, offset),
  };
}

export function setZoom(camera: Camera, zoom: number): Camera {
  return {
    ...camera,
    zoom: clampZoom(zoom),
  };
}

export function zoomBy(camera: Camera, factor: number): Camera {
  return setZoom(camera, camera.zoom * factor);
}

export function zoomAt(camera: Camera, factor: number, screenPoint: Vec2.Vec2): Camera {
  const anchor = convertScreenToWorld(camera, screenPoint);
  const zoomed = zoomBy(camera, factor);
  const drift = Vec2.subtract(anchor, convertScreenToWorld(zoomed, screenPoint));
  return translate(zoomed, drift);
}

export function resize(camera: Camera, viewport: Vec2.Vec2): Camera {
  return {
    ...camera,
    viewport,
  };
}

export function follow(camera: Camera, target: Vec2.Vec2, smoothing: number): Camera {
  return moveTo(camera, Vec2.lerp(camera.position, target, smoothing));
}

export function clampTo(camera: Camera, bounds: Rect.Rect): Camera {
  const half = Vec2.scale(getVisibleSize(camera), 0.5);
  const x = clampAxis(camera.position.x, Rect.getLeft(bounds), Rect.getRight(bounds), half.x);
  const y = clampAxis(camera.position.y, Rect.getTop(bounds), Rect.getBottom(bounds), half.y);
  return moveTo(camera, Vec2.make(x, y));
}

// ---------------------------------------------------------------------------------------------------------------------

export function lerp(from: Camera, to: Camera, t: number): Camera {
  return {
    position: Vec2.lerp(from.position, to.position, t),
    zoom: from.zoom + (to.zoom - from.zoom) * t,
    viewport: to.viewport,
  };
}

export function equals(c1: Camera, c2: Camera): boolean {
  return Vec2.equals(c1.position, c2.position) && c1.zoom === c2.zoom && Vec2.equals(c1.viewport, c2.viewport);
}

export function nearlyEquals(c1: Camera, c2: Camera, epsilon = 1e-9): boolean {
  return (
    Vec2.nearlyEquals(c1.position, c2.position, epsilon) &&
    Math.abs(c1.zoom - c2.zoom) <= epsilon &&
    Vec2.nearlyEquals(c1.viewport, c2.viewport, epsilon)
  );
}

// ---------------------------------------------------------------------------------------------------------------------

function getHalfViewport(camera: Camera): Vec2.Vec2 {
  return Vec2.scale(camera.viewport, 0.5);
}

function clampZoom(zoom: number): number {
  return Math.max(zoom, MIN_ZOOM);
}

function clampAxis(position: number, min: number, max: number, halfView: number): number {
  if (max - min <= halfView * 2) {
    return (min + max) / 2;
  }

  return Math.min(Math.max(position, min + halfView), max - halfView);
}
