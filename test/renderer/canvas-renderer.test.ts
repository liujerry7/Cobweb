import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Camera from "../../src/renderer/camera.ts";
import * as CanvasRenderer from "../../src/renderer/canvas-renderer.ts";
import * as Rect from "../../src/math/rect.ts";
import * as Vec2 from "../../src/math/vec2.ts";

type Call = readonly unknown[];

type FakeCanvas = {
  width: number;
  height: number;
  style: { width?: string; height?: string };
  getContext: (type: string) => CanvasRenderingContext2D | null;
};

const TEXT_METRICS = { width: 50, actualBoundingBoxAscent: 12, actualBoundingBoxDescent: 4 };

function fakeContext(calls: Call[]): CanvasRenderingContext2D {
  const handler: ProxyHandler<object> = {
    get: (_, name) => {
      return (...args: unknown[]) => {
        calls.push([name, ...args]);
        return name === "measureText" ? TEXT_METRICS : undefined;
      };
    },
    set: (_, name, value) => {
      calls.push([`${String(name)} =`, value]);
      return true;
    },
  };
  return new Proxy({}, handler) as CanvasRenderingContext2D;
}

function fakeCanvas(context: CanvasRenderingContext2D | null): FakeCanvas {
  return { width: 300, height: 150, style: {}, getContext: (type) => (type === "2d" ? context : null) };
}

function setup(options: CanvasRenderer.RendererOptions = { pixelRatio: 2 }) {
  const calls: Call[] = [];
  const canvas = fakeCanvas(fakeContext(calls));
  const renderer = CanvasRenderer.make(canvas as unknown as HTMLCanvasElement, options);
  calls.length = 0;
  return { canvas, renderer, calls };
}

function getNames(calls: readonly Call[]): unknown[] {
  return calls.map((call) => call[0]);
}

function findCall(calls: readonly Call[], name: string): Call | undefined {
  return calls.find((call) => call[0] === name);
}

function transformPoint(transform: Call, point: Vec2.Vec2): Vec2.Vec2 {
  const [, a, b, c, d, e, f] = transform as [string, number, number, number, number, number, number];
  return Vec2.make(a * point.x + c * point.y + e, b * point.x + d * point.y + f);
}

const DEFAULT_STYLE: Call[] = [
  ["fillStyle =", "transparent"],
  ["strokeStyle =", "transparent"],
  ["lineWidth =", 1],
  ["globalAlpha =", 1],
];

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make keeps the canvas, its 2d context and the options", () => {
    const calls: Call[] = [];
    const context = fakeContext(calls);
    const canvas = fakeCanvas(context);
    const renderer = CanvasRenderer.make(canvas as unknown as HTMLCanvasElement, { pixelRatio: 3, smoothing: false });
    assert.equal(renderer.canvas, canvas);
    assert.equal(renderer.context, context);
    assert.equal(renderer.pixelRatio, 3);
    assert.equal(renderer.smoothing, false);
  });

  test("make sets image smoothing on the context", () => {
    const calls: Call[] = [];
    CanvasRenderer.make(fakeCanvas(fakeContext(calls)) as unknown as HTMLCanvasElement, {
      smoothing: false,
      pixelRatio: 1,
    });
    assert.deepEqual(calls, [["imageSmoothingEnabled =", false]]);
  });

  test("smoothing is on unless turned off", () => {
    assert.equal(setup().renderer.smoothing, true);
  });

  test("pixelRatio comes from the window unless given", () => {
    const globals = globalThis as { window?: unknown };
    const saved = globals.window;
    globals.window = { devicePixelRatio: 1.5 };
    try {
      assert.equal(setup({}).renderer.pixelRatio, 1.5);
    } finally {
      globals.window = saved;
    }
  });

  test("make throws when the canvas has no 2d context", () => {
    assert.throws(() => CanvasRenderer.make(fakeCanvas(null) as unknown as HTMLCanvasElement, { pixelRatio: 1 }));
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("getSize is the canvas size in CSS pixels", () => {
    const { canvas, renderer } = setup({ pixelRatio: 2 });
    canvas.width = 1600;
    canvas.height = 1200;
    assert.deepEqual(CanvasRenderer.getSize(renderer), Vec2.make(800, 600));
  });

  test("getTextSize measures with the text style and puts the context back", () => {
    const { renderer, calls } = setup();
    const size = CanvasRenderer.getTextSize(renderer, "hello", { font: "20px serif" });
    assert.deepEqual(size, Vec2.make(50, 16));
    assert.deepEqual(calls.at(0), ["save"]);
    assert.deepEqual(findCall(calls, "font ="), ["font =", "20px serif"]);
    assert.deepEqual(calls.at(-2), ["measureText", "hello"]);
    assert.deepEqual(calls.at(-1), ["restore"]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("resize sizes the canvas in real pixels and the page in CSS pixels", () => {
    const { canvas, renderer } = setup({ pixelRatio: 2 });
    CanvasRenderer.resize(renderer, Vec2.make(800, 600));
    assert.equal(canvas.width, 1600);
    assert.equal(canvas.height, 1200);
    assert.deepEqual(canvas.style, { width: "800px", height: "600px" });
  });

  test("resize rounds to whole pixels", () => {
    const { canvas, renderer } = setup({ pixelRatio: 1.5 });
    CanvasRenderer.resize(renderer, Vec2.make(101, 33));
    assert.equal(canvas.width, 152);
    assert.equal(canvas.height, 50);
  });

  test("resize sets smoothing again, because resizing resets the context", () => {
    const { renderer, calls } = setup({ pixelRatio: 1, smoothing: false });
    CanvasRenderer.resize(renderer, Vec2.make(10, 10));
    assert.deepEqual(calls, [["imageSmoothingEnabled =", false]]);
  });

  test("clear turns the transform off and clears every pixel", () => {
    const { canvas, renderer, calls } = setup();
    canvas.width = 640;
    canvas.height = 480;
    CanvasRenderer.clear(renderer);
    assert.deepEqual(calls, [
      ["setTransform", 1, 0, 0, 1, 0, 0],
      ["clearRect", 0, 0, 640, 480],
    ]);
  });

  test("fillScreen turns the transform off and paints every pixel", () => {
    const { canvas, renderer, calls } = setup();
    canvas.width = 640;
    canvas.height = 480;
    CanvasRenderer.fillScreen(renderer, "navy");
    assert.deepEqual(calls, [
      ["setTransform", 1, 0, 0, 1, 0, 0],
      ["fillStyle =", "navy"],
      ["fillRect", 0, 0, 640, 480],
    ]);
  });

  test("setCamera scales by zoom and pixel ratio and centres the camera", () => {
    const { renderer, calls } = setup({ pixelRatio: 2 });
    CanvasRenderer.setCamera(renderer, Camera.make(Vec2.make(800, 600), Vec2.make(100, 50), 2));
    assert.deepEqual(calls, [["setTransform", 4, 0, 0, 4, 400, 400]]);
  });

  test("setCamera puts world points where Camera says, in real pixels", () => {
    const { renderer, calls } = setup({ pixelRatio: 2 });
    const camera = Camera.make(Vec2.make(640, 360), Vec2.make(-30, 75), 1.5);
    CanvasRenderer.setCamera(renderer, camera);
    for (const point of [Vec2.ZERO, Vec2.make(110, 50), Vec2.make(-200, 400)]) {
      const expected = Vec2.scale(Camera.convertWorldToScreen(camera, point), 2);
      assert.ok(Vec2.nearlyEquals(transformPoint(calls[0]!, point), expected));
    }
  });

  test("resetCamera draws in CSS pixels", () => {
    const { renderer, calls } = setup({ pixelRatio: 2 });
    CanvasRenderer.resetCamera(renderer);
    assert.deepEqual(calls, [["setTransform", 2, 0, 0, 2, 0, 0]]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("drawing", () => {
  test("drawRect saves, sets the style, traces, fills and restores", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawRect(renderer, Rect.make(1, 2, 3, 4), { fill: "red" });
    assert.deepEqual(calls, [
      ["save"],
      ["fillStyle =", "red"],
      ["strokeStyle =", "transparent"],
      ["lineWidth =", 1],
      ["globalAlpha =", 1],
      ["beginPath"],
      ["rect", 1, 2, 3, 4],
      ["fill"],
      ["restore"],
    ]);
  });

  test("a stroke-only style strokes and does not fill", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawRect(renderer, Rect.make(0, 0, 1, 1), { stroke: "blue", lineWidth: 3, alpha: 0.5 });
    assert.deepEqual(calls.slice(1, 5), [
      ["fillStyle =", "transparent"],
      ["strokeStyle =", "blue"],
      ["lineWidth =", 3],
      ["globalAlpha =", 0.5],
    ]);
    assert.deepEqual(getNames(calls).slice(-2), ["stroke", "restore"]);
  });

  test("a style with fill and stroke fills, then strokes", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawRect(renderer, Rect.make(0, 0, 1, 1), { fill: "red", stroke: "blue" });
    assert.deepEqual(getNames(calls).slice(-3), ["fill", "stroke", "restore"]);
  });

  test("an empty style paints nothing", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawRect(renderer, Rect.make(0, 0, 1, 1), {});
    assert.deepEqual(calls.slice(1, 5), DEFAULT_STYLE);
    assert.deepEqual(getNames(calls).slice(-2), ["rect", "restore"]);
  });

  test("drawCircle traces a full circle", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawCircle(renderer, Vec2.make(5, 6), 7, { fill: "red" });
    assert.deepEqual(findCall(calls, "arc"), ["arc", 5, 6, 7, 0, Math.PI * 2]);
  });

  test("drawLine traces from one point to the other", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawLine(renderer, Vec2.make(1, 2), Vec2.make(3, 4), { stroke: "white" });
    assert.deepEqual(calls.slice(5, 9), [["beginPath"], ["moveTo", 1, 2], ["lineTo", 3, 4], ["stroke"]]);
  });

  test("drawPolygon traces every point and closes the shape", () => {
    const { renderer, calls } = setup();
    const points = [Vec2.make(0, 0), Vec2.make(10, 0), Vec2.make(5, 8)];
    CanvasRenderer.drawPolygon(renderer, points, { fill: "green" });
    assert.deepEqual(calls.slice(5, 11), [
      ["beginPath"],
      ["moveTo", 0, 0],
      ["lineTo", 10, 0],
      ["lineTo", 5, 8],
      ["closePath"],
      ["fill"],
    ]);
  });

  test("drawPolygon with no points traces nothing", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawPolygon(renderer, [], { fill: "green" });
    assert.equal(findCall(calls, "moveTo"), undefined);
    assert.equal(findCall(calls, "lineTo"), undefined);
  });

  test("drawImage draws the whole image into the destination", () => {
    const { renderer, calls } = setup();
    const image = {} as CanvasImageSource;
    CanvasRenderer.drawImage(renderer, image, Rect.make(10, 20, 30, 40));
    assert.deepEqual(calls, [["drawImage", image, 10, 20, 30, 40]]);
  });

  test("drawImageRegion draws part of the image into the destination", () => {
    const { renderer, calls } = setup();
    const image = {} as CanvasImageSource;
    CanvasRenderer.drawImageRegion(renderer, image, Rect.make(16, 0, 16, 16), Rect.make(100, 50, 32, 32));
    assert.deepEqual(calls, [["drawImage", image, 16, 0, 16, 16, 100, 50, 32, 32]]);
  });

  test("drawText sets the text style and fills the text", () => {
    const { renderer, calls } = setup();
    const style = { fill: "white", font: "12px monospace", align: "center", baseline: "top" } as const;
    CanvasRenderer.drawText(renderer, "hi", Vec2.make(3, 4), style);
    assert.deepEqual(calls, [
      ["save"],
      ["fillStyle =", "white"],
      ["strokeStyle =", "transparent"],
      ["lineWidth =", 1],
      ["globalAlpha =", 1],
      ["font =", "12px monospace"],
      ["textAlign =", "center"],
      ["textBaseline =", "top"],
      ["fillText", "hi", 3, 4],
      ["restore"],
    ]);
  });

  test("drawText strokes the text when the style has a stroke", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawText(renderer, "hi", Vec2.make(3, 4), { fill: "white", stroke: "black" });
    assert.deepEqual(getNames(calls).slice(-3), ["fillText", "strokeText", "restore"]);
  });

  test("drawText falls back to a default font, alignment and baseline", () => {
    const { renderer, calls } = setup();
    CanvasRenderer.drawText(renderer, "hi", Vec2.ZERO, { fill: "white" });
    assert.deepEqual(calls.slice(5, 8), [
      ["font =", "16px sans-serif"],
      ["textAlign =", "left"],
      ["textBaseline =", "alphabetic"],
    ]);
  });
});
