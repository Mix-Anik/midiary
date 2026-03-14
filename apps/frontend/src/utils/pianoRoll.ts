/**
 * Piano roll coordinate utilities and constants.
 *
 * Pure functions — no React, no side effects. Safe to import from canvas
 * draw functions, plugin overlays, and anywhere else.
 */

// ─── Piano range ───────────────────────────────────────────────────────────────

/** First MIDI note rendered (A0). */
export const PIANO_FIRST_MIDI = 21;
/** Last MIDI note rendered (C8). */
export const PIANO_LAST_MIDI  = 108;

// ─── Canvas dimensions ─────────────────────────────────────────────────────────

/** Height of the static keyboard strip at the bottom of the canvas (logical px). */
export const KEYBOARD_HEIGHT = 72;

/** How many logical pixels correspond to one second of audio. */
export const PIXELS_PER_SECOND = 120;

// ─── Key layout ───────────────────────────────────────────────────────────────

/**
 * For each semitone within an octave (0 = C … 11 = B):
 * white key index (0–6) if white, or null if black.
 */
const SEMITONE_TO_WHITE_IDX: (number | null)[] = [
  0,    // C
  null, // C#
  1,    // D
  null, // D#
  2,    // E
  3,    // F
  null, // F#
  4,    // G
  null, // G#
  5,    // A
  null, // A#
  6,    // B
];

export function isBlackKey(midi: number): boolean {
  return SEMITONE_TO_WHITE_IDX[midi % 12] === null;
}

// Precompute the global white-key index for every MIDI note 0–127.
// Index increments only for white keys; black keys remain -1.
const _WHITE_KEY_IDX: number[] = new Array(128).fill(-1);
let _wkCounter = 0;
for (let n = 0; n < 128; n++) {
  if (!isBlackKey(n)) {
    _WHITE_KEY_IDX[n] = _wkCounter++;
  }
}

const _WHITE_KEY_OFFSET = _WHITE_KEY_IDX[PIANO_FIRST_MIDI]; // white keys before A0

/** Total number of white keys across the 88-key range (= 52). */
export const NUM_WHITE_KEYS =
  _WHITE_KEY_IDX[PIANO_LAST_MIDI] - _WHITE_KEY_OFFSET + 1;

// ─── Coordinate functions ──────────────────────────────────────────────────────

/**
 * Maps a MIDI pitch to its x-position and visual width within the canvas.
 *
 * White keys span the full canvas width uniformly.
 * Black keys are narrower (~58%) and centred over the boundary between
 * their two flanking white keys.
 *
 * @param midi        MIDI note number (21–108)
 * @param canvasWidth Logical canvas width in pixels
 * @returns           `{ x, width }` in logical pixels
 */
export function pitchToX(
  midi: number,
  canvasWidth: number,
): { x: number; width: number } {
  const wkw = canvasWidth / NUM_WHITE_KEYS; // white key width
  const bkw = wkw * 0.58;                  // black key width

  if (!isBlackKey(midi)) {
    const idx = _WHITE_KEY_IDX[midi] - _WHITE_KEY_OFFSET;
    return { x: idx * wkw, width: wkw };
  }

  // Black key: find the white key immediately to the left (lower pitch)
  let leftMidi = midi - 1;
  while (leftMidi >= PIANO_FIRST_MIDI && isBlackKey(leftMidi)) leftMidi--;
  const leftIdx = _WHITE_KEY_IDX[leftMidi] - _WHITE_KEY_OFFSET;
  const centerX = (leftIdx + 1) * wkw; // = right edge of left white key
  return { x: centerX - bkw / 2, width: bkw };
}

/**
 * Maps a point in time to a y-coordinate within the **note area**
 * (the region above the keyboard, from y=0 at the top to y=noteAreaHeight at
 * the bottom).
 *
 * Convention:
 *   - y = noteAreaHeight  →  currentTime  (the "now" moment at the bottom)
 *   - y = 0               →  currentTime - noteAreaHeight/PIXELS_PER_SECOND (oldest visible)
 *
 * Notes scroll upward as audio plays: a note at time T sits at
 * `noteAreaHeight - (currentTime - T) * PIXELS_PER_SECOND`.
 *
 * @param timeSeconds   Absolute time of the event in seconds
 * @param currentTime   Current audio playback position in seconds
 * @param noteAreaHeight Height of the note area in logical pixels
 */
export function timeToY(
  timeSeconds: number,
  currentTime: number,
  noteAreaHeight: number,
): number {
  return noteAreaHeight - (currentTime - timeSeconds) * PIXELS_PER_SECOND;
}
