# Cinderpath agent guide

Cinderpath is a mobile-first endless runner, with the original lantern-combat prototype preserved at `classic.html`.

## Before editing

1. Read `README.md` and `DESIGN.md`.
2. Apply the narrowest relevant local skill. `agent-skills/iterate-until-playable` applies across both modes; the older combat/world skills describe classic mode.
3. Keep changes testable and verify the real browser UI. Run `npm test` and `npm run build` before claiming a release is playable.

## Sources of truth

- Runner content: `runner/content.js` (deeply frozen)
- Runner simulation: `runner/sim.js` (fixed-step state, seeded patterns, swept contact)
- Runner rewards and storage: `runner/profile.js`
- Runner presentation: `runner/render.js`, `runner/main.js`, `runner/style.css`
- Classic content / simulation: `game/content/catalog.js`, `game/src/sim.js`
- Proof: both test directories, classic fixture walk, and browser playthroughs

## Rules

- Fuel is the sole life resource. Rush charge and temporary power-ups are not extra health bars.
- Simulation alone decides hits, pickups, score, and rewards. Rendering only reads state.
- The runner uses a flat lane/distance track; jump and slide are timed actions with visual height, not an additional world plane.
- Every generated row must contain a reachable open lane. Preserve the fairness property test.
- No ads, purchases, paid shortcuts, loot boxes, forced daily streaks, trackers, or account requirement in the game itself.
- Keep runner assets self-contained for offline play. The archived classic mode retains its existing CDN dependency.
- Cinderpath has its own fiction, characters, systems, art and pipeline. Do not import Hollowmere content or unrelated skill files.
- Source Sites credentials must never enter the repository or logs. Deploy the exact tested, committed build.
