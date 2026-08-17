import { serializeGhost, serializeSave } from "./sim.js";

export const SAVE_KEY = "cinderpath-save-v1";
export const GHOST_KEY = "cinderpath-ghost-v1";

export function loadSave(storage = globalThis.localStorage) {
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

export function writeCheckpoint(state, storage = globalThis.localStorage) {
  if (!storage) return null;
  const blob = serializeSave(state);
  storage.setItem(SAVE_KEY, JSON.stringify(blob));
  return blob;
}

export function clearSave(storage = globalThis.localStorage) {
  if (!storage) return;
  storage.removeItem(SAVE_KEY);
}

export function loadGhost(storage = globalThis.localStorage) {
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

export function writeGhost(state, storage = globalThis.localStorage) {
  if (!storage) return null;
  const blob = serializeGhost(state);
  if (!blob.samples.length) return null;
  storage.setItem(GHOST_KEY, JSON.stringify(blob));
  return blob;
}
