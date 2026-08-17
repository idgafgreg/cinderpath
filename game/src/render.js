import * as THREE from "three";
import { ZONE_DEF } from "../content/catalog.js";
import { PHASE, STANCE, lanternLight, moteField, telegraphFor, weatherFor } from "./sim.js";

const COLORS = {
  ground: 0x1b1712,
  road: 0x2a231c,
  rim: 0x3a3128,
  player: 0xd8c4a0,
  cloak: 0x4a2c1f,
  lantern: 0xf3c969,
  ember: 0xe07a3d,
  wight: 0x6b737c,
  wightEye: 0xc45a3a,
  snuffer: 0x4d5a66,
  blocker: 0x3a322c,
  shrine: 0xe8e0d4,
  pickup: 0xffb347,
  ice: 0x7ec8ff,
  telegraph: 0xff6a3d,
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0c0a08, 1);
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0a08, 0.026);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 220);
  const camOffset = new THREE.Vector3(-11, 13.5, 11);

  const ambient = new THREE.AmbientLight(0x6b6258, 0.5);
  scene.add(ambient);
  const moon = new THREE.DirectionalLight(0x8ea0b5, 0.32);
  moon.position.set(-8, 18, -6);
  scene.add(moon);

  const lantern = new THREE.PointLight(0xf3c969, 2.3, 9.5, 1.6);
  lantern.position.set(0, 1.4, 0);
  scene.add(lantern);

  const motes = createMoteCloud();
  scene.add(motes.points);

  const shrineLights = new Map();
  for (const shrine of ZONE_DEF.shrines) {
    const color = shrine.role === "win" ? 0xe07a3d : 0xe8e0d4;
    const light = new THREE.PointLight(color, shrine.role === "win" ? 1.8 : 1.5, 7.2, 1.4);
    light.position.set(shrine.x, 1.6, shrine.z);
    scene.add(light);
    shrineLights.set(shrine.id, light);
  }

  const root = new THREE.Group();
  scene.add(root);

  const world = buildWorld(root);
  const playerMesh = buildPlayer();
  const ghostMesh = buildPlayer({ ghost: true });
  ghostMesh.visible = false;
  const enemyMeshes = new Map();
  const telegraphRings = new Map();
  const pickupMeshes = new Map();
  root.add(playerMesh, ghostMesh);

  const flash = new THREE.Mesh(
    new THREE.CircleGeometry(1.5, 20),
    new THREE.MeshBasicMaterial({ color: COLORS.ember, transparent: true, opacity: 0, side: THREE.DoubleSide }),
  );
  flash.rotation.x = -Math.PI / 2;
  flash.position.y = 0.05;
  root.add(flash);

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener("resize", resize);
  resize();

  return {
    sync(state, events) {
      const p = state.player;
      playerMesh.position.set(p.x, 0, p.z);
      playerMesh.rotation.y = Math.atan2(p.facingX, p.facingZ);
      const light = lanternLight(state);
      const sky = weatherFor(state);
      lantern.position.set(p.x + p.facingX * 0.35, 1.35, p.z + p.facingZ * 0.35);
      lantern.intensity = light.intensity;
      lantern.distance = light.range;
      scene.fog.density += (sky.fog - scene.fog.density) * 0.08;
      moon.intensity += (sky.moon - moon.intensity) * 0.08;
      ambient.intensity += (sky.ambient - ambient.intensity) * 0.08;
      motes.sync(state, lantern.position, light, state.time);

      const body = playerMesh.getObjectByName("body");
      if (body) {
        body.material.emissive.setHex(p.stance === STANCE.ACTIVE ? COLORS.ember : 0x000000);
        body.material.emissiveIntensity = p.stance === STANCE.ACTIVE ? 0.55 : 0;
      }

      for (const enemy of state.enemies) {
        let mesh = enemyMeshes.get(enemy.id);
        if (!mesh) {
          mesh = enemy.defId === "ash_snuffer" ? buildSnuffer() : enemy.defId === "ash_blocker" ? buildBlocker() : buildWight();
          enemyMeshes.set(enemy.id, mesh);
          root.add(mesh);
        }
        mesh.visible = enemy.stance !== STANCE.DEAD;
        mesh.position.set(enemy.x, 0, enemy.z);
        mesh.rotation.y = Math.atan2(enemy.facingX, enemy.facingZ);
        const cloak = mesh.getObjectByName("cloak");
        if (cloak) {
          const telegraph = enemy.stance === STANCE.STARTUP;
          const rest =
            enemy.defId === "ash_snuffer" ? COLORS.snuffer : enemy.defId === "ash_blocker" ? COLORS.blocker : COLORS.wight;
          cloak.material.color.setHex(telegraph ? COLORS.telegraph : rest);
          cloak.material.emissive.setHex(telegraph ? COLORS.telegraph : 0x000000);
          cloak.material.emissiveIntensity = telegraph ? 0.7 : 0;
        }
        let ring = telegraphRings.get(enemy.id);
        if (!ring) {
          ring = buildTelegraphRing();
          telegraphRings.set(enemy.id, ring);
          root.add(ring);
        }
        const tel = telegraphFor(enemy);
        if (!tel) {
          ring.visible = false;
        } else {
          const scale = tel.radius * (0.38 + 0.62 * tel.progress);
          ring.visible = true;
          ring.position.set(tel.x, 0.045, tel.z);
          ring.scale.set(scale, scale, 1);
          ring.material.color.setHex(tel.color === "ice" ? COLORS.ice : COLORS.ember);
          ring.material.opacity = 0.22 + tel.progress * 0.5;
          const theta = Math.atan2(-tel.facingZ, tel.facingX);
          const half = Math.max(0.12, tel.halfAngle);
          const geo = new THREE.RingGeometry(0.86, 1, 48, 1, theta - half, half * 2);
          if (ring.geometry) ring.geometry.dispose();
          ring.geometry = geo;
        }
      }

      for (const pickup of state.pickups) {
        let mesh = pickupMeshes.get(pickup.id);
        if (!mesh) {
          mesh = pickup.defId === "bright_oil" ? buildOil() : buildCinder();
          pickupMeshes.set(pickup.id, mesh);
          root.add(mesh);
          mesh.position.set(pickup.x, 0.35, pickup.z);
        }
        mesh.visible = !pickup.taken;
        mesh.rotation.y = state.time * 1.6;
        mesh.position.y = 0.35 + Math.sin(state.time * 3 + pickup.x) * 0.08;
      }

      if (state.ghost) {
        ghostMesh.visible = true;
        ghostMesh.position.set(state.ghost.x, 0, state.ghost.z);
        ghostMesh.rotation.y = Math.atan2(state.ghost.facingX || 1, state.ghost.facingZ || 0);
      } else {
        ghostMesh.visible = false;
      }

      const gateOpen = state.litShrines.includes("wayshrine");
      if (world.gateBar) world.gateBar.visible = !gateOpen;
      for (const [id, light] of shrineLights) {
        light.intensity = state.litShrines.includes(id) ? 2.2 : 1.15;
      }

      if (events.some((e) => e.type === "hit" || e.type === "swing_active")) {
        flash.position.set(p.x + p.facingX * 0.9, 0.05, p.z + p.facingZ * 0.9);
        flash.material.opacity = 0.45;
      } else {
        flash.material.opacity = Math.max(0, flash.material.opacity - 0.05);
      }

      const look = new THREE.Vector3(p.x, 0.6, p.z);
      camera.position.lerp(look.clone().add(camOffset), state.phase === PHASE.TITLE ? 0.04 : 0.12);
      camera.lookAt(look);
    },
    render() {
      renderer.render(scene, camera);
    },
    resize,
    dispose() {
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

function mat(color, extras = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...extras,
  });
}

function buildWorld(root) {
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 40), mat(COLORS.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(32, -0.04, 0);
  root.add(ground);

  const road = new THREE.Mesh(new THREE.BoxGeometry(76, 0.06, 7.4), mat(COLORS.road));
  road.position.set(32, 0, 0);
  root.add(road);

  const edgeGeo = new THREE.BoxGeometry(76, 0.18, 0.35);
  const north = new THREE.Mesh(edgeGeo, mat(COLORS.rim));
  north.position.set(32, 0.05, 3.7);
  const south = north.clone();
  south.position.z = -3.7;
  root.add(north, south);

  for (let i = 0; i < 18; i += 1) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), mat(0x2d241c));
    post.position.set(-2 + i * 4.1, 0.55, i % 2 === 0 ? -3.2 : 3.2);
    root.add(post);
  }

  const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.9), mat(0x4a3828));
  cart.position.set(12.25, 0.35, 2.6);
  root.add(cart);

  const cart2 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.9), mat(0x3d2e22));
  cart2.position.set(44.5, 0.35, -2.5);
  root.add(cart2);

  const menhir = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.45), mat(0x4d4a46));
  menhir.position.set(3.5, 0.9, -2.8);
  root.add(menhir);

  root.add(buildShrine(ZONE_DEF.shrines[0], COLORS.shrine, 0xf3c969));
  root.add(buildShrine(ZONE_DEF.shrines[1], 0xe07a3d, 0xff8a4a));

  const gate = new THREE.Group();
  const postL = new THREE.Mesh(new THREE.BoxGeometry(0.45, 2.4, 0.45), mat(0x3a342c));
  const postR = postL.clone();
  postL.position.set(33.25, 1.2, -2.15);
  postR.position.set(33.25, 1.2, 2.15);
  const gateBar = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.15, 4.1), mat(0x5a4634));
  gateBar.position.set(33.25, 1.05, 0);
  gateBar.name = "gateBar";
  gate.add(postL, postR, gateBar);
  root.add(gate);

  for (const x of [8, 18, 26, 41, 52]) {
    const ash = new THREE.Mesh(new THREE.CircleGeometry(0.7, 10), new THREE.MeshBasicMaterial({ color: 0x2a2622 }));
    ash.rotation.x = -Math.PI / 2;
    ash.position.set(x, 0.031, x % 10 === 8 || x === 52 ? 1.4 : -1.6);
    root.add(ash);
  }

  return { gateBar };
}

function buildShrine(def, stone, flameColor) {
  const shrine = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.28, 8), mat(0x5a5348));
  plinth.position.y = 0.14;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.1, 8), mat(stone));
  pillar.position.y = 1.2;
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe7a8, emissive: flameColor, emissiveIntensity: 1.4 }),
  );
  flame.position.y = 2.35;
  shrine.add(plinth, pillar, flame);
  shrine.position.set(def.x, 0, def.z);
  return shrine;
}

function buildPlayer({ ghost = false } = {}) {
  const opacity = ghost ? 0.32 : 1;
  const g = new THREE.Group();
  const extra = ghost ? { transparent: true, opacity, depthWrite: false } : {};
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), mat(ghost ? 0x9aa7b4 : 0x2b2118, extra));
  legs.position.y = 0.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.8, 8), mat(ghost ? 0x7d8b99 : COLORS.cloak, extra));
  body.position.y = 1.0;
  body.name = "body";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mat(ghost ? 0xc5d0dc : COLORS.player, extra));
  head.position.y = 1.55;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6), mat(0x6a5134, extra));
  pole.position.set(0.28, 1.15, 0.12);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 10),
    new THREE.MeshStandardMaterial({
      color: COLORS.lantern,
      emissive: COLORS.lantern,
      emissiveIntensity: ghost ? 0.35 : 1.1,
      ...extra,
    }),
  );
  lamp.position.set(0.28, 1.75, 0.12);
  g.add(legs, body, head, pole, lamp);
  return g;
}

function buildWight() {
  const g = new THREE.Group();
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.25, 7), mat(COLORS.wight));
  cloak.position.y = 0.62;
  cloak.name = "cloak";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 8), mat(0x2a2c30));
  head.position.y = 1.18;
  const eye = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 6, 6),
    new THREE.MeshStandardMaterial({ color: COLORS.wightEye, emissive: COLORS.wightEye, emissiveIntensity: 0.9 }),
  );
  eye.position.set(0, 1.2, 0.14);
  g.add(cloak, head, eye);
  return g;
}

function buildSnuffer() {
  const g = new THREE.Group();
  const cloak = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.7, 6), mat(COLORS.snuffer));
  cloak.position.y = 0.85;
  cloak.name = "cloak";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), mat(0x1c2228));
  head.position.y = 1.62;
  const mouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 6, 6),
    new THREE.MeshStandardMaterial({ color: 0x7ec8ff, emissive: 0x3d7ea6, emissiveIntensity: 0.85 }),
  );
  mouth.position.set(0, 1.58, 0.16);
  g.add(cloak, head, mouth);
  return g;
}

function buildCinder() {
  return new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshStandardMaterial({ color: COLORS.pickup, emissive: COLORS.ember, emissiveIntensity: 0.85 }),
  );
}

function buildOil() {
  const g = new THREE.Group();
  const vial = new THREE.Mesh(
    new THREE.CylinderGeometry(0.09, 0.11, 0.34, 8),
    new THREE.MeshStandardMaterial({ color: 0xf3c969, emissive: 0xe07a3d, emissiveIntensity: 0.7 }),
  );
  vial.position.y = 0.18;
  g.add(vial);
  return g;
}

function buildBlocker() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.82, 0.9, 1.35, 7), mat(COLORS.blocker));
  body.position.y = 0.68;
  body.name = "cloak";
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.16, 0.22), mat(0x2a241e));
  brow.position.set(0, 1.22, 0.55);
  g.add(body, brow);
  return g;
}

function buildTelegraphRing() {
  const mesh = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 1, 48),
    new THREE.MeshBasicMaterial({
      color: COLORS.ember,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.visible = false;
  return mesh;
}

function createMoteCloud() {
  const max = 160;
  const positions = new Float32Array(max * 3);
  const seeds = [];
  for (let i = 0; i < max; i += 1) {
    seeds.push({
      ox: Math.random() * 2 - 1,
      oy: Math.random(),
      oz: Math.random() * 2 - 1,
      spin: 0.4 + Math.random() * 1.4,
      rise: 0.12 + Math.random() * 0.35,
    });
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: 0xc4b49a,
    size: 0.055,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;

  function place(i, origin, radius, time) {
    const s = seeds[i];
    const ang = time * s.spin + i;
    const r = radius * (0.18 + 0.82 * ((s.ox * 0.5 + 0.5) % 1));
    const y = 0.25 + ((s.oy + time * s.rise) % 1) * Math.min(2.4, radius * 0.45);
    positions[i * 3] = origin.x + Math.cos(ang) * r * s.ox;
    positions[i * 3 + 1] = origin.y - 0.4 + y;
    positions[i * 3 + 2] = origin.z + Math.sin(ang) * r * s.oz;
  }

  return {
    points,
    sync(state, origin, light, time) {
      const field = moteField(state);
      const visible = Math.min(max, field.count);
      const flash = field.flash || 0;
      points.visible = visible > 0 || flash > 0.2;
      const targetOpacity = visible > 0 ? 0.5 + flash * 0.4 : 0;
      material.opacity += (targetOpacity - material.opacity) * (flash > 0.4 ? 0.45 : 0.1);
      material.size = 0.048 + flash * 0.06;
      const radius = field.radius * (1 + flash * 0.12);
      for (let i = 0; i < max; i += 1) {
        if (i < visible) place(i, origin, radius, time);
        else {
          positions[i * 3] = origin.x;
          positions[i * 3 + 1] = -20;
          positions[i * 3 + 2] = origin.z;
        }
      }
      geometry.attributes.position.needsUpdate = true;
    },
  };
}
