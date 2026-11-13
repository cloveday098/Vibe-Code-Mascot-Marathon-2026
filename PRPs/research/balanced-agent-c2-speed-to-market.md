# Agent C2: Speed-to-Market - Balanced Approach

## Research Focus
How to get a playable, testable localhost build of *Mascot Mayhem: The Rivalry Run* in front of judges as early as possible, then layer in the required features (4 levels, loadout of 5, power-ups, Duck boss, win/lose) without destabilizing what already works. Constraints: three.js r160 vendored, no Node/npm, `python3 -m http.server`, ES modules with `.js` extensions, procedural art and WebAudio only (see `PRPs/ai_docs/threejs_r160_game_patterns.md`).

## Key Findings
1. **The no-build constraint helps speed.** No bundler, no package install, no asset pipeline. Iteration is just "save and refresh." The main risk is module wiring: a missing `.js` extension or a `file://` load fails silently. Put a smoke test in Phase 0.
2. **A data-driven level is the biggest single lever.** If levels are plain JS arrays (`{type:'platform', x, y, w, h}`, `{type:'pickup', kind:'sword'}`) built by one `buildLevel(def)` under one `levelRoot`, then levels 2-4 are mostly *data*, not code. Disposal between levels is one traverse.
3. **2.5D (Z-locked AABB) removes the hardest part.** The cheat sheet already supplies X/Y AABB collision, a chase camera, a fixed-step loop and a pivot-based procedural humanoid. No physics library is needed, and none should be adopted.
4. **The 5 loadout slots share one interface.** Every weapon or power is `{id, name, icon, ammo?, onFire(ctx), onUpdate(dt)}`. Ray gun, laser eyes and fireblast reuse the same raycast-or-projectile pool. Sword is a bigger punch hitbox. The Force is a radius impulse. Building the interface early and then each item makes each one about 30-60 min.
5. **The boss is the highest-risk required item.** It depends on the player, combat, weapons and level loader, so it must come after them. Its FSM itself (Idle → Telegraph → Attack → Vulnerable → Phase2 → Defeat) is small.
6. **Headless Chrome verification works on this machine** (SwiftShader WebGL2). A `?test=1` hook that writes `data-test` attributes allows automated regression checks at every phase boundary. This is cheap insurance for parallel work.

## Quantitative Assessment
- **Development Balance: 8/10.** Each phase ends shippable, and innovation is held back until the core is stable. It loses points because the boss sits late on the critical path and could be squeezed.
- **Phased Delivery Efficiency: High.** Each phase builds on the previous one with little rework. Greybox levels become final levels by swapping materials, not rebuilding.
- **Quick Win Potential: 9/10.** A tiger made of primitives that runs, jumps and punches on a campus strip with a library block and a statue is about 1-2 hours of work and already covers "playable hero" plus part of Level 1.
- **Strategic Timeline: 7/10.** Realistic for a 1-2 day hackathon with 2-3 parallel workers. Phase 4 polish is the natural buffer and gets cut first.

## Phased Development Plan
| Phase | Goal | Exit criteria (testable) | Est. |
|---|---|---|---|
| **0 Skeleton** | `index.html` + import map, fixed-step loop, input, chase cam, procedural tiger (move/jump/punch), AABB collision, one flat level | Refresh shows the tiger; headless `data-test="PASS"`; punch kills a dummy | 2-3h |
| **1 Levels + states** | Level loader from data; 4 greybox levels (Campus Dash: library + mascot statue + quad; Stormy Field: wind/rain/slippery; Gauntlet: remix + moving platforms twist; Showdown arena); goal flag, HP, pits/hazards, Game Over / Level Clear / Victory screens, restart | All 4 levels completable start→finish; dying shows Fail + Retry | 3-4h |
| **2 Loadout** | HUD slots 1-5, number keys, ammo display; Ray Gun (4 shots, reload on kill), Sword pickup, Fireblast pickup, Laser Eyes, The Force; pickups placed in level data and visibly changing the hero (glow, held sword, eye beams) | Each slot usable; ray gun ammo resets on kill; pickups show on HUD | 4-5h |
| **3 Duck boss** | FSM with telegraphed attacks (charge, egg lob, wing gust), HP bar, vulnerable windows, phase 2 at 50% HP, defeat → Victory | Boss beatable with punches alone and faster with powers | 3-4h |
| **4 Juice/polish** | WebAudio SFX, particles (rain, fire, hit sparks), screen shake, hit-stop, toon materials, title screen, controls card | No new features: feel and presentation only | remaining |

Feature freeze happens at the end of Phase 3. Phase 4 runs on a stable build only.

## Strategic Technology Adoption
- **Adopt now (Phase 0):** import map + vendored r160, `Clock`-driven fixed step, `MeshStandardMaterial` primitives, HemisphereLight + one DirectionalLight. All of these are already verified.
- **Adopt at Phase 1:** `levelRoot` disposal pattern, `InstancedMesh` for repeated props (bleachers, bookshelves, rain streaks), canvas-texture signage for campus details (set `colorSpace = SRGBColorSpace`).
- **Adopt at Phase 2:** shared projectile pool (one geometry and one material), `Raycaster` for beams, DOM-based HUD. DOM is faster to build and test than in-canvas UI.
- **Adopt at Phase 4 only:** WebAudio synth SFX (create the context after the Start click), `Points` particles, shadows re-centered on the player, `MeshToonMaterial` art pass.
- **Reject:** physics engines, GLTF/skinned models, post-processing addons, and any CDN dependency at runtime. Each adds integration risk for little judged value.

## Critical Insights
- **Ship vertical before horizontal.** Phase 0 must be *fun to punch things in* before any second level exists. The feel of movement (coyote time, jump buffer, variable jump height) is the cheapest polish with the highest return, so do it in Phase 0, not Phase 4.
- **Win/lose states are a requirement, not polish.** They belong in Phase 1 so every build from then on is a complete game loop.
- **Lock contracts before splitting work:** `Entity {mesh, aabb, hp, update(dt), onHit(dmg, src)}`, `Weapon` interface, level-data schema, and a `game.events` emitter (`kill`, `pickup`, `damage`, `levelComplete`). With these fixed, parallel work merges cleanly. Without them, merges collide.
- **Innovation layer (after Phase 2 is stable):** combos between powers (Force-lift an enemy, then laser it), the Duck stealing your active slot in phase 2, and a "rivalry meter" crowd chant that boosts damage. Each one is additive on the event bus and can be dropped without affecting anything else.

## Implementation Strategy
**Parallel split (3 workers after the Phase 0 contracts land, about hour 3):**
- **A (Core/Player):** player controller, camera, combat hitboxes, then the boss FSM in Phase 3.
- **B (World):** level schema + loader, 4 level data files, hazards, campus/stormy props, win/lose screens.
- **C (Systems):** HUD, loadout manager, 5 weapons/powers, pickups, then audio and particles in Phase 4.

Files map one-to-one to owners (`src/player.js`, `src/levels/*.js`, `src/weapons/*.js`, `src/hud.js`, `src/boss.js`, `src/audio.js`) to reduce merge conflicts. At every phase boundary: run the headless check, play all levels by hand once, and tag a known-good copy (`cp -r` snapshot, since there is no git) so a working build can always be demoed. If time runs short, cut in this order: Phase 4 art → innovation layer → boss phase 2 → Gauntlet twist complexity. Never cut win/lose, the HUD, or the four required powers.
