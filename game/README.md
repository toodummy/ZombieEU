# Road of the Dead — Out of London (browser vertical slice, v3)

Playable Three.js build of the *Out of London* slice, extended to the Dover ferry.
Open `index.html` from any static web server (it loads `assets/` by relative path).

## Asset provenance (rights register input)

| Asset | Source | License |
|---|---|---|
| Asphalt, brick, pavement, concrete, gravel, grass, corrugated metal, plaster textures | Poly Haven (see `../assets/fetch-log.json` for exact ids) | CC0 |
| Sky + lighting HDRI (`belfast_sunset_puresky`; earlier `dikhololo_night`) | Poly Haven | CC0 |
| 2k asphalt/brick, cobblestone, stone wall, roof slate, rust, planks, mud textures | Poly Haven | CC0 |
| 30+ props (covered car, tyres, bags, crates, air-con, roller shutters, generator, searchlight, lifebuoy, crowbar, service pistol, wall lantern…) | Poly Haven | CC0 |
| Street lamp, concrete barrier, barrel, trash can, fire hydrant | Poly Haven | CC0 |
| Sedan, Alex, infected models + rigs + animation clips | Generated for this project with Higgsfield (Meshy 6 + Meshy rigging) | Per the Higgsfield account terms |
| Sound effects (engine, rain, infected, weapons, impacts, ambience) | Generated with Higgsfield (Mirelo SFX) | Per the Higgsfield account terms |

Note: the generated sedan's grille carried a real-brand-style badge; the game covers it with a plain plate.
Replace the car texture before any distributed build.

## Rebuilding web assets
`tools/build_static.mjs` (Poly Haven → webp/glb) and `tools/build_gen.mjs` (generated GLBs → compressed models + clip-only files) expect the fetched files in `../assets/`.

## Real London map (v4)
The level is built from OpenStreetMap data (© OpenStreetMap contributors, ODbL): Mansell Street → Tower Bridge → Tower Bridge Road → Bricklayers Arms → Old Kent Road.
- `.github/workflows/fetch-osm.yml` + `tools/fetch_osm.py` clip the Greater London extract to the game area (`assets/osm/london_tb_okr.geojson.gz`).
- `game/tools/london/route.py` and `convert.py` turn it into `game/assets/world.json` (buildings with heights, roof shapes, facade styles, shopfronts; roads; river; parks; rail viaducts; walls; trees; street furniture; gameplay anchors).
- `game/tools/london/london.js` builds the 3D city at load time; `patch_london.py` / `patch_mission.py` wire it into the game.

## v5
- Roads are unioned OSM polygons (clean junctions, raised kerbs, markings clipped at junctions); street furniture moved off carriageways, lamps regenerated along kerbs.
- Free driving with kerb hops; solid buildings, walls, railings and river edges; breakable lamps, signals, bus shelters, signs, bollards, bins, post boxes and phone boxes with mass-scaled damage.
- Trees baked from ez-tree (MIT, github.com/dgreenheck/ez-tree) — `tools/london/bake_trees.html` → `trees.glb` (near/far LOD).
- Infected variety: two base bodies, per-instance clothing/grime/blood shader, proportions, posture, accessories.
- Audio engine: reverb, synthesized engine with gears, tyres, wind, squeal, footsteps per surface, glass/metal impacts, city ambience, dynamic music.
