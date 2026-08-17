import { PLAYER_DEF, ZONE_DEF } from "../content/catalog.js";
import { createInput } from "./input.js";
import { createRenderer } from "./render.js";
import { PHASE, createGame, snapshot, step } from "./sim.js";

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get("seed") || 1);
const fixture = params.get("fixture");
const debug = params.has("debug");

const canvas = document.querySelector("#stage");
const hud = {
  phase: document.querySelector("[data-phase]"),
  fuel: document.querySelector("[data-fuel]"),
  fuelFill: document.querySelector("[data-fuel-fill]"),
  objective: document.querySelector("[data-objective]"),
  banner: document.querySelector("[data-banner]"),
  stats: document.querySelector("[data-stats]"),
  debug: document.querySelector("[data-debug]"),
};

const input = createInput();
const view = createRenderer(canvas);
let state = createGame({ seed, fixture: fixture || null });
if (fixture) state.phase = PHASE.PLAY;

let last = performance.now();

function bannerFor(phase) {
  if (phase === PHASE.TITLE) {
    return {
      title: "Cinderpath",
      body: "Carry the last lantern down the ash road. Reach the wayshrine before the wick dies.",
      prompt: "Enter or click to walk",
    };
  }
  if (phase === PHASE.PAUSED) {
    return { title: "Held", body: "The road waits.", prompt: "Esc to continue · R to begin again" };
  }
  if (phase === PHASE.WIN) {
    return { title: "The shrine takes the fire", body: "The wickwarden delivered the light.", prompt: "R to walk it again" };
  }
  if (phase === PHASE.LOSE) {
    return { title: "The lantern went out", body: "Ash closed over the road.", prompt: "R to strike the flint again" };
  }
  return null;
}

function paint(events) {
  const fuelPct = Math.max(0, state.player.fuel / PLAYER_DEF.maxFuel);
  hud.fuel.textContent = `${Math.ceil(state.player.fuel)}`;
  hud.fuelFill.style.transform = `scaleX(${fuelPct})`;
  hud.fuelFill.dataset.low = fuelPct < 0.28 ? "true" : "false";
  hud.phase.textContent = state.phase;

  const shrineDist = Math.hypot(state.player.x - ZONE_DEF.shrine.x, state.player.z - ZONE_DEF.shrine.z);
  hud.objective.textContent =
    state.phase === PHASE.PLAY
      ? `Wayshrine ${shrineDist.toFixed(1)}m · cinders ${state.stats.cinders}`
      : "Keep the lantern alive";

  const banner = bannerFor(state.phase);
  hud.banner.hidden = !banner;
  if (banner) {
    hud.banner.querySelector("h1").textContent = banner.title;
    hud.banner.querySelector("p").textContent = banner.body;
    hud.banner.querySelector("small").textContent = banner.prompt;
  }

  hud.stats.textContent = `${state.stats.kills} wights · ${state.stats.hitsLanded} hits · ${state.time.toFixed(1)}s`;
  if (debug) {
    hud.debug.hidden = false;
    hud.debug.textContent = JSON.stringify(snapshot(state), null, 2);
  }

  view.sync(state, events);
  view.render();
}

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  const events = step(state, input.sample(), dt);
  paint(events);
  requestAnimationFrame(frame);
}

paint([]);
requestAnimationFrame(frame);
