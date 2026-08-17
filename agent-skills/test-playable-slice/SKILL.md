---
name: test-playable-slice
description: Prove Cinderpath with fixtures, unit tests, and a real walk.
---

# Test Playable Slice

A green build is not a game. Prove the journey.

## When to use

- After any sim, content, input, or HUD change
- Before a commit that claims "playable"

## Matrix

Launch → start → walk → swing → wight telegraph → pickup → shrine or lantern-out → retry.

Fixtures (do not grind to reach them):

| Query | State |
| --- | --- |
| `?fixture=combat` | First wight in range |
| `?fixture=lowfuel` | Wick almost dead |
| `?fixture=shrine` | Last meters of the first shrine |
| `?fixture=gate` | Closed ash gate |
| `?fixture=snuffer` | Second road, snuffer keep-range |
| `?fixture=hearth` | Last meters of the ember hearth |
| `?seed=7` | Deterministic layout |
| `?debug=1` | Live snapshot |

## Procedure

1. Run `npm test`.
2. Serve the folder and open the fixtures in a real browser.
3. Confirm the visible bar, light, enemy color, and banner match the sim event.
4. Check the console. New errors are blockers; known baseline notes go in the report.
5. Close leftover servers when the task ends.

## Done when

- Every matrix beat has either a unit test or a fixture walk
- Failures cite expected vs actual, not "felt off"
