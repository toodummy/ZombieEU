# Road of the Dead — Art and Audio Production Guide

**Status** · Proposed standards for the Out of London slice  
**Reference** · [Concept Art Book](Concept_Art_Book.pdf), especially the vehicle progression and roadside survival studies

## Visual target

The forecourt sits in a fictional south London district. Use observed street proportions, road markings, kerb wear, service-station signage and everyday props to establish place. The canopy is a navigation landmark. Headlights reveal a candidate parking spot and the route back to the sedan. During the escape, protect the silhouettes of infected, drivable gaps and the road edge even when rain fills the frame.

Use playable chase and on-foot views for every acceptance capture. Lock the exposure reference and capture an intact sedan, a damaged sedan, the camera transition and the escape. Repeat the same views as models, effects and lighting change.

## Production standards

| Deliverable | Art and implementation requirements | Review evidence |
|---|---|---|
| Hero sedan | Consistent scale and pivot, separated moving parts, functioning lamps, sensible wheel clearance, collision aligned to the body, readable damaged wheel and radiator states | Intact and damaged turntables, chase-camera run over a kerb, door entry from both sides, headlight response in rain |
| Forecourt and roads | Modular kerbs, lane marks, drainage, canopy and kiosk. Use measured scale references. Match roughness, puddle placement, tire feedback and gameplay surface types | Approach, parking and retreat screenshots with collision and route visibility reviewed |
| Alex, walker and screamer | Distinct silhouettes and grounded clothing. Scrutinize hand and foot contact during entry, fuel transfer, hits, recovery and climb-over transitions | Clips from the playable camera at normal speed, including interrupted entry and the screamer cue |
| Lighting and effects | Hold black levels and highlight detail in the gameplay view. Use splashes and contact cues at tires and feet. Keep rain, headlights, steam and debris within the frame budget | Side-by-side reference views and capture of the most expensive rain-and-crowd sequence |
| HUD and accessibility | Pair warning colors with icons and words. Show fuel transfer and damage states without obstructing the road. Subtitle radio dialogue and offer visual alternatives for important sound cues | Identical encounter recorded with normal audio, muted audio, subtitles and reduced motion |
| Audio and music | Use engine load and cabin filtering, different tire surfaces, rain under and outside the canopy, fuel transfer, radio speech and a distinct screamer cue | Check audibility near the kiosk, inside the sedan and at peak engine load. Record a music-off run with all critical cues intact. |

## Asset workflow

1. Record a reference, named owner, source provenance and intended camera distance for every hero asset.
2. Block out scale, pivot, movement, contact and collision with temporary material. Review under playable lighting before finishing detail.
3. Deliver editable source plus runtime files, material assignments, textures, quality tiers and an in-engine test capture. Use measured scene budgets when choosing texture size, draw calls and levels of detail.
4. Accept an asset after visual, gameplay and performance checks on the agreed build. Track the build and asset revision together so later regressions can be reproduced.

## Rights register

Keep one row per externally sourced asset, including textures, fonts, audio, motion data and scans. Retain the source URL, creator, acquisition date, license evidence, modification and redistribution terms, credit requirement, intended use, and reviewer. A placeholder remains marked provisional until rights are recorded. Capture any credits with the asset revision that ships.

| First entries to resolve | Required decision |
|---|---|
| Sedan model and material references | Commission, create or identify a cleared source asset. Record both the mesh and texture provenance. |
| Engine, tire, rain and infected sound libraries | Record the library title, license evidence and the permitted uses of the selected clips. |
| Brand marks and reference signs | Use fictional marks and independently authored signage for the distributed build unless a cleared source is recorded. |
| Concept art and gallery | Track as visual reference. Review the rights and suitability of each element separately before making it part of a distributed game asset. |

Related documents · [Vertical slice specification](out-of-london-vertical-slice.md) · [Technical design](technical-design.md) · [Playtest and QA plan](playtest-and-qa-plan.md)
