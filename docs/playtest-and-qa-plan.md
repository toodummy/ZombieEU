# Road of the Dead — Playtest and QA Plan

**Status** · Proposed sign-off plan for the Out of London vertical slice  
**Release candidate** · Freeze the exact build, settings and test machine before evaluating the cohort. Record fixes and retest the affected cases on a new build.

## Gates

| Gate | Method | Pass criterion |
|---|---|---|
| Greybox comprehension | Five first-time players run the temporary-art build. Observe the controls, valid door, fuel transfer and escape cue. | Document the observed failure points. Resolve any repeated loss of control or progression blocker before expanding the build. |
| Slice completion | Twenty first-time players start independently using the same candidate build. External coaching counts as assisted completion. | At least 16 of 20 finish unaided. Report assisted completions, skips, retries and timing separately. |
| Correctness | Run the route, transition and checkpoint matrix on keyboard and controller. Repeat every blocker after fixes. | Both base routes complete, no reproducible progression blocker remains, and checkpoint state matches the last valid save in all recovery cases. |
| Performance | Profile the rain-and-crowd escape from a clean launch on the agreed PC. Capture three comparable runs spanning both routes. | Assess the provisional 60 fps budget, p95 and p99 frame times, peak memory and worst hitch. Record the measured thresholds and approval before sign-off. |

## Scenario matrix

| ID | Test | Expected result |
|---|---|---|
| QA-01 | Complete each base route without the kiosk rescue on the intended partial fill. | Both runs reach the motorway. Debrief shows the correct route, fuel and vehicle condition. |
| QA-02 | Complete the rescue, then use the shortcut and reach the checkpoint. | Shortcut, radio report and debrief agree. Retry resolves the prior checkpoint's rescue state consistently. |
| QA-03 | Park with a door blocked on a slope. Interrupt re-entry while under pressure. | The alternate door or blocked cue is legible. Input and camera return to a valid mode. |
| QA-04 | Cancel fueling at several progress points. Repeat during an enemy hit and a pause. | The transferred volume is credited exactly once. HUD, next interaction and saved state agree. |
| QA-05 | Run the tank empty and damage the car past the drivable threshold. | Recover fuel from the authored location if available. Otherwise show a clear failure reason and reachable retry. |
| QA-06 | Interrupt a new checkpoint write and relaunch. Repeat with an invalid latest snapshot in a QA build. | Last complete checkpoint loads with corresponding fuel, damage, position, inventory and flags. |
| QA-07 | Approach, leave and re-enter a streaming boundary during the busiest chase. | Navigable surfaces and collision stay consistent. The game keeps a valid exit or recovery anchor. |
| QA-08 | Play with audio muted, alternative inputs, subtitles, reduced motion and visual sound cues. | Fuel warnings, threat direction, door state, pause, resume and restart are usable on both input types. |
| QA-09 | Replay the final checkpoint and attempt to cross the finish threshold twice. | Completion fires once. Restart starts the intended checkpoint with repeatable mission state. |

## Session and reporting protocol

- Record anonymized session ID, build, test machine, input mode, configuration, first run completion, route, rescue choice, retries and assist points. Capture timing for fuel transfer start, departure and finish. Record only consented footage or notes.
- Observe without directing the player. Ask afterward how they knew they could cancel fueling, why they picked their route and what caused a failure or success.
- For defects, retain build, severity, fixture or checkpoint, steps, expected and actual behavior, and evidence. A blocker prevents finish or recovery. A major defect obscures a critical cue or makes a supported route unreliable. Track other defects for the next triage.
- Sign-off records include the QA matrix, anonymized cohort results, profiling captures and the remaining known issues with owners. Apply a documented exit decision to every unmet target.

Related documents · [Vertical slice specification](out-of-london-vertical-slice.md) · [Technical design](technical-design.md) · [Production roadmap](production-roadmap-and-backlog.md)
