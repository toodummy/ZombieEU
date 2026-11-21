# Road of the Dead — Out of London

A single-player desktop prototype of the first mission in the ZombieEU design. Drive Alex Morgan's sedan through Clapton, stop at Meridian for fuel, and escape to the motorway checkpoint. The high street is direct and crowded. The service lane has less grip and tighter turns. Helping the worker at the kiosk opens the depot shortcut on the service lane.

## Play

Extract the Windows x64 ZIP and launch `OutOfLondon.exe`. Starting a new run replaces the active checkpoint. Continue restores either the safehouse or the forecourt and any completed rescue. The game runs offline.

| Action | Keyboard and mouse | Controller |
|---|---|---|
| Drive / reverse | W / S | Right / left trigger |
| Steer / walk | A, D / WASD | Left stick |
| Brake / sprint | Space / Shift | Left / right bumper |
| Enter, exit, or hold to interact | E | A |
| Shove an infected | F | X |
| Orbit camera | Hold right mouse button and drag | Right stick |
| Pause / resume | Esc | Start |
| Toggle sound | M | |

Follow the turquoise marker at the station. Stop with the sedan beside the first pump, get out, and hold interact near the pump. The HUD shows the amount transferred. You can release early and keep the fuel already transferred. An emergency canister is on the approach to the forecourt.

## Develop and export

Open this directory as a Godot project. It uses Godot 4.7.2 and the Compatibility renderer. Install the matching Godot export templates for the platforms you build.

```sh
cd game
godot --headless --editor --import --quit
godot --path .
```

Automated mission validation uses a temporary data directory on Linux.

```sh
XDG_DATA_HOME="$(mktemp -d /tmp/zombieeu-validation.XXXXXX)" \
  godot --headless --fixed-fps 60 --path . --script res://tests/mission_smoke.gd
```

The Windows Desktop and Linux Desktop presets embed the project data in the executable. Create the output directory before running the exports.

```sh
mkdir -p build
godot --headless --export-release "Windows Desktop" build/OutOfLondon.exe
godot --headless --export-release "Linux Desktop" build/OutOfLondon.x86_64
```

## Prototype scope

The current build uses original procedural geometry, synthesized audio and a compact road layout. It establishes the mission loop and the Windows export. The design targets a larger, art-complete slice with character and vehicle animation, richer audio, input remapping, a Windows graphics and controller playtest, and measured performance on the target PC. The engine choice for production remains open pending the comparison in the technical design.

The Windows export can be staged as a depot build once a Steamworks app and depot exist. Store review and release are subsequent steps.

- [Mission specification](../docs/out-of-london-vertical-slice.md)
- [Technical design](../docs/technical-design.md)
- [SteamPipe documentation](https://partner.steamgames.com/doc/sdk/uploading)
