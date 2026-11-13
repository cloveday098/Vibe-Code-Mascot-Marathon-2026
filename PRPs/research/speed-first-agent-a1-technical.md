# Agent A1: Technical Feasibility - Speed-First Approach

## Research Focus
Ship a playable localhost build of "Mascot Mayhem: The Rivalry Run" as fast as possible using only what's already on the machine: vendored three.js r160, python3, Chrome. The research covered the fastest no-build stack, which libraries are worth pulling in (almost none), which patterns from the official examples to copy, and a realistic time-to-prototype for 4 levels, a boss, 5 loadout slots and 4 power-ups.

## Key Findings
1. **Zero-build is the fastest path, and it's already proven here.** An import map pointing `three` at `./vendor/three.module.js`, plus `python3 -m http.server 8080`, gets you running with no tooling setup. The ai_docs file confirms that headless Chrome with SwiftShader renders WebGL2 on this machine, so a smoke test can run in CI style without a person watching.
2. **No addons needed.** Every required feature maps onto core r160 APIs:
   - Movement and collision: hand-rolled 2.5D AABB in the X/Y plane (about 40 lines), not a physics engine.
   - Ray Gun and Laser Eyes: `THREE.Ray.intersectBox` or `Raycaster`.
   - Fireblast: pooled sphere meshes, as in `games_fps`.
   - The Force: an impulse applied to the velocity of enemies or crates inside a cone or radius.
   - Sword: a wider, longer melee AABB than the punch, plus a swing-arc mesh.
   - Particles: `Points` with a dynamic `BufferAttribute`.
   - HUD: plain HTML/CSS overlay divs, the fastest way to build UI. No canvas text is needed except for campus signs (`CanvasTexture`).
   - Audio: WebAudio oscillators and noise. No asset files, so there's no licensing risk.
3. **Characters should be procedural primitives, not GLTF.** A Tiger and a Duck built from Capsule, Sphere and Cone pivots with a canvas stripe texture take about 1 hour each. Rigging or loading models would cost more and risks copyright issues. Pivot-lerp animation (idle, run, jump, punch) covers what the brief needs.
4. **Pick a 2.5D side-scroller with the camera behind and to the side, not free 3D.** Locking Z cuts collision, AI and level authoring to 2D problems and still meets "3D, third-person camera". It's the single biggest speed lever.
5. **Levels as data.** Each level is an array of `{minX, maxX, minY, maxY, type}` records plus entity spawns, and one `buildLevel(data)` function makes the meshes. With this, levels 2 and 3 mostly reuse level 1's code: L3 "Gauntlet" is a concatenation of L1 and L2 chunks plus one twist, such as a rising flood or a crumbling platform.
6. **The `games_fps` loop is the proven backbone**: dt clamped at 0.05, fixed sub-steps, pooled projectiles, an `onFloor` flag. The keyboard set comes from `misc_controls_pointerlock`, and the lighting and fog from `webgl_lights_hemisphere`.

## Quantitative Assessment
- **Technical Complexity: 5/10.** Each piece is simple, but there are a lot of them: 5 weapons/powers, 4 levels, a boss state machine, and HUD and win/fail flow. Nothing needs novel tech. The breadth of features is the problem, not their depth.
- **Implementation Confidence: High.** All APIs are verified in r160, the server and headless testing are proven locally, and there are no external dependencies or network needs at runtime.
- **Speed Rating: 8/10.** No build, no installs, and instant reload. We lose points because there's no hot module reload and no TypeScript safety net, so typos only show up at runtime. Mitigate with a `?test=1` self-test harness that the headless Chrome command runs.
- **Risk Level: 3/10.** The main risks:
  - Scope creep on the visuals.
  - Collision tunnelling at high speed (fixed by sub-stepping).
  - Memory leaks on level swaps (fixed by the `levelRoot` dispose pattern).
  - The boss fight being tuned too hard or too easy.
  - Two engineers editing one file. Split the work into modules to avoid this.

## Recommended Tech Stack
| Layer | Choice | Why |
|---|---|---|
| Rendering | three.js r160 (vendored), import map | Already present, verified |
| Language | Vanilla ES modules, `.js` extensions | No build step |
| Physics | Custom AABB 2.5D (axis-separated resolve) | ~40 LOC, deterministic, testable |
| Characters | Procedural primitive humanoids + CanvasTexture | No assets, original art |
| UI/HUD | HTML/CSS overlay (`#hud`, `.slot.active`) | Fastest to style and iterate |
| Audio | WebAudio synth (`blip`, noise burst) | No files, original sounds |
| Hosting | `python3 -m http.server 8080` | Already installed |
| Testing | `?test=1` logic asserts → `data-test` attr, headless Chrome `--dump-dom` | Proven on this machine |

Suggested file layout: `index.html`, `src/main.js` (loop and state machine), `src/input.js`, `src/physics.js`, `src/tiger.js`, `src/duck.js`, `src/enemies.js`, `src/weapons.js`, `src/levels.js` (data), `src/levelBuilder.js`, `src/hud.js`, `src/audio.js`, `src/selftest.js`.

## Critical Insights
- **Get the vertical slice first.** Build one level with movement, punching, one enemy, a goal flag and a fail state before writing any weapon code. Everything else hangs off that loop.
- **Use one weapon interface.** Give every slot `{name, ammo, cooldown, fire(player, world)}`. The Ray Gun is `ammo: 4` with `onKill → ammo = 4`. Sword, Fireblast, Laser and Force are pickups that unlock a slot, so the HUD reads `player.slots[1..5]` and greys out locked slots. With this, five weapons are about 5 small functions instead of 5 systems.
- **Make power-ups visibly change the hero.** Laser Eyes gives glowing red eye meshes, Fireblast gives an orange point light on the fists, and The Force gives a purple aura ring. Each is a few lines and satisfies the "visibly changes" requirement.
- **Keep the boss a simple state machine.** The Duck cycles `idle → charge → egg-bomb volley → stunned (vulnerable)`, with an HP bar in the HUD and a phase-2 speed-up below 50% HP. It reuses the enemy and projectile code.
- **Put the campus details in level 1 as cheap landmarks.** A library is a box with columns and a `CanvasTexture` "LIBRARY" sign. A mascot statue is the tiger mesh on a plinth with a grey material, which reuses the hero builder for free.
- **Avoid shadows on many objects.** Use one directional light with shadows re-centred on the player, and `castShadow` only on characters. This keeps SwiftShader and laptop GPUs fast.
- **Handle keys carefully.** Ignore `e.repeat` on edge-triggered keys (jump, punch, slots 1–5) and call `preventDefault` on Space and the arrow keys.

## Implementation Recommendations
1. Hour 0–1: Skeleton with `index.html`, the import map, renderer, lights, fog, the fixed-step loop, input and the chase camera. Run the headless smoke test.
2. Hour 1–2.5: The procedural Tiger with pose animation, AABB physics, and the punch hitbox. A basic walker enemy and stomp/punch kills.
3. Hour 2.5–4: Level data format and builder. Build L1 Campus Dash (library and statue) with a start gate, mid checkpoint, finish flag, pits and fail/respawn. Add the HUD with lives and slots 1–5.
4. Hour 4–6: The weapon interface. Ray Gun (4 shots, reload on kill), then Sword, Fireblast, Laser Eyes and The Force as pickups that unlock slots, each with its visual and synth sound.
5. Hour 6–7.5: L2 (stormy field: `Points` rain, wind gusts pushing on X, lightning flash) and L3 Gauntlet (mixed chunks plus moving or crumbling platforms).
6. Hour 7.5–9: L4 Duck boss, the win screen, game over and restart, plus a title screen and controls overlay.
7. Hour 9–10: Self-test asserts, tuning and a README with the run command.

Cut-list if time runs short, in order: lightning flash → boss phase 2 → particle polish → moving platforms. Never cut win/fail feedback or the HUD.

## Time Estimates
| Milestone | Est. (focused engineer + AI assist) |
|---|---|
| Running scene + moving tiger | 1–1.5 h |
| Playable L1 with win/fail | 3.5–4 h cumulative |
| All 5 slots + power-ups | 6 h cumulative |
| 4 levels + boss | 9 h cumulative |
| Tested, tuned demo | 10–12 h total |

**Bottom line:** this is very feasible. The vanilla stack with zero dependencies is the fastest option. The main time risk is the number of features, not the technology, so build a strict vertical slice first and keep levels data-driven.
