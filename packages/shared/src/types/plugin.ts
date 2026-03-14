import type { Session } from './session.js';

// ─── Plugin Manifest ──────────────────────────────────────────────────────────

/** Every plugin (frontend or backend) must export a manifest satisfying this interface. */
export interface PluginManifest {
  /** Unique kebab-case identifier, e.g. "playback-cursor" */
  id: string;
  /** Human-readable name, e.g. "Playback Cursor" */
  name: string;
  description: string;
  version: string;
  hasFrontend: boolean;
  hasBackend: boolean;
}

// ─── Plugin Preferences (DB row) ─────────────────────────────────────────────

export interface PluginPreference {
  id: string;
  pluginId: string;
  enabled: boolean;
  config: Record<string, unknown> | null;
  /** Nullable — ready for future multi-user auth */
  userId: string | null;
}

/** Returned by GET /api/v1/plugins — manifest + runtime state */
export interface PluginWithState {
  manifest: PluginManifest;
  enabled: boolean;
  config: Record<string, unknown> | null;
}

export interface UpdatePluginPreferenceDto {
  enabled: boolean;
}

// ─── Frontend Plugin API ──────────────────────────────────────────────────────

export interface AudioPlayerState {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  seek: (seconds: number) => void;
  play: () => void;
  pause: () => void;
}

/** API object passed to FrontendPlugin.init() at plugin initialisation time. */
export interface FrontendPluginAPI {
  /** Returns a snapshot of the global audio player state. */
  getAudioPlayerState: () => AudioPlayerState;
  /** Returns the currently viewed session, or null if on a list/settings page. */
  getCurrentSession: () => Session | null;
  /** Reads this plugin's persisted config blob. */
  getPluginConfig: () => Record<string, unknown> | null;
  /** Persists new config for this plugin via PATCH /api/v1/plugins/:id. */
  setPluginConfig: (config: Record<string, unknown>) => Promise<void>;
}

// ─── Plugin component prop interfaces ────────────────────────────────────────

/** Props for a plugin component rendered inside the piano roll overlay layer. */
export interface PianoRollOverlayProps {
  currentTime: number;
  duration: number;
  canvasWidth: number;
  canvasHeight: number;
  /** Maps a MIDI note number (0-127) to a canvas x-coordinate. */
  pitchToX: (midi: number) => number;
  /** Maps a time offset to a canvas y-coordinate given the current playhead. */
  timeToY: (seconds: number, currentTime: number, canvasHeight: number) => number;
}

/** Props for a plugin component rendered in the session detail sidebar. */
export interface SessionWidgetProps {
  sessionId: string;
  session: Session;
}

/** Props for a plugin component rendered in the timeline bar at a specific timestamp. */
export interface TimelineMarkerProps {
  /** Absolute timestamp (seconds) where this marker should appear. */
  timestamp: number;
  currentTime: number;
  duration: number;
  /** Full pixel width of the timeline bar track, used to position the marker. */
  containerWidth: number;
}

// ─── Nav items contributed by plugins ────────────────────────────────────────

export interface NavItem {
  path: string;
  label: string;
  /** Lucide icon name */
  icon?: string;
  /** Lower order = higher in the nav list */
  order?: number;
}

// ─── Frontend Plugin ──────────────────────────────────────────────────────────

/**
 * A frontend plugin object registered in apps/frontend/src/plugins/registry.ts.
 *
 * React component slots are typed as `(props: P) => unknown` here to avoid a
 * React dependency in the shared package. In the frontend, cast them to
 * React.FC<Props> before use.
 *
 * RouteObject is typed loosely for the same reason — cast to RouteObject from
 * react-router-dom in the frontend plugin registry.
 *
 * TODO: If shared ever gains @types/react and react-router-dom as peer deps,
 *       replace the loose types with the proper React/router types.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyFC<P = Record<string, unknown>> = (props: P) => any;

export interface FrontendPlugin {
  manifest: PluginManifest;

  /** Called once when the plugin is initialised (after the store is ready). */
  init?: (api: FrontendPluginAPI) => void;

  /** Rendered inside the piano roll overlay layer. */
  PianoRollOverlay?: AnyFC<PianoRollOverlayProps>;

  /** Rendered in the session detail sidebar below the core widgets. */
  SessionSidebarWidget?: AnyFC<SessionWidgetProps>;

  /** Rendered on the Settings page inside this plugin's row. */
  SettingsPanel?: AnyFC<Record<string, never>>;

  /** Rendered inside the timeline bar at a specific timestamp. */
  TimelineMarker?: AnyFC<TimelineMarkerProps>;

  /**
   * Additional routes to register in React Router.
   * Each entry: { path: string; element: ReactNode }
   */
  routes?: Array<{ path: string; element: unknown }>;

  /** Navigation items to inject into the app sidebar. */
  navItems?: NavItem[];
}

// ─── Backend Plugin ───────────────────────────────────────────────────────────

/** App configuration shape exposed to backend plugins. */
export interface BackendConfig {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  uploadsDir: string;
  maxFileSizeMb: number;
  frontendUrl: string;
}

/**
 * API object passed to BackendPlugin.register() at server startup.
 *
 * `app` and `db` are typed as `unknown` to avoid coupling shared to Hono/Drizzle.
 * Backend plugins should cast these to the appropriate types.
 *
 * TODO: Consider defining narrow interfaces (e.g. AppLike, DbLike) here if
 *       plugins need a richer contract without importing Hono/Drizzle.
 */
export interface BackendPluginAPI {
  /** Hono app instance — cast to `Hono` inside the backend plugin. */
  app: unknown;
  /** Drizzle database client — cast to the db type inside the backend plugin. */
  db: unknown;
  config: BackendConfig;
}

export interface BackendPlugin {
  manifest: PluginManifest;

  /** Called once at server startup to register routes, middleware, etc. */
  register?: (api: BackendPluginAPI) => void | Promise<void>;
}
