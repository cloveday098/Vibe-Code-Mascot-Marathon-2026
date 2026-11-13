# Agent A5: User Research - Speed-First Approach

## Research Focus
Who actually touches *Mascot Mayhem: The Rivalry Run* during the hackathon, what they need in their first 2 minutes, and the cheapest way to check the build against those needs. Speed-first means we optimize for **time-to-fun** (seconds from opening `localhost` to punching something) and **cost of failure** (seconds lost on a death). We rank depth and polish below both.

## Key Findings
1. **Most sessions last 1-3 minutes.** Judges and visiting teams rarely get past Level 1 unless the game gets them there. Level 1, plus a fast way to reach the boss, decides the impression.
2. **Controls are the #1 failure point.** The game has a 3rd-person camera, jump, punch, slots 1-5 and 4 power-ups, which is a lot of inputs for someone who has never seen it. Controls left unexplained read as "broken."
3. **Feedback beats content.** Players forgive plain box art. They do not forgive a hit with no flash or sound, a pickup that changes nothing, or a death without a reason.
4. **Judges check requirements, not playtime.** They will look for 4 levels, a power-up that visibly changes the hero, win/fail states and the boss Duck. A level-select or skip key lets them see all of it.
5. **Pointer-lock and audio-autoplay are silent killers.** If the title screen gets no click, the mouse won't lock and audio won't play. A "Click to Play" gate fixes both.

## Quantitative Assessment
- **User Need Alignment: 8/10.** The mascot rivalry (Tiger vs Duck) appeals to students right away, and boxing plus guns plus powers is easy to show off. It loses 2 points because 5 slots and 4 powers add a learning burden that 2-minute players can't absorb without staged unlocks.
- **MVP Acceptance Likelihood: H** if the journey below works end to end on a fresh browser. It drops to **L** if a tester hits a blank screen, an unlocked mouse or a soft-lock even once. Judges remember the first failure.
- **Critical Journey Score: 6/10 (current risk).** The journey has 8 links (load → title → controls → L1 → pickups → boss → win/lose → retry), and each one is a possible break. The flow is simple, but four levels plus a boss is a long chain to finish in a hackathon. It reaches 9/10 with debug skip keys and checkpoints.
- **Feedback Loop Efficiency: 8/10.** The build is static files served with `python3 -m http.server`, so a playtest needs only a URL on a laptop. A tester can play within about 10 seconds of a code change. It loses points because no telemetry exists unless we add a small on-screen stats overlay.

## Primary User Personas
| Persona | Goal | Time budget | Must see |
|---|---|---|---|
| **Judge Jordan** | Score against the rubric | 3-5 min | All 4 levels reachable, power-up effect, boss, win and fail screens, campus details |
| **Visiting Team Tess** (peer tester) | Try it, give honest notes, compare with her own team's game | 2 min | Instant start, clear controls, something fun in 30 s |
| **Student Fan Sam** | Beat the rival Duck, show off | 5-10 min, replays | Tiger personality, satisfying punches, boss taunts, retry loop |
| **Dev-Self Dana** (our team) | Test changes fast | 30 s per loop | Level-select, god mode, FPS/state overlay |

## Critical User Journeys
1. **Load → Title (<5 s):** The page opens with no console errors. The title shows the game name, the Tiger and a "Click to Play" button, which also starts pointer lock and audio.
2. **Controls (<15 s):** A single overlay shows WASD/Space/Mouse/Click = punch/1-5 = slots/Esc = pause. Controls are also listed on the pause screen.
3. **Level 1 (first 30 s):** The first enemy appears within 10 s of spawning and dies to a punch, with a hit flash, knockback and sound. The library and mascot statue are visible early.
4. **Pickups:** Each pickup has a glowing, bobbing mesh. When collected, it shows a banner with its name and key ("SWORD — press 2"), and the HUD slot lights up. The Ray Gun ammo counter (4) is always visible and refills on a kill with a "+RELOAD" popup.
5. **Boss:** The Duck has a large HP bar, a readable attack wind-up (about 0.5 s tell) and 2-3 phases. Players get at least one power-up before the fight.
6. **Win/Lose:** A full-screen VICTORY or DEFEAT shows the reason ("Fell off the stadium", "Duck got you").
7. **Retry (<3 s):** "R / click to retry" restarts from the last checkpoint, not from Level 1.

## Critical Insights
- **Give powers out one level at a time.** L1 has punch plus Ray Gun, L2 adds Sword/Fireblast, L3 adds Laser Eyes and The Force, and the boss uses all of them. Each level teaches one new verb.
- **Make every power visible.** Laser Eyes needs a visible beam from the head. The Force needs objects to rise and fly. Fireblast needs particles. If a judge can't *see* the change, it doesn't count toward the "visibly changes" requirement.
- **Checkpoints are not optional.** Put checkpoints at the start, middle and finish of each level (this also maps to the required level structure). Respawn takes 1 s and doesn't reset collected powers.
- **Add a "Judge Mode" level select** on the title (keys F1-F4, or a menu) so judges can reach the boss in 10 seconds.
- **Make L1 easy.** The first death should only happen after the player has learned to jump. Hard sections go in L3.

## MVP Validation Strategy
- **Hallway test every 60-90 min.** Grab someone who has never played and give no instructions. Watch silently for 2 minutes and log: time to first move, time to first punch, deaths, "what do I do?" moments, and whether they found a power-up.
- **Two-question exit survey:** "What was confusing?" and "What was most fun?" Write the answers on a shared sticky-note list and fix the top confusion before the next test.
- **First-build acceptance checklist (go/no-go):**
  - [ ] Loads from `python3 -m http.server` in Chrome with 0 console errors
  - [ ] Title → play in 1 click, with pointer lock working
  - [ ] Controls overlay visible
  - [ ] Tiger moves, jumps, punches, and enemies react
  - [ ] At least 1 power-up collected and visibly changes the hero, and HUD slots 1-5 are shown
  - [ ] Ray Gun 4-shot counter works and reloads on a kill
  - [ ] Death → respawn at checkpoint in ≤3 s
  - [ ] Duck boss reachable (via skip key) and beatable, with VICTORY and DEFEAT screens
  - [ ] Stays at 30+ FPS on a typical laptop
- **Automated smoke test:** Use the headless Chrome command from `PRPs/ai_docs/threejs_r160_game_patterns.md` to catch blank screens and console errors before every hallway test.
- **Debug overlay (toggle with a backtick key):** Shows FPS, level, checkpoint, deaths and elapsed time, so we get playtest numbers with no analytics.

## Pain Point Analysis
| Pain point | Who it hits | Severity | Speed-first fix |
|---|---|---|---|
| Doesn't know controls | All | High | Persistent controls overlay plus prompts in the world ("Press 1") |
| Mouse not captured, or camera spins | Tess, Judge | High | Click-to-play gate, clamped camera pitch, sensitivity slider later |
| No hit feedback | All | High | Flash, knockback, short sound, damage numbers |
| Too hard / repeated deaths | Sam, Tess | High | Checkpoints, generous jump forgiveness (coyote time), easy L1 |
| Can't tell what a power-up does | Judge | Med | Name/key banner plus a clear visual effect |
| Can't reach later levels | Judge | High | Level-select / skip keys |
| Death with no explanation | All | Med | Fail screen with a cause, plus instant retry |
| Lost / unsure where to go | Tess | Med | Linear paths, a glowing finish gate, an arrow toward the objective |
| Blank screen on load | All | Critical | Loading text, error banner, smoke test before each demo |
