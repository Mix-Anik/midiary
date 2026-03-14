/**
 * Playback Cursor Plugin
 *
 * A frontend-only plugin that renders a visual position indicator on the
 * piano roll overlay layer. It draws a subtle horizontal highlight band
 * just below the "now" reference line, reinforcing the current playback
 * position in the scrolling note view.
 *
 * This plugin has no backend part — all its functionality is visual.
 */
import type { FrontendPlugin, PianoRollOverlayProps } from '../../types';

// The overlay component is defined inline here to keep the plugin self-contained.
// In Phase 5, when the real canvas coordinates are wired up, this component can
// render directly into the canvas overlay using the pitchToX / timeToY utilities.

function PlaybackCursorOverlay(_props: PianoRollOverlayProps) {
  // The reference line at the top of the canvas is a static canvas element
  // drawn in Phase 5. This component's job is to provide a DOM-level overlay
  // (e.g. a glow or pulse effect) that plugins can use without touching canvas.
  //
  // TODO (Phase 5): Replace this stub with a real canvas-coordinated overlay
  // once PianoRoll.tsx is implemented and canvasWidth/canvasHeight are non-zero.
  return null;
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
