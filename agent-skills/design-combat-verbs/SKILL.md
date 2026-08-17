---
name: design-combat-verbs
description: Specify Cinderpath attacks as timed, testable state machines.
---

# Design Combat Verbs

A swing is not an animation. It is a verb with clocks.

## When to use

- Adding or retuning the lantern arc, an enemy lunge, hurt, or death
- Hits feel random, spammy, or disconnected from the pose

## Contract

For every verb write: `id`, startup, active, recovery, range, half-angle, damage, resource cost, knockback, cancel rules.

Then implement against that table:

- Simulation owns the clock. Meshes only read stance.
- Contact is a wedge check during `active`, once per `actionId + targetId`.
- Facing, range, and stance must all be legal or the hit does not exist.
- Hurt interrupts the current verb. Dead stops all verbs.

## Tuning bar

The wickwarden swing is short and honest. The ash wight lunge is longer in startup so a player who watched the color change can step out. Do not add an unpunishable move.

## Done when

- A unit test covers early, late, wrong-facing, and double-hit
- Telegraph color is visible at the default camera distance
- Repeating the input during recovery does not spawn a second `actionId`
