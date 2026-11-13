# Agent B4: Design Research - Innovation-First Approach

## Research Focus
How to make *Mascot Mayhem: The Rivalry Run* feel modern and polished within hackathon constraints (three.js r160, no build step, client-only). Areas covered: diegetic/hybrid HUD for the required 1-5 loadout, weapon-selection paradigms, "juice" systems, 2.5D camera framing, Force-power interaction, adaptive difficulty, and accessibility (assist mode, colorblind-safe VFX, one-handed play, Gamepad API haptics).

## Key Findings
1. **Hybrid HUD beats pure diegetic.** Fully diegetic UIs (Dead Space spine health) look great but hurt readability at small scale. The brief *requires* a visible 1-5 slot HUD, so use a screen-space hotbar **and** diegetic reinforcement: holstered sword on the tiger's back, ray gun on the hip, ammo pips (4 emissive spheres) on the gun, glowing eyes when Laser Eyes is active, hand-flame when Fireblast is equipped.
2. **Hotbar over radial wheel.** A radial wheel adds a mode, a pause/slow-down state, and mouse aiming problems in a side-scroller. With exactly 5 slots bound to number keys, a hotbar plus Q/E (or scroll / bumpers) cycling is faster and clearer. A radial wheel only makes sense on gamepad. Recommend an optional gamepad-only wheel as a stretch goal, nothing more.
3. **Juice gives the most perceived quality per line of code.** Hit-stop (40-90 ms freeze on hits), trauma-based screen shake (Squirrel Eiserloh's GDC talk: shake = trauma², decays over time, uses noise rather than random), squash/stretch on jump and land via `scale` tweens, and a 0.25x slow-mo with a camera push-in when the Duck is defeated. Each one is under 30 LOC with a global `timeScale`.
4. **2.5D camera needs look-ahead and framing zones.** A side-on 3rd-person camera should lead the player in their direction of travel (about 2-3 units of look-ahead), use a vertical dead-zone so it does not bob on every jump, and pull back (FOV or distance) in the boss arena so the camera frames the tiger and the Duck together, keeping both in view.
5. **Telekinesis should be "grab, aim, release".** Hold to lift the nearest valid object (highlighted with an outline/emissive rim), the object floats with a sine bob, then release to throw it toward the cursor or facing direction. A tap does a radial push (shockwave ring). Two verbs, one button, which is how Control and Psychonauts handle it.
6. **Adaptive difficulty should be invisible and forgiving.** Track deaths per checkpoint; after 3 deaths, quietly add +1 max HP, slow the Duck's attack telegraph by 15%, and spawn an extra ray-gun pickup. Never make things harder automatically. That would undercut the "rivalry" fantasy.
7. **Accessibility is cheap to add and impresses judges.** A Celeste-style Assist Mode (game speed 50-100%, invincibility, infinite ammo), a colorblind-safe palette, remappable keys, and `navigator.getGamepads()` with `vibrationActuator.playEffect('dual-rumble', …)` (Chrome-supported) for hits and boss slams.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| Innovation Design | **8/10** | A diegetic loadout on the mascot model plus a hybrid HUD is uncommon in jam games; Force grab/throw adds a physics verb most platformers lack. It loses points because the core genre stays conventional. |
| Implementation Complexity | **M** | Juice, hotbar, and camera are low complexity. Telekinesis (object selection plus kinematic carry) and the diegetic attachments (bone/group parenting on a procedural tiger) are medium. Haptics are trivial but untestable headless. |
| UX Innovation | **8/10** | Hit-stop, look-ahead camera, and the boss slow-mo finisher give a big jump in game feel; a single-button two-verb Force interaction is elegant. |
| Accessibility Innovation | **7/10** | Assist mode, shape-coded VFX, and one-handed mode go beyond typical hackathon entries. Without screen-reader support or full remapping UI it falls short of AAA standards. |

## Cutting-Edge Design Systems
- **Juice bus:** a single `fx` module exposes `hitStop(ms)`, `addTrauma(0..1)`, `slowMo(scale, dur)`, `squash(obj, amt)`. Gameplay code emits events and the FX layer reacts. Keep every effect behind a "Reduce Motion" toggle.
- **Diegetic attachment map:** `tiger.sockets = {back, hip, handR, eyes}` as `THREE.Group`s. Equipping a slot moves the weapon mesh from its socket to `handR`. Ammo is shown as 4 small emissive meshes on the gun, dimmed as shots are spent and re-lit on a kill with a pop scale tween, which teaches the reload-on-kill rule without any text.
- **Hotbar HUD (DOM overlay):** 5 slots with key numbers, an icon, and a lock state (greyed silhouette until found). It pulses on pickup and shows an ammo sub-bar on slot 1. DOM keeps it crisp and cheap, with no extra render pass.
- **Colorblind-safe VFX language:** pair every color with a shape or motion. Fireblast uses orange plus a jagged, flickering cone. Laser Eyes uses red-magenta plus a thin straight beam with a white core. Force uses cyan plus a concentric ring ripple. Enemy hazards get a distinct pattern (stripes or outline). Use an Okabe-Ito-derived palette.
- **Camera rig:** a target node lerps toward `player.pos + velocity.x * lookAhead`, with a vertical dead-zone. A boss-mode "framing group" fits a bounding box around tiger and Duck and adjusts distance to keep both in view.

## Novel Interaction Paradigms
- **Context-sensitive punch:** the default box attack auto-chains to an uppercut when an enemy is airborne, so you get depth without new inputs.
- **Force + environment combos:** lift campus props (trash cans, dumbbells in the gym level, footballs on the stormy field) and throw them at the Duck. This makes the Force a puzzle tool *and* a boss mechanic (for example, the Duck's shield breaks only from a thrown object).
- **Power-up "showcase moment":** on first pickup, apply a 0.3x slow-mo, an orbit camera, the weapon flying to its socket, and the slot lighting up. This visibly changes what the hero can do, which satisfies the brief's requirement.
- **Rivalry banter as UI:** the Duck's taunts appear as world-space speech bubbles (CSS2D-style DOM projected via `Vector3.project`) rather than a subtitle bar.
- **One-handed mode:** all actions mapped to the left hand (A/D move, W jump, S Force, Space attack, 1-5 or Q/E select), or to the mouse alone (click attack, right-click Force, wheel cycles slots, auto-run toggle).

## Critical Insights
- **Readability first:** a diegetic display can only *reinforce* information. The required slot HUD must still be on screen at all times.
- **Hit-stop must use a separate clock.** Freeze gameplay `dt` but keep rendering and the HUD running, or the game looks crashed. Keep hit-stop under 100 ms or it feels laggy.
- **Screen shake is a top cause of motion sickness.** Cap the amplitude, default to moderate, and expose a slider.
- **Haptics are optional by nature.** Feature-detect `vibrationActuator`, call it in a try/catch, and never gate feedback on it.
- **Adaptive help must be opt-out and visible in settings.** Hidden help is fine, but players should be able to turn it off.
- **Don't over-scope.** The juice bus, hotbar, and look-ahead camera give 80% of the perceived polish. Telekinesis throwing is the signature feature. Do the radial wheel last, or cut it.

## Implementation Strategy
1. **Phase 1 (core, about 2h):** DOM hotbar with slots 1-5, lock states, and an ammo counter. A global `timeScale` and separate `realDt`. The `fx` module with hit-stop, trauma shake, and squash/stretch.
2. **Phase 2 (about 2h):** camera rig with look-ahead, dead-zone, and boss framing. Sockets on the tiger with holstered meshes and ammo pips. A pickup showcase moment.
3. **Phase 3 (about 2h):** Force grab/throw/push with object highlighting, plus a Duck shield that only thrown objects can break. Slow-mo plus push-in on boss defeat.
4. **Phase 4 (about 1h):** settings panel with Assist Mode (speed, invincibility, infinite ammo), Reduce Motion, shake slider, and one-handed preset. Gamepad polling with rumble. Adaptive-assist death counter.
5. **Testing:** expose `window.__game` hooks (`timeScale`, `equip(n)`, `trauma`) so headless Chrome tests can check slot switching, ammo reload on kill, and the win/fail state without needing real input or haptics.
