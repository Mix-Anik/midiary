import { useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../store/player';
import { formatDuration } from '../utils/format';

interface AudioPlayerProps {
  sessionId: string;
  audioSrc: string;
}

export function AudioPlayer({ sessionId, audioSrc }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const {
    isPlaying, currentTime, duration, volume,
    setAudioEl, loadSession, togglePlay, setVolume,
  } = usePlayerStore();

  // Register the audio element once
  useEffect(() => {
    if (audioRef.current) setAudioEl(audioRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load new session when src changes
  useEffect(() => {
    loadSession(sessionId, audioSrc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, audioSrc]);

  const toggleMute = () => setVolume(volume === 0 ? 1 : 0);
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-4 px-4 h-[var(--player-height)] bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-sm">
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="metadata" />

      {/* Play / Pause */}
      <button
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors flex-shrink-0"
      >
        {isPlaying ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
      </button>

      {/* Progress track (thin version — main timeline is in TimelineBar) */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="w-full h-0.5 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent)] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {formatDuration(currentTime)}
          </span>
          <span
            className="text-xs text-[var(--text-muted)]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {duration > 0 ? formatDuration(duration) : '--:--'}
          </span>
        </div>
      </div>

      {/* Volume */}
      <button
        onClick={toggleMute}
        aria-label={volume === 0 ? 'Unmute' : 'Mute'}
        className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
      >
        {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
    </div>
  );
}
