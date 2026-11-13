// Data-driven level definitions. Platforms are AABBs in the X/Y plane (lane z = 0).
// p(x0, x1, top, thick, style)  → solid platform
import * as M from './models.js';

const p = (x0, x1, top, thick = 1, style = 'stone', extra = {}) => ({ x0, x1, top, bottom: top - thick, style, ...extra });
const mover = (x0, x1, top, ax, ay, speed, style = 'metal') => p(x0, x1, top, 0.5, style, { move: { ax, ay, speed } });
const coinsLine = (x0, x1, y, n) => Array.from({ length: n }, (_, i) => ({ x: x0 + ((x1 - x0) * i) / Math.max(1, n - 1), y }));

export const LEVELS = [
  // ------------------------------------------------------------------ 1
  {
    id: 1,
    name: 'Campus Dash',
    subtitle: 'Sprint past the Quad, the Library and the Dining Hall',
    music: 'campus',
    sky: 0x8fd3ff, fog: [0xbfe6ff, 40, 140], ground: 0x4fae4a, sun: 2.4, hemi: [0xffffff, 0x4a7a3a, 1.1],
    start: { x: 2, y: 0 },
    finishX: 168,
    killY: -12,
    platforms: [
      p(-10, 40, 0, 6, 'grass'),
      p(44, 82, 0, 6, 'grass'),
      p(86, 120, 0, 6, 'grass'),
      p(133, 180, 0, 6, 'grass'),
      // statue plinth hop
      p(25, 28, 1.6, 1.6, 'stone'),
      // library climb to the roof (the hidden sword lives up there)
      p(51, 54, 2.2, 0.6, 'wood'),
      p(55.5, 58.5, 4.2, 0.6, 'wood'),
      p(59.5, 71, 6.5, 0.7, 'roof'),
      // dining hall: food-tray platforms
      p(93, 96, 2, 0.5, 'tray'),
      p(98, 101, 3.6, 0.5, 'tray'),
      p(103, 106, 2, 0.5, 'tray'),
      mover(122, 125, 0.5, 4, 0, 1.1),
      p(140, 143, 2.5, 0.6, 'wood'),
      p(146, 149, 4.2, 0.6, 'wood'),
    ],
    crates: [{ x: 35, y: 0 }, { x: 109, y: 0 }, { x: 110.3, y: 0 }],
    enemies: [
      { type: 'quacker', x: 16, y: 0, range: [10, 22] },
      { type: 'quacker', x: 66, y: 0, range: [48, 80] },
      { type: 'quacker', x: 112, y: 0, range: [100, 118] },
      { type: 'flapper', x: 138, y: 4, range: [134, 152] },
      { type: 'quacker', x: 158, y: 0, range: [150, 164] },
    ],
    pickups: [
      { kind: 'sword', x: 68, y: 7.6 },
      { kind: 'heart', x: 99.5, y: 4.8 },
    ],
    coins: [...coinsLine(6, 14, 1.3, 5), ...coinsLine(52, 57, 5.5, 3), ...coinsLine(61, 66, 7.6, 4), ...coinsLine(41, 43, 2.2, 2), ...coinsLine(93.5, 105.5, 3.3, 6), ...coinsLine(126, 131, 2.5, 4), ...coinsLine(146, 149, 5.4, 3)],
    checkpoints: [{ x: 88 }],
    signs: [
      { x: 6, y: 2.8, text: 'Arrows/WASD move · SPACE jump', w: 6 },
      { x: 18, y: 3.2, text: 'J / Click = BOX!  Stomp ducks too', w: 6.5 },
      { x: 47, y: 3.0, text: 'A sword is rumored on the LIBRARY roof...', w: 7.5 },
    ],
    decor(root, add) {
      add(M.buildClockTower(), 30, 0, -22);
      add(M.buildStatue(), 26.5, 0, -3.6);
      const quad = M.sign('THE QUAD', 3, 0.6, { bg: '#2f6b2a', fg: '#fff' });
      add(quad, 12, 2.4, -1.6);
      for (const x of [3, 9, 15, 33, 38]) add(M.buildTree(2.6 + (x % 3) * 0.4), x, 0, -5 - (x % 4));
      for (const x of [8, 20]) add(M.buildBench(), x, 0, -2.2);
      add(M.buildLibrary(), 64, 0, -4.6);
      add(M.buildDiningHall(), 100, 0, -4.6);
      for (const x of [46, 78, 90, 125, 140, 160]) add(M.buildTree(3), x, 0, -7);
      add(M.buildClockTower(), 115, 0, -30);
    },
  },
  // ------------------------------------------------------------------ 2
  {
    id: 2,
    name: 'Stormy Stadium',
    subtitle: 'Lightning strikes the field — watch for the yellow warning rings!',
    music: 'storm',
    sky: 0x1a2235, fog: [0x26304a, 30, 110], ground: 0x2f7a33, sun: 0.9, hemi: [0x8899cc, 0x223322, 0.7],
    rain: true, lightning: { every: 2.6, warn: 1.0 },
    start: { x: 2, y: 0 },
    finishX: 186,
    killY: -12,
    platforms: [
      p(-10, 34, 0, 6, 'turf'),
      p(39, 70, 0, 6, 'turf'),
      // bleachers staircase
      p(48, 52, 1.2, 1.2, 'bleacher'),
      p(52, 56, 2.4, 2.4, 'bleacher'),
      p(56, 60, 3.6, 3.6, 'bleacher'),
      p(60, 66, 4.8, 4.8, 'bleacher'),
      p(71, 75, 3.2, 0.5, 'metal'),
      mover(80, 83, 3, 0, 2.5, 1.3),
      p(86, 120, 0, 6, 'turf'),
      p(95, 99, 2.4, 0.5, 'metal'),
      p(102, 106, 4.4, 0.5, 'metal'),
      mover(124, 127, 1, 5, 0, 1.4),
      p(136, 150, 0, 6, 'turf'),
      mover(153, 156, 1.5, 0, 3, 1.6),
      p(160, 196, 0, 6, 'turf'),
      p(166, 170, 2.2, 0.5, 'metal'),
    ],
    crates: [{ x: 30, y: 0 }, { x: 112, y: 0 }, { x: 145, y: 0 }],
    enemies: [
      { type: 'quacker', x: 22, y: 0, range: [14, 32] },
      { type: 'football', x: 44, y: 0, range: [40, 47] },
      { type: 'quacker', x: 63, y: 4.8, range: [60.5, 65.5] },
      { type: 'flapper', x: 92, y: 4, range: [87, 110] },
      { type: 'quacker', x: 110, y: 0, range: [100, 119] },
      { type: 'football', x: 142, y: 0, range: [137, 149] },
      { type: 'flapper', x: 172, y: 5, range: [162, 182] },
      { type: 'quacker', x: 178, y: 0, range: [170, 184] },
    ],
    pickups: [
      { kind: 'fireblast', x: 64, y: 6.2 },
      { kind: 'heart', x: 104, y: 5.6 },
    ],
    coins: [...coinsLine(8, 20, 1.3, 6), ...coinsLine(49, 64, 6.4, 6), ...coinsLine(72, 79, 5, 4), ...coinsLine(126, 133, 3, 4), ...coinsLine(166, 170, 3.4, 3)],
    checkpoints: [{ x: 88 }, { x: 138 }],
    signs: [
      { x: 6, y: 2.8, text: 'Yellow ring = lightning incoming. MOVE!', w: 7 },
      { x: 44, y: 3.2, text: 'FIREBLAST up the bleachers →', w: 5.5 },
    ],
    decor(root, add) {
      for (const x of [-4, 40, 90, 140, 190]) add(M.buildFloodlight(), x, 0, -14);
      add(M.buildGoalpost(), 20, 0, -3);
      add(M.buildGoalpost(), 175, 0, -3);
      const board = M.sign('TIGERS 0  -  0 DUCKS', 12, 2.4, { bg: '#111', fg: '#ffb000', w: 1024, h: 200, font: 'bold 120px monospace', border: '#444' });
      add(board, 110, 12, -18);
      // yard lines
      for (let x = 0; x < 190; x += 10) {
        const l = M.sign(String(Math.min(50, Math.abs(((x / 10) % 10) * 10 - 50)) || 50), 1.2, 0.6, { bg: '#2f7a33', fg: '#fff', w: 128, h: 64, font: 'bold 48px sans-serif' });
        l.rotation.x = -Math.PI / 2;
        add(l, x, 0.02, 1.2);
      }
    },
    crowd: true,
  },
  // ------------------------------------------------------------------ 3
  {
    id: 3,
    name: 'The Gauntlet',
    subtitle: 'TWIST: the sprinklers burst — the campus is FLOODING. Climb!',
    music: 'gauntlet',
    sky: 0x6a7fa6, fog: [0x7a8cab, 34, 130], ground: 0x4a8a40, sun: 2.0, hemi: [0xd8e2ff, 0x445544, 1.25],
    rain: true, lightning: { every: 3.4, warn: 1.1 },
    flood: { start: -4, speed: 0.42, catchup: 9 },
    start: { x: 2, y: 0 },
    finishX: 176,
    killY: -12,
    platforms: [
      p(-10, 22, 0, 6, 'grass'),
      p(24, 28, 1.8, 0.6, 'wood'),
      p(30, 36, 3.4, 0.6, 'stone'),
      p(38, 41, 5.2, 0.6, 'wood'),
      mover(43, 46, 5.5, 5, 0, 1.2),
      p(54, 66, 7, 0.7, 'roof'),
      p(68, 71, 8.8, 0.6, 'bleacher'),
      p(72, 75, 10.4, 0.6, 'bleacher'),
      p(76, 86, 12, 0.7, 'stone'),
      mover(88, 91, 12.5, 0, 3.2, 1.1),
      p(93, 100, 15, 0.7, 'brick'),
      p(102, 105, 16.6, 0.6, 'tray'),
      p(107, 110, 18.2, 0.6, 'tray'),
      p(112, 124, 19.5, 0.7, 'roof'),
      mover(126, 129, 20, 4.5, 0, 1.5),
      p(135, 139, 21.6, 0.6, 'metal'),
      p(141, 144, 23.2, 0.6, 'metal'),
      p(146, 152, 24.6, 0.7, 'stone'),
      mover(154, 157, 25, 0, 2.5, 1.3),
      p(160, 185, 27, 1, 'grass'),
    ],
    crates: [{ x: 18, y: 0 }, { x: 62, y: 7 }, { x: 118, y: 19.5 }],
    enemies: [
      { type: 'quacker', x: 12, y: 0, range: [6, 20] },
      { type: 'quacker', x: 34, y: 3.4, range: [30.5, 35.5] },
      { type: 'flapper', x: 50, y: 9, range: [45, 58] },
      { type: 'quacker', x: 60, y: 7, range: [55, 65] },
      { type: 'football', x: 82, y: 12, range: [77, 85] },
      { type: 'quacker', x: 97, y: 15, range: [94, 99.5] },
      { type: 'flapper', x: 116, y: 22, range: [112, 124] },
      { type: 'quacker', x: 120, y: 19.5, range: [113, 123] },
      { type: 'flapper', x: 148, y: 28, range: [140, 156] },
      { type: 'quacker', x: 168, y: 27, range: [162, 172] },
    ],
    pickups: [
      { kind: 'laser', x: 33, y: 4.6 },
      { kind: 'force', x: 81, y: 13.3 },
      { kind: 'heart', x: 108.5, y: 19.4 },
    ],
    coins: [...coinsLine(5, 15, 1.3, 5), ...coinsLine(55, 65, 8.2, 5), ...coinsLine(93, 99, 16.2, 4), ...coinsLine(113, 123, 20.7, 5), ...coinsLine(162, 170, 28.2, 4)],
    checkpoints: [{ x: 58, y: 7 }, { x: 115, y: 19.5 }],
    signs: [
      { x: 6, y: 2.8, text: 'The water is RISING. Keep climbing!', w: 6.5 },
    ],
    decor(root, add) {
      add(M.buildLibrary(), 60, 1, -5);
      add(M.buildStatue(), 14, 0, -3.6);
      add(M.buildDiningHall(), 104, 9, -6);
      add(M.buildClockTower(), 150, 8, -14);
      for (const x of [-2, 40, 80, 130]) add(M.buildFloodlight(), x, 0, -16);
      for (const x of [4, 20]) add(M.buildTree(3), x, 0, -5);
    },
  },
  // ------------------------------------------------------------------ 4
  {
    id: 4,
    name: 'Rivalry Showdown',
    subtitle: 'MALLARD MACK has the Spirit Trophy. Take it back!',
    music: 'boss',
    sky: 0xff8f5a, fog: [0xffb38a, 40, 120], ground: 0x3f8f3a, sun: 2.0, hemi: [0xffe0c0, 0x553322, 1.0],
    start: { x: -12, y: 0 },
    boss: { x: 10, y: 0 },
    arena: [-19, 19],
    killY: -12,
    platforms: [
      p(-26, 26, 0, 6, 'turf'),
      p(-27, -19, 14, 14, 'brick'),
      p(19, 27, 14, 14, 'brick'),
      p(-12, -7, 2.6, 0.5, 'metal'),
      p(7, 12, 2.6, 0.5, 'metal'),
      p(-2.5, 2.5, 5.2, 0.5, 'metal'),
    ],
    crates: [],
    enemies: [],
    pickups: [{ kind: 'heart', x: 0, y: 6.4, respawn: 14 }],
    coins: [],
    checkpoints: [],
    signs: [],
    decor(root, add) {
      add(M.buildGoalpost(), -15, 0, -6);
      add(M.buildGoalpost(), 15, 0, -6);
      const board = M.sign('RIVALRY GAME — TIGERS vs DUCKS', 16, 2, { bg: '#111', fg: '#ff8a1c', w: 1024, h: 128, font: 'bold 64px sans-serif', border: '#ffb000' });
      add(board, 0, 15, -16);
      for (const x of [-24, 24]) add(M.buildFloodlight(), x, 0, -12);
    },
    crowd: true,
  },
];
