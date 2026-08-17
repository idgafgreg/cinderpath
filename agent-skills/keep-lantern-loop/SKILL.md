---
name: keep-lantern-loop
description: Guard Cinderpath's wick as the only life resource.
---

# Keep The Lantern Loop

Fuel is health, light, and the clock. Do not add a second survival meter until this one is readable.

## When to use

- Changing drain, swing cost, pickup value, kill reward, or lose conditions
- HUD, lantern light, or lose banner disagree with sim fuel

## Economy defaults

| Event | Fuel |
| --- | ---: |
| Idle walk | -1.35 / s |
| Lantern arc | -4 |
| Wight contact | -13 |
| Snuffer contact | -18 |
| Cinder pickup | +28 |
| Wight kill | +10 |
| Snuffer kill | +16 |
| Empty wick | lose |

Cap at `PLAYER_DEF.maxFuel`. Pickups and kills are atomic: one grant, then the source is spent.

## Presentation

The point light intensity is a function of fuel. The HUD bar turns danger-red under 28%. The lose banner may only appear after `phase === lose`.

## Done when

- A `lowfuel` fixture can still be saved by a cinder and can still be lost by waiting
- Light, bar, and sim fuel never disagree for a full run
- No code path sets fuel below 0 or above max
