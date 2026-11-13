# Agent C5: User Research - Balanced Approach

## Research Focus
Who plays *Mascot Mayhem: The Rivalry Run*, in what setting, and how can one build serve both first-time players and people who want depth? The approach here is balanced: there is a core path anyone can finish (move, jump, punch), and the five-slot loadout (Ray Gun, Sword, Fireblast, Laser Eyes, The Force) adds optional depth that players take on gradually, without being forced to. The setting is a hackathon localhost demo that strangers and judges play cold, often for under 5 minutes.

## Key Findings
1. **Most players will have about 3 minutes and no tutorial.** Judges and passers-by decide in the first 30 seconds whether a game "works." The first time a player touches a control, it has to be familiar: WASD/arrows to move, Space to jump, J/left-click to punch.
2. **Punching has to be enough to win.** If the boss Duck can only be beaten with a specific power, casual players get stuck and the demo fails. Powers should be accelerators (faster, flashier, safer), not gates.
3. **Five powers is too many to introduce at once.** Mainstream players can learn about one new verb per level. Spread out, the loadout becomes a sense of progress instead of a pile of mechanics.
4. **Number keys 1-5 with a visible HUD are a known convention** (FPS and MMO hotbars). Players adopt them quickly as long as an empty slot looks empty and a newly filled slot flashes with its key shown.
5. **Fast feedback beats depth for retention.** Hit-stop, knockback, a damage number or flash, an ammo pip counter, and respawning in under 2 seconds at a checkpoint matter more to perceived quality than adding a sixth mechanic.
6. **The Ray Gun economy (4 shots, reload on a kill) is a skill-reward loop that experienced players enjoy and casual players can ignore.** That only holds if the ammo is visible (4 pips) and an empty gun falls back to punching instead of "clicking" with no effect.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| User Balance | **8/10** | The punch/jump core serves novices, and loadout synergies plus Ray Gun ammo management serve experienced players. It loses points because 5 powers across 4 levels is dense and the Gauntlet risks overload. |
| Mainstream Appeal | **High** | The school-mascot rivalry, a tiger beating up a duck, and familiar platformer controls give it instant context. No genre literacy is needed. |
| Feature Adoption Comfort | **7/10** | Keys 1-5 and pickups that announce themselves are comfortable. The Force (push/lift) is the least intuitive power and needs the clearest targeting cue. Laser Eyes and Fireblast could be confused if their inputs are similar. |
| Growth Potential | **8/10** | The slot system scales naturally (more powers, combos, speedrun timer, leaderboard in localStorage). The campus theme can be reskinned for any school. |

## Mainstream User Personas
**1. Casual Student (Maya, plays mobile games and some Mario).** Goal: have fun and finish the game. Pain points: precise jumps, unclear objectives, losing progress. Needs: generous checkpoints, coyote-time jumping, a clear goal marker (flag or banner), and punch-only viability.

**2. School-Spirit Fan (Dev, cheers at games, rarely plays 3D games).** Goal: watch the Tiger humiliate the Duck. Pain points: camera confusion and dying before reaching the boss. Needs: recognizable campus landmarks (mascot statue, library), a satisfying and comedic boss defeat, and an optional "easy" health buffer. Most likely to screenshot and share.

**3. Judge with 3 Minutes.** Goal: verify the requirements (4 levels, power-up, win/fail, HUD) quickly. Pain points: long intros, hidden features, crashes. Needs: start within 1 click, controls overlay visible on screen, a level-select or skip key (e.g. a debug `N` key or a menu), and each power visibly demonstrated early. Judges reward *seeing* the feature list rather than reading it.

**4. Experienced Gamer (Sam, plays Hollow Knight and Celeste).** Goal: mastery and optimization. Pain points: floaty controls and trivial combat. Needs: tight jump arcs, combos (Force-lift a duck, then laser it), ammo-economy decisions, secret sword placement off the main path, and a completion timer.

## Balanced User Journey Strategy
**Core journey (everyone):** Title, then "Press Enter / Click to Play," then a 5-second on-screen control card, then Level 1. A player using only movement, jump and punch can reach every finish flag and defeat the Duck (the boss gets punch-vulnerable windows, e.g. stunned after a dive attack).

**Gradual power introduction (one new verb per level):**
| Level | New element | Introduction pattern |
|---|---|---|
| 1. Campus Dash | Punch + **Ray Gun (slot 1)** given at the start | A safe target dummy by the mascot statue; ammo pips shown and reload on a kill demonstrated |
| 2. Themed (Gym/Tunnel) | **Sword** (slot 2), found on the main path | Pickup banner "SWORD - press 2"; the following enemies have shields that the sword breaks faster |
| 3. Gauntlet | **Fireblast** (slot 3) + **Laser Eyes** (slot 4) | Fireblast on the main route, Laser Eyes in an optional side alcove (reward for exploring) |
| 4. Showdown | **The Force** (slot 5) at the arena entrance | Lift/push boss projectiles or debris back at the Duck. It is powerful but optional |

**Advanced depth (opt-in):** Powers persist across levels; secret areas; ammo economy; combo damage; level timer and grade on the win screen.

**Feedback loop targets:** input-to-action under 100 ms; hit flash, a 50-80 ms hit-stop and a sound on every connect; respawn at a checkpoint in under 2 seconds; a clear fail screen ("The Duck wins this round - Retry [R]") and a win screen with stats.

## Critical Insights
- **Never gate progress on a power.** That is the biggest drop-off risk for personas 1-3.
- **The HUD teaches.** Slots 1-5 are always visible: locked slots greyed out with a lock icon, the active slot highlighted, ammo shown as pips. This replaces a tutorial.
- **Inputs must be consistent:** every power fires with the same attack button (J/click) once its slot is selected. Do not add new keys per power.
- **The 3rd-person camera is the hidden difficulty spike** for non-gamers. Use an auto-follow camera with a fixed-ish angle on side-scrolling segments, and keep mouse-look optional.
- **Fail states should feel cheap, not punishing.** Keep the loadout after death and restart at the checkpoint, not at the level start.

## Adoption Strategy
1. **First 10 seconds:** familiar controls, a big readable controls overlay, and the first punch lands on something that reacts dramatically.
2. **First 60 seconds:** the Ray Gun's 4 shots and reload-on-kill are demonstrated against dummies, and the Level 1 landmarks are clearly visible.
3. **Per level:** exactly one new power, announced with a pickup banner naming the key, plus a safe space to try it.
4. **Judge path:** a level-select or skip key, and an F1/H help overlay listing all features, so every requirement can be checked in about 3 minutes.
5. **Mastery hooks:** a timer, hidden pickups and combo damage are visible on the win screen to invite replay without burdening first-timers.
6. **Playtest validation:** do 2-3 cold playtests with non-team members, watch for where they stop, and fix the top friction point before the demo.
