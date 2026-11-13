# Agent A2: Speed-to-Market - Speed-First Approach

## Research Focus
How to get "Mascot Mayhem: The Rivalry Run" (Tiger hero vs. Duck boss, 4 levels, loadout 1-5) to a playable localhost demo as fast as possible. The constraints: three.js r160 vendored, no Node/npm, `python3 -m http.server`, everything client-side. Topics: MVP cut lines, rapid prototyping, reusable building blocks, splitting work across parallel developers, and testing shortcuts.

## Key Findings
1. **No-build is a speed advantage.** ES modules + an import map pointing at `vendor/three.module.js` mean zero toolchain setup. Edit, save, refresh. The cost is no hot-reload and no type checking, so keep modules small and fail loudly (`console.error` plus an on-screen error overlay).
2. **Procedural primitives beat assets.** A tiger built from Box/Capsule/Sphere pivots (ai_docs §4) and a duck built from Sphere + Cone take about 30 minutes each, need no loaders and carry no licensing risk. Skinned GLTF characters are a time sink and a copyright risk, so cut them.
3. **2.5D collapses scope.** Lock Z, use AABB collision in X/Y (ai_docs §5) and a chase camera (§6). That keeps the "3D, 3rd-person" requirement but removes navmesh, 3D physics and camera-occlusion work. This is the biggest single time saver.
4. **Data-driven levels make 4 levels cheap.** One `buildLevel(def)` that reads arrays of `{type, x, y, w, h}` platforms, hazards, enemies and pickups. Levels 1-3 then become about 40 lines of data each instead of separate code paths.
5. **Every weapon is one of three primitives.** A hitbox (punch, sword), a projectile (ray gun, fireblast) or a raycast beam (laser eyes, ai_docs §7). The Force is an impulse over a radius. One `Weapon` interface `{name, icon, ammo, fire(player, world)}` makes slots 1-5 pure configuration.
6. **Headless verification works on this machine.** ai_docs §11 confirms that `google-chrome --headless=new ... --dump-dom` with SwiftShader WebGL2 succeeds. It can be the smoke test after every merge.

## Quantitative Assessment
- **Development Speed Score: 8/10.** No build step, primitive art and data-driven levels are all fast. It loses 2 points because there is no npm (so no test framework, linter or bundler) and because 5 weapons plus a boss is wide scope.
- **MVP Feasibility: High.** Each required feature maps to a small, known pattern already documented in ai_docs. Nothing needs research-grade work.
- **Time-to-Demo: about 3 h** for a playable L1 with punch, ray gun, HUD and win/fail. **About 8 h** for the full required scope. **About 10-12 h** with polish (audio, particles, juice).
- **Parallel Efficiency: 7/10.** Weapons, levels, boss and HUD separate cleanly once the core contracts (`player`, `world`, `Weapon`, level-def schema) are frozen at hour 1. The bottleneck is a shared `main.js` loop and the integration merges. Without a lockfile or package boundaries, conflicts surface late.

## MVP Scope & Prioritization
| Tier | Feature | Rationale |
|---|---|---|
| **P0 (must)** | Tiger move/jump/punch, chase cam, AABB platforms | Core loop; everything depends on it |
| P0 | HUD with slots 1-5, number-key select, health bar | User requirement; cheap DOM overlay |
| P0 | Slot 1 Ray Gun: 4 shots, reload on kill | User requirement, explicit rule |
| P0 | 4 levels with start/finish flag; L4 = Duck boss | Brief requirement |
| P0 | Win screen / Game Over + retry | Brief requirement |
| P0 | At least 1 collectible power-up that visibly changes ability (Fireblast pickup) | Brief requirement |
| **P1 (should)** | Sword pickup (bigger melee hitbox, visible blade) | User requirement; about 30 min |
| P1 | Laser Eyes (raycast beam, cooldown) | User requirement; reuses §7 |
| P1 | The Force (radial push/lift impulse) | User requirement; about 30 min |
| P1 | Campus landmarks L1 (library, statue), L2 theme (stormy field + rain), L3 twist (moving platforms + mixed hazards) | Brief "recognizable" criteria |
| P1 | Boss phases (2 patterns + enrage at 50% HP) | Makes the showdown read as a boss |
| **P2 (nice)** | WebAudio SFX, particles, screen shake, hit-stop | Demo juice |
| **CUT** | Skinned animation, GLTF assets, save system, settings menu, mobile controls, physics engine, level editor | High cost, low judging value |

All user-named weapons are P0/P1 because the user asked for them explicitly. Cut polish, never named features.

## Development Timeline (hour-by-hour, 2-3 devs)
- **H0-1 (all):** Write `index.html` + import map, `main.js` fixed-step loop (§3), input module, and the frozen contracts (level schema, `Weapon` interface, `world.enemies[]`, event bus `emit('kill')`). Commit a skeleton.
- **H1-3:** Dev A builds the tiger, physics/AABB, camera and punch. Dev B builds the level loader, L1 Campus Dash data and the finish flag. Dev C builds the HUD (slots, health, ammo) and win/fail screens.
- **H3 checkpoint:** Merge to a playable L1 demo and run the headless smoke test.
- **H3-5:** A does Ray Gun + reload-on-kill, Fireblast and Sword. B does L2 (storm field) and L3 (gauntlet). C builds basic enemies (patrol walker).
- **H5-7:** A does Laser Eyes and the Force. B adds landmark props and level transitions with disposal (§9). C builds the Duck boss (state machine: hop-slam, egg barrage, enrage).
- **H7-8:** Integration. Run all 4 levels end to end and fix blockers. **Feature freeze.**
- **H8-10:** Polish (audio §10, particles §8, balancing), then README/controls screen.
- **H10+:** Buffer for bugs and the demo rehearsal.

## Critical Insights
- **Freeze interfaces in hour 1.** Parallel work fails when contracts drift. Put them in a short `CONTRACTS.md` or JSDoc header.
- **One file per system** (`player.js`, `weapons.js`, `levels.js`, `boss.js`, `hud.js`) so merges rarely collide. `main.js` is owned by one person.
- **Playable beats pretty at every checkpoint.** Keep a demo-ready build at H3, H5 and H8 so a crash late on still leaves something to show.
- **The boss is the judged moment.** Give it telegraphed attacks (wind-up flash) and a big HP bar. Readable beats complex.

## Implementation Shortcuts
- **Debug URL params and keys:** `?level=3` jumps straight to a level. `?god=1` gives invulnerability. `?all=1` unlocks all 5 weapons. `N` skips to the next level and `K` kills all enemies (both only in debug mode). This saves several minutes per test cycle.
- **Headless smoke test:** in test mode, the page writes `data-test="PASS L1..L4 loaded boss=ok"` after it auto-iterates level builds. Command:
  ```bash
  google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader \
    --virtual-time-budget=8000 --dump-dom "http://localhost:8080/?test=1" | grep -o 'data-test="[^"]*"'
  ```
  Add `window.onerror`, which writes `data-test="FAIL <msg>"`, so runtime errors appear in the grep.
- **Logic self-tests in the browser:** a `?test=1` path runs plain asserts (ray gun ammo goes 4 to 0, then a kill refills it to 4, AABB overlap cases, Force impulse direction). No framework is needed.
- **HUD as DOM, not WebGL.** Absolutely positioned divs with emoji or CSS icons are faster to build and style than sprites.
- **Pool and share** projectile geometry/material (§12) from the start, so there is no late perf work.
- **Reference examples** for patterns only: `games_fps` (loop, sphere projectiles), `webgl_points_dynamic` (particles).

## Risk Mitigation
| Risk | Likelihood | Mitigation |
|---|---|---|
| Merge conflicts in `main.js` | High | Single owner; others expose `init/update` functions |
| Memory leaks across level swaps | Med | Dispose helper (§9) plus a `renderer.info` check in the smoke test |
| Boss overruns time | Med | Ship a 1-pattern boss by H6, then add phases |
| Weapon creep (5 weapons) | Med | Shared `Weapon` interface; each weapon is under 40 lines and gets a timebox of 30 min |
| Physics feel bad (floaty jump) | Med | Tune constants in a single `CONFIG` object; coyote time + jump buffer |
| Lighting too dark (r155+ intensities) | Med | Use Hemisphere + Directional; PointLight intensity 20-60 (§12) |
| Demo machine issues | Low | Test on a second browser; document `python3 -m http.server 8080` in the README |
| Copyright | Low | All primitives + synthesized audio; original names |
