# Cinderpath — Carry the last light

## Outcome

A polished, quick-to-learn endless runner for phone and desktop browsers. The wickwarden carries a warm lantern through a forest that becomes ancient ruins, then a golden dawn. The new runner supersedes the finite combat slice as the default experience; the original design is preserved in `docs/classic-design.md` and playable at `classic.html`.

## Play contract

Home → one-tap run → change lanes / jump / slide → collect light → Ember Rush → fuel runs out → rewards / personal best / XP → retry or spend earned cinders. Runs may also be paused and finished early to bank earned progress.

- Three lanes; automatic forward travel, 15–29 m/s.
- Arrow keys / WASD: lane changes, jump, slide. Space: jump. Escape: pause. M: sound.
- Phone: directional swipes or 48 px on-screen buttons. One gesture is one action. Repeated keydown cannot sustain an action forever.
- Jumps and slides last 0.86 seconds. Slides can cancel jumps; a 0.14-second action buffer catches near-end inputs.
- Flat lane/distance simulation, drawn in perspective. Jump height is an action pose checked by simulation, not a separate navigable level.
- A fixed 60 Hz simulation makes scoring independent of display refresh rate. Swept longitudinal contact prevents tunnelling through objects.
- Obstacles appear on 32 m rows. Each row has an open lane, moving at most one lane from the prior safe lane. Cinder trails mark that route. A player can always choose a lane route instead of a jump or slide.
- Stones must be dodged; roots can be jumped; blue hanging gates can be slid under. A clear action earns 60 bonus points.
- Emberwood (0–599 m), Sunken Sanctum (600–1,199 m), Golden Reach (1,200–1,799 m), then repeat. Colors transition over the first 100 m of the new biome.

## Economy

Fuel begins at 100. Base drain is 1.1 / second, slowly increasing with distance. A hit costs 32 and grants 1.3 seconds of collision grace. A cinder restores 0.45 fuel; green oil restores 24. No second life meter.

Cinders are banked as currency at run end. Score = 2 × distance + cinder points + action-clear bonuses. Cinder points start at 10, rise with the combo up to a 5× multiplier, and double during Rush. A combo expires after 3.4 seconds without a cinder; Rush charge persists between trails but resets on a damaging hit.

24 cinders trigger a seven-second Ember Rush: collision protection, cinder attraction, and doubled cinder points. Violet magnets attract cinders for 10 seconds; a blue ward absorbs one hit. There is no paid revive.

Warden XP = floor(distance / 8) + 2 × collected cinders + 3 × cleared obstacles. Level L begins at `(L−1)² × 120` XP. Twelve one-time milestones grant automatic cinder bonuses. Six cloak colors cost earned currency and require Warden levels. Three three-level crafts improve drain, oil recovery, or magnet duration in Endless mode.

Daily trails use the UTC date as their seed and always use base upgrades. Attempts are unlimited. Records are personal and local to the browser, with no claim of an online leaderboard. Missing a day has no penalty.

## Presentation and quality gates

- Original procedural art: layered mountain silhouettes, faceted evergreens, stone portals, lantern posts, a moving cape, sparks, fog, and a synthesized pentatonic soundtrack.
- Warm collectibles, green oil, blue gates, and differentiated silhouettes convey purpose; hazard arrows provide non-color cues.
- Gameplay stays legible when fuel is low. Atmospheric motion can be disabled; quality and on-screen controls can be adjusted. Native dialogs provide focus containment; buttons have names and visible keyboard focus.
- No runtime framework or remote art/font dependency in the runner. Bounded scenery and entities; canvas pixel ratio capped at 1.75, or 1 for Low quality.
- Progress survives reload. Invalid data is normalized. Storage failures preserve the session and show an honest message.
- Browser blur and hidden-tab events pause a running game. Resuming discards elapsed background time.
- The PWA manifest uses relative paths. A build-derived service-worker cache version supports repo subpaths and offline runner play after the shell is cached.

## Definition of done for this release

Gameplay and reward tests pass; all 100,000 generated test rows are fair; the safe-route simulation reaches 5 km without damage; the original fixture walk stays green; phone and desktop menus, controls, retry, progression, and offline reload are checked in a browser; production assets and portfolio notes accompany the source.

## Honest limits

This is an original indie web runner, not a claim of feature or production parity with Temple Run or Subway Surfers. Native app-store packaging, cloud saves, online leaderboards, bespoke 3D animation, controller support, assistive non-visual gameplay, and physical-device performance certification are outside this release. Player research and retention data are still needed before claiming the game is addictive or broadly validated.
