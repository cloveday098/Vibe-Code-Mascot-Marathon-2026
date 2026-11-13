name: "Mascot Mayhem: The Rivalry Run — 3D three.js platformer (Tiger vs. Duck)"
description: |
  Build an original, fully client-side 3D (2.5D lane) third-person platformer in three.js r160.
  A humanoid tiger boxer fights through four campus levels with a visible 1–5 loadout
  (Ray Gun, Sword, Fireblast, Laser Eyes, The Force) and beats the rival Duck in a boss showdown.
  Must be demoable on localhost with no build step and no Node.js.

---

## Goal

**Feature Goal**: A playable, testable browser game, "Mascot Mayhem: The Rivalry Run". The player controls **Stripes**, a humanoid tiger mascot of **Tigerton University**. Stripes boxes by default, uses a 1–5 loadout of weapons and powers, clears four levels, and defeats **Duke Quackington**, the duck mascot of rival **Quackmire College**, to recover the Spirit Trophy.

**Deliverable**:
- `index.html` plus ES modules in `src/`, using the vendored `vendor/three.module.js` (already present, r160).
- Served with `python3 -m http.server 8080` and played at `http://localhost:8080/`.
- An in-browser self-test harness at `http://localhost:8080/?test=1` and a `scripts/validate.sh` that runs it in headless Chrome.
- A `README.md` with controls and run instructions so another team can try the game.

**Success Definition**:
1. `scripts/validate.sh` prints `PASS` and exits 0.
2. A human at `localhost:8080` can start, finish Level 1 → 4, beat the Duck, and see the WIN screen; and can die (HP/lives to 0) and see the GAME OVER screen with a Retry option.
3. Every core rule and user requirement in the checklist at the bottom is visibly met.

## User Persona

**Target User**: Hackathon judges and other teams who playtest the build in a desktop browser.

**Use Case**: Open the localhost URL, read a one-screen control card, and play the game in 5–10 minutes.

**User Journey**: Title screen → Start (unlocks audio) → L1 Campus Dash → L2 Stormy Stadium → L3 The Gauntlet → L4 Rivalry Showdown → Trophy WIN screen (time, kills, deaths). If the player runs out of lives at any point: GAME OVER → Retry level / Restart.

**Pain Points Addressed**: Judges need clear win and fail feedback, obvious power-up effects, and no install step.

## Why

- Meets the "Mascot Mayhem" challenge: a mascot hero, four levels with their required themes, a power-up that visibly changes abilities, a boss fight, a way to win and a way to fail, and a testable build.
- Adds the user's own requirements: a humanoid boxing tiger, a visible 1–5 loadout, a ray gun with 4 shots that reloads on a kill, a findable sword, and Fireblast, Laser Eyes, and The Force powers.
- **Originality constraint**: all characters, names, art (procedural primitives and canvas textures), and sounds (WebAudio synthesis) are made for this game. Do not use any names, characters, sprites, music, or level layouts from existing games.

## What

### Camera and movement model ("3rd-person side-scroller")
- Gameplay runs on a **2.5D lane**: the hero moves on X (left/right) and Y (jump/fall), with Z locked to 0. The world is fully 3D, with buildings, props, and depth scenery placed at z < 0 and z > 0.
- The camera is a third-person chase camera behind and beside the hero (offset `(-3.5, +3.2, +10.5)`), looking slightly ahead in the facing direction. This gives a 3D third-person look while keeping side-scroller readability (see ai_docs §6).

### Controls (must also appear on the title screen and in the README)
| Action | Keys |
|---|---|
| Move | A/D or ←/→ |
| Jump (variable height: hold to jump higher; coyote time 0.1 s; jump buffer 0.1 s) | Space / W / ↑ |
| Box (always available: jab/cross combo) | J or Left Mouse |
| Use selected loadout slot | K or Right Mouse |
| Select slot | 1 2 3 4 5 (also mouse wheel) |
| Pause | Esc / P |

### Loadout (HUD hotbar bottom-center; 5 slots, always visible)
Locked slots appear greyed with a padlock. The selected slot has a glowing border. Each slot shows its ammo, energy, or cooldown. **The selected item is also visible on the tiger model.**

| Slot | Item | Unlock | Behavior | Visible on hero |
|---|---|---|---|---|
| 1 | **Ray Gun** | Owned from start | Hitscan beam, range 18, 2 damage. **4 shots max.** Each shot uses 1. **Any enemy kill (by any means) refills it to 4/4.** At 0 shots, pressing K plays an empty "click" and the HUD flashes "NO CHARGE — KO an enemy to recharge". It never reloads over time. | Chunky retro ray gun mesh in the right hand, with a green emitter tip that glows brighter with ammo |
| 2 | **Sword** ("Stripe Saber") | Pickup **hidden on the Library roof in L1**, reached via stacked book platforms | Melee arc, reach 2.6, 3 damage, 0.45 s cooldown, hits every enemy in the arc, deflects projectiles | Blade mesh in the right hand with a swing trail |
| 3 | **Fireblast** | Pickup in L2 (under the scoreboard, mid-level) | Fireball projectile, speed 14, 3 damage plus a 2.0 radius splash, 1.2 s cooldown | Fists wreathed in orange particle flames |
| 4 | **Laser Eyes** | Pickup in L3 (first third) | Hold K: continuous beam from the eyes, 6 damage/s, drains energy (100 → 0 in 3 s), recharges 25/s when not firing | Eyes glow red (emissive) and a red beam comes from the eyes |
| 5 | **The Force** | Pickup in L3 (last third, before the exit) | Radial shockwave, radius 6. Knocks enemies back (impulse 14), deals 1 damage, destroys enemy projectiles, pushes pushable crates. 4 s cooldown | Purple aura on the hands, plus an expanding purple ring |

Picking up an item auto-selects it, shows a banner (e.g. "SWORD ACQUIRED — press 2"), plays a jingle, and adds a short spin animation. **Persistence**: unlocked items carry over between levels. If the player jumps to a level with `?level=N`, all items found before that level are granted automatically.

Boxing (J) is always available whatever slot is selected. A jab/cross alternates, with reach 1.4, 1 damage, 0.28 s cooldown, and small knockback. The tiger wears red boxing gloves; the right glove is hidden while the gun or sword is held.

### Player stats and fail/win rules
- HP: 5 hearts. Contact or projectile damage costs 1 heart, followed by 1.0 s of invulnerability (the model blinks).
- Lives: 3. A pit fall or HP reaching 0 costs a life and respawns the player at the last checkpoint (a flag post touched in the level) with full HP.
- Lives reaching 0 shows the **GAME OVER** overlay ("The Ducks took the trophy…") with **Retry Level** (lives reset to 3, keeps items found before this level) and **Main Menu**.
- Each level ends at a goal: a **Tigerton banner gate** in L1–L3 that shows a "LEVEL CLEAR" card, then loads the next level. In L4, the boss's defeat drops the **Spirit Trophy**, and touching it shows the **VICTORY** overlay with total time, KOs, and deaths, plus Play Again.
- Feedback: screen shake on taking damage, red vignette flash, hurt sfx, heart HUD, floating damage numbers on enemies, and a boss HP bar.

### Characters
- **Stripes (hero, humanoid tiger)**: built from primitives with joint pivots (see ai_docs §4).
  - Body: torso, head with muzzle, ears, whiskers, and an orange striped CanvasTexture.
  - Limbs: two arms (shoulder and elbow pivots) with red boxing gloves, two legs (hip and knee pivots) with sneakers, a jersey with a "T" crest, and a curved tail made of segments that sway.
  - Procedural animation states: `idle` (breathing bob, tail sway), `run`, `jump`/`fall`, `jab`, `cross`, `shoot`, `swing`, `cast` (Force/Fireblast), `hurt`, `victory`.
  - Height is about 1.8 units.
- **Duck minions, "Quackers"** (Quackmire College): squat waddling ducks in green/yellow jerseys, 3 HP. Types:
  - `walker`: patrols between two x bounds and turns at edges.
  - `hopper`: hops periodically.
  - `thrower`: lobs bread-roll projectiles at the player within range 10, every 2 s.

  Contact damages the player. On death they poof into feathers, drop a sound, and **refill the Ray Gun**.
- **Boss, Duke Quackington**: a large humanoid duck (about 3.5 units tall) with a top hat, monocle, cape, and Quackmire green, 40 HP. Three phases by HP:
  - **P1 (40–27)**: waddle-charge dash across the arena (telegraphed by 0.6 s of quacking and dust), then a wing slap.
  - **P2 (26–14)**: adds lobbed egg bombs (3 arcs, with ground warning circles) and jumps to the side platforms.
  - **P3 (≤13)**: turns red-tinted and enraged, fires feather volleys (5-spread straight projectiles that The Force can destroy and the Sword can deflect), and moves faster.

  The boss is stunned for 1.5 s after crashing into an arena wall at the end of a charge, which is a reward window for the player. A boss HP bar sits at the top center with the name. A defeat animation plays (spins, falls, and lets out a "QUAAACK" with a pitch drop), then the trophy descends.

### Levels (data-driven in `src/levels/*.js`; each length is roughly 140–220 units along X)
1. **L1 — Campus Dash** (sunny day, quad lawn)
   - Beginning: the Tigerton gate arch with a "TIGERTON UNIVERSITY" sign.
   - Middle: **the Quad** (lawn, benches, trees), **the Tiger Mascot Statue** (a stone-grey scaled copy of the hero model on a plinth with a plaque), and **the Library** (a big brick building with columns and a "LIBRARY" sign). Stacked giant books form platforms up to the roof, where the **Sword** sits. **The Dining Hall** follows, with a "DINING HALL" sign and tray-stack platforms.
   - Hazards: gaps or pits, walker and hopper Quackers. One checkpoint.
   - Finish: a banner gate.
2. **L2 — Stormy Stadium** (themed challenge: a stormy sports field at night under stadium lights)
   - Rain particles and a dark fog.
   - **New obstacles**:
     - Lightning strikes: a yellow warning circle on the ground for 1.0 s, then a bolt that does 1 damage within radius 1.2, with a flash and thunder.
     - Wind gusts: periodic horizontal force zones with visible streaks and a HUD wind arrow.
     - Moving bleacher platforms: horizontal and vertical movers.
     - Slippery mud zones: lower friction.
   - Thrower Quackers appear.
   - **Fireblast** pickup under the scoreboard.
   - Finish: a goalpost gate.
3. **L3 — The Gauntlet** (combines L1 and L2: pits, books and trays, moving platforms, lightning, wind, all three minion types)
   - **New twist: the "Pond Surge"**, a rising wall of duck-pond water that chases from the left at an auto-scroll pace (starts at x = −10, speed 2.2 u/s, accelerating 0.02 u/s²). Touching it costs a life. A HUD meter shows the distance to the surge.
   - Laser Eyes pickup early; The Force pickup late.
   - One checkpoint. Respawning resets the surge to 20 units behind the checkpoint.
   - Finish: a gate.
4. **L4 — Rivalry Showdown** (Quackmire Pond Arena at dusk: a closed arena about 40 wide with two side platforms and a water backdrop)
   - Intro card: "DUKE QUACKINGTON wants your trophy!"
   - Boss fight, then the trophy, then VICTORY.

Each level shows a start card (`LEVEL n — Name` plus a one-line objective) for 2 s and has a progress bar (hero x / goal x) in the HUD.

### Success Criteria
- [ ] Runs from `python3 -m http.server 8080` with no console errors in Chrome and Firefox
- [ ] 4 levels with correct themes; L1 shows at least 2 campus landmarks (it has 4: Quad, Statue, Library, Dining Hall)
- [ ] Humanoid tiger boxes with J; HUD 1–5 loadout is always visible
- [ ] Ray Gun: 4 shots max, never refills except on a kill, refills to 4 on any kill (unit-tested)
- [ ] Sword hidden on the Library roof in L1; Fireblast in L2; Laser Eyes and The Force in L3
- [ ] Each power-up visibly changes the hero model and adds a new ability
- [ ] Boss fight with 3 phases and an HP bar; the win screen appears after collecting the trophy
- [ ] Fail state: hearts → lives → GAME OVER with Retry
- [ ] `?test=1` self-test passes headless; `scripts/validate.sh` exits 0
- [ ] Steady 60 fps on a mid laptop (draw calls < 300; shared geometries and materials)

## All Needed Context

### Context Completeness Check
The project folder is empty apart from `vendor/three.module.js` and `.claude/` tooling, which is unrelated to the game; ignore `.claude/`. There are no existing conventions to follow, so the conventions defined in this PRP are the standard. Everything needed is below, together with `PRPs/ai_docs/threejs_r160_game_patterns.md`.

### Documentation & References

```yaml
- docfile: PRPs/ai_docs/threejs_r160_game_patterns.md
  why: Verified r160 API usage — import map, fixed-step loop, pivot-based procedural humanoid,
       2.5D AABB collision, chase camera, raycast beams, particles, disposal, WebAudio sfx,
       headless-chrome verification command, r160 gotchas (color space, light intensities).
  critical: Read FULLY before writing code. §5 (collision) and §12 (gotchas) prevent the most common bugs.

- url: https://threejs.org/examples/#games_fps
  why: Fixed sub-step physics loop, dt clamp, onFloor flag, pooled projectile spheres.
  critical: Clamp dt with Math.min(0.05, ...) — otherwise tab-switch tunnels the player through floors.

- url: https://threejs.org/examples/#webgl_animation_skinning_blending
  why: Concept of per-state animation weights/crossfades; we reproduce it procedurally (lerp joint targets).

- url: https://threejs.org/examples/#misc_controls_pointerlock
  why: keydown/keyup → boolean map pattern; velocity damping.

- url: https://threejs.org/examples/#webgl_lights_hemisphere
  why: Hemisphere + directional light with shadows, fog — outdoor campus look.

- url: https://threejs.org/examples/#webgl_points_dynamic
  why: Dynamic Points buffers for rain, fire, feathers.

- url: https://threejs.org/examples/#webgl_instancing_dynamic
  why: InstancedMesh for repeated props (books, seats, rain streaks) to keep draw calls low.

- url: https://threejs.org/docs/#api/en/math/Box3
  why: AABB for hurtboxes/hitboxes; intersectsBox.
- url: https://threejs.org/docs/#api/en/math/Ray
  why: Ray.intersectBox for hitscan Ray Gun / Laser Eyes without needing a scene (testable).
- url: https://threejs.org/docs/#api/en/textures/CanvasTexture
  why: Stripe texture, building signs ("LIBRARY", "DINING HALL"), plaque text.
- url: https://threejs.org/manual/#en/cleanup
  why: Dispose levelRoot on level swap.
- url: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API
  why: Synth sfx; AudioContext must be created/resumed on user gesture.
- url: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap
  why: Import map for bare 'three' specifier without a bundler.
```

### Current Codebase tree
```bash
hackathonGam/
├── .claude/                 # editor tooling — IGNORE, do not modify
├── PRPs/
│   ├── ai_docs/threejs_r160_game_patterns.md
│   └── mascot-mayhem-rivalry-run.md   # this file
└── vendor/
    └── three.module.js      # three.js r160 (verified REVISION '160'), 1.27 MB
```
Not a git repo. No Node.js (`node: command not found`). Available: `python3` 3.14, `google-chrome` (headless WebGL verified), `firefox`.

### Desired Codebase tree
```bash
hackathonGam/
├── index.html               # canvas container, HUD/overlay DOM, importmap, <script type=module src=src/main.js>
├── styles.css               # HUD, hotbar, overlays, banners (no external fonts required)
├── README.md                # how to run, controls, levels, items, test instructions
├── scripts/
│   └── validate.sh          # starts server, runs headless chrome ?test=1, greps PASS, kills server
├── vendor/three.module.js
└── src/
    ├── main.js              # bootstrap: parse URL params (?level, ?test, ?god), create Game or run tests
    ├── config.js            # ALL tuning constants (speeds, gravity, damage, cooldowns, ammo=4, etc.)
    ├── core/
    │   ├── Game.js          # state machine: TITLE, LEVEL_INTRO, PLAYING, PAUSED, LEVEL_CLEAR, GAME_OVER, VICTORY; fixed-step loop
    │   ├── Input.js         # keyboard+mouse → actions; edge-triggered pressed() and held(); wheel slot cycling
    │   ├── Physics.js       # pure functions: aabbOverlap, moveAndCollide(body, solids, dt) → {onGround, hitWall}
    │   ├── CameraRig.js     # chase camera + screen shake
    │   ├── Audio.js         # WebAudio synth sfx bank (punch, jump, shoot, empty, sword, fire, laser, force, hurt, quack, thunder, pickup, win, lose)
    │   ├── Particles.js     # pooled Points systems: feathers, fire, sparks, rain, force ring
    │   └── HUD.js           # DOM HUD: hearts, lives, hotbar 1–5, ammo/energy/cooldowns, progress, boss bar, banners, overlays
    ├── entities/
    │   ├── TigerModel.js    # procedural humanoid tiger mesh + pose animation (no gameplay logic)
    │   ├── Player.js        # player controller: movement, jump, combat, invuln, uses Loadout
    │   ├── Loadout.js       # PURE logic: slots, unlocks, selection, ray gun ammo rules, cooldowns, energy
    │   ├── weapons.js       # per-item use() implementations (spawn projectile, beam, arc, shockwave)
    │   ├── Projectile.js    # pooled projectiles (player fireball, bread roll, egg bomb, feather)
    │   ├── DuckModel.js     # procedural duck (minion scale + boss scale/accessories)
    │   ├── Enemy.js         # Quacker minions: walker, hopper, thrower
    │   ├── Boss.js          # Duke Quackington state machine (phases, attacks, telegraphs, stun)
    │   └── Pickup.js        # spinning floating item pickups + heart pickups
    ├── world/
    │   ├── LevelBuilder.js  # turns level data → meshes, solids, hazards, enemies, pickups, checkpoints, goal
    │   ├── props.js         # building/prop factories: gateArch, library, statue, diningHall, bench, tree, books, trays, bleachers, goalpost, scoreboard, sign(canvas text)
    │   └── hazards.js       # Pit (kill plane), LightningStrike, WindZone, MudZone, PondSurge, MovingPlatform
    ├── levels/
    │   ├── index.js         # export const LEVELS = [level1, level2, level3, level4]
    │   ├── level1_campus.js
    │   ├── level2_stadium.js
    │   ├── level3_gauntlet.js
    │   └── level4_showdown.js
    └── tests/
        └── selftest.js      # runs in-browser; pure-logic + build smoke tests; writes document.body.dataset.test
```

### Known Gotchas & Library Quirks
```js
// CRITICAL: ES modules + importmap require HTTP — file:// will fail with CORS errors. Always python3 -m http.server.
// CRITICAL: relative imports need explicit ".js" extensions (no bundler resolution).
// CRITICAL: r160 uses physically-correct lighting by default; PointLight/SpotLight need intensity ~20–100.
//           HemisphereLight ~1.0–2.0, DirectionalLight ~2.0–3.0 look right.
// CRITICAL: canvas color textures need texture.colorSpace = THREE.SRGBColorSpace.
// CRITICAL: AudioContext must be created/resumed inside the Start button click handler.
// CRITICAL: Ray gun "reloads on a kill" — implement as Loadout.onEnemyKilled() → rayAmmo = 4,
//           called from ONE place (Enemy/Boss death handler), regardless of what weapon caused the kill.
//           Boss damage does NOT refill; only kills. Boss defeat is a kill (refill is harmless then).
// GOTCHA: key repeat — ignore e.repeat for edge actions. preventDefault on Space/arrows; contextmenu
//         preventDefault on the canvas so right-click works as "use".
// GOTCHA: Shadow camera must follow the player in long levels (move light + light.target together).
// GOTCHA: Dispose levelRoot on level swap (ai_docs §9) — otherwise GPU memory grows each retry.
// GOTCHA: Never allocate Vector3/Box3 per frame in hot loops — keep module-level scratch objects.
// GOTCHA: Pond Surge must reset on respawn, or the player respawns inside it (instant death loop).
// GOTCHA: Hit-stop/invulnerability: give enemies a per-attack "hitId" so one sword swing doesn't hit the same enemy every substep.
// GOTCHA: headless test must not depend on user gesture/audio; Audio.js must no-op if ctx is null.
// GOTCHA: --virtual-time-budget runs rAF, but tests should run directly after module load (no waiting on rAF).
```

## Implementation Blueprint

### Data models and structure

```js
// src/config.js — single source of tuning truth (tests import these)
export const CFG = {
  gravity: -32, moveSpeed: 8, accel: 60, airAccel: 35, friction: 50, mudFriction: 8,
  jumpVel: 13, jumpCutMultiplier: 0.45, coyoteTime: 0.1, jumpBuffer: 0.1, maxFall: -28,
  player: { hw: 0.4, h: 1.8, maxHp: 5, lives: 3, invuln: 1.0 },
  punch: { reach: 1.4, dmg: 1, cd: 0.28, knock: 6 },
  rayGun: { maxAmmo: 4, dmg: 2, range: 18, cd: 0.25 },
  sword: { reach: 2.6, dmg: 3, cd: 0.45 },
  fireblast: { speed: 14, dmg: 3, splash: 2.0, cd: 1.2 },
  laser: { dps: 6, energyMax: 100, drain: 33.4, recharge: 25, range: 16 },
  force: { radius: 6, impulse: 14, dmg: 1, cd: 4 },
  enemy: { hp: 3, walkSpeed: 2, contactDmg: 1, throwRange: 10, throwCd: 2 },
  boss: { hp: 40, phase2: 26, phase3: 13, chargeSpeed: 14, stun: 1.5 },
  surge: { startX: -10, speed: 2.2, accel: 0.02, respawnGap: 20 },
};

// src/entities/Loadout.js — PURE (no THREE import) so it is unit-testable
export const SLOTS = ['raygun', 'sword', 'fireblast', 'laser', 'force'];
export class Loadout {
  constructor(unlocked = ['raygun']) {
    this.unlocked = new Set(unlocked); this.selected = 0;
    this.rayAmmo = CFG.rayGun.maxAmmo; this.laserEnergy = CFG.laser.energyMax;
    this.cooldowns = { raygun: 0, sword: 0, fireblast: 0, force: 0 };
  }
  select(i)              // only if unlocked; returns bool
  unlock(id)             // adds + auto-selects; returns slot index
  canUse(id)             // unlocked && cooldown<=0 && (raygun ? rayAmmo>0 : laser ? energy>0 : true)
  consume(id)            // raygun: rayAmmo-- ; sets cooldown
  onEnemyKilled()        // rayAmmo = maxAmmo  (THE reload rule)
  tick(dt, laserFiring)  // cooldowns down; laser drain/recharge clamped [0,max]
  serialize()/static from(obj) // carry unlocks across levels
}

// Level data shape (src/levels/level1_campus.js)
export default {
  id: 1, name: 'Campus Dash', objective: 'Dash across campus — find the hidden sword!',
  theme: { sky: 0x8fd3ff, fog: [0x8fd3ff, 40, 140], ground: 0x4caf50, timeOfDay: 'day', rain: false },
  spawn: { x: 0, y: 1 },
  goalX: 190,
  solids: [ { x: -5, y: -1, w: 40, h: 2, kind: 'grass' }, /* {x,y = bottom-left? NO: use center x, top y} */ ],
  movers: [ { x, y, w, h, axis: 'x'|'y', range: 4, speed: 1.2, kind: 'bleacher' } ],
  props: [ { type: 'gateArch', x: 2 }, { type: 'statue', x: 30 }, { type: 'library', x: 60 }, ... ],
  enemies: [ { type: 'walker', x: 22, minX: 18, maxX: 28 }, ... ],
  pickups: [ { item: 'sword', x: 64, y: 14 }, { item: 'heart', x: 110, y: 2 } ],
  checkpoints: [ 95 ],
  hazards: [ { type: 'lightning', x0: 20, x1: 160, interval: 2.5 }, { type: 'wind', x0, x1, force, period } ],
  surge: null, boss: null,
};
```
**Solid convention (state it in LevelBuilder and use it everywhere): `{ x, y, w, h }`, where `x` is the LEFT edge and `y` is the TOP surface (the solid occupies `[x, x+w] × [y-h, y]`).** Pits are simply gaps in the solids. Falling below `y < -12` costs a life.

### Implementation Tasks (ordered by dependencies)

```yaml
Task 1: CREATE index.html + styles.css
  - importmap {"three": "./vendor/three.module.js"}; <div id="app"> canvas host; HUD DOM skeleton:
    #hearts, #lives, #hotbar (5 .slot children with data-slot, key label, icon (emoji/CSS), meter), #progress,
    #bossbar (hidden), #banner, #overlay (title / pause / level-clear / game-over / victory panels).
  - Title panel: game title, short story line, controls table, [START] button.
  - Hotbar: locked = grayscale + 🔒; selected = glowing gold border; ammo pips (4 dots) under slot 1.
  - NAMING: kebab-case CSS ids/classes; no external fonts/CDNs (offline-safe).

Task 2: CREATE src/config.js (data model above) and src/core/Input.js
  - Input: held(action), pressed(action) (edge, cleared at end of frame), mouse buttons, wheel delta, digit1–5.
  - preventDefault for Space/Arrows; canvas contextmenu disabled.

Task 3: CREATE src/core/Physics.js (PURE, no THREE)
  - aabbOverlap(a,b), moveAndCollide(body{x,y,vx,vy,hw,h}, solids, dt) → {onGround, groundRef, hitWallDir, hitCeiling}
    using axis-separated resolution (ai_docs §5). body.x is center-x, body.y is FEET y.
  - solidBounds(s) helper honoring the solid convention.

Task 4: CREATE src/entities/Loadout.js (PURE) — exactly per data model; this is the most-tested module.

Task 5: CREATE src/tests/selftest.js EARLY (TDD) — tests for Physics + Loadout first, extended later:
  - raygun: starts 4; 4 consumes → 0; canUse false at 0; tick(10s) still 0 (no passive reload);
    onEnemyKilled → 4; never exceeds 4.
  - select locked slot returns false; unlock('sword') selects slot index 1.
  - laser drains to 0 and recharges; cooldowns decrease.
  - physics: body falling onto solid lands with onGround and y == top; walking into wall stops; gap → falls.
  - Output: document.body.dataset.test = 'PASS n/n' or 'FAIL: <names>'; also console.log each result and
    render a simple results <pre> in the page.

Task 6: CREATE src/core/Audio.js — synth bank (ai_docs §10). init() on Start click; every play fn no-ops if no ctx.
  - Distinct original sounds: punch (noise thud + low sine), jump (square slide up), ray (saw slide down 1200→200),
    empty click, sword (filtered noise swoosh), fire (noise + lowpass sweep), laser (sustained sawtooth with vibrato —
    start/stop handle), force (sine 80Hz boom + ring), hurt, quack (two-formant square slide 600→350 w/ bandpass),
    thunder, pickup jingle (arpeggio C-E-G-C), level clear fanfare, game over (descending minor), victory fanfare.

Task 7: CREATE src/entities/TigerModel.js
  - Procedural humanoid per What/Characters; joints exposed: hips, torso, head, shoulderL/R, elbowL/R, hipL/R, kneeL/R, tail[].
  - Attachments (hidden by default, toggled by setEquipped(id)): rayGunMesh (right hand), swordMesh (right hand),
    fireFists (particle emitters at gloves), laserEyes (emissive eye materials + beam mesh), forceAura (purple glowing torus on hands).
  - pose(state, t, dt, facing) — lerped target rotations (ai_docs §4). Expose setTint(color,amount) for statue (grey) reuse & hurt blink.
  - Export createTiger({ statue:false }) so L1 statue reuses the same model with stone material.

Task 8: CREATE src/entities/DuckModel.js
  - createDuck({ scale, boss }) — body ellipsoid, head sphere, orange bill (flattened box/cone), webbed feet, wings (pivots),
    jersey color Quackmire green #1f7a3a / yellow #f2c500. boss=true adds top hat, monocle (torus), cape (plane w/ sway), crown-free.
  - Wing pivots and waddle animation (body roll ±0.15 at walk freq).

Task 9: CREATE src/core/Particles.js and src/entities/Projectile.js (pooled)
  - Particles: emit(type, pos, count, opts); types: feathers (white/yellow), fire, sparks, dust, rain (persistent field following camera), forceRing (expanding torus mesh).
  - Projectile pool: kinds fireball (player, gravity 0), bread (enemy, arc), egg (boss, arc, explodes w/ radius 1.5), feather (boss, straight).
    Each has owner ('player'|'enemy'), dmg, Box3, deflectable flag.

Task 10: CREATE src/entities/weapons.js
  - use(id, ctx) where ctx = { player, enemies, boss, projectiles, particles, audio, loadout }.
  - raygun: Ray from right-hand muzzle along facing (z=0 plane), find nearest enemy Box3 via Ray.intersectBox within range;
    draw beam mesh 0.12 s; spark at hit; damage. Calls loadout.consume. If !canUse && ammo==0 → audio.empty + HUD flash.
  - sword: arc hitbox in front (Box3 from player x to x+facing*reach, y..y+1.8); unique hitId; deflect enemy projectiles in box (reverse vx, owner→player).
  - fireblast: spawn fireball projectile; on hit/solid → splash damage + fire particles.
  - laser: while held & energy>0 → beam from eye positions, damage dps*dt to first hit; audio laser start/stop.
  - force: all enemies within radius → knockback away + dmg; destroy enemy projectiles in radius; forceRing particle; camera shake.
  - punch (not a slot): alternate jab/cross pose; hitbox reach 1.4.

Task 11: CREATE src/entities/Player.js
  - State: x,y,vx,vy,facing,onGround,hp,lives,invuln,coyote,jumpBuffer,anim state, loadout (Loadout instance), model (TigerModel).
  - update(dt, input, world): horizontal accel/friction (mud zones lower friction, wind adds force), variable jump,
    moveAndCollide, ride movers, pit check, actions: J punch, K use selected (held for laser), digits/wheel select →
    model.setEquipped(loadout selected id).
  - damage(n, fromX): skip if invuln/god; knockback; hp--; at 0 → world.loseLife().

Task 12: CREATE src/entities/Enemy.js, src/entities/Pickup.js
  - Enemy types per What. takeDamage(n, knockX, hitId). On hp<=0: die() → particles feathers, audio quack-poof,
    world.onEnemyKilled() which calls player.loadout.onEnemyKilled() + kills counter. (single call site!)
  - Pickup: floating spin + bob, glow ring, label sprite; on touch: item → loadout.unlock + model.setEquipped + banner + jingle;
    'heart' → hp+1 (cap).

Task 13: CREATE src/world/props.js, src/world/hazards.js, src/world/LevelBuilder.js
  - props: factories returning Groups; makeSign(text, w, h, bg, fg) via CanvasTexture.
    library (brick facade w/ columns + "LIBRARY" sign + roof whose top is a SOLID returned via props' `solids` output),
    statue (createTiger({statue:true}) on plinth + "STRIPES — EST. 1890" plaque), diningHall ("DINING HALL" sign, awning),
    gateArch (two pillars + "TIGERTON UNIVERSITY" sign), quad trees/benches (InstancedMesh ok), bleachers, goalpost,
    scoreboard ("HOME 0 — QUACK 7" sign), bannerGate (goal, orange/black flag), checkpoint flag (turns orange when touched).
  - hazards: LightningStrike (warning decal circle → bolt mesh + flash light + damage check), WindZone (force + streak particles + HUD arrow),
    MudZone (brown decal, friction flag), PondSurge (big translucent blue box wall + foam particles, x advances; kill if player.x - hw < surgeX),
    MovingPlatform (solid record mutated each tick, stores dx/dy for riders).
  - LevelBuilder.build(levelData, scene) → { root, solids, movers, hazards, enemies, pickups, checkpoints, goal, boss, theme }.
    Sets scene.background/fog, lights (hemi + directional w/ shadows following player), ground visuals for solids
    (material per kind: grass, stone, book, tray, bleacher, turf, mud).

Task 14: CREATE src/levels/level1..4 + index.js
  - Hand-author layouts per What/Levels. MUST be beatable: max jump height ≈ jumpVel²/(2|g|) = 169/64 ≈ 2.64 units
    → keep step-ups ≤ 2.2; max gap at full speed ≈ moveSpeed * airtime(≈0.81s) ≈ 6.5 → keep gaps ≤ 4.5.
  - L1 Sword route: book stack steps at heights 2,4,6,8 leading to library roof at y≈10 where sword pickup sits; optional (level passable without it).
  - L4 arena: floor 0..40, walls at x=0 and x=40 (solids), side platforms at y=4 (x 4–10 and 30–36).
  - selftest validates every level: spawn above a solid, goalX > spawn, every step-up between consecutive reachable solids ≤ 2.6
    and every horizontal gap ≤ 6 (simple sequential check over solids sorted by x along the critical path flagged `path:true`).

Task 15: CREATE src/entities/Boss.js
  - States: INTRO, IDLE, TELEGRAPH_CHARGE, CHARGE, STUNNED, WING_SLAP, LOB_EGGS, HOP_PLATFORM, FEATHER_VOLLEY, HURT, DEFEATED.
    Phase picks attack pool by HP thresholds (CFG.boss). Telegraphs ≥0.6 s with visual (quack bubbles/dust/warning circles).
  - takeDamage → flash white, HP bar update; 0 HP → DEFEATED sequence → world.onEnemyKilled() → spawn trophy pickup (golden cup w/ "SPIRIT" plate).

Task 16: CREATE src/core/CameraRig.js, src/core/HUD.js
  - CameraRig per ai_docs §6, shake(amount, dur), clamp camera.x within level bounds.
  - HUD.update(state): hearts, lives, hotbar (locked/selected/ammo pips/energy bar/cooldown sweep), progress or surge distance,
    boss bar, banners (queue, 2 s), overlays with buttons wired to Game callbacks.

Task 17: CREATE src/core/Game.js + src/main.js
  - Game: renderer (antialias, shadowMap PCFSoft, setPixelRatio(min(devicePixelRatio,2))), scene, camera, resize handler,
    state machine, loadLevel(i) (dispose old root ai_docs §9, build new, place player at spawn, carry loadout),
    fixed-step update (ai_docs §3), world API {onEnemyKilled, loseLife, checkpoint, damagePlayer, shake}, stats (time, KOs, deaths).
  - Level item grants for ?level=N: L2+ sword, L3+ sword+fireblast, L4 all five.
  - main.js: params → ?test=1 → import('./tests/selftest.js').then(run); else new Game({ startLevel, god }).
  - Expose window.__game for manual debugging.

Task 18: EXTEND src/tests/selftest.js — integration smoke
  - For each level: LevelBuilder.build into a throwaway Scene (no renderer needed) → assert counts
    (L1 props include library+statue+diningHall+quad; L1 has sword pickup; L2 fireblast; L3 laser+force + surge; L4 boss).
  - Simulate: player Loadout kills enemy via Enemy.takeDamage(99) → rayAmmo restored to 4.
  - Boss phases: set hp to 20 → phase 2; 10 → phase 3.
  - Create one WebGLRenderer and render one frame of L1 (catches shader/material errors) — wrap in try/catch, report.

Task 19: CREATE scripts/validate.sh + README.md
  - validate.sh (bash, set -euo pipefail): start `python3 -m http.server 8080` in background (trap kill on EXIT),
    sleep 1, run headless chrome command (ai_docs §11) on /?test=1, grep data-test, exit 0 only if starts with PASS.
  - README: title, story, how to run (python3 -m http.server 8080 → http://localhost:8080), controls, items & where found,
    levels, win/fail rules, debug params (?level=1..4, ?god=1, ?test=1), originality note.
```

### Implementation Patterns & Key Details

```js
// Single kill funnel — guarantees "ray gun reloads on a kill"
// world.onEnemyKilled is the ONLY place that touches rayAmmo refill.
onEnemyKilled(enemy) {
  this.stats.kos++;
  this.player.loadout.onEnemyKilled();     // rayAmmo = 4
  this.hud.flashSlot(0, 'RECHARGED');
  this.audio.recharge();
}

// Variable jump (hold to go higher)
if (input.pressed('jump')) this.jumpBuffer = CFG.jumpBuffer;
if (this.jumpBuffer > 0 && this.coyote > 0) { this.vy = CFG.jumpVel; this.jumpBuffer = 0; this.coyote = 0; audio.jump(); }
if (!input.held('jump') && this.vy > 0) this.vy *= CFG.jumpCutMultiplier ** (dt * 60); // smooth cut

// Visible loadout on model
setEquipped(id) {
  this.rayGun.visible = id === 'raygun';
  this.sword.visible  = id === 'sword';
  this.gloveR.visible = !(id === 'raygun' || id === 'sword');
  this.fireFx.active  = id === 'fireblast';
  this.eyeMat.emissiveIntensity = id === 'laser' ? 3 : 0;
  this.forceAura.visible = id === 'force';
}
```

### Integration Points
```yaml
URL_PARAMS:
  - "?level=1..4": start at level, auto-grant prior items
  - "?god=1": no damage (for demo/judging)
  - "?test=1": run selftest instead of game
SERVE:
  - "python3 -m http.server 8080" from project root
HEADLESS:
  - google-chrome flags verified: --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader
```

## Validation Loop

### Level 1: Syntax & Load
```bash
cd /home/printer/Desktop/hackathonGam
python3 -m http.server 8080 &   # leave running during dev
# Any JS syntax/import error makes the module graph fail → selftest never writes PASS.
google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader \
  --enable-logging=stderr --v=0 --virtual-time-budget=8000 --dump-dom "http://localhost:8080/?test=1" \
  2> /tmp/chrome.log | grep -o 'data-test="[^"]*"'
grep -i "Uncaught\|SyntaxError\|TypeError" /tmp/chrome.log || echo "no console errors"
```

### Level 2: Unit / self tests
```bash
bash scripts/validate.sh     # expected: "PASS N/N" and exit code 0
```

### Level 3: Integration (game boots and renders headless)
```bash
google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader \
  --virtual-time-budget=6000 --window-size=1280,720 --screenshot=/tmp/l1.png "http://localhost:8080/?level=1&autostart=1"
google-chrome ... --screenshot=/tmp/l4.png "http://localhost:8080/?level=4&autostart=1"
# Inspect screenshots: tiger visible, HUD hotbar 1–5 visible, L4 shows duck boss + boss bar.
# (?autostart=1 skips the title overlay; implement in main.js; audio stays muted until a gesture.)
```

### Level 4: Manual playtest (required before demo)
- Start → L1: find the Sword on the Library roof, check the hotbar and the blade in the hand.
- Fire the ray gun 4 times; the 5th press clicks empty. Punch a duck to a KO; ammo returns to 4.
- L2: lightning telegraphs, wind pushes, Fireblast pickup gives flaming fists, fireball has splash.
- L3: the surge chases; Laser Eyes gives glowing eyes and a beam; The Force gives an aura and a shockwave.
- L4: boss goes through 3 phases, the trophy drops, and VICTORY shows stats.
- Die deliberately → GAME OVER → Retry works and resets the surge.

## Final Validation Checklist

### Technical
- [ ] `bash scripts/validate.sh` exits 0 with PASS
- [ ] No console errors when loading each `?level=1..4`
- [ ] Level swap disposes the old level (no growth in `renderer.info.memory.geometries` across 3 retries)
- [ ] 60 fps; `renderer.info.render.calls` < 300 in L1

### Feature (challenge rules)
- [ ] One playable hero based on the school mascot (humanoid tiger)
- [ ] L1 Campus Dash has the Quad, Mascot Statue, Library, and Dining Hall (≥2 required)
- [ ] L2 has a new setting and obstacle types (stormy stadium: lightning, wind, movers, mud)
- [ ] L3 combines earlier challenges and adds the Pond Surge twist
- [ ] L4 boss fight against the rival Duck mascot
- [ ] Power-ups visibly change the hero and add new abilities
- [ ] Win (trophy → VICTORY) and fail (GAME OVER) with clear feedback
- [ ] Playable, testable build with README and run command

### Feature (user requests)
- [ ] Tiger is humanoid and boxes (J) as base combat
- [ ] Visible loadout 1–5 in the HUD and on the model
- [ ] Slot 1 Ray Gun: 4 shots, reloads only on a kill
- [ ] Sword found in the map (L1 Library roof)
- [ ] Fireblast, Laser Eyes, and The Force are findable powers
- [ ] Demo running on localhost

### Originality
- [ ] All names, characters, models, textures, and sounds are made for this game (procedural meshes, canvas textures, WebAudio synthesis). No third-party game assets, names, or level layouts.

---

## Anti-Patterns to Avoid
- ❌ Don't add a bundler, npm, or Node tooling. Node is not installed; the project must stay zero-build.
- ❌ Don't load three.js from a CDN at runtime; use `vendor/three.module.js` so the demo works offline.
- ❌ Don't put gameplay rules in model or rendering files. Keep Loadout and Physics pure and testable.
- ❌ Don't refill the ray gun anywhere except `world.onEnemyKilled`.
- ❌ Don't allocate geometries, materials, or vectors per frame or per projectile.
- ❌ Don't make the Sword or any power-up required to finish L1–L3. They are rewards; the boss is beatable with fists plus the ray gun.
- ❌ Don't use free 3D camera rotation or WASD strafing on Z. The lane stays at z = 0 for platforming readability.

## Confidence Score
**8/10** for a one-pass implementation. The remaining risk is level tuning (jump distances, boss difficulty); the reachability checks in the self-test and the `?god=1` / `?level=N` flags reduce it.
