# Agent C4: Design Research - Balanced Approach

## Research Focus
How to pair UI conventions players already know (survival/FPS hotbar, hearts, top-of-screen boss bar, ammo pips) with a few modern "juice" touches for *Mascot Mayhem: The Rivalry Run*, so the HUD can be read at a glance and the game feels good to play. Everything has to be buildable in one hackathon on three.js r160 with no build step. The second goal is to give each of the 4 levels its own look, using only primitives, fog, lights and colour.

## Key Findings
1. **Hotbar 1–5 is a solved convention.** Minecraft, Valheim, Fortnite and CS all use a bottom-centre row of numbered squares with a highlighted active slot. Players press number keys without being told to. We should copy the layout and invent only the content. Empty slots appear as dim padlocks, which hints that more items are hidden in the map.
2. **Hearts suit platformers better than HP bars.** Discrete hearts (Mario 3D World, Zelda) make each hit easy to read and fit one-hit hazards like pits and flood water. Use 5 hearts, top-left. The boss uses a continuous bar.
3. **Boss bar at top-centre with name and title** (Dark Souls, Hollow Knight, Cuphead) clearly marks "this is the finale". Add a phase notch at 50% so the Duck's phase change is visible.
4. **Ammo pips beat numbers for small counts.** 4 shots fit as 4 glowing pips under slot 1. When empty they turn grey and pulse "KO an enemy to reload". This teaches the reload-on-kill rule with no tutorial.
5. **Modern touches that cost little:** a pickup toast ("FIREBLAST acquired — press 3") with a one-line tooltip; a slot glow or bounce on a new item; radial cooldown sweeps on power slots (CSS `conic-gradient`, no canvas); floating damage numbers; screen shake capped at small amplitude.
6. **DOM overlay over canvas is the right layer for HUD.** HTML/CSS is crisp at any DPI, easy to style, and costs nothing in the render loop. 3D-space UI (damage numbers) can be projected with `Vector3.project()` into absolutely positioned DOM spans.

## Quantitative Assessment
- **Design Balance: 8/10.** The conventions carry readability and the juice is layered on top, never required. It loses points because 5 slots plus hearts plus a boss bar plus toasts can crowd the screen. Strict placement zones mitigate this.
- **Progressive Enhancement: HIGH.** Every juice feature is a pure add-on that hooks into events (`onHit`, `onPickup`, `onSlotChange`). Removing any one breaks nothing.
- **User Familiarity: 9/10.** The hotbar, hearts and boss bar are near-universal. Telekinesis ("The Force") is the only verb that needs a tooltip.
- **Innovation Integration: 7/10.** Kill-to-reload pips, the Force lift/push and the level twists add freshness. The HUD layout is deliberately conventional, because demo judges have about 30 seconds to understand it.

## Balanced Design System
**Layout zones (16px safe margin):**
- Top-left: 5 hearts, with a level name / objective line beneath.
- Top-centre: boss bar (level 4 only), "MALLARD MAXIMUS — The Rival", with a phase notch.
- Top-right: collectibles counter and timer (optional).
- Bottom-centre: hotbar 1–5, each slot 56px, active slot raised 4px with a gold border. Default fists are shown as the "no slot selected" state (or bind fists to key 0 / Q). Suggested slots: 1 Ray Gun (4 pips), 2 Sword, 3 Fireblast, 4 Laser Eyes, 5 The Force.
- Centre-low: pickup toast (2.5s, slide up and fade).
- Centre: win/fail cards ("RIVALRY WON!" / "KNOCKED OUT — R to retry").

**Palette:** tiger orange `#F28C28` and black for the hero UI, duck green/yellow `#2E8B57`/`#F5C518` for the boss bar. Hearts are red `#E63946` with a white outline. Every element sits on a dark translucent backplate (`rgba(0,0,0,.45)`) so it reads against any sky.

**Type:** one chunky web-safe stack (`"Trebuchet MS", system-ui, sans-serif`), with numbers in bold and a 2px text-shadow outline.

**Level visual identity:**
| Level | Palette / lighting | Landmarks (primitives) | Hazard identity |
|---|---|---|---|
| 1 Campus Dash | Sunny: blue sky, `HemisphereLight` warm, light fog | Brick library with columns and steps; tiger statue on a plinth (reuse the hero mesh, grey stone material); dining hall with awning and tables; green quad | Gentle gaps, campus "security bots" |
| 2 Stormy Stadium (or Steam Tunnel) | Dark slate, dense fog, lightning flash (ambient spike for 0.1s), rain `Points` | Bleachers, goalposts, floodlights / pipes and grates | Wind gusts push the player; slippery turf; lightning-strike telegraph circles |
| 3 The Gauntlet | Dusk turning to night, purple/orange | Mixed props from L1 and L2 | **Twist: rising flood.** The water plane climbs slowly, which forces forward momentum and is easy to read and build (a single animated mesh). A collapsing floor is an alternate. |
| 4 Rivalry Showdown | Arena spotlights, split school colours on the floor | Circular stadium ring, scoreboard showing "TIGERS vs DUCKS" | Duck's charge, egg bombs, phase 2 flight |

## Progressive Enhancement Strategy
- **Tier 0 (must ship):** hearts, hotbar with active highlight, ammo pips, boss bar, win/fail screens, plain-text pickup message.
- **Tier 1 (cheap juice, ~1h):** slot glow/bounce on new item, pickup toast with tooltip, hit flash (emissive red for 0.1s), cooldown sweep via CSS `conic-gradient(var(--p))`.
- **Tier 2 (feel, ~1–2h):** damage numbers, screen shake (camera offset, decays, max 0.3 units), hit-stop (freeze 60ms on a heavy hit), particle bursts on KO and pickup.
- **Tier 3 (polish):** lightning and rain, flood shimmer, boss-phase banner, combo counter.

Each tier is gated by a `settings.juice` level, so a broken effect can be switched off in seconds before the demo.

## Critical Insights
- **Readability beats spectacle in a 2-minute demo.** Judges must find "press 1–5" and "4 shots" without being told. Convention does that work.
- **Use one event bus for all feedback.** UI and juice subscribe to it, and gameplay never calls the UI directly. That is what makes progressive enhancement real.
- **The level twist must be visible from the start.** Show the flood rising from the first second, and add a HUD water gauge.
- **Accessibility basics:** never rely on colour alone (hearts change shape when empty, pips are hollow when spent); a reduced-motion toggle that disables shake and flashes; flash rate kept below 3/s (lightning included); remappable or alternate keys (WASD plus arrows, Space jump, J/click punch); a pause screen listing controls; HUD text at least 16px; subtitles/toasts for all audio cues; difficulty assist (an extra heart).
- **Cap screen shake.** Excessive shake in third-person causes nausea and hurts aiming.

## Implementation Strategy
1. Build `hud.js` as a DOM overlay (`#hud` absolutely positioned, `pointer-events:none`), with `render(state)` called on change rather than every frame.
2. Add an `events.js` mini-emitter: `emit('pickup', {item})`, `emit('damage', {pos, amount})`, `emit('slot', i)`, `emit('ammo', n)`.
3. Implement Tier 0 HUD and win/fail cards first, and verify them with the headless Chrome screenshot from `threejs_r160_game_patterns.md`.
4. Drive level identity from a `levelTheme` config: `{sky, fog, hemi, sun, props[], hazard}`. Set up one builder function per landmark (library, statue, dining hall) from Box/Cylinder geometry.
5. Add the Tier 1 and Tier 2 subscribers behind `settings.juice`. Add the reduced-motion toggle to the pause menu.
6. Tune last: toast timing, shake amplitude, and the pip pulse on empty.
