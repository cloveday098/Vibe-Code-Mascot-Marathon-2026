// Mascot Mayhem: The Rivalry Run — game core (client-side only, three.js r160).
import * as THREE from 'three';
import { Audio } from './audio.js';
import * as M from './models.js';
import { LEVELS } from './levels.js';

const params = new URLSearchParams(location.search);
const TEST = params.has('test');

// ---------------------------------------------------------------- constants
const G = -38, JUMP_V = 15, RUN = 9, ACC = 70, AIR_ACC = 38;
const PW = 0.38, PH = 1.9, TIGER_SCALE = 0.85;
const MAX_HP = 5, GUN_MAX = 4, LASER_MAX = 2.2;
const SLOTS = [
  { id: 'gun', name: 'Ray Gun', hint: '4 shots · KO reloads', from: 'Start' },
  { id: 'sword', name: 'Sword', hint: 'Big slash · blocks eggs', from: 'Level 1 (Library roof)' },
  { id: 'fireblast', name: 'Fireblast', hint: 'Exploding fireball', from: 'Level 2 (Bleachers)' },
  { id: 'laser', name: 'Laser Eyes', hint: 'HOLD to beam · overheats', from: 'Level 3' },
  { id: 'force', name: 'The Force', hint: 'Push wave · reflects eggs', from: 'Level 3' },
];
const ITEM_LEVEL = { sword: 1, fireblast: 2, laser: 3, force: 3 };

// ---------------------------------------------------------------- renderer
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !TEST, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 4, 14);
window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

const hemi = new THREE.HemisphereLight(0xffffff, 0x445544, 1);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 20, bottom: -14, near: 1, far: 90 });
sun.shadow.bias = -0.0005;
scene.add(sun, sun.target);
const flashLight = new THREE.AmbientLight(0xccddff, 0);
scene.add(flashLight);

const audio = new Audio();

// ---------------------------------------------------------------- particles
const PMAX = 900;
const pGeo = new THREE.BufferGeometry();
const pPos = new Float32Array(PMAX * 3).fill(-9999);
const pCol = new Float32Array(PMAX * 3);
pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
pGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
const particles = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
particles.frustumCulled = false;
scene.add(particles);
const pData = Array.from({ length: PMAX }, () => ({ life: 0, vx: 0, vy: 0, vz: 0, g: 0 }));
let pNext = 0;
const tmpColor = new THREE.Color();
function burst(x, y, z, n, color, speed = 6, life = 0.7, g = -12) {
  tmpColor.set(color);
  for (let i = 0; i < n; i++) {
    const k = pNext; pNext = (pNext + 1) % PMAX;
    const d = pData[k];
    const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
    const s = speed * (0.4 + Math.random() * 0.6);
    d.vx = Math.cos(a) * Math.cos(b) * s; d.vy = Math.sin(b) * s + speed * 0.3; d.vz = Math.sin(a) * Math.cos(b) * s;
    d.life = life * (0.6 + Math.random() * 0.6); d.g = g;
    pPos[k * 3] = x; pPos[k * 3 + 1] = y; pPos[k * 3 + 2] = z;
    pCol[k * 3] = tmpColor.r; pCol[k * 3 + 1] = tmpColor.g; pCol[k * 3 + 2] = tmpColor.b;
  }
}
function updateParticles(dt) {
  for (let k = 0; k < PMAX; k++) {
    const d = pData[k];
    if (d.life <= 0) continue;
    d.life -= dt;
    if (d.life <= 0) { pPos[k * 3 + 1] = -9999; continue; }
    d.vy += d.g * dt;
    pPos[k * 3] += d.vx * dt; pPos[k * 3 + 1] += d.vy * dt; pPos[k * 3 + 2] += d.vz * dt;
    pCol[k * 3] *= 0.985; pCol[k * 3 + 1] *= 0.985; pCol[k * 3 + 2] *= 0.985;
  }
  pGeo.attributes.position.needsUpdate = true;
  pGeo.attributes.color.needsUpdate = true;
}

// ---------------------------------------------------------------- rain
const RAIN_N = 900;
const rainGeo = new THREE.BufferGeometry();
const rainPos = new Float32Array(RAIN_N * 6);
rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.45 }));
rain.frustumCulled = false;
rain.visible = false;
scene.add(rain);
function resetRain() {
  for (let i = 0; i < RAIN_N; i++) {
    const x = (Math.random() - 0.5) * 60, y = Math.random() * 30, z = (Math.random() - 0.6) * 24;
    rainPos.set([x, y, z, x - 0.15, y - 0.8, z], i * 6);
  }
}
resetRain();
function updateRain(dt, cx, cy) {
  for (let i = 0; i < RAIN_N; i++) {
    const o = i * 6;
    let y = rainPos[o + 1] - 34 * dt;
    let x = rainPos[o] - 4 * dt;
    if (y < cy - 12) { y += 30; x = cx + (Math.random() - 0.5) * 60; }
    if (x < cx - 32) x += 64; else if (x > cx + 32) x -= 64;
    rainPos[o] = x; rainPos[o + 1] = y; rainPos[o + 3] = x - 0.15; rainPos[o + 4] = y - 0.8;
    rainPos[o + 5] = rainPos[o + 2];
  }
  rainGeo.attributes.position.needsUpdate = true;
}

// ---------------------------------------------------------------- shared FX geometry
const boltGeo = new THREE.CapsuleGeometry(0.09, 0.6, 4, 8);
boltGeo.rotateZ(Math.PI / 2);
const boltMat = new THREE.MeshBasicMaterial({ color: 0x6cff9f });
const fireGeo = new THREE.IcosahedronGeometry(0.42, 1);
const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a1a, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false });
const eggGeo = new THREE.SphereGeometry(0.32, 12, 10);
eggGeo.scale(0.85, 1.1, 0.85);
const eggMat = M.mat(0xf5f0dc);
const eggMatHot = new THREE.MeshStandardMaterial({ color: 0x9b5cff, emissive: 0x6a2cff });
const beamMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1, 8).rotateZ(Math.PI / 2).translate(0.5, 0, 0),
  new THREE.MeshBasicMaterial({ color: 0xff2244, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }));
beamMesh.visible = false;
scene.add(beamMesh);
const beam2 = beamMesh.clone(); scene.add(beam2);
const forceRing = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 40), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }));
forceRing.rotation.y = Math.PI / 2;
forceRing.visible = false;
scene.add(forceRing);
const slashMesh = new THREE.Mesh(new THREE.RingGeometry(1.2, 2.3, 24, 1, -Math.PI / 2, Math.PI), new THREE.MeshBasicMaterial({ color: 0xcfe0ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
slashMesh.visible = false;
scene.add(slashMesh);

// ---------------------------------------------------------------- the hero
const tiger = M.buildTiger();
tiger.root.scale.setScalar(TIGER_SCALE);
scene.add(tiger.root);

// ---------------------------------------------------------------- state
const S = {
  mode: 'title', levelIndex: 0, level: null, root: null, time: 0, levelTime: 0,
  solids: [], enemies: [], pickups: [], coins: [], checkpoints: [], projectiles: [], eggs: [], strikes: [], waves: [], signs: [],
  lives: 3, score: 0, coinCount: 0, owned: new Set(['gun']), slot: 0, ammo: GUN_MAX,
  cd: { punch: 0, gun: 0, sword: 0, fireblast: 0, force: 0 }, laserHeat: 0, overheated: false, laserOn: false,
  respawn: { x: 0, y: 0 }, flood: null, boss: null, trophy: null, hitstop: 0, shake: 0, modeT: 0,
  camMode: 'side', camFacing: 1, lookAhead: 2, ownedAtLevelStart: null, livesAtStart: 3, easy: false, lightningT: 2,
};
const P = { x: 0, y: 0, vx: 0, vy: 0, onGround: false, ground: null, facing: 1, hp: MAX_HP, invuln: 0, coyote: 0, jumpBuf: 0, jumpCut: false,
  action: null, actionT: 0, punchSide: 1, combo: 0, comboT: 0, anim: 0, landT: 0, wasGround: true };

// ---------------------------------------------------------------- input
const keys = new Set();
const pressed = new Set();
const KEYMAP = {
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  Space: 'jump', KeyW: 'jump', ArrowUp: 'jump',
  KeyJ: 'punch', KeyZ: 'punch', KeyK: 'use', KeyX: 'use', ShiftLeft: 'use', ShiftRight: 'use',
  Digit1: 'slot1', Digit2: 'slot2', Digit3: 'slot3', Digit4: 'slot4', Digit5: 'slot5',
  KeyQ: 'prev', KeyE: 'next', KeyP: 'pause', Escape: 'pause', KeyM: 'mute', KeyC: 'cam', KeyH: 'help', Enter: 'confirm',
};
window.addEventListener('keydown', (e) => {
  const a = KEYMAP[e.code];
  if (!a) return;
  if (['jump', 'left', 'right'].includes(a) || e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (!e.repeat) pressed.add(a);
  keys.add(a);
});
window.addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) keys.delete(a); });
canvas.addEventListener('mousedown', (e) => {
  if (e.button === 0) { pressed.add('punch'); keys.add('punch'); }
  if (e.button === 2) { pressed.add('use'); keys.add('use'); }
});
window.addEventListener('mouseup', (e) => { if (e.button === 0) keys.delete('punch'); if (e.button === 2) keys.delete('use'); });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
canvas.addEventListener('wheel', (e) => { pressed.add(e.deltaY > 0 ? 'next' : 'prev'); }, { passive: true });
window.addEventListener('blur', () => { keys.clear(); if (S.mode === 'play') setPaused(true); });

// ---------------------------------------------------------------- DOM / HUD
const $ = (id) => document.getElementById(id);
const hud = $('hud');
const hotbar = $('hotbar');
const ICONS = {
  gun: '<svg viewBox="0 0 40 40"><rect x="6" y="15" width="22" height="9" rx="4" fill="#cfd8e6"/><rect x="11" y="13" width="3" height="13" fill="#e84a5f"/><rect x="17" y="13" width="3" height="13" fill="#e84a5f"/><path d="M28 13 L36 10 L36 29 L28 26Z" fill="#cfd8e6"/><circle cx="37" cy="19.5" r="3" fill="#4cff9a"/><rect x="9" y="23" width="6" height="11" rx="2" fill="#445"/></svg>',
  sword: '<svg viewBox="0 0 40 40"><path d="M30 4 L35 5 L36 10 L15 31 L9 25Z" fill="#dfe8ff" stroke="#7aa0ff"/><rect x="5" y="23" width="14" height="4" transform="rotate(45 12 25)" fill="#f2b61b"/><rect x="4" y="30" width="4" height="8" transform="rotate(45 6 34)" fill="#6b3a12"/></svg>',
  fireblast: '<svg viewBox="0 0 40 40"><path d="M20 4 C26 12 33 16 30 26 C28 34 12 36 10 26 C8 19 14 17 14 11 C17 15 18 16 20 4Z" fill="#ff7a1a"/><path d="M20 16 C24 21 26 24 24 29 C22 33 16 33 15 28 C14 24 18 22 20 16Z" fill="#ffe14a"/></svg>',
  laser: '<svg viewBox="0 0 40 40"><circle cx="13" cy="18" r="6" fill="#fff"/><circle cx="27" cy="18" r="6" fill="#fff"/><circle cx="13" cy="18" r="3" fill="#ff2244"/><circle cx="27" cy="18" r="3" fill="#ff2244"/><rect x="2" y="27" width="36" height="3" fill="#ff2244" opacity=".8"/><rect x="2" y="33" width="36" height="2" fill="#ff2244" opacity=".5"/></svg>',
  force: '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="5" fill="#d9c2ff"/><circle cx="20" cy="20" r="10" fill="none" stroke="#9b5cff" stroke-width="3"/><circle cx="20" cy="20" r="16" fill="none" stroke="#9b5cff" stroke-width="2" opacity=".6"/></svg>',
};
hotbar.innerHTML = SLOTS.map((s, i) => `
  <div class="slot" id="slot${i}" data-i="${i}">
    <div class="key">${i + 1}</div>
    <div class="icon">${ICONS[s.id]}</div>
    <div class="name">${s.name}</div>
    <div class="meter" id="meter${i}"></div>
    ${i === 0 ? '<div class="pips" id="pips"></div>' : ''}
    <div class="lock">🔒</div>
  </div>`).join('');
hotbar.querySelectorAll('.slot').forEach((el) => el.addEventListener('click', () => selectSlot(+el.dataset.i)));

let hudCache = {};
function setHTML(id, html) { if (hudCache[id] !== html) { hudCache[id] = html; $(id).innerHTML = html; } }
function updateHUD() {
  let hearts = '';
  for (let i = 0; i < MAX_HP; i++) hearts += `<span class="heart ${i < P.hp ? 'full' : ''}">♥</span>`;
  setHTML('hearts', hearts);
  setHTML('lives', `🐯 × ${S.lives}`);
  setHTML('coins', `<b>${S.coinCount}</b> spirit tokens`);
  setHTML('score', `${String(S.score).padStart(6, '0')}`);
  const t = Math.floor(S.levelTime);
  setHTML('timer', `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`);
  const L = S.level;
  if (L) {
    setHTML('levelname', `LEVEL ${L.id} · ${L.name.toUpperCase()}`);
    if (S.boss) {
      const b = S.boss;
      setHTML('progress', `<div class="bossname">MALLARD MACK ${b.phase === 2 ? '<span class="rage">FURIOUS</span>' : ''}</div><div class="bar boss"><i style="width:${Math.max(0, (b.hp / b.maxHp) * 100)}%"></i><s></s></div>`);
    } else {
      const pct = Math.max(0, Math.min(100, ((P.x - L.start.x) / (L.finishX - L.start.x)) * 100));
      setHTML('progress', `<div class="bar"><i style="width:${pct.toFixed(0)}%"></i><b style="left:${pct.toFixed(0)}%">🐯</b><em>🏁</em></div>`);
    }
  }
  // flood meter
  if (S.flood && S.mode === 'play') {
    const gap = P.y - S.flood.y;
    setHTML('flood', `<span class="${gap < 3 ? 'danger' : ''}">🌊 FLOOD ${gap.toFixed(1)}m below</span>`);
  } else setHTML('flood', '');
  // hotbar
  SLOTS.forEach((s, i) => {
    const el = $('slot' + i);
    const owned = S.owned.has(s.id);
    const cls = `slot ${owned ? '' : 'locked'} ${S.slot === i ? 'selected' : ''} ${(s.id === 'laser' && S.overheated) ? 'hot' : ''}`;
    if (el.className !== cls) el.className = cls;
    let m = 0;
    if (s.id === 'sword') m = S.cd.sword / 0.38;
    if (s.id === 'fireblast') m = S.cd.fireblast / 0.9;
    if (s.id === 'force') m = S.cd.force / 2.2;
    if (s.id === 'laser') m = S.laserHeat / LASER_MAX;
    const mh = `<i style="height:${Math.round(Math.max(0, Math.min(1, m)) * 100)}%" class="${s.id === 'laser' ? 'heat' : ''}"></i>`;
    setHTML('meter' + i, mh);
  });
  let pips = '';
  for (let i = 0; i < GUN_MAX; i++) pips += `<span class="${i < S.ammo ? 'on' : ''}"></span>`;
  setHTML('pips', pips);
  const s = SLOTS[S.slot];
  const use = { gun: S.ammo > 0 ? `K / Right-click: fire (${S.ammo}/4)` : 'EMPTY — KO an enemy to reload!', sword: 'K / Right-click: slash', fireblast: 'K / Right-click: fireblast', laser: S.overheated ? 'Laser overheated — cooling…' : 'HOLD K / Right-click: laser eyes', force: 'K / Right-click: Force push' }[s.id];
  setHTML('ctx', `<b>${s.name}</b> — ${use}`);
}

let toastTimer = 0;
function toast(html, dur = 2.2, cls = '') {
  const el = $('toast');
  el.innerHTML = html;
  el.className = 'show ' + cls;
  toastTimer = dur;
}
function showOverlay(id, html) {
  document.querySelectorAll('.overlay').forEach((o) => o.classList.remove('show'));
  if (id) { if (html !== undefined) $(id).querySelector('.panel').innerHTML = html; $(id).classList.add('show'); }
}

// ---------------------------------------------------------------- level build
const STYLES = {
  grass: [0x5cc24f, 0x7a5232], turf: [0x2f8f33, 0x3b3b3b], stone: [0xc9c2b2, 0x8f887a], wood: [0xc4924f, 0x8a5a2b],
  roof: [0x7a3e2c, 0xd9cfb8], tray: [0xd0d6e0, 0x8a96a8], bleacher: [0xb8bcc8, 0x5a6070], metal: [0x9fd0ff, 0x50607a], brick: [0xc0583a, 0x8a3a28],
};
function disposeTree(o) {
  o.traverse((c) => { if (c.geometry && c.geometry !== boltGeo && c.geometry !== fireGeo && c.geometry !== eggGeo) c.geometry.dispose(); });
}

function buildSolidMesh(s) {
  const [topC, bodyC] = STYLES[s.style] || STYLES.stone;
  const w = s.x1 - s.x0, h = s.top - s.bottom;
  const depth = h >= 5 ? 6 : 3;
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, Math.max(0.05, h - 0.25), depth), M.mat(bodyC));
  body.position.y = -(h + 0.25) / 2 + 0.0;
  body.position.y = -0.25 - (h - 0.25) / 2;
  const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.25, depth + 0.06), M.mat(topC, s.move ? { emissive: 0x113355 } : {}));
  cap.position.y = -0.125;
  body.receiveShadow = cap.receiveShadow = true;
  body.castShadow = cap.castShadow = true;
  g.add(body, cap);
  if (s.style === 'bleacher' && h > 1) {
    for (let y = s.bottom + 0.6; y < s.top - 0.2; y += 1.2) {
      const seat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, 0.2), M.mat(0x2a54c8));
      seat.position.set(0, y - s.top, depth / 2 + 0.1);
      g.add(seat);
    }
  }
  g.position.set((s.x0 + s.x1) / 2, s.top, 0);
  return g;
}

function addCrowd(root, x0, x1) {
  const n = Math.floor((x1 - x0) * 2.2);
  const geo = new THREE.BoxGeometry(0.45, 0.8, 0.4);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), n * 4);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  let k = 0;
  for (let row = 0; row < 4; row++) {
    for (let i = 0; i < n; i++) {
      const x = x0 + (i / n) * (x1 - x0) + (Math.random() - 0.5) * 0.3;
      m.makeTranslation(x, 1.2 + row * 1.3, -9 - row * 1.4);
      im.setMatrixAt(k, m);
      const tigerFan = x < (x0 + x1) / 2 + Math.sin(i) * 8;
      c.set(tigerFan ? (Math.random() < 0.5 ? 0xf08a1c : 0x1f3fbf) : (Math.random() < 0.5 ? 0x0d6b3d : 0xffd21f));
      im.setColorAt(k, c);
      k++;
    }
  }
  im.count = k;
  root.add(im);
  const stands = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 6, 7), M.mat(0x4a5060));
  stands.position.set((x0 + x1) / 2, 1.5, -12.5);
  stands.rotation.x = -0.35;
  root.add(stands);
  S.crowd = { im, n: k, base: [] };
}

function loadLevel(index, { fresh = true } = {}) {
  if (S.root) { disposeTree(S.root); scene.remove(S.root); }
  const L = LEVELS[index];
  S.levelIndex = index;
  S.level = L;
  S.root = new THREE.Group();
  scene.add(S.root);
  S.solids = []; S.enemies = []; S.pickups = []; S.coins = []; S.checkpoints = []; S.projectiles = []; S.eggs = []; S.strikes = []; S.waves = [];
  S.boss = null; S.trophy = null; S.flood = null; S.crowd = null;
  S.levelTime = 0; S.lightningT = 2.5;

  scene.background = new THREE.Color(L.sky);
  scene.fog = new THREE.Fog(L.fog[0], L.fog[1], L.fog[2]);
  hemi.color.set(L.hemi[0]); hemi.groundColor.set(L.hemi[1]); hemi.intensity = L.hemi[2];
  sun.intensity = L.sun;
  rain.visible = !!L.rain;

  // backdrop ground + far hills
  const back = new THREE.Mesh(new THREE.PlaneGeometry(600, 120), M.mat(L.ground));
  back.rotation.x = -Math.PI / 2;
  back.position.set(100, -0.02, -62);
  back.receiveShadow = true;
  S.root.add(back);
  for (let i = 0; i < 12; i++) {
    const hill = new THREE.Mesh(new THREE.SphereGeometry(18 + (i % 3) * 6, 16, 10), M.mat(new THREE.Color(L.ground).multiplyScalar(0.75).getHex(), { flatShading: true }));
    hill.position.set(-30 + i * 22, -8, -70 - (i % 2) * 10);
    S.root.add(hill);
  }
  if (L.id === 2 || L.id === 4) addCrowd(S.root, L.id === 2 ? -10 : -26, L.id === 2 ? 200 : 26);

  for (const def of L.platforms) {
    const s = { ...def, baseX0: def.x0, baseX1: def.x1, baseTop: def.top, baseBottom: def.bottom, dx: 0, dy: 0, phase: Math.random() * 6 };
    s.mesh = buildSolidMesh(s);
    S.root.add(s.mesh);
    S.solids.push(s);
  }
  for (const c of L.crates) {
    const s = { x0: c.x - 0.6, x1: c.x + 0.6, top: c.y + 1.2, bottom: c.y, crate: true, dx: 0, dy: 0, hp: 1 };
    s.mesh = M.buildCrate();
    s.mesh.position.set(c.x, c.y + 0.6, 0);
    S.root.add(s.mesh);
    S.solids.push(s);
  }
  const add = (obj, x, y, z) => { obj.position.set(x, y, z); S.root.add(obj); return obj; };
  L.decor(S.root, add);
  for (const sg of L.signs) {
    const m = M.sign(sg.text, sg.w, 0.75, { bg: 'rgba(20,24,40,0.85)', fg: '#ffe6a8', w: 1024, h: 120, font: 'bold 54px sans-serif', border: '#ffb000' });
    m.material.transparent = true;
    add(m, sg.x, sg.y, -1.2);
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, sg.y, 6), M.mat(0x555555));
    add(post, sg.x, sg.y / 2, -1.25);
  }
  for (const e of L.enemies) spawnEnemy(e.type, e.x, e.y, e.range);
  for (const pk of L.pickups) {
    if (ITEM_LEVEL[pk.kind] && S.owned.has(pk.kind)) continue;
    spawnPickup(pk.kind, pk.x, pk.y, pk.respawn);
  }
  for (const c of L.coins) {
    const m = M.buildCoin();
    m.position.set(c.x, c.y, 0);
    S.root.add(m);
    S.coins.push({ x: c.x, y: c.y, mesh: m, taken: false });
  }
  for (const c of L.checkpoints) {
    const m = M.buildCheckpoint();
    const y = c.y ?? groundAt(c.x, 50);
    m.position.set(c.x, y, -0.8);
    S.root.add(m);
    S.checkpoints.push({ x: c.x, y, mesh: m, on: false });
  }
  if (L.finishX) {
    const f = M.buildFlag();
    const fy = groundAt(L.finishX, 60);
    f.position.set(L.finishX, fy, -0.3);
    S.root.add(f);
  }
  if (L.flood) {
    const water = new THREE.Mesh(new THREE.BoxGeometry(320, 60, 40), new THREE.MeshStandardMaterial({ color: 0x2a7fd4, transparent: true, opacity: 0.62, roughness: 0.15, metalness: 0.2, emissive: 0x0a2a55 }));
    water.position.set(90, 0, -8);
    S.root.add(water);
    S.flood = { y: L.flood.start, mesh: water, grace: 3.5 };
  }
  if (L.boss) spawnBoss(L.boss.x, L.boss.y);

  S.respawn = { x: L.start.x, y: L.start.y };
  if (fresh) {
    S.ownedAtLevelStart = new Set(S.owned);
    S.scoreAtStart = S.score; S.coinsAtStart = S.coinCount;
  }
  resetPlayer(L.start.x, L.start.y);
  S.camFacing = 1;
  camera.position.set(P.x - 2, P.y + 4, 14);
  updateHUD();
}

function groundAt(x, fromY, def = 0) {
  let best = -Infinity;
  for (const s of S.solids) if (x >= s.x0 && x <= s.x1 && s.top <= fromY + 0.01 && s.top > best) best = s.top;
  return best === -Infinity ? def : best;
}

function resetPlayer(x, y) {
  Object.assign(P, { x, y: y + 0.05, vx: 0, vy: 0, onGround: false, ground: null, facing: 1, hp: MAX_HP, invuln: 1.2, action: null, actionT: 0, combo: 0 });
  S.ammo = GUN_MAX;
  S.laserHeat = 0; S.overheated = false;
  for (const k in S.cd) S.cd[k] = 0;
}

// ---------------------------------------------------------------- entities
function spawnEnemy(type, x, y, range) {
  let rig, hw, h, hp, model;
  if (type === 'football') {
    model = new THREE.Group();
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 10), M.mat(0x7a3b12, { roughness: 0.6 }));
    ball.scale.set(1.45, 1, 1);
    ball.castShadow = true;
    const lace = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 0.08), M.mat(0xffffff));
    lace.position.y = 0.5;
    ball.add(lace);
    for (const s of [-1, 1]) { const st = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.03, 4, 16), M.mat(0xffffff)); st.position.x = s * 0.35; st.rotation.y = Math.PI / 2; ball.add(st); }
    // angry eyes
    for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), M.mat(0xffffff)); e.position.set(s * 0.18 + 0.35, 0.15, 0.4); ball.add(e); }
    ball.position.y = 0.5;
    model.add(ball);
    rig = { root: model, ball };
    hw = 0.7; h = 1.0; hp = 3;
  } else {
    rig = M.buildDuck({ scale: type === 'flapper' ? 0.6 : 0.75 });
    model = rig.root;
    hw = type === 'flapper' ? 0.4 : 0.45;
    h = type === 'flapper' ? 1.1 : 1.35;
    hp = type === 'flapper' ? 1.5 : 2;
  }
  S.root.add(model);
  const e = { type, x, y, vx: type === 'football' ? 5 : -2.2, vy: 0, baseY: y, range, hw, h, hp, maxHp: hp, rig, alive: true, stun: 0, flash: 0, t: Math.random() * 5, facing: -1, onGround: false, ground: null };
  S.enemies.push(e);
  return e;
}

function spawnPickup(kind, x, y, respawn) {
  let mesh;
  const labels = { sword: 'SWORD', fireblast: 'FIREBLAST', laser: 'LASER EYES', force: 'THE FORCE' };
  if (kind === 'sword') { mesh = new THREE.Group(); const sw = M.buildSword(); sw.rotation.z = Math.PI; sw.position.y = 0.7; mesh.add(sw); mesh.add(M.buildPowerOrb(0x8fb8ff, labels.sword)); mesh.children[1].children[0].visible = false; }
  else if (kind === 'heart') mesh = M.buildHeart();
  else mesh = M.buildPowerOrb({ fireblast: 0xff6a00, laser: 0xff2244, force: 0x9b5cff }[kind], labels[kind]);
  mesh.position.set(x, y, 0);
  S.root.add(mesh);
  const light = kind !== 'heart' ? new THREE.PointLight({ sword: 0x8fb8ff, fireblast: 0xff6a00, laser: 0xff2244, force: 0x9b5cff }[kind], 25, 8) : null;
  if (light) { light.position.set(x, y, 1); S.root.add(light); }
  S.pickups.push({ kind, x, y, mesh, light, taken: false, respawn, t: 0 });
}

function spawnBoss(x, y) {
  const rig = M.buildDuck({ scale: 2.0, boss: true });
  S.root.add(rig.root);
  S.boss = { x, y, vx: 0, vy: 0, hw: 1.1, h: 3.4, hp: 40, maxHp: 40, rig, state: 'intro', t: 0, facing: -1, stun: 0, phase: 1, flash: 0, lastAttack: '', onGround: true, attackCount: 0 };
  const trophy = M.buildTrophy();
  trophy.position.set(0, 10, -7);
  trophy.scale.setScalar(1.6);
  S.root.add(trophy);
  const cage = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), new THREE.MeshBasicMaterial({ color: 0x1dff7a, transparent: true, opacity: 0.18, wireframe: true }));
  cage.position.set(0, 11.5, -7);
  S.root.add(cage);
  const tl = new THREE.PointLight(0xffcc33, 40, 14);
  tl.position.set(0, 12, -4);
  S.root.add(tl);
  S.trophy = { mesh: trophy, cage, state: 'caged', x: 0, y: 10 };
}

// ---------------------------------------------------------------- physics
function overlaps(ax0, ax1, ay0, ay1, s) { return ax1 > s.x0 && ax0 < s.x1 && ay1 > s.bottom && ay0 < s.top; }
function moveBody(b, dt, hw, h, ignoreThin = false) {
  if (b.ground && b.onGround) { b.x += b.ground.dx; b.y += b.ground.dy; }
  const prevY = b.y;
  b.x += b.vx * dt;
  b.hitWall = 0;
  for (const s of S.solids) {
    if (ignoreThin && s.top - s.bottom < 1) continue;
    if (!overlaps(b.x - hw, b.x + hw, b.y, b.y + h, s)) continue;
    if (s.top - b.y < 0.35 && b.vy <= 0) { b.y = s.top; continue; } // step up small ledges
    const pushL = b.x + hw - s.x0, pushR = s.x1 - (b.x - hw);
    if (pushL < pushR) { b.x = s.x0 - hw - 0.001; b.hitWall = 1; } else { b.x = s.x1 + hw + 0.001; b.hitWall = -1; }
    b.vx = 0;
  }
  b.y += b.vy * dt;
  b.onGround = false; b.ground = null;
  for (const s of S.solids) {
    if (ignoreThin && s.top - s.bottom < 1 && b.vy > 0) continue;
    if (!overlaps(b.x - hw, b.x + hw, b.y, b.y + h, s)) continue;
    if (b.vy <= 0 && prevY >= s.top - 0.6) { b.y = s.top; b.onGround = true; b.ground = s; b.vy = 0; }
    else if (b.vy > 0) { b.y = s.bottom - h - 0.001; b.vy = 0; }
    else { b.y = s.top; b.onGround = true; b.ground = s; b.vy = 0; }
  }
}

function updateSolids(dt) {
  for (const s of S.solids) {
    if (!s.move) continue;
    s.phase += dt * s.move.speed;
    const ox = Math.sin(s.phase) * s.move.ax, oy = Math.sin(s.phase) * s.move.ay;
    const nx0 = s.baseX0 + ox, ny = s.baseTop + oy;
    s.dx = nx0 - s.x0; s.dy = ny - s.top;
    s.x0 = nx0; s.x1 = s.baseX1 + ox; s.top = ny; s.bottom = s.baseBottom + oy;
    s.mesh.position.set((s.x0 + s.x1) / 2, s.top, 0);
  }
}

// ---------------------------------------------------------------- combat
function hitBox(x0, x1, y0, y1, dmg, opts = {}) {
  let hit = 0;
  const probe = dmg === 0;
  for (const e of S.enemies) {
    if (!e.alive) continue;
    const ex0 = e.x - e.hw, ex1 = e.x + e.hw, ey0 = e.y, ey1 = e.y + e.h;
    if (x1 > ex0 && x0 < ex1 && y1 > ey0 && y0 < ey1) { if (!probe) damageEnemy(e, dmg, opts); hit++; }
  }
  const b = S.boss;
  if (b && b.hp > 0 && b.state !== 'intro' && b.state !== 'defeat') {
    if (x1 > b.x - b.hw && x0 < b.x + b.hw && y1 > b.y && y0 < b.y + b.h) { if (!probe) damageBoss(dmg, opts); hit++; }
  }
  if (probe) return hit;
  for (const s of [...S.solids]) {
    if (!s.crate) continue;
    if (x1 > s.x0 && x0 < s.x1 && y1 > s.bottom && y0 < s.top) { breakCrate(s); hit++; }
  }
  if (opts.eggs) {
    for (const g of S.eggs) {
      if (g.owner === 'player') continue;
      if (g.x > x0 - 0.3 && g.x < x1 + 0.3 && g.y > y0 - 0.3 && g.y < y1 + 0.3) { reflectEgg(g); hit++; }
    }
  }
  return hit;
}

function damageEnemy(e, dmg, { kx = 0, ky = 0, stun = 0.25, color = 0xffffff } = {}) {
  e.hp -= dmg;
  e.flash = 0.15;
  e.stun = Math.max(e.stun, stun);
  if (kx || ky) { e.vx = kx; e.vy = ky; }
  burst(e.x, e.y + e.h * 0.6, 0.3, 8, color, 5, 0.4);
  if (e.hp <= 0) killEnemy(e);
  else audio.play('hit');
}

function killEnemy(e) {
  e.alive = false;
  S.score += e.type === 'football' ? 150 : 100;
  burst(e.x, e.y + e.h * 0.5, 0, 26, e.type === 'football' ? 0xa0522d : 0xfff3b0, 8, 0.8);
  burst(e.x, e.y + e.h * 0.5, 0, 10, 0x0d6b3d, 6, 0.6);
  audio.play(e.type === 'football' ? 'crate' : 'quack');
  S.root.remove(e.rig.root);
  S.hitstop = 0.06;
  S.shake = Math.max(S.shake, 0.25);
  // RAY GUN RULE: any KO reloads the ray gun
  if (S.ammo < GUN_MAX) {
    S.ammo = GUN_MAX;
    audio.play('reload');
    toast('⚡ RAY GUN RELOADED <small>4/4</small>', 1.2, 'reload');
    flashSlot(0);
  }
}

function damageBoss(dmg, { kx = 0, stun = 0, color = 0xffffff } = {}) {
  const b = S.boss;
  if (!b || b.hp <= 0 || b.invuln > 0) return;
  const mult = b.state === 'stunned' ? 2 : 1;
  b.hp -= dmg * mult;
  b.flash = 0.15;
  b.invuln = 0.08;
  if (kx && b.state !== 'charge') b.vx = kx * 0.5;
  if (stun && b.state !== 'charge' && b.state !== 'pound') { b.state = 'stunned'; b.t = 0; b.stunDur = stun; }
  burst(b.x, b.y + 2, 0.5, 14, color, 7, 0.5);
  audio.play('hit');
  S.score += 20 * dmg * mult;
  if (mult > 1 && Math.random() < 0.3) toast('STUNNED — DOUBLE DAMAGE!', 0.9);
  checkBoss();
}

function checkBoss() {
  const b = S.boss;
  if (!b || b.state === 'defeat') return;
  if (b.phase === 1 && b.hp <= b.maxHp / 2) {
    b.phase = 2; b.state = 'roar'; b.t = 0;
    toast('🦆 MALLARD MACK IS <b>FURIOUS</b>!', 2.2, 'warn');
    audio.play('honk');
  }
  if (b.hp <= 0) {
    b.hp = 0; b.state = 'defeat'; b.t = 0;
    S.score += 5000;
    audio.play('boom'); audio.play('quack');
    S.hitstop = 0.25; S.shake = 1.2;
    toast('🏆 MALLARD MACK IS DOWN! Grab the Spirit Trophy!', 3.5, 'win');
    for (const e of S.enemies) if (e.alive) killEnemy(e);
    S.eggs.forEach((g) => S.root.remove(g.mesh)); S.eggs = [];
  }
}

function breakCrate(s) {
  const i = S.solids.indexOf(s);
  if (i < 0) return;
  S.solids.splice(i, 1);
  S.root.remove(s.mesh);
  burst((s.x0 + s.x1) / 2, s.bottom + 0.6, 0, 18, 0xc48a4a, 6, 0.6);
  audio.play('crate');
  S.score += 25;
  const cx = (s.x0 + s.x1) / 2;
  if (Math.random() < 0.35) spawnPickup('heart', cx, s.bottom + 0.9);
  else for (let k = 0; k < 3; k++) { const m = M.buildCoin(); const c = { x: cx - 0.6 + k * 0.6, y: s.bottom + 1.6 + k * 0.3, mesh: m, taken: false }; m.position.set(c.x, c.y, 0); S.root.add(m); S.coins.push(c); }
}

function reflectEgg(g) {
  g.owner = 'player';
  g.vx = P.facing * 20; g.vy = 3;
  g.mesh.material = eggMatHot;
  g.life = 2;
  audio.play('force');
  burst(g.x, g.y, 0, 10, 0xb48cff, 6, 0.4);
}

// ---------------------------------------------------------------- player actions
function selectSlot(i) {
  if (i < 0 || i >= SLOTS.length) return;
  const s = SLOTS[i];
  if (!S.owned.has(s.id)) {
    toast(`🔒 <b>${s.name}</b> is locked — find it in ${s.from}`, 1.8);
    audio.play('empty');
    return;
  }
  if (S.slot !== i) audio.play('warn');
  S.slot = i;
  flashSlot(i);
}
function flashSlot(i) {
  const el = $('slot' + i);
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}

function doPunch() {
  if (S.cd.punch > 0) return;
  P.combo = P.comboT > 0 ? (P.combo + 1) % 3 : 0;
  P.comboT = 0.6;
  const upper = P.combo === 2;
  S.cd.punch = upper ? 0.34 : 0.2;
  P.punchSide = -P.punchSide;
  P.action = upper ? 'upper' : 'punch'; P.actionT = upper ? 0.3 : 0.2;
  const f = P.facing;
  const x0 = f > 0 ? P.x : P.x - 1.45, x1 = f > 0 ? P.x + 1.45 : P.x;
  const n = hitBox(x0, x1, P.y + 0.5, P.y + 1.8, upper ? 2 : 1, { kx: f * (upper ? 7 : 4), ky: upper ? 9 : 2, color: 0xffe08a, eggs: true });
  audio.play(n ? 'punch' : 'jump');
  if (n) { S.hitstop = 0.05; S.shake = Math.max(S.shake, 0.15); burst(P.x + f * 1.2, P.y + 1.3, 0.3, 6, 0xffffff, 4, 0.25); }
  if (!n) audio.ctx && audio.noise(0.05, 0.08, 3000, 0, 'highpass');
}

function doUse(held) {
  const id = SLOTS[S.slot].id;
  const f = P.facing;
  if (id === 'laser') return; // handled as hold in update
  if (!held) return;
  if (id === 'gun') {
    if (S.cd.gun > 0) return;
    S.cd.gun = 0.18;
    if (S.ammo <= 0) { audio.play('empty'); toast('Ray Gun EMPTY — KO an enemy to reload!', 1.4, 'warn'); return; }
    S.ammo--;
    P.action = 'shoot'; P.actionT = 0.18;
    const m = new THREE.Mesh(boltGeo, boltMat);
    const x = P.x + f * 1.0, y = P.y + 1.28;
    m.position.set(x, y, 0.15);
    S.root.add(m);
    S.projectiles.push({ kind: 'bolt', x, y, vx: f * 30, vy: 0, life: 1.1, mesh: m, dmg: 2, r: 0.35 });
    burst(x, y, 0.15, 6, 0x6cff9f, 3, 0.2, 0);
    audio.play('ray');
  } else if (id === 'sword') {
    if (S.cd.sword > 0) return;
    S.cd.sword = 0.38;
    P.action = 'slash'; P.actionT = 0.3;
    const x0 = f > 0 ? P.x - 0.3 : P.x - 2.6, x1 = f > 0 ? P.x + 2.6 : P.x + 0.3;
    const n = hitBox(x0, x1, P.y - 0.2, P.y + 2.6, 3, { kx: f * 8, ky: 5, stun: 0.5, color: 0xcfe0ff, eggs: true });
    audio.play('sword');
    slashMesh.visible = true; slashMesh.userData.t = 0.18;
    slashMesh.position.set(P.x + f * 0.4, P.y + 1.1, 0.3);
    slashMesh.scale.set(f, 1, 1);
    if (n) { S.hitstop = 0.06; S.shake = Math.max(S.shake, 0.25); }
  } else if (id === 'fireblast') {
    if (S.cd.fireblast > 0) return;
    S.cd.fireblast = 0.9;
    P.action = 'cast'; P.actionT = 0.3;
    const m = new THREE.Mesh(fireGeo, fireMat);
    const x = P.x + f * 1.0, y = P.y + 1.2;
    m.position.set(x, y, 0.2);
    S.root.add(m);
    const light = new THREE.PointLight(0xff7a1a, 30, 7);
    m.add(light);
    S.projectiles.push({ kind: 'fire', x, y, vx: f * 17, vy: 0, life: 1.6, mesh: m, dmg: 4, r: 0.5 });
    audio.play('fire');
  } else if (id === 'force') {
    if (S.cd.force > 0) return;
    S.cd.force = 2.2;
    P.action = 'force'; P.actionT = 0.45;
    audio.play('force');
    S.shake = Math.max(S.shake, 0.5);
    forceRing.visible = true; forceRing.userData.t = 0.45;
    forceRing.position.set(P.x + f * 0.8, P.y + 1.2, 0);
    const reach = 9;
    const x0 = f > 0 ? P.x - 0.5 : P.x - reach, x1 = f > 0 ? P.x + reach : P.x + 0.5;
    for (const e of S.enemies) {
      if (!e.alive) continue;
      if (e.x > x0 && e.x < x1 && Math.abs(e.y - P.y) < 4) damageEnemy(e, 2, { kx: f * 16, ky: 8, stun: 1.4, color: 0xb48cff });
    }
    for (const s of [...S.solids]) if (s.crate && (s.x0 + s.x1) / 2 > x0 && (s.x0 + s.x1) / 2 < x1 && Math.abs(s.bottom - P.y) < 4) breakCrate(s);
    for (const g of S.eggs) if (g.owner !== 'player' && g.x > x0 - 1 && g.x < x1 + 1) reflectEgg(g);
    const b = S.boss;
    if (b && b.hp > 0 && b.x > x0 - b.hw && b.x < x1 + b.hw && Math.abs(b.y - P.y) < 5) {
      b.vx = f * 14;
      damageBoss(3, { stun: 1.4, color: 0xb48cff });
    }
    for (let i = 0; i < 40; i++) burst(P.x + f * (1 + Math.random() * 6), P.y + 0.3 + Math.random() * 2.5, (Math.random() - 0.5) * 2, 1, 0xb48cff, 3, 0.5, 0);
  }
}

function updateLaser(dt) {
  const isLaser = SLOTS[S.slot].id === 'laser';
  const want = isLaser && keys.has('use') && !S.overheated && S.mode === 'play';
  S.laserOn = want;
  if (want) {
    S.laserHeat += dt;
    if (S.laserHeat >= LASER_MAX) { S.overheated = true; S.laserOn = false; audio.play('empty'); toast('🔥 Laser eyes OVERHEATED — cooling down', 1.4, 'warn'); }
  } else {
    S.laserHeat = Math.max(0, S.laserHeat - dt * (S.overheated ? 0.9 : 1.3));
    if (S.overheated && S.laserHeat <= 0.3) S.overheated = false;
  }
  beamMesh.visible = beam2.visible = S.laserOn;
  if (!S.laserOn) return;
  const f = P.facing;
  const eyeY = P.y + 1.86 * (TIGER_SCALE / 0.85);
  const ox = P.x + f * 0.28;
  // beam stops at first solid
  let len = 22;
  for (const s of S.solids) {
    if (eyeY > s.bottom && eyeY < s.top) {
      const d = f > 0 ? s.x0 - ox : ox - s.x1;
      if (d > 0 && d < len) len = d;
    }
  }
  for (const [m, dz] of [[beamMesh, 0.09], [beam2, -0.09]]) {
    m.position.set(ox, eyeY, 0.25 + dz);
    m.scale.set(len, 1 + Math.random() * 0.6, 1 + Math.random() * 0.6);
    m.rotation.y = f > 0 ? 0 : Math.PI;
  }
  const x0 = f > 0 ? ox : ox - len, x1 = f > 0 ? ox + len : ox;
  for (const e of S.enemies) {
    if (!e.alive) continue;
    if (e.x + e.hw > x0 && e.x - e.hw < x1 && eyeY > e.y - 0.3 && eyeY < e.y + e.h + 0.3) {
      e.hp -= 7 * dt; e.flash = 0.05;
      if (Math.random() < 0.4) burst(e.x - f * e.hw, eyeY, 0.2, 1, 0xff4466, 3, 0.3);
      if (e.hp <= 0) killEnemy(e);
    }
  }
  const b = S.boss;
  if (b && b.hp > 0 && b.state !== 'intro' && b.x + b.hw > x0 && b.x - b.hw < x1 && eyeY > b.y && eyeY < b.y + b.h) {
    const before = b.hp;
    b.hp -= 4.5 * dt * (b.state === 'stunned' ? 2 : 1); b.flash = 0.05;
    S.score += 1;
    if (Math.random() < 0.4) burst(b.x - f * b.hw, eyeY, 0.4, 1, 0xff4466, 3, 0.3);
    void before;
    checkBoss();
  }
  for (const s of [...S.solids]) if (s.crate && eyeY > s.bottom && eyeY < s.top && (s.x0 + s.x1) / 2 > x0 && (s.x0 + s.x1) / 2 < x1 + 0.6) breakCrate(s);
  S.laserSfx = (S.laserSfx || 0) - dt;
  if (S.laserSfx <= 0) { audio.play('laser'); S.laserSfx = 0.08; }
  if (Math.random() < 0.5) burst(ox + f * len, eyeY, 0.25, 1, 0xff6677, 4, 0.25, 0);
}

function hurtPlayer(dmg, fromX, reason = 'hit') {
  if (P.invuln > 0 || S.mode !== 'play') return;
  if (S.easy) dmg = Math.min(dmg, 1);
  P.hp -= dmg;
  P.invuln = 1.3;
  P.vx = Math.sign(P.x - fromX || -P.facing) * 9; P.vy = 9;
  P.action = 'hurt'; P.actionT = 0.35;
  audio.play('hurt');
  S.shake = Math.max(S.shake, 0.45);
  burst(P.x, P.y + 1.2, 0.3, 12, 0xff3355, 6, 0.5);
  $('damage').classList.remove('on'); void $('damage').offsetWidth; $('damage').classList.add('on');
  if (P.hp <= 0) loseLife(reason === 'boss' ? 'Mallard Mack knocked you out!' : 'Knocked out by the Ducks!');
}

function loseLife(msg) {
  if (S.mode !== 'play') return;
  P.hp = 0;
  S.lives--;
  S.mode = 'dead'; S.modeT = 1.8;
  audio.play('die');
  S.laserOn = false; beamMesh.visible = beam2.visible = false;
  burst(P.x, P.y + 1, 0, 30, 0xf08a1c, 8, 0.9);
  $('deathmsg').innerHTML = `<h2>${msg}</h2><p>${S.lives > 0 ? `${S.lives} ${S.lives === 1 ? 'life' : 'lives'} left — respawning at the last checkpoint…` : 'No lives left!'}</p>`;
  $('deathmsg').classList.add('show');
}

function respawn() {
  $('deathmsg').classList.remove('show');
  if (S.lives <= 0) { gameOver(); return; }
  resetPlayer(S.respawn.x, S.respawn.y);
  if (S.flood) { S.flood.y = Math.min(S.flood.y, S.respawn.y - 6); S.flood.grace = 2.5; }
  S.eggs.forEach((g) => S.root.remove(g.mesh)); S.eggs = [];
  S.waves.forEach((w) => S.root.remove(w.mesh)); S.waves = [];
  if (S.boss && S.boss.hp > 0) { S.boss.x = 10; S.boss.vx = 0; S.boss.state = 'idle'; S.boss.t = 0; }
  S.mode = 'play';
}

function gameOver() {
  S.mode = 'gameover';
  audio.stopMusic();
  showOverlay('gameover', `
    <h1 class="bad">GAME OVER</h1>
    <p>The Ducks win this round… but rivalries are forever.</p>
    <p class="stats">Reached <b>Level ${S.level.id}: ${S.level.name}</b> · Score <b>${S.score}</b></p>
    <div class="btns"><button data-act="retry" class="primary">Retry Level ${S.level.id} (Enter)</button><button data-act="menu">Main Menu</button></div>`);
}

function completeLevel() {
  S.mode = 'complete'; S.modeT = 0;
  audio.play('win');
  audio.stopMusic();
  const bonus = Math.max(0, 3000 - Math.floor(S.levelTime) * 20);
  S.score += bonus;
  const next = LEVELS[S.levelIndex + 1];
  showOverlay('card', `
    <div class="tag">LEVEL ${S.level.id} COMPLETE</div>
    <h1>${S.level.name}</h1>
    <p class="stats">Time <b>${S.levelTime.toFixed(1)}s</b> · Time bonus <b>+${bonus}</b> · Tokens <b>${S.coinCount}</b> · Score <b>${S.score}</b></p>
    <p>Next up: <b>Level ${next.id} — ${next.name}</b><br><small>${next.subtitle}</small></p>
    <div class="btns"><button data-act="next" class="primary">Continue (Enter)</button></div>`);
}

function victory() {
  S.mode = 'victory'; S.modeT = 0;
  audio.startMusic('victory');
  audio.play('win');
  P.action = 'trophy'; P.actionT = 999;
  showOverlay('victory', `
    <div class="tag">SPIRIT TROPHY RECOVERED</div>
    <h1 class="gold">TIGERS WIN!</h1>
    <p>Stripes dunked on Mallard Mack and brought the Spirit Trophy home.</p>
    <p class="stats">Final score <b>${S.score}</b> · Spirit tokens <b>${S.coinCount}</b> · Lives left <b>${S.lives}</b></p>
    <div class="btns"><button data-act="again" class="primary">Play Again (Enter)</button><button data-act="menu">Main Menu</button></div>`);
  $('hud').classList.add('dim');
}

// ---------------------------------------------------------------- update: player
function updatePlayer(dt) {
  const left = keys.has('left'), right = keys.has('right');
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  if (dir) P.facing = dir;
  const target = dir * RUN;
  const acc = P.onGround ? ACC : AIR_ACC;
  if (P.action !== 'hurt' || P.actionT < 0.2) {
    if (P.vx < target) P.vx = Math.min(target, P.vx + acc * dt);
    else if (P.vx > target) P.vx = Math.max(target, P.vx - acc * dt);
  }
  // jump w/ coyote time + buffer + variable height
  P.coyote = P.onGround ? 0.1 : P.coyote - dt;
  P.jumpBuf -= dt;
  if (P.jumpBuf > 0 && P.coyote > 0) {
    P.vy = JUMP_V; P.coyote = 0; P.jumpBuf = 0; P.jumpCut = false; P.onGround = false; P.ground = null;
    audio.play('jump');
    burst(P.x, P.y + 0.1, 0, 6, 0xdddddd, 3, 0.3);
  }
  if (!keys.has('jump') && P.vy > 0 && !P.jumpCut) { P.vy *= 0.5; P.jumpCut = true; }
  P.vy = Math.max(-30, P.vy + G * dt);
  P.wasGround = P.onGround;
  moveBody(P, dt, PW, PH);
  if (!P.wasGround && P.onGround) { audio.play('land'); P.landT = 0.12; }
  if (S.level.arena) P.x = Math.max(S.level.arena[0] + PW, Math.min(S.level.arena[1] - PW, P.x));
  else P.x = Math.max(S.level.start.x - 6, P.x);

  P.invuln -= dt; P.actionT -= dt; P.comboT -= dt; P.landT -= dt;
  if (P.actionT <= 0 && P.action !== 'trophy') P.action = null;

  // fall / flood
  if (P.y < S.level.killY) loseLife('You fell off campus!');
  if (S.flood && P.y + 0.7 < S.flood.y) { audio.play('splash'); loseLife('Swept away by the flood!'); }

  // stomp + contact with enemies
  for (const e of S.enemies) {
    if (!e.alive) continue;
    if (P.x + PW > e.x - e.hw && P.x - PW < e.x + e.hw && P.y + PH > e.y && P.y < e.y + e.h) {
      const feetAbove = P.y > e.y + e.h * 0.55;
      if (P.vy < 0 && feetAbove) {
        P.vy = 12; P.jumpCut = false;
        audio.play('stomp');
        damageEnemy(e, e.type === 'football' ? 1.5 : 99, { stun: 0.5, color: 0xffe08a });
      } else if (e.stun <= 0 || e.type === 'football') hurtPlayer(1, e.x);
    }
  }
  // boss contact
  const b = S.boss;
  if (b && b.hp > 0 && b.state !== 'intro' && b.state !== 'defeat') {
    if (P.x + PW > b.x - b.hw && P.x - PW < b.x + b.hw && P.y + PH > b.y && P.y < b.y + b.h) {
      if (P.vy < 0 && P.y > b.y + b.h * 0.7) {
        P.vy = 14; P.jumpCut = false; audio.play('stomp');
        damageBoss(2, { color: 0xffe08a });
      } else if (b.state !== 'stunned') hurtPlayer(b.state === 'charge' ? 2 : 1, b.x, 'boss');
    }
  }
  // pickups
  for (const pk of S.pickups) {
    if (pk.taken) continue;
    if (Math.abs(P.x - pk.x) < 1.0 && P.y < pk.y + 0.8 && P.y + PH > pk.y - 0.6) collect(pk);
  }
  for (const c of S.coins) {
    if (c.taken) continue;
    if (Math.abs(P.x - c.x) < 0.75 && P.y < c.y + 0.5 && P.y + PH > c.y - 0.4) {
      c.taken = true; S.root.remove(c.mesh); S.coinCount++; S.score += 10; audio.play('coin');
      burst(c.x, c.y, 0, 6, 0xffc72c, 3, 0.35);
      if (S.coinCount % 50 === 0) { S.lives++; toast('🐯 50 tokens — EXTRA LIFE!', 1.8, 'win'); audio.play('power'); }
    }
  }
  // checkpoints
  for (const c of S.checkpoints) {
    if (!c.on && P.x >= c.x) {
      c.on = true;
      c.mesh.getObjectByName('cloth').material = M.mat(0xf08a1c, { emissive: 0x552200 });
      S.respawn = { x: c.x, y: c.y };
      audio.play('checkpoint');
      toast('🚩 Checkpoint!', 1.2);
    }
  }
  // finish
  if (S.level.finishX && P.x >= S.level.finishX && S.mode === 'play') completeLevel();
  // trophy
  if (S.trophy && S.trophy.state === 'ready' && Math.abs(P.x - S.trophy.x) < 1.2 && P.y < S.trophy.y + 1.5) {
    S.trophy.state = 'taken';
    victory();
  }
}

function collect(pk) {
  pk.taken = true;
  if (pk.light) S.root.remove(pk.light);
  S.root.remove(pk.mesh);
  if (pk.kind === 'heart') {
    if (P.hp < MAX_HP) { P.hp = Math.min(MAX_HP, P.hp + 2); toast('♥ +2 health', 1.2); }
    else { S.score += 250; toast('♥ Full health — +250', 1.2); }
    audio.play('coin');
    if (pk.respawn) setTimeout(() => { if (S.level?.id === 4 && S.mode !== 'victory') { const i = S.pickups.indexOf(pk); if (i >= 0) S.pickups.splice(i, 1); spawnPickup('heart', pk.x, pk.y, pk.respawn); } }, pk.respawn * 1000);
    return;
  }
  S.owned.add(pk.kind);
  const i = SLOTS.findIndex((s) => s.id === pk.kind);
  S.slot = i;
  flashSlot(i);
  audio.play('power');
  S.hitstop = 0.15;
  burst(pk.x, pk.y, 0, 40, { sword: 0x8fb8ff, fireblast: 0xff6a00, laser: 0xff2244, force: 0x9b5cff }[pk.kind], 9, 0.9);
  const how = {
    sword: 'Press <b>2</b>, then <b>K</b> / right-click to slash. Blocks the Duck\'s eggs!',
    fireblast: 'Press <b>3</b>, then <b>K</b> / right-click to hurl an exploding fireball.',
    laser: 'Press <b>4</b>, then <b>HOLD K</b> / right-click — beams from your eyes. Watch the heat!',
    force: 'Press <b>5</b>, then <b>K</b> / right-click — shove everything away and send eggs back!',
  }[pk.kind];
  toast(`<div class="big">NEW POWER: ${SLOTS[i].name.toUpperCase()}</div>${how}`, 4.5, 'power');
  S.score += 500;
}

// ---------------------------------------------------------------- update: enemies
function updateEnemies(dt) {
  for (const e of S.enemies) {
    if (!e.alive) continue;
    e.t += dt; e.flash -= dt; e.stun -= dt;
    if (e.type === 'flapper') {
      if (e.stun > 0) { e.vy += G * 0.4 * dt; e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 0.96; }
      else {
        const sp = 3;
        if (e.x < e.range[0]) e.vx = sp; else if (e.x > e.range[1]) e.vx = -sp; else if (Math.abs(e.vx) < 0.5 || Math.abs(e.vx) > sp + 0.1) e.vx = Math.sign(e.vx || -1) * sp;
        e.x += e.vx * dt;
        // swoop toward player when close
        const near = Math.abs(P.x - e.x) < 5 && P.y < e.baseY;
        const ty = near ? Math.max(P.y + 0.8, e.baseY - 2.5) : e.baseY + Math.sin(e.t * 3) * 0.8;
        e.y += (ty - e.y) * Math.min(1, dt * 2.5);
        e.vy = 0;
      }
      e.facing = Math.sign(e.vx) || e.facing;
    } else if (e.type === 'football') {
      if (e.stun <= 0) {
        if (e.x < e.range[0]) e.vx = 5; else if (e.x > e.range[1]) e.vx = -5;
        if (Math.abs(e.vx) < 1) e.vx = 5 * (e.facing || 1);
      } else e.vx *= 0.97;
      e.vy += G * dt;
      moveBody(e, dt, e.hw, e.h);
      if (e.onGround && e.stun <= 0) e.vy = 7.5;
      if (e.hitWall) e.vx = -e.vx;
      e.facing = Math.sign(e.vx) || e.facing;
      e.rig.ball.rotation.z -= e.vx * dt * 1.5;
    } else {
      // quacker
      if (e.stun <= 0) {
        const chase = Math.abs(P.x - e.x) < 7 && Math.abs(P.y - e.y) < 1.6 && P.x > e.range[0] - 1 && P.x < e.range[1] + 1;
        const sp = chase ? 4 : 2.2;
        let dir = Math.sign(e.vx) || e.facing;
        if (chase) dir = Math.sign(P.x - e.x) || dir;
        if (e.x <= e.range[0]) dir = 1; else if (e.x >= e.range[1]) dir = -1;
        if (e.onGround && groundAt(e.x + dir * 0.7, e.y + 0.1, -999) < e.y - 0.4) dir = -dir; // ledge
        e.vx = dir * sp;
        if (chase && Math.random() < dt * 0.6) audio.play('quack');
      } else e.vx *= Math.pow(0.05, dt);
      e.vy += G * dt;
      moveBody(e, dt, e.hw, e.h);
      if (e.hitWall && e.stun <= 0) e.vx = -e.vx;
      e.facing = Math.sign(e.vx) || e.facing;
    }
    if (e.y < S.level.killY || (S.flood && e.y + 0.5 < S.flood.y)) { killEnemy(e); continue; }
    // visuals
    const r = e.rig;
    r.root.position.set(e.x, e.y, 0);
    const targetRot = e.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
    if (e.type !== 'football') {
      r.root.rotation.y += (targetRot - r.root.rotation.y) * Math.min(1, dt * 10);
      const w = e.t * (e.type === 'flapper' ? 22 : 11);
      if (e.type === 'flapper') { r.wings[0].rotation.z = Math.sin(w) * 0.9 - 0.3; r.wings[1].rotation.z = -Math.sin(w) * 0.9 + 0.3; r.body.rotation.x = 0.3; }
      else { r.body.rotation.z = Math.sin(w) * 0.13; r.legs[0].rotation.x = Math.sin(w) * 0.6; r.legs[1].rotation.x = -Math.sin(w) * 0.6; r.wings[0].rotation.z = -0.2 + Math.sin(w) * 0.2; r.wings[1].rotation.z = 0.2 - Math.sin(w) * 0.2; }
      if (e.stun > 0) r.body.rotation.x = -0.4;
      else if (e.type !== 'flapper') r.body.rotation.x = 0;
    }
    r.root.scale.y = (r.root.userData.sy ||= r.root.scale.y) * (e.flash > 0 ? 1.15 : 1);
    r.root.visible = !(e.flash > 0 && Math.floor(e.flash * 40) % 2);
  }
  S.enemies = S.enemies.filter((e) => e.alive);
}

// ---------------------------------------------------------------- update: projectiles & hazards
function updateProjectiles(dt) {
  for (const pr of S.projectiles) {
    pr.life -= dt;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    pr.mesh.position.set(pr.x, pr.y, pr.mesh.position.z);
    if (pr.kind === 'fire') {
      pr.mesh.rotation.x += dt * 8; pr.mesh.scale.setScalar(0.9 + Math.sin(S.time * 30) * 0.15);
      burst(pr.x - Math.sign(pr.vx) * 0.3, pr.y, 0.2, 2, Math.random() < 0.5 ? 0xff7a1a : 0xffe14a, 1.5, 0.35, 2);
    }
    let hit = false;
    for (const s of S.solids) if (pr.x > s.x0 && pr.x < s.x1 && pr.y > s.bottom && pr.y < s.top) { hit = true; if (s.crate) breakCrate(s); break; }
    if (!hit) {
      const n = hitBox(pr.x - pr.r, pr.x + pr.r, pr.y - pr.r, pr.y + pr.r, pr.kind === 'fire' ? 0 : pr.dmg, { kx: Math.sign(pr.vx) * 5, ky: 3, color: pr.kind === 'fire' ? 0xff7a1a : 0x6cff9f });
      if (n) hit = true;
    }
    if (hit || pr.life <= 0) {
      pr.dead = true;
      S.root.remove(pr.mesh);
      if (pr.kind === 'fire') explode(pr.x, pr.y, 2.8, pr.dmg);
      else burst(pr.x, pr.y, 0.15, 8, 0x6cff9f, 4, 0.3);
    }
  }
  S.projectiles = S.projectiles.filter((p) => !p.dead);

  // eggs (boss)
  for (const g of S.eggs) {
    g.life -= dt;
    g.vy += G * 0.55 * dt;
    g.x += g.vx * dt; g.y += g.vy * dt;
    g.mesh.position.set(g.x, g.y, 0);
    g.mesh.rotation.z += dt * 6;
    let boom = g.life <= 0;
    if (g.owner === 'player') {
      const b = S.boss;
      if (b && b.hp > 0 && g.x > b.x - b.hw - 0.3 && g.x < b.x + b.hw + 0.3 && g.y > b.y && g.y < b.y + b.h) { damageBoss(4, { stun: 1.2, color: 0xb48cff }); boom = true; }
    } else if (Math.abs(g.x - P.x) < 0.7 && g.y > P.y && g.y < P.y + PH) { hurtPlayer(1, g.x, 'boss'); boom = true; }
    if (g.y <= groundAt(g.x, g.y + 1) + 0.2 && g.vy < 0) boom = true;
    if (boom) {
      g.dead = true; S.root.remove(g.mesh);
      burst(g.x, g.y, 0, 18, 0xfff7c2, 6, 0.5); burst(g.x, g.y, 0, 8, 0xffd21f, 4, 0.5);
      audio.play('crate');
      if (g.owner !== 'player' && Math.abs(P.x - g.x) < 1.5 && Math.abs(P.y - g.y) < 1.5) hurtPlayer(1, g.x, 'boss');
    }
  }
  S.eggs = S.eggs.filter((g) => !g.dead);

  // shockwaves (boss ground pound)
  for (const w of S.waves) {
    w.x += w.vx * dt; w.life -= dt;
    w.mesh.position.x = w.x;
    w.mesh.scale.y = 0.6 + Math.sin(S.time * 30) * 0.15;
    if (Math.abs(P.x - w.x) < 0.7 && P.y < 0.9) hurtPlayer(1, w.x - w.vx, 'boss');
    if (w.life <= 0 || w.x < S.level.arena[0] || w.x > S.level.arena[1]) { w.dead = true; S.root.remove(w.mesh); }
  }
  S.waves = S.waves.filter((w) => !w.dead);

  // lightning (levels 2,3)
  const LT = S.level.lightning;
  if (LT && S.mode === 'play') {
    S.lightningT -= dt;
    if (S.lightningT <= 0) {
      S.lightningT = LT.every * (0.7 + Math.random() * 0.6);
      const x = P.x + P.vx * 0.55 + (Math.random() - 0.4) * 4;
      const gy = groundAt(x, P.y + 3);
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.6, 1.3, 28), new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, gy + 0.06, 0);
      S.root.add(ring);
      S.strikes.push({ x, y: gy, t: LT.warn, ring, bolt: null });
      audio.play('warn');
    }
  }
  for (const st of S.strikes) {
    st.t -= dt;
    if (!st.bolt) {
      st.ring.material.opacity = 0.4 + Math.abs(Math.sin(S.time * 18)) * 0.5;
      st.ring.scale.setScalar(1 + (1 - Math.max(0, st.t)) * 0.3);
      if (st.t <= 0) {
        st.bolt = makeBolt(st.x, st.y);
        S.root.add(st.bolt);
        st.t = 0.22;
        audio.play('thunder');
        flashLight.intensity = 3.5;
        S.shake = Math.max(S.shake, 0.4);
        burst(st.x, st.y + 0.2, 0, 26, 0xfff59a, 9, 0.5);
        if (Math.abs(P.x - st.x) < 1.4 && P.y < st.y + 3 && P.y > st.y - 1) hurtPlayer(2, st.x);
        for (const e of S.enemies) if (e.alive && Math.abs(e.x - st.x) < 1.4 && Math.abs(e.y - st.y) < 3) damageEnemy(e, 5);
      }
    } else if (st.t <= 0) { st.dead = true; S.root.remove(st.ring); S.root.remove(st.bolt); }
  }
  S.strikes = S.strikes.filter((s) => !s.dead);
}

function makeBolt(x, y) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0xfffbe0 });
  let px = x, py = y + 26;
  while (py > y) {
    const nx = x + (Math.random() - 0.5) * 2.2 * ((py - y) / 26), ny = Math.max(y, py - 2.2 - Math.random() * 1.5);
    const len = Math.hypot(nx - px, ny - py);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, len, 5), m);
    seg.position.set((px + nx) / 2, (py + ny) / 2, 0);
    seg.rotation.z = Math.atan2(nx - px, py - ny) * -1;
    g.add(seg);
    px = nx; py = ny;
  }
  return g;
}

function explode(x, y, r, dmg) {
  audio.play('boom');
  S.shake = Math.max(S.shake, 0.5);
  burst(x, y, 0, 40, 0xff7a1a, 9, 0.7, -4);
  burst(x, y, 0, 20, 0xffe14a, 6, 0.5, -2);
  burst(x, y, 0, 10, 0x444444, 3, 1.0, 2);
  hitBox(x - r, x + r, y - r, y + r, dmg, { kx: 0, ky: 9, stun: 0.6, color: 0xff7a1a });
  for (const e of S.enemies) if (e.alive && Math.abs(e.x - x) < r) e.vx = Math.sign(e.x - x || 1) * 8;
}

// ---------------------------------------------------------------- boss AI (finite state machine)
function updateBoss(dt) {
  const b = S.boss;
  if (!b) return;
  b.t += dt; b.flash -= dt; b.invuln = (b.invuln || 0) - dt;
  const r = b.rig;
  const A = S.level.arena;
  const fast = b.phase === 2 ? 1.35 : 1;
  const toP = Math.sign(P.x - b.x) || 1;
  let walk = 0;

  switch (b.state) {
    case 'intro':
      if (b.t < 0.05) { audio.play('honk'); }
      r.wings[0].rotation.z = -1.2 + Math.sin(b.t * 10) * 0.3; r.wings[1].rotation.z = 1.2 - Math.sin(b.t * 10) * 0.3;
      r.billBot.rotation.x = Math.abs(Math.sin(b.t * 14)) * 0.5;
      if (b.t > 2.6) { b.state = 'idle'; b.t = 0; }
      break;
    case 'idle': {
      b.facing = toP;
      const dist = Math.abs(P.x - b.x);
      b.vx = dist > 3 ? toP * 3 * fast : -toP * 1.5;
      walk = 1;
      if (b.t > (b.phase === 2 ? 1.0 : 1.6)) {
        const options = ['charge', 'eggs', 'pound'].filter((o) => o !== b.lastAttack);
        const next = options[Math.floor(Math.random() * options.length)];
        b.lastAttack = next; b.state = next + 'Wind'; b.t = 0; b.vx = 0;
        if (next === 'charge') { audio.play('honk'); toast('⚠ CHARGE! Jump over him!', 1.0, 'warn'); }
        if (next === 'pound') { audio.play('quack'); }
        b.attackCount++;
        if (b.phase === 2 && b.attackCount % 3 === 0 && S.enemies.length < 3) {
          spawnEnemy('quacker', A[0] + 2, 0, [A[0] + 1, A[1] - 1]);
          spawnEnemy('flapper', A[1] - 2, 4.5, [A[0] + 2, A[1] - 2]);
          toast('Mack called in his DUCK CADETS!', 1.4, 'warn');
        }
      }
      break;
    }
    case 'chargeWind':
      b.facing = toP; b.vx = 0;
      r.body.rotation.x = -0.35; b.flash = (Math.floor(b.t * 12) % 2) ? 0.05 : 0;
      if (b.t > 0.75 / fast) { b.state = 'charge'; b.t = 0; b.vx = b.facing * 15 * fast; }
      break;
    case 'charge':
      r.body.rotation.x = 0.4;
      walk = 2.5;
      if (Math.random() < 0.6) burst(b.x - b.facing * 1, 0.2, 0, 1, 0xcccccc, 2, 0.4);
      if ((b.facing > 0 && b.x > A[1] - b.hw - 0.3) || (b.facing < 0 && b.x < A[0] + b.hw + 0.3)) {
        b.state = 'stunned'; b.t = 0; b.stunDur = 1.8; b.vx = -b.facing * 4; b.vy = 6;
        S.shake = 0.8; audio.play('boom');
        toast('💫 Mack hit the wall — STUNNED! Wail on him!', 1.6);
      }
      break;
    case 'eggsWind':
      b.facing = toP; b.vx = 0;
      r.wings[0].rotation.z = -1.4; r.wings[1].rotation.z = 1.4;
      if (b.t > 0.55) {
        const n = b.phase === 2 ? 5 : 3;
        for (let i = 0; i < n; i++) {
          const T = 1.0 + i * 0.12;
          const tx = P.x + (i - (n - 1) / 2) * 2.2 + P.vx * 0.3;
          const sx = b.x + b.facing * 0.8, sy = b.y + 3.2;
          const g = { x: sx, y: sy, vx: (tx - sx) / T, vy: (0 - sy - 0.5 * G * 0.55 * T * T) / T, life: 3, owner: 'boss' };
          g.mesh = new THREE.Mesh(eggGeo, eggMat);
          g.mesh.castShadow = true;
          S.root.add(g.mesh);
          S.eggs.push(g);
        }
        audio.play('quack');
        b.state = 'recover'; b.t = 0;
      }
      break;
    case 'poundWind':
      b.facing = toP;
      r.body.scale.y = 0.8;
      if (b.t > 0.45) { r.body.scale.y = 1; b.state = 'pound'; b.t = 0; b.vy = 21; b.vx = THREE.MathUtils.clamp((P.x - b.x) / 1.4, -12, 12); b.onGround = false; }
      break;
    case 'pound':
      r.wings[0].rotation.z = -1 + Math.sin(b.t * 25) * 0.5; r.wings[1].rotation.z = 1 - Math.sin(b.t * 25) * 0.5;
      if (b.onGround && b.t > 0.2) {
        S.shake = 1; audio.play('boom');
        burst(b.x, 0.2, 0, 30, 0x9b7a4a, 8, 0.6);
        for (const d of [-1, 1]) {
          const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 2.4), new THREE.MeshBasicMaterial({ color: 0xffd21f, transparent: true, opacity: 0.75 }));
          m.position.set(b.x + d * b.hw, 0.5, 0);
          S.root.add(m);
          S.waves.push({ x: b.x + d * b.hw, vx: d * 11 * fast, life: 3, mesh: m });
        }
        if (b.phase === 2) setTimeout(() => {
          if (!S.boss || S.boss.hp <= 0 || S.mode !== 'play') return;
          for (const d of [-1, 1]) { const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.2, 2.4), new THREE.MeshBasicMaterial({ color: 0xff8a1c, transparent: true, opacity: 0.75 })); m.position.set(S.boss.x, 0.5, 0); S.root.add(m); S.waves.push({ x: S.boss.x, vx: d * 8, life: 3, mesh: m }); }
        }, 450);
        b.vx = 0; b.state = 'recover'; b.t = 0;
      }
      break;
    case 'recover':
      b.vx *= 0.9;
      if (b.t > (b.phase === 2 ? 0.6 : 1.0)) { b.state = 'idle'; b.t = 0; }
      break;
    case 'stunned':
      b.vx *= Math.pow(0.02, dt);
      r.body.rotation.z = Math.sin(b.t * 6) * 0.25;
      r.head.rotation.y = Math.sin(b.t * 9) * 0.5;
      if (Math.random() < 0.3) burst(b.x + Math.cos(b.t * 8) * 0.8, b.y + 4.0, 0, 1, 0xffff66, 0.5, 0.3, 0);
      if (b.t > (b.stunDur || 1.5)) { b.state = 'idle'; b.t = 0; r.body.rotation.z = 0; r.head.rotation.y = 0; }
      break;
    case 'roar':
      b.vx = 0;
      r.billBot.rotation.x = 0.5;
      r.wings[0].rotation.z = -1.5; r.wings[1].rotation.z = 1.5;
      S.shake = Math.max(S.shake, 0.2);
      if (Math.random() < 0.5) burst(b.x, b.y + 3, 0, 2, 0xff3333, 5, 0.4, 0);
      if (b.t > 1.6) { b.state = 'idle'; b.t = 0; r.billBot.rotation.x = 0; }
      break;
    case 'defeat':
      b.vx = 0;
      r.root.rotation.z = Math.min(Math.PI / 2, b.t * 2) * -b.facing;
      if (Math.random() < 0.3) burst(b.x, b.y + 1, 0, 3, [0xf08a1c, 0x1f3fbf, 0xffffff][Math.floor(Math.random() * 3)], 8, 1.2);
      if (b.t > 1.5 && S.trophy.state === 'caged') { S.trophy.state = 'falling'; S.root.remove(S.trophy.cage); audio.play('power'); }
      break;
  }

  if (b.state !== 'defeat') {
    b.vy += G * dt;
    moveBody(b, dt, b.hw, b.h, true);
    b.x = Math.max(A[0] + b.hw, Math.min(A[1] - b.hw, b.x));
  }
  if (b.state !== 'stunned' && b.state !== 'chargeWind' && b.state !== 'charge' && b.state !== 'roar' && b.state !== 'pound') r.body.rotation.x *= 0.85;

  // visuals
  r.root.position.set(b.x, b.y, 0);
  const targetRot = b.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  if (b.state !== 'defeat') r.root.rotation.y += (targetRot - r.root.rotation.y) * Math.min(1, dt * 8);
  if (walk) {
    const w = S.time * 10 * walk;
    r.legs[0].rotation.x = Math.sin(w) * 0.7; r.legs[1].rotation.x = -Math.sin(w) * 0.7;
    if (b.state === 'idle') { r.body.rotation.z = Math.sin(w) * 0.1; r.wings[0].rotation.z = -0.3; r.wings[1].rotation.z = 0.3; }
  }
  r.torso.material = b.flash > 0 ? M.mat(0xff5555, { emissive: 0xaa0000 }) : M.mat(0xf3f0e6);
  if (b.phase === 2 && b.state !== 'defeat') r.head.children[0].material = M.mat(0x1d7a3a, { emissive: 0x440000, emissiveIntensity: 0.6 + Math.sin(S.time * 8) * 0.4 });

  // trophy
  const T = S.trophy;
  if (T) {
    T.mesh.rotation.y += dt * 1.2;
    if (T.state === 'caged') T.cage.rotation.y -= dt;
    if (T.state === 'falling') {
      T.mesh.position.lerp(new THREE.Vector3(0, 0.05, 0), Math.min(1, dt * 2.2));
      if (T.mesh.position.distanceTo(new THREE.Vector3(0, 0.05, 0)) < 0.2) { T.state = 'ready'; T.x = 0; T.y = 0; toast('Grab the <b>SPIRIT TROPHY</b>!', 3, 'win'); }
    }
  }
}

// ---------------------------------------------------------------- tiger animation
const tmpV = new THREE.Vector3();
function lerpRot(obj, axis, target, k) { obj.rotation[axis] += (target - obj.rotation[axis]) * k; }
function animateTiger(dt) {
  const r = tiger;
  const k = 1 - Math.exp(-18 * dt);
  const sel = SLOTS[S.slot].id;
  const speed = Math.abs(P.vx);
  P.anim += dt * (P.onGround ? Math.max(2, speed * 1.35) : 2);
  const ph = P.anim;
  // defaults: boxer guard
  const T = {
    shL: -0.55, shLz: 0.15, elL: -2.0, shR: -0.55, shRz: -0.15, elR: -2.0,
    hipL: 0, hipR: 0, knL: 0.15, knR: 0.15, lean: 0.05, bob: Math.sin(S.time * 4) * 0.025, headX: 0,
  };
  if (P.onGround && speed > 0.6) {
    const s = Math.sin(ph);
    T.hipL = s * 0.85; T.hipR = -s * 0.85;
    T.knL = Math.max(0, -Math.cos(ph)) * 1.1 + 0.1; T.knR = Math.max(0, Math.cos(ph)) * 1.1 + 0.1;
    T.shL = -0.6 - s * 0.45; T.shR = -0.6 + s * 0.45;
    T.lean = 0.22; T.bob = Math.abs(Math.cos(ph)) * 0.08;
  } else if (!P.onGround) {
    T.hipL = -0.9; T.knL = 1.2; T.hipR = 0.35; T.knR = 0.5;
    T.shL = -2.4; T.shR = P.vy > 0 ? -2.6 : -1.4; T.elL = -0.4; T.elR = -0.5; T.lean = 0.1;
  }
  if (P.landT > 0) { T.knL = T.knR = 0.9; T.hipL = T.hipR = -0.6; T.bob = -0.18; }
  // held-item stances
  if (sel === 'gun') { T.shR = -1.5; T.shRz = 0; T.elR = -0.05; }
  if (sel === 'sword') { T.shR = -1.0; T.elR = -0.9; }
  if (sel === 'fireblast') { T.elL = T.elR = -1.6; T.shL = T.shR = -0.9; }
  const t = P.actionT;
  switch (P.action) {
    case 'punch':
      if (P.punchSide > 0) { T.shR = -1.6; T.shRz = 0.15; T.elR = -0.05; T.shL = -0.5; T.elL = -2.1; }
      else { T.shL = -1.6; T.shLz = -0.15; T.elL = -0.05; T.shR = -0.5; T.elR = -2.1; }
      T.lean = 0.3;
      break;
    case 'upper': T.shR = -2.8; T.elR = -0.5; T.lean = -0.15; T.knL = T.knR = 0.5; break;
    case 'shoot': T.shR = -1.55; T.elR = 0; T.lean = -0.05; break;
    case 'slash': { const a = 1 - t / 0.3; T.shR = THREE.MathUtils.lerp(-3.0, -0.5, Math.min(1, a * 1.6)); T.elR = -0.2; T.lean = 0.35; break; }
    case 'cast': T.shL = T.shR = -1.6; T.elL = T.elR = 0; T.shLz = 0.25; T.shRz = -0.25; T.lean = 0.25; break;
    case 'force': T.shL = -1.65; T.elL = 0; T.shLz = 0.1; T.shR = -0.4; T.elR = -1.6; T.lean = 0.3; break;
    case 'hurt': T.lean = -0.4; T.shL = T.shR = -0.2; T.headX = -0.3; break;
    case 'trophy': T.shL = T.shR = -3.0; T.shLz = 0.3; T.shRz = -0.3; T.elL = T.elR = -0.3; T.lean = -0.05; T.bob = Math.abs(Math.sin(S.time * 6)) * 0.25; break;
  }
  if (S.laserOn) { T.headX = -0.05; T.lean = -0.1; }
  lerpRot(r.armL.shoulder, 'x', T.shL, k); lerpRot(r.armL.shoulder, 'z', T.shLz, k); lerpRot(r.armL.elbow, 'x', T.elL, k);
  lerpRot(r.armR.shoulder, 'x', T.shR, k); lerpRot(r.armR.shoulder, 'z', T.shRz, k); lerpRot(r.armR.elbow, 'x', T.elR, k);
  lerpRot(r.legL.hip, 'x', T.hipL, k); lerpRot(r.legR.hip, 'x', T.hipR, k);
  lerpRot(r.legL.knee, 'x', T.knL, k); lerpRot(r.legR.knee, 'x', T.knR, k);
  lerpRot(r.body, 'x', T.lean, k); lerpRot(r.head, 'x', T.headX, k);
  r.body.position.y += (T.bob - r.body.position.y) * k;
  r.tailSegs.forEach((s, i) => { s.rotation.x = 0.28 + Math.sin(S.time * 3 + i * 0.6) * 0.12; s.rotation.y = Math.sin(S.time * 2.2 + i * 0.8) * 0.25; });

  // facing
  const targetY = P.facing > 0 ? Math.PI / 2 : -Math.PI / 2;
  r.root.rotation.y += (targetY - r.root.rotation.y) * (1 - Math.exp(-14 * dt));
  if (P.action === 'trophy') r.root.rotation.y += (0 - r.root.rotation.y) * (1 - Math.exp(-6 * dt));
  r.root.position.set(P.x, P.y, 0);
  r.root.visible = S.mode === 'dead' ? false : !(P.invuln > 0 && Math.floor(P.invuln * 14) % 2 && S.mode === 'play');

  // VISIBLE LOADOUT on the model
  r.held.gun.visible = sel === 'gun';
  r.hipGun.visible = sel !== 'gun';
  r.held.sword.visible = sel === 'sword' && S.owned.has('sword');
  r.backSword.visible = sel !== 'sword' && S.owned.has('sword');
  const fire = sel === 'fireblast';
  r.fireL.visible = r.fireR.visible = fire;
  if (fire) { const s = 0.9 + Math.sin(S.time * 25) * 0.15; r.fireL.scale.setScalar(s); r.fireR.scale.setScalar(1.9 - s); if (Math.random() < 0.4) { r.armR.hand.getWorldPosition(tmpV); burst(tmpV.x, tmpV.y, tmpV.z, 1, 0xff7a1a, 1.2, 0.35, 3); } }
  const laser = sel === 'laser';
  r.eyeMat.emissive.setHex(laser ? 0xff1133 : 0x000000);
  r.eyeMat.emissiveIntensity = S.laserOn ? 4 : laser ? 1.2 : 0;
  r.eyeMat.color.setHex(laser ? 0xff4466 : 0xffe066);
  r.aura.visible = sel === 'force';
  if (r.aura.visible) { r.aura.material.opacity = (P.action === 'force' ? 0.35 : 0.12) + Math.sin(S.time * 5) * 0.04; r.aura.scale.setScalar(P.action === 'force' ? 1.5 : 1 + Math.sin(S.time * 3) * 0.05); }
  if (P.action === 'trophy' && !r.trophy) {
    r.trophy = S.trophy.mesh;
    r.trophy.scale.setScalar(0.9);
    r.trophy.position.set(0, 2.95, 0.1);
    r.trophy.rotation.set(0, 0, 0);
    r.root.add(r.trophy);
  }
}

// ---------------------------------------------------------------- camera
const lookTarget = new THREE.Vector3();
const desired = new THREE.Vector3();
function updateCamera(dt) {
  S.camFacing += (P.facing - S.camFacing) * (1 - Math.exp(-2.5 * dt));
  S.lookAhead += (P.facing * 2.6 - S.lookAhead) * (1 - Math.exp(-3 * dt));
  let fx = P.x, fy = P.y, dist = 11.5;
  if (S.boss && S.mode !== 'victory') {
    const b = S.boss;
    fx = (P.x + b.x) / 2; fy = Math.min(P.y, 3) * 0.5 + 0.6;
    dist = 13 + Math.min(10, Math.abs(P.x - b.x) * 0.35);
  }
  if (S.camMode === 'side' || S.boss) {
    desired.set(fx - 2.2 + S.lookAhead * 0.4, fy + 3.1, dist);
    lookTarget.lerp(tmpV.set(fx + S.lookAhead * (S.boss ? 0.3 : 1), fy + 1.5, 0), 1 - Math.exp(-6 * dt));
  } else {
    // behind-the-shoulder chase cam: swings around when the tiger turns
    const cf = S.camFacing;
    desired.set(P.x - cf * 7.5, P.y + 3.4, 3.2 + (1 - Math.abs(cf)) * 8);
    lookTarget.lerp(tmpV.set(P.x + cf * 7, P.y + 1.4, 0), 1 - Math.exp(-6 * dt));
  }
  if (S.mode === 'victory') { desired.set(P.x + 1.5, P.y + 2.6, 6.5); lookTarget.lerp(tmpV.set(P.x, P.y + 2.2, 0), 1 - Math.exp(-4 * dt)); }
  camera.position.lerp(desired, 1 - Math.exp(-5 * dt));
  if (S.shake > 0) {
    const s = S.shake * 0.35 * (window.REDUCED_MOTION ? 0.25 : 1);
    camera.position.x += (Math.random() - 0.5) * s; camera.position.y += (Math.random() - 0.5) * s;
    S.shake = Math.max(0, S.shake - dt * 2.5);
  }
  camera.lookAt(lookTarget);
  sun.position.set(P.x + 12, P.y + 22, 14);
  sun.target.position.set(P.x + 4, P.y, 0);
}

// ---------------------------------------------------------------- game flow
function startGame(levelIndex = 0, { easy = false } = {}) {
  audio.init();
  S.lives = easy ? 9 : 3; S.easy = easy;
  S.score = 0; S.coinCount = 0;
  S.owned = new Set(['gun']);
  // starting deeper in the run grants the powers found in earlier levels
  for (const [k, lv] of Object.entries(ITEM_LEVEL)) if (lv <= levelIndex) S.owned.add(k);
  S.slot = 0;
  if (tiger.trophy) { tiger.root.remove(tiger.trophy); tiger.trophy = null; }
  $('hud').classList.remove('dim');
  beginLevel(levelIndex, true);
}

function beginLevel(i, fresh) {
  loadLevel(i, { fresh });
  P.action = null;
  S.mode = 'intro'; S.modeT = TEST ? 0 : 2.6;
  const L = S.level;
  showOverlay('card', `<div class="tag">LEVEL ${L.id} / 4</div><h1>${L.name}</h1><p>${L.subtitle}</p>`);
  $('hud').classList.add('show');
  audio.startMusic(L.music);
}

function retryLevel() {
  S.owned = new Set(S.ownedAtLevelStart);
  if (!S.owned.has(SLOTS[S.slot].id)) S.slot = 0;
  S.lives = S.easy ? 9 : 3;
  S.score = S.scoreAtStart; S.coinCount = S.coinsAtStart;
  beginLevel(S.levelIndex, false);
}

function setPaused(on) {
  if (on && S.mode === 'play') {
    S.mode = 'paused';
    audio.stopMusic();
    showOverlay('pause');
  } else if (!on && S.mode === 'paused') {
    S.mode = 'play';
    audio.startMusic(S.level.music);
    showOverlay(null);
  }
}

function toMenu() {
  S.mode = 'title';
  audio.stopMusic();
  $('hud').classList.remove('show');
  showOverlay('title');
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-act]');
  if (!btn) return;
  const act = btn.dataset.act;
  audio.init();
  const easy = $('easy')?.checked;
  if (act === 'start') startGame(0, { easy });
  if (act === 'level') startGame(+btn.dataset.level, { easy });
  if (act === 'next') beginLevel(S.levelIndex + 1, true);
  if (act === 'retry') retryLevel();
  if (act === 'menu') toMenu();
  if (act === 'again') startGame(0, { easy: S.easy });
  if (act === 'resume') setPaused(false);
  if (act === 'help') $('help').classList.toggle('show');
});

function handleGlobalInput() {
  if (pressed.has('mute')) { const m = audio.toggleMute(); toast(m ? '🔇 Sound off' : '🔊 Sound on', 1); }
  if (pressed.has('help')) $('help').classList.toggle('show');
  if (pressed.has('cam')) { S.camMode = S.camMode === 'side' ? 'chase' : 'side'; toast(S.camMode === 'side' ? '🎥 Side camera' : '🎥 Over-the-shoulder camera', 1.2); }
  if (pressed.has('confirm')) {
    if (S.mode === 'title') startGame(0, { easy: $('easy')?.checked });
    else if (S.mode === 'complete' && S.modeT > 0.5) beginLevel(S.levelIndex + 1, true);
    else if (S.mode === 'gameover') retryLevel();
    else if (S.mode === 'victory' && S.modeT > 1) startGame(0, { easy: S.easy });
    else if (S.mode === 'paused') setPaused(false);
  }
  if (pressed.has('pause')) { if (S.mode === 'play') setPaused(true); else if (S.mode === 'paused') setPaused(false); }
}

function handlePlayInput() {
  for (let i = 1; i <= 5; i++) if (pressed.has('slot' + i)) selectSlot(i - 1);
  if (pressed.has('next') || pressed.has('prev')) {
    const d = pressed.has('next') ? 1 : -1;
    let i = S.slot;
    for (let n = 0; n < 5; n++) { i = (i + d + 5) % 5; if (S.owned.has(SLOTS[i].id)) break; }
    selectSlot(i);
  }
  if (pressed.has('jump')) P.jumpBuf = 0.13;
  if (pressed.has('punch')) doPunch();
  if (pressed.has('use')) doUse(true);
  else if (keys.has('use') && SLOTS[S.slot].id === 'gun') {/* single-shot gun */}
  else if (keys.has('use') && (SLOTS[S.slot].id === 'fireblast' || SLOTS[S.slot].id === 'sword')) doUse(true);
}

// ---------------------------------------------------------------- main loop
const clock = new THREE.Clock();
const STEPS = 3;
function step(dt) {
  S.time += dt;
  for (const k in S.cd) S.cd[k] = Math.max(0, S.cd[k] - dt);
  updateSolids(dt);
  if (S.mode === 'play') {
    S.levelTime += dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateBoss(dt);
    updateProjectiles(dt);
    if (S.flood) {
      const F = S.level.flood;
      S.flood.grace -= dt;
      if (S.flood.grace <= 0) {
        S.flood.y += F.speed * dt;
        if (S.flood.y < P.y - F.catchup) S.flood.y += 2.2 * dt;
        S.flood.y = Math.min(S.flood.y, 25.5);
      }
    }
  } else if (S.mode === 'dead') {
    updateEnemies(dt); updateProjectiles(dt); updateBoss(dt);
  } else if (S.mode === 'victory' || S.mode === 'complete') {
    P.vx *= 0.9; P.vy += G * dt; moveBody(P, dt, PW, PH);
    if (S.mode === 'complete') { P.action = 'trophy'; P.actionT = 0.1; }
  }
  if (S.flood) {
    S.flood.mesh.position.y = S.flood.y - 30 + Math.sin(S.time * 2) * 0.05;
  }
}

function frame() {
  requestAnimationFrame(frame);
  const raw = Math.min(0.05, clock.getDelta());
  pressedSnapshot();
  handleGlobalInput();
  if (S.mode === 'intro') { S.modeT -= raw; if (S.modeT <= 0) { S.mode = 'play'; showOverlay(null); } }
  if (S.mode === 'dead') { S.modeT -= raw; if (S.modeT <= 0) respawn(); }
  if (S.mode === 'complete' || S.mode === 'victory') S.modeT += raw;
  if (S.mode === 'play') handlePlayInput();
  updateLaser(raw);
  if (S.hitstop > 0) { S.hitstop -= raw; }
  else if (S.level && S.mode !== 'title' && S.mode !== 'paused' && S.mode !== 'gameover') for (let i = 0; i < STEPS; i++) step(raw / STEPS);
  pressed.clear();
  if (S.level && S.mode !== 'title') {
    animateTiger(raw);
    updateCamera(raw);
    updateParticles(raw);
    if (rain.visible) updateRain(raw, camera.position.x, P.y);
    animatePickups(raw);
    if (flashLight.intensity > 0) flashLight.intensity = Math.max(0, flashLight.intensity - raw * 12);
    if (forceRing.visible) { forceRing.userData.t -= raw; const a = 1 - forceRing.userData.t / 0.45; forceRing.scale.setScalar(1 + a * 6); forceRing.position.x += P.facing * raw * 10; forceRing.material.opacity = 0.8 * (1 - a); if (forceRing.userData.t <= 0) forceRing.visible = false; }
    if (slashMesh.visible) { slashMesh.userData.t -= raw; slashMesh.material.opacity = slashMesh.userData.t / 0.18 * 0.8; slashMesh.rotation.z += raw * 8 * P.facing * -1; if (slashMesh.userData.t <= 0) slashMesh.visible = false; }
    if (S.crowd) {
      const m = new THREE.Matrix4();
      // crowd bobbing (cheap: only every other frame)
      if ((S.frameN = (S.frameN || 0) + 1) % 2 === 0) {
        for (let i = 0; i < S.crowd.n; i += 1) {
          S.crowd.im.getMatrixAt(i, m);
          const e = m.elements;
          const base = 1.2 + Math.floor(i / (S.crowd.n / 4)) * 1.3;
          e[13] = base + Math.max(0, Math.sin(S.time * 8 + i * 1.7)) * (S.mode === 'victory' || S.boss?.hp <= 0 ? 0.5 : 0.12);
          S.crowd.im.setMatrixAt(i, m);
        }
        S.crowd.im.instanceMatrix.needsUpdate = true;
      }
    }
    updateHUD();
  } else {
    // title screen: slowly orbit the hero
    titleScene(raw);
  }
  if (toastTimer > 0) { toastTimer -= raw; if (toastTimer <= 0) $('toast').className = ''; }
  renderer.render(scene, camera);
}
function pressedSnapshot() {}

function animatePickups(dt) {
  for (const pk of S.pickups) {
    if (pk.taken) continue;
    pk.t += dt;
    pk.mesh.position.y = pk.y + Math.sin(pk.t * 2.5) * 0.18;
    pk.mesh.rotation.y += dt * 1.6;
    const ring = pk.mesh.getObjectByName('ring');
    if (ring) ring.rotation.x += dt * 2;
  }
  for (const c of S.coins) if (!c.taken) c.mesh.rotation.y += dt * 3;
}

// title backdrop
let titleBuilt = false;
function titleScene(dt) {
  if (!titleBuilt) {
    titleBuilt = true;
    loadLevel(0);
    S.level = LEVELS[0];
    P.x = 26.5; P.y = 0;
  }
  S.time += dt;
  const a = S.time * 0.15;
  camera.position.set(26 + Math.sin(a) * 9, 3.2, 8 + Math.cos(a) * 3);
  camera.lookAt(26, 2.2, -2);
  P.facing = 1; P.action = null;
  tiger.root.position.set(22, 0, 0);
  tiger.root.rotation.y = 0.5;
  animateTiger(dt);
  tiger.root.position.set(22, 0, 0);
  tiger.root.rotation.y = 0.5;
  updateParticles(dt);
}

// ---------------------------------------------------------------- self test (?test=1)
function runSelfTest() {
  const results = [];
  const check = (name, cond) => results.push(`${cond ? 'PASS' : 'FAIL'} ${name}`);
  try {
    audio.ctx = null;
    S.lives = 3; S.owned = new Set(['gun']);
    for (let i = 0; i < LEVELS.length; i++) {
      loadLevel(i);
      S.mode = 'play';
      for (let n = 0; n < 90; n++) { updateSolids(1 / 60); updatePlayer(1 / 60); }
      check(`L${i + 1} '${LEVELS[i].name}' spawns on solid ground`, P.onGround && S.mode === 'play');
    }
    // Level 1 campus details exist
    check('L1 has Library + Dining Hall + Statue signage', LEVELS[0].decor.toString().includes('buildLibrary') && LEVELS[0].decor.toString().includes('buildDiningHall') && LEVELS[0].decor.toString().includes('buildStatue'));
    // ray gun rule
    loadLevel(0); S.mode = 'play'; S.slot = 0; S.ammo = 4;
    for (let n = 0; n < 4; n++) { S.cd.gun = 0; doUse(true); }
    check('Ray gun fires exactly 4 shots', S.ammo === 0 && S.projectiles.length === 4);
    S.cd.gun = 0; doUse(true);
    check('Ray gun empty → no 5th shot', S.projectiles.length === 4);
    const e = S.enemies[0]; killEnemy(e);
    check('KO reloads ray gun to 4', S.ammo === 4);
    // pickups unlock slots + visible loadout
    const sw = S.pickups.find((p) => p.kind === 'sword');
    collect(sw);
    check('Sword pickup unlocks slot 2 and equips it', S.owned.has('sword') && S.slot === 1);
    animateTiger(0.016);
    check('Sword is visibly held by the tiger', tiger.held.sword.visible && !tiger.held.gun.visible);
    selectSlot(3);
    check('Locked slot (Laser Eyes) cannot be selected yet', S.slot === 1);
    // level complete trigger
    P.x = LEVELS[0].finishX + 0.1; P.y = 0; updatePlayer(1 / 60);
    check('Reaching the flag completes the level', S.mode === 'complete');
    // flood level
    S.owned = new Set(['gun', 'sword', 'fireblast']);
    loadLevel(2); S.mode = 'play'; S.lives = 3;
    S.flood.y = P.y + 5; updatePlayer(1 / 60);
    check('Gauntlet flood costs a life', S.mode === 'dead' && S.lives === 2);
    // boss
    S.owned = new Set(['gun', 'sword', 'fireblast', 'laser', 'force']);
    loadLevel(3); S.mode = 'play'; S.boss.state = 'idle';
    selectSlot(4); P.x = S.boss.x - 3; P.facing = 1; doUse(true);
    check('The Force damages + stuns the Duck boss', S.boss.hp < 40 && S.boss.state === 'stunned');
    S.boss.hp = 20.5; S.boss.state = 'idle'; S.boss.invuln = 0; damageBoss(1);
    check('Boss enters phase 2 below 50%', S.boss.phase === 2);
    S.boss.state = 'idle'; S.boss.invuln = 0; S.boss.hp = 1; damageBoss(5);
    check('Boss can be defeated', S.boss.state === 'defeat');
    for (let n = 0; n < 400; n++) step(1 / 60);
    check('Trophy drops after boss defeat', S.trophy.state === 'ready');
    P.x = 0; P.y = 0; updatePlayer(1 / 60);
    check('Grabbing the trophy = VICTORY', S.mode === 'victory');
    // fail state
    loadLevel(0); S.mode = 'play'; S.lives = 1; P.invuln = 0;
    for (let n = 0; n < 6; n++) { P.invuln = 0; hurtPlayer(1, P.x - 1); }
    S.modeT = 0; respawn();
    check('Losing all lives = GAME OVER', S.mode === 'gameover');
  } catch (err) {
    results.push('FAIL exception: ' + err.message + ' ' + (err.stack || '').split('\n')[1]);
  }
  const ok = results.every((r) => r.startsWith('PASS'));
  document.body.dataset.test = `${ok ? 'ALLPASS' : 'FAILED'} ${results.length}`;
  $('testout').textContent = results.join('\n');
  $('testout').style.display = 'block';
  // leave a nice scene for the screenshot
  startGame(+(params.get('level') || 1) - 1);
  S.mode = 'play'; showOverlay(null);
}

// ---------------------------------------------------------------- boot
window.__game = { S, P, startGame, LEVELS };
showOverlay('title');
if (TEST) runSelfTest();
else if (params.get('level')) startGame(Math.max(0, Math.min(3, +params.get('level') - 1)), { easy: params.has('easy') });
frame();
