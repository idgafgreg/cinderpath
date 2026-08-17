export function createInput() {
  const keys = new Set();
  const state = {
    x: 0,
    y: 0,
    attack: false,
    pause: false,
    restart: false,
    start: false,
    pointerX: 0,
    pointerY: 0,
  };

  const pressed = new Set();

  function syncAxes() {
    let x = 0;
    let y = 0;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
    state.x = x;
    state.y = y;
  }

  function onKeyDown(event) {
    keys.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
      if (!pressed.has("attack")) {
        state.attack = true;
        pressed.add("attack");
      }
    }
    if (event.code === "Enter") {
      if (!pressed.has("start")) {
        state.start = true;
        pressed.add("start");
      }
    }
    if (event.code === "Escape") {
      if (!pressed.has("pause")) {
        state.pause = true;
        pressed.add("pause");
      }
    }
    if (event.code === "KeyR") {
      if (!pressed.has("restart")) {
        state.restart = true;
        pressed.add("restart");
      }
    }
    syncAxes();
  }

  function onKeyUp(event) {
    keys.delete(event.code);
    if (event.code === "Space") pressed.delete("attack");
    if (event.code === "Enter") pressed.delete("start");
    if (event.code === "Escape") pressed.delete("pause");
    if (event.code === "KeyR") pressed.delete("restart");
    syncAxes();
  }

  function onPointerDown(event) {
    if (event.button === 0) {
      state.attack = true;
      state.start = true;
    }
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("blur", () => keys.clear());

  return {
    sample() {
      const frame = { ...state };
      state.attack = false;
      state.pause = false;
      state.restart = false;
      state.start = false;
      return frame;
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
