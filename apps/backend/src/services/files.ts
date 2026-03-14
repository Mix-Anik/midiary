import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config';
import { HttpError } from '../middleware/error';

/** Ensure the uploads directory exists. Called once at server startup. */
export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(config.uploadsDir, { recursive: true });
}

const ALLOWED_AUDIO_EXTS = new Set(['.wav', '.mp3', '.ogg', '.flac', '.m4a']);
const ALLOWED_MIDI_EXTS = new Set(['.mid', '.midi']);

function ext(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Save an uploaded file to the uploads directory.
 * Returns the generated stored filename (uuid + original extension).
 */
export async function saveUploadedFile(file: File, type: 'midi' | 'audio'): Promise<string> {
  const maxBytes = config.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new HttpError(413, `File exceeds maximum size of ${config.maxFileSizeMb}MB`);
  }

  const fileExt = ext(file.name);
  if (type === 'midi' && !ALLOWED_MIDI_EXTS.has(fileExt)) {
    throw new HttpError(400, `Invalid MIDI file extension: ${fileExt}`);
  }
  if (type === 'audio' && !ALLOWED_AUDIO_EXTS.has(fileExt)) {
    throw new HttpError(400, `Invalid audio file extension: ${fileExt}`);
  }

  const storedFilename = `${randomUUID()}${fileExt}`;
  const destPath = path.join(config.uploadsDir, storedFilename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(destPath, buffer);

  return storedFilename;
}

/**
 * Delete a stored file. Swallows ENOENT — already deleted is fine.
 */
export async function deleteStoredFile(filename: string): Promise<void> {
  try {
    await fs.unlink(path.join(config.uploadsDir, filename));
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') throw err;
  }
}

/** Absolute path to a stored file. */
export function storedFilePath(filename: string): string {
  return path.join(config.uploadsDir, filename);
}

/** Content-Type header value based on file extension. */
export function contentTypeForFilename(filename: string): string {
  const mimeMap: Record<string, string> = {
    '.mid':  'audio/midi',
    '.midi': 'audio/midi',
    '.wav':  'audio/wav',
    '.mp3':  'audio/mpeg',
    '.ogg':  'audio/ogg',
    '.flac': 'audio/flac',
    '.m4a':  'audio/mp4',
  };
  return mimeMap[ext(filename)] ?? 'application/octet-stream';
}
