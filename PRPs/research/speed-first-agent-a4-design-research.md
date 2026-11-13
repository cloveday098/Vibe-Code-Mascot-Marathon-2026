# Agent A4: Design Research - Speed-First Approach

## Research Focus
What is the fastest way to build a clear, good-looking HUD and art direction for *Mascot Mayhem: The Rivalry Run* (three.js r160, vendored, no npm, served with `python3 -m http.server`)? Here, "UI libraries/dashboards" means the game HUD. The scope covers the 1-5 loadout hotbar, ray-gun ammo pips, health/lives, level title cards, win/lose screens, primitive-built low-poly Tiger hero and Duck boss, palette, and basic accessibility.

## Key Findings
1. **Plain HTML/CSS DOM overlay beats in-canvas HUD for speed.** A `<div id="hud">` absolutely positioned over the `<canvas>` with `pointer-events:none` gives free text layout, crisp fonts at any DPI, CSS transitions, and easy DOM inspection in headless Chrome tests. In-canvas HUD (sprites, a second ortho scene, CanvasTexture) costs 3-5x more code for no player-visible gain. The three.js `games_fps` example also uses a DOM overlay for its info and crosshair.
2. **No UI library is needed or wanted.** React, Tailwind, and similar need a build step or a CDN, which breaks the vendored/offline constraint. Vanilla `document.createElement` plus about 120 lines of CSS is enough.
3. **Update the HUD only on events, not every frame.** Write to the DOM when state changes (`hud.setAmmo(n)`, `hud.selectSlot(i)`). This avoids layout thrash and keeps 60 fps.
4. **Hotbar pattern (Minecraft/Terraria/Fortnite):** a bottom-center row of 5 square slots, each with a small key number in the corner, an icon or glyph, and a state.
   - **Selected:** thick bright border, slight scale (1.1), raised glow.
   - **Locked/not found:** dimmed (opacity .35), grayscale, lock glyph or "?".
   - **Empty ammo:** red tint and a "RELOAD: KO an enemy" hint toast.
   - **Newly unlocked:** 600 ms pop animation plus a toast ("SWORD acquired! Press 2").
5. **Ray gun ammo = 4 pips** under slot 1 (or beside the crosshair). Filled pip = shot available, hollow = spent. On a kill, refill the pips with a staggered fill animation so the player learns the "reloads on a kill" rule.
6. **Health/lives:** top-left. Use 3-5 paw-print hearts (Unicode or CSS shapes) for HP plus "x3" for lives. Discrete pips read faster than a bar for small HP totals. Give the boss its own wide bar top-center with the name label "THE DUCK", shown only in Level 4.
7. **Title cards:** a full-screen fade with the level number and name ("LEVEL 1 - CAMPUS DASH") and a one-line goal. Show for about 2 s, then fade. Freeze input during the card, or allow any key to skip.
8. **Win/lose screens:** reuse one modal component with a large headline (VICTORY! / KNOCKED OUT), stats (time, KOs), and buttons: Retry Level [R], Next/Menu [Enter]. Keyboard-first, with mouse as an alternative.

## Quantitative Assessment
| Metric | Score | Reasoning |
|---|---|---|
| Design Complexity | **3/10** | Five HUD widgets (hotbar, pips, hearts, boss bar, toast) plus 3 screens, all static DOM toggled by class. |
| Implementation Speed | **High** | About 1-1.5 h for the complete HUD and screens in vanilla HTML/CSS. Primitive characters take about 45 min each. |
| Component Library Quality | **6/10** | No external library is possible offline, but CSS covers everything natively (flex, transitions, filters). A small `hud.js` module acts as the component layer. |
| User Experience Score | **8/10** | It follows established hotbar and pip conventions players already know. It loses points for no gamepad support or animated icons. |

## Recommended Design System
**Palette (school rivalry, high contrast):**
- Tiger orange `#F28C28`, stripe black `#1A1A1A`, belly cream `#FFF3DC`
- Duck yellow `#FFD23F`, bill/feet orange-red `#FF6B1A`, rival jersey green `#1E7A46` (the rival school color)
- Campus: brick `#A8463A`, grass `#5DAA4A`, sky `#8EC9F0`, stone `#C9C3B8`
- HUD: panel `rgba(10,12,20,.65)`, text `#FFFFFF`, accent/select `#FFD23F`, danger `#FF3B3B`, locked `#6B6F7A`
- Power-up glows: fire `#FF5A1F`, laser `#FF2E63`, force `#7B5CFF`, sword `#BFE3FF`. Give each power its own hue so it reads at a glance.

**Typography:** a system bold stack (`"Trebuchet MS", "Arial Black", system-ui`). Use no webfont, because the game must run offline. Headlines 48-72px uppercase with a 3px dark text-shadow outline, HUD numbers 18-22px.

**Art direction (primitives only, `MeshToonMaterial` or `MeshLambertMaterial`, `flatShading:true`):**
- **Tiger (about 15 meshes in a `Group`):** box torso, sphere head, two cone ears, a small box muzzle (cream), 3-4 thin black box "stripes" parented to the torso and head, capsule limbs (`CapsuleGeometry` exists in r160), sphere fists (oversized, red "boxing gloves" to sell the punch), and a curved tail of 3 chained small cylinders. Animate procedurally with sin-wave limb swings. No skinning needed.
- **Duck boss (scaled 2.5x hero):** large sphere body, smaller sphere head, flattened box/cone bill (orange), two flat box wings for flap attacks, cylinder legs with flat box webbed feet, and a green jersey band (torus or cylinder) with a number. Add an angry eyebrow (rotated thin box) for personality. Make it flash white on hit using `emissive` for 80 ms.
- Silhouette rule: exaggerated proportions (big head, big fists/bill) read at third-person distance better than detail does.

## UX Patterns & Frameworks
- **Hotbar:** number keys 1-5 plus mouse wheel cycling. Fixed slot map: 1 Ray Gun, 2 Sword, 3 Fireblast, 4 Laser Eyes, 5 The Force. The punch is the default when no slot is selected or the selected slot is empty. Locked slots are always visible, so players know items exist (curiosity drives exploration).
- **Feedback triad for every action:** visual (HUD change), world (particle/flash), and audio (WebAudio blip).
- **Toasts** for pickups and hints: top-center, auto-dismiss after 2.5 s, max 2 stacked.
- **Damage feedback:** a brief red vignette (CSS radial-gradient overlay, opacity 0→.4→0) plus heart shake. Give 1 s of invulnerability with hero blink.
- **Boss telegraph:** the Duck winds up for 0.6 s (squash pose plus a "!" sprite) before attacks. This is fair and readable.

## Critical Insights
- The HUD must exist from minute one: build `hud.js` with stub data early so every other feature can push state into it. That also makes it testable (`document.querySelector('.slot.selected')`).
- Avoid in-canvas text entirely. Font rendering in WebGL is the biggest time sink.
- Show controls on the title card and in pause. Judges/testers will not read a README.
- Communicating "Ray gun reloads on a kill" is the single most likely point of confusion, so give it explicit UI (pip refill animation plus a first-time toast).

## Implementation Strategy
1. `index.html`: `<canvas>` + `<div id="hud">` + `<div id="screen">` (shared overlay for title/pause/win/lose).
2. `hud.js` exports `initHUD()`, `setHP(n,max)`, `setLives(n)`, `setSlots(state[])`, `selectSlot(i)`, `setAmmo(n)`, `toast(msg)`, `bossBar(show,pct)`, `showScreen(type,data)`.
3. CSS state classes: `.slot.selected`, `.slot.locked`, `.slot.empty`, `.pip.full`, `.flash`.
4. `characters.js`: `makeTiger()` and `makeDuck()` return `THREE.Group`s with named parts (`leftArm`, `bill`...) for procedural animation.
5. Order: HUD skeleton (20 min) → Tiger (45) → screens (30) → Duck (45) → polish toasts/animations (20).

## Accessibility & Responsiveness
- **Controls:** WASD **and** arrow keys for movement, Space/W/Up to jump, J/left-click to punch/attack, 1-5 plus Q/E to cycle weapons, Esc/P to pause. Store bindings in a single `KEYMAP` object, so remapping is a one-line change. A simple remap UI in pause is optional.
- **Use `event.code`, not `event.key`.** This gives physical-key positions on non-QWERTY keyboards.
- **Contrast:** white HUD text on a 65% dark panel gives at least 7:1. Never rely on color alone: locked uses a lock glyph, selected uses border plus scale, and empty ammo shows hollow pips.
- **Reduced flashing:** honor `prefers-reduced-motion`. Disable screen shake, shorten flashes, and replace the red vignette with a static border. Keep any flash below 3 per second (WCAG 2.3.1). Add a "Reduce effects" toggle in pause.
- **Pause:** Esc/P pauses the game loop (skip `update`, still render), shows controls, and auto-pauses on `visibilitychange`/blur.
- **Responsive:** size the HUD with `clamp()` and `vmin` units. The hotbar is anchored bottom-center, scales to 360px-wide windows, and respects `devicePixelRatio` (cap at 2 for performance). Handle `resize` for the camera aspect.
