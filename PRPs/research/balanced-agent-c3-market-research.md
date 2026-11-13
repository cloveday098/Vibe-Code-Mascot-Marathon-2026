# Agent C3: Market Research - Balanced Approach

## Research Focus
"Market" here means three audiences: (1) hackathon judges scoring against the brief, (2) competing teams whose builds ours will be compared with, and (3) the school audience (students, athletics, admissions) who might keep using the game afterward. The question: how do we position "Mascot Mayhem: The Rivalry Run" so it's **reliable enough to check every box** and **memorable enough to win**, without the overreach that sinks ambitious 3D entries? Sources: the challenge brief, common hackathon judging rubrics (Devpost/MLH-style: completeness, technical difficulty, creativity, polish/presentation), and general game-jam patterns (Ludum Dare, GMTK, Global Game Jam). No new web data was gathered. These are well-established patterns.

## Key Findings
1. **Judges score against a checklist first, then on "wow."** Rubrics usually weight completeness/functionality at 25-40%. A missing requirement such as no level 4, no win/fail screen, or a power-up with no visible effect costs more than any polish gains back. Judges usually play for only 2-5 minutes, so the first 60 seconds decides most of the impression.
2. **The field splits into two groups.** *Fast-movers* ship 2D or simple jam games that are complete and polished but visually modest, and often skip the 3D requirement. *Over-ambitious 3D teams* chase physics, skinned models, and big worlds, then demo a broken build with a camera clipping through walls, no boss, and a crash on level 3. The open space is a **complete, stable 3D game with one spectacular moment**.
3. **The user's requirements already set this game apart.** The 5-slot loadout (punch default, 4-shot Ray Gun that reloads on a kill, Sword, Fireblast, Laser Eyes, The Force) is far more combat depth than a typical jam platformer. The risk is breadth: seven abilities, each half-finished, reads worse than four that feel good.
4. **Judges remember the boss fight.** Level 4 (Tiger vs Duck) is the natural climax and the easiest place to show off. A boss with 2-3 telegraphed phases and a health bar is a known, proven pattern that looks impressive at low risk.
5. **"The Force" is the best single standout feature.** Telekinetic lift/push on 3D objects is visually striking, easy to understand at a glance, and uncommon in jam games. Throwing a crate or a Duck minion is clip-worthy. A kinematic version (lift, hover, impulse) is enough, so no physics engine is needed.
6. **Testability is part of reliability.** The brief requires a build another team can try. That calls for a one-command launch (`python3 -m http.server`), an on-screen controls card, and a level-select/debug skip so judges can reach the boss.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| **Market Balance** | **8/10** | Proven genre (side-scroll-inspired 3D platformer) plus a vendored three.js r160 with verified patterns makes reliability achievable, while the loadout and boss supply the wow. The point lost is for scope risk from seven abilities. |
| **Competitive Positioning** | **High** | It beats 2D fast-movers on spectacle and the 3D requirement, and beats over-ambitious 3D teams on completeness and stability. Few teams land in both columns. |
| **Customer Preference Fit** | **8/10** | Judges: every requirement can be explicitly demonstrated. Students: mascot rivalry and combat variety appeal strongly. It falls short of 10 because 3D platforming camera and depth perception can frustrate first-time players unless tuned. |
| **Sustainable Advantage** | **6/10** | School-mascot branding gives it real reuse value (athletics pep events, open-house kiosks, admissions sites) since it runs in the browser with no install. It is limited by placeholder/primitive art and no content pipeline. Value lasts only if the levels are data-driven and easy to reskin. |

## Market Positioning Strategy
**"The complete one with the boss fight."** Position against both rival groups:
- vs. 2D fast-movers: "Real 3D, third-person, four full levels, and a boss."
- vs. over-ambitious 3D: "Every requirement works on the first try, and you can skip straight to the Duck."

**Proven core + one standout:** proven = run/jump/punch platforming, checkpoints, 4 linear levels, HUD, win/fail screens. Standout = **The Force** used as a mechanic in the Gauntlet *and* the boss. For example, the Duck lobs objects that the Tiger catches and throws back. One feature that carries across levels reads as design intent, not a tacked-on gimmick.

## Customer Segment Analysis
| Segment | What they want | How we serve it |
|---|---|---|
| **Judges (primary)** | Requirement coverage, stability, clear demo, a memorable moment | Requirements checklist in the README/title screen, level-select, 3-minute demo script that ends in the boss fight |
| **Competing teams (testers)** | Can launch it and understand it fast | One command, a controls overlay, forgiving difficulty, no pointer-lock traps |
| **Students/school audience** | Mascot pride, rivalry humor, short sessions | Recognizable campus landmarks (library, mascot statue, quad), Duck taunts, satisfying hit feedback |
| **Athletics/admissions (post-event)** | Shareable, branded, safe, runs anywhere | Static-file browser build, school colors, kiosk-friendly 5-10 minute run, easy text/color reskin |

## Critical Insights
- **A crash in the demo costs more than any missing feature.** Spend the last 20-25% of the time on hardening, not features.
- **Weight the abilities, don't spread effort evenly.** Punch, Ray Gun, and The Force should feel polished. Sword, Fireblast, and Laser Eyes can share one projectile/hitbox system with different visuals and stats, which is cheap breadth.
- **"Visibly changes what the hero can do"** is literal: every pickup needs a HUD slot lighting up, a color/aura change, and a new verb. Judges will check this.
- **Both the 3D requirement and the camera can lose points.** A constrained "2.5D" follow camera (side-on, slight angle) keeps the platformer readable and avoids the most common 3D-jam failure.
- **The boss alone is not the standout.** Every complete team will have a boss. What sets ours apart is *how* it's fought: using The Force against it.

## Strategic Recommendations
1. **Lock the requirements first:** 4 levels with start/middle/finish, win/fail states, and the HUD with 5 slots, built as playable gray-box before any polish.
2. **Pick one hero feature, The Force, and build it into level 3's twist and the boss phases.**
3. **Make the boss the finale:** 3 phases, telegraphed attacks, a health bar, and a celebratory win screen in school colors.
4. **Build for judges:** level-select/skip key, controls card, README with a requirements checklist and launch command, plus a headless-Chrome smoke test from the ai_docs.
5. **Use a side-on 3rd-person follow camera** to keep platforming readable.
6. **Structure for reuse:** keep level layouts and branding (names, colors, text) in data objects so athletics or admissions can reskin it later. Mention this in the pitch as the "after the hackathon" story.
7. **Rehearse a 3-minute demo:** Campus Dash landmarks (30s), a power-up pickup (30s), a Gauntlet Force puzzle (45s), then the boss fight to the win screen (75s).
