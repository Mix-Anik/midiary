-- Midiary initial schema
-- user_id columns are intentionally nullable UUIDs without foreign key constraints.
-- When auth is introduced, add: ALTER TABLE <table> ADD CONSTRAINT ... FOREIGN KEY (user_id) REFERENCES users(id);

CREATE TABLE IF NOT EXISTS "sessions" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "title"          text NOT NULL,
  "description"    text,
  "recorded_at"    timestamptz NOT NULL,
  "created_at"     timestamptz NOT NULL DEFAULT now(),
  "updated_at"     timestamptz NOT NULL DEFAULT now(),
  "midi_filename"  text NOT NULL,
  "audio_filename" text NOT NULL,
  "duration_ms"    integer,
  "user_id"        uuid
);

CREATE TABLE IF NOT EXISTS "plugin_preferences" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "plugin_id"  text NOT NULL,
  "enabled"    boolean NOT NULL DEFAULT true,
  "config"     jsonb,
  "user_id"    uuid,
  CONSTRAINT "plugin_preferences_plugin_id_unique" UNIQUE ("plugin_id")
);

CREATE TABLE IF NOT EXISTS "bookmark_groups" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name"       text NOT NULL,
  "color"      text NOT NULL DEFAULT '#6366f1',
  "icon"       text,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now(),
  "user_id"    uuid
);

CREATE TABLE IF NOT EXISTS "bookmark_entries" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bookmark_group_id" uuid NOT NULL,
  "session_id"        uuid NOT NULL,
  "added_at"          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "bookmark_entries_group_session_unique" UNIQUE ("bookmark_group_id", "session_id")
);

ALTER TABLE "bookmark_entries"
  ADD CONSTRAINT "bookmark_entries_bookmark_group_id_fk"
  FOREIGN KEY ("bookmark_group_id") REFERENCES "bookmark_groups"("id") ON DELETE CASCADE;

ALTER TABLE "bookmark_entries"
  ADD CONSTRAINT "bookmark_entries_session_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS "app_preferences" (
  "id"      uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "theme"   text NOT NULL DEFAULT 'light',
  "user_id" uuid
);
