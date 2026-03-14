// Re-export all frontend plugin types from shared for convenience.
// Import from here inside the frontend codebase.
export type {
  FrontendPlugin,
  FrontendPluginAPI,
  PluginManifest,
  PianoRollOverlayProps,
  SessionWidgetProps,
  TimelineMarkerProps,
  NavItem,
  AudioPlayerState,
} from '@midiary/shared';
