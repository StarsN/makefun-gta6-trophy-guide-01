// store.js — progress state for the Leonida Platinum Atlas.
// Progress lives in the browser's localStorage: which trophies are earned, the
// per-trophy counters for the trophies PlayStation tracks a count for, and the
// spoiler setting. It can be exported to a JSON file and imported back.

const STORAGE_KEY = 'leonida-platinum-atlas/v1';

const defaultState = () => ({ earned: {}, counts: {}, spoilers: false });

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return {
      earned: parsed.earned && typeof parsed.earned === 'object' ? parsed.earned : {},
      counts: parsed.counts && typeof parsed.counts === 'object' ? parsed.counts : {},
      spoilers: parsed.spoilers === true,
    };
  } catch {
    return defaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: the tracker keeps working for this session.
  }
}

function isEarned(state, id) {
  return state.earned[id] === true;
}

function setEarned(state, id, earned) {
  if (earned) state.earned[id] = true;
  else delete state.earned[id];
  saveState(state);
}

function getCount(state, id) {
  const n = Number(state.counts[id]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

function setCount(state, id, value) {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  if (n > 0) state.counts[id] = n;
  else delete state.counts[id];
  saveState(state);
}

function exportProgress(state) {
  const payload = {
    app: 'leonida-platinum-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: state.earned,
    counts: state.counts,
    spoilers: state.spoilers,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function parseImportedProgress(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('not a progress file');
  const earned = {};
  const counts = {};
  if (parsed.earned && typeof parsed.earned === 'object') {
    for (const [key, value] of Object.entries(parsed.earned)) if (value === true) earned[key] = true;
  }
  if (parsed.counts && typeof parsed.counts === 'object') {
    for (const [key, value] of Object.entries(parsed.counts)) {
      const n = Math.floor(Number(value));
      if (Number.isFinite(n) && n > 0) counts[key] = n;
    }
  }
  return { earned, counts, spoilers: parsed.spoilers === true };
}
