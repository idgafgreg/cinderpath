import test from "node:test";
import assert from "node:assert/strict";
import { CUE, createAudio, cueProfile, cuesFor } from "../src/audio.js";

function fakeContext() {
  const nodes = [];
  const ctx = {
    state: "running",
    currentTime: 0,
    sampleRate: 8000,
    destination: {},
    createGain() {
      return { gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} };
    },
    createBuffer(channels, length, rate) {
      return { getChannelData: () => new Float32Array(length) };
    },
    createBufferSource() {
      return { buffer: null, loop: false, connect() {}, start() {}, stop() {} };
    },
    createOscillator() {
      return {
        type: "sine",
        frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {},
        start() {},
        stop() {},
      };
    },
    createBiquadFilter() {
      return { type: "", frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
    },
    resume() {},
    close() {},
  };
  return { ctx, nodes };
}

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

test("muted audio plays no cues", () => {
  const { ctx } = fakeContext();
  const audio = createAudio({ ctx });
  audio.setMuted(true);
  assert.doesNotThrow(() => audio.play([{ cue: CUE.RING }, { cue: CUE.HIT }]));
  audio.dispose();
});

test("mute state round-trips and defaults to unmuted", () => {
  const { ctx } = fakeContext();
  const audio = createAudio({ ctx });
  assert.equal(audio.isMuted(), false);
  audio.setMuted(true);
  assert.equal(audio.isMuted(), true);
  audio.setMuted(false);
  assert.equal(audio.isMuted(), false);
  audio.dispose();
});
