import { PLAYER_DEF, ZONE_DEF } from "../content/catalog.js";
import { createInput } from "./input.js";
import { clearSave, loadGhost, loadSave, writeCheckpoint, writeGhost } from "./persist.js";
import { createRenderer } from "./render.js";
import { PHASE, createGame, outroFor, pendingWave, snapshot, step, weatherFor } from "./sim.js";

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
  oil: document.querySelector("[data-oil]"),
  weather: document.querySelector("[data-weather]"),
  wave: document.querySelector("[data-wave]"),
  waveLabel: document.querySelector("[data-wave-label]"),
  waveCount: document.querySelector("[data-wave-count]"),
};

const input = createInput();
const view = createRenderer(canvas);
let checkpoint = fixture ? null : loadSave();
const lastGhost = fixture ? null : loadGhost();
let state = createGame({ seed, fixture: fixture || null, save: checkpoint, ghost: lastGhost });
if (fixture) state.phase = PHASE.PLAY;

let last = performance.now();

function nextObjective() {
  if (!state.litShrines.includes("wayshrine")) {
    const shrine = ZONE_DEF.shrines[0];
    const dist = Math.hypot(state.player.x - shrine.x, state.player.z - shrine.z);
    return `Wayshrine ${dist.toFixed(1)}m · cinders ${state.stats.cinders}`;
  }
  const hearth = ZONE_DEF.shrines[1];
  const dist = Math.hypot(state.player.x - hearth.x, state.player.z - hearth.z);
  return `Ember hearth ${dist.toFixed(1)}m · cinders ${state.stats.cinders}`;
}

function bannerFor(phase) {
  const hasCheckpoint = Boolean(checkpoint) || state.litShrines.length > 0;
  if (phase === PHASE.TITLE) {
    return {
      title: "Cinderpath",
      body: hasCheckpoint
        ? "The wayshrine still holds your fire. Walk on, or strike the flint again."
        : "Carry the last lantern down the ash road. Light the wayshrine, then the hearth, before the wick dies.",
      prompt: hasCheckpoint ? "Enter to continue · R to begin again" : "Enter or tap to walk",
    };
  }
  if (phase === PHASE.PAUSED) {
    return { title: "Held", body: "The road waits.", prompt: "Esc to continue · R to begin again" };
  }
  if (phase === PHASE.WIN) {
    const outro = outroFor(state);
    if (outro && !outro.bannerReady) return null;
    return {
      title: "The hearth takes the fire",
      body: `The wickwarden delivered the light with ${Math.ceil(state.player.fuel)} wick to spare.`,
      prompt: "R to walk it again",
    };
  }
  if (phase === PHASE.LOSE) {
    return {
      title: "The lantern went out",
      body: hasCheckpoint ? "Ash closed over the road. The last shrine still remembers." : "Ash closed over the road.",
      prompt: hasCheckpoint ? "Enter to continue · R to strike the flint again" : "R to strike the flint again",
    };
  }
  return null;
}

function paint(events) {
  const fuelPct = Math.max(0, state.player.fuel / PLAYER_DEF.maxFuel);
  hud.fuel.textContent = `${Math.ceil(state.player.fuel)}`;
  hud.fuelFill.style.transform = `scaleX(${fuelPct})`;
  hud.fuelFill.dataset.low = fuelPct < 0.28 ? "true" : "false";
  if (hud.oil) hud.oil.hidden = !state.upgrades?.brightOil;
  if (hud.weather) hud.weather.textContent = weatherFor(state).id;
  hud.phase.textContent = state.phase;

  hud.objective.textContent = state.phase === PHASE.PLAY ? nextObjective() : "Keep the lantern alive";

  const banner = bannerFor(state.phase);
  hud.banner.hidden = !banner;
  if (banner) {
    hud.banner.querySelector("h1").textContent = banner.title;
    hud.banner.querySelector("p").textContent = banner.body;
    hud.banner.querySelector("small").textContent = banner.prompt;
  }

  const wave = pendingWave(state);
  if (hud.wave) {
    const showWave = wave && state.phase === PHASE.PLAY;
    hud.wave.hidden = !showWave;
    if (showWave) {
      hud.waveLabel.textContent = wave.label;
      hud.waveCount.textContent = wave.remaining.toFixed(1);
    }
  }

  hud.stats.textContent = `${state.stats.kills} slain · ${state.stats.hitsLanded} hits · ${state.time.toFixed(1)}s`;
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
  const commands = input.sample();
  if (commands.restart && !fixture) {
    clearSave();
    checkpoint = null;
    state = createGame({ seed, ghost: loadGhost() });
    paint([]);
    requestAnimationFrame(frame);
    return;
  }
  if (state.phase === PHASE.LOSE && commands.start && !fixture) {
    const saved = loadSave();
    if (saved) {
      state = createGame({ seed: saved.seed || seed, save: saved, ghost: loadGhost() });
      state.phase = PHASE.PLAY;
      paint([]);
      requestAnimationFrame(frame);
      return;
    }
  }
  const events = step(state, commands, dt);
  if (events.some((event) => event.type === "shrine_lit") && !fixture) {
    writeCheckpoint(state);
  }
  if (events.some((event) => event.type === "win") && !fixture) {
    writeGhost(state);
  }
  paint(events);
  requestAnimationFrame(frame);
}

paint([]);
requestAnimationFrame(frame);
