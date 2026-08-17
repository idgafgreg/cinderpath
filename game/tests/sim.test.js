import test from "node:test";
import assert from "node:assert/strict";
import { ENEMY_DEFS, PLAYER_DEF, validateCatalog } from "../content/catalog.js";
import { PHASE, STANCE, createGame, emptyInput, serializeSave, step } from "../src/sim.js";

function flush(state, input, seconds, hz = 60) {
  const dt = 1 / hz;
  const frames = Math.round(seconds * hz);
  const events = [];
  for (let i = 0; i < frames; i += 1) {
    events.push(...step(state, input, dt));
  }
  return events;
}

function playable(fixture) {
  const state = createGame({ seed: 7, fixture });
  state.phase = PHASE.PLAY;
  return state;
}

test("catalog validates", () => {
  assert.deepEqual(validateCatalog(), []);
});

test("fresh start stays on the title until start", () => {
  const state = createGame({ seed: 1 });
  assert.equal(state.phase, PHASE.TITLE);
  step(state, emptyInput(), 1 / 60);
  assert.equal(state.phase, PHASE.TITLE);
  step(state, { ...emptyInput(), start: true }, 1 / 60);
  assert.equal(state.phase, PHASE.PLAY);
});

test("player swing has startup, one-shot contact, then recovery", () => {
  const state = playable("combat");
  const enemy = state.enemies[0];
  enemy.x = state.player.x + 1.1;
  enemy.z = state.player.z;
  state.player.facingX = 1;
  state.player.facingZ = 0;

  const before = enemy.hp;
  step(state, { ...emptyInput(), attack: true }, 1 / 60);
  assert.equal(state.player.stance, STANCE.STARTUP);
  assert.equal(enemy.hp, before);

  flush(state, emptyInput(), PLAYER_DEF.swing.startup + 0.02);
  assert.ok(state.player.stance === STANCE.ACTIVE || state.player.stance === STANCE.RECOVERY || enemy.hp < before);
  assert.ok(enemy.hp < before, "contact must land during the active window");

  const mid = enemy.hp;
  flush(state, emptyInput(), PLAYER_DEF.swing.active);
  assert.equal(enemy.hp, mid, "the same action cannot hit the same target twice");
});

test("a swing facing the wrong way does not hit", () => {
  const state = playable("combat");
  const enemy = state.enemies[0];
  enemy.x = state.player.x + 1.0;
  enemy.z = state.player.z;
  state.player.facingX = -1;
  state.player.facingZ = 0;
  step(state, { ...emptyInput(), attack: true }, 1 / 60);
  flush(state, emptyInput(), 0.6);
  assert.equal(enemy.hp, ENEMY_DEFS.ash_wight.maxHp);
});

test("cinder pickup is atomic and capped", () => {
  const state = playable("combat");
  state.player.fuel = 90;
  const pickup = state.pickups[0];
  state.player.x = pickup.x;
  state.player.z = pickup.z;
  const events = step(state, emptyInput(), 1 / 60);
  assert.equal(pickup.taken, true);
  assert.equal(state.player.fuel, 100);
  assert.ok(events.some((e) => e.type === "pickup"));
  const later = step(state, emptyInput(), 1 / 60);
  assert.ok(state.player.fuel < 100, "wick still drains after a capped pickup");
  assert.ok(!later.some((e) => e.type === "pickup"), "a spent cinder cannot grant twice");
});

test("lantern out loses the run", () => {
  const state = playable("lowfuel");
  state.player.fuel = 0.01;
  flush(state, emptyInput(), 0.2);
  assert.equal(state.phase, PHASE.LOSE);
  assert.equal(state.player.stance, STANCE.DEAD);
});

test("lighting the first shrine is a checkpoint, not a win", () => {
  const state = playable("shrine");
  state.player.x = 30.4;
  state.player.z = 0;
  const events = step(state, emptyInput(), 1 / 60);
  assert.equal(state.phase, PHASE.PLAY);
  assert.ok(state.litShrines.includes("wayshrine"));
  assert.ok(events.some((e) => e.type === "shrine_lit" && e.id === "wayshrine"));
  step(state, emptyInput(), 1 / 60);
  assert.equal(state.events.filter((e) => e.type === "shrine_lit").length, 1);
});

test("a closed gate blocks the second road", () => {
  const state = playable("gate");
  const before = state.player.x;
  flush(state, { ...emptyInput(), x: 1 }, 1.2);
  assert.ok(state.player.x < 33.8, `gate should hold the player, got x=${state.player.x}`);
  assert.ok(state.player.x >= before - 0.05);
});

test("lighting the wayshrine opens the gate", () => {
  const state = playable("gate");
  state.player.x = 30.4;
  state.player.z = 0;
  step(state, emptyInput(), 1 / 60);
  assert.ok(state.litShrines.includes("wayshrine"));
  state.player.x = 32.0;
  state.player.z = 0;
  flush(state, { ...emptyInput(), x: 1 }, 1.4);
  assert.ok(state.player.x > 34, "open gate must let the wickwarden onto the second road");
});

test("the ember hearth wins the run", () => {
  const state = playable("hearth");
  state.player.x = 62;
  state.player.z = 0;
  step(state, emptyInput(), 1 / 60);
  assert.equal(state.phase, PHASE.WIN);
});

test("snuffer keeps range and telegraphs before contact", () => {
  const state = playable("snuffer");
  const snuffer = state.enemies.find((e) => e.defId === "ash_snuffer");
  assert.ok(snuffer, "catalog must spawn an ash_snuffer");
  snuffer.x = state.player.x + 1.4;
  snuffer.z = state.player.z;
  snuffer.aggro = true;
  const startX = snuffer.x;
  const events = flush(state, emptyInput(), 0.45);
  assert.ok(snuffer.x > startX, "snuffer should step back instead of lunging");
  flush(state, emptyInput(), 2.2);
  assert.ok(
    state.events.some((e) => e.type === "enemy_telegraph" && e.moveId === "snuff_spit") ||
      events.some((e) => e.type === "enemy_telegraph"),
    "snuff spit must telegraph",
  );
});

test("save restores wick, shrine, and spent pickups", () => {
  const state = playable("shrine");
  state.player.fuel = 44;
  state.player.x = 30.4;
  state.player.z = 0;
  state.pickups[0].taken = true;
  step(state, emptyInput(), 1 / 60);
  const blob = serializeSave(state);
  const restored = createGame({ seed: state.seed, save: blob });
  restored.phase = PHASE.PLAY;
  assert.equal(Math.round(restored.player.fuel), 44);
  assert.ok(Math.abs(restored.player.x - 30.4) < 0.05);
  assert.ok(restored.litShrines.includes("wayshrine"));
  assert.equal(restored.pickups[0].taken, true);
  assert.equal(restored.phase, PHASE.PLAY);
});

test("pause freezes simulation time", () => {
  const state = playable("combat");
  const fuel = state.player.fuel;
  step(state, { ...emptyInput(), pause: true }, 1 / 60);
  assert.equal(state.phase, PHASE.PAUSED);
  flush(state, emptyInput(), 1);
  assert.equal(state.player.fuel, fuel);
});

test("world collision keeps the player on the plane and out of blocks", () => {
  const state = playable("combat");
  state.player.x = 12.2;
  state.player.z = 2.4;
  flush(state, { ...emptyInput(), y: 1 }, 0.4);
  assert.ok(state.player.z < 2.05, "cart block must stop northward travel");
  assert.equal(state.player.x !== null, true);
});

test("enemy lunge telegraphs before contact", () => {
  const state = playable("combat");
  const enemy = state.enemies[0];
  enemy.x = state.player.x + 1.05;
  enemy.z = state.player.z;
  enemy.aggro = true;
  const events = flush(state, emptyInput(), 0.2);
  assert.ok(events.some((e) => e.type === "enemy_telegraph"));
  assert.notEqual(state.player.fuel, PLAYER_DEF.maxFuel);
});
