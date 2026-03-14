import 'dotenv/config';

function env(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (val === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

export const config = {
  port: parseInt(process.env['PORT'] ?? '3001', 10),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  databaseUrl: env('DATABASE_URL'),
  uploadsDir: process.env['UPLOADS_DIR'] ?? './uploads',
  maxFileSizeMb: parseInt(process.env['MAX_FILE_SIZE_MB'] ?? '100', 10),
  frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:5173',
} as const;

export type Config = typeof config;
