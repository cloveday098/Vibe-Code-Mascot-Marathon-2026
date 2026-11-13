// Data-driven level definitions. Platforms are AABBs in the X/Y plane (lane z = 0).
// p(x0, x1, top, thick, style)  → solid platform
import * as M from './models.js';

const p = (x0, x1, top, thick = 1, style = 'stone', extra = {}) => ({ x0, x1, top, bottom: top - thick, style, ...extra });
const mover = (x0, x1, top, ax, ay, speed, style = 'metal') => p(x0, x1, top, 0.5, style, { move: { ax, ay, speed } });
const coinsLine = (x0, x1, y, n) => Array.from({ length: n }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y }));
const suit = (x, range, y = 0) => ({ type: 'suit', x, y, range });
const acm = (x, range, y = 0) => ({ type: 'acm', x, y, range });

export const LEVELS = [
  // ------------------------------------------------------------------ 1
  {
    id: 1,
    name: 'Maryville College',
    subtitle: 'Leap from the Anderson Hall bell tower, stomp the suits and head off campus!',
    music: 'campus',
    koMsg: 'Knocked out by the suits!',
    sky: 0x8fd3ff, fog: [0xbfe6ff, 40, 150], ground: 0x4fae4a, sun: 2.4, hemi: [0xffffff, 0x4a7a3a, 1.1],
    start: { x: 0, y: 14 },
    finishX: 172,
    killY: -12,
    platforms: [
      p(-4, 4, 14, 14, 'brick'), // the bell tower you start on
      p(5.5, 9.5, 10.5, 0.6, 'roof'),
      p(11, 15, 7, 0.6, 'roof'),
      p(-12, 58, 0, 6, 'grass'),
      p(25, 28, 2.2, 0.6, 'wood'),
      // ledges above the Covenant Stone — the hidden sword
      p(46, 49, 2.4, 0.6, 'stone'),
      p(50.5, 54.5, 4.6, 0.6, 'stone'),
      p(62, 92, 0, 6, 'grass'),
      p(70, 74, 2.4, 0.5, 'wood'),
      p(76, 80, 4.2, 0.5, 'wood'),
      mover(94, 97, 0.5, 3.5, 0, 1.2),
      p(102, 140, 0, 6, 'grass'),
      p(116, 120, 2.6, 0.6, 'stone'),
      p(144, 190, 0, 6, 'road'),
    ],
    crates: [{ x: 34, y: 0 }, { x: 108, y: 0 }, { x: 109.3, y: 0 }],
    enemies: [
      suit(20, [17, 32]), suit(38, [33, 44]), suit(56, [44, 57.5]), suit(68, [63, 91]), suit(84, [63, 91]),
      suit(112, [103, 139]), suit(126, [103, 139]), suit(134, [103, 139]), suit(152, [145, 168]), suit(162, [145, 168]),
    ],
    pickups: [
      { kind: 'sword', x: 52.5, y: 5.8 },
      { kind: 'heart', x: 78, y: 5.4 },
    ],
    coins: [...coinsLine(6, 9, 11.8, 3), ...coinsLine(11.5, 14.5, 8.3, 3), ...coinsLine(20, 30, 1.3, 5), ...coinsLine(58.5, 61.5, 2.4, 3), ...coinsLine(70.5, 79.5, 5.5, 5), ...coinsLine(98, 101, 2.4, 3), ...coinsLine(116, 120, 3.8, 3), ...coinsLine(146, 166, 1.3, 6)],
    checkpoints: [{ x: 64 }, { x: 104 }],
    signs: [
      { x: 1.5, y: 16.6, text: 'JUMP! →  Arrows/WASD + SPACE', w: 6.2 },
      { x: 20, y: 3.0, text: 'Stomp the suits!  J = BOX · E = RAY GUN', w: 7.2 },
      { x: 43, y: 3.4, text: 'Something shines above the Covenant Stone…', w: 7.6 },
    ],
    decor(root, add) {
      add(M.buildBellTower(), 0, 0, 0);
      add(M.buildBrickHall(14, 9, 'THAW HALL'), 32, 0, -9);
      add(M.buildCovenantStone(), 51, 0, -3.4);
      add(M.buildBrickHall(16, 8, 'FAYERWEATHER'), 82, 0, -9);
      add(M.buildBrickHall(12, 10), 118, 0, -10);
      for (const x of [18, 26, 40, 60, 70, 90, 100, 112, 130, 138]) add(M.buildTree(2.6 + (x % 3) * 0.5), x, 0, -4 - (x % 3));
      for (const x of [22, 74, 124]) add(M.buildBench(), x, 0, -2.2);
      add(M.buildMCSign(), 160, 0, -2.8);
      add(M.buildRoadSign('LEAVING CAMPUS  →  US-321', 5), 168, 0, -2.2);
    },
  },
  // ------------------------------------------------------------------ 2
  {
    id: 2,
    name: 'Highway to Gatlinburg',
    subtitle: 'Hop on and over the traffic — Tennessee drivers are UNHINGED. Red cars will try to smoosh you!',
    music: 'storm',
    koMsg: 'Run off the road!',
    sky: 0x9ec9ee, fog: [0xa9c3d8, 30, 140], ground: 0x3f7a3a, sun: 2.2, hemi: [0xffffff, 0x3a5a3a, 1.05],
    cars: { every: 2.4, grace: 2.5, max: 7 },
    ambientTraffic: true,
    start: { x: 0, y: 0 },
    finishX: 206,
    killY: -12,
    platforms: [
      p(-12, 118, 0, 6, 'road'),
      p(30, 34, 2.4, 0.5, 'metal'),
      p(52, 55, 2.4, 0.5, 'metal'),
      p(57, 66, 4.6, 0.5, 'metal'), // billboard catwalk (fireblast)
      p(86, 90, 2.6, 0.5, 'metal'),
      mover(119.5, 122.5, 0.3, 2.5, 0, 1.4),
      p(127, 230, 0, 6, 'road'),
      p(150, 154, 2.6, 0.5, 'metal'),
      p(174, 178, 2.6, 0.5, 'metal'),
    ],
    crates: [{ x: 40, y: 0 }, { x: 140, y: 0 }],
    enemies: [suit(22, [12, 28]), suit(100, [92, 116]), suit(186, [180, 200])],
    pickups: [
      { kind: 'fireblast', x: 61.5, y: 5.9 },
      { kind: 'heart', x: 152, y: 3.9 },
    ],
    coins: [...coinsLine(30.5, 33.5, 3.6, 3), ...coinsLine(57.5, 65.5, 5.8, 5), ...coinsLine(86.5, 89.5, 3.8, 3), ...coinsLine(119, 126, 2.6, 4), ...coinsLine(150, 154, 3.8, 3), ...coinsLine(174, 178, 3.8, 3)],
    checkpoints: [{ x: 70 }, { x: 130 }, { x: 170 }],
    signs: [
      { x: 6, y: 3.0, text: 'Cars come at you — JUMP on them or over them!', w: 7.5 },
      { x: 47, y: 3.2, text: 'Fireblast on the billboard catwalk ↑', w: 6.4 },
      { x: 114, y: 3.2, text: 'BRIDGE OUT — ride the lift!', w: 5.5 },
    ],
    decor(root, add) {
      add(M.buildMountains(-40, 260, -70), 0, 0, 0);
      add(M.buildMountains(-30, 250, -45), 0, -4, 0);
      for (let x = -8; x < 220; x += 9) add(M.buildFallTree(2.6 + (x % 4) * 0.4), x + (x % 5), 0, -8 - (x % 3) * 2);
      add(M.buildRoadSign('GATLINBURG  18 mi'), 14, 0, -2.4);
      add(M.buildBillboard('PANCAKES! ALL DAY! EXIT 7'), 61.5, 0, -2.6);
      add(M.buildRoadSign('GATLINBURG  6 mi'), 100, 0, -2.4);
      add(M.buildBillboard('SMOKY MTN MOONSHINE-FLAVORED FUDGE', '#2f6b3a', '#fff3c4'), 162, 0, -2.6);
      add(M.buildRoadSign('WELCOME TO GATLINBURG, TN'), 192, 0, -2.4);
      add(M.buildNeedleTower(), 236, 0, -30);
      add(M.buildHotel(), 216, 0, -8);
    },
  },
  // ------------------------------------------------------------------ 3
  {
    id: 3,
    name: 'ACM Conference',
    subtitle: 'An old hotel, falling projectors & chairs, and ANGRY ACM members. Escape down the elevator shaft!',
    music: 'gauntlet',
    koMsg: 'Out-argued by an angry ACM member!',
    interior: true,
    sky: 0x1a1016, fog: [0x2a1a22, 30, 90], ground: 0x3b2418, sun: 1.3, hemi: [0xffe8cc, 0x332222, 1.25],
    drops: { every: 1.35, warn: 0.9, kinds: ['projector', 'chair'] },
    start: { x: 0, y: 0 },
    finishX: 176,
    shaft: { x0: 170.2, x1: 173.8, y: -3 },
    killY: -14,
    platforms: [
      p(-12, 36, 0, 6, 'carpet'),
      p(36, 46, 1.6, 7.6, 'woodfloor'), // conference stage
      p(46, 60, 0, 6, 'carpet'),
      p(50, 54, 2.8, 0.5, 'marble'),
      p(56, 61, 4.6, 0.5, 'marble'),
      p(63, 80, 3.8, 0.7, 'carpet'), // mezzanine
      p(80, 84, 0, 6, 'carpet'),
      mover(85.5, 88.5, 0.3, 0, 2.2, 1.2, 'marble'), // service lift over the broken floor
      p(90, 126, 0, 6, 'carpet'),
      p(96, 100, 2.6, 0.5, 'marble'),
      p(102, 112, 4.4, 0.6, 'carpet'),
      mover(127.5, 130.5, 0.3, 2.5, 0, 1.4, 'marble'),
      p(134, 170, 0, 6, 'carpet'),
      p(146, 150, 2.6, 0.5, 'marble'),
      p(174, 186, 14, 20, 'marble'), // wall past the shaft
    ],
    crates: [{ x: 30, y: 0 }, { x: 118, y: 0 }],
    enemies: [
      acm(14, [8, 33]), suit(26, [8, 33]), acm(41, [36.5, 45.5], 1.6), acm(70, [63.5, 79.5], 3.8), suit(76, [63.5, 79.5], 3.8),
      acm(95, [91, 125]), acm(108, [102.5, 111.5], 4.4), suit(120, [91, 125]), acm(140, [135, 168]), acm(156, [135, 168]), suit(164, [135, 168]),
    ],
    pickups: [
      { kind: 'laser', x: 41, y: 3.0 },
      { kind: 'force', x: 107, y: 5.8 },
      { kind: 'heart', x: 148, y: 3.9 },
    ],
    coins: [...coinsLine(5, 15, 1.3, 5), ...coinsLine(64, 79, 5.0, 6), ...coinsLine(96, 100, 3.8, 3), ...coinsLine(136, 146, 1.3, 5)],
    checkpoints: [{ x: 48 }, { x: 92 }, { x: 136 }],
    signs: [
      { x: 6, y: 3.0, text: 'WATCH THE CEILING — red rings = falling stuff!', w: 7.8 },
      { x: 33, y: 3.4, text: 'ACM members: stomp them before they rant at you', w: 7.8 },
      { x: 166, y: 3.2, text: 'JUMP DOWN THE SHAFT →', w: 4.6 },
    ],
    decor(root, add) {
      const wall = M.wallpaper(240, 40);
      add(wall, 85, 8, -3.2);
      for (let x = 0; x < 180; x += 22) add(M.buildChandelier(), x + 8, 9, -1.4);
      const banner = M.sign('ACM CONFERENCE · WELCOME, MEMBERS!', 12, 1.4, { bg: '#1f3f8a', fg: '#fff', w: 1536, h: 180, font: 'bold 100px sans-serif', border: '#ffd21f' });
      add(banner, 41, 8.2, -3.1);
      for (const [x, txt] of [[20, 'Slide 1 of 347'], [72, 'Q&A: "More of a comment…"'], [118, 'KEYNOTE: Why My Paper Is Right']]) {
        add(M.sign(txt, 6, 3.4, { bg: '#f8f8ff', fg: '#222', w: 768, h: 430, font: 'bold 52px sans-serif', border: '#333' }), x, 5.8, -3.1);
      }
      for (let x = 6; x < 165; x += 1.4) if ((x > 2 && x < 34) || (x > 92 && x < 124)) add(M.buildChair(), x, 0, -2.3);
      add(M.buildChair(), 140, 0, -2.3);
      const pod = M.buildBrickHall(1.2, 1.4);
      pod.scale.set(1, 1, 0.2);
      add(pod, 44, 1.6, -1.2);
      add(M.buildElevator(), 172, 0, -2.9);
    },
  },
  // ------------------------------------------------------------------ 4
  {
    id: 4,
    name: 'AI Final Boss',
    subtitle: 'THE SINGULARITY has the Spirit Trophy. Its attacks are branded by every AI company. Unplug it!',
    music: 'boss',
    koMsg: 'Deleted by THE SINGULARITY!',
    interior: true,
    sky: 0x070a16, fog: [0x0c1020, 34, 100], ground: 0x101420, sun: 1.8, hemi: [0xaabbff, 0x221830, 1.7],
    start: { x: -14, y: 0 },
    boss: { x: 0, y: 3.6 },
    arena: [-19, 19],
    killY: -12,
    platforms: [
      p(-26, 26, 0, 6, 'tech'),
      p(-27, -19, 16, 16, 'tech'),
      p(19, 27, 16, 16, 'tech'),
      p(-13, -8, 2.6, 0.5, 'metal'),
      p(8, 13, 2.6, 0.5, 'metal'),
      p(-2.5, 2.5, 5.2, 0.5, 'metal'),
    ],
    crates: [],
    enemies: [],
    pickups: [{ kind: 'heart', x: -10.5, y: 3.9, respawn: 12 }, { kind: 'heart', x: 10.5, y: 3.9, respawn: 16 }],
    coins: [],
    checkpoints: [],
    signs: [],
    decor(root, add) {
      for (let x = -24; x <= 24; x += 2.2) add(M.buildServerRack(), x, 0, -6 - (Math.abs(x) % 3));
      const board = M.sign('⚠ THE SINGULARITY ⚠  — SERVER ROOM B', 18, 1.6, { bg: '#050505', fg: '#3affd0', w: 1536, h: 140, font: 'bold 80px monospace', border: '#3affd0' });
      add(board, 0, 15.5, -9);
    },
  },
];
