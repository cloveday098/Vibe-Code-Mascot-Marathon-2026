# Challenge Brief — Mascot Mayhem: The Rivalry Run

Hero: humanoid TIGER (school mascot). Rival/boss: a DUCK (rival school mascot).
Tech constraints: 3D, three.js (r160 vendored at vendor/three.module.js, no Node/npm on machine; serve with python3 -m http.server),
client-side logic only, 3rd-person camera, original game inspired by classic side-scrolling platformers (own art/names/sounds, no copied assets).

Required:
- One playable hero inspired by the mascot.
- Four levels, each with clear start / middle / finish:
  1. Campus Dash — at least two recognizable campus details (library, mascot statue, quad, dining hall).
  2. Themed challenge — new setting/obstacle type (gym, underground tunnel, stormy sports field).
  3. The Gauntlet — combine earlier challenges + one new twist.
  4. Rivalry Showdown — boss fight vs the Duck.
- At least one collectible power-up that visibly changes what the hero can do.
- Win and fail states with clear feedback.
- Playable, testable build another team can try.

User-specific requirements:
- Tiger boxes (punches) as default melee.
- Visible loadout HUD, slots 1–5 (number keys).
- Slot 1 = Ray Gun: 4 shots, reloads on a kill.
- Sword: found somewhere in the map.
- Fireblast power: found in map.
- Laser Eyes power-up.
- "The Force" power-up (telekinetic push/lift).
- Deliverable: localhost demo.

Existing project resources: PRPs/ai_docs/threejs_r160_game_patterns.md (read it — verified r160 patterns, headless Chrome test command).
Relevant three.js examples: games_fps, misc_controls_pointerlock, webgl_animation_skinning_blending, webgl_lights_hemisphere, webgl_points_dynamic, webgl_instancing_dynamic.
