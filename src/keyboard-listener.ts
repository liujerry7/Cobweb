import type { KeyEvent } from "./keyboard.ts";
import * as Sets from "./sets.ts";

export type KeyboardListener = {
  readonly drain: () => readonly KeyEvent[];
  readonly stop: () => void;
};

export type KeyboardTarget = Pick<Window, "addEventListener" | "removeEventListener">;

// ---------------------------------------------------------------------------------------------------------------------

export function start(target: KeyboardTarget = window): KeyboardListener {
  let queue: readonly KeyEvent[] = [];
  let down: ReadonlySet<string> = Sets.make<string>();

  const enqueue = (events: readonly KeyEvent[]) => {
    queue = [...queue, ...events];
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    down = Sets.add(down, event.code);
    enqueue([keyDown(event.code)]);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    down = Sets.remove(down, event.code);
    enqueue([keyUp(event.code)]);
  };

  const onBlur = () => {
    enqueue([...Sets.map(down, keyUp)]);
    down = Sets.clear(down);
  };

  target.addEventListener("keydown", onKeyDown);
  target.addEventListener("keyup", onKeyUp);
  target.addEventListener("blur", onBlur);

  return {
    drain: () => {
      const drained = queue;
      queue = [];
      return drained;
    },
    stop: () => {
      target.removeEventListener("keydown", onKeyDown);
      target.removeEventListener("keyup", onKeyUp);
      target.removeEventListener("blur", onBlur);
      queue = [];
      down = Sets.clear(down);
    },
  };
}

// ---------------------------------------------------------------------------------------------------------------------

function keyDown(code: string): KeyEvent {
  return { kind: "down", code };
}

function keyUp(code: string): KeyEvent {
  return { kind: "up", code };
}
