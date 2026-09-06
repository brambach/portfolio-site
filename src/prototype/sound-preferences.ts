const key = 'bryce-portfolio-sound';
export function readSoundPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? '{}');
    return { muted: stored.muted === true, volume: typeof stored.volume === 'number' && Number.isFinite(stored.volume) ? Math.max(0, Math.min(1, stored.volume)) : .32 };
  } catch { return { muted: false, volume: .32 }; }
}
export function saveSoundPreferences(muted: boolean, volume: number) {
  try { localStorage.setItem(key, JSON.stringify({ muted, volume })); } catch { /* Sound still works when storage is unavailable. */ }
}
