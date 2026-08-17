import test from "node:test";
import assert from "node:assert/strict";
import { CUE, createAudio, cueProfile, cuesFor } from "../src/audio.js";

test("cuesFor maps every sim event to a cue", () => {
  const events = [
    { type: "swing_start" },
    { type: "swing_active" },
    { type: "hit", source: "player", moveId: "lantern_arc" },
    { type: "hit", source: "ash_blocker_1", moveId: "shoulder_slam" },
    { type: "hit", source: "ash_snuffer_1", moveId: "snuff_spit" },
    { type: "hit", source: "ash_wight_1", moveId: "snuff_lunge" },
    { type: "kill" },
    { type: "pickup" },
    { type: "upgrade", id: "bright_oil" },
    { type: "shrine_lit" },
    { type: "win" },
    { type: "lose" },
    { type: "wave_announce" },
    { type: "swing_denied" },
    { type: "enemy_telegraph", moveId: "shoulder_slam" },
    { type: "enemy_telegraph", moveId: "snuff_spit" },
  ];
  const cues = cuesFor(events);
  assert.deepEqual(
    cues.map((c) => c.cue),
    [
      CUE.GRIT,
      CUE.FLARE,
      CUE.HIT,
      CUE.SLAM,
      CUE.SPIT,
      CUE.LUNGE,
      CUE.KILL,
      CUE.PICKUP,
      CUE.OIL,
      CUE.SHRINE,
      CUE.WIN,
      CUE.LOSE,
      CUE.WAVE,
      CUE.DENIED,
      CUE.RING,
      CUE.RING,
    ],
  );
});

test("the six headline cues are distinct", () => {
  const hero = [CUE.SLAM, CUE.SPIT, CUE.OIL, CUE.GRIT, CUE.FLARE, CUE.RING];
  const seen = new Set();
  for (const cue of hero) {
    const p = cueProfile(cue);
    const key = `${p.kind}|${p.base}`;
    assert.ok(!seen.has(key), `${cue} must not share a profile with another headline cue`);
    seen.add(key);
  }
});

test("ring varies with the telegraph color", () => {
  const ember = cueProfile(CUE.RING, "ember");
  const ice = cueProfile(CUE.RING, "ice");
  assert.notEqual(ember.base, ice.base);
  assert.ok(ice.base > ember.base, "ice telegraphs should ring higher and colder");
});

test("createAudio without a WebAudio context stays silent", () => {
  const audio = createAudio({ ctx: null });
  assert.doesNotThrow(() => audio.play([]));
  assert.doesNotThrow(() => audio.play([{ type: "swing_start" }, { type: "hit", source: "player", moveId: "lantern_arc" }]));
  audio.dispose();
});
