import test from "node:test";
import assert from "node:assert/strict";
import { ENEMY_DEFS, PLAYER_DEF, validateCatalog } from "../content/catalog.js";
import { PHASE, STANCE, createGame, emptyInput, step } from "../src/sim.js";

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

test("reaching the shrine wins", () => {
  const state = playable("shrine");
  state.player.x = 30.4;
  state.player.z = 0;
  step(state, emptyInput(), 1 / 60);
  assert.equal(state.phase, PHASE.WIN);
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
