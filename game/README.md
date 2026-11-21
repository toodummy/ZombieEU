# Road of the Dead — *Out of London* (playable browser slice)

A playable, no-build Three.js interpretation of the **Out of London** vertical slice described in
[`docs/out-of-london-vertical-slice.md`](../docs/out-of-london-vertical-slice.md), structured after the runtime
ownership in [`docs/technical-design.md`](../docs/technical-design.md).

It is a browser prototype for testing the mission loop and pacing — not the packaged Unreal AAA build the docs target.

## How to run

Any static file server works (ES modules don't load from `file://`):

```bash
# from the repository root
python3 -m http.server 8000
# then open http://localhost:8000/game/   (or click "Play" on the project hub, http://localhost:8000/)
```

Three.js **r160** is vendored in `game/vendor/three/` (MIT, see its `LICENSE`) and loaded through an import map, so there is
no npm install, bundler or CDN dependency. A WebGL2-capable desktop browser (Chrome, Edge, Firefox, Safari 16+) is required.

URL options: `?quality=low|medium|high` overrides the graphics setting; `?qa=1` exposes test hooks on `window.__ROTD.qa`.

## The mission

1. **Leave the safehouse** — drive the sedan through south London; the bus-blocked junction and blue fuel signs lead you to the Northgate station. Fuel drains as you drive.
2. **Approach the forecourt** — crossing the approach threshold saves the *forecourt* checkpoint. Park next to a pump and get out (a blocked driver door uses the passenger side).
3. **Refuel under pressure** — hold **F** at a pump and watch the gauge rise. Walkers close in, then a **screamer** arrives with a directional warning; if its call completes, reinforcements pour in. Releasing F (or getting hit) stops the transfer and keeps every litre exactly once.
4. **Optional rescue** — Priya is trapped behind the kiosk shutter. Hold **E** to pry it open (noisy). Success opens the yard shortcut off the service lane and survives checkpoint reloads.
5. **Escape** — get back in and choose **High Street** (short, crowded, collision risk) or the **Service Lane** (longer, narrow, loose gravel).
6. **Motorway checkpoint** — cross the threshold with a running engine for the debrief: route, fuel left, vehicle condition, rescue outcome, time. Replay from there.

Failure states (player down, car wrecked, out of fuel with no jerrycan reachable) show the reason and retry from the last checkpoint.
Jerrycans and a tyre repair kit are placed as authored recovery items. Wheels and engine take damage from impacts and infected.

## Controls

| | Keyboard / mouse | Gamepad |
|---|---|---|
| Accelerate / brake-reverse | W / S (or ↑ ↓) | RT / LT |
| Steer | A / D (or ← →) | Left stick |
| Handbrake | Space | B |
| Get in / out, pick up, pry shutter (hold) | E | A |
| Refuel at pump, pour jerrycan, patch tyre (hold) | F | Y |
| Move / look / sprint (on foot) | WASD / mouse / Shift | LS / RS |
| Crowbar swing · fire when aiming | Left click | X / RT |
| Aim pistol (hold) · reload | Right click · R | LT · B |
| Headlights · horn (attracts infected) | L · H | — |
| Pause | Esc or P | Start |

Click the game view to capture the mouse. Settings cover volume, mouse sensitivity, invert Y, subtitles, camera shake,
visual sound cues, graphics quality and an FPS counter.

## Code map

| File | Role (from the technical design) |
|---|---|
| `js/main.js` | Game loop, interaction ownership, camera, screens |
| `js/mission.js` | Mission director: phase, objective, route, rescue flag, single completion event |
| `js/vehicle.js` | Sedan handling, surfaces, fuel, engine and per-wheel condition |
| `js/player.js`, `js/characters.js` | On-foot controller and procedural humanoid rigs |
| `js/infected.js`, `js/encounter.js` | Walker and screamer archetypes; encounter director with budget and authored spawns |
| `js/checkpoint.js` | Versioned `localStorage` snapshots with a last-known-good backup |
| `js/world.js`, `js/textures.js` | Procedural level (roads, terraces, forecourt, kiosk, routes) and canvas textures |
| `js/hud.js`, `js/audio.js`, `js/fx.js` | Presentation: HUD/minimap/threat cues, WebAudio sound and radio, rain and post-processing |
| `js/config.js` | `VehicleTune`, `PlayerTune`, `EncounterTune`, `RouteTune` data |

## Known limitations

- All art and audio is procedural placeholder (no imported models, mocap or voice acting); subtitles carry the radio dialogue.
- First load generates textures on the CPU and takes a few seconds (much longer under software rendering).
- Tuning values are first-pass hypotheses from the spec, not playtested numbers; the 10–15 minute pacing target is unverified.
- No input remapping UI yet (the spec lists remappable inputs); gamepad support is basic.
- Desktop only; no touch controls.
