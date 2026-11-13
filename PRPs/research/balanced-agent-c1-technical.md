# Agent C1: Technical Feasibility - Balanced Approach

## Research Focus
Pick a dependable base for *Mascot Mayhem: The Rivalry Run* and add a small number of upgrades on top of it, each one switchable. The base is vanilla three.js r160 from `vendor/three.module.js` loaded through an import map, a custom AABB 2.5D physics system, a procedural pivot-based Tiger and Duck, and WebAudio synth SFX. The upgrades we evaluated are bloom, InstancedMesh, Force impulse physics, data-driven levels and a boss FSM. The weapon loadout also had to be designed: boxing (default), Ray Gun (4 shots, reloads on kill), Sword, Fireblast, Laser Eyes and The Force.

## Key Findings
1. **The base is already verified on this machine.** The import map, the `.js` relative imports, the fixed-step loop with clamped dt, pivot limbs with `CapsuleGeometry`, and the headless SwiftShader test all appear in `threejs_r160_game_patterns.md`. None of these steps needs Node.
2. **Bloom is the one upgrade with a dependency risk.** `UnrealBloomPass` needs four or five addon files: `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`, plus the `CopyShader`/`LuminosityHighPassShader` they depend on. They would be vendored from `cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/` into `vendor/addons/`. Their `import 'three'` calls resolve through the existing import map. The cost is about 1 extra draw pass at reduced resolution. Under SwiftShader it is slow, so it **must be off when `?test=1` is set** and controlled by a `?fx=0` flag. Fallback: `AdditiveBlending` and emissive materials already give 80% of the glow.
3. **The 2.5D lock makes all combat logic plain math.** Every hit test can use `THREE.Ray.intersectBox` or `Box3.intersectsBox` against data records. That means weapons and enemies can be unit-tested headlessly without a scene graph.
4. **The Force does not need a physics engine.** Give crates and enemies a `{vx, vy, mass, grounded}` body and run them through the same axis-separated AABB resolver as the player. A push or lift is then just `v += impulse / mass`.
5. **InstancedMesh is worth it only for static repeated props**: bleacher seats, library books, rain streaks and quad lamp posts. Enemies stay as individual Groups because they need per-limb animation.
6. **A boss FSM keeps the Duck testable.** Use a table of states such as `{enter, update, exit, next}`. Each state has a timer and the phase changes at HP thresholds.

## Quantitative Assessment
- **Technical Balance: 8/10.** Roughly 85% of the code follows proven, documented patterns. The new work is limited to bloom, the impulse bodies and the FSM. It loses points only because of the addon-vendoring step.
- **Implementation Stability: H.** There is no external runtime, no asset loading and no npm. Every upgrade has a flag, so failure just means "off", never a broken build.
- **Innovation Integration: 7/10.** Bloom lasers, telekinetic crate tossing and a multi-phase boss feel high quality. They do not compete with stronger approaches such as a full physics engine or custom shaders.
- **Complexity Management: 8/10.** We recommend about 10 modules. Each has a narrow interface: `update(dt, ctx)` plus pure data. Weapons share one interface, and levels are JSON-like objects, which keeps the integration surface small.

## Balanced Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Runtime | three.js r160 via import map, `python3 -m http.server` | Already vendored and verified |
| Loop | Fixed sub-step (4 steps), `dt = min(0.05, Δ)` | games_fps pattern, prevents tunnelling |
| Physics | Custom X/Y AABB, axis-separated resolve, shared `Body` for player, enemies and crates | Deterministic and headless-testable |
| Characters | Pivot-Group humanoids, lerped pose targets per state; Tiger stripes via `CanvasTexture` | No rigging or assets needed |
| FX | Pooled meshes; `Points` particles for fire and sparks; **optional** UnrealBloomPass (`?fx=0` to disable) | Lasers and fire get their glow at low risk |
| Props | `InstancedMesh` for repeated static decor | Lower draw-call count |
| Audio | WebAudio oscillators plus filtered noise, started from the Start button | Original sounds, zero files |
| HUD | DOM overlay (slots 1-5, ammo pips, HP, boss bar) | Simpler than in-canvas UI and selectable in tests |

**Module structure (`src/`):**
- `main.js`: boot, renderer and composer, loop, state machine (title / playing / win / fail), `?test=1` harness
- `input.js`: key set, edge-trigger buffer (ignores `e.repeat`), `preventDefault`
- `physics.js`: `Body`, `resolveAABB(body, solids)`, `applyImpulse`, ray-vs-box helpers
- `player.js`: Tiger rig, movement, jump with coyote time, i-frames, pose animation
- `weapons.js`: weapon registry, loadout, projectile and beam pools
- `enemies.js`: rival-school minions (patrol, chase, hurt and dead states), with the Body reused
- `levels.js`: 4 data definitions plus a `buildLevel(def) → levelRoot` builder and `disposeLevel`
- `boss.js`: Duck rig plus FSM
- `hud.js`: DOM loadout bar, toasts and end screens
- `audio.js`: `sfx.punch()`, `sfx.zap()` and the rest
- `fx.js` (optional split): particles, screen shake and bloom toggle

## Strategic Enhancement Areas
**Weapon system.** All weapons share one interface: `{id, slot, owned, cooldown, use(ctx), onKill?(ctx), hudInfo()}`. Number keys 1-5 select a slot and the attack key fires the active weapon. Boxing is the fallback whenever the active slot is empty or the Ray Gun is out of ammo.

| Weapon | Slot / Unlock | Mechanic | Hit test |
|---|---|---|---|
| Boxing | default (always) | 1-2 combo, 0.12 s extend / 0.18 s retract, short knockback | Hitbox `Box3` in front of the glove during active frames |
| Ray Gun | 1 (start) | `ammo=4`, 0.25 s cooldown, pooled bolt (fast projectile). **`onKill` from any weapon sets `ammo = 4`** with a HUD pip refill and a chime | Swept segment vs enemy boxes per substep |
| Sword | 2 (found in L1/L2 map) | Wide arc, 2x punch damage, can deflect Duck feathers | Arc approximated by 2 boxes |
| Fireblast | 3 (found in map) | Charged cone, burn DoT, ignites hay/boxes; particle stream | Cone check: `dx*facing>0 && abs(dy)<k*dx` |
| Laser Eyes | 4 (power-up, timed 12 s or energy bar) | Hold for a continuous beam; additive cylinder that blooms; damage per second | `Ray.intersectBox`, beam shortened to the first solid |
| The Force | 5 (power-up) | Tap = push impulse `(12*facing, 4)/mass` in a cone; hold = lift the nearest crate (spring to a hover point), release = throw | Radius query over Bodies |

The reload-on-kill rule lives in a single `combat.registerKill()` that calls `onKill` on every owned weapon, so it holds no matter which weapon got the kill. The "power-up visibly changes what the hero can do" requirement is met by Laser Eyes: glowing eye meshes, a new beam, and new destructible walls in L3 that only lasers can break.

**Data-driven levels.** Each level object has the shape `{name, theme, spawn, finishX, solids[], movers[], hazards[], crates[], enemies[], pickups[], decor[], checkpoints[]}`. Campus Dash adds library and mascot-statue decor builders, L2 is a stormy field with rain Points and wind zones, and L3 combines both and adds Force-only crate puzzles. The builder turns these records into meshes, so tests can load the definitions without WebGL.

**Boss FSM (Duck).** The states are `intro → strut → featherVolley → dashCharge → stunned (vulnerable) → …`. Phase 2 starts at 50% HP and adds `waddleQuake` (a ground shockwave to jump over) with faster timers. Being Force-thrown into crates makes the Duck `stunned`. Defeat leads to the win screen.

## Critical Insights
- **Gate every enhancement behind a flag** (`fx`, `instancing`) and keep the headless test path in plain render mode. This is the main thing that keeps stability high.
- **Pool everything**: bolts, beams and particles share geometry and material. Dispose `levelRoot` when the level changes.
- **Never create the AudioContext before user input.** SFX calls do nothing until audio has been unlocked.
- **Separate logic from visuals.** The `Body` and weapon `use()` functions take and return data, and meshes follow `body.x/y`. That makes `?test=1` assertions possible, for example "4 shots then empty, kill refills to 4" and "force push moves crate +X".
- **Point lights need high intensities** (r155+ physical lights). Re-centre the shadow camera on the player.

## Implementation Strategy
1. **Core (first ~30%)**: loop, input, physics, Tiger rig, camera, L1 data, HUD shell. *Gate:* the player can run and jump through L1 headlessly.
2. **Combat (~25%)**: weapon registry, boxing, Ray Gun with the kill-reload rule, enemies, pickups for Sword, Fireblast, Laser and Force.
3. **Content (~25%)**: levels 2-4 as data, Duck FSM, win/fail screens, checkpoints.
4. **Polish (~20%)**: WebAudio SFX, particles, InstancedMesh decor, then **bloom last**, behind its flag, with addons vendored only if fetching them succeeds.
5. Run the `?test=1` headless DOM-dump check after every phase.
