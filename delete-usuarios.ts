import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '.env.local') });

import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL!);

(async () => {
  await sql`DELETE FROM usuarios`;
  console.log('✅ usuarios eliminados');
  process.exit(0);
})();
