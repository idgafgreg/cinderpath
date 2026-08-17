# Agent guide

Repo: **Cinderpath**

This is a playable isometric web game plus the skills that built it.

## Before you edit

1. Read `README.md` and `DESIGN.md`.
2. Load the single narrowest file under `agent-skills/`.
3. Do not copy files out of any other skills repository into this tree.

## Truth

- Content: `game/content/catalog.js`
- Simulation: `game/src/sim.js`
- Proof: `game/tests/sim.test.js` and the `?fixture=` routes
- Presentation may never invent hits, pickups, or fuel

## Hard rules

- One gameplay plane at y = 0
- One life resource: lantern fuel
- Authored objects are frozen; runtime instances are created in `createGame`
- Placeholders must stay obvious and keep real radius / timing
- `npm test` before you claim playable

## Suggested order

`build-vertical-slice` → `author-flat-world` / `design-combat-verbs` / `define-enemy-content` → `keep-lantern-loop` → `test-playable-slice` → `ship-web-game`
