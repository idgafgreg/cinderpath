import * as THREE from "three";
import { ENEMY_DEFS, PLAYER_DEF, ZONE_DEF } from "../content/catalog.js";
import { PHASE, STANCE } from "./sim.js";

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
  shrine: 0xe8e0d4,
  pickup: 0xffb347,
  telegraph: 0xff6a3d,
};

export function createRenderer(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x0c0a08, 1);
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0c0a08, 0.046);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 120);
  const camOffset = new THREE.Vector3(-11, 13.5, 11);

  scene.add(new THREE.AmbientLight(0x6b6258, 0.38));
  const moon = new THREE.DirectionalLight(0x8ea0b5, 0.28);
  moon.position.set(-8, 18, -6);
  scene.add(moon);

  const lantern = new THREE.PointLight(0xf3c969, 2.3, 9.5, 1.6);
  lantern.position.set(0, 1.4, 0);
  scene.add(lantern);

  const shrineLight = new THREE.PointLight(0xe8e0d4, 1.5, 7, 1.4);
  shrineLight.position.set(ZONE_DEF.shrine.x, 1.6, ZONE_DEF.shrine.z);
  scene.add(shrineLight);

  const root = new THREE.Group();
  scene.add(root);

  buildWorld(root);
  const playerMesh = buildPlayer();
  const enemyMeshes = new Map();
  const pickupMeshes = new Map();
  root.add(playerMesh);

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
      lantern.position.set(p.x + p.facingX * 0.35, 1.35, p.z + p.facingZ * 0.35);
      lantern.intensity = 0.6 + (p.fuel / PLAYER_DEF.maxFuel) * 2.1;
      lantern.distance = 5 + (p.fuel / PLAYER_DEF.maxFuel) * 5;

      const body = playerMesh.getObjectByName("body");
      if (body) {
        body.material.emissive.setHex(p.stance === STANCE.ACTIVE ? COLORS.ember : 0x000000);
        body.material.emissiveIntensity = p.stance === STANCE.ACTIVE ? 0.55 : 0;
      }

      for (const enemy of state.enemies) {
        let mesh = enemyMeshes.get(enemy.id);
        if (!mesh) {
          mesh = buildWight();
          enemyMeshes.set(enemy.id, mesh);
          root.add(mesh);
        }
        mesh.visible = enemy.stance !== STANCE.DEAD;
        mesh.position.set(enemy.x, 0, enemy.z);
        mesh.rotation.y = Math.atan2(enemy.facingX, enemy.facingZ);
        const cloak = mesh.getObjectByName("cloak");
        if (cloak) {
          const telegraph = enemy.stance === STANCE.STARTUP;
          cloak.material.color.setHex(telegraph ? COLORS.telegraph : COLORS.wight);
          cloak.material.emissive.setHex(telegraph ? COLORS.telegraph : 0x000000);
          cloak.material.emissiveIntensity = telegraph ? 0.7 : 0;
        }
      }

      for (const pickup of state.pickups) {
        let mesh = pickupMeshes.get(pickup.id);
        if (!mesh) {
          mesh = buildCinder();
          pickupMeshes.set(pickup.id, mesh);
          root.add(mesh);
          mesh.position.set(pickup.x, 0.35, pickup.z);
        }
        mesh.visible = !pickup.taken;
        mesh.rotation.y = state.time * 1.6;
        mesh.position.y = 0.35 + Math.sin(state.time * 3 + pickup.x) * 0.08;
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
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), mat(COLORS.ground));
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(15, -0.04, 0);
  root.add(ground);

  const road = new THREE.Mesh(new THREE.BoxGeometry(40, 0.06, 7.4), mat(COLORS.road));
  road.position.set(15, 0, 0);
  root.add(road);

  const edgeGeo = new THREE.BoxGeometry(40, 0.18, 0.35);
  const north = new THREE.Mesh(edgeGeo, mat(COLORS.rim));
  north.position.set(15, 0.05, 3.7);
  const south = north.clone();
  south.position.z = -3.7;
  root.add(north, south);

  for (let i = 0; i < 9; i += 1) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.1, 6), mat(0x2d241c));
    post.position.set(-2 + i * 4.1, 0.55, i % 2 === 0 ? -3.2 : 3.2);
    root.add(post);
  }

  const cart = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 0.9), mat(0x4a3828));
  cart.position.set(12.25, 0.35, 2.6);
  root.add(cart);

  const menhir = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.45), mat(0x4d4a46));
  menhir.position.set(3.5, 0.9, -2.8);
  root.add(menhir);

  const shrine = new THREE.Group();
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.25, 0.28, 8), mat(0x5a5348));
  plinth.position.y = 0.14;
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 2.1, 8), mat(COLORS.shrine));
  pillar.position.y = 1.2;
  const flame = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xffe7a8, emissive: 0xf3c969, emissiveIntensity: 1.4 }),
  );
  flame.position.y = 2.35;
  shrine.add(plinth, pillar, flame);
  shrine.position.set(ZONE_DEF.shrine.x, 0, ZONE_DEF.shrine.z);
  root.add(shrine);

  for (const x of [8, 18, 26]) {
    const ash = new THREE.Mesh(new THREE.CircleGeometry(0.7, 10), new THREE.MeshBasicMaterial({ color: 0x2a2622 }));
    ash.rotation.x = -Math.PI / 2;
    ash.position.set(x, 0.031, x % 10 === 8 ? 1.4 : -1.6);
    root.add(ash);
  }
}

function buildPlayer() {
  const g = new THREE.Group();
  const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.7, 8), mat(0x2b2118));
  legs.position.y = 0.35;
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.28, 0.8, 8), mat(COLORS.cloak));
  body.position.y = 1.0;
  body.name = "body";
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 10), mat(COLORS.player));
  head.position.y = 1.55;
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6), mat(0x6a5134));
  pole.position.set(0.28, 1.15, 0.12);
  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 10, 10),
    new THREE.MeshStandardMaterial({ color: COLORS.lantern, emissive: COLORS.lantern, emissiveIntensity: 1.1 }),
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

function buildCinder() {
  const mesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.18),
    new THREE.MeshStandardMaterial({ color: COLORS.pickup, emissive: COLORS.ember, emissiveIntensity: 0.85 }),
  );
  return mesh;
}
