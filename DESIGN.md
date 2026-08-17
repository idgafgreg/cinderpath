# Cinderpath design contract

## Fantasy

The last wickwarden walks a single ash road. The lantern is the village fire in miniature. If it goes out, the road is gone.

## Player fantasy

Competent, not heroic. You read a telegraph, spend wick on purpose, and arrive with something left in the glass.

## Loop

Title → walk the plane → one lantern arc → one ash wight → cinders → wayshrine or darkness → retry.

## Verbs

| Verb | Startup | Active | Recovery | Notes |
| --- | ---: | ---: | ---: | --- |
| Lantern arc | 0.11s | 0.13s | 0.26s | Costs 4 fuel. Wedge, one hit per target. |
| Snuff lunge | 0.34s | 0.15s | 0.72s | Telegraph turns the wight ember-red. |

## Space

Flat road along +X. Bounds `x -4..34`, `z -4.4..4.4`. Shrine at `30.4, 0`. No stairs, ramps, or drop-offs.

## Readability

- Warm lantern vs cool ash
- Wight cloak goes ember during startup
- Wick bar and lantern intensity are the same number
- Honest primitive meshes until a real actor pack exists

## Out of scope for slice 1

Inventory screen, classes, skill trees, multiplayer, vertical traversal, dialogue trees, crafting.
