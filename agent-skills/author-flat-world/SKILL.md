---
name: author-flat-world
description: Author Cinderpath routes on one plane with readable lighting.
---

# Author Flat World

The road is a sentence. Stones, carts, and lights exist to tell the player where to walk, what will hurt them, and where the fire is going.

## When to use

- Adding or moving collision, pickups, spawns, landmarks, or lights
- A playtest report says the route is ambiguous or a threat pops late

## Rules

- Gameplay y is always `0`. Visual height is dressing only.
- Collision, navigation, encounters, and pickups are separate arrays that share IDs. Never infer a wall from a mesh.
- Every local light names a visible emitter in `ZONE_DEF.lights`. The player lantern moves with the player. The shrine brazier dies only if the shrine is removed.
- Threats, cinders, and the shrine must be visible before the player commits.
- Soft locks, duplicate rewards, and enemies chasing through unloaded space are bugs.

## Done when

- New anchors stay inside `ZONE_DEF.bounds`
- `validateCatalog()` reports no duplicate or missing IDs
- A walk from start to shrine does not require jumping, climbing, or leaving the plane
- Each new light still matches a visible mesh
