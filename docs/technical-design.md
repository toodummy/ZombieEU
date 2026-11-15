# Road of the Dead — Technical Design Document

**Status** · Proposed architecture for the Out of London vertical slice  
**Engine decision** · Unreal Engine is the current candidate for the AAA slice. Record the selection after a repeatable handling, camera, crowd and packaging benchmark on the available PC.

## Platform and benchmarking contract

The initial target is a packaged Windows PC build with keyboard, mouse and controller support. Record CPU, GPU, RAM, driver, resolution, graphics preset and build revision before profiling. Use a proposed 60 fps performance mode, which gives 16.7 ms per frame. Collect CPU and GPU frame times, p95 and p99 frame times, peak memory and the largest streaming hitch through the same rainy escape. Establish stricter CPU, GPU, memory and hitch budgets from the first measured baseline. Platform expansion depends on profiling and available hardware.

## Runtime ownership

| System | Owns | Contract at the boundary |
|---|---|---|
| Mission director | Mission phase, objective, route, rescue flag, checkpoint eligibility, end reason | Consumes domain events once and reports state to UI and checkpoint services. |
| Player and vehicle controllers | Input mode, current occupant, valid door, camera target, health and vehicle movement | A transition transfers control only when the other mode can accept it. If interrupted, restore a valid previous mode and position. |
| Vehicle condition and resources | Fuel, component condition, usable movement and active transfer | Publish elapsed fuel transfer in bounded increments. Cancel, interruption or checkpoint restore must never double-count a transfer. |
| Encounter director | Infected budget, legal spawn areas, cues, pursuit and cleanup | Reacts to mission phase and noise. Spawn candidates must be occluded and reachable, with a budget and a valid escape route. |
| Level and streaming | Cells, collision, navigation and authored spawn or recovery anchors | Preload approaching junction cells using predicted travel speed. Keep previous safe space available through transitions. |
| Checkpoint service | Versioned, validated snapshot and last known-good backup | Commit a complete generation before promoting it. Restore all authoritative game state before enabling controls or encounters. |
| Presentation | HUD, audio, haptics, animation, subtitles and accessibility settings | Derive from authoritative state. A HUD gauge, door prompt or animation cue cannot complete a gameplay action on its own. |

## Proposed data contracts

- `VehicleTune` defines mass, steering and braking curves, fuel consumption, grip response and component thresholds. Author paved, wet and gravel surface responses as editable data.
- `RouteTune` defines segments, checkpoint anchors, recovery positions and encounter caps. Store route identifiers independently of level object names so checkpoints survive reasonable level revisions.
- `EncounterTune` defines legal entry volumes, warning duration, awareness ranges, active budgets and cleanup. Use full movement and collision for near threats and cheaper behavior for distant shapes. Measure the transition distance in a playable build.
- `CheckpointSnapshot` stores schema version, checkpoint ID, mission flags, route, player state, vehicle position and condition, fuel, inventory and checkpoint generation. Reconstruct active encounter state from a valid mission phase instead of serializing temporary visual effects.

## Failure handling

| Case | Required behavior |
|---|---|
| Entry door becomes obstructed mid-transition | Cancel cleanly, clear the interaction lock and place the player at a navigable point with the prior input mode. |
| Player stops fueling at the same instant as a hit or pause | Commit the transferred amount once and close the interaction. The gauge and snapshot agree. |
| A segment fails to stream or navigation is missing | Hold at a readable boundary or use an alternate safe anchor. Log the cell, phase and route so QA can reproduce it. |
| A later encounter collides with a prior trigger | Ignore duplicate mission or completion events. Bound the active enemy budget. |
| Latest save write fails or data is invalid on load | Recover from the last complete validated checkpoint and surface the recovery result to the player. |

## Implementation order

1. Ship a packaged greybox with the sedan, chase camera and one repeatable road loop.
2. Add on-foot entry and exit, fuel transfer, reusable checkpoint state and valid recovery positions.
3. Add the encounter director, two authored routes and the optional rescue. Test the encounter with temporary assets.
4. Integrate near-final visual, animation and audio assets. Profile the busiest segment with rain, streaming and collisions enabled.

Open decisions · Record the exact engine version, baseline PC, job ownership and telemetry policy at the first milestone. Reproduce tests locally before electing to collect any player telemetry.

Related documents · [Vertical slice specification](out-of-london-vertical-slice.md) · [Playtest and QA plan](playtest-and-qa-plan.md) · [Production roadmap](production-roadmap-and-backlog.md)
