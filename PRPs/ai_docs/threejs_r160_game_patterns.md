# three.js r160 — Game Patterns Cheat Sheet (for Mascot Mayhem)

Curated for a **no-build, no-Node** project: three.js is vendored at `vendor/three.module.js`
(r160, verified `THREE.REVISION === '160'`) and loaded through an import map. Everything below
is verified to exist in r160.

## 1. Loading three.js without a bundler

```html
<script type="importmap">
  { "imports": { "three": "./vendor/three.module.js" } }
</script>
<script type="module" src="./src/main.js"></script>
```

- ES modules **do not load from `file://`** — always serve via `python3 -m http.server`.
- Relative imports inside `src/` MUST include the `.js` extension (`import { Tiger } from './tiger.js'`).
- Addons (only if needed) can be vendored the same way from
  `https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/...` — their internal `import ... from 'three'`
  resolves through the same import map. This game does **not** need any addons.

## 2. Reference examples (read for patterns, do not copy assets)

| Example | URL | Pattern to take |
|---|---|---|
| games_fps | https://threejs.org/examples/#games_fps (src: https://github.com/mrdoob/three.js/blob/r160/examples/games_fps.html) | `STEPS_PER_FRAME` physics sub-stepping, `Math.min(0.05, clock.getDelta())` dt clamp, gravity + `onFloor` flag, projectile spheres pooled in an array |
| webgl_animation_skinning_blending | https://threejs.org/examples/#webgl_animation_skinning_blending | State-based animation weights/crossfade idea — we replicate it procedurally with lerped pose targets |
| misc_controls_pointerlock | https://threejs.org/examples/#misc_controls_pointerlock | Keyboard map with `keydown`/`keyup` → boolean set; velocity damping `velocity.x -= velocity.x * 10.0 * delta` |
| webgl_lights_hemisphere | https://threejs.org/examples/#webgl_lights_hemisphere | `HemisphereLight` + `DirectionalLight` with shadow camera bounds, `scene.fog` |
| webgl_points_dynamic / webgl_buffergeometry_drawrange | https://threejs.org/examples/#webgl_points_dynamic | `Points` + `BufferAttribute.needsUpdate = true` for rain/sparks |
| webgl_instancing_dynamic | https://threejs.org/examples/#webgl_instancing_dynamic | `InstancedMesh.setMatrixAt` + `instanceMatrix.needsUpdate` for many identical props (bleachers seats, books, rain streaks) |

Docs anchors:
- Box3 (AABB collision): https://threejs.org/docs/#api/en/math/Box3 — `setFromCenterAndSize`, `intersectsBox`, `containsPoint`
- Raycaster (laser eyes, ray gun hitscan): https://threejs.org/docs/#api/en/core/Raycaster — `set(origin, dir)`, `far`, `intersectObjects(list, true)`
- Object3D: https://threejs.org/docs/#api/en/core/Object3D — `getWorldPosition`, `traverse`
- CanvasTexture (signs, "LIBRARY" text): https://threejs.org/docs/#api/en/textures/CanvasTexture
- Fog: https://threejs.org/docs/#api/en/scenes/Fog
- Cleanup / disposal: https://threejs.org/manual/#en/cleanup
- Shadows: https://threejs.org/manual/#en/shadows

## 3. Fixed-step loop (from games_fps)

```js
const clock = new THREE.Clock();
const STEPS = 4;
function frame() {
  const dt = Math.min(0.05, clock.getDelta()) / STEPS;
  for (let i = 0; i < STEPS; i++) game.update(dt);
  game.render();
  requestAnimationFrame(frame);
}
```
Clamp dt — a backgrounded tab returns a huge delta and players would tunnel through floors.

## 4. Procedural humanoid with pivots (no rigging/skinning needed)

Build each limb as a **pivot Group at the joint** with the mesh offset downward, so `rotation.x` swings it naturally:

```js
function limb(len, radius, mat) {
  const pivot = new THREE.Group();
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, len, 4, 8), mat);
  mesh.position.y = -len / 2 - radius;   // hang below the joint
  mesh.castShadow = true;
  pivot.add(mesh);
  return pivot;
}
// shoulder pivot -> upper arm; elbow pivot (child of upper arm, at its end) -> forearm -> glove
```
`CapsuleGeometry(radius, length, capSegments, radialSegments)` exists since r139.

Animation = per-frame target rotations per state, smoothed:
```js
pivot.rotation.x = THREE.MathUtils.lerp(pivot.rotation.x, target, 1 - Math.exp(-18 * dt));
```
Run cycle: `Math.sin(t * 12) * 0.9` on legs, opposite phase on arms. Punch: drive the shoulder
pivot forward and the elbow straight over ~0.12 s, then retract over ~0.18 s.

Tiger stripes: draw a `CanvasTexture` (orange fill, black wavy stripes) and use it as `map`
on a `MeshStandardMaterial`. Set `texture.colorSpace = THREE.SRGBColorSpace`.

## 5. 2.5D collision (AABB in the X/Y plane, Z locked)

Side-scrolling platformer => the player moves on X/Y only (z = 0). Resolve axes separately:

```js
// move X, then resolve; then move Y, then resolve (prevents corner snagging)
p.x += vx * dt; for (const s of solids) if (overlap(p, s)) p.x = vx > 0 ? s.minX - hw : s.maxX + hw;
p.y += vy * dt; onGround = false;
for (const s of solids) if (overlap(p, s)) {
  if (vy <= 0) { p.y = s.maxY; onGround = true; } else { p.y = s.minY - h; }
  vy = 0;
}
```
Keep platforms as plain `{minX,maxX,minY,maxY}` records (data), with meshes built from them — logic stays testable without WebGL.

Moving platforms: store `prevX/prevY`, and if the player stood on it last frame add its delta to the player.

## 6. Third-person chase camera for a side-scroller

```js
const desired = new THREE.Vector3(player.x - 3.5, player.y + 3.2, 10.5); // behind-left & out from lane
camera.position.lerp(desired, 1 - Math.exp(-6 * dt));
lookTarget.lerp(new THREE.Vector3(player.x + 2.5 * facing, player.y + 1.2, 0), 1 - Math.exp(-8 * dt));
camera.lookAt(lookTarget);
```
Gives a 3D, over-the-shoulder-ish angle while keeping side-scroll readability.

## 7. Raycast beams (laser eyes, ray gun)

```js
const ray = new THREE.Raycaster(origin, dir.normalize(), 0, 30);
const hits = ray.intersectObjects(enemyMeshes, true); // recursive for Groups
```
For pure-logic hit tests (and the self-test harness) prefer `THREE.Ray.intersectBox(box3, out)`
against each enemy's `Box3` — no scene needed.

Beam visual: a thin `CylinderGeometry(0.05,0.05,1)` rotated to Z, scaled on its length axis,
`MeshBasicMaterial({color, transparent:true, opacity:0.85, blending: THREE.AdditiveBlending})`.

## 8. Particles (rain, fire, sparks)

```js
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.15, color: 0xff7a00,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
// per frame: mutate the array, then geo.attributes.position.needsUpdate = true;
```

## 9. Disposal between levels (memory leak gotcha)

```js
root.traverse(o => {
  if (o.geometry) o.geometry.dispose();
  if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.dispose(); });
});
scene.remove(root);
```
Put every level object under one `levelRoot` Group so a level swap is one traverse.

## 10. Audio — original synthesized sounds (WebAudio, no asset files)

```js
const ctx = new AudioContext();               // create/resume ONLY after a user gesture (Start button)
function blip(freq, dur, type = 'square', vol = 0.15, slideTo) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime + dur);
}
```
Noise bursts (punch thud, thunder): fill an `AudioBuffer` with `Math.random()*2-1`, play through a `BiquadFilter` lowpass.

## 11. Headless verification (verified working on this machine)

```bash
google-chrome --headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader \
  --virtual-time-budget=8000 --dump-dom "http://localhost:8080/?test=1" | grep -o 'data-test="[^"]*"'
```
Verified output of a probe page: `data-test="PASS rev160 gl=true"` — WebGL2 works through SwiftShader.

## 12. Gotchas

- `renderer.outputColorSpace` defaults to `SRGBColorSpace` in r152+; set `texture.colorSpace = THREE.SRGBColorSpace` on color canvas textures or they look washed out.
- `renderer.useLegacyLights` is deprecated in r155+ — physically-correct light intensities are the default, so `PointLight` needs much higher intensity (e.g. 20–60) and `decay` defaults to 2.
- `Geometry` class is gone — always `BufferGeometry`.
- Shadow camera of a `DirectionalLight` must be re-centered on the player each frame in a long level (move `light.position` and `light.target.position` together, add `light.target` to the scene).
- Don't create geometries/materials per projectile — share one geometry+material, pool meshes.
- `keydown` repeat: ignore `e.repeat` for edge-triggered actions (jump, punch, slot select).
- Prevent page scroll on Space/arrow keys with `e.preventDefault()`.
