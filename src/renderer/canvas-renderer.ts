import * as Camera from "./camera.ts";
import * as Rect from "../math/rect.ts";
import * as Vec2 from "../math/vec2.ts";

export type CanvasRenderer = {
  readonly canvas: HTMLCanvasElement;
  readonly context: CanvasRenderingContext2D;
  readonly pixelRatio: number;
  readonly smoothing: boolean;
};

export type RendererOptions = {
  readonly pixelRatio?: number;
  readonly smoothing?: boolean;
};

export type Style = {
  readonly fill?: string;
  readonly stroke?: string;
  readonly lineWidth?: number;
  readonly alpha?: number;
};

export type TextStyle = Style & {
  readonly font?: string;
  readonly align?: CanvasTextAlign;
  readonly baseline?: CanvasTextBaseline;
};

// ---------------------------------------------------------------------------------------------------------------------

export function make(canvas: HTMLCanvasElement, options: RendererOptions = {}): CanvasRenderer {
  const context = canvas.getContext("2d");

  if (context === null) {
    throw new Error("This browser cannot draw 2d canvases");
  }

  const renderer: CanvasRenderer = {
    canvas,
    context,
    pixelRatio: options.pixelRatio ?? window.devicePixelRatio,
    smoothing: options.smoothing ?? true,
  };

  context.imageSmoothingEnabled = renderer.smoothing;

  return renderer;
}

// ---------------------------------------------------------------------------------------------------------------------

export function getSize(renderer: CanvasRenderer): Vec2.Vec2 {
  return Vec2.scale(Vec2.make(renderer.canvas.width, renderer.canvas.height), 1 / renderer.pixelRatio);
}

export function getTextSize(renderer: CanvasRenderer, text: string, style: TextStyle = {}): Vec2.Vec2 {
  const { context } = renderer;

  context.save();
  setTextStyle(context, style);

  const metrics = context.measureText(text);

  context.restore();

  return Vec2.make(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
}

// ---------------------------------------------------------------------------------------------------------------------

export function resize(renderer: CanvasRenderer, size: Vec2.Vec2): void {
  const { canvas, context, pixelRatio } = renderer;

  canvas.width = Math.round(size.x * pixelRatio);
  canvas.height = Math.round(size.y * pixelRatio);
  canvas.style.width = `${size.x}px`;
  canvas.style.height = `${size.y}px`;
  context.imageSmoothingEnabled = renderer.smoothing;
}

export function clear(renderer: CanvasRenderer): void {
  const { canvas, context } = renderer;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, canvas.width, canvas.height);
}

export function fillScreen(renderer: CanvasRenderer, color: string): void {
  const { canvas, context } = renderer;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.fillStyle = color;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

export function setCamera(renderer: CanvasRenderer, camera: Camera.Camera): void {
  const scale = camera.zoom * renderer.pixelRatio;
  const offset = Vec2.subtract(Vec2.scale(camera.viewport, 0.5), Vec2.scale(camera.position, camera.zoom));
  const shift = Vec2.scale(offset, renderer.pixelRatio);
  renderer.context.setTransform(scale, 0, 0, scale, shift.x, shift.y);
}

export function resetCamera(renderer: CanvasRenderer): void {
  const { context, pixelRatio } = renderer;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
}

// ---------------------------------------------------------------------------------------------------------------------

export function drawRect(renderer: CanvasRenderer, rect: Rect.Rect, style: Style): void {
  draw(renderer.context, style, (context) => context.rect(rect.x, rect.y, rect.width, rect.height));
}

export function drawCircle(renderer: CanvasRenderer, center: Vec2.Vec2, radius: number, style: Style): void {
  draw(renderer.context, style, (context) => context.arc(center.x, center.y, radius, 0, Math.PI * 2));
}

export function drawLine(renderer: CanvasRenderer, from: Vec2.Vec2, to: Vec2.Vec2, style: Style): void {
  draw(renderer.context, style, (context) => traceLine(context, [from, to]));
}

export function drawPolygon(renderer: CanvasRenderer, points: readonly Vec2.Vec2[], style: Style): void {
  draw(renderer.context, style, (context) => tracePolygon(context, points));
}

export function drawImage(renderer: CanvasRenderer, image: CanvasImageSource, destination: Rect.Rect): void {
  const { x, y, width, height } = destination;
  renderer.context.drawImage(image, x, y, width, height);
}

export function drawImageRegion(
  renderer: CanvasRenderer,
  image: CanvasImageSource,
  source: Rect.Rect,
  destination: Rect.Rect,
): void {
  renderer.context.drawImage(
    image,
    source.x,
    source.y,
    source.width,
    source.height,
    destination.x,
    destination.y,
    destination.width,
    destination.height,
  );
}

export function drawText(renderer: CanvasRenderer, text: string, position: Vec2.Vec2, style: TextStyle): void {
  const { context } = renderer;

  context.save();
  setTextStyle(context, style);

  if (style.fill !== undefined) {
    context.fillText(text, position.x, position.y);
  }
  if (style.stroke !== undefined) {
    context.strokeText(text, position.x, position.y);
  }

  context.restore();
}

// ---------------------------------------------------------------------------------------------------------------------

function draw(context: CanvasRenderingContext2D, style: Style, trace: (context: CanvasRenderingContext2D) => void) {
  context.save();
  setStyle(context, style);
  context.beginPath();
  trace(context);

  if (style.fill !== undefined) {
    context.fill();
  }

  if (style.stroke !== undefined) {
    context.stroke();
  }

  context.restore();
}

function setStyle(context: CanvasRenderingContext2D, style: Style): void {
  context.fillStyle = style.fill ?? "transparent";
  context.strokeStyle = style.stroke ?? "transparent";
  context.lineWidth = style.lineWidth ?? 1;
  context.globalAlpha = style.alpha ?? 1;
}

function setTextStyle(context: CanvasRenderingContext2D, style: TextStyle): void {
  setStyle(context, style);
  context.font = style.font ?? "16px sans-serif";
  context.textAlign = style.align ?? "left";
  context.textBaseline = style.baseline ?? "alphabetic";
}

function traceLine(context: CanvasRenderingContext2D, points: readonly Vec2.Vec2[]): void {
  const [first, ...rest] = points;

  if (first === undefined) {
    return;
  }

  context.moveTo(first.x, first.y);

  for (const point of rest) {
    context.lineTo(point.x, point.y);
  }
}

function tracePolygon(context: CanvasRenderingContext2D, points: readonly Vec2.Vec2[]): void {
  traceLine(context, points);
  context.closePath();
}
