# Hackathon Research Final Recommendations

## Executive Summary
**Winner**: Balanced Approach (8.25 / 10)
**Key Rationale**: Judges punish incomplete demos far more than they reward fancy tech. The balanced build ships all four levels, the Duck boss and all five loadout items on a zero-install vanilla three.js base, then spends its innovation budget on things players *see*: the loadout drawn on the tiger, The Force, and boss phases.
**Implementation Confidence**: High. A working build already exists and passes the 19-check self-test (see "Current Build Status").

## Problem Restatement
Make an original 3D, third-person, client-side three.js platformer: a humanoid boxing Tiger crosses four levels (Campus Dash → themed challenge → Gauntlet with a twist → Duck boss). It has a visible 1–5 loadout (Ray Gun with 4 shots that reloads on a KO, a Sword found in the map, Fireblast, Laser Eyes, The Force), win and fail states, and runs as a localhost demo. Constraints: no Node/npm on the machine, and three.js r160 is vendored.

## Option Comparison Matrix
| Criteria | Speed-First | Innovation-First | Balanced | Weight |
|----------|------------|------------------|----------|--------|
| Development Speed | 9 | 4 | 8 | 35% |
| Technical Feasibility | 9 | 6 | 9 | 25% |
| Innovation/Impact | 5 | 9 | 7.5 | 20% |
| Market Positioning | 7 | 7 | 8.5 | 15% |
| User Fit | 8 | 7 | 8.5 | 5% |
| **Total Score** | **7.85** | **6.10** | **8.25** | 100% |

## Detailed Option Analysis
### Speed-First — 7.85 ([synthesis](speed-first-synthesized-output.md))
Strengths: fastest playable; no tooling risk; easy for other teams to test. Weaknesses: generic look; the powers feel flat; weak innovation story. Best for: under 8 hours or a solo dev.

### Innovation-First — 6.10 ([synthesis](innovation-first-synthesized-output.md))
Strengths: most memorable; Force physics and an adaptive boss make strong talking points. Weaknesses: WASM and addon vendoring without npm; long debugging; high risk of missing levels. Best for: 48h+ with a dedicated graphics dev.

### Balanced — 8.25 ([synthesis](balanced-synthesized-output.md))
Strengths: every requirement done early; visible loadout and five distinct powers give the wow factor; every layer can be removed. Weaknesses: no headline engine tech; boss tuning needs playtests. Best for: a typical 24h hackathon (this one).

## Winner Selection & Rationale
### Primary Recommendation: Balanced (8.25, High confidence)
1. Scores highest on the two heaviest weights (speed + feasibility) while still scoring well on innovation.
2. Matches the no-npm constraint: everything is vanilla ES modules plus the vendored r160.
3. Takes the best innovation-first *ideas* (diegetic loadout, juice, Force as the signature power, boss phases) without its *tech risk*.

**Critical success factors**: levels as data; one kill handler, which owns the ray-gun reload rule; a level select and Easy mode for judges; a headless self-test after every change.

### Runner-Up: Speed-First (7.85)
Switch criteria: if under 6 hours remain and the boss isn't playable yet, cut the juice and art and ship the greybox.

### Contingency: Innovation-First (6.10)
Trigger: only if the core is finished with more than 40% of the time left. Then add bloom (vendored `EffectComposer` + `UnrealBloomPass` behind `?fx=1`) and gamepad support. Decide by Hour 14.

## Implementation Roadmap for Winner
### Hour-by-Hour Timeline
| Hours | Phase | Exit criterion |
|---|---|---|
| 0–2 | Core: renderer, input, AABB physics, procedural tiger, chase camera | Tiger runs/jumps/punches on a strip |
| 2–5 | All 4 levels as greybox data + finish flag + lives/game over | Each level completable; `?test=1` passes |
| 5–9 | Loadout 1–5 + Ray Gun rule + Sword/Fireblast/Laser/Force + pickups | Each power visibly changes the tiger and works |
| 9–13 | Mallard Mack FSM (charge / egg lob / ground pound / stun / phase 2) + trophy win | Boss beatable with fists alone and faster with powers |
| 13–17 | Campus art (Library, Dining Hall, Statue, Quad, Clock Tower), storm + lightning, flood twist | Screenshots read as "campus" |
| 17–20 | Juice: hit-stop, shake, particles, synth SFX + music, toasts | Hallway playtest ×3 |
| 20–22 | Tuning, Easy mode, level select, help overlay | New player beats L1 in under 3 min |
| 22–24 | Freeze, README, demo script | Demo rehearsed twice |

### Technical Architecture (as built)
```
index.html          HUD (hearts, progress/boss bar, hotbar 1–5 with ammo pips & cooldowns), overlays
src/main.js         loop (fixed 3-substep, dt clamp), input, physics, combat, enemies, boss FSM, camera, self-test
src/models.js       procedural Tiger (pivot rig, stripe CanvasTexture), Duck/boss, weapons, campus buildings
src/levels.js       4 data-driven levels (platforms, movers, crates, enemies, pickups, coins, checkpoints, decor)
src/audio.js        WebAudio-synthesized SFX + chiptune sequencer (no audio files)
vendor/three.module.js  r160
```

### Team Coordination Strategy
Three lanes, one file each: (1) core and boss in `main.js`, (2) levels and art in `levels.js`/`models.js`, (3) HUD and audio in `index.html`/`audio.js`. Interfaces are frozen at Hour 2. Everyone runs `?test=1` before pushing.

## Risk Assessment & Mitigation
**Risk 1 — Judges can't reach the boss.** Probability High, impact High. Mitigation: title-screen level select, `?level=4`, and powers from earlier levels granted when you skip ahead. Warning sign: playtesters stuck in L1–L2.
**Risk 2 — Difficulty spikes (Gauntlet flood, boss).** Probability Medium, impact Medium. Mitigation: checkpoints, a flood that resets below the checkpoint on respawn, Easy mode (9 lives, 1-damage hits), a respawning heart in the arena. Warning sign: more than 3 deaths in one spot.
**Risk 3 — Performance on low-end laptops.** Probability Low, impact Medium. Mitigation: no post-processing, pooled particle buffer, InstancedMesh crowd, shared materials. Warning sign: under 40 fps on integrated GPU.
**Risk 4 — Audio blocked by autoplay policy.** Probability High, impact Low. Mitigation: the AudioContext is created on the first click or Enter; M toggles mute.

### Decision Checkpoints
- **Hour 6**: all 4 levels completable? If not, cut decor.
- **Hour 12**: boss beatable? If not, switch to the Speed-First scope (cut juice).
- **Hour 18**: freeze features; tuning only.
- **Hour 22**: demo-ready on a second machine.

## Success Metrics & Validation
### Demo Success Criteria
- `http://localhost:8080/?test=1` → `ALLPASS 19`
- Title → L1 → finish flag in under 3 minutes for a new player.
- Each loadout item visibly changes the tiger: gun in hand / holstered at hip, sword in hand / on back, fire hands, glowing red eyes, purple aura.
- Boss: intro → attacks → phase 2 at 50% → defeat → trophy → victory screen.

### Judging Criteria Alignment
| Requirement | Where it is |
|---|---|
| Hero from the school mascot | "Stripes", humanoid boxing tiger |
| L1 Campus Dash, 2+ campus details | Library (sword on roof), Dining Hall, Tiger statue, The Quad, Clock Tower |
| L2 themed challenge | Stormy Stadium: rain, telegraphed lightning, bleachers, rolling footballs |
| L3 Gauntlet + new twist | Campus + storm + enemies, **twist: rising flood**, so you must climb |
| L4 rivalry boss | Mallard Mack (Duck), a 2-phase state machine |
| Power-up that visibly changes abilities | Sword, Fireblast, Laser Eyes, The Force, each shown on the model and the hotbar |
| Win / fail with feedback | Finish flag cards, trophy victory screen; hearts → lives → Game Over with Retry |
| Testable build | Static files, `python3 -m http.server`, level select, Easy mode, `?test=1` |

## Current Build Status
Implemented and verified with headless Chrome (SwiftShader): 19/19 self-test checks pass. Screenshots of all levels were reviewed.

## File References
- Speed-First: `speed-first-agent-a1-technical.md`, `-a2-speed-to-market.md`, `-a3-market-research.md`, `-a4-design-research.md`, `-a5-user-research.md`
- Innovation-First: `innovation-first-agent-b1…b5-*.md`
- Balanced: `balanced-agent-c1…c5-*.md`
- Synthesis: `speed-first-synthesized-output.md`, `innovation-first-synthesized-output.md`, `balanced-synthesized-output.md`
