import { defineConfig } from 'drizzle-kit';

// drizzle-kit config — used by the `db:generate` script to produce SQL migration files.
// Run `npm run db:generate` after changing src/db/schema.ts to generate a new migration.
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/drizzle',
  dialect: 'sqlite',
});
