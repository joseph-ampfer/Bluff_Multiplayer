/**
 * Phase 6 audio engine.
 *
 * Singleton-style module (no React state) that owns:
 *   - a preloaded SFX bank (one Audio per name, cloned on each play so
 *     overlapping plays don't cut each other off)
 *   - a single looping music element
 *   - mute/volume controls for each
 *   - localStorage persistence
 *   - primeAudio() which is called on the first user gesture to satisfy
 *     browsers' autoplay policy
 *
 * Missing files don't blow up — playSfx/startMusic swallow the rejected
 * play() promise so the rest of the UI still works while the audio assets
 * are still being gathered.
 */

export type SfxName =
  | 'cardSelect'
  | 'cardFlick'
  | 'cardDeal'
  | 'button'
  | 'turnBell'
  | 'liarCall'
  | 'reveal'
  | 'gunclick'
  | 'gunshot'
  | 'win';

const SFX_FILES: Record<SfxName, string> = {
  cardSelect: '/sfx/card-select.mp3',
  cardFlick: '/sfx/card-flick.mp3',
  cardDeal: '/sfx/card-deal.mp3',
  button: '/sfx/button.mp3',
  turnBell: '/sfx/turn-bell.mp3',
  liarCall: '/sfx/liar-call.mp3',
  reveal: '/sfx/reveal.mp3',
  gunclick: '/sfx/gunclick.mp3',
  gunshot: '/sfx/gunshot.mp3',
  win: '/sfx/win.mp3',
};

const MUSIC_FILE = '/music/saloon-piano.mp3';

const LS_KEYS = {
  sfxVolume: 'liarsdeck.audio.sfxVolume',
  sfxMuted: 'liarsdeck.audio.sfxMuted',
  musicVolume: 'liarsdeck.audio.musicVolume',
  musicMuted: 'liarsdeck.audio.musicMuted',
} as const;

function readNumber(key: string, fallback: number): number {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
  } catch {
    return fallback;
  }
}

function readBool(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return raw === '1' || raw === 'true';
  } catch {
    return fallback;
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // ignore quota / privacy errors
  }
}

function writeBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // ignore quota / privacy errors
  }
}

interface AudioState {
  sfxVolume: number;
  sfxMuted: boolean;
  musicVolume: number;
  musicMuted: boolean;
  primed: boolean;
  musicPlaying: boolean;
  sfxBank: Map<SfxName, HTMLAudioElement>;
  music: HTMLAudioElement | null;
  listeners: Set<() => void>;
}

const state: AudioState = {
  sfxVolume: readNumber(LS_KEYS.sfxVolume, 0.7),
  sfxMuted: readBool(LS_KEYS.sfxMuted, false),
  musicVolume: readNumber(LS_KEYS.musicVolume, 0.4),
  // Music defaults to muted (per plan).
  musicMuted: readBool(LS_KEYS.musicMuted, true),
  primed: false,
  musicPlaying: false,
  sfxBank: new Map(),
  music: null,
  listeners: new Set(),
};

function notify() {
  for (const fn of state.listeners) fn();
}

function ensureSfxBank() {
  if (state.sfxBank.size > 0) return;
  if (typeof Audio === 'undefined') return;
  for (const [name, src] of Object.entries(SFX_FILES) as [SfxName, string][]) {
    try {
      const a = new Audio(src);
      a.preload = 'auto';
      a.volume = state.sfxMuted ? 0 : state.sfxVolume;
      state.sfxBank.set(name, a);
    } catch {
      // ignore — playSfx will no-op for missing entries
    }
  }
}

function ensureMusic() {
  if (state.music) return;
  if (typeof Audio === 'undefined') return;
  try {
    const m = new Audio(MUSIC_FILE);
    m.preload = 'auto';
    m.loop = true;
    m.volume = state.musicMuted ? 0 : state.musicVolume;
    state.music = m;
  } catch {
    // ignore
  }
}

/**
 * Trigger one shot of an SFX. Safe to call before priming; the play()
 * promise is swallowed so missing files / pre-gesture failures don't
 * surface as unhandled rejections.
 */
export function playSfx(name: SfxName) {
  if (state.sfxMuted) return;
  ensureSfxBank();
  const base = state.sfxBank.get(name);
  if (!base) return;
  try {
    // Clone so overlapping plays don't restart the same element.
    const inst = base.cloneNode(true) as HTMLAudioElement;
    inst.volume = state.sfxVolume;
    const p = inst.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      (p as Promise<void>).catch(() => {
        /* missing file or autoplay block — silent no-op */
      });
    }
  } catch {
    // ignore
  }
}

export function getSfxVolume(): number {
  return state.sfxVolume;
}

export function getSfxMuted(): boolean {
  return state.sfxMuted;
}

export function setSfxVolume(v: number) {
  const next = Math.max(0, Math.min(1, v));
  state.sfxVolume = next;
  writeNumber(LS_KEYS.sfxVolume, next);
  for (const a of state.sfxBank.values()) {
    a.volume = state.sfxMuted ? 0 : next;
  }
  notify();
}

export function setSfxMuted(b: boolean) {
  state.sfxMuted = b;
  writeBool(LS_KEYS.sfxMuted, b);
  for (const a of state.sfxBank.values()) {
    a.volume = b ? 0 : state.sfxVolume;
  }
  notify();
}

export function getMusicVolume(): number {
  return state.musicVolume;
}

export function getMusicMuted(): boolean {
  return state.musicMuted;
}

export function setMusicVolume(v: number) {
  const next = Math.max(0, Math.min(1, v));
  state.musicVolume = next;
  writeNumber(LS_KEYS.musicVolume, next);
  if (state.music) {
    state.music.volume = state.musicMuted ? 0 : next;
  }
  notify();
}

export function setMusicMuted(b: boolean) {
  state.musicMuted = b;
  writeBool(LS_KEYS.musicMuted, b);
  ensureMusic();
  if (state.music) {
    state.music.volume = b ? 0 : state.musicVolume;
  }
  if (b) {
    stopMusic();
  } else if (state.primed) {
    startMusic();
  }
  notify();
}

export function startMusic() {
  ensureMusic();
  if (!state.music || state.musicMuted) return;
  try {
    const p = state.music.play();
    if (p && typeof (p as Promise<void>).catch === 'function') {
      (p as Promise<void>)
        .then(() => {
          state.musicPlaying = true;
          notify();
        })
        .catch(() => {
          // autoplay blocked or file missing
        });
    } else {
      state.musicPlaying = true;
      notify();
    }
  } catch {
    // ignore
  }
}

export function stopMusic() {
  if (!state.music) return;
  try {
    state.music.pause();
    state.music.currentTime = 0;
  } catch {
    // ignore
  }
  state.musicPlaying = false;
  notify();
}

/**
 * Call on any user gesture (button click) to satisfy autoplay policy.
 * Idempotent. Once primed, future startMusic() calls don't need a new
 * gesture.
 */
export function primeAudio() {
  if (state.primed) return;
  state.primed = true;
  ensureSfxBank();
  ensureMusic();

  // Touch the music element with a silent play/pause so subsequent
  // play() calls (e.g. when the user toggles music on) inherit the
  // gesture.
  if (state.music) {
    try {
      const original = state.music.volume;
      state.music.volume = 0;
      const p = state.music.play();
      const finish = () => {
        try {
          state.music?.pause();
          if (state.music) state.music.currentTime = 0;
          if (state.music) state.music.volume = state.musicMuted ? 0 : state.musicVolume;
        } catch {
          // ignore
        }
        // If the user already opted into music, start it for real.
        if (!state.musicMuted) {
          startMusic();
        }
      };
      if (p && typeof (p as Promise<void>).then === 'function') {
        (p as Promise<void>).then(finish).catch(() => {
          // autoplay blocked — restore volume anyway
          if (state.music) state.music.volume = original;
        });
      } else {
        finish();
      }
    } catch {
      // ignore
    }
  }
  notify();
}

/** Subscribe to mute/volume/music-state changes. Returns an unsubscribe. */
export function subscribeAudio(fn: () => void): () => void {
  state.listeners.add(fn);
  return () => {
    state.listeners.delete(fn);
  };
}

export function isMusicPlaying(): boolean {
  return state.musicPlaying;
}
