/**
 * Playback Cursor Plugin
 *
 * Renders a subtle horizontal glow band at the "now" boundary of the piano
 * roll — the bottom edge of the note area, just above the keyboard.
 *
 * Uses the DOM overlay layer (not canvas) so it composes cleanly on top of
 * both canvas layers without needing access to the drawing context.
 */
import { createElement } from 'react';
import type { FrontendPlugin, PianoRollOverlayProps } from '../../types';
import { KEYBOARD_HEIGHT } from '../../../utils/pianoRoll';

function PlaybackCursorOverlay({ canvasWidth, canvasHeight }: PianoRollOverlayProps) {
  if (canvasWidth === 0 || canvasHeight === 0) return null;

  // The "now" moment is at the bottom of the note area (top of keyboard).
  const nowY = canvasHeight - KEYBOARD_HEIGHT;

  return createElement('div', {
    style: {
      position: 'absolute',
      left: 0,
      top: nowY - 24,
      width: '100%',
      height: 24,
      background: 'linear-gradient(to bottom, transparent, rgba(99,102,241,0.12))',
      pointerEvents: 'none',
    },
  });
}

PlaybackCursorOverlay.displayName = 'PlaybackCursorOverlay';

export const playbackCursorPlugin: FrontendPlugin = {
  manifest: {
    id: 'playback-cursor',
    name: 'Playback Cursor',
    description: 'Shows the current playback position on the piano roll as a visual indicator.',
    version: '1.0.0',
    hasFrontend: true,
    hasBackend: false,
  },

  PianoRollOverlay: PlaybackCursorOverlay,
};
