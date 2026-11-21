# Road of the Dead — Out of London (browser vertical slice, v2)

Playable Three.js build of the *Out of London* slice, extended to the Dover ferry.
Open `index.html` from any static web server (it loads `assets/` by relative path).

## Asset provenance (rights register input)

| Asset | Source | License |
|---|---|---|
| Asphalt, brick, pavement, concrete, gravel, grass, corrugated metal, plaster textures | Poly Haven (see `../assets/fetch-log.json` for exact ids) | CC0 |
| Night HDRI (`dikhololo_night`) | Poly Haven | CC0 |
| Street lamp, concrete barrier, barrel, trash can, fire hydrant | Poly Haven | CC0 |
| Sedan, Alex, infected models + rigs + animation clips | Generated for this project with Higgsfield (Meshy 6 + Meshy rigging) | Per the Higgsfield account terms |
| Sound effects (engine, rain, infected, weapons, impacts, ambience) | Generated with Higgsfield (Mirelo SFX) | Per the Higgsfield account terms |

Note: the generated sedan's grille carried a real-brand-style badge; the game covers it with a plain plate.
Replace the car texture before any distributed build.

## Rebuilding web assets
`tools/build_static.mjs` (Poly Haven → webp/glb) and `tools/build_gen.mjs` (generated GLBs → compressed models + clip-only files) expect the fetched files in `../assets/`.
