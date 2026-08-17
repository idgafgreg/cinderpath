import test from "node:test";
import assert from "node:assert/strict";
import { ENEMY_DEFS, PLAYER_DEF, validateCatalog } from "../content/catalog.js";
import { PHASE, STANCE, createGame, emptyInput, lanternFlare, lanternLight, moteField, serializeGhost, serializeSave, step, swingFor, telegraphFor, weatherFor } from "../src/sim.js";

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

test("blocker occupies the road", () => {
  const state = playable("blocker");
  const blocker = state.enemies.find((e) => e.defId === "ash_blocker");
  assert.ok(blocker, "catalog must spawn an ash_blocker");
  blocker.x = 40;
  blocker.z = 0;
  state.player.x = 38.4;
  state.player.z = 0;
  flush(state, { ...emptyInput(), x: 1 }, 1.0);
  assert.ok(state.player.x < blocker.x - 0.6, `blocker must stop a walk-through, x=${state.player.x}`);
});

test("blocker slams with a telegraph", () => {
  const state = playable("blocker");
  const blocker = state.enemies.find((e) => e.defId === "ash_blocker");
  blocker.x = state.player.x + 1.0;
  blocker.z = state.player.z;
  blocker.aggro = true;
  const events = flush(state, emptyInput(), 0.3);
  assert.ok(events.some((e) => e.type === "enemy_telegraph" && e.moveId === "shoulder_slam"));
});

test("bright oil lengthens the arc without a second meter", () => {
  const state = playable("oil");
  const oil = state.pickups.find((p) => p.defId === "bright_oil");
  assert.ok(oil);
  const beforeRange = swingFor(state).range;
  state.player.x = oil.x;
  state.player.z = oil.z;
  const fuelBefore = state.player.fuel;
  const events = step(state, emptyInput(), 1 / 60);
  assert.ok(events.some((e) => e.type === "upgrade" && e.id === "bright_oil"));
  assert.equal(state.upgrades.brightOil, true);
  assert.ok(swingFor(state).range > beforeRange);
  assert.equal(PLAYER_DEF.maxFuel, 100);
  assert.ok(state.player.fuel <= fuelBefore, "oil is not a heal and not a second bar");
  assert.equal(typeof state.player.fuel, "number");
  assert.equal(state.player.ward, undefined);
  assert.equal(state.player.hp, undefined);
});

test("ghost replays a winning walk and never deals damage", () => {
  const recorded = playable("combat");
  for (const enemy of recorded.enemies) {
    enemy.hp = 0;
    enemy.stance = STANCE.DEAD;
  }
  flush(recorded, { ...emptyInput(), x: 1 }, 0.8);
  const ghostBlob = serializeGhost(recorded);
  assert.ok(ghostBlob.samples.length > 3);
  const replay = createGame({ seed: 7, fixture: "combat", ghost: ghostBlob });
  replay.phase = PHASE.PLAY;
  for (const enemy of replay.enemies) {
    enemy.hp = 0;
    enemy.stance = STANCE.DEAD;
  }
  const fuel = replay.player.fuel;
  flush(replay, emptyInput(), 0.8);
  assert.ok(replay.ghost);
  assert.ok(replay.ghost.x > recorded.player.x - 6);
  assert.ok(replay.player.fuel > fuel - 8, "ghost must not hit the living wickwarden");
  assert.equal(replay.ghost.solid, false);
});

test("the second road is ashnight and the first road is dusk", () => {
  const dusk = playable("combat");
  const night = playable("blocker");
  assert.equal(weatherFor(dusk).id, "dusk");
  assert.equal(weatherFor(night).id, "ashnight");
  assert.ok(weatherFor(night).fog > weatherFor(dusk).fog);
  assert.ok(weatherFor(night).moon < weatherFor(dusk).moon);
  assert.equal(dusk.player.ward, undefined);
  assert.equal(night.player.hp, undefined);
});

test("oil widens the lantern in ashnight without adding a meter", () => {
  const dry = playable("blocker");
  const oiled = playable("oil");
  oiled.upgrades.brightOil = true;
  oiled.player.x = dry.player.x;
  oiled.player.fuel = dry.player.fuel;
  const a = lanternLight(dry);
  const b = lanternLight(oiled);
  assert.equal(weatherFor(dry).id, "ashnight");
  assert.ok(b.range > a.range);
  assert.ok(b.intensity > a.intensity);
  assert.equal(PLAYER_DEF.maxFuel, 100);
  assert.equal(oiled.player.hp, undefined);
});

test("ash motes thicken only in ashnight and are not a meter", () => {
  const dusk = moteField(playable("combat"));
  const night = moteField(playable("blocker"));
  const oiledState = playable("oil");
  oiledState.upgrades.brightOil = true;
  oiledState.player.x = playable("blocker").player.x;
  const oiled = moteField(oiledState);
  assert.equal(dusk.count, 0);
  assert.ok(night.count > 40);
  assert.ok(oiled.radius > night.radius);
  assert.equal(playable("blocker").player.hp, undefined);
  assert.equal(playable("blocker").player.motes, undefined);
});

test("swing flare lights the cone only during the active window", () => {
  const state = playable("blocker");
  const idle = lanternLight(state);
  assert.equal(lanternFlare(state), 0);
  step(state, { ...emptyInput(), attack: true }, 1 / 60);
  assert.ok(lanternFlare(state) < 1, "startup is a warm-up, not the flare");
  flush(state, emptyInput(), PLAYER_DEF.swing.startup);
  assert.equal(state.player.stance, STANCE.ACTIVE);
  assert.equal(lanternFlare(state), 1);
  const flared = lanternLight(state);
  assert.ok(flared.intensity > idle.intensity);
  assert.ok(flared.range > idle.range);
  assert.ok(moteField(state).flash > 0);
  flush(state, emptyInput(), PLAYER_DEF.swing.active + PLAYER_DEF.swing.recovery);
  assert.equal(lanternFlare(state), 0);
  assert.equal(state.player.hp, undefined);
});

test("ground telegraph rings name the verb during startup only", () => {
  const state = playable("combat");
  const wight = state.enemies.find((e) => e.defId === "ash_wight");
  const snuffer = playable("snuffer").enemies.find((e) => e.defId === "ash_snuffer");
  const blocker = playable("blocker").enemies.find((e) => e.defId === "ash_blocker");
  assert.equal(telegraphFor(wight), null);
  wight.stance = STANCE.STARTUP;
  wight.phaseT = ENEMY_DEFS.ash_wight.attack.startup * 0.5;
  const lunge = telegraphFor(wight);
  assert.equal(lunge.color, "ember");
  assert.equal(lunge.moveId, "snuff_lunge");
  assert.ok(Math.abs(lunge.radius - ENEMY_DEFS.ash_wight.attack.range) < 0.01);
  assert.ok(lunge.progress > 0.4 && lunge.progress < 0.6);
  snuffer.stance = STANCE.STARTUP;
  snuffer.phaseT = 0.1;
  assert.equal(telegraphFor(snuffer).color, "ice");
  assert.equal(telegraphFor(snuffer).moveId, "snuff_spit");
  blocker.stance = STANCE.STARTUP;
  blocker.phaseT = 0.2;
  assert.equal(telegraphFor(blocker).color, "ember");
  assert.equal(telegraphFor(blocker).moveId, "shoulder_slam");
  wight.stance = STANCE.ACTIVE;
  assert.equal(telegraphFor(wight), null);
  assert.equal(state.player.hp, undefined);
});

test("telegraph wedge faces the enemy and spans the attack half-angle", () => {
  const state = playable("snuffer");
  const snuffer = state.enemies.find((e) => e.defId === "ash_snuffer");
  snuffer.stance = STANCE.STARTUP;
  snuffer.phaseT = 0.1;
  snuffer.facingX = 1;
  snuffer.facingZ = 0;
  const tel = telegraphFor(snuffer);
  assert.equal(tel.color, "ice");
  assert.ok(Math.abs(tel.facingX - 1) < 1e-6);
  assert.ok(Math.abs(tel.facingZ) < 1e-6);
  assert.ok(Math.abs(tel.halfAngle - ENEMY_DEFS.ash_snuffer.attack.halfAngle) < 1e-6);
  assert.equal(state.player.hp, undefined);
});

test("telegraph wedge tightens inward as startup nears contact", () => {
  const state = playable("snuffer");
  const snuffer = state.enemies.find((e) => e.defId === "ash_snuffer");
  snuffer.stance = STANCE.STARTUP;
  snuffer.facingX = 1;
  snuffer.facingZ = 0;
  snuffer.phaseT = ENEMY_DEFS.ash_snuffer.attack.startup * 0.2;
  const early = telegraphFor(snuffer);
  snuffer.phaseT = ENEMY_DEFS.ash_snuffer.attack.startup * 0.9;
  const late = telegraphFor(snuffer);
  assert.ok(early.tighten < late.tighten, "tighten must grow as the clock nears contact");
  assert.ok(early.tighten > 0 && early.tighten < 1);
  assert.ok(late.tighten > 0.8);
  assert.equal(state.player.hp, undefined);
});
