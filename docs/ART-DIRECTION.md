# Cinderpath: the Lantern Post

## The design problem

The first runner worked, but its visual language was inconsistent. A large editorial headline, promotional copy, glass dialogs, platform-dependent symbols, repeated triangular scenery, diamond power-ups, and an anonymous hooded figure belonged to several unrelated styles. More effects would not resolve that inconsistency.

The new direction is an illustrated woodland delivery game. A fox courier carries the last light between settlements in the Wickwood. The visual vocabulary is limited to ink contours, cut-paper silhouettes, woven cloth, brass, weathered timber, and a paper field journal. Art and animation are original code-native drawing paths; this is not a claim that the project was made without AI assistance.

## Reference study and decisions

| Area | Studied reference | What informed this version |
| --- | --- | --- |
| Environment and readability | [Alto’s Odyssey official press kit](https://altosodyssey.com/press/), including its animated ruin-jump capture | Separate distant scenery from the action plane; compose a landmark and negative space; use controlled color changes between environments. Cinderpath keeps its own forest, palette, perspective, and objects. |
| Animation process | [MLC’s account of animating Subway Surfers Blast](https://www.artstation.com/blogs/teammlcstudio/bVG0/the-character-animation-process-behind-subway-surfers-blast) | Build recognizable key poses before adding secondary motion. MLC describes blockout, anticipation, release, apex, and landing. The Cinderpath rig uses planted/passing/lifted foot phases, a tucked jump, a low slide, landing compression, and delayed tail/lantern motion. Blast is a separate game from the original runner. |
| Character and world consistency | [Tommy Kinnerup’s Subway Surfers animated-series production work](https://www.tommykinnerup.com/projects/q92K9N) | Treat character, props, location, and color as one visual system. This is an art-direction reference from the animated series, not evidence about the runner’s implementation. |
| Menu hierarchy | [Cedre Pradier’s Monument Valley UI work](https://cedrepradier.com/work/monument-valley-panoramic-edition) | Study the actual phone settings/menu images: few actions, a strong focal point, and visual continuity with the world. Cinderpath opens at camp and uses a single field-journal material for secondary screens. |
| Drawing pipeline | [Team Cherry’s introduction to Hollow Knight](https://www.teamcherry.com.au/blog/introducing-hollow-knight) and [Unity’s production case study](https://unity.com/made-with-unity/hollow-knight) | Distinctive silhouettes, layered 2D art, and traditional pose thinking can carry a game without complex 3D rendering. Cinderpath uses its own fox, fiction, contours, and drawing rig. No Hollow Knight assets were imported. |

These are design inferences from the linked references. No source asserts that a checklist can make art indistinguishable from human-created work. The practical target is consistent, specific, intentional art direction.

## Before and after

| System | Previous build | Lantern Post version |
| --- | --- | --- |
| Title screen | Marketing-style hero and scrolling road | Stationary camp, illustrated courier, one large timber Run sign |
| Character | Small hood silhouette with a simple leg swing | Fox ears, white-tipped tail, patched coat, scarf, boots, satchel, brass lantern; front view at camp and rear view in play |
| Run animation | Sine-driven feet and scaled slide | Eight gait poses interpolated through contact/down/passing/up, footfall dust and sound, bent knees, arm counter-swing |
| Jump/slide | Rigid upward movement / vertical scaling | Tucked legs, separate ground shadow, eased slide entry/exit, landing compression |
| Secondary motion | Cloak flutter | Head breathing/blink at camp; scarf, tail, and lantern phase lag during running |
| World | Repeated facets and striped straight track | Uneven tree silhouettes and branches, bark marks, ferns, mushrooms, mossy rocks, small cottage, distant tower, lightly curved trail and scattered stones |
| Collectibles | Differently colored diamonds | Flame-shaped cinders, green oil flask, violet horseshoe magnet, blue ward crest |
| HUD | Tiny generic labels and emoji | One set of original line glyphs, clear score and brass fuel gauge, compact corner controls |
| Secondary menus | Glass cards | Paper journal, stitched spine, stamped labels, outfit portraits drawn from the actual character rig |
| Sound | Repeating synth figure | Quieter plucked phrase with rests, footfall/landing cues, action sounds, and short menu taps |

## Implementation contract

The art layer must not decide collisions, rewards, or fairness. All existing saves, unlock prices, milestones, daily seeds, input mappings, and fixed-step simulation remain compatible. The new font is self-hosted Bree Serif under its bundled SIL Open Font License. The runner still has no external runtime asset requests, ads, or purchases.

Geometry caches are bounded: tree sprites cover twelve palette/variant combinations; the drawing-path cache retains at most 160 entries. Decorative motion respects the existing atmosphere setting. Critical movement poses continue to explain the game state. Mobile buttons remain at least 48 pixels high during play. Menus support keyboard focus and native dialog behavior.

## Visual verification

Reviewed desktop 1280 × 720, portrait 390 × 844, and compact 320 × 568. The first pass found distorted outfit portraits and a record label touching the Run button on the compact layout; both were corrected. Real browser runs confirmed the jump and slide states and their visible poses. The result screen and banked rewards still work. Art tests exercise gait continuity and finite, balanced drawing operations across actions, views, and tree variants.

Physical phone GPU performance and player reactions remain unmeasured. The next useful critique should focus on obstacle readability at speed, input timing, and whether the courier’s movement feels responsive rather than asking whether any individual image is “AI.”
