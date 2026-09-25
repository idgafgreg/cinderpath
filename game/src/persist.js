import { serializeGhost, serializeSave } from "./sim.js";

function safeStorage() { try { return globalThis.localStorage; } catch { return null; } }

export const SAVE_KEY = "cinderpath-save-v1";
export const GHOST_KEY = "cinderpath-ghost-v1";
export const SOUND_KEY = "cinderpath-sound-v1";

export function loadSave(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeCheckpoint(state, storage = safeStorage()) {
  if (!storage) return null;
  const blob = serializeSave(state);
  try { storage.setItem(SAVE_KEY, JSON.stringify(blob)); } catch { return null; }
  return blob;
}

export function clearSave(storage = safeStorage()) {
  if (!storage) return;
  try { storage.removeItem(SAVE_KEY); } catch { /* Storage may be disabled. */ }
}

export function loadGhost(storage = safeStorage()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(GHOST_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.samples?.length) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeGhost(state, storage = safeStorage()) {
  if (!storage) return null;
  const blob = serializeGhost(state);
  if (!blob.samples.length) return null;
  try { storage.setItem(GHOST_KEY, JSON.stringify(blob)); } catch { return null; }
  return blob;
}

export function loadSoundPref(storage = safeStorage()) {
  if (!storage) return true;
  try {
    const raw = storage.getItem(SOUND_KEY);
    if (!raw) return true;
    const data = JSON.parse(raw);
    return data?.muted === true ? false : true;
  } catch {
    return true;
  }
}

export function writeSoundPref(soundOn, storage = safeStorage()) {
  if (!storage) return;
  try { storage.setItem(SOUND_KEY, JSON.stringify({ v: 1, muted: !Boolean(soundOn) })); } catch { /* Keep the session playable. */ }
}
