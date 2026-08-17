// Headless fixture walk: exercises every ?fixture= state through the real sim.
import { createGame, emptyInput, step, PHASE, STANCE, outroFor, pendingWave, swingFor } from "../src/sim.js";
import { ENEMY_DEFS, PLAYER_DEF, ZONE_DEF } from "../content/catalog.js";

const results = [];
function check(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

function flush(state, input, seconds, hz = 60) {
  const dt = 1 / hz;
  for (let i = 0; i < Math.round(seconds * hz); i += 1) step(state, input, dt);
}

// combat: swing lands on the wight
{
  const s = createGame({ seed: 7, fixture: "combat" });
  s.phase = PHASE.PLAY;
  const wight = s.enemies.find((e) => e.defId === "ash_wight");
  wight.x = s.player.x + 1.1;
  wight.z = s.player.z;
  s.player.facingX = 1;
  step(s, { ...emptyInput(), attack: true }, 1 / 60);
  flush(s, emptyInput(), 0.3);
  check("combat: swing hits the wight", wight.hp < ENEMY_DEFS.ash_wight.maxHp, `hp=${wight.hp}`);
}

// gate: closed gate holds the player
{
  const s = createGame({ seed: 7, fixture: "gate" });
  s.phase = PHASE.PLAY;
  flush(s, { ...emptyInput(), x: 1 }, 1.2);
  check("gate: closed gate holds the player", s.player.x < 33.8, `x=${s.player.x.toFixed(2)}`);
}

// shrine: lighting the wayshrine opens the gate
{
  const s = createGame({ seed: 7, fixture: "shrine" });
  s.phase = PHASE.PLAY;
  s.player.x = 30.4;
  s.player.z = 0;
  step(s, emptyInput(), 1 / 60);
  check("shrine: wayshrine lit", s.litShrines.includes("wayshrine"));
  s.player.x = 32.0;
  flush(s, { ...emptyInput(), x: 1 }, 1.4);
  check("shrine: gate opens past 34", s.player.x > 34, `x=${s.player.x.toFixed(2)}`);
}

// blocker: slam reachable at separation distance
{
  const s = createGame({ seed: 7, fixture: "blocker" });
  s.phase = PHASE.PLAY;
  const blocker = s.enemies.find((e) => e.defId === "ash_blocker");
  blocker.x = 40;
  blocker.z = 0;
  blocker.aggro = true;
  s.player.x = 38.4;
  s.player.z = 0;
  flush(s, { ...emptyInput(), x: 1 }, 2.0);
  check(
    "blocker: slam telegraphs at separation",
    s.events.some((e) => e.type === "enemy_telegraph" && e.moveId === "shoulder_slam"),
  );
}

// snuffer: keeps range and spits
{
  const s = createGame({ seed: 7, fixture: "snuffer" });
  s.phase = PHASE.PLAY;
  const snuffer = s.enemies.find((e) => e.defId === "ash_snuffer");
  snuffer.x = s.player.x + 1.4;
  snuffer.z = s.player.z;
  snuffer.aggro = true;
  const startX = snuffer.x;
  flush(s, emptyInput(), 0.45);
  check("snuffer: steps back to keep range", snuffer.x > startX, `x=${snuffer.x.toFixed(2)}`);
  flush(s, emptyInput(), 2.2);
  check(
    "snuffer: spit telegraphs",
    s.events.some((e) => e.type === "enemy_telegraph" && e.moveId === "snuff_spit"),
  );
}

// oil: upgrade applies, no second meter
{
  const s = createGame({ seed: 7, fixture: "oil" });
  s.phase = PHASE.PLAY;
  const oil = s.pickups.find((p) => p.defId === "bright_oil");
  s.player.x = oil.x;
  s.player.z = oil.z;
  const before = swingFor(s).range;
  step(s, emptyInput(), 1 / 60);
  check("oil: bright oil picked up", s.upgrades.brightOil === true);
  check("oil: arc lengthens", swingFor(s).range > before, `${before} -> ${swingFor(s).range}`);
  check("oil: no second meter", s.player.hp === undefined && s.player.ward === undefined);
}

// hearth: win + outro timeline
{
  const s = createGame({ seed: 7, fixture: "hearth" });
  s.phase = PHASE.PLAY;
  s.player.x = 62;
  s.player.z = 0;
  const ev = step(s, emptyInput(), 1 / 60);
  check("hearth: win fires", s.phase === PHASE.WIN);
  check("hearth: win carries wick", ev.some((e) => e.type === "win" && typeof e.fuel === "number"));
  const early = outroFor(s);
  check("hearth: outro starts", !!early && !early.bannerReady);
  flush(s, emptyInput(), early.kindleT + 0.05);
  check("hearth: kindle done", outroFor(s).kindleDone);
  flush(s, emptyInput(), 1.2);
  check("hearth: banner ready", outroFor(s).bannerReady, `t=${s.time.toFixed(2)}`);
}

// lowfuel: lantern out loses
{
  const s = createGame({ seed: 7, fixture: "lowfuel" });
  s.phase = PHASE.PLAY;
  s.player.fuel = 0.01;
  flush(s, emptyInput(), 0.2);
  check("lowfuel: lantern out loses", s.phase === PHASE.LOSE && s.player.stance === STANCE.DEAD);
}

// waves: banner then spawn, both wave ahead of trigger
{
  const s = createGame({ seed: 7, fixture: "combat" });
  s.phase = PHASE.PLAY;
  s.player.x = 37;
  const ev1 = step(s, emptyInput(), 1 / 60);
  check("waves: announce at trigger", ev1.some((e) => e.type === "wave_announce"));
  check("waves: nothing spawned during banner", !s.enemies.some((e) => e.defId === "ash_blocker"));
  flush(s, emptyInput(), 1.4);
  check("waves: blocker spawns after banner", s.enemies.some((e) => e.defId === "ash_blocker"));
  s.player.x = 45;
  step(s, emptyInput(), 1 / 60);
  flush(s, emptyInput(), 1.4);
  check("waves: snuffer spawns after banner", s.enemies.some((e) => e.defId === "ash_snuffer"));
  s.player.x = 53;
  step(s, emptyInput(), 1 / 60);
  flush(s, emptyInput(), 1.6);
  const bothBlocker = s.enemies.filter((e) => e.defId === "ash_blocker").find((b) => b.x > 52);
  check("waves: both-wave blocker ahead of trigger", !!bothBlocker, bothBlocker ? `x=${bothBlocker.x}` : "none");
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} fixture checks passed`);
process.exit(failed.length ? 1 : 0);
