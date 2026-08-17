---
name: define-enemy-content
description: Add Cinderpath enemies as data consumed by shared runtime.
---

# Define Enemy Content

An enemy is a catalog row plus a runtime instance. AI chooses a legal move. Combat resolves it. Rendering follows.

## When to use

- Spawning, retuning, or replacing an ash wight
- A request sounds like "make them smarter" but the catalog can already express it

## Split

Immutable definition: id, role, stats, aggro band, move table, reward.

Runtime instance: transform, hp, stance, phase clock, action id, hit set, aggro flag.

Never write live timers back into `ENEMY_DEFS`.

## Add an enemy

1. If an existing def can express it, add a spawn row only.
2. If a new move is required, add the move to the catalog before touching AI.
3. Use the cone-and-ember placeholder until a real mesh exists. Keep radius, height, and timing truthful.
4. Validate IDs, then add a fixture that starts inside aggro.

## Done when

- Two instances can share one definition without sharing clocks
- Telegraph, contact, kill reward, and corpse cleanup all fire from sim events
- A missing mesh cannot silently become a player capsule
