# Agent B1: Technical Feasibility - Innovation-First Approach

## Research Focus
Which cutting-edge techniques can make *Mascot Mayhem: The Rivalry Run* stand out, and what each one really costs under our constraints: three.js r160 vendored at `vendor/three.module.js`, no Node/npm, ES modules through an import map, served by `python3 -m http.server`, on a hackathon clock. We looked at WebGPU/TSL, Rapier WASM physics, ECS libraries, skinned GLTF compared with procedural rigs, bloom post-processing, procedural levels, boss AI, WebXR and the Gamepad API.

Environment probe (2026-11-13): `curl`, `wget` and `python3` are on the machine, and jsDelivr is reachable. Fetching `three@0.160.0/examples/jsm/*` addons and `@dimforge/rapier3d-compat@0.14.0/rapier.es.js` both returned HTTP 200, so we can vendor them without npm.

## Key Findings
1. **Bloom is the best "wow per hour" option.** `UnrealBloomPass` in r160 needs about 10 small files: EffectComposer, Pass, RenderPass, ShaderPass, MaskPass, OutputPass, UnrealBloomPass, CopyShader, LuminosityHighPassShader and OutputShader. All of them resolve `three` through the existing import map. It makes laser eyes, ray-gun bolts, fireblast and Force auras glow with almost no code: emissive colours above 1.0 plus a threshold of about 0.85. Cost is about 1 hour, including vendoring.
2. **WebGPU/TSL in r160 is a trap.** `WebGPURenderer` in r160 sits under `examples/jsm/renderers/webgpu/` and is experimental. It needs the node-material system, which is dozens of files, and it has its own post-processing stack that doesn't work with EffectComposer. Headless-Chrome testing also gets less reliable. The only visible gain is "built on WebGPU" in the pitch. Verdict: no.
3. **Rapier is easy to get but unnecessary.** The `rapier3d-compat` build is a single ~2.0 MB ES module with the WASM inlined as base64, so it can be vendored and needs no `.wasm` MIME setup. But a 2.5D platformer with Z locked works well with the AABB resolver already in the patterns doc, and Rapier character controllers are fiddly to tune. The only place it earns its keep is "The Force" ragdoll/debris toss. Verdict: optional, not in the core.
4. **Off-the-shelf ECS adds risk for little gain.** bitECS (SoA typed arrays) and miniplex (object queries) both ship as ESM. For fewer than 300 entities, a hand-written ~60-line "mini-ECS" gives the same architecture story with no dependency risk. See below.
5. **Use procedural pivot rigs, not skinned GLTF.** Mixamo rigs bring licensing and asset-sourcing problems (the brief requires original art), need the GLTFLoader vendor chain, and mean animation-retargeting work. Procedural rigs are original by construction and fully controllable, which matters for punch timing and sword arcs.
6. **Boss AI is where innovation is cheap.** A data-driven hierarchical FSM, or a small behaviour tree (Selector/Sequence/Condition/Action, about 80 lines), gives the Duck phases, telegraphs, and responses to how the player fights. This is gameplay innovation that judges actually feel.
7. **Gamepad API: native and cheap (about 30 min).** Poll `navigator.getGamepads()` each frame and map onto the same input set, using face buttons and D-pad left/right to cycle slots 1–5. **WebXR: skip.** A side-scroller in VR is a poor fit, testers won't have headsets, and it can't be tested headless.
8. **Procedural levels: use seeded variation on authored chunks.** Fully procedural levels conflict with "recognizable campus details" and "clear start/middle/finish". Instead, build the Gauntlet from a seeded mix of chunks reused from Levels 1–2, and add a "Remix" daily seed for replay value.

## Quantitative Assessment
| Option | Innovation | Complexity | Risk | Differentiation | Reasoning |
|---|---|---|---|---|---|
| Bloom post-FX | 6 | L | 2 | 8 | Big visual payoff for the power-ups; known r160 code |
| Boss behaviour tree + phases | 7 | M | 3 | 9 | The fight judges remember; pure logic, testable headless |
| Data-driven mini-ECS | 6 | M | 3 | 5 | Cleaner code and a good pitch story; players don't see it |
| Gamepad support | 4 | L | 1 | 6 | "Plug in a controller" demo moment |
| Seeded Gauntlet remix | 7 | M | 4 | 7 | Replayability; must keep landmarks authored |
| Rapier for Force physics | 7 | M | 5 | 6 | Satisfying tumbling debris; 2 MB, async init, tuning time |
| Skinned GLTF (Mixamo) | 5 | H | 7 | 4 | Asset/licensing problems, loader chain, retargeting |
| WebGPU/TSL renderer | 9 | H | 9 | 5 | Experimental in r160, breaks the post-FX path, test risk |
| WebXR | 8 | H | 9 | 3 | Wrong genre fit; nobody can test it |

**Overall recommended stack:** Innovation 7/10, Technical Complexity Medium, Implementation Risk 4/10, Differentiation Potential 8/10. The innovation goes into feel (glow, boss intelligence, emergent Force physics, controller support), not into unstable rendering tech.

## Cutting-Edge Tech Stack
- **Core:** three.js r160 WebGLRenderer, ACESFilmic tone mapping, `SRGBColorSpace`.
- **Post-FX:** EffectComposer → RenderPass → UnrealBloomPass (strength ~0.8, radius 0.4, threshold 0.85) → OutputPass. Vendor these to `vendor/addons/...` keeping the jsm folder layout so the relative imports still resolve. Add a quality toggle (`B` key, or automatic when FPS < 45) that falls back to `renderer.render`.
- **VFX:** GPU-light particles on `Points` with additive blending; `InstancedMesh` for debris and rain; a shader-free "heat shimmer" made from scaled emissive sprites.
- **Physics:** custom swept-AABB 2.5D solver (core). Optional Rapier compat build, loaded lazily with `await import()` only when The Force is first collected, so failures stay isolated.
- **Input:** a single input layer that merges keyboard and Gamepad API into `actions` (`jump`, `attack`, `slot1..5`, `use`).
- **Audio:** WebAudio synthesis. Add a novel touch: a per-level procedural music loop (sequenced oscillators) whose tempo rises during the boss's last phase.

## Novel Architecture Patterns
1. **Mini-ECS + systems pipeline.** Entities are plain objects. Components are fields (`pos`, `vel`, `aabb`, `health`, `ai`, `mesh`, `pickup`). Systems are ordered functions: `input → ai → weapons → physics → collision → damage → pickups → anim → camera → fx → hud`. Queries are cached arrays keyed by component signature. This makes the game logic headless-testable, which suits the self-test harness in the patterns doc.
2. **Abilities as data.** Each loadout slot is a `{id, cooldown, ammo, onFire(world, owner)}` record. Ray Gun has `ammo: 4` and an `onKill` hook that refills it. Sword, Fireblast, Laser Eyes and Force all plug into the same interface. The HUD renders from that array, so slots 1–5 stay consistent automatically.
3. **Levels as JSON-like modules.** Each level module (`levels/campus.js`) exports a list of platforms, hazards, enemies, pickups and landmarks, plus `start`, `checkpoint` and `goal` markers. One builder turns data into meshes under `levelRoot`. The Gauntlet is `remix(seed, [campusChunks, gymChunks]) + twist`.
4. **Boss behaviour tree.** The Duck runs `Selector[ Phase3(hp<33%) → Sequence[telegraph, divebomb, featherStorm], Phase2(hp<66%) → [quack-shockwave, summon ducklings], Phase1 → [waddle-charge, egg-lob] ]`. A Blackboard tracks player habits (for example, "player spams ray gun" makes the Duck raise its wing shield, which is weak to Sword or Force). Every attack gets a 0.5–0.8 s visual and audio telegraph so it reads as fair.
5. **Event bus.** `emit('kill', {by:'raygun'})` decouples ammo refill, score, screen-shake, hit-stop (a 60 ms time-scale dip) and bloom flash.

## Critical Insights
- The constraint is **dependency surface**, not compute. Every vendored addon is a file graph that has to resolve through the import map. Bloom's graph is small and verified. WebGPU's is large and unstable.
- Judges notice **game feel** (hit-stop, screen-shake, glow, telegraphed boss attacks) far more than the underlying tech. Innovation should live where players can see it.
- Keep everything that can fail (bloom, Rapier, gamepad) **behind feature flags with a fallback**, so the demo can't break on another team's machine (integrated GPU, no WebGL2 extensions, and so on).
- Keeping logic and rendering separate (the ECS plus data levels) is what makes the headless Chrome test viable and protects the "playable, testable build" requirement.

## Implementation Strategy
1. **Hours 0–1:** vendor the bloom addon chain with `curl`, preserving `examples/jsm` paths; check that the import map resolves; render a bloom smoke test.
2. **Hours 1–4:** mini-ECS, input layer (keyboard and gamepad), AABB physics, procedural Tiger rig with punch.
3. **Hours 4–7:** ability registry (slots 1–5), HUD, pickups; tune emissive values so the beams bloom.
4. **Hours 7–11:** data-driven Levels 1–3, with the Gauntlet built by seeded remix of authored chunks.
5. **Hours 11–14:** Duck boss behaviour tree with phases, telegraphs and adaptive shield; win/fail screens.
6. **Hours 14+ (stretch):** lazy-loaded Rapier debris for The Force, procedural music, Remix-seed mode.

## Risk Mitigation
| Risk | Mitigation |
|---|---|
| Addon import path breaks | Mirror the jsm folder structure exactly; one smoke-test page; fallback to `renderer.render` |
| Bloom too costly on weak GPUs | Half-resolution composer, auto-disable below 45 FPS, `B` toggle |
| Rapier init fails or stalls | Lazy dynamic import inside try/catch; fall back to kinematic tween-based Force push |
| Boss AI feels unfair | Mandatory telegraphs, phase HP gates, tunable constants in one config object |
| Procedural remix makes impossible jumps | Chunks have authored entry/exit heights; the remix only joins compatible edges; the seed is fixed for the demo build |
| Scope creep from "innovation" | Hard cut line: anything after hour 14 is stretch; core requirements are checked against the brief before any stretch work |
| No npm or tooling | All dependencies are single ESM files fetched with `curl` at pinned versions (`three@0.160.0`, `rapier3d-compat@0.14.0`) and committed in `vendor/` |
