---
name: build-vertical-slice
description: Assemble one playable Cinderpath loop before adding systems.
---

# Build Vertical Slice

Ship one coherent loop: title, walk, one swing, one enemy, one reward, shrine or death, retry. Do not open a second system until this loop has automated coverage and a human playthrough.

## When to use

- Starting a new Cinderpath feature or a new game in this repo
- A branch has systems that cannot be reached in one sitting
- Someone asks for "the rest of the RPG" before the road is playable

## Defaults

1. Inspect `game/content/catalog.js` and `game/src/sim.js` before adding files.
2. Keep authored content immutable. Runtime instances live only in `createGame()`.
3. Deliver slices in this order:
   1. Move, camera, collision, pause, restart
   2. One combat verb with startup / active / recovery and one-shot contact
   3. One enemy with telegraph and a punishable recovery
   4. One pickup that cannot double-grant
   5. One win and one lose, both retryable
4. Add a `?fixture=` state for any slice that is awkward to reach by walking.

## Done when

- `npm test` is green
- A fresh load reaches the shrine or a lantern-out without console errors
- Keyboard and click both start the run
- The new work did not require a second enemy type, a second plane, or a skill tree
