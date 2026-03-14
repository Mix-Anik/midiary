/**
 * Run this script via: pnpm --filter backend db:migrate
 * It applies all pending SQL migrations from src/db/migrations/.
 */
import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const databaseUrl = process.env['DATABASE_URL'];
if (!databaseUrl) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const db = drizzle(sql);

console.log('Running migrations…');
await migrate(db, {
  migrationsFolder: path.join(__dirname, 'migrations'),
});
console.log('Migrations complete.');

await sql.end();
