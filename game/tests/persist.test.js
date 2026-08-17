import test from "node:test";
import assert from "node:assert/strict";
import { PHASE, createGame, emptyInput, step } from "../src/sim.js";
import { SAVE_KEY, clearSave, loadSave, writeCheckpoint } from "../src/persist.js";

function memoryStorage(start = {}) {
  const data = { ...start };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

test("checkpoint write and load restore the shrine save", () => {
  const storage = memoryStorage();
  const state = createGame({ seed: 3, fixture: "shrine" });
  state.phase = PHASE.PLAY;
  state.player.x = 30.4;
  state.player.z = 0;
  step(state, emptyInput(), 1 / 60);
  writeCheckpoint(state, storage);
  assert.ok(storage.getItem(SAVE_KEY));
  const loaded = loadSave(storage);
  const restored = createGame({ seed: 3, save: loaded });
  assert.ok(restored.litShrines.includes("wayshrine"));
  assert.ok(Math.abs(restored.player.x - 30.4) < 0.1);
});

test("clearSave drops a bad or missing blob safely", () => {
  const storage = memoryStorage({ [SAVE_KEY]: "{not json" });
  assert.equal(loadSave(storage), null);
  clearSave(storage);
  assert.equal(loadSave(storage), null);
});
