// Procedural, original low-poly models built from three.js primitives (no external assets).
import * as THREE from 'three';

const mats = new Map();
export function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05, ...opts }));
  return mats.get(key);
}

function mesh(geo, material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function scaled(m, x, y, z) { m.scale.set(x, y, z); return m; }

// ---------- textures ----------------------------------------------------------
function stripeTexture() {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#f08a1c'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#1b1208';
  for (let i = 0; i < 9; i++) {
    const y = 10 + i * 28;
    g.beginPath();
    g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 6 + (x % 32 ? 4 : -2));
    g.lineTo(256, y + 9);
    for (let x = 256; x >= 0; x -= 16) g.lineTo(x, y + 9 + Math.sin(x * 0.07 + i * 2) * 3);
    g.closePath(); g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function textTexture(text, { bg = '#222', fg = '#fff', w = 512, h = 128, font = 'bold 72px sans-serif', border = null } = {}) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 10; g.strokeRect(5, 5, w - 10, h - 10); }
  g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, w / 2, h / 2 + 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function sign(text, w, h, opts) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: textTexture(text, opts) }));
  return m;
}

// ---------- limb helper --------------------------------------------------------
function limb(len, radius, material) {
  const pivot = new THREE.Group();
  const m = mesh(new THREE.CapsuleGeometry(radius, len, 4, 8), material, 0, -len / 2 - radius * 0.5, 0);
  pivot.add(m);
  pivot.userData.len = len + radius;
  return pivot;
}

// ---------- weapons (held + pickup display) -------------------------------------
export function buildRayGun() {
  const g = new THREE.Group();
  const body = mat(0xc9d3e0, { metalness: 0.7, roughness: 0.3 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x4cff9a });
  g.add(mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.55, 12), body, 0, 0, 0.2).rotateX(Math.PI / 2));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 14), mat(0xe84a5f), 0, 0, 0.05 + i * 0.13));
  const dish = mesh(new THREE.ConeGeometry(0.16, 0.18, 14, 1, true), body, 0, 0, 0.53);
  dish.rotation.x = -Math.PI / 2;
  g.add(dish);
  const tip = mesh(new THREE.SphereGeometry(0.07, 10, 8), glow, 0, 0, 0.58);
  tip.name = 'tip';
  g.add(tip);
  g.add(mesh(new THREE.BoxGeometry(0.1, 0.28, 0.12), mat(0x333344), 0, -0.17, -0.02));
  return g;
}

export function buildSword() {
  const g = new THREE.Group();
  const blade = mesh(new THREE.BoxGeometry(0.08, 1.25, 0.03), mat(0xdfe8ff, { metalness: 0.9, roughness: 0.15, emissive: 0x2244aa, emissiveIntensity: 0.35 }), 0, 0.78, 0);
  g.add(blade);
  const tipG = new THREE.ConeGeometry(0.06, 0.18, 4);
  g.add(mesh(tipG, blade.material, 0, 1.49, 0));
  g.add(mesh(new THREE.BoxGeometry(0.42, 0.07, 0.1), mat(0xf2b61b, { metalness: 0.8, roughness: 0.3 }), 0, 0.14, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.26, 8), mat(0x4a2a12), 0, 0, 0));
  g.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xf2b61b, { metalness: 0.8 }), 0, -0.15, 0));
  return g;
}

export function buildPowerOrb(color, label) {
  const g = new THREE.Group();
  const core = mesh(new THREE.IcosahedronGeometry(0.38, 1), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 1.2, roughness: 0.2 }));
  g.add(core);
  const ring = mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), new THREE.MeshBasicMaterial({ color }));
  ring.name = 'ring';
  g.add(ring);
  if (label) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: textTexture(label, { bg: 'rgba(0,0,0,0.65)', fg: '#fff', w: 512, h: 112, font: 'bold 56px sans-serif' }), transparent: true, depthTest: false }));
    s.scale.set(2.6, 0.57, 1);
    s.position.y = 1.15;
    s.renderOrder = 10;
    g.add(s);
  }
  return g;
}

// ---------- the hero: "Stripes", humanoid tiger boxer ----------------------------
export function buildTiger({ gold = false } = {}) {
  const fur = gold ? mat(0xd4af37, { metalness: 0.8, roughness: 0.3 }) : new THREE.MeshStandardMaterial({ map: stripeTexture(), roughness: 0.8 });
  const white = gold ? fur : mat(0xfff6e8);
  const dark = gold ? fur : mat(0x1b1208);
  const shorts = gold ? fur : mat(0x1f3fbf);
  const glove = gold ? fur : mat(0xd61f2c, { roughness: 0.35 });

  const root = new THREE.Group();
  const body = new THREE.Group(); // bob / lean
  root.add(body);
  body.position.y = 0;

  // pelvis/torso
  const hips = new THREE.Group(); hips.position.y = 0.95; body.add(hips);
  hips.add(mesh(new THREE.CylinderGeometry(0.3, 0.27, 0.3, 12), shorts, 0, 0, 0)); // boxing shorts
  hips.add(mesh(new THREE.TorusGeometry(0.29, 0.04, 6, 16), white, 0, 0.15, 0).rotateX(Math.PI / 2));
  const chest = new THREE.Group(); chest.position.y = 0.15; hips.add(chest);
  const torso = mesh(new THREE.CapsuleGeometry(0.3, 0.42, 6, 12), fur, 0, 0.33, 0);
  torso.scale.set(1.05, 1, 0.8);
  chest.add(torso);
  chest.add(scaled(mesh(new THREE.SphereGeometry(0.22, 10, 8), white, 0, 0.3, 0.13), 1, 1.3, 0.5));

  // head
  const head = new THREE.Group(); head.position.y = 0.92; chest.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.32, 16, 12), fur, 0, 0.05, 0));
  const muzzle = mesh(new THREE.SphereGeometry(0.17, 12, 10), white, 0, -0.04, 0.23);
  muzzle.scale.set(1.25, 0.85, 0.8);
  head.add(muzzle);
  head.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), mat(0xe56b8a), 0, 0.03, 0.37));
  for (const s of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.11, 0.2, 8), fur, s * 0.21, 0.33, -0.02);
    ear.rotation.z = -s * 0.35;
    head.add(ear);
    head.add(scaled(mesh(new THREE.SphereGeometry(0.1, 8, 6), white, s * 0.25, -0.02, 0.15), 1, 0.7, 0.6)); // cheek fluff
  }
  const eyes = [];
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0x000000 });
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeMat, s * 0.11, 0.12, 0.27);
    e.add(mesh(new THREE.SphereGeometry(0.03, 8, 6), dark, 0, 0, 0.04));
    head.add(e);
    eyes.push(e);
    const brow = mesh(new THREE.BoxGeometry(0.12, 0.025, 0.03), dark, s * 0.11, 0.21, 0.28);
    brow.rotation.z = s * 0.25;
    head.add(brow);
  }

  // arms: shoulder -> upper -> elbow -> fore -> glove
  function arm(side) {
    const shoulder = limb(0.3, 0.09, fur);
    shoulder.position.set(side * 0.4, 0.55, 0);
    chest.add(shoulder);
    const elbow = limb(0.26, 0.085, fur);
    elbow.position.y = -0.42;
    shoulder.add(elbow);
    const hand = new THREE.Group();
    hand.position.y = -0.4;
    elbow.add(hand);
    const g = mesh(new THREE.SphereGeometry(0.15, 12, 10), glove, 0, 0, 0.02);
    g.scale.set(1, 1.1, 1.15);
    hand.add(g);
    hand.add(mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.1, 10), white, 0, 0.13, 0));
    return { shoulder, elbow, hand, glove: g };
  }
  const armL = arm(-1), armR = arm(1);

  function leg(side) {
    const hip = limb(0.32, 0.11, fur);
    hip.position.set(side * 0.16, -0.1, 0);
    hips.add(hip);
    const knee = limb(0.3, 0.1, fur);
    knee.position.y = -0.45;
    hip.add(knee);
    const foot = mesh(new THREE.BoxGeometry(0.18, 0.1, 0.32), dark, 0, -0.45, 0.08);
    knee.add(foot);
    return { hip, knee };
  }
  const legL = leg(-1), legR = leg(1);

  // tail
  const tail = new THREE.Group(); tail.position.set(0, 0, -0.27); hips.add(tail);
  let parent = tail;
  const tailSegs = [];
  for (let i = 0; i < 6; i++) {
    const seg = new THREE.Group();
    seg.position.z = i === 0 ? 0 : -0.14;
    seg.add(mesh(new THREE.SphereGeometry(0.065 - i * 0.004, 8, 6), i % 2 ? dark : fur, 0, 0, -0.07));
    parent.add(seg);
    tailSegs.push(seg);
    parent = seg;
  }

  // held items (in right hand) + back holster
  const held = {
    gun: buildRayGun(),
    sword: buildSword(),
  };
  held.gun.position.set(0, -0.05, 0.1);
  held.gun.rotation.x = Math.PI / 2; // points down the arm (-y) so arm raise aims it forward
  held.gun.rotation.set(Math.PI / 2, 0, 0);
  armR.hand.add(held.gun);
  held.sword.rotation.x = Math.PI / 2;
  held.sword.position.set(0, -0.02, 0.05);
  armR.hand.add(held.sword);
  const backSword = buildSword();
  backSword.position.set(0.05, 0.35, -0.3);
  backSword.rotation.z = 0.7;
  chest.add(backSword);
  const hipGun = buildRayGun();
  hipGun.scale.setScalar(0.85);
  hipGun.position.set(-0.33, -0.05, 0.05);
  hipGun.rotation.x = Math.PI / 2 + 0.2;
  hips.add(hipGun);

  // fire hands
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff6a00, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const fireL = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), fireMat);
  const fireR = fireL.clone();
  armL.hand.add(fireL); armR.hand.add(fireR);
  // force aura
  const aura = new THREE.Mesh(new THREE.SphereGeometry(1.1, 20, 14), new THREE.MeshBasicMaterial({ color: 0x9b5cff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false }));
  aura.position.y = 1.0;
  root.add(aura);

  if (gold) { held.gun.visible = held.sword.visible = backSword.visible = hipGun.visible = false; fireL.visible = fireR.visible = aura.visible = false; }

  const rig = { root, body, hips, chest, head, eyes, eyeMat, armL, armR, legL, legR, tail, tailSegs, held, backSword, hipGun, fireL, fireR, aura };
  root.userData.rig = rig;
  return rig;
}

// ---------- rival: "Mallard Mack" and duck cadets ----------------------------------
export function buildDuck({ scale = 1, boss = false } = {}) {
  const root = new THREE.Group();
  const body = new THREE.Group();
  root.add(body);
  const feather = mat(boss ? 0xf3f0e6 : 0xf6e27a);
  const headMat = mat(boss ? 0x1d7a3a : 0xf6e27a, { roughness: 0.4, metalness: boss ? 0.2 : 0 });
  const bill = mat(0xff9a1f);
  const jersey = mat(0x0d6b3d);
  const jerseyTrim = mat(0xffd21f);

  const torso = mesh(new THREE.SphereGeometry(0.55, 16, 12), feather, 0, 0.75, 0);
  torso.scale.set(1, 0.95, 1.15);
  body.add(torso);
  const shirt = mesh(new THREE.CylinderGeometry(0.5, 0.56, 0.5, 14), jersey, 0, 0.72, 0);
  body.add(shirt);
  body.add(mesh(new THREE.TorusGeometry(0.5, 0.04, 6, 18), jerseyTrim, 0, 0.97, 0).rotateX(Math.PI / 2));
  if (boss) {
    const num = sign('00', 0.5, 0.32, { bg: '#0d6b3d', fg: '#ffd21f', w: 128, h: 80, font: 'bold 60px sans-serif' });
    num.position.set(0, 0.74, 0.575);
    body.add(num);
  }
  const tailF = mesh(new THREE.ConeGeometry(0.2, 0.4, 8), feather, 0, 0.9, -0.62);
  tailF.rotation.x = -2.2;
  body.add(tailF);

  const head = new THREE.Group(); head.position.set(0, 1.45, 0.12); body.add(head);
  head.add(mesh(new THREE.SphereGeometry(0.36, 16, 12), headMat));
  const billTop = mesh(new THREE.BoxGeometry(0.34, 0.08, 0.36), bill, 0, -0.02, 0.4);
  const billBot = mesh(new THREE.BoxGeometry(0.3, 0.06, 0.3), bill, 0, -0.1, 0.37);
  head.add(billTop, billBot);
  const eyeW = mat(0xffffff);
  const pupil = mat(0x111111);
  for (const s of [-1, 1]) {
    const e = mesh(new THREE.SphereGeometry(0.08, 10, 8), eyeW, s * 0.15, 0.1, 0.28);
    e.add(mesh(new THREE.SphereGeometry(0.04, 8, 6), pupil, 0, 0, 0.06));
    head.add(e);
    const brow = mesh(new THREE.BoxGeometry(0.16, 0.035, 0.04), mat(0x111111), s * 0.15, 0.21, 0.31);
    brow.rotation.z = -s * 0.45; // angry
    head.add(brow);
  }
  if (boss) {
    // rival headband + crown-ish crest
    head.add(mesh(new THREE.TorusGeometry(0.35, 0.05, 6, 20), jerseyTrim, 0, 0.12, 0).rotateX(Math.PI / 2 - 0.15));
    for (let i = -1; i <= 1; i++) head.add(mesh(new THREE.ConeGeometry(0.05, 0.22, 6), jerseyTrim, i * 0.1, 0.42, -0.02));
  } else {
    // cadet helmet
    const helm = mesh(new THREE.SphereGeometry(0.38, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), jersey, 0, 0.02, -0.02);
    head.add(helm);
  }

  const wings = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(s * 0.55, 0.95, 0);
    const w = mesh(new THREE.SphereGeometry(0.28, 10, 8), feather, s * 0.08, -0.22, 0);
    w.scale.set(0.35, 1, 0.8);
    p.add(w);
    body.add(p);
    wings.push(p);
  }
  const legs = [];
  for (const s of [-1, 1]) {
    const p = new THREE.Group();
    p.position.set(s * 0.22, 0.3, 0);
    p.add(mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.3, 6), bill, 0, -0.14, 0));
    p.add(mesh(new THREE.BoxGeometry(0.24, 0.05, 0.3), bill, 0, -0.29, 0.08));
    body.add(p);
    legs.push(p);
  }
  root.scale.setScalar(scale);
  const rig = { root, body, head, billBot, wings, legs, torso };
  root.userData.rig = rig;
  return rig;
}

// ---------- campus scenery --------------------------------------------------------
export function buildLibrary() {
  const g = new THREE.Group();
  const stone = mat(0xd9cfb8), roof = mat(0x6d3b2a), dark = mat(0x2b2b38);
  g.add(mesh(new THREE.BoxGeometry(12, 6, 5), stone, 0, 3, 0));
  g.add(mesh(new THREE.BoxGeometry(13, 0.5, 6), stone, 0, 6.25, 0));
  const tri = new THREE.Shape();
  tri.moveTo(-6.4, 0); tri.lineTo(6.4, 0); tri.lineTo(0, 2); tri.closePath();
  const ped = mesh(new THREE.ExtrudeGeometry(tri, { depth: 1, bevelEnabled: false }), roof, 0, 6.5, 2.2);
  g.add(ped);
  for (let i = -2; i <= 2; i++) g.add(mesh(new THREE.CylinderGeometry(0.32, 0.36, 5.2, 12), mat(0xf0e8d6), i * 2.2, 2.9, 2.9));
  for (let i = 0; i < 3; i++) g.add(mesh(new THREE.BoxGeometry(11 - i, 0.3, 1), stone, 0, 0.15 + i * 0.3 - 0.3, 3.4 - i * 0.4));
  g.add(mesh(new THREE.BoxGeometry(2, 3.2, 0.1), dark, 0, 1.6, 2.52));
  for (const x of [-4.4, 4.4]) for (const y of [2, 4.5]) g.add(mesh(new THREE.BoxGeometry(1.1, 1.4, 0.1), mat(0x88b7e8, { emissive: 0x223355 }), x, y, 2.52));
  const s = sign('LIBRARY', 5.2, 0.9, { bg: '#3a2418', fg: '#f6e3b4', border: '#c9a24a' });
  s.position.set(0, 5.6, 3.36);
  g.add(s);
  return g;
}

export function buildDiningHall() {
  const g = new THREE.Group();
  const brick = mat(0xa8452f), trim = mat(0xf2ead8);
  g.add(mesh(new THREE.BoxGeometry(11, 5, 5), brick, 0, 2.5, 0));
  g.add(mesh(new THREE.BoxGeometry(11.4, 0.4, 5.4), trim, 0, 5.2, 0));
  for (let i = -4; i <= 4; i += 2) g.add(mesh(new THREE.BoxGeometry(1.2, 1.5, 0.1), mat(0xffe9a8, { emissive: 0x665522 }), i, 3, 2.52));
  // striped awning
  for (let i = 0; i < 8; i++) {
    const a = mesh(new THREE.BoxGeometry(0.9, 0.08, 1.4), mat(i % 2 ? 0xffffff : 0xe8442f), -3.15 + i * 0.9, 1.9, 3.0);
    a.rotation.x = 0.35;
    g.add(a);
  }
  g.add(mesh(new THREE.BoxGeometry(2, 2.2, 0.1), mat(0x553322), 0, 1.1, 2.52));
  const s = sign('DINING HALL', 6, 0.9, { bg: '#f2ead8', fg: '#8a2b1a', border: '#8a2b1a', font: 'bold 64px sans-serif' });
  s.position.set(0, 4.35, 2.56);
  g.add(s);
  // giant burger on roof
  const bun = mat(0xd9913c);
  g.add(mesh(new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bun, 0, 5.9, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.3, 14), mat(0x5a2a12), 0, 5.75, 0));
  g.add(mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.1, 14), mat(0x5fbf3a), 0, 5.92, 0));
  return g;
}

export function buildStatue() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(2.2, 1.6, 2.2), mat(0x8c8c94), 0, 0.8, 0));
  g.add(mesh(new THREE.BoxGeometry(2.6, 0.3, 2.6), mat(0x77777f), 0, 1.7, 0));
  const t = buildTiger({ gold: true });
  t.root.position.y = 1.85;
  t.root.scale.setScalar(1.25);
  t.armR.shoulder.rotation.x = -2.8; // victory fist
  t.armL.shoulder.rotation.z = 0.3;
  g.add(t.root);
  const s = sign('STRIPES • EST. 1891', 2.1, 0.35, { bg: '#5a5a62', fg: '#f4d35e', w: 512, h: 88, font: 'bold 48px sans-serif' });
  s.position.set(0, 0.9, 1.11);
  g.add(s);
  return g;
}

export function buildTree(h = 3) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.18, 0.25, h, 7), mat(0x6b4423), 0, h / 2, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(1.3, 0), mat(0x3f9b3a, { flatShading: true }), 0, h + 0.6, 0));
  g.add(mesh(new THREE.IcosahedronGeometry(0.9, 0), mat(0x4fb345, { flatShading: true }), 0.5, h + 1.3, 0.2));
  return g;
}

export function buildClockTower() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.BoxGeometry(3, 16, 3), mat(0xb9a98a), 0, 8, 0));
  g.add(mesh(new THREE.ConeGeometry(2.4, 4, 4), mat(0x2f5d3a), 0, 18, 0).rotateY(Math.PI / 4));
  const face = mesh(new THREE.CircleGeometry(1.1, 24), mat(0xfaf6e8, { emissive: 0x444433 }), 0, 13, 1.52);
  g.add(face);
  const hand = mesh(new THREE.BoxGeometry(0.08, 0.8, 0.02), mat(0x111111), 0, 13.3, 1.55);
  g.add(hand);
  return g;
}

export function buildBench() {
  const g = new THREE.Group();
  const w = mat(0x8a5a2b), m = mat(0x333333);
  g.add(mesh(new THREE.BoxGeometry(2, 0.12, 0.6), w, 0, 0.5, 0));
  g.add(mesh(new THREE.BoxGeometry(2, 0.5, 0.1), w, 0, 0.85, -0.28));
  for (const x of [-0.85, 0.85]) g.add(mesh(new THREE.BoxGeometry(0.08, 0.5, 0.6), m, x, 0.25, 0));
  return g;
}

export function buildGoalpost() {
  const g = new THREE.Group();
  const y = mat(0xffd21f, { metalness: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 8), y, 0, 1.75, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 5.5, 8), y, 0, 3.5, 0).rotateZ(Math.PI / 2));
  for (const x of [-2.7, 2.7]) g.add(mesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 8), y, x, 6.5, 0));
  return g;
}

export function buildFloodlight() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.2, 0.3, 14, 8), mat(0x666670), 0, 7, 0));
  g.add(mesh(new THREE.BoxGeometry(3, 1.8, 0.4), mat(0x444450), 0, 14.5, 0));
  for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) g.add(mesh(new THREE.CircleGeometry(0.35, 12), new THREE.MeshBasicMaterial({ color: 0xfffbe0 }), i * 0.9, 14.1 + j * 0.8, 0.21));
  return g;
}

export function buildFlag(color = 0xf08a1c, label = 'FINISH') {
  const g = new THREE.Group();
  const pole = mat(0xdddddd, { metalness: 0.6 });
  for (const x of [-2, 2]) g.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 5, 8), pole, x, 2.5, 0));
  const banner = sign(label, 4.2, 1.1, { bg: '#1f3fbf', fg: '#ffb000', border: '#ffb000', font: 'bold 80px sans-serif' });
  banner.position.set(0, 4.5, 0.05);
  g.add(banner);
  const back = banner.clone(); back.rotation.y = Math.PI; back.position.z = -0.05; g.add(back);
  return g;
}

export function buildCheckpoint() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 8), mat(0xcccccc, { metalness: 0.6 }), 0, 1.3, 0));
  const cloth = mesh(new THREE.BoxGeometry(1, 0.6, 0.04), mat(0x888888), 0.5, 2.25, 0);
  cloth.name = 'cloth';
  g.add(cloth);
  return g;
}

export function buildTrophy() {
  const g = new THREE.Group();
  const gold = mat(0xffcc33, { metalness: 0.9, roughness: 0.2, emissive: 0x553300, emissiveIntensity: 0.6 });
  g.add(mesh(new THREE.BoxGeometry(0.9, 0.3, 0.9), mat(0x3a2418), 0, 0.15, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.25, 0.6, 10), gold, 0, 0.6, 0));
  const cup = mesh(new THREE.CylinderGeometry(0.55, 0.2, 0.8, 16, 1, true), gold, 0, 1.3, 0);
  cup.material.side = THREE.DoubleSide;
  g.add(cup);
  for (const s of [-1, 1]) g.add(mesh(new THREE.TorusGeometry(0.22, 0.05, 6, 12, Math.PI), gold, s * 0.6, 1.35, 0).rotateZ(-s * Math.PI / 2));
  g.add(mesh(new THREE.SphereGeometry(0.15, 10, 8), gold, 0, 1.85, 0));
  return g;
}

export function buildCoin() {
  const g = new THREE.Group();
  const c = mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.07, 18), mat(0xffc72c, { metalness: 0.8, roughness: 0.25, emissive: 0x442200 }));
  c.rotation.x = Math.PI / 2;
  g.add(c);
  const s = sign('T', 0.36, 0.36, { bg: '#ffc72c', fg: '#1f3fbf', w: 64, h: 64, font: 'bold 56px sans-serif' });
  s.position.z = 0.04; g.add(s);
  const s2 = s.clone(); s2.rotation.y = Math.PI; s2.position.z = -0.04; g.add(s2);
  return g;
}

export function buildCrate() {
  const c = mesh(new THREE.BoxGeometry(1.2, 1.2, 1.2), mat(0xb07a3c));
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(c.geometry), new THREE.LineBasicMaterial({ color: 0x5a3a18 }));
  c.add(edges);
  return c;
}

export function buildHeart() {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.35);
  shape.bezierCurveTo(-0.5, 0, -0.4, 0.35, 0, 0.18);
  shape.bezierCurveTo(0.4, 0.35, 0.5, 0, 0, -0.35);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.15, bevelEnabled: true, bevelSize: 0.04, bevelThickness: 0.04, bevelSegments: 2 });
  geo.center();
  return mesh(geo, mat(0xff3355, { emissive: 0x550011 }));
}
