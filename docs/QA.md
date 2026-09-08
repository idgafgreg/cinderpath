# Cinderpath verification — 2026-09-08

## Repository review

Reviewed the complete original source, content catalog, tests, design documents, agent procedures, build configuration, and screenshot evidence. Played the original prototype before changing the default experience. The original game remains available at `classic.html`.

| Area | Result |
| --- | --- |
| Core experience | Replaced the finite combat entry point with an endless three-lane runner; preserved classic mode and fixture links |
| Visuals and input | Original procedural Canvas scenery, animated runner, three environments, responsive menus, swipe and keyboard controls |
| Progression | Local XP, 12 milestones, six cloaks, nine craft levels, replayable daily trails with base stats |
| Resilience | Normalized saves, safe storage failures, duplicate-safe settlement, pause on focus loss, redraw on paused resize |
| Classic maintenance | Repaired title-banner selection, audio initialization, input cleanup and stuck keys, persistence failures, and disposed geometry retention |
| Delivery | Dependency-free static build, offline PWA shell, CI workflow, optional Pages deployment workflow |

## Automated checks

`npm test` passes 80 Node tests plus 21 original fixture checks. `npm run build` produces the static deployment directory successfully. The suite includes:

- 100,000 generated obstacle rows checked for a reachable open lane.
- A damage-free 5 km route-following simulation through all three environments, with bounded active entities.
- Reproducible seeded input replay, swept collisions at maximum speed, action timing, fuel and power-ups.
- Malformed saves, denied/quota-limited storage, repeated settlement, purchase constraints, milestone rewards, and daily fairness.
- Offline request fallback, subpath-safe manifest resources, and cache cleanup limited to this app.

These are correctness checks, not measured retention or physical-device performance benchmarks.

## Browser checks

Used the Codex in-app browser with real UI input. Checked desktop 1280 × 720 and portrait 390 × 844 / 320 × 568 layouts. Played runs, used keyboard lane changes and jumps, clicked touch controls, paused/resumed, finished and banked rewards, retried, equipped an earned cloak, purchased a craft upgrade, refreshed to verify persistence, and started a daily trail.

The first visual pass found title overflow and desktop footer overlap; both were corrected. Escape initially opened and immediately dismissed the native pause dialog; default keyboard handling was corrected. A final paused viewport change confirmed the scene redraws while simulation remains paused.

For the offline check, loaded the production bundle on a separate local server, allowed its service worker to cache the shell, stopped that server, confirmed it no longer responded, reloaded the browser, and started, moved, and paused a run successfully.

Screenshots show actual gameplay and locally earned QA progression. No test account, progress grant, or hidden invulnerability is shipped.

## Release limits and next playtest

No physical iPhone or Android device has been tested in this session. Install prompts vary by browser. Classic mode retains external Three.js/font dependencies and is outside the offline shell. Progress is local to one browser; there is no account sync or global leaderboard. The hosted review is initially owner-private, and GitHub Pages still requires repository configuration before its manual deployment workflow can run.

Before a broad portfolio announcement, give five players the public demo on real phones. Observe their first three runs: time to first action, missed swipes, obstacle readability, first-death cause, and whether they voluntarily retry. Use their observations to adjust pacing. Record performance and battery behavior on those devices before making performance claims.
