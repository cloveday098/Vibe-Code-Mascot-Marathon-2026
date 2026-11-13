# Agent B2: Speed-to-Market - Innovation-First Approach

## Research Focus
What each "innovative" technique would cost in time on this project: three.js r160 vendored as one file (`vendor/three.module.js`, no addons on disk), no Node/npm, served by `python3 -m http.server`, checked with headless Chrome on SwiftShader. The scope is large: 4 levels, a Duck boss, 5 loadout slots (Ray Gun, Sword, Fireblast, Laser Eyes, The Force) plus boxing as default melee, and a HUD. For each technique the question is the same: does the novelty earn its hours, or does it eat the time needed for the required features?

## Key Findings
- **WebGPU/TSL: highest risk, lowest payoff.** In r160, `WebGPURenderer` is an experimental addon under `examples/jsm/renderers/`. TSL was not stable until roughly r167–r171, when `three/webgpu` became its own build. Using it means either upgrading three (which breaks the verified r160 patterns doc) or building on an unstable API that has almost no docs. Headless Chrome with SwiftShader generally has no WebGPU adapter, so the automated test path would stop working. Shader and node-graph errors show up as long, cryptic WGSL compile logs. Cost: 6–12 h before anything is useful. **Reject.**
- **Rapier WASM physics: vendoring works, tuning is the expensive part.** `@dimforge/rapier3d-compat` ships its WASM inlined as base64, so it is a single ESM file (~2 MB) that works with an import map. No MIME or `fetch` problems with python http.server. You can get the file without npm by downloading the tarball from jsDelivr or unpkg. The real cost is tuning, not setup: a kinematic character controller, slope and step settings, fast projectiles tunnelling without CCD, and keeping meshes in sync with the physics world. Proof of concept: 2–3 h. Full integration: 6–10 h. A platformer only needs AABB/capsule-vs-box collision, which takes about 2 h to hand-roll and is easy to debug.
- **ECS (bitecs/miniplex or hand-rolled): mostly overhead at this size.** It has a 1–2 h learning cost and adds indirection that makes debugging harder. A lightweight "entity list + update(dt)" pattern gets about 80% of the benefit for no cost.
- **Skinned GLTF animation: an asset problem, not a code problem.** Copied assets are banned, so a rigged tiger and duck would have to be built in Blender. That is 4–8 h per character even for someone skilled, and it also needs `GLTFLoader` vendored (plus its imports). The AnimationMixer crossfade code itself is cheap (about 1 h, following `webgl_animation_skinning_blending`). A procedural rig made from three.js primitives and animated with sine waves and tweens (punch, run, jump) takes 2–3 h and looks charming. **Use primitives.**
- **Post-processing (bloom/outline): the best spectacle per hour.** It needs `EffectComposer`, `RenderPass`, `UnrealBloomPass`, `OutputPass`, plus the shaders they import (about 8 files), all vendored from the r160 tag so the versions match. Setup takes about 1.5 h. Main pitfalls: tone mapping and colour-space mismatches that make the image look washed out, and fill-rate cost on SwiftShader. Bloom makes the Ray Gun, Laser Eyes and Fireblast effects stand out. **Adopt, behind a toggle.**
- **Procedural levels: mostly a liability for a judged demo.** The brief requires recognizable campus landmarks and designed start/middle/finish sections. Seeded randomness works against both. Instead, define levels as **data** (JSON-like arrays of platforms, hazards and pickups) and have one builder construct them. That is "procedural assembly" at about 3 h, and it stays testable.
- **Boss AI: the innovation that judges notice.** A finite-state machine (idle, then telegraph, then attack pattern A/B/C, then vulnerable, phase 2 at 50% HP) takes 3–5 h and is easy to debug with a state label on screen. Behaviour trees or utility AI add 3+ h for little visible gain.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| **Innovation Timeline** | **4/10** (full innovation stack) → **8/10** (selective) | Using WebGPU + Rapier + ECS + GLTF together needs about 25–40 h of tech before gameplay, which is not feasible for a hackathon. Using only bloom, FSM boss AI, data-driven levels and procedural rigs adds about 8 h and still ships. |
| **Learning Curve Impact** | **High** (WebGPU/TSL, Rapier, GLTF authoring) / **Medium** (post-processing, ECS) / **Low** (FSM AI, data levels, primitive rigs) | The impact comes from sparse docs and opaque failures (WASM panics, WGSL errors), not from the concepts being hard. |
| **Experimentation Time** | **10–14 h** for the full innovation stack; **3–4 h** for the selective set | Time-boxed spikes: bloom 1.5 h, boss FSM 2 h prototype, Rapier spike 2 h (optional, then decide go/no-go). |
| **Support Availability** | **5/10** | r160 WebGL, the examples and EffectComposer are well documented (8/10). WebGPU/TSL docs in r160 were nearly non-existent (2/10). Rapier JS docs are thin, with most answers in Discord or GitHub issues (4/10). An offline machine with no npm makes this worse because every missing transitive import has to be found by hand. |

## Development Phases
1. **Core (0–6 h):** WebGL r160, the third-person camera, hand-rolled capsule/AABB physics, tiger built from primitives, punch combo, and Level 1 from data. Ship something playable early.
2. **Systems (6–14 h):** loadout HUD slots 1–5, Ray Gun (4 shots, reload on kill), Sword and Fireblast pickups, Laser Eyes, The Force (push/lift using impulses), and win/fail screens.
3. **Content (14–20 h):** Levels 2–3 from the data builder (stormy field or tunnel, then the Gauntlet twist), and the Duck boss FSM with telegraphed attacks and phases.
4. **Innovation layer (20–24 h):** vendor and enable bloom, add particles (`InstancedMesh`/`Points`), screen shake and hit-stop. Everything stays behind flags so it can be removed safely.
5. **Hardening (last 10–15%):** headless Chrome smoke test, a pass to check feature flags off, and a playtest by another team.

## Learning & Experimentation Plan
- **Spike rule:** every new technique gets a hard 2 h time-box in a throwaway file under `scratch/`. Make the go/no-go call at the end of the box, not later.
- **Bloom spike:** download the r160-tagged addon files from jsDelivr (`three@0.160.0/examples/jsm/...`), map them with `"three/addons/": "./vendor/addons/"`, and grep each file's `import` lines until none are left unresolved.
- **Rapier spike (optional):** load `rapier3d-compat`, `await RAPIER.init()`, drop 100 boxes, and test a kinematic controller on a ramp. If the controller isn't stable within 2 h, stick with hand-rolled physics.
- **Boss FSM:** prototype with cubes first, using a debug overlay that shows state and timers. Tune timings before adding art.
- **Skip entirely:** WebGPU/TSL, custom GLTF authoring and full ECS libraries.

## Critical Insights
- At this scope, innovation that shows on screen (bloom, particles, juicy boss patterns, game feel) is worth far more than innovation in the architecture (ECS, WebGPU) that judges never see.
- Vendoring without npm is the hidden cost. Each addon brings 2–6 transitive imports, and each one is another chance for a version mismatch with r160. Always pin `@0.160.0`.
- The test pipeline runs on SwiftShader, so anything WebGPU-only can't be verified automatically, and heavy post-processing may push headless FPS below what tests can use.
- The power-ups ("The Force", Laser Eyes) are the real innovation surface. Raycasts plus impulses and emissive beams with bloom give spectacle without risky dependencies.

## Risk Mitigation
- **Feature flags** (`?fx=0`, `?physics=simple`) so each innovation can be switched off at demo time.
- **Fallback-first:** build the simple version, then upgrade it. Never block gameplay on a spike.
- **Tunnelling:** use raycast hitscan for the Ray Gun and Laser Eyes, sweep fast projectiles by segment-vs-AABB each frame, and clamp `dt` to 1/30 s.
- **Shader and colour bugs:** stay on the r160 built-in materials, set `renderer.outputColorSpace = SRGBColorSpace`, and put `OutputPass` last in the composer.
- **WASM failures:** wrap `init()` in try/catch with a fallback to hand-rolled physics, and log to a visible on-screen console.
- **Time cutoff:** freeze innovation work when 80% of the time is used. After that, only bug fixes and playtesting.
