# Cinderpath design contract

Cinderpath is not Hollowmere. It is not a farm, not a parish, and not a Unity project. Do not borrow Hollowmere names, systems, or lore.

## Fantasy

The last wickwarden walks the ash road. The lantern is the village fire in miniature. If it goes out, the road is gone.

## Player fantasy

Competent, not heroic. You read a telegraph, spend wick on purpose, and arrive with something left in the glass.

## Loop

Title → walk the plane → lantern arc → ash wight → wayshrine checkpoint → bright oil (optional) → scripted waves (blocker, then snuffer, then both) → ember hearth or darkness → continue from last shrine or retry. A ghost of the last successful walk may share the road. It cannot touch you. Winning plays a short outro: the lantern's fire passes to the hearth, the hearth blazes, the camera pulls back, then the banner reads the wick you carried.

## Verbs

| Verb | Startup | Active | Recovery | Notes |
| --- | ---: | ---: | ---: | --- |
| Lantern arc | 0.11s | 0.13s | 0.26s | Costs 4 fuel. Wedge, one hit per target. |
| Snuff lunge | 0.34s | 0.15s | 0.72s | Wight. Telegraph turns the cloak ember-red. |
| Snuff spit | 0.52s | 0.16s | 0.88s | Snuffer. Long range, keeps distance, colder tell. |
| Shoulder slam | 0.48s | 0.18s | 0.95s | Blocker. Occupies the road. |

## Space

One plane, y = 0. Road along +X. Bounds `x -4..68`, `z -4.4..4.4`.
Wayshrine checkpoint at `30.4, 0`. Ash gate at `x 32.7..33.8` until the wayshrine is lit. Past the gate (`x >= 33.8`) the weather is ashnight: thicker fog, dimmer moon. The second road is paced by scripted waves: blocker at `x 36`, snuffer at `x 44`, both at `x 52`. Each wave announces its threat in a banner before spawning. Ember hearth win at `62, 0`. The lantern and bright oil change how far you can read the road. They are not a second meter.

## Economy

Still one meter: wick. Bright oil is a run modifier (longer arc, slower drain), not a second bar and not a heal. Blocker contact costs 16. Blocker kill returns 12.

## Checkpoints

Lighting a shrine writes `cinderpath-save-v1`. Death keeps that save. R wipes the checkpoint, not the last winning ghost (`cinderpath-ghost-v1`).

## Readability

- Warm lantern vs cool ash
- Wight cloak goes ember during startup; snuffer mouth goes ice-blue at rest and ember on telegraph; blocker is a wide squat body
- Bright oil shows as the word OIL beside the wick, never as a second bar
- A successful walk leaves a translucent ghost on the next run
- Past the gate, ashnight thickens fog and fills the lantern cone with drifting ash motes
- A swing flare lights those motes only during the active window
- Enemy startup draws a ground ring: ember for lunge/slam, ice for snuff spit. The ring is a wedge that faces the enemy, spans the attack's half-angle, tightens inward as the startup clock nears contact, flashes brighter in the final beat, and cuts out the instant the active window opens.
- Audio is a quiet synthesized mix with no assets: slam, spit, oil, grit, flare, ring, hit, lunge, kill, pickup, shrine, win, lose, wave, denied. It plays sim events only — it never invents hits, pickups, or fuel. M or the sound chip toggles it and the choice is remembered (`cinderpath-sound-v1`).
- Gate bar vanishes when the wayshrine is lit
- Touch: left stick, right swing, safe-area padding

## Out of scope

Inventory screen, classes, skill trees, multiplayer, vertical traversal, dialogue trees, crafting.
