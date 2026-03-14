import { create } from 'zustand';

interface PlayerState {
  audioEl: HTMLAudioElement | null;
  sessionId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  // Internal: track RAF handle for smooth time updates
  _rafHandle: number;

  /** Bind a new <audio> element (called from AudioPlayer component on mount). */
  setAudioEl: (el: HTMLAudioElement) => void;
  /** Load a new session's audio. */
  loadSession: (sessionId: string, src: string) => void;
  /** Toggle play/pause. */
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  /** Seek to seconds. */
  seek: (seconds: number) => void;
  setVolume: (v: number) => void;
  /** Called internally to sync currentTime from the audio element. */
  _tick: () => void;
  _stopTick: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  audioEl: null,
  sessionId: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  _rafHandle: 0,

  setAudioEl: (el) => {
    const existing = get().audioEl;
    if (existing) {
      existing.pause();
      existing.src = '';
    }

    el.volume = get().volume;

    el.addEventListener('loadedmetadata', () => {
      set({ duration: el.duration || 0 });
    });
    el.addEventListener('ended', () => {
      set({ isPlaying: false, currentTime: el.duration || 0 });
      get()._stopTick();
    });
    el.addEventListener('durationchange', () => {
      set({ duration: el.duration || 0 });
    });

    set({ audioEl: el });
  },

  loadSession: (sessionId, src) => {
    const { audioEl, _stopTick } = get();
    _stopTick();
    if (!audioEl) return;
    audioEl.pause();
    audioEl.src = src;
    audioEl.load();
    set({ sessionId, isPlaying: false, currentTime: 0, duration: 0 });
  },

  play: () => {
    const { audioEl, _tick } = get();
    if (!audioEl) return;
    audioEl.play().then(() => {
      set({ isPlaying: true });
      _tick();
    }).catch(() => {
      // autoplay blocked or src not ready — ignore
    });
  },

  pause: () => {
    const { audioEl, _stopTick } = get();
    if (!audioEl) return;
    audioEl.pause();
    set({ isPlaying: false, currentTime: audioEl.currentTime });
    _stopTick();
  },

  togglePlay: () => {
    const { isPlaying, play, pause } = get();
    if (isPlaying) pause(); else play();
  },

  seek: (seconds) => {
    const { audioEl } = get();
    if (!audioEl) return;
    audioEl.currentTime = Math.max(0, Math.min(seconds, audioEl.duration || 0));
    set({ currentTime: audioEl.currentTime });
  },

  setVolume: (v) => {
    const { audioEl } = get();
    const clamped = Math.max(0, Math.min(1, v));
    if (audioEl) audioEl.volume = clamped;
    set({ volume: clamped });
  },

  _tick: () => {
    const { audioEl, isPlaying } = get();
    if (!audioEl || !isPlaying) return;
    set({ currentTime: audioEl.currentTime });
    const handle = requestAnimationFrame(() => get()._tick());
    set({ _rafHandle: handle });
  },

  _stopTick: () => {
    const { _rafHandle } = get();
    if (_rafHandle) cancelAnimationFrame(_rafHandle);
    set({ _rafHandle: 0 });
  },
}));
