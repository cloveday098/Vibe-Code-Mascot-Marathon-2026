# Agent B3: Market Research - Innovation-First Approach

## Research Focus
"Market" here means three audiences: (1) **hackathon judges**, who score the entry; (2) **competing teams**, who set the baseline we are compared against; (3) the **school and fan audience** (students, athletics and spirit groups, CS faculty) who play the demo and talk about it. The question: in *Mascot Mayhem: The Rivalry Run*, does going innovation-first win with these audiences? That means a 3D third-person take on a side-scroller prompt, a 5-slot combat loadout, and physics-driven "Force" telekinesis. And where does that ambition turn into a risk?

## Key Findings
1. **Judging rubrics reward ambition, but only when it runs.** Typical hackathon rubrics (Devpost-style, MLH and university events) weight about four areas roughly equally: Technical Complexity/Execution, Creativity/Originality, Design/Polish, and Completeness/Adherence to the prompt. An ambitious entry can win 2 of the 4 outright, but it loses Completeness and Polish if the demo stalls. Judges usually get 3-5 minutes per entry, so the first 30 seconds decide most of the impression.
2. **The prompt already raises the floor.** The brief requires 3D, three.js and a third-person camera, so "it's 3D" does not set us apart. Every team starts there. What sets an entry apart is how the side-scroller is reinterpreted (a 2.5D lane rail, a camera that moves between side and chase views), the *feel* of combat, and physics interactions no other team will have.
3. **Expected competitor baseline:** most teams under time pressure will ship an extruded 2D platformer seen from behind the hero. That means one attack, one power-up, flat-shaded box levels, and a boss that just has hit points. Even a modest loadout system (5 visible slots, a Ray Gun with ammo and reload-on-kill) is above that baseline.
4. **Telekinesis is the memorable "clip moment".** Physics play (lifting a dining-hall table and throwing it at the Duck, pushing a stack of library books) is the kind of moment people film on their phones. Games like *Control* and *Half-Life 2*'s gravity gun show how much "throw the environment" appeals. A cheap kinematic version (raycast pick, lerp to a hover point, apply velocity, simple AABB hits) gets about 80% of the wow for about 20% of the cost of a full physics engine.
5. **Ambition backfires predictably.** The most common demo failures are: a black screen from asset or CORS errors when opened via `file://`, the frame rate collapsing on judge laptops with integrated GPUs, pointer-lock and focus confusion, soft-locks in late levels, and a boss that is never seen because levels 1-3 are too hard. A judge who cannot reach Level 4 scores the boss at zero.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| **Innovation Market** | **8/10** | Judges and gamers clearly reward visible technical ambition. It is capped below 9 because rubrics also weight completeness, and the 3D requirement is shared by every team. |
| **Differentiation Potential** | **High** | The 5-slot loadout, Force physics, and laser-eyes/fireblast visual effects together are uncommon in hackathon games. The 3D reinterpretation of a side-scroller is a talking point if the camera framing is deliberate. |
| **Early Adopter Reach** | **7/10** | Gamers and CS faculty respond to it right away. School-spirit audiences respond to the Tiger vs Duck rivalry more than to the tech. Reach is limited because the demo runs only on localhost. |
| **Competitive Advantage** | **7/10** | Strong if stable. Single-file three.js with no build step is low-risk to run. The advantage drops to about 4/10 if any level soft-locks or the frame rate drops below 30 on a mid-range laptop. |

## Market Positioning Strategy
- **Positioning line:** "A rivalry brawler-platformer: a classic side-scroller rebuilt in 3D, with a full combat loadout and telekinetic physics."
- **Lead with the feel of combat, not the features.** The first 30 seconds of the demo should show punch, then switching to the Ray Gun (4 shots, reload on a kill), then a Force-throw. Use the loadout HUD as a visual proof of depth.
- **Treat the side-scroller heritage as a deliberate design choice.** Mostly use a side or 3/4 chase-camera rail so the side-scroller lineage is obvious, and open into full 3D in the arena and boss levels. This shows we followed the prompt *and* innovated on it.
- **The rivalry story is the emotional hook.** Show Tiger vs Duck at the start, put the Duck mascot taunting the player in every level, and make the boss arena a stadium. That turns the tech into something fans can rally behind.

## Early Adopter Analysis
| Segment | What they value | Hook |
|---|---|---|
| Student gamers | Game feel, combos, moments worth filming | Force-throw objects at the Duck; laser eyes; screen shake and hit-stop |
| CS faculty / technical judges | Clean architecture, real-time 3D, physics, no dependencies | Vendored r160, no build step, a 60fps target, readable systems (loadout state machine, weapon registry) |
| Athletics / school-spirit / marketing | Mascot identity, recognizable campus, shareable content | A recognizable quad, library and mascot statue; school colors; a rivalry win screen worth screenshotting |
| Other teams (peer testers) | "Can I just play it?" | One-command launch (`python3 -m http.server`), an on-screen controls card, a level-select/skip key |

The best early-adopter path is **gamers to faculty**: students' excitement during the demo is social proof that judges notice.

## Critical Insights
- **The most important rule: a demo that works beats a feature that impresses.** Every innovative feature needs a fallback. For example, if the Force fails to find a target, give a radial push instead of doing nothing.
- **Visibility to judges is the whole point.** A feature a judge never sees counts as zero. Add a debug/level-select key (for example F1-F4) and a "judge mode" with more health, so all four levels and all five loadout slots can be shown in under 3 minutes.
- **Performance is part of the market requirement.** Target integrated GPUs: low-poly primitives, instancing for crowds and projectiles, capped shadow maps, pooled particles. Losing frame rate on stage reads as "broken".
- **Every power-up must change the game visibly** (that is also a brief requirement). Make each one visually distinct (beam, flame cone, purple Force aura) so a quick look tells the judge it is a separate mechanic.

## Strategic Recommendations
1. **Build in tiers:** Tier 1 (must ship) is all 4 levels, win/fail states, punching, Ray Gun, HUD and one power-up. Tier 2 is sword, fireblast and laser eyes. Tier 3 is Force physics polish, camera transitions and juice. Never start Tier 3 before Tier 1 is playable end to end.
2. **Make the Force the signature feature,** built kinematically (no physics engine). Design the boss fight around it, for example by throwing the Duck's own projectiles or bleachers back at it, so the most innovative mechanic carries the climax.
3. **Script the demo:** a 3-minute walkthrough with level-skip keys, ready to go before judging starts. Test it in headless Chrome and on the weakest laptop available.
4. **Add cheap features that look advanced:** hit-stop, screen shake, a camera FOV punch on firing, emissive bloom-like glow from additive sprites, and the Duck's taunt text. They cost little and are easy for anyone watching to notice.
5. **Ship a README and a controls overlay** so other teams can test without help. This turns the "testable build" requirement into a strength.
6. **Freeze features at about 75% of the time budget.** Use the rest for bug-fixing, balance (make sure an average player reaches the boss) and rehearsing the demo.
