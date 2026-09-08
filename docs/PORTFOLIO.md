# Cinderpath portfolio kit

## Project description

Cinderpath is a mobile-first endless runner built with JavaScript and a custom Canvas renderer. Players carry a lantern through three changing environments, dodge obstacles, collect cinders, and earn permanent cosmetic and gameplay upgrades. The project combines deterministic game simulation, procedural visual design, touch input, offline PWA delivery, persistence, and automated quality checks.

## Resume bullets — use only what you can explain

- Built a mobile-first endless runner with a custom Canvas renderer, fixed-step simulation, swipe controls, and offline PWA support using vanilla JavaScript.
- Implemented seeded obstacle generation and swept collision checks; verified 100,000 generated rows for reachable escape routes and simulated a 5 km run without forced damage.
- Designed and tested local progression with Warden XP, twelve milestones, six cosmetic cloaks, nine upgrade levels, and duplicate-safe reward settlement; all content is earned through play.

Suggested technologies: JavaScript, HTML/CSS, Canvas API, Web Audio API, Service Workers, Node.js test runner, GitHub Actions.

Do not describe it as built entirely without assistance if that would be inaccurate. Be ready to discuss which design decisions and code you personally understand, reviewed, and changed. Do not claim production-scale usage, retention, revenue, native app releases, or performance on devices that have not been measured.

## LinkedIn draft — not posted

I’ve been building Cinderpath: a small light, a long road, and one more run.

It started as a lantern-combat prototype. I wanted to turn it into something you could understand in seconds and play on a phone, so the new version focuses on quick lane changes, readable obstacles, a warm forest atmosphere, and progression earned entirely by playing.

Under the hood, it has a fixed-step game simulation, seeded obstacle patterns with a guaranteed escape route, procedural Canvas artwork, a synthesized soundtrack, and an offline PWA shell. I also built checks for the less visible parts: collision timing, corrupt saves, duplicate rewards, and daily-run fairness.

The current suite includes 83 tests and 21 original fixture checks. Next, I’m looking for feedback from real players on controls, pacing, and what makes them want another run.

Play: https://cinderpath.alesnargregory.chatgpt.site
Code: https://github.com/idgafgreg/cinderpath/tree/codex/cinderpath-runner
Implementation review: https://github.com/idgafgreg/cinderpath/pull/1

What would you improve after your first three runs?

#JavaScript #GameDevelopment #WebDevelopment #BuildInPublic

## 30-second demonstration

1. 0–4 s: show the title and press Run.
2. 4–12 s: change lanes, collect the first trail, demonstrate a jump and slide.
3. 12–20 s: show a longer run reaching a new environment or Ember Rush.
4. 20–26 s: show the result screen and a completed milestone.
5. 26–30 s: equip an earned cloak and show the phone-sized layout.

Record actual gameplay. A longer run may need to be recorded beforehand and edited down; do not present footage as a single uninterrupted run if it is not.

## Case-study outline

Problem: a finite, dark desktop-oriented combat slice did not fit the desired quick mobile runner experience.

Constraints: preserve the lantern identity and classic mode; make every reward earnable; keep hosting and runtime simple; support portrait touch screens and offline play.

Tradeoffs: Canvas perspective gives a small, self-contained build and full art control, at the cost of some animation and spatial richness a 3D engine would provide. Local saves remove backend complexity and accounts but cannot provide cross-device progress or a trustworthy global leaderboard.

Proof: link the fairness and collision tests, show the browser captures, explain one bug found through visual testing, and demonstrate the production build offline.

Follow-up: recruit five players, observe their first three runs without instructions, record missed inputs and first-death causes, and ask whether they chose another run. Iterate on those findings before making claims about engagement.
