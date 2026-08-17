import {
  ENEMY_DEFS,
  FIXTURES,
  ITEM_DEFS,
  OUTRO_DEF,
  PLAYER_DEF,
  UPGRADE_DEFS,
  WEATHER_DEFS,
  ZONE_DEF,
  validateCatalog,
} from "../content/catalog.js";

export const PHASE = Object.freeze({
  TITLE: "title",
  PLAY: "play",
  PAUSED: "paused",
  WIN: "win",
  LOSE: "lose",
});

export const STANCE = Object.freeze({
  IDLE: "idle",
  MOVE: "move",
  STARTUP: "startup",
  ACTIVE: "active",
  RECOVERY: "recovery",
  HURT: "hurt",
  DEAD: "dead",
});

const MAX_DT = 1 / 30;
const TRAIL_DT = 0.1;

export function swingFor(state) {
  const swing = { ...PLAYER_DEF.swing };
  if (state.upgrades?.brightOil) swing.range += UPGRADE_DEFS.brightOil.rangeBonus;
  return swing;
}

export function drainFor(state) {
  const scale = state.upgrades?.brightOil ? UPGRADE_DEFS.brightOil.drainScale : 1;
  return PLAYER_DEF.fuelDrainPerSecond * scale;
}

export function weatherFor(state) {
  const gate = ZONE_DEF.gates[0];
  const pastGate = state.player.x >= gate.maxX;
  return pastGate ? WEATHER_DEFS.ashnight : WEATHER_DEFS.dusk;
}

export function telegraphFor(enemy) {
  if (!enemy || enemy.stance !== STANCE.STARTUP) return null;
  const def = ENEMY_DEFS[enemy.defId];
  if (!def?.attack) return null;
  const startup = Math.max(1e-6, def.attack.startup);
  return {
    id: enemy.id,
    moveId: def.attack.id,
    color: def.attack.telegraph || "ember",
    x: enemy.x,
    z: enemy.z,
    radius: def.attack.range,
    halfAngle: def.attack.halfAngle,
    facingX: enemy.facingX,
    facingZ: enemy.facingZ,
    progress: Math.max(0, Math.min(1, enemy.phaseT / startup)),
    tighten: Math.max(0, Math.min(1, enemy.phaseT / startup)),
    flash: Math.max(0, Math.min(1, (enemy.phaseT - startup * 0.8) / (startup * 0.2))),
  };
}

export function lanternFlare(state) {
  const stance = state.player?.stance;
  if (stance === STANCE.ACTIVE) return 1;
  if (stance === STANCE.STARTUP) return 0.28;
  if (stance === STANCE.RECOVERY) return 0.08;
  return 0;
}

export function lanternLight(state) {
  const weather = weatherFor(state);
  const fuel = Math.max(0, Math.min(1, state.player.fuel / PLAYER_DEF.maxFuel));
  const flare = lanternFlare(state);
  let range = weather.lanternRange * (0.55 + 0.45 * fuel);
  let intensity = weather.lanternIntensity * (0.38 + 0.62 * fuel);
  if (state.upgrades?.brightOil) {
    range += UPGRADE_DEFS.brightOil.lanternRangeBonus;
    intensity += UPGRADE_DEFS.brightOil.lanternIntensityBonus;
  }
  range *= 1 + flare * 0.22;
  intensity *= 1 + flare * 0.85;
  return {
    range,
    intensity,
    flare,
    weather: weather.id,
    fog: weather.fog,
    moon: weather.moon,
    ambient: weather.ambient,
  };
}

export function moteField(state) {
  const weather = weatherFor(state);
  const light = lanternLight(state);
  return {
    count: weather.motes || 0,
    radius: light.range * 0.92,
    weather: weather.id,
    flash: light.flare,
  };
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function length(x, z) {
  return Math.hypot(x, z);
}

function normalize(x, z) {
  const len = Math.hypot(x, z);
  if (len < 1e-6) return { x: 0, z: 0 };
  return { x: x / len, z: z / len };
}

function circleHitsAabb(x, z, r, box) {
  const cx = clamp(x, box.minX, box.maxX);
  const cz = clamp(z, box.minZ, box.maxZ);
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz < r * r;
}

function activeBoxes(state) {
  const boxes = [...ZONE_DEF.collisions];
  for (const gate of ZONE_DEF.gates || []) {
    if (!state.litShrines.includes(gate.opensOn)) boxes.push(gate);
  }
  return boxes;
}

function resolveWorld(state, x, z, r) {
  const b = ZONE_DEF.bounds;
  let nx = clamp(x, b.minX + r, b.maxX - r);
  let nz = clamp(z, b.minZ + r, b.maxZ - r);
  for (const box of activeBoxes(state)) {
    if (circleHitsAabb(nx, nz, r, box)) {
      const cx = clamp(nx, box.minX, box.maxX);
      const cz = clamp(nz, box.minZ, box.maxZ);
      let dx = nx - cx;
      let dz = nz - cz;
      if (Math.abs(dx) < 1e-6 && Math.abs(dz) < 1e-6) {
        const left = Math.abs(nx - box.minX);
        const right = Math.abs(box.maxX - nx);
        const down = Math.abs(nz - box.minZ);
        const up = Math.abs(box.maxZ - nz);
        const m = Math.min(left, right, down, up);
        if (m === left) nx = box.minX - r;
        else if (m === right) nx = box.maxX + r;
        else if (m === down) nz = box.minZ - r;
        else nz = box.maxZ + r;
      } else {
        const n = normalize(dx, dz);
        const push = r - Math.hypot(dx, dz) + 0.001;
        nx += n.x * push;
        nz += n.z * push;
      }
    }
  }
  return {
    x: clamp(nx, b.minX + r, b.maxX - r),
    z: clamp(nz, b.minZ + r, b.maxZ - r),
  };
}

function separateFromOccupiers(state, x, z, r) {
  let nx = x;
  let nz = z;
  for (const enemy of state.enemies) {
    if (enemy.stance === STANCE.DEAD) continue;
    const def = ENEMY_DEFS[enemy.defId];
    if (!def.occupy) continue;
    const dx = nx - enemy.x;
    const dz = nz - enemy.z;
    const dist = Math.hypot(dx, dz);
    const min = r + def.radius;
    if (dist < min) {
      if (dist < 1e-5) {
        nx = enemy.x - min;
        nz = enemy.z;
      } else {
        const n = normalize(dx, dz);
        nx = enemy.x + n.x * min;
        nz = enemy.z + n.z * min;
      }
    }
  }
  return resolveWorld(state, nx, nz, r);
}

function inWedge(ax, az, facingX, facingZ, tx, tz, range, halfAngle) {
  const dx = tx - ax;
  const dz = tz - az;
  const dist = Math.hypot(dx, dz);
  if (dist > range || dist < 1e-5) return false;
  const f = normalize(facingX, facingZ);
  const d = normalize(dx, dz);
  const dot = f.x * d.x + f.z * d.z;
  return dot >= Math.cos(halfAngle);
}

function nextActionId(state) {
  state.actionSeq += 1;
  return `act_${state.actionSeq}`;
}

function applyFixture(state, fixtureName) {
  const fixture = FIXTURES[fixtureName];
  if (!fixture) return;
  if (fixture.player) {
    state.player.x = fixture.player.x;
    state.player.z = fixture.player.z;
    if (typeof fixture.player.fuel === "number") state.player.fuel = fixture.player.fuel;
  }
  if (fixture.litShrines) state.litShrines = [...fixture.litShrines];
  if (fixture.waves) {
    for (const waveId of fixture.waves) fireWave(state, waveId);
  }
  state.phase = PHASE.PLAY;
  state.fixture = fixtureName;
}

function spawnEnemy(state, spawn) {
  const def = ENEMY_DEFS[spawn.defId];
  const id = `${spawn.defId}_${state.enemySeq++}`;
  state.enemies.push({
    id,
    defId: def.id,
    x: spawn.x,
    z: spawn.z,
    facingX: -1,
    facingZ: 0,
    hp: def.maxHp,
    stance: STANCE.IDLE,
    phaseT: 0,
    actionId: null,
    hitSet: [],
    repathT: 0,
    aggro: false,
  });
  return id;
}

function fireWave(state, waveId) {
  if (state.firedWaves.includes(waveId)) return;
  const wave = (ZONE_DEF.waves || []).find((w) => w.id === waveId);
  if (!wave) return;
  state.firedWaves.push(waveId);
  for (const spawn of wave.spawns) spawnEnemy(state, spawn);
  state.events.push({ type: "wave", waveId, t: state.time });
}

function stepWaves(state, dt) {
  if (state.pendingWave) {
    state.pendingWave.remaining -= dt;
    if (state.pendingWave.remaining <= 0) {
      const waveId = state.pendingWave.waveId;
      state.pendingWave = null;
      fireWave(state, waveId);
    }
    return;
  }
  for (const wave of ZONE_DEF.waves || []) {
    if (state.firedWaves.includes(wave.id)) continue;
    if (state.player.x >= wave.triggerX) {
      state.pendingWave = {
        waveId: wave.id,
        label: wave.label,
        remaining: wave.bannerDelay || 0,
      };
      state.events.push({ type: "wave_announce", waveId: wave.id, label: wave.label, t: state.time });
      return;
    }
  }
}

export function pendingWave(state) {
  if (!state.pendingWave) return null;
  return {
    waveId: state.pendingWave.waveId,
    label: state.pendingWave.label,
    remaining: Math.max(0, state.pendingWave.remaining),
  };
}

export function outroFor(state) {
  if (state.phase !== PHASE.WIN || typeof state.winAt !== "number") return null;
  const t = Math.max(0, state.time - state.winAt);
  return {
    kindleT: OUTRO_DEF.kindle,
    bannerAt: OUTRO_DEF.bannerAt,
    kindleDone: t >= OUTRO_DEF.kindle,
    bannerReady: t >= OUTRO_DEF.bannerAt,
  };
}

export function createGame({ seed = 1, fixture = null, save = null, ghost = null } = {}) {
  const catalogErrors = validateCatalog();
  if (catalogErrors.length) {
    throw new Error(`Catalog invalid:\n- ${catalogErrors.join("\n- ")}`);
  }

  const state = {
    seed,
    fixture: fixture || null,
    phase: PHASE.TITLE,
    time: 0,
    tick: 0,
    actionSeq: 0,
    events: [],
    litShrines: [],
    firedWaves: [],
    pendingWave: null,
    enemySeq: 0,
    upgrades: { brightOil: false },
    trail: [],
    trailAcc: 0,
    ghost: null,
    player: {
      id: "player",
      defId: PLAYER_DEF.id,
      x: ZONE_DEF.start.x,
      z: ZONE_DEF.start.z,
      facingX: 1,
      facingZ: 0,
      fuel: PLAYER_DEF.maxFuel,
      stance: STANCE.IDLE,
      phaseT: 0,
      actionId: null,
      hitSet: [],
      hurtT: 0,
    },
    enemies: ZONE_DEF.spawns.map((spawn) => {
      const def = ENEMY_DEFS[spawn.defId];
      return {
        id: spawn.id,
        defId: def.id,
        x: spawn.x,
        z: spawn.z,
        facingX: -1,
        facingZ: 0,
        hp: def.maxHp,
        stance: STANCE.IDLE,
        phaseT: 0,
        actionId: null,
        hitSet: [],
        repathT: 0,
        aggro: false,
      };
    }),
    pickups: ZONE_DEF.pickups.map((p) => ({
      id: p.id,
      defId: p.defId,
      x: p.x,
      z: p.z,
      taken: false,
    })),
    stats: {
      swings: 0,
      hitsLanded: 0,
      damageTaken: 0,
      cinders: 0,
      kills: 0,
    },
  };

  if (save) applySave(state, save);
  if (ghost) applyGhost(state, ghost);
  if (fixture) applyFixture(state, fixture);
  return state;
}

export function serializeSave(state) {
  return {
    v: 1,
    seed: state.seed,
    time: state.time,
    fuel: state.player.fuel,
    x: state.player.x,
    z: state.player.z,
    facingX: state.player.facingX,
    facingZ: state.player.facingZ,
    litShrines: [...state.litShrines],
    firedWaves: [...state.firedWaves],
    pickupsTaken: state.pickups.filter((p) => p.taken).map((p) => p.id),
    enemiesDead: state.enemies.filter((e) => e.stance === STANCE.DEAD).map((e) => e.id),
    upgrades: { ...state.upgrades },
    stats: { ...state.stats },
  };
}

export function applySave(state, save) {
  if (!save || save.v !== 1) return state;
  if (typeof save.seed === "number") state.seed = save.seed;
  if (typeof save.time === "number") state.time = save.time;
  if (typeof save.fuel === "number") state.player.fuel = save.fuel;
  if (typeof save.x === "number") state.player.x = save.x;
  if (typeof save.z === "number") state.player.z = save.z;
  if (typeof save.facingX === "number") state.player.facingX = save.facingX;
  if (typeof save.facingZ === "number") state.player.facingZ = save.facingZ;
  state.litShrines = [...(save.litShrines || [])];
  state.firedWaves = [...(save.firedWaves || [])];
  for (const waveId of state.firedWaves) {
    const wave = (ZONE_DEF.waves || []).find((w) => w.id === waveId);
    if (wave) for (const spawn of wave.spawns) spawnEnemy(state, spawn);
  }
  const taken = new Set(save.pickupsTaken || []);
  for (const pickup of state.pickups) pickup.taken = taken.has(pickup.id);
  const dead = new Set(save.enemiesDead || []);
  for (const enemy of state.enemies) {
    if (dead.has(enemy.id)) {
      enemy.hp = 0;
      enemy.stance = STANCE.DEAD;
      enemy.aggro = false;
    }
  }
  if (save.stats) state.stats = { ...state.stats, ...save.stats };
  if (save.upgrades) state.upgrades = { ...state.upgrades, ...save.upgrades };
  return state;
}

export function serializeGhost(state) {
  return {
    v: 1,
    samples: (state.trail || []).map((s) => ({
      t: Number(s.t.toFixed(3)),
      x: Number(s.x.toFixed(3)),
      z: Number(s.z.toFixed(3)),
      facingX: Number(s.facingX.toFixed(3)),
      facingZ: Number(s.facingZ.toFixed(3)),
    })),
  };
}

export function applyGhost(state, blob) {
  if (!blob || blob.v !== 1 || !blob.samples?.length) return state;
  const first = blob.samples[0];
  state.ghost = {
    samples: blob.samples,
    x: first.x,
    z: first.z,
    facingX: first.facingX,
    facingZ: first.facingZ,
    solid: false,
  };
  return state;
}

function beginSwing(state) {
  const p = state.player;
  if (p.stance === STANCE.DEAD) return;
  if (p.stance === STANCE.STARTUP || p.stance === STANCE.ACTIVE || p.stance === STANCE.RECOVERY) return;
  if (p.stance === STANCE.HURT) return;
  if (p.fuel < PLAYER_DEF.swing.fuelCost) {
    state.events.push({ type: "swing_denied", reason: "fuel", t: state.time });
    return;
  }
  p.fuel = Math.max(0, p.fuel - PLAYER_DEF.swing.fuelCost);
  p.stance = STANCE.STARTUP;
  p.phaseT = 0;
  p.actionId = nextActionId(state);
  p.hitSet = [];
  state.stats.swings += 1;
  state.events.push({ type: "swing_start", actionId: p.actionId, t: state.time });
}

function beginEnemyAttack(state, enemy) {
  const def = ENEMY_DEFS[enemy.defId];
  enemy.stance = STANCE.STARTUP;
  enemy.phaseT = 0;
  enemy.actionId = nextActionId(state);
  enemy.hitSet = [];
  state.events.push({
    type: "enemy_telegraph",
    actorId: enemy.id,
    moveId: def.attack.id,
    actionId: enemy.actionId,
    t: state.time,
  });
}

function resolveContact(state, attacker, target, move, kind) {
  if (target.stance === STANCE.DEAD) return;
  if (attacker.hitSet.includes(target.id)) return;
  if (
    !inWedge(
      attacker.x,
      attacker.z,
      attacker.facingX,
      attacker.facingZ,
      target.x,
      target.z,
      move.range,
      move.halfAngle,
    )
  ) {
    return;
  }
  attacker.hitSet.push(target.id);

  if (kind === "player") {
    target.hp -= move.damage;
    const n = normalize(target.x - attacker.x, target.z - attacker.z);
    const pushed = resolveWorld(state, target.x + n.x * move.knockback, target.z + n.z * move.knockback, ENEMY_DEFS[target.defId].radius);
    target.x = pushed.x;
    target.z = pushed.z;
    state.stats.hitsLanded += 1;
    state.events.push({
      type: "hit",
      source: "player",
      actionId: attacker.actionId,
      targetId: target.id,
      moveId: move.id,
      damage: move.damage,
      t: state.time,
    });
    if (target.hp <= 0) {
      target.hp = 0;
      target.stance = STANCE.DEAD;
      target.phaseT = 0;
      state.stats.kills += 1;
      const reward = ENEMY_DEFS[target.defId].rewards.cinders;
      state.player.fuel = clamp(state.player.fuel + reward, 0, PLAYER_DEF.maxFuel);
      state.stats.cinders += 1;
      state.events.push({ type: "kill", targetId: target.id, fuel: reward, t: state.time });
    } else {
      target.stance = STANCE.HURT;
      target.phaseT = 0;
    }
    return;
  }

  const p = state.player;
  p.fuel = Math.max(0, p.fuel - move.damage);
  state.stats.damageTaken += move.damage;
  const n = normalize(p.x - attacker.x, p.z - attacker.z);
  const pushed = resolveWorld(state, p.x + n.x * move.knockback, p.z + n.z * move.knockback, PLAYER_DEF.radius);
  p.x = pushed.x;
  p.z = pushed.z;
  p.stance = p.fuel <= 0 ? STANCE.DEAD : STANCE.HURT;
  p.phaseT = 0;
  p.actionId = null;
  state.events.push({
    type: "hit",
    source: attacker.id,
    actionId: attacker.actionId,
    targetId: "player",
    moveId: move.id,
    damage: move.damage,
    t: state.time,
  });
}

function stepPlayer(state, input, dt) {
  const p = state.player;
  if (p.stance === STANCE.DEAD) return;

  const move = normalize(input.x || 0, input.y || 0);
  if (move.x || move.z) {
    p.facingX = move.x;
    p.facingZ = move.z;
  }

  if (input.attack) beginSwing(state);

  if (p.stance === STANCE.HURT) {
    p.phaseT += dt;
    if (p.phaseT >= PLAYER_DEF.hurtDuration) {
      p.stance = STANCE.IDLE;
      p.phaseT = 0;
    }
    return;
  }

  if (p.stance === STANCE.STARTUP || p.stance === STANCE.ACTIVE || p.stance === STANCE.RECOVERY) {
    p.phaseT += dt;
    const swing = swingFor(state);
    if (p.stance === STANCE.STARTUP && p.phaseT >= swing.startup) {
      p.stance = STANCE.ACTIVE;
      p.phaseT -= swing.startup;
      state.events.push({ type: "swing_active", actionId: p.actionId, t: state.time });
    }
    if (p.stance === STANCE.ACTIVE) {
      for (const enemy of state.enemies) {
        if (enemy.stance !== STANCE.DEAD) resolveContact(state, p, enemy, swing, "player");
      }
      if (p.phaseT >= swing.active) {
        p.stance = STANCE.RECOVERY;
        p.phaseT -= swing.active;
      }
    }
    if (p.stance === STANCE.RECOVERY && p.phaseT >= swing.recovery) {
      p.stance = STANCE.IDLE;
      p.phaseT = 0;
      p.actionId = null;
    }
    return;
  }

  if (move.x || move.z) {
    p.stance = STANCE.MOVE;
    const next = resolveWorld(state, p.x + move.x * PLAYER_DEF.speed * dt, p.z + move.z * PLAYER_DEF.speed * dt, PLAYER_DEF.radius);
    const separated = separateFromOccupiers(state, next.x, next.z, PLAYER_DEF.radius);
    p.x = separated.x;
    p.z = separated.z;
  } else {
    p.stance = STANCE.IDLE;
  }
}

function stepEnemy(state, enemy, dt) {
  if (enemy.stance === STANCE.DEAD) return;
  const def = ENEMY_DEFS[enemy.defId];
  const p = state.player;
  const toPlayer = { x: p.x - enemy.x, z: p.z - enemy.z };
  const dist = length(toPlayer.x, toPlayer.z);

  if (dist <= def.aggroRange) enemy.aggro = true;
  if (dist >= def.disengageRange) enemy.aggro = false;

  if (enemy.stance === STANCE.HURT) {
    enemy.phaseT += dt;
    if (enemy.phaseT >= 0.22) {
      enemy.stance = STANCE.IDLE;
      enemy.phaseT = 0;
    }
    return;
  }

  if (enemy.stance === STANCE.STARTUP || enemy.stance === STANCE.ACTIVE || enemy.stance === STANCE.RECOVERY) {
    enemy.phaseT += dt;
    const atk = def.attack;
    if (enemy.stance === STANCE.STARTUP) {
      if (dist > 0.001) {
        const n = normalize(toPlayer.x, toPlayer.z);
        enemy.facingX = n.x;
        enemy.facingZ = n.z;
      }
      if (enemy.phaseT >= atk.startup) {
        enemy.stance = STANCE.ACTIVE;
        enemy.phaseT -= atk.startup;
      }
    }
    if (enemy.stance === STANCE.ACTIVE) {
      resolveContact(state, enemy, p, atk, "enemy");
      if (enemy.phaseT >= atk.active) {
        enemy.stance = STANCE.RECOVERY;
        enemy.phaseT -= atk.active;
      }
    }
    if (enemy.stance === STANCE.RECOVERY && enemy.phaseT >= atk.recovery) {
      enemy.stance = STANCE.IDLE;
      enemy.phaseT = 0;
      enemy.actionId = null;
    }
    return;
  }

  if (!enemy.aggro || p.stance === STANCE.DEAD) {
    enemy.stance = STANCE.IDLE;
    return;
  }

  const n = normalize(toPlayer.x, toPlayer.z);
  enemy.facingX = n.x;
  enemy.facingZ = n.z;

  if (def.occupy) {
    if (dist <= def.attackRange && p.stance !== STANCE.DEAD) {
      beginEnemyAttack(state, enemy);
      return;
    }
    enemy.stance = STANCE.IDLE;
    return;
  }

  if (def.keepRange && dist < def.keepRange.min) {
    const back = resolveWorld(state, enemy.x - n.x * def.speed * dt, enemy.z - n.z * def.speed * dt, def.radius);
    enemy.x = back.x;
    enemy.z = back.z;
    enemy.stance = STANCE.MOVE;
    return;
  }

  const canAttack = dist <= def.attackRange && (!def.keepRange || dist >= def.keepRange.min);
  if (canAttack && p.stance !== STANCE.DEAD) {
    beginEnemyAttack(state, enemy);
    return;
  }

  enemy.repathT -= dt;
  if (enemy.repathT <= 0) enemy.repathT = def.repathInterval;
  const next = resolveWorld(state, enemy.x + n.x * def.speed * dt, enemy.z + n.z * def.speed * dt, def.radius);
  enemy.x = next.x;
  enemy.z = next.z;
  enemy.stance = STANCE.MOVE;
}

function collectPickups(state) {
  const p = state.player;
  for (const pickup of state.pickups) {
    if (pickup.taken) continue;
    const def = ITEM_DEFS[pickup.defId];
    const dist = Math.hypot(p.x - pickup.x, p.z - pickup.z);
    if (dist <= PLAYER_DEF.radius + def.radius) {
      pickup.taken = true;
      if (def.upgrade) {
        state.upgrades[def.upgrade] = true;
        state.events.push({ type: "upgrade", id: def.id, pickupId: pickup.id, t: state.time });
      }
      if (def.fuel) {
        p.fuel = clamp(p.fuel + def.fuel, 0, PLAYER_DEF.maxFuel);
        state.stats.cinders += 1;
        state.events.push({ type: "pickup", id: pickup.id, fuel: def.fuel, t: state.time });
      }
    }
  }
}

function recordTrail(state, dt) {
  if (!state.trail) state.trail = [];
  state.trailAcc = (state.trailAcc || 0) + dt;
  if (state.trail.length && state.trailAcc < TRAIL_DT) return;
  state.trailAcc = 0;
  state.trail.push({
    t: state.time,
    x: state.player.x,
    z: state.player.z,
    facingX: state.player.facingX,
    facingZ: state.player.facingZ,
  });
}

function stepGhost(state) {
  if (!state.ghost?.samples?.length) return;
  const samples = state.ghost.samples;
  const t = state.time;
  let pose = samples[0];
  if (t >= samples[samples.length - 1].t) {
    pose = samples[samples.length - 1];
  } else {
    for (let i = 0; i < samples.length - 1; i += 1) {
      const a = samples[i];
      const b = samples[i + 1];
      if (t >= a.t && t <= b.t) {
        const span = Math.max(1e-6, b.t - a.t);
        const u = (t - a.t) / span;
        pose = {
          x: a.x + (b.x - a.x) * u,
          z: a.z + (b.z - a.z) * u,
          facingX: a.facingX + (b.facingX - a.facingX) * u,
          facingZ: a.facingZ + (b.facingZ - a.facingZ) * u,
        };
        break;
      }
    }
  }
  state.ghost.x = pose.x;
  state.ghost.z = pose.z;
  state.ghost.facingX = pose.facingX;
  state.ghost.facingZ = pose.facingZ;
  state.ghost.solid = false;
}

function checkObjectives(state) {
  const p = state.player;
  if (p.fuel <= 0) {
    p.fuel = 0;
    p.stance = STANCE.DEAD;
    state.phase = PHASE.LOSE;
    state.pendingWave = null;
    state.events.push({ type: "lose", reason: "lantern_out", t: state.time });
    return;
  }
  for (const shrine of ZONE_DEF.shrines) {
    const dist = Math.hypot(p.x - shrine.x, p.z - shrine.z);
    if (dist > shrine.radius) continue;
    if (!state.litShrines.includes(shrine.id)) {
      state.litShrines.push(shrine.id);
      state.events.push({ type: "shrine_lit", id: shrine.id, role: shrine.role, t: state.time });
    }
    if (shrine.role === "win") {
      state.phase = PHASE.WIN;
      state.pendingWave = null;
      state.winAt = state.time;
      state.events.push({ type: "win", fuel: p.fuel, t: state.time });
    }
  }
}

export function step(state, input, dt) {
  const eventsBefore = state.events.length;
  const clamped = clamp(dt, 0, MAX_DT);

  if (input.restart) {
    const next = createGame({ seed: state.seed, fixture: state.fixture });
    Object.keys(state).forEach((k) => delete state[k]);
    Object.assign(state, next);
    return state.events.slice();
  }

  if (state.phase === PHASE.TITLE) {
    if (input.start || input.attack) state.phase = PHASE.PLAY;
    return state.events.slice(eventsBefore);
  }

  if (state.phase === PHASE.WIN) {
    if (typeof state.winAt === "number" && state.time - state.winAt < OUTRO_DEF.bannerAt + 0.5) {
      state.time += clamped;
    }
    return state.events.slice(eventsBefore);
  }

  if (state.phase === PHASE.LOSE) {
    return state.events.slice(eventsBefore);
  }

  if (input.pause) {
    state.phase = state.phase === PHASE.PAUSED ? PHASE.PLAY : PHASE.PAUSED;
    return state.events.slice(eventsBefore);
  }
  if (state.phase === PHASE.PAUSED) return [];

  state.time += clamped;
  state.tick += 1;
  state.player.fuel = Math.max(0, state.player.fuel - drainFor(state) * clamped);

  stepPlayer(state, input, clamped);
  stepWaves(state, clamped);
  for (const enemy of state.enemies) stepEnemy(state, enemy, clamped);
  collectPickups(state);
  recordTrail(state, clamped);
  stepGhost(state);
  checkObjectives(state);

  return state.events.slice(eventsBefore);
}

export function snapshot(state) {
  return {
    phase: state.phase,
    time: Number(state.time.toFixed(3)),
    player: {
      x: Number(state.player.x.toFixed(3)),
      z: Number(state.player.z.toFixed(3)),
      fuel: Number(state.player.fuel.toFixed(2)),
      stance: state.player.stance,
    },
    enemies: state.enemies.map((e) => ({
      id: e.id,
      hp: Number(e.hp.toFixed(2)),
      stance: e.stance,
      x: Number(e.x.toFixed(3)),
      z: Number(e.z.toFixed(3)),
    })),
    pickupsLeft: state.pickups.filter((p) => !p.taken).length,
    litShrines: [...state.litShrines],
    upgrades: { ...state.upgrades },
    weather: weatherFor(state).id,
    ghost: state.ghost ? { x: state.ghost.x, z: state.ghost.z } : null,
    stats: { ...state.stats },
  };
}

export function emptyInput() {
  return { x: 0, y: 0, attack: false, pause: false, restart: false, start: false };
}
