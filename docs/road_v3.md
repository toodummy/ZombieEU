# ROAD OF THE DEAD
## Game Design Document — AAA vision, version 0.3

**Status:** Creative and production proposal; values are starting hypotheses for testing, not final commitments.  
**Genre:** Third-person vehicle and on-foot survival action / road trip  
**Setting:** Post-outbreak Europe, including Paris, London and Berlin  
**Primary camera:** Outside the car, behind and above it; on-foot third-person  
**Launch vision:** Single-player, premium PC and console; optional cooperative mode subject to validation  
**Audience:** Players who enjoy driving, survival, exploration, tense resource management and spectacular emergent action.

## 1. High concept
Europe is collapsing. A survivor and their battered car must travel between cities, find fuel and supplies, escape infected crowds and reach a safe destination. The car is transport, protection, weapon and mobile home. Ramming clears a path but damages the vehicle; stopping to repair or refuel exposes the player to attack. The further the player travels, the more capable the car becomes—and the greater the challenges become.

**Fantasy:** Drive a customized survival vehicle through recognizable European locations, make desperate roadside decisions and escape situations that appear impossible.

**Design pillars**
1. **Your car is your lifeline.** Every impact has consequences visible in the model and in handling.
2. **Movement versus survival.** Players must choose when to stop, sneak, fight, repair or sacrifice supplies.
3. **A journey across Europe.** Recognizable city identities, believable geography and distinct regional hazards.
4. **Spectacular, readable chaos.** Zombies react convincingly to cars without sacrificing clear control or performance.
5. **Stories created by systems.** Fuel, damage, weather, infected and the environment interact to create memorable escapes.

## 2. Product definition

**Core promise:** A high-quality driving survival game, not a driving simulator that demands constant maintenance. Controls should be accessible, with enough vehicle depth for meaningful decisions. Visual ambition is realistic and cinematic; the scope and actual fidelity depend on budget, team and platforms.

**Target session:** 20–40 minutes for a route segment; a campaign chapter comprises multiple segments. Intended full campaign: 12–18 hours, subject to content and testing. A pause-anywhere single-player experience, except during scripted transitions.

**Game modes**
- **Campaign:** Authored route, story missions, upgrades and checkpoints; core launch target.
- **Escape Run:** Replayable route segments with randomized events and a distance/survival score; candidate post-core feature.
- **Co-op, 2–4 players:** Long-term expansion candidate. Roles, synchronization, saves and difficulty need a separate technical and design investigation. Do not assume it ships in the initial release.

**Perspective:** Exterior chase camera is the default and primary driving view. Adjustable camera distance, height and sensitivity; reverse-look and cinematic replay are optional. On foot, the camera remains behind the character. An interior driving camera is not part of the current scope.

## 3. Core experience

### 3.1 Moment-to-moment loop
1. Scan road, fuel, vehicle condition, navigation and approaching threats.
2. Choose a lane, bypass, collision, stop or alternate route.
3. Drive and respond to traffic debris, infected, weather and vehicle damage.
4. Stop at a point of interest when supplies or story require it.
5. Scavenge and refuel or repair while managing sound, time and approaching enemies.
6. Escape to a checkpoint, spend resources on upgrades, choose the next route and repeat.

### 3.2 Example encounter
A low-fuel warning lights up outside Paris. A station 800 m ahead contains fuel, but an overturned bus blocks the direct road and a horde follows. The player chooses a narrow service lane, hits two infected, damages the radiator and reaches the station. They park facing the exit, refill half a tank and hear glass break. An approaching screamer alerts nearby infected. The player abandons the remaining fuel, rushes to the car and escapes with an overheating engine. At the next safehouse, they repair the radiator but cannot afford the bumper upgrade.

### 3.3 Failure and recovery
Player death, a destroyed engine with no recovery options, or being overwhelmed inside a disabled vehicle ends the current attempt. Running out of fuel alone is not immediate game over: the player may find a canister, siphon an abandoned vehicle or push the car a short distance if the area permits. Checkpoints restore a consistent snapshot of the player, inventory, vehicle and mission state. Difficulty can adjust resource availability and damage without disabling accessibility options.

## 4. World, premise and tone

### 4.1 Setting
A fictionalized near-future Europe, weeks after a fast-moving infection. Major roads connect recognizable city districts through authored regional corridors rather than a literal 1:1 continental map. Every city is inspired by its real geography, architecture and visual identity, with original fictional streets and facilities to support gameplay. Exact maps, likenesses, brands and landmark usage need research, permissions and legal review before production.

Communication has failed unevenly. Emergency broadcasts hint that a coordinated evacuation network survives farther east. Survivors encounter incomplete and conflicting information, and must decide which groups to trust. The infection's exact origin remains a mystery; the story focuses on human choices and survival.

**Tone:** Tense, grounded and cinematic, punctuated by human warmth, improvised solutions and moments of dark humor. Destruction is visually dramatic without requiring extreme gore.

### 4.2 Structure and geography
The campaign is a sequence of large, connected gameplay regions with safehouse hubs and branching paths, not an unrestricted 1:1 open world. Travel distances and timelines are compressed and disclosed in-world. The proposed west-to-east route is London → Channel crossing → northern France → Paris → eastern France and borderlands → Germany → Berlin. Entering and leaving each region is a playable stage or designed transition; the Channel cannot be crossed by road.

**Channel crossing:** The player must secure a place on an emergency vehicle ferry at Dover. They drive to the harbor, secure fuel and ferry power, defend an embarkation lane, then board. A short passage sequence or loading transition brings them to a French port. A damaged Channel Tunnel service route is an optional late-development alternative, not an unexplained drive across water.

### 4.3 Territory design
| Territory | Visual identity | Driving challenge | Survival opportunity | Signature encounter |
|---|---|---|---|---|
| London | Dense streets, brick terraces, bridges, underground entrances, red buses | Narrow roads, stalled traffic, blocked bridges | Garages and delivery depots | Escape a bridge evacuation as abandoned vehicles block lanes |
| Southern England | Villages, motorways, rain, service stations | Wet handling, narrow lanes, fallen trees | Farms, motorway services | Reach the port through a motorway pileup |
| Dover / Channel | Cliffs, industrial harbor, ferry ramps | Tight docks, loading queues and moving obstacles | Port fuel depot | Restore power and drive aboard before the gate closes |
| Northern France | Fields, small towns, industrial bypasses | Long open roads with little cover | Farm fuel and workshops | Escape an infected convoy across open farmland |
| Paris | Boulevards, river crossings, recognizable skyline, apartment blocks | Dense intersections, barricades and limited turning room | Underground garages, pharmacies | Choose between a crowded boulevard and a flooded underpass |
| Eastern France | Forest roads, villages, highway tunnels | Low visibility, tunnel debris and sharp bends | Roadside workshops | Repair a damaged wheel before a tunnel horde reaches the exit |
| German borderlands | Forests, freight yards, industrial towns | Narrow bridges, construction and heavy vehicle wrecks | Rail depots and fuel stores | Restart a freight-yard gate while avoiding an armored infected |
| Berlin | Broad avenues, rail infrastructure, plazas and distinctive modern/historic neighborhoods | Multiple route choices, wrecked trams and security barriers | Final safehouse and military supply caches | Cross the city during a multi-faction evacuation |

Locations must not be reduced to landmarks alone: create lived-in neighborhoods, credible road signage, local language, regional vehicles and interiors. Consult local cultural expertise and use original or cleared names and graphics.

## 5. Campaign, stages and progression

The campaign is a proposed structure. All times are pacing estimates, not commitments.

| Act | Stages and goals | New mechanics introduced | Dramatic outcome |
|---|---|---|---|
| Prologue: London, 20–30 min | Leave apartment, find the starter car, escape local streets | Drive, camera, basic collision, fuel gauge, navigation | A radio contact proposes a route to a continental evacuation network |
| Act I: England, 2–3 h | Reach an outer safehouse, obtain tools, traverse a motorway, secure harbor access | On-foot exploration, scavenging, refueling, basic repairs | Board the ferry; leave supplies or risk a second rescue |
| Act II: Northern France, 2–3 h | Land, replenish, choose rural or industrial route toward Paris | Noise, enemy variants, route choices, basic upgrades | Meet a survivor group whose help comes at a cost |
| Act III: Paris, 3–4 h | Recover route data, navigate districts and cross the city | Dense hordes, barricades, alternate routes, vehicle armor | Choose whom to support; consequences affect later resources and dialogue |
| Act IV: Eastbound, 2–3 h | Travel through villages, forests and freight yards toward Germany | Weather, advanced repairs, environmental traps | Reach the border with a damaged vehicle and incomplete information |
| Act V: Berlin, 2–3 h | Locate the evacuation network, navigate competing factions and reach the final rendezvous | Combined systems, multi-stage finale | Escape with available survivors, or choose an alternate ending based on prior actions |

**Mission template for production:** ID and location; narrative purpose; entry and exit conditions; primary objective; optional objective; route diagram; encounter beats; failure/recovery; save points; enemy composition; resources; VO and cinematics; accessibility requirements; analytics; test cases.

**Example mission — Paris: The Boulevard**
- Entry: arrive at a safehouse with a functioning car and a radio lead.
- Objective: recover an evacuation relay from a parking garage, then reach the eastern exit.
- Optional: rescue a trapped mechanic; success unlocks a repair discount at the next hub.
- Beats: approach by road; scout two entrances; on foot, retrieve relay; generator starts and attracts infected; return to vehicle; choose boulevard or underpass.
- Tradeoff: boulevard offers speed but many infected; underpass avoids the crowd but contains standing water and a blocked lane.
- Completion: reach the next checkpoint with the relay; survivor state and inventory carry forward. Failure: player death or loss of relay in a nonrecoverable area returns to the last checkpoint.

## 6. Player characters and supporting cast

The following are original working concepts; names, appearance, backgrounds and casting are open to user approval.

| Character | Role and motivation | Gameplay function | Arc |
|---|---|---|---|
| Alex Morgan | London delivery driver trying to reach a family member on the continent | Primary playable character; driving, scavenging, repairs | Learns when to take risks for strangers rather than survive alone |
| Camille Moreau | Paris emergency dispatcher coordinating survivors | Radio guide, mission contact, information that can be incomplete | Confronts the consequences of prioritizing limited rescue resources |
| Samira Khan | Mechanic met in southern England | Teaches repairs and vehicle upgrades; optional ongoing companion | Transforms a workshop network into a way to move people to safety |
| Jonas Weber | Berlin logistics coordinator | Final-region contact with knowledge of routes and factions | Must decide whether to share or protect limited evacuation capacity |
| The Warden | Leader of a roadblock faction | Human antagonist; sometimes negotiable | Represents the cost of protecting one group at others' expense |

**Character direction:** Realistic proportions, distinctive silhouettes and practical clothing; performance-captured or carefully authored animation depending on budget. Use an inclusive, credible European cast and avoid treating nationality as personality. Dialogue should reveal character through decisions, not repetitive exposition.

**Companions:** Primarily safehouse and radio characters in the initial campaign scope. Optional in-car companions, combat support and branching survival states are stretch features because they increase animation, AI and narrative complexity.

## 7. Vehicles and driving

### 7.1 Vehicle roster, proposed
| Class | Strength | Weakness | Intended gameplay |
|---|---|---|---|
| Compact hatchback | Nimble, low fuel consumption | Low durability and cargo capacity | Starter vehicle; avoid or lightly hit enemies |
| Older sedan | Balanced durability and handling | Average fuel use | All-round campaign option |
| Estate / station wagon | Large cargo area | Long turning radius | Scavenging and longer routes |
| Van | High storage, supports reinforced body | Slow acceleration and high consumption | Supply-heavy, defensive play |
| Utility 4x4 | Off-road grip and durability | Expensive upkeep and fuel | Rough terrain and alternative routes |

Use original fictional manufacturers or properly licensed cars. Existing Aushiger assets may be evaluated for ownership, suitability and production quality, but are not assumed usable without inspection.

### 7.1A Expanded land, water and air fleet

Vehicles are discovered, earned or repaired as the player advances. Exact unlocks and balance remain playtest targets. A vehicle's usefulness depends on the route rather than its position in a simple power hierarchy. The player can exit vehicles to fight, repair and explore, then re-enter a suitable vehicle. Vehicle location, condition, contents and fuel persist between checkpoints and at unlocked garages.

| Class | Role | Strength | Limitation |
|---|---|---|---|
| Motorcycle | Early urban escape | Slips between wrecks, economical | Rider exposed, low cargo, unstable on impact |
| Buggy | Mid-game rural and industrial exploration | Agile off-road, jumps and narrow tracks | Little protection and cargo, vulnerable tires |
| Tractor | French farmland | Pulls obstructions, travels through fields | Slow, exposed and weak in dense crowds |
| Van and truck | Transport and scavenging | Cargo and collision resistance | Slow turns, weight and fuel use |
| Monster truck / bigfoot | Major late-city discovery | Climbs over smaller wrecks, powerful impacts | High fuel use, rollover risk, hard to fit under barriers |
| Bulldozer | Industrial set piece | Moves barricades and clears a route | Very slow, noisy and consumes fuel |
| Armored vehicle / tank | Late campaign military area | Protection and obstacle clearing | Rare fuel and parts; slow, large and attracts hordes |
| Inflatable boat | Early river or harbor route | Maneuverable, fast to board | Fragile, exposed, low storage |
| Speedboat | River escape | Fast on open water | Noisy, limited cargo and fuel range |
| Fishing boat | Harbor and coastal missions | Stable, carries supplies | Slow and vulnerable at dock |
| Barge / working vessel | River logistics | Cargo and survivor capacity | Slow, needs navigable waterways and landing sites |
| Patrol boat | Late water mission | Better protection | Rare, expensive to maintain and conspicuous |
| Helicopter | Late special mission | Vertical access and emergency extraction | Requires fuel, landing space and a playable mission zone |
| Small plane | Late airfield mission | Long-range stage transition | Needs runway and fuel; aircraft may not bypass campaign gates |

**Acquisition and ownership:** Find a vehicle in the world, clear access, locate keys or repair parts when required, then activate it. Park it in a compatible safehouse to register it; transfer inventory deliberately. Large vehicles and aircraft use dedicated garages, docks or airfields. If a mission requires a particular class, provide a recoverable means to obtain one; never strand the player because a unique vehicle was lost. Previously unlocked vehicles remain useful where their size or fuel efficiency fits the environment.

**Vehicle-specific systems:** Land vehicles use the existing fuel, damage and repair rules; motorcycles and buggies add exposed-rider and rollover risk. Bulldozer blades move authored obstacles; tanks and armored vehicles have limited durability and consumables. Boats have hull, motor and fuel condition, can dock only in valid areas, and may be boarded by infected. Aircraft use distinct simplified arcade controls, fuel and damage, predefined mission flight corridors and landing zones; no unrestricted continent-scale flight is assumed. Exiting aircraft is possible only after a valid landing. On-foot transitions must work at safe docking points and landing zones. Camera remains external, with class-specific framing.

### 7.1B Stage-by-stage unlock progression

| Stage | New vehicles and mobility | Weapons, supplies and upgrades | Challenge introduced |
|---|---|---|---|
| London outbreak | Bicycle, compact car, sedan, motorcycle; inflatable boat in a river mission | Crowbar, bat, pistol; basic repair kit and fuel cans | Narrow streets, first water crossing and swimming infected |
| Southern England | Van, pickup and delivery truck | Shotgun, improved melee weapons, basic bumper and storage | Motorway pileups and vulnerable refueling stops |
| Dover and Channel | Port utility vehicles; mission ferry; small working boat | Better tools, armor and spare fuel | Restore power, defend dock, load vehicle and board ferry |
| Northern France | Tractor, buggy and off-road vehicles | Hunting rifle, off-road tires, cooling and fuel capacity | Fields, rough roads and exposed buggy handling |
| Paris | Armored van, monster truck via a substantial optional quest; river speedboat | Advanced firearms, window protection, reinforced ram and medical upgrades | Dense infected, wrecked boulevards, river pursuers and docking risk |
| Eastern France and German border | Heavy truck, bulldozer and river barge | Reinforced armor, advanced repairs, cargo upgrades | Industrial barriers, noise-driven hordes and heavy vehicle turning |
| Berlin | Armored vehicle, limited-use tank and patrol boat | Rare military equipment, improved armor and scarce ammunition | Large mixed hordes, urban barricades and contested waterways |
| Late special missions | Helicopter and small aircraft | Mission-specific fuel, parts and aviation access | Defend a landing zone, prepare a runway and extract safely |

This is an authored progression proposal. Every stage should reward both the critical path and optional exploration, while preserving earlier vehicle classes as viable alternatives. Weapons and upgrades also unlock through missions, scavenging and safehouse workbenches; resource scarcity and clear counters prevent a late-game vehicle from eliminating all risk.

### 7.2 Driving model
Arcade-simulation hybrid: readable acceleration, braking, reverse and controlled drifting, grounded by weight transfer, surface grip and impact forces. On controller, steering input and camera damping should remain stable during collisions. Keyboard steering includes smoothing. The car must stay controllable with moderate damage; severe damage creates an escalating, recoverable challenge.

**Initial tuning hypotheses:** 0–100 km/h in 8–20 s depending on vehicle; effective urban speeds 20–80 km/h; top speed limited by vehicle and route. These are playtest targets, not realism claims. Fuel use depends on distance, engine type, upgrades and idling; rapid acceleration and heavy armor add measurable consumption. Avoid requiring tedious frequent refills.

### 7.3 Components and damage
| Component | Feedback | Gameplay consequence | Repair |
|---|---|---|---|
| Body / bumper | Dents, detached panels, sparks | Reduces collision protection; critical damage exposes engine | Scrap and tools at a safe location |
| Engine | Sound changes, smoke, warning light | Reduced power; stops at zero condition | Repair kit or workshop; cannot repair while driving |
| Radiator | Steam, temperature gauge | Heat rises under load; severe overheating damages engine | Coolant plus parts, time required |
| Wheels / tires | Visible deformation, wobble, sound | Pulling, reduced grip; blowout at critical threshold | Spare or tire kit; player exposed during repair |
| Fuel tank | Leak and low fuel indicator | Faster fuel loss until patched | Sealant or workshop repair |
| Windshield / lights | Cracks, broken lamps | Reduced visibility, especially at night | Glass or bulb replacement; visibility remains accessible |

**Collision model:** Damage scales with relative speed, mass, impact angle and protected component. Multiple hits in a short period accumulate heat and stress. A hit triggers a physical reaction and visible damage state but must not randomly destroy a healthy car in one low-speed encounter. Clear thresholds, visible warnings and a readable post-impact status screen make consequences fair. Environmental impacts can be more dangerous than individual zombies.

**Ramming:** Hitting an infected slows the car depending on speed and mass; bumper reinforcement reduces damage but increases weight and consumption. Dense crowds can stall the vehicle. Zombies may grab doors or windows in scripted or limited AI states; shake off via steering and speed, or use defensive upgrades. Avoid obstructing the camera for extended periods.

### 7.4 Upgrade system
At safehouses install bumper bars, underbody protection, radiator guards, auxiliary lights, storage, tires, engine cooling and fuel-tank capacity. Each upgrade defines cost, weight, durability, prerequisites and a tradeoff. Example: reinforced bumper costs 12 scrap + 3 metal, reduces frontal collision damage by 25%, adds 6% fuel consumption; values require balancing. No upgrade may eliminate all risk.

## 8. On-foot gameplay and resources

Exit only when speed is near zero and space around the driver's door is valid. Entering/exiting takes time and can be interrupted, with a clear prompt. The player can walk, sprint, crouch, climb modest obstacles, interact, carry a fuel can, fight zombies with melee weapons and use firearms. On-foot combat and returning to the car are core features. Detailed combat and vehicle transition rules appear in section 8A.

**Inventory:** Limited slots with item type and stack size; heavy objects such as a fuel can use dedicated carry state. Store excess supplies in the car. No inventory changes while a committed repair or refuel animation is in progress; interaction can be canceled, preserving proportionally completed fuel transfer and consuming only actual transferred fuel.

**Resources:** Fuel (liters), scrap (general repair), parts (component-specific), coolant, spare tire, medical supplies and food. Food can be a campaign/mission resource rather than a constant hunger meter; introduce survival needs only if they improve decisions.

**Refueling:** At a usable pump or with a found can, park and hold interact. A progress bar shows amount transferred, total remaining and cancel. Player remains vulnerable. Pump power, fuel availability and generator noise vary by encounter. Refueling is possible partially; no magically full tank.

**Repair:** Stop, exit, select damaged component and use required resources. Each repair has visible time, material cost and condition restored; a mobile repair provides a partial fix while workshops can restore fully. Damage and critical warnings remain visible from outside and inside the HUD.

**Medical:** Health represents damage to the player, distinct from vehicle condition. Limited first aid restores health over time; damage interrupts use. Infection from a bite may be story-specific, not an unexplained instant timer unless clearly introduced and communicated.

## 8A. On-foot combat, weapons and vehicle transitions — core design

### Combat fantasy and principles
The survivor can leave the car, explore on foot, fight infected and return to the vehicle. Fighting buys time and clears a route but has costs: injury, stamina, weapon condition, ammunition and noise. Players can avoid combat, use melee to stay quieter, or spend scarce ammunition for immediate stopping power. Combat is third-person with an over-the-shoulder aiming camera; driving always uses the outside chase camera.

### Player actions and states
- **Explore:** walk, run, sprint, crouch, vault suitable low obstacles, interact, pick up or carry supplies. Movement and controls remain available outside combat.
- **Melee:** light strike, slower heavy strike and short dodge. Attacks consume stamina; telegraphs and enemy reactions make range and timing readable. No uninterrupted attack spam at zero stamina.
- **Firearms:** equip, aim, fire, reload and change weapons. Aim assist, recoil and sensitivity are adjustable. Ammunition exists in inventory and loaded magazines separately; reloading transfers only available compatible rounds.
- **Damage and healing:** enemy attacks reduce player health; visual, sound and optional directional HUD cues communicate threats. Medical items restore health over time and can be interrupted. Zero health triggers the documented checkpoint failure flow.
- **Weapon states:** holstered, drawing, aiming, firing, reloading, melee attack, stagger and recovery. Animations may be interrupted only through defined transitions. Weapons cannot fire while entering, exiting, driving, incapacitated, or carrying a two-handed object.

### Weapon roster and balancing targets
| Class | Examples | Strength | Tradeoff | Availability |
|---|---|---|---|---|
| Improvised melee | Crowbar, bat, pipe | Quiet, common, no ammo | Close range, stamina and wear | Starter and scavenging |
| Heavy melee | Fire axe, sledgehammer | High stagger and damage | Slow swing, more stamina | Workshops and emergency sites |
| Handgun | Fictional compact pistol | Fast draw, accurate at short range | Limited ammunition, attracts infected | Police sites and survivor encounters |
| Shotgun | Fictional pump shotgun | High stopping power close up | Loud, limited range and ammo | Rare reward or secured location |
| Rifle | Fictional hunting rifle | Accurate at longer range | Slower handling, rare ammunition and loud | Later-region exploration |

Weapon balance is fictional gameplay tuning, not a simulation. Every weapon defines damage, stagger, range, attack/reload timing, stamina or ammunition cost, noise radius, condition and availability in a data asset. Set actual numbers through playtests. Environmental melee tools can break at zero condition; repair at a workbench or replace. Firearms should not randomly jam: condition changes effectiveness only if clearly communicated and consistently recoverable.

### Combat encounters and infected reactions
Enemy tells precede attacks and players need enough space and time to respond. Hit reactions depend on weapon, target and impact; a stagger is temporary and stronger enemies require more commitment. Runners pressure players during reload; screamers telegraph a call; brutes have slow high-impact attacks with a clear evasion window. Nearby infected investigate firearm noise and sustained melee sounds according to the common noise system. Avoid spawning enemies in the player's view or creating unavoidable damage during control transitions.

### Inventory and pickups
Carry one melee weapon, one equipped firearm and a limited selection of spare equipment, subject to testing. Ammunition occupies limited inventory slots; vehicle storage extends capacity while parked. Weapons and ammo may be scavenged, mission rewards or earned in a safehouse. Pickups show weapon type, compatible ammunition and inventory capacity. If full, allow deliberate replacement; do not silently discard items. Persist weapon condition, loaded ammunition and inventory in saves.

### Entering and exiting the car
1. Park at nearly zero speed, with the handbrake or braking holding the car. A reachable unblocked door displays an interact prompt.
2. The player can exit, move away, fight, repair, scavenge and refuel; the parked car stays in the world and can be attacked. The game does not pause.
3. Approach a reachable door and hold or press the remappable interaction control; the character holsters or secures a weapon, opens the door and enters through an interruptible animation.
4. Infected may attack during entry or exit. A hit cancels the transition and returns control to a valid nearby location; prevent clipping and provide clear feedback. If the door is blocked, the prompt reports the reason or offers a reachable alternate door where authored.
5. Once seated, controls switch to driving and the exterior camera blends smoothly into the chase view. The car cannot accelerate until entry completes. Exit is unavailable while moving above the safe speed.
6. A vehicle locator and distance indicator help the player return. A lost, inaccessible or destroyed vehicle triggers the documented recovery or checkpoint path; it never teleports silently.

**Scenario:** Stop outside a Paris pharmacy, kill two walkers with a crowbar, recover medicine and ammo, then a screamer spots the survivor. Fire a pistol to stop it quickly, but the gunshot attracts nearby infected. Sprint to the car, enter while under pressure and drive away before the crowd surrounds the doors.

### Combat assets, UI and verification
Create 3D weapon models with pickup, held and holstered states; attachments to hands and belt; first- and third-person animation requirements only for the chosen external camera; muzzle flash, smoke, impact particles, damage feedback and audio. UI shows the equipped weapon, current ammunition / reserve, low-ammo warnings, weapon condition and contextual vehicle entry. Provide color-independent cues, subtitled enemy audio cues, remapping and aim assistance.

**Acceptance tests:** equip/unequip and weapon switching; aim/fire/reload with empty and partial ammunition; interrupted reloads without duplicated rounds; melee stamina and collision; infected death and stagger; noise-based attraction with bounded spawning; inventory-full replacement; death and checkpoint restoration; enter/exit during attacks, on slopes, next to obstacles and after vehicle damage; successful escape from a real combat encounter; camera and controls never get stuck.

## 9. Infected and enemies

### 9.1 Common AI rules
Infected detect by sight, proximity, noise and special stimuli. States: idle → investigate → pursue → attack → search → return/despawn. Clear cues show suspicion and aggression. A moving car creates noise that attracts a limited population within a budgeted radius; enemies cannot spawn visibly in front of the player or endlessly materialize behind them. Off-screen spawning must respect plausibility and route fairness.

| Enemy | Visual silhouette and behavior | Counterplay | Vehicle interaction |
|---|---|---|---|
| Walker | Ragged civilian, slow, often in groups | Avoid, distract or strike singly | Low individual impact; crowds reduce speed |
| Runner | Lean, fast, sudden pursuit | Keep moving, break line of sight | Can catch a slow car; may grab its side |
| Screamer | Recognizable posture and audio wind-up | Avoid or interrupt call before it completes | Draws nearby infected, not infinite spawns |
| Brute | Large silhouette, deliberate wind-up | Dodge and use environment; avoid frontal hit | Heavy impact can damage bumper and engine |
| Clinger | Crawls onto stationary or slow vehicles | Accelerate, turn or clear after stopping | Obstructs lightly and attacks vulnerable component |
| Armored infected | Former protective worker in damaged gear | Flank, bypass or use environment | High collision resistance; expensive to ram |

Variants have distinct outlines, sounds and behaviors. They are encounter tools, not bullet sponges. Accessibility settings provide visual indicators for sound cues. Enemy health, speed, perception and damage are authored in data tables, and adjusted after testing.

### 9.1A Swimming infected and water encounters

**Core rule:** The aquatic infected variants can swim after the player and moving boats; ordinary land infected retain their existing behavior. They transition from walking to wading to swimming, pursue using navigable water routes, then climb out at authored reachable banks or grab a slow vessel. Their speed, stamina-like pursuit duration, detection and climbing ability vary by infected type and are tuned for readable gameplay. They do not spawn visibly underwater or track the player through impassable geometry.

**Aquatic types:** Harbor Walker, Swimmer, Dockyard Brute, Sailor Screamer, Boat Clinger and Diver all can swim, with speed and boarding ability tuned by type.

**Behaviors:** Aquatic infected detect engine noise, splashes, sight or nearby activity; pursue a swimmer or boat; attempt to cling to accessible hull areas when the vessel is slow; and climb onboard only where the vessel has valid handholds and space. Fast travel can shake off a clinger, while the player can fight boarded enemies when safely out of the driving state. Other infected may emerge from shallow water or docks to block landing. Visual wakes, bubbles and audio cues reveal approaching threats, with visual alternatives for audio accessibility. Their pursuit is limited by encounter budgets and water navigation; a dock cannot be surrounded without a fair escape or recovery option.

**Water interaction:** The player can swim short distances, climb from the water at marked reachable banks, ladders or boats, and board a compatible stationary or slow vessel through a clear interaction. Swimming has a stamina cost, reduces speed and restricts weapon use; exhaustion slows movement and prompts recovery rather than causing an unexplained instant failure. Falling overboard triggers the same swim and reboarding rules. Boat controls remain external third-person; on-foot combat returns when aboard a walkable vessel or on land. Rules for player attacks while swimming are a tuning decision; default is no firearms until safely aboard or on land.

**Water encounter example:** In Paris the player takes a speedboat down the Seine. Infected jump from a low dock and swim in pursuit, while others wait at a bridge landing. A slow turn lets a clinger grab the stern. The player accelerates to shake it off, but burns precious fuel and must choose a landing site to refuel and fight on foot.

**Production and QA:** Author swim loops, water entry/exit, surface tracking, wake effects, hull-grab and boarding animations, water-specific pathfinding, streaming and collision volumes. Test walk-to-swim-to-climb transitions, boat boarding and disembarking, player overboard recovery, vehicle saves, unreachable targets, visual warnings, spawning rules and performance with multiple swimmers. Treat complex water physics and crowd interaction as a dedicated milestone after the core driving/on-foot vertical slice.

### 9.2 Human enemies and factions
Roadblock crews, desperate scavengers and organized survivors can threaten, negotiate or offer help. Not every human encounter requires combat. Player choices may trade fuel, repair parts or route information. Human AI must obey the same visibility and fairness rules as infected. Small numbers of authored human encounters are a stretch goal until driving and infected interactions work reliably.

### 9.3 Hordes and bosses
Hordes are encounters with defined population budgets and entry/exit rules, composed of physical near agents and simplified distant crowd representations. The camera and escape path remain readable. No mandatory boss health bar is needed: signature threats can be environmental set pieces, such as a brute trapping the player near a damaged gate.

## 10. Encounters, missions and dynamic systems

**Mission types:** Drive to a safehouse; scout alternate routes; retrieve fuel or parts; rescue a survivor; restore power; tow or recover a vehicle; escape a horde; defend a timed repair; deliver information; make a faction trade. Each objective must support at least one clear recovery path and provide signposted alternatives where appropriate.

**Dynamic events:** Broken-down convoy, moving horde, suspicious survivor, blocked tunnel, fuel leak, downed power line, road collapse, abandoned emergency checkpoint. Events use weighted location rules and explicit cooldowns; do not interrupt a critical story sequence or place unavoidable obstacles at unsafe distances.

**Noise model:** Vehicles, collisions, pumps, generators and attacks emit events with strength and duration. Nearby AI investigates when within range and able to navigate. Weather can alter audio propagation only if communicated and tuned. UI does not reveal exact hidden detection ranges; audio and visual feedback convey escalating danger.

**Day/night and weather:** Campaign chapters can use authored time and weather first. Rain reduces grip modestly and affects visibility; fog shortens sight lines; night highlights headlights and sound. A continuous real-time cycle is optional and must not conflict with story lighting or accessibility.

## 11. Level, environment and world art

**Road design:** Mix broad escape lanes, narrow residential streets, motorways, tunnels, service stations and industrial backroads. Every obstacle must be visible at the player's current speed and braking distance. Support navigation around disabled cars and ensure at least one traversable route after dynamic spawns.

**Safehouses:** Secure garage, workbench, storage, map, radio and optional survivor dialogue. They provide a calm pacing break, save point and upgrade screen. Safehouse safety is explicit; scripted attacks are clearly telegraphed and never erase uncommitted purchases.

**Points of interest:** Petrol stations, garages, pharmacies, supermarkets, residential blocks, freight yards and emergency camps. Each has a clear gameplay purpose and unique visual storytelling. Populate with plausible localized signage and storytelling details rather than repeated generic props.

**Art direction:** Photorealistic but readable; weathered materials, convincing scale, natural light, volumetric atmosphere and detailed road surfaces. Visual contrast distinguishes interactables, enemies and route hazards. Show progressive car damage through authored mesh states, decals and particles; do not promise fully simulated destruction for every object.

**Environment asset kit:** Modular European façades, pavements, road sections, barriers, petrol pumps, traffic furniture, parked civilian vehicles, debris, trees and interiors. Each region has a distinctive kit overlay, unique signage and hero landmarks. Create clean, damaged and overgrown variants.

## 12. Characters, sprites, models and animation assets

This is a 3D game: characters, cars and scenery are modeled and animated in 3D. **Sprites** are 2D assets used for interface icons, effects, decals and distant crowd impostors where appropriate, not flat sprites replacing nearby 3D characters.

**Playable character assets:** Base body, head, hair, clothing layers, backpack, damaged/dirty variants; idle, walk, run, crouch, enter/exit vehicle, refuel, repair, pick up, carry, hurt and death animations. Skeleton and retargeting rules must be documented.

**Infected assets:** Shared rig where practical; modular heads, clothing, body variations and texture sets; idle, investigate, walk, run, stumble, grab, attack, climb-on, hit reactions, falls and recovery. Near-range collision reactions use controlled ragdoll blending. Distant hordes use simplified animation and impostors.

**Vehicles:** Exterior and cabin silhouette, separate wheels and doors where needed, LODs, collision bodies, physical material assignments, damage meshes for each component, lights, detachable parts, tire variants and animation hooks. Require consistent real-world scale and wheel placement. Interior detail is limited to what is visible from the exterior camera unless the scope changes.

**Sprite / 2D deliverables:** Fuel, health, engine, tire, temperature, inventory and map icons; objective and interaction markers; hit/damage indicators; UI panels; reticle only if needed; particle flipbooks for smoke, fire, dust and sparks; decals for cracks, dirt and tire marks; distant crowd impostor sheets. Specify resolution, transparency, color space, naming and atlas budgets during technical art preproduction.

**Asset acceptance example:** One approved sedan must support intact/damaged states, four animated wheels, readable brake lights, correct collision, entry points, camera framing, three LOD tiers, texture budgets set by performance profiling, and a documented source file and license.

## 13. Camera, controls and interface

**Driving camera:** Default behind and above the car, centered on the road and with enough forward view to plan. Smooth collision avoidance prevents clipping without abrupt zooms. Dynamically widen view at speed within a comfort cap; keep the car visible during hard turns and impacts. Camera shake has a separate intensity slider and can be disabled.

**Driving controls:** Accelerate, brake/reverse, steer, handbrake, interact, headlights, horn, look back, pause, optional quick repair menu when stationary. Keyboard/mouse and controller support with remapping. On foot: move, camera, sprint, crouch, interact, light/heavy melee, aim, fire, reload, weapon switch, inventory and vehicle entry. Controls must be remappable for controller and keyboard/mouse.

**HUD:** Speed; fuel quantity and low warning; vehicle silhouette with component health; temperature; player health when relevant; objective and distance; contextual action prompt. Damage and warning cues combine color, icon, text and sound. Allow HUD scaling, opacity and selective hiding.

**Menus:** Main menu, continue/new game, chapter selection where unlocked, settings, accessibility, credits, pause, map, inventory, garage and post-run summary. Confirmation for overwriting saves and accessibility presets.

**Accessibility:** Full remapping; toggle/hold options; subtitles with speaker names, size and backgrounds; colorblind-safe indicators; visual sound cues; adjustable camera shake, motion blur and field of view; steering assistance and difficulty presets; controller vibration control; legible UI. Test these with disabled players rather than treating settings as a substitute for testing.

## 14. Audio and music

Vehicle audio conveys RPM, damage, wheel condition and surface. Zombie vocalizations communicate distance, type and aggression; distinctive screamer warning must precede its call. Environments use region-appropriate ambience, weather, radio static, distant sirens and interior reflections. Spatial audio must help the player locate danger and be complemented by visual cues.

Music layers: restrained exploration, rising tension, escape percussion and safehouse relief. Adaptive transitions follow encounter state without restarting abruptly. Record or license original music, performances and sound libraries; document ownership.

## 15. Narrative choices and endings

Choices should change tangible outcomes: who offers help, inventory costs, route access, radio dialogue or the availability of a survivor in the finale. Do not promise unrestricted branching: use a small number of authored decisions with tracked variables and documented combinations. The Berlin finale uses these flags to resolve survivors and resource availability. Exact endings and character outcomes remain to be scripted after story approval.

## 16. Economy, difficulty and balance

**Economy principles:** Fuel and repair resources create pressure but should not make a typical checkpoint impossible. Provide a recovery route when resources are scarce. Rewards come from exploration, missions and optional risk, not paid power.

**Suggested difficulty presets:** Story (more supplies, forgiving damage), Standard (intended balance), Survival (scarcer supplies and stronger consequences). Each preset can be adjusted through independent options; exact multipliers require playtesting.

**Tuning data:** Vehicle mass, acceleration, fuel consumption, durability, collision damage curves, enemy behavior, spawn budgets, resource placement, repair costs and checkpoint frequency in external data assets. Track completion, deaths, average speed, fuel remaining, resource shortages and abandon points with opt-in, privacy-respecting analytics.

## 17. Visual effects and technical requirements

**Effects:** Dust, sparks, tire smoke, steam, rain, headlights in fog, damaged glass, splashes and debris. Effects have near/far quality tiers and strict on-screen budgets. Impact readability is more important than particle volume.

**Technical direction:** A modern 3D engine with strong vehicle physics, animation, streaming and console tooling. Unreal Engine is a candidate for the AAA vision; choose only after comparing team skills, prototype results, licensing and target hardware. Architecture should isolate driving, damage, inventory, AI perception, encounters, missions and save state.

**World streaming:** Stream authored road segments with visibility and memory budgets. Preload approaching segments based on predicted speed; avoid visible population or geometry popping. Junctions use explicit transition volumes and fallback routes.

**Performance targets, provisional:** Target 60 fps performance mode on agreed PC/console hardware; optional 30 fps quality mode if needed. Set resolution, frame-time, CPU/GPU, memory and crowd budgets after hardware selection and profiling. No fixed crowd count or photorealistic fidelity guarantee before testing.

**AI and physics scalability:** Full AI and ragdolls near the player, simplified distant agents and pooled objects; cap active collisions, stagger AI updates, limit expensive effects and preserve deterministic mission state. Use event-based interactions for distant hits rather than simulating every body. Verify behavior at speed and in congested scenes.

**Saving:** Versioned checkpoint snapshots include location, current mission and flags, player state, fuel, car components/upgrades, inventory, world choices and difficulty. Write atomically; autosave after safe transitions and meaningful milestones; support multiple manual slots at safehouses. Test crash recovery and migration between versions.

**PC/console:** Controller, keyboard, graphics settings, scalable quality, save reliability and platform compliance. Cloud save and achievements require platform integration and certification. Network architecture, lag compensation and co-op synchronization are not launch assumptions.

## 18. Production scope and roadmap

**AAA vision versus first playable:** The visual concepts communicate the intended tone, not shipped assets or a guarantee of final rendering quality. A full multi-city AAA game requires substantial specialist staffing, funding, licensed/created content and extended testing. With a zero-budget starting constraint, begin with a small prototype and seek evidence before committing to full production.

### Phase 0 — Preproduction
- Agree design pillars, audience, platform and core camera.
- Audit rights and technical suitability of any existing Aushiger assets.
- Build a handling prototype using temporary assets; benchmark collisions, camera and fuel decision.
- Define target hardware, team and cost estimates after feasibility tests.

### Phase 1 — Playable prototype
- One compact exterior road scene, one drivable car with entry and exit, one walker type, a melee weapon, a basic firearm, a fuel pickup, a damage meter and a checkpoint.
- Demonstrate stable driving and collisions, meaningful fuel consumption, a clear win/failure state and restart.
- Internal test: at least five players can understand controls, complete a run and explain why they succeeded or failed; record issues and tune.

### Phase 2 — Vertical slice
- One polished 10–15 minute London-to-outskirts segment with a small safehouse, gas station, chase and a branching road choice.
- One near-final vehicle with visible damage; two infected types; player entry/exit; on-foot melee and firearm combat; refueling; component repair; save/reload; sound, UI, lighting and accessibility baseline.
- Acceptance: no progression blockers in a representative test set; stable target frame time on chosen hardware; at least 80% of first-time testers can complete the slice unaided in a test cohort of 20; document test setup and revise based on evidence.

### Phase 3 — Production
- Build territory kits and stages with repeatable content pipelines. Complete London, Channel, France, Paris, borderlands and Berlin; story performances, progression and authored encounters.
- Daily builds, source-control reviews, performance profiling, asset and license tracking, accessibility reviews and regular usability tests.

### Phase 4 — Alpha, beta and release
- Alpha: all critical-path missions playable end to end with placeholders permitted.
- Beta: content locked, critical bugs fixed, performance and saves tested on target devices, localization and accessibility verified.
- Release: certification where applicable, store pages, compatibility documentation and support plan.

**Team disciplines for full production:** Game direction, production, gameplay/vehicle programming, AI, technical art, environment and character art, animation, level design, narrative, UI/UX, audio, QA, accessibility, localization and marketing. One person may cover multiple roles in a prototype; AAA staffing and cost require a separate estimate.

## 19. QA and acceptance criteria

- Drive, brake and reverse reliably with keyboard and controller; remapping persists after restart.
- Fuel decreases at expected rates; partial refueling deducts exact transferred amount and can be canceled safely.
- Hits visibly update relevant component condition; zero fuel allows a recovery attempt; critical engine state follows documented failure rules.
- Enemies detect and pursue consistently; horde spawns do not visibly pop in or block every exit without warning.
- Player can enter/exit safely on slopes and near obstacles; cannot duplicate fuel, repairs or inventory through interruption or reload.
- Checkpoints restore mission flags, upgrades, fuel and damage consistently; corrupted saves are handled without deleting valid backups.
- Primary route from London to Berlin is completable; ferry crossing works as a discrete event; both Paris route choices reach the next stage.
- Performance tested in peak conditions: vehicle collision, rain, crowds, effects and streaming together, not only in empty scenes.
- Test subtitles, color-independent warnings, motion settings and remapping; run accessibility and first-time user tests.

## 20. Risks and open decisions

| Risk | Consequence | Mitigation |
|---|---|---|
| Large European campaign exceeds resources | Incomplete, repetitive or poor-quality release | Prove a single short region first; expand only when funded |
| Horde physics overwhelms hardware | Unstable frame rate | Scalable AI tiers, strict budgets, profile early |
| Vehicle damage becomes frustrating | Players avoid core action | Clear warnings, forgiving early tuning, recovery paths |
| Refueling interrupts fun | Pacing feels repetitive | Partial fills, varied encounter pressure and station spacing |
| Visual targets exceed team capacity | Prototype underdelivers against concept art | Set a realistic art benchmark; use licensed assets and staged upgrades |
| City/vehicle representation and rights | Rework or legal exposure | Use fictional brands and local consultation; legal review before release |
| Co-op expands complexity | Delays core gameplay | Treat co-op as a separately funded milestone |

**Decisions for the creative owner:** Final title; exact visual intensity and age rating; playable character identity and customization; narrative ending; licensed versus fictional cars; which city begins the campaign; survival depth; whether the first public release is a short standalone game or a demo; monetization and target hardware. Current working assumptions can be changed without rewriting the core loop.

## Appendix A — Art references from this project

The previously created gameplay concepts establish: exterior third-person chase, a damaged older sedan, zombies blocking and pursuing the vehicle, fuel and vehicle-condition HUD, a dangerous fuel stop, realistic lighting and cinematic atmosphere. They were exploratory Caucasus images; the production world should instead use European urban and regional environments described here. The driver-seat night image is an atmosphere reference only, because the chosen driving camera is exterior.

## Appendix A2 — Concept art gallery

These images are visual exploration, not final game-ready models. The first four reflect the Europe setting and the chosen external driving camera.

- [European locations: London, Dover, Paris and Berlin](../art/concept-01.png)
- [Survivors and zombie concepts](../art/concept-02.png)
- [Vehicle upgrades and damage](../art/concept-04.png)
- [Refueling, repairs, escape and inventory](../art/concept-05.png)
- [Earlier exterior driving concept](Concept_Art_Book.pdf) — mood reference; location superseded by Europe.
- [Earlier daytime chase](../art/concept-12.png) — action and camera reference.
- [Earlier fuel-stop concept](Concept_Art_Book.pdf) — tension and interaction reference.
- [Earlier night-driving concept](Concept_Art_Book.pdf) — lighting and atmosphere only; interior camera is not planned.

### Additional concept art

- [Weapons and on-foot combat](../art/concept-03.png)
- [Land vehicle concepts](../art/concept-06.png)
- [Vehicles in action](../art/concept-07.png)
- [Aircraft, garage and scavenging](../art/concept-08.png)
- [Buggy and boat designs](../art/concept-09.png)
- [Buggy and boats in gameplay](../art/concept-10.png)
- [Swimming infected visual exploration](../art/concept-11.png) — aquatic infected have swimming abilities.

## Appendix B — One-page pitch

**ROAD OF THE DEAD** is a third-person survival driving game across a collapsing Europe. From London to Paris and Berlin, players drive, scavenge, fight infected on foot with melee weapons and firearms, and repair their car while threats close in. They can leave and return to the car whenever the situation allows. Every hit creates a choice: clear the road now or save the car for the journey ahead. Stop for fuel and risk being surrounded; keep driving and risk running dry. Customize your vehicle, choose your route and reach the next safe place before the road takes everything from you.
