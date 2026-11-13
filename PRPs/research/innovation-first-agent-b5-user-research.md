# Agent B5: User Research - Innovation-First Approach

## Research Focus
Who will push *Mascot Mayhem: The Rivalry Run* hardest in a 3-5 minute localhost demo, and what do they need from it? This covers three power-user groups: speedrunners, action-game fans and technically curious judges. It also covers the advanced workflows they will try: weapon-swap combos across slots 1-5, the Ray Gun's reload-on-kill economy, Force + environment interactions, and learning the Duck boss's phases. For each, it asks how much new-mechanic learning a short session can hold, and how to teach it without slowing anyone down.

## Key Findings
1. **The loadout is the innovation surface.** Most platformer entries ship one power-up. This brief requires five slots (Ray Gun, Sword, Fireblast, Laser Eyes, Force) plus boxing. Power users will judge the game by how these *combine*, not by any one of them.
2. **Ray Gun "4 shots, reload on kill" is a self-explaining risk/reward loop.** Action fans pick it up in one or two cycles if the HUD shows the ammo pips refilling when an enemy dies. If the reload is invisible, players read it as a bug ("my gun stopped working").
3. **Force is the "wow" verb.** Telekinetic push/lift on crates, enemies and Duck projectiles gives the most emergent play with the least new content. Judges remember physics interactions more than extra levels.
4. **Speedrunners look for skips and cancels within minutes.** Punch-cancel into slot swap, Force-launch for movement, and a visible level timer turn a linear demo into something they replay.
5. **Demo time limits how much people will learn.** About one new verb every 30-45 seconds is the most a first-time player will absorb. Five powers across four levels fits this, as long as they are handed out one at a time.

## Quantitative Assessment
- **Innovation User Fit: 8/10.** The five-slot loadout plus Force physics clearly stands apart from standard platformer entries. It loses points because a brawler-platformer itself is a familiar format, so the innovation has to come from how the powers interact.
- **Learning Curve Acceptance: Medium.** Number keys 1-5 are an FPS convention that power users already know. Judges, though, will often play for under 3 minutes. Every power must be usable with one key and the main fire button, with no hidden inputs needed to finish.
- **Advanced Feature Demand: 7/10.** Action fans and speedrunners actively want combos, swap-cancels and a timer. Casual judges don't ask for them but reward them when they spot them. Depth should be available for those who look for it, never required.
- **Early Adoption Potential: 7/10.** A localhost three.js build that runs with no install is easy to try. Mascot rivalry gives teams and students a social reason to share it. It is held back by being a single-session demo with no persistence or leaderboard (a local best time in localStorage could partly fix this).

## Power User Personas
- **"Frame Hunter" (Speedrunner).** Plays the demo 3+ times and wants a run timer, a split per level, instant restart (R key) and movement tech. Will try Force-launching off crates and skipping the Gauntlet's middle. *Needs:* consistent physics, a visible timer, no unskippable cutscenes.
- **"Combo Chaser" (Action fan).** Comes from character-action games and character brawlers. Wants swap-mid-combo (punch, punch, 2-Sword finisher, 1-Ray Gun to finish off the kill), hit-stop and screen shake. *Needs:* swap with no delay, combo-feedback text, the ammo-on-kill loop made obvious.
- **"Under-the-Hood Judge" (Technically curious).** Opens DevTools and checks FPS, draw calls and whether it is "real" 3D. Rewards instancing (particles, Fireblast), skinned animation blending and clean shaders for Laser Eyes. *Needs:* stable 60 fps, an optional debug overlay (backtick key) showing FPS and entity count.
- **"Rival Alum" (Social power user).** Cares most about the Tiger vs Duck rivalry and the boss. Wants each boss phase to feel different and to "read" in a satisfying way. *Needs:* phase transitions with a clear tell, a health bar with phase markers.

## Innovation Adoption Patterns
- **Discover → Use → Combine → Master.** The first pickup of each power should force one use (a gate only that power clears). Only after that should the level put two powers in one room (e.g. Force-lift a crate, then Fireblast enemies grouped beneath it).
- **The Gauntlet (L3) is the combination test.** Its "new twist" should *require* a power combination, which teaches mastery without any text.
- **Boss phases should test the loadout.** Phase 1 is boxing/Sword reach. In Phase 2 the Duck flies, so Ray Gun/Laser Eyes are needed. In Phase 3 it throws objects, so Force sends them back. Each phase confirms a learned verb, so mastery feels earned in under 90 seconds.
- **Ammo economy builds habits fast.** Running out of Ray Gun shots pushes players to punch or use the Sword for a kill, which refills the gun. This "swap loop" is the fastest way to give a new player a power-user habit.

## Critical Insights
- **Invisible depth looks like no depth.** If combos and the reload-on-kill aren't shown on screen (pip refill flash, "+4" popup, combo counter), judges won't notice them.
- **No dead slots.** Unearned HUD slots should show a locked silhouette with a "?" hint ("Found in the Gym"). Empty grey boxes make players think the feature is broken.
- **Feel beats feature count.** Hit-stop of about 50 ms, camera shake, impact particles and audio pitch variation do more for "cutting-edge feel" than a sixth power. Polish the five that exist.
- **Fail fast, retry faster.** Respawning at a checkpoint in under 1 s keeps power users experimenting. Long death screens stop them experimenting.
- **Never punish exploring.** Force should affect *most* physics props. Players lose trust when a crate is inexplicably immune.

## User Education Strategy
1. **Contextual first-pickup cards.** On the first pickup, briefly slow time (about 0.3x for 1.5 s) and show a single-line card: icon + key + verb ("[5] THE FORCE: Hold Click to lift, release to throw"). Never repeat it, and let any input dismiss it.
2. **Loadout slot tooltips.** Hovering a slot or pressing it for the first time shows a short hint, e.g. "Ray Gun 4/4 — kills reload it." Slot pips stay visible all the time as a passive tutorial.
3. **Level design teaches before text does.** Each power gets a safe room to try it before it is needed under pressure.
4. **Hint escalation.** If the player is stuck for more than 10 s at a power gate, pulse the right HUD slot. After 20 s, show the key prompt.
5. **Power-user shortcuts.** Add an optional controls overlay (H key), instant restart (R), a run timer toggle and a debug overlay (backtick). These cost almost nothing to build and win over speedrunners and technical judges.
6. **End-screen recap.** Show time, kills, the longest combo and "powers used: 4/5". This rewards mastery and hints at what they missed, which encourages a replay.
