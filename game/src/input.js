export function createInput(root = document) {
  const keys = new Set();
  const state = {
    x: 0,
    y: 0,
    attack: false,
    pause: false,
    restart: false,
    start: false,
    mute: false,
  };

  const pressed = new Set();
  const stick = { x: 0, y: 0, active: false };
  const touchLayer = root.querySelector("[data-touch]");
  const stickEl = root.querySelector("[data-stick]");
  const knobEl = root.querySelector("[data-stick-knob]");
  const swingEl = root.querySelector("[data-swing]");

  function syncAxes() {
    let x = stick.x;
    let y = stick.y;
    if (keys.has("KeyA") || keys.has("ArrowLeft")) x -= 1;
    if (keys.has("KeyD") || keys.has("ArrowRight")) x += 1;
    if (keys.has("KeyW") || keys.has("ArrowUp")) y -= 1;
    if (keys.has("KeyS") || keys.has("ArrowDown")) y += 1;
    state.x = Math.max(-1, Math.min(1, x));
    state.y = Math.max(-1, Math.min(1, y));
  }

  function revealTouch() {
    if (touchLayer) touchLayer.hidden = false;
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
    if (event.code === "KeyM") {
      if (!pressed.has("mute")) {
        state.mute = true;
        pressed.add("mute");
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
    if (event.code === "KeyM") pressed.delete("mute");
    syncAxes();
  }

  function onPointerDown(event) {
    if (event.target.closest?.("[data-touch]")) return;
    if (event.button === 0) {
      state.attack = true;
      state.start = true;
    }
  }

  function setStickFromEvent(event) {
    if (!stickEl) return;
    const rect = stickEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (event.clientX - cx) / (rect.width * 0.5);
    const dy = (event.clientY - cy) / (rect.height * 0.5);
    const mag = Math.hypot(dx, dy);
    const nx = mag > 1 ? dx / mag : dx;
    const ny = mag > 1 ? dy / mag : dy;
    stick.x = nx;
    stick.y = ny;
    stick.active = true;
    if (knobEl) {
      knobEl.style.transform = `translate(${nx * 22}px, ${ny * 22}px)`;
    }
    syncAxes();
  }

  function clearStick() {
    stick.x = 0;
    stick.y = 0;
    stick.active = false;
    if (knobEl) knobEl.style.transform = "translate(0, 0)";
    syncAxes();
  }

  function onStickDown(event) {
    event.preventDefault();
    event.stopPropagation();
    revealTouch();
    stickEl.setPointerCapture?.(event.pointerId);
    setStickFromEvent(event);
  }

  function onStickMove(event) {
    if (!stick.active) return;
    setStickFromEvent(event);
  }

  function onSwing(event) {
    event.preventDefault();
    event.stopPropagation();
    revealTouch();
    state.attack = true;
    state.start = true;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("blur", () => keys.clear());
  window.addEventListener("touchstart", revealTouch, { passive: true, once: true });

  if (window.matchMedia?.("(pointer: coarse)").matches) revealTouch();

  stickEl?.addEventListener("pointerdown", onStickDown);
  stickEl?.addEventListener("pointermove", onStickMove);
  stickEl?.addEventListener("pointerup", clearStick);
  stickEl?.addEventListener("pointercancel", clearStick);
  swingEl?.addEventListener("pointerdown", onSwing);

  return {
    sample() {
      const frame = { ...state };
      state.attack = false;
      state.pause = false;
      state.restart = false;
      state.start = false;
      state.mute = false;
      return frame;
    },
    dispose() {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("pointerdown", onPointerDown);
    },
  };
}
