import assert from "node:assert/strict";
import { describe, test } from "node:test";
import * as Camera from "../../src/renderer/camera.ts";
import * as Rect from "../../src/math/rect.ts";
import * as Vec2 from "../../src/math/vec2.ts";

const VIEWPORT = Vec2.make(800, 600);

function camera(fields: Partial<Camera.Camera> = {}): Camera.Camera {
  return Object.freeze({ ...Camera.make(VIEWPORT), ...fields });
}

function vec(x: number, y: number): Vec2.Vec2 {
  return Vec2.make(x, y);
}

function assertVec(actual: Vec2.Vec2, expected: Vec2.Vec2): void {
  assert.ok(
    Vec2.nearlyEquals(actual, expected),
    `expected (${expected.x}, ${expected.y}), got (${actual.x}, ${actual.y})`,
  );
}

// ---------------------------------------------------------------------------------------------------------------------

describe("making one", () => {
  test("make centres on the origin at zoom 1 by default", () => {
    assert.deepEqual(Camera.make(VIEWPORT), { position: Vec2.ZERO, zoom: 1, viewport: VIEWPORT });
  });

  test("make takes a position and a zoom", () => {
    assert.deepEqual(Camera.make(VIEWPORT, vec(10, 20), 2), { position: vec(10, 20), zoom: 2, viewport: VIEWPORT });
  });

  test("make keeps the zoom above zero", () => {
    assert.ok(Camera.make(VIEWPORT, Vec2.ZERO, 0).zoom > 0);
    assert.ok(Camera.make(VIEWPORT, Vec2.ZERO, -3).zoom > 0);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("reading", () => {
  test("the camera's position is drawn at the middle of the screen", () => {
    assertVec(Camera.convertWorldToScreen(camera({ position: vec(100, 50) }), vec(100, 50)), vec(400, 300));
  });

  test("convertWorldToScreen scales the distance from the camera by the zoom", () => {
    const c = camera({ position: vec(100, 50), zoom: 2 });
    assertVec(Camera.convertWorldToScreen(c, vec(110, 40)), vec(420, 280));
  });

  test("the middle of the screen is the camera's position in the world", () => {
    assertVec(Camera.convertScreenToWorld(camera({ position: vec(100, 50) }), vec(400, 300)), vec(100, 50));
  });

  test("convertScreenToWorld divides the distance from the middle by the zoom", () => {
    const c = camera({ position: vec(100, 50), zoom: 2 });
    assertVec(Camera.convertScreenToWorld(c, vec(420, 280)), vec(110, 40));
    assertVec(Camera.convertScreenToWorld(c, Vec2.ZERO), vec(-100, -100));
  });

  test("converting to the screen and back gives the same point", () => {
    const c = camera({ position: vec(-37, 12.5), zoom: 1.75 });
    assertVec(Camera.convertScreenToWorld(c, Camera.convertWorldToScreen(c, vec(3, -8))), vec(3, -8));
    assertVec(Camera.convertWorldToScreen(c, Camera.convertScreenToWorld(c, vec(123, 456))), vec(123, 456));
  });

  test("getVisibleSize is the viewport divided by the zoom", () => {
    assertVec(Camera.getVisibleSize(camera()), vec(800, 600));
    assertVec(Camera.getVisibleSize(camera({ zoom: 2 })), vec(400, 300));
    assertVec(Camera.getVisibleSize(camera({ zoom: 0.5 })), vec(1600, 1200));
  });

  test("getVisibleRect is the visible size centred on the position", () => {
    const visible = Camera.getVisibleRect(camera({ position: vec(100, 50), zoom: 2 }));
    assert.ok(Rect.nearlyEquals(visible, Rect.make(-100, -100, 400, 300)));
  });

  test("isVisible is true for a rect that overlaps the view", () => {
    const c = camera();
    assert.equal(Camera.isVisible(c, Rect.make(-10, -10, 20, 20)), true);
    assert.equal(Camera.isVisible(c, Rect.make(390, 290, 50, 50)), true);
  });

  test("isVisible is false for a rect outside the view or only touching its edge", () => {
    const c = camera();
    assert.equal(Camera.isVisible(c, Rect.make(500, 0, 10, 10)), false);
    assert.equal(Camera.isVisible(c, Rect.make(400, 0, 10, 10)), false);
  });

  test("isVisible follows the zoom", () => {
    const far = Rect.make(300, 0, 10, 10);
    assert.equal(Camera.isVisible(camera(), far), true);
    assert.equal(Camera.isVisible(camera({ zoom: 2 }), far), false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("changing", () => {
  test("moveTo puts the camera at a position", () => {
    assert.deepEqual(Camera.moveTo(camera({ zoom: 2 }), vec(5, 6)), camera({ zoom: 2, position: vec(5, 6) }));
  });

  test("translate moves the camera by an offset", () => {
    assertVec(Camera.translate(camera({ position: vec(5, 6) }), vec(-1, 4)).position, vec(4, 10));
  });

  test("setZoom changes only the zoom", () => {
    const c = camera({ position: vec(5, 6) });
    assert.deepEqual(Camera.setZoom(c, 3), { ...c, zoom: 3 });
  });

  test("setZoom keeps the zoom above zero", () => {
    assert.ok(Camera.setZoom(camera(), 0).zoom > 0);
    assert.ok(Camera.setZoom(camera(), -1).zoom > 0);
  });

  test("zoomBy multiplies the zoom", () => {
    assert.equal(Camera.zoomBy(camera({ zoom: 2 }), 1.5).zoom, 3);
    assert.equal(Camera.zoomBy(camera({ zoom: 2 }), 0.5).zoom, 1);
  });

  test("zoomBy keeps the zoom above zero", () => {
    assert.ok(Camera.zoomBy(camera(), 0).zoom > 0);
  });

  test("zoomAt keeps the world point under the screen point where it was", () => {
    const c = camera({ position: vec(100, 50), zoom: 2 });
    const mouse = vec(650, 120);
    const zoomed = Camera.zoomAt(c, 1.5, mouse);
    assert.equal(zoomed.zoom, 3);
    assertVec(Camera.convertScreenToWorld(zoomed, mouse), Camera.convertScreenToWorld(c, mouse));
  });

  test("zoomAt the middle of the screen is the same as zoomBy", () => {
    const c = camera({ position: vec(100, 50) });
    const zoomed = Camera.zoomAt(c, 2, vec(400, 300));
    assert.ok(Camera.nearlyEquals(zoomed, Camera.zoomBy(c, 2)));
  });

  test("resize changes only the viewport, so the position stays in the middle", () => {
    const c = camera({ position: vec(100, 50), zoom: 2 });
    const resized = Camera.resize(c, vec(1920, 1080));
    assert.deepEqual(resized, { ...c, viewport: vec(1920, 1080) });
    assertVec(Camera.convertWorldToScreen(resized, vec(100, 50)), vec(960, 540));
  });

  test("follow moves part of the way to the target", () => {
    const c = camera({ position: vec(0, 0) });
    assertVec(Camera.follow(c, vec(100, -50), 0.1).position, vec(10, -5));
    assertVec(Camera.follow(c, vec(100, -50), 1).position, vec(100, -50));
    assertVec(Camera.follow(c, vec(100, -50), 0).position, vec(0, 0));
  });

  test("following every step closes in on the target", () => {
    let c = camera();
    for (let step = 0; step < 100; step++) {
      c = Camera.follow(c, vec(100, 0), 0.1);
    }
    assert.ok(Math.abs(c.position.x - 100) < 0.01, `ended at ${c.position.x}`);
  });

  describe("clampTo", () => {
    const level = Rect.make(0, 0, 2000, 1000);

    test("a view already inside the level is left where it is", () => {
      assertVec(Camera.clampTo(camera({ position: vec(1000, 500) }), level).position, vec(1000, 500));
    });

    test("a view past the left and top edges is pushed back in", () => {
      assertVec(Camera.clampTo(camera({ position: vec(-50, 10) }), level).position, vec(400, 300));
    });

    test("a view past the right and bottom edges is pushed back in", () => {
      assertVec(Camera.clampTo(camera({ position: vec(1900, 990) }), level).position, vec(1600, 700));
    });

    test("zooming in lets the camera go closer to the edges", () => {
      assertVec(Camera.clampTo(camera({ position: vec(-50, 10), zoom: 2 }), level).position, vec(200, 150));
    });

    test("a level smaller than the view is centred", () => {
      const small = Rect.make(100, 100, 300, 200);
      assertVec(Camera.clampTo(camera({ position: vec(-999, 999) }), small).position, vec(250, 200));
    });

    test("each axis is clamped on its own", () => {
      const wide = Rect.make(0, 0, 2000, 400);
      assertVec(Camera.clampTo(camera({ position: vec(1000, 0) }), wide).position, vec(1000, 200));
    });
  });

  test("inputs are left unchanged", () => {
    const c = camera({ position: vec(1, 2), zoom: 1.5 });
    Camera.moveTo(c, vec(9, 9));
    Camera.translate(c, vec(1, 1));
    Camera.setZoom(c, 4);
    Camera.zoomBy(c, 2);
    Camera.zoomAt(c, 2, vec(10, 10));
    Camera.resize(c, vec(10, 10));
    Camera.follow(c, vec(50, 50), 0.5);
    Camera.clampTo(c, Rect.make(0, 0, 10, 10));
    Camera.lerp(c, camera(), 0.5);
    assert.deepEqual(c, camera({ position: vec(1, 2), zoom: 1.5 }));
  });
});

// ---------------------------------------------------------------------------------------------------------------------

describe("comparing", () => {
  const from = camera({ position: vec(0, 0), zoom: 1 });
  const to = camera({ position: vec(10, -20), zoom: 3, viewport: vec(1024, 768) });

  test("lerp blends the position and the zoom", () => {
    const halfway = Camera.lerp(from, to, 0.5);
    assertVec(halfway.position, vec(5, -10));
    assert.equal(halfway.zoom, 2);
  });

  test("lerp at 0 and 1 gives the two ends", () => {
    assert.ok(Camera.nearlyEquals(Camera.lerp(from, to, 0), { ...from, viewport: to.viewport }));
    assert.ok(Camera.nearlyEquals(Camera.lerp(from, to, 1), to));
  });

  test("lerp takes the viewport from the camera it is heading to", () => {
    assertVec(Camera.lerp(from, to, 0.25).viewport, vec(1024, 768));
  });

  test("equals compares position, zoom and viewport", () => {
    const c = camera({ position: vec(1, 2), zoom: 2 });
    assert.equal(Camera.equals(c, camera({ position: vec(1, 2), zoom: 2 })), true);
    assert.equal(Camera.equals(c, { ...c, position: vec(1, 3) }), false);
    assert.equal(Camera.equals(c, { ...c, zoom: 2.5 }), false);
    assert.equal(Camera.equals(c, { ...c, viewport: vec(1, 1) }), false);
  });

  test("nearlyEquals allows tiny floating-point differences", () => {
    const c = camera({ position: vec(0.1 + 0.2, 0), zoom: 2 });
    assert.equal(Camera.equals(c, camera({ position: vec(0.3, 0), zoom: 2 })), false);
    assert.equal(Camera.nearlyEquals(c, camera({ position: vec(0.3, 0), zoom: 2 })), true);
    assert.equal(Camera.nearlyEquals(c, camera({ position: vec(0.31, 0), zoom: 2 })), false);
  });
});
