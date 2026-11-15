# Road of the Dead — Production Roadmap and Backlog

**Status** · Proposed pre-production plan  
**Current milestone** · Establish a repeatable PC greybox for Out of London  
**Ownership** · Roles are proposed. Assign named owners and dates after confirming availability.

## Milestones and evidence

| Milestone | Build and evidence | Exit decision |
|---|---|---|
| M0 · Feasibility baseline | Compare handling and camera in a small road scene. Select a baseline PC and archive a packaged build and representative capture. | Approve an engine, test machine and versioned build process. |
| M1 · Playable greybox | One drive-to-foot-to-drive loop, one infected, interruptible refueling, a checkpoint and one working escape. Record observations from five first-time players. | Advance after recurrent control and completion failures have a reproduced fix or a named owner and retest. |
| M2 · Art and systems benchmark | Near-final sedan and forecourt, two infected silhouettes, usable door and fuel animations, readable audio and HUD cues, source asset register and initial profile. | Confirm the benchmark can be reproduced from the game camera. Retain the profile and accept assets against the production guide. |
| M3 · Vertical slice sign-off | A packaged 10–15 minute mission, two routes, optional rescue, consistent save recovery, accessible cues and repeatable rainy-escape profiling. Test with a 20-person first-time cohort. | Apply the QA gates. Decide whether to revise the slice, reduce scope or prepare a funded campaign estimate. |

## Work breakdown

Effort bands are provisional planning estimates, in focused **person-days** per work item. **S** is roughly 1–2 days, **M** is 3–5 days, and **L** is 6–10 days before review and integration. Re-estimate after M0. Shared personnel, unlicensed assets and unstable tooling can change these assumptions substantially.

| ID | Work item | Owner role | Depends on | Effort | Gate |
|---|---|---|---|---|---|
| ROT-01 | Reproducible package and baseline route capture | Gameplay or build engineering | — | S | M0 |
| ROT-02 | Sedan handling, chase camera and wet surface comparison | Gameplay engineering | ROT-01 | M | M0 |
| ROT-03 | Forecourt greybox, parking anchors and short escape | Level design | ROT-01 | M | M1 |
| ROT-04 | On-foot movement, valid doors and camera transitions | Gameplay engineering | ROT-02, ROT-03 | L | M1 |
| ROT-05 | Fuel transfer, wheel condition, checkpoint and retry | Gameplay engineering | ROT-02, ROT-03 | L | M1 |
| ROT-06 | Walker and screamer behaviors, readable cues and encounter bounds | AI or gameplay engineering | ROT-03, ROT-04 | L | M2 |
| ROT-07 | Hero sedan, forecourt kit, lighting and rain feedback | Environment, vehicle and technical art | ROT-02, ROT-03 | L | M2 |
| ROT-08 | Door, fuel and infected animations, HUD and audio mix | Animation, UI and audio | ROT-04, ROT-06, ROT-07 | L | M2 |
| ROT-09 | Second route, optional rescue and debrief | Level design and gameplay | ROT-03, ROT-05, ROT-06 | L | M3 |
| ROT-10 | Recovery matrix, accessibility passes, cohort and profiling | QA and production | ROT-07, ROT-08, ROT-09 | L | M3 |

## Early scope and costs

- Use the available PC and provenance-checked temporary assets for M0–M1. Preserve temporary asset references and reassess rights before retaining any asset in a distributed build.
- Treat authored travel, boats, aircraft, additional vehicles, full cinematic scenes, localized dialogue and console work as campaign planning items. Keep their design notes available while the team proves the road loop.
- At M2, log time spent on a finished road segment, one environment module, the vehicle, one encounter and one voiced interaction. Separate first-time pipeline work from repeatable production time.
- After M3, build a scope estimate from measured throughput and intended content counts. Include integration, QA, accessibility, localization, platform work and contingency. Compare a focused road campaign with the wider multi-city proposal before making staffing commitments.

## Open decisions

| Decision | Resolve by | Evidence needed |
|---|---|---|
| Engine and PC baseline | M0 | Handling and camera result, packaging reliability and measured performance |
| Asset sourcing and contributor roles | M2 | Approved asset provenance, usable source files and confirmed availability |
| Final mission scope and quality budget | M3 | Cohort findings, route and save results, performance captures and asset throughput |
| Campaign size, team and funding | After M3 | Costed scope options, dependencies and a confirmed funding decision |

Related documents · [Vertical slice specification](out-of-london-vertical-slice.md) · [Technical design](technical-design.md) · [Art and audio production guide](art-and-audio-production-guide.md) · [Playtest and QA plan](playtest-and-qa-plan.md)
