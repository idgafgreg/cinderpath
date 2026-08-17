---
name: ship-web-game
description: Release a verified Cinderpath commit and prove the live URL.
---

# Ship Web Game

Release a specific commit. Then prove the deployed page, not the laptop.

## When to use

- Publishing GitHub Pages, a tag, or a playable link
- The README still points at a local file

## Sequence

1. `npm test`
2. Production-shaped serve of the exact commit (`npx serve` is enough for this slice)
3. Walk title → shrine or lose on that server
4. Push the same commit
5. Open the Pages URL (or the repo file URL if Pages is off) and repeat the walk
6. Record the commit SHA next to the link

## Done when

- Live page loads Three.js, starts on input, and can win or lose
- README link matches the commit that was verified
- Rollback is `git revert` of that SHA, not a folklore rebuild
