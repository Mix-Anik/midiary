/**
 * PianoRoll — dual-layer HTML5 Canvas piano roll visualisation.
 *
 * Layout:
 *   - 88-key horizontal keyboard fixed at the bottom of the canvas.
 *   - Note area above the keyboard: time flows upward (bottom = now, top = past).
 *   - A subtle indigo reference line runs across the very top of the note area.
 *
 * Layers:
 *   - Layer 1 (static canvas):  keyboard + pitch-column grid.
 *     Redrawn only on resize or session change (cheap).
 *   - Layer 2 (dynamic canvas): scrolling note rectangles + reference line.
 *     Redrawn every animation frame via requestAnimationFrame.
 *
 * DOM overlay layer on top of both canvases for plugin-injected React elements.
 */
import {
  useRef,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react';
import { Midi } from '@tonejs/midi';
import { usePlayerStore } from '../store/player';
import {
  KEYBOARD_HEIGHT,
  NUM_WHITE_KEYS,
  PIXELS_PER_SECOND,
  isBlackKey,
  pitchToX,
  timeToY,
  PIANO_FIRST_MIDI,
  PIANO_LAST_MIDI,
} from '../utils/pianoRoll';
import type { PianoRollOverlayProps } from '@midiary/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PianoRollNote {
  midi: number;
  time: number;
  duration: number;
  velocity: number;
}

interface Dims {
  w: number;
  h: number;
  dpr: number;
}

export interface PianoRollProps {
  /** URL that streams the .mid file for this session. */
  midiUrl: string;
  /** Duration of the audio in seconds (forwarded to overlay props). */
  duration: number;
  /**
   * Render-prop for plugin DOM overlays.
   * Receives up-to-date canvas metrics so plugins can position themselves.
   */
  renderOverlays?: (props: PianoRollOverlayProps) => ReactNode;
}

// ─── Canvas palette (fixed; looks great in both themes) ───────────────────────

const C_NOTE_AREA_BG  = '#0f1015';
const C_BLACK_COL     = 'rgba(0,0,0,0.38)';
const C_GRID_LINE     = 'rgba(255,255,255,0.04)';
const C_SEPARATOR     = 'rgba(255,255,255,0.10)';
const C_KEYBOARD_BG   = '#1a1b22';
const C_WHITE_KEY     = '#e8e3d9';
const C_WHITE_KEY_BD  = 'rgba(0,0,0,0.30)';
const C_BLACK_KEY     = '#0d0e12';
const C_REF_LINE      = 'rgba(99,102,241,0.45)';

const BLACK_KEY_HEIGHT_RATIO = 0.60;

// ─── Component ────────────────────────────────────────────────────────────────

export function PianoRoll({ midiUrl, duration, renderOverlays }: PianoRollProps) {
  const containerRef   = useRef<HTMLDivElement>(null);
  const staticRef      = useRef<HTMLCanvasElement>(null);
  const dynamicRef     = useRef<HTMLCanvasElement>(null);

  const notesRef       = useRef<PianoRollNote[]>([]);
  const dimsRef        = useRef<Dims>({ w: 0, h: 0, dpr: 1 });
  const rafRef         = useRef(0);
  const currentTimeRef = useRef(0);

  // For React overlay props (state update at resize cadence, not every frame)
  const [overlayDims, setOverlayDims] = useState({ w: 0, h: 0 });

  // Keep currentTime in sync via ref — no re-render needed for canvas
  const currentTime = usePlayerStore((s) => s.currentTime);
  currentTimeRef.current = currentTime;

  // ── Fetch + parse MIDI ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    notesRef.current = []; // clear while loading

    fetch(midiUrl)
      .then((r) => r.arrayBuffer())
      .then((buf) => {
        if (cancelled) return;
        const midi = new Midi(buf);
        const notes: PianoRollNote[] = [];
        for (const track of midi.tracks) {
          for (const note of track.notes) {
            if (note.midi >= PIANO_FIRST_MIDI && note.midi <= PIANO_LAST_MIDI) {
              notes.push({
                midi: note.midi,
                time: note.time,
                duration: note.duration,
                velocity: note.velocity,
              });
            }
          }
        }
        notesRef.current = notes;
      })
      .catch(() => { /* MIDI unavailable or unparseable — render empty roll */ });

    return () => { cancelled = true; };
  }, [midiUrl]);

  // ── Layer 1: static keyboard + pitch grid ────────────────────────────────

  const drawStatic = useCallback((w: number, h: number, dpr: number) => {
    const canvas = staticRef.current;
    if (!canvas || w === 0 || h === 0) return;

    canvas.width        = w * dpr;
    canvas.height       = h * dpr;
    canvas.style.width  = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const noteAreaH = h - KEYBOARD_HEIGHT;

    // Note-area background
    ctx.fillStyle = C_NOTE_AREA_BG;
    ctx.fillRect(0, 0, w, noteAreaH);

    // Slightly darker column bands under black keys
    for (let midi = PIANO_FIRST_MIDI; midi <= PIANO_LAST_MIDI; midi++) {
      if (isBlackKey(midi)) {
        const { x, width } = pitchToX(midi, w);
        ctx.fillStyle = C_BLACK_COL;
        ctx.fillRect(x, 0, width, noteAreaH);
      }
    }

    // Vertical grid lines at each white-key boundary
    ctx.strokeStyle = C_GRID_LINE;
    ctx.lineWidth   = 0.5;
    for (let midi = PIANO_FIRST_MIDI; midi <= PIANO_LAST_MIDI; midi++) {
      if (!isBlackKey(midi)) {
        const { x } = pitchToX(midi, w);
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, noteAreaH);
        ctx.stroke();
      }
    }

    // Separator between note area and keyboard
    ctx.strokeStyle = C_SEPARATOR;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, noteAreaH);
    ctx.lineTo(w, noteAreaH);
    ctx.stroke();

    // Keyboard background
    ctx.fillStyle = C_KEYBOARD_BG;
    ctx.fillRect(0, noteAreaH, w, KEYBOARD_HEIGHT);

    // White keys
    for (let midi = PIANO_FIRST_MIDI; midi <= PIANO_LAST_MIDI; midi++) {
      if (!isBlackKey(midi)) {
        const { x, width } = pitchToX(midi, w);
        ctx.fillStyle   = C_WHITE_KEY;
        ctx.fillRect(x + 0.5, noteAreaH + 0.5, width - 1, KEYBOARD_HEIGHT - 1);
        ctx.strokeStyle = C_WHITE_KEY_BD;
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(x + 0.5, noteAreaH + 0.5, width - 1, KEYBOARD_HEIGHT - 1);
      }
    }

    // Black keys (drawn on top of white keys)
    const bkh = KEYBOARD_HEIGHT * BLACK_KEY_HEIGHT_RATIO;
    for (let midi = PIANO_FIRST_MIDI; midi <= PIANO_LAST_MIDI; midi++) {
      if (isBlackKey(midi)) {
        const { x, width } = pitchToX(midi, w);
        ctx.fillStyle = C_BLACK_KEY;
        ctx.fillRect(x, noteAreaH, width, bkh);
        // subtle sheen on top edge
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x + 1, noteAreaH + 1, width - 2, 2);
      }
    }
  }, []);

  // ── Layer 2: scrolling notes + reference line ─────────────────────────────

  const drawDynamic = useCallback((w: number, h: number, dpr: number, t: number) => {
    const canvas = dynamicRef.current;
    if (!canvas || w === 0 || h === 0) return;

    // Resize canvas only when dimensions change (avoids clearing on every frame)
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width        = w * dpr;
      canvas.height       = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const noteAreaH    = h - KEYBOARD_HEIGHT;
    const visibleStart = t - noteAreaH / PIXELS_PER_SECOND;

    // ── Note rectangles ──────────────────────────────────────────────────────
    for (const note of notesRef.current) {
      // Cull notes entirely outside the visible time window
      if (note.time + note.duration < visibleStart) continue;
      if (note.time > t) continue;

      const { x, width: kw } = pitchToX(note.midi, w);
      // note.time = onset (older = higher on screen = smaller y)
      // note.time + duration = offset (more recent = lower on screen = larger y)
      const yTop    = timeToY(note.time, t, noteAreaH);
      const yBottom = timeToY(note.time + note.duration, t, noteAreaH);
      const noteH   = Math.max(2, yBottom - yTop);

      // Clamp to the note area; yTop < yBottom so clamp accordingly
      const drawTop    = Math.max(0, yTop);
      const drawBottom = Math.min(noteAreaH, yBottom);
      const drawH      = drawBottom - drawTop;
      if (drawH <= 0) continue;

      const alpha = 0.50 + note.velocity * 0.50;

      // Body
      ctx.fillStyle = `rgba(99,102,241,${alpha.toFixed(2)})`;
      ctx.fillRect(x + 1, drawTop, kw - 2, drawH);

      // Highlight stripe at the top of the note (the older / upper edge)
      if (yTop >= 0 && drawH > 3) {
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(x + 1, drawTop, kw - 2, 3);
      }
    }

    // ── Reference line at top edge of note area ──────────────────────────────
    ctx.strokeStyle = C_REF_LINE;
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 1);
    ctx.lineTo(w, 1);
    ctx.stroke();
  }, []);

  // ── RAF animation loop ────────────────────────────────────────────────────

  const animate = useCallback(() => {
    const { w, h, dpr } = dimsRef.current;
    drawDynamic(w, h, dpr, currentTimeRef.current);
    rafRef.current = requestAnimationFrame(animate);
  }, [drawDynamic]);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animate]);

  // ── ResizeObserver ────────────────────────────────────────────────────────

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = (w: number, h: number) => {
      const dpr = window.devicePixelRatio || 1;
      dimsRef.current = { w, h, dpr };
      drawStatic(w, h, dpr);
      // Prime the dynamic canvas dimensions (content drawn on next RAF tick)
      const dc = dynamicRef.current;
      if (dc) {
        dc.width        = w * dpr;
        dc.height       = h * dpr;
        dc.style.width  = `${w}px`;
        dc.style.height = `${h}px`;
      }
      setOverlayDims({ w, h });
    };

    const ro = new ResizeObserver((entries) => {
      const e = entries[0];
      if (!e) return;
      const { width, height } = e.contentRect;
      if (width > 0 && height > 0) handleResize(Math.floor(width), Math.floor(height));
    });

    ro.observe(container);
    const rect = container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      handleResize(Math.floor(rect.width), Math.floor(rect.height));
    }

    return () => ro.disconnect();
  }, [drawStatic]);

  // ── Plugin overlay props ──────────────────────────────────────────────────
  //
  // `pitchToX` here returns only the left-edge x (matching PianoRollOverlayProps).
  // `timeToY` adjusts for the keyboard strip so plugins work in note-area coords.

  const overlayProps: PianoRollOverlayProps = {
    currentTime,
    duration,
    canvasWidth:  overlayDims.w,
    canvasHeight: overlayDims.h,
    pitchToX: (midi: number) => pitchToX(midi, overlayDims.w).x,
    timeToY: (seconds: number, currentT: number, canvasH: number) =>
      timeToY(seconds, currentT, canvasH - KEYBOARD_HEIGHT),
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-lg border border-[var(--border)]"
      aria-label="Piano roll visualisation"
    >
      {/* Layer 1 – static keyboard + grid */}
      <canvas ref={staticRef}  className="absolute inset-0 pointer-events-none" />
      {/* Layer 2 – scrolling notes + reference line */}
      <canvas ref={dynamicRef} className="absolute inset-0 pointer-events-none" />
      {/* DOM overlay for plugin React components */}
      {renderOverlays && (
        <div className="absolute inset-0 pointer-events-none">
          {renderOverlays(overlayProps)}
        </div>
      )}
    </div>
  );
}
