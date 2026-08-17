/**
 * Quiet synthesized mix. No audio assets: every cue is a short WebAudio
 * envelope so the slice stays self-contained and the mix stays low.
 * Presentation only — it never invents hits, pickups, or fuel; it plays
 * the events the sim already emitted.
 */

export const CUE = Object.freeze({
  SLAM: "slam", // blocker shoulder slam lands
  SPIT: "spit", // snuff spit lands
  OIL: "oil", // bright oil picked up
  GRIT: "grit", // swing startup scrape
  FLARE: "flare", // swing active whoosh
  RING: "ring", // enemy telegraph ring
  HIT: "hit", // lantern arc lands
  LUNGE: "lunge", // wight lunge lands
  KILL: "kill",
  PICKUP: "pickup", // cinder
  SHRINE: "shrine",
  WIN: "win",
  LOSE: "lose",
  WAVE: "wave",
  DENIED: "denied", // swing refused for lack of wick
});

const RING_VARIANT = Object.freeze({
  ember: 220, // hot, low: lunge and slam
  ice: 520, // cold, high: snuff spit
});

/**
 * Deterministic profile for a cue. `variant` picks between related
 * sounds (telegraph ring color). Pure — no context needed.
 */
export function cueProfile(cue, variant = "") {
  switch (cue) {
    case CUE.SLAM:
      return { kind: "thud", base: 95, end: 45, dur: 0.16, gain: 0.5, body: 300 };
    case CUE.SPIT:
      return { kind: "puff", base: 520, end: 300, dur: 0.12, gain: 0.3, air: 1800 };
    case CUE.OIL:
      return { kind: "chime", base: 660, end: 880, dur: 0.28, gain: 0.3 };
    case CUE.GRIT:
      return { kind: "scrape", base: 2500, dur: 0.07, gain: 0.16 };
    case CUE.FLARE:
      return { kind: "whoosh", base: 400, end: 1600, dur: 0.16, gain: 0.22, shimmer: 1200 };
    case CUE.RING:
      return { kind: "ring", base: RING_VARIANT[variant] || RING_VARIANT.ember, dur: 0.18, gain: 0.14 };
    case CUE.HIT:
      return { kind: "crack", base: 180, dur: 0.09, gain: 0.34 };
    case CUE.LUNGE:
      return { kind: "growl", base: 130, end: 90, dur: 0.14, gain: 0.26 };
    case CUE.KILL:
      return { kind: "pop", base: 440, end: 330, dur: 0.2, gain: 0.3 };
    case CUE.PICKUP:
      return { kind: "sparkle", base: 990, dur: 0.09, gain: 0.16 };
    case CUE.SHRINE:
      return { kind: "bloom", base: 440, end: 660, dur: 0.5, gain: 0.3 };
    case CUE.WIN:
      return { kind: "rise", base: 523, end: 784, dur: 0.9, gain: 0.3 };
    case CUE.LOSE:
      return { kind: "fall", base: 220, end: 110, dur: 0.8, gain: 0.24 };
    case CUE.WAVE:
      return { kind: "pulse", base: 110, dur: 0.3, gain: 0.22 };
    case CUE.DENIED:
      return { kind: "click", base: 140, dur: 0.05, gain: 0.12 };
    default:
      return { kind: "silent", base: 0, dur: 0, gain: 0 };
  }
}

function ringVariantFor(moveId) {
  return moveId === "snuff_spit" ? "ice" : "ember";
}

/**
 * Map a frame of sim events to cues. Pure and deterministic.
 */
export function cuesFor(events) {
  const cues = [];
  for (const event of events || []) {
    switch (event.type) {
      case "swing_start":
        cues.push({ cue: CUE.GRIT });
        break;
      case "swing_active":
        cues.push({ cue: CUE.FLARE });
        break;
      case "hit":
        if (event.source === "player") cues.push({ cue: CUE.HIT });
        else if (event.moveId === "shoulder_slam") cues.push({ cue: CUE.SLAM });
        else if (event.moveId === "snuff_spit") cues.push({ cue: CUE.SPIT });
        else cues.push({ cue: CUE.LUNGE });
        break;
      case "kill":
        cues.push({ cue: CUE.KILL });
        break;
      case "pickup":
        cues.push({ cue: CUE.PICKUP });
        break;
      case "upgrade":
        cues.push({ cue: CUE.OIL });
        break;
      case "shrine_lit":
        cues.push({ cue: CUE.SHRINE });
        break;
      case "win":
        cues.push({ cue: CUE.WIN });
        break;
      case "lose":
        cues.push({ cue: CUE.LOSE });
        break;
      case "wave_announce":
        cues.push({ cue: CUE.WAVE });
        break;
      case "swing_denied":
        cues.push({ cue: CUE.DENIED });
        break;
      case "enemy_telegraph":
        cues.push({ cue: CUE.RING, variant: ringVariantFor(event.moveId) });
        break;
      default:
        break;
    }
  }
  return cues;
}

const MASTER_GAIN = 0.5;

export function createAudio({ ctx = null } = {}) {
  if (!ctx) {
    return {
      play() {},
      unlock() {},
      dispose() {},
      setMuted() {},
      isMuted() {
        return false;
      },
    };
  }

  const master = ctx.createGain();
  master.gain.value = MASTER_GAIN;
  master.connect(ctx.destination);
  let muted = false;

  // One shared noise buffer for every breathy cue.
  const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.5, ctx.sampleRate);
  {
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
  }

  function tone({ freq, endFreq = freq, dur, gain, type = "sine", when = 0, attack = 0.008 }) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    if (endFreq !== freq) osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), when + dur);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g);
    g.connect(master);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  function noise({ dur, gain, filterType = "bandpass", freq = 1000, q = 1, when = 0, attack = 0.006 }) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(master);
    src.start(when);
    src.stop(when + dur + 0.02);
  }

  function playCue(cue, variant = "") {
    const p = cueProfile(cue, variant);
    const when = ctx.currentTime + 0.01;
    switch (p.kind) {
      case "thud":
        tone({ freq: p.base, endFreq: p.end, dur: p.dur, gain: p.gain, type: "sine", when });
        noise({ dur: p.dur, gain: p.gain * 0.4, filterType: "lowpass", freq: p.body, when });
        break;
      case "puff":
        noise({ dur: p.dur, gain: p.gain, filterType: "bandpass", freq: p.air, q: 1.4, when });
        tone({ freq: p.base, endFreq: p.end, dur: p.dur, gain: p.gain * 0.5, when });
        break;
      case "chime":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, when });
        tone({ freq: p.end, dur: p.dur * 1.2, gain: p.gain * 0.7, when: when + 0.09 });
        break;
      case "scrape":
        noise({ dur: p.dur, gain: p.gain, filterType: "highpass", freq: p.base, when });
        break;
      case "whoosh":
        noise({ dur: p.dur, gain: p.gain, filterType: "bandpass", freq: p.base, q: 0.8, when });
        tone({ freq: p.shimmer, endFreq: p.end, dur: p.dur, gain: p.gain * 0.5, when });
        break;
      case "ring":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, when });
        tone({ freq: p.base * 1.5, dur: p.dur * 0.7, gain: p.gain * 0.35, when });
        break;
      case "crack":
        tone({ freq: p.base, endFreq: p.base * 0.6, dur: p.dur, gain: p.gain, type: "triangle", when });
        noise({ dur: p.dur, gain: p.gain * 0.5, filterType: "highpass", freq: 2000, when });
        break;
      case "growl":
        tone({ freq: p.base, endFreq: p.end, dur: p.dur, gain: p.gain, type: "sawtooth", when });
        break;
      case "pop":
        tone({ freq: p.base, endFreq: p.end, dur: p.dur, gain: p.gain, when });
        break;
      case "sparkle":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, when });
        break;
      case "bloom":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, when });
        tone({ freq: p.end, dur: p.dur * 0.8, gain: p.gain * 0.6, when: when + 0.12 });
        break;
      case "rise":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, when });
        tone({ freq: p.base * 1.25, dur: p.dur * 0.8, gain: p.gain * 0.7, when: when + 0.18 });
        tone({ freq: p.end, dur: p.dur * 0.6, gain: p.gain * 0.5, when: when + 0.36 });
        break;
      case "fall":
        tone({ freq: p.base, endFreq: p.end, dur: p.dur, gain: p.gain, when });
        break;
      case "pulse":
        tone({ freq: p.base, dur: p.dur * 0.5, gain: p.gain, when });
        tone({ freq: p.base, dur: p.dur * 0.5, gain: p.gain * 0.7, when: when + 0.16 });
        break;
      case "click":
        tone({ freq: p.base, dur: p.dur, gain: p.gain, type: "square", when });
        break;
      default:
        break;
    }
  }

  return {
    play(cues) {
      if (muted) return;
      for (const item of cues || []) playCue(item.cue, item.variant || "");
    },
    unlock() {
      if (ctx.state === "suspended") ctx.resume();
    },
    setMuted(next) {
      muted = Boolean(next);
    },
    isMuted() {
      return muted;
    },
    dispose() {
      try {
        ctx.close();
      } catch {
        // already closed
      }
    },
  };
}
