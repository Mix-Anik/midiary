import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  integer,
  unique,
} from 'drizzle-orm/pg-core';

// ─── Sessions ─────────────────────────────────────────────────────────────────

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  midiFilename: text('midi_filename').notNull(),
  audioFilename: text('audio_filename').notNull(),
  durationMs: integer('duration_ms'),
  // TODO: Add .references(() => users.id) when auth is introduced
  userId: uuid('user_id'),
});

// ─── Plugin Preferences ───────────────────────────────────────────────────────

export const pluginPreferences = pgTable('plugin_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  pluginId: text('plugin_id').notNull().unique(),
  enabled: boolean('enabled').notNull().default(true),
  config: jsonb('config').$type<Record<string, unknown>>(),
  // TODO: Add .references(() => users.id) when auth is introduced
  userId: uuid('user_id'),
});

// ─── Bookmark Groups ──────────────────────────────────────────────────────────

export const bookmarkGroups = pgTable('bookmark_groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  color: text('color').notNull().default('#6366f1'),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  // TODO: Add .references(() => users.id) when auth is introduced
  userId: uuid('user_id'),
});

// ─── Bookmark Entries ─────────────────────────────────────────────────────────

export const bookmarkEntries = pgTable(
  'bookmark_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    bookmarkGroupId: uuid('bookmark_group_id')
      .notNull()
      .references(() => bookmarkGroups.id, { onDelete: 'cascade' }),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    addedAt: timestamp('added_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    uniqueEntry: unique().on(t.bookmarkGroupId, t.sessionId),
  }),
);

// ─── App Preferences ─────────────────────────────────────────────────────────

export const appPreferences = pgTable('app_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  theme: text('theme').notNull().default('light'),
  // TODO: Add .references(() => users.id) when auth is introduced
  userId: uuid('user_id'),
});
