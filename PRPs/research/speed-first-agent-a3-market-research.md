# Agent A3: Market Research - Speed-First Approach

## Research Focus
Who we are competing against and who decides: (1) the competing teams answering the "Mascot Mayhem: The Rivalry Run" prompt, (2) the judges and playtesters who score a localhost demo in a few minutes, and (3) what the browser-game and game-jam scene (js13k, Three.js Journey challenges, Ludum Dare, Game Off, Gamedev.js Jam) rewards in a first playable. The question for a speed-first team is which parts of the work judges actually see, and how to get those in front of them before polish time runs out.

## Key Findings
1. **Most competing entries will be 2D or "2.5D".** Many teams will reach for Phaser or Kaboom (side-scroller, sprite rectangles) because the prompt says "inspired by side-scrolling platformers." This brief requires 3D three.js with a 3rd-person camera, so teams that comply will mostly ship flat box-geometry levels with a basic chase camera. Teams that ignore the constraint lose requirement points.
2. **Judges score completeness first and polish second.** Jam and hackathon rubrics usually weight "does it run / meets the brief" ahead of "fun" and "presentation." A judge with a checklist (4 levels, power-up, win/fail, boss) will mark an entry down for a missing level far more than for programmer art.
3. **Judges play for 2-5 minutes, usually less.** Most will never reach Level 4 on their own. Entries that let judges skip to any level (level select, or keys 1-4 on the title screen, or a debug hotkey) get the boss fight and every power-up seen. Entries without this have content that never gets judged.
4. **The first 30 seconds decide the impression.** Jam winners (js13k, Gamedev.js) share instant load, controls shown on screen, and movement that responds at once. A three.js scene that loads with no build step (vendored module, `python3 -m http.server`) is already ahead of entries that ask judges to run `npm install`.
5. **Clear signals beat detailed models.** Low-poly or primitive-built characters with strong silhouettes and colors (orange/black tiger, yellow/green duck), screen shake, hit flashes, particles and a large HUD read as "polished" at much lower cost than modeled assets. Juice per hour is the best polish return.
6. **The user's extra requirements set us apart.** The 5-slot loadout (Ray Gun with reload-on-kill, Sword, Fireblast, Laser Eyes, The Force) goes far beyond the base prompt's "one power-up." Competitors will typically ship one or two power-ups, so a visible, working loadout is our clearest differentiator.

## Quantitative Assessment
- **Market Opportunity: 8/10.** The prompt is broad, and the hardest requirement (3D plus a third-person camera plus four levels) will thin out the field. Few teams will hit every checklist item in 3D.
- **Competitive Advantage: High.** Running three.js with no build step, verified r160 patterns already documented in `PRPs/ai_docs`, a headless-Chrome test path, and a loadout well beyond what the brief asks for. The advantage only holds if all four levels actually ship.
- **Speed-to-Market Value: 9/10.** A complete, playable vertical slice early leaves the rest of the time for juice and bug fixes. In a judged demo, a game that is complete but rough beats one that is polished but missing levels.
- **User Acceptance: 7/10.** Judges and other teams like playful mascot rivalries. The main risks are 3D-camera motion sickness and unclear controls, which lower this score unless we fix them.

## Competitive Analysis
| Competitor archetype | Likely strengths | Likely weaknesses | Our counter |
|---|---|---|---|
| 2D Phaser/Kaboom side-scroller | Fast, tight platforming, sprite charm | Fails the 3D/3rd-person constraint | Full compliance, plus 3D "wow" |
| Ambitious 3D (GLTF models, physics libs) | Looks impressive in screenshots | Unfinished levels, load errors, broken boss | Primitives plus juice, all 4 levels done |
| Minimal 3D box-runner | Complete and stable | Bland, one power-up, weak boss | Loadout HUD, five abilities, staged duck boss |
| Over-scoped "open campus" | Novel exploration | No clear start/middle/finish | Linear lanes with obvious goal gates |

## Market Positioning Strategy
Present the entry as **"the complete one, with the most toys."** The demo story is: open localhost, the title screen shows controls and a level select, judges punch through Campus Dash (library and mascot statue clearly labeled), pick up the Ray Gun and see the 4-shot counter reload on a kill, then jump to the Duck boss and win with The Force or Laser Eyes. Every rubric item should be visible within 3 minutes. Our edge is reliability and breadth, not graphics.

## Critical Insights
- A judge who cannot reach Level 4 cannot score it, so the level select is not optional.
- The win screen and the fail screen are both judged. Make them big, explicit, and give each one a restart.
- A recognizable campus needs signage more than modeling. Text sprites like "LIBRARY" and a tiger statue on a plinth count.
- A "playable build another team can try" needs a README with a one-line run command and a controls list.

## Strategic Recommendations
1. Hour-one target: hero moving under a 3rd-person camera, punch, and one enemy. Then stub all four levels as start-to-finish gates before deepening any one of them.
2. Ship the level select and debug keys (unlock all slots) early. They help judges and our own testing.
3. Keep the loadout HUD on screen at all times, with each slot locked or unlocked. It makes the differentiator obvious.
4. Give the Duck boss two or three telegraphed phases with a health bar. That is the climax judges remember.
5. Spend the remaining time on juice (hit-stop, particles, camera shake, simple WebAudio blips), not on models.
6. Run a cold-start test: a fresh browser, the README instructions only, and no console errors.

## Risk Assessment
- **Scope creep from five abilities (High).** Mitigation: share one projectile/hitbox system across the Ray Gun, Fireblast and Laser, and treat The Force as a radial impulse.
- **3D camera and platforming feel (Medium).** Mitigation: forgiving jumps (coyote time), wide platforms, and a camera that never clips through walls.
- **Unfinished levels (High impact).** Mitigation: stub all four levels first, then deepen them.
- **Demo-day breakage (Medium).** Mitigation: vendored three.js, no CDN, and a headless smoke test before submitting.
- **Perception of "programmer art" (Low to Medium).** Mitigation: a consistent palette, mascot silhouettes, and plenty of juice.
