# Cinderpath design contract

## Fantasy

The last wickwarden walks the ash road. The lantern is the village fire in miniature. If it goes out, the road is gone.

## Player fantasy

Competent, not heroic. You read a telegraph, spend wick on purpose, and arrive with something left in the glass.

## Loop

Title → walk the plane → lantern arc → ash wight → wayshrine checkpoint (opens the gate) → ash snuffer → ember hearth or darkness → continue from last shrine or retry.

## Verbs

| Verb | Startup | Active | Recovery | Notes |
| --- | ---: | ---: | ---: | --- |
| Lantern arc | 0.11s | 0.13s | 0.26s | Costs 4 fuel. Wedge, one hit per target. |
| Snuff lunge | 0.34s | 0.15s | 0.72s | Wight. Telegraph turns the cloak ember-red. |
| Snuff spit | 0.52s | 0.16s | 0.88s | Snuffer. Long range, keeps distance, colder tell. |

## Space

One plane, y = 0. Road along +X. Bounds `x -4..68`, `z -4.4..4.4`.
Wayshrine checkpoint at `30.4, 0`. Ash gate at `x 32.7..33.8` until the wayshrine is lit. Ember hearth win at `62, 0`.

## Economy

Still one meter: wick. Snuffer contact costs 18. Snuffer kill returns 16.

## Checkpoints

Lighting a shrine writes `cinderpath-save-v1`. Death keeps that save. R wipes it.

## Readability

- Warm lantern vs cool ash
- Wight cloak goes ember during startup; snuffer mouth goes ice-blue at rest and ember on telegraph
- Gate bar vanishes when the wayshrine is lit
- Touch: left stick, right swing, safe-area padding

## Out of scope

Inventory screen, classes, skill trees, multiplayer, vertical traversal, dialogue trees, crafting.
