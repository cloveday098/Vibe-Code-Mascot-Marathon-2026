# Mascot Mayhem: The Rivalry Run — Maryville College Edition

**Maryville College** · by Jessee, Juan, Chance & Grant

**Stripes the Tiger** vs **THE SINGULARITY**: a 3D, third-person, side-scrolling platformer brawler. It's built with three.js r160 and runs fully client-side. All art, sound and music are generated in code; there are no asset files.

## Run it
```bash
python3 -m http.server 8080
# open http://localhost:8080
```
No install and no build step. ES modules need a local server (or any static host, e.g. Vercel), so `file://` won't work.

## Controls
| Action | Keys |
|---|---|
| Move | A/D or ←/→ |
| Jump (hold for higher) | Space / W / ↑ |
| Box (3-hit combo, the 3rd hit is an uppercut) | J / Left-click |
| **Fire the Ray Gun** | **E** |
| Select loadout | 1–5, mouse wheel, Q |
| Use selected item | K / Right-click (hold for Laser Eyes) |
| Camera · Pause · Mute · Help | C · P/Esc · M · H |

## Loadout
1. **Ray Gun**: 4 shots; any KO (or wrecked car) reloads it. Press **E** any time.
2. **Sword**: hidden on the ledges above the Covenant Stone (Level 1).
3. **Fireblast**: on the billboard catwalk (Level 2).
4. **Laser Eyes**: on the conference stage (Level 3). Hold to fire; it overheats.
5. **The Force**: on the hotel balcony (Level 3). A push wave that stuns enemies and knocks the AI's logo orbs back at it.

## Levels
1. **Maryville College**: jump off the Anderson Hall bell tower, stomp goomba-style suits, pass the Covenant Stone, and leave campus past the MC sign with the Scottie dog on top.
2. **Highway to Gatlinburg**: jump on and over traffic. Red cars drive erratically, revving, lunging and hopping to smoosh you. Ends at the hotel with the big "ACM Conference TODAY!" sign.
3. **ACM Conference**: an old hotel with falling projectors and chairs (red rings warn you) and angry ACM members to stomp. Escape by jumping down the elevator shaft.
4. **AI Final Boss**: THE SINGULARITY, a giant brain in a tank. Its attacks are branded with AI company emblems: Hallucination Rain, Prompt Injection orbs, the Context-Window Laser, Autonomous Agents, and Neural Slam (when it crashes down it takes double damage). At 50% health its glass shatters and it speeds up. Unplug it and grab the Spirit Trophy.

The AI company emblems are original parody stand-ins (`AI_BRANDS` in `src/models.js`), so rename them freely.

## For testers and judges
- The title screen has a **level select** and **Easy mode** (9 lives). Starting at a later level gives you the powers from the earlier levels.
- `?level=4` jumps straight to the boss.
- `?test=1` runs the built-in self-test (27 checks) and shows the results on screen.
