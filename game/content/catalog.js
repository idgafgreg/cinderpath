/**
 * Immutable authored content. Runtime must never mutate these objects.
 * IDs are stable. Timing is in seconds. Distances are in world meters.
 */

export const PLANE_Y = 0;

export const PLAYER_DEF = Object.freeze({
  id: "wickwarden",
  displayName: "Wickwarden",
  radius: 0.42,
  height: 1.7,
  speed: 4.35,
  maxFuel: 100,
  fuelDrainPerSecond: 1.35,
  hurtDuration: 0.28,
  swing: Object.freeze({
    id: "lantern_arc",
    startup: 0.11,
    active: 0.13,
    recovery: 0.26,
    range: 1.65,
    halfAngle: 0.95,
    damage: 34,
    fuelCost: 4,
    knockback: 1.8,
  }),
});

export const ENEMY_DEFS = Object.freeze({
  ash_wight: Object.freeze({
    id: "ash_wight",
    displayName: "Ash Wight",
    role: "skirmisher",
    radius: 0.4,
    height: 1.35,
    speed: 2.55,
    maxHp: 68,
    aggroRange: 8.2,
    disengageRange: 11,
    attackRange: 1.25,
    repathInterval: 0.18,
    attack: Object.freeze({
      id: "snuff_lunge",
      startup: 0.34,
      active: 0.15,
      recovery: 0.72,
      range: 1.28,
      halfAngle: 0.7,
      damage: 13,
      knockback: 1.1,
      minCommit: 0.34,
    }),
    rewards: Object.freeze({ cinders: 10 }),
  }),
  ash_snuffer: Object.freeze({
    id: "ash_snuffer",
    displayName: "Ash Snuffer",
    role: "snuffer",
    radius: 0.48,
    height: 1.85,
    speed: 1.85,
    maxHp: 92,
    aggroRange: 10.5,
    disengageRange: 14,
    attackRange: 4.35,
    repathInterval: 0.16,
    keepRange: Object.freeze({ min: 2.3, prefer: 3.6 }),
    attack: Object.freeze({
      id: "snuff_spit",
      startup: 0.52,
      active: 0.16,
      recovery: 0.88,
      range: 4.45,
      halfAngle: 0.36,
      damage: 18,
      knockback: 0.55,
      minCommit: 0.52,
    }),
    rewards: Object.freeze({ cinders: 16 }),
  }),
  ash_blocker: Object.freeze({
    id: "ash_blocker",
    displayName: "Ash Blocker",
    role: "blocker",
    occupy: true,
    radius: 0.85,
    height: 1.55,
    speed: 0.55,
    maxHp: 140,
    aggroRange: 5.2,
    disengageRange: 8,
    attackRange: 1.15,
    repathInterval: 0.25,
    attack: Object.freeze({
      id: "shoulder_slam",
      startup: 0.48,
      active: 0.18,
      recovery: 0.95,
      range: 1.2,
      halfAngle: 0.8,
      damage: 16,
      knockback: 1.4,
      minCommit: 0.48,
    }),
    rewards: Object.freeze({ cinders: 12 }),
  }),
});

export const ITEM_DEFS = Object.freeze({
  cinder: Object.freeze({
    id: "cinder",
    displayName: "Cinder",
    radius: 0.28,
    fuel: 28,
  }),
  bright_oil: Object.freeze({
    id: "bright_oil",
    displayName: "Bright Oil",
    radius: 0.3,
    fuel: 0,
    upgrade: "brightOil",
  }),
});

export const UPGRADE_DEFS = Object.freeze({
  brightOil: Object.freeze({
    rangeBonus: 0.5,
    drainScale: 0.62,
    lanternRangeBonus: 4.2,
    lanternIntensityBonus: 1.15,
  }),
});

export const WEATHER_DEFS = Object.freeze({
  dusk: Object.freeze({
    id: "dusk",
    fog: 0.026,
    moon: 0.32,
    ambient: 0.5,
    lanternRange: 9.6,
    lanternIntensity: 2.25,
  }),
  ashnight: Object.freeze({
    id: "ashnight",
    fog: 0.07,
    moon: 0.065,
    ambient: 0.13,
    lanternRange: 6.1,
    lanternIntensity: 2.55,
  }),
});

export const ZONE_DEF = Object.freeze({
  id: "cinder_road",
  displayName: "The Cinder Road",
  bounds: Object.freeze({ minX: -4, maxX: 68, minZ: -4.4, maxZ: 4.4 }),
  start: Object.freeze({ x: -1.2, z: 0 }),
  shrine: Object.freeze({ id: "wayshrine", x: 30.4, z: 0, radius: 1.35, role: "checkpoint" }),
  shrines: Object.freeze([
    Object.freeze({ id: "wayshrine", x: 30.4, z: 0, radius: 1.35, role: "checkpoint" }),
    Object.freeze({ id: "ember_hearth", x: 62, z: 0, radius: 1.35, role: "win" }),
  ]),
  gates: Object.freeze([
    Object.freeze({
      id: "ash_gate",
      minX: 32.7,
      maxX: 33.8,
      minZ: -3.85,
      maxZ: 3.85,
      opensOn: "wayshrine",
    }),
  ]),
  landmarks: Object.freeze([
    Object.freeze({ id: "gate_stones", x: 3.5, z: -2.8, kind: "menhir" }),
    Object.freeze({ id: "fallen_cart", x: 12.2, z: 2.6, kind: "cart" }),
    Object.freeze({ id: "wayshrine", x: 30.4, z: 0, kind: "shrine" }),
    Object.freeze({ id: "ash_gate_mark", x: 33.25, z: 0, kind: "gate" }),
    Object.freeze({ id: "split_cart", x: 44.5, z: -2.5, kind: "cart" }),
    Object.freeze({ id: "ember_hearth", x: 62, z: 0, kind: "hearth" }),
  ]),
  collisions: Object.freeze([
    Object.freeze({ id: "north_wall", minX: -4, maxX: 68, minZ: 3.85, maxZ: 4.4 }),
    Object.freeze({ id: "south_wall", minX: -4, maxX: 68, minZ: -4.4, maxZ: -3.85 }),
    Object.freeze({ id: "cart_block", minX: 11.4, maxX: 13.1, minZ: 2.05, maxZ: 3.2 }),
    Object.freeze({ id: "gate_block", minX: 2.9, maxX: 4.2, minZ: -3.4, maxZ: -2.2 }),
    Object.freeze({ id: "split_cart_block", minX: 43.7, maxX: 45.4, minZ: -3.2, maxZ: -1.95 }),
  ]),
  pickups: Object.freeze([
    Object.freeze({ id: "cinder_a", defId: "cinder", x: 6.4, z: 1.6 }),
    Object.freeze({ id: "cinder_b", defId: "cinder", x: 16.8, z: -1.4 }),
    Object.freeze({ id: "cinder_c", defId: "cinder", x: 24.6, z: 1.1 }),
    Object.freeze({ id: "cinder_d", defId: "cinder", x: 39.2, z: -1.2 }),
    Object.freeze({ id: "cinder_e", defId: "cinder", x: 54.6, z: 1.4 }),
    Object.freeze({ id: "oil_a", defId: "bright_oil", x: 35.4, z: 1.15 }),
  ]),
  spawns: Object.freeze([
    Object.freeze({ id: "wight_a", defId: "ash_wight", x: 9.2, z: -0.6 }),
    Object.freeze({ id: "wight_b", defId: "ash_wight", x: 21.4, z: 0.8 }),
    Object.freeze({ id: "blocker_a", defId: "ash_blocker", x: 40.1, z: 0 }),
    Object.freeze({ id: "snuffer_a", defId: "ash_snuffer", x: 48.2, z: 0.5 }),
  ]),
  lights: Object.freeze([
    Object.freeze({
      id: "player_lantern",
      emitterId: "player",
      kind: "lantern",
      color: "#f3c969",
      intensity: 2.4,
      range: 8.5,
      moving: true,
    }),
    Object.freeze({
      id: "shrine_brazier",
      emitterId: "wayshrine",
      kind: "brazier",
      color: "#e8e0d4",
      intensity: 1.6,
      range: 6.5,
      moving: false,
    }),
    Object.freeze({
      id: "hearth_brazier",
      emitterId: "ember_hearth",
      kind: "brazier",
      color: "#e07a3d",
      intensity: 1.9,
      range: 7.2,
      moving: false,
    }),
  ]),
});

export const FIXTURES = Object.freeze({
  combat: Object.freeze({
    player: Object.freeze({ x: 8.4, z: 0, fuel: 72 }),
    note: "Player standing in first wight aggro with a swing ready.",
  }),
  lowfuel: Object.freeze({
    player: Object.freeze({ x: 15, z: 0, fuel: 12 }),
    note: "Fuel almost gone; one more hit or a missed swing can snuff the lantern.",
  }),
  shrine: Object.freeze({
    player: Object.freeze({ x: 28.6, z: 0, fuel: 40 }),
    note: "Last steps to the wayshrine checkpoint.",
  }),
  gate: Object.freeze({
    player: Object.freeze({ x: 32.15, z: 0, fuel: 55 }),
    note: "Facing the closed ash gate, outside the wayshrine radius.",
  }),
  snuffer: Object.freeze({
    player: Object.freeze({ x: 46.4, z: 0, fuel: 70 }),
    litShrines: Object.freeze(["wayshrine"]),
    note: "Second road, inside snuffer keep-range.",
  }),
  hearth: Object.freeze({
    player: Object.freeze({ x: 60.2, z: 0, fuel: 42 }),
    litShrines: Object.freeze(["wayshrine"]),
    note: "Last steps to the ember hearth.",
  }),
  blocker: Object.freeze({
    player: Object.freeze({ x: 38.2, z: 0, fuel: 64 }),
    litShrines: Object.freeze(["wayshrine"]),
    note: "Second road, facing the ash blocker.",
  }),
  oil: Object.freeze({
    player: Object.freeze({ x: 34.6, z: 1.15, fuel: 58 }),
    litShrines: Object.freeze(["wayshrine"]),
    note: "Next to the bright-oil vial.",
  }),
});

export function validateCatalog() {
  const errors = [];
  const seenGlobalMoves = new Set();

  function unique(list, where) {
    const seen = new Set();
    for (const item of list) {
      if (!item.id) errors.push(`${where}: missing id`);
      else if (seen.has(item.id)) errors.push(`${where}: duplicate id ${item.id}`);
      else seen.add(item.id);
    }
  }

  if (!PLAYER_DEF.id) errors.push("player: missing id");
  if (!PLAYER_DEF.swing.id) errors.push("player.swing: missing id");
  seenGlobalMoves.add(PLAYER_DEF.swing.id);

  for (const def of Object.values(ENEMY_DEFS)) {
    if (!def.id) errors.push("enemy: missing id");
    if (!def.attack?.id) errors.push(`${def.id}: missing attack id`);
    else if (seenGlobalMoves.has(def.attack.id)) errors.push(`${def.id}: duplicate move ${def.attack.id}`);
    else seenGlobalMoves.add(def.attack.id);
    if (def.attack.startup + def.attack.active + def.attack.recovery <= 0) {
      errors.push(`${def.id}: attack timing must be positive`);
    }
  }

  unique(Object.values(ITEM_DEFS), "item");
  unique(ZONE_DEF.shrines, "shrine");
  unique(ZONE_DEF.gates, "gate");
  unique(ZONE_DEF.pickups, "pickup");
  unique(ZONE_DEF.spawns, "spawn");
  unique(ZONE_DEF.collisions, "collision");
  unique(ZONE_DEF.landmarks, "landmark");
  unique(ZONE_DEF.lights, "light");

  const shrineIds = new Set(ZONE_DEF.shrines.map((s) => s.id));
  for (const shrine of ZONE_DEF.shrines) {
    if (!["checkpoint", "win"].includes(shrine.role)) errors.push(`shrine ${shrine.id}: bad role`);
  }
  for (const gate of ZONE_DEF.gates) {
    if (!shrineIds.has(gate.opensOn)) errors.push(`gate ${gate.id}: unknown opensOn ${gate.opensOn}`);
  }
  for (const p of ZONE_DEF.pickups) {
    if (!ITEM_DEFS[p.defId]) errors.push(`pickup ${p.id}: unknown def ${p.defId}`);
  }
  for (const s of ZONE_DEF.spawns) {
    if (!ENEMY_DEFS[s.defId]) errors.push(`spawn ${s.id}: unknown def ${s.defId}`);
  }
  for (const light of ZONE_DEF.lights) {
    if (!light.emitterId) errors.push(`light ${light.id}: missing emitter`);
  }
  if (Math.abs(PLANE_Y) > 0) errors.push("gameplay plane must stay at y=0");

  const swing = PLAYER_DEF.swing;
  if (swing.startup <= 0 || swing.active <= 0 || swing.recovery <= 0) {
    errors.push("player swing phases must all be > 0");
  }
  return errors;
}
