import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = "postgresql://neondb_owner:npg_ZtChT2bGF0Lg@ep-hidden-cherry-aw3to0as-pooler.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

async function initDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const sql = fs.readFileSync(path.join(__dirname, 'init-database.sql'), 'utf8');

  try {
    await pool.query(sql);
    console.log('✅ Database tables created successfully!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  } finally {
    await pool.end();
  }
}

initDatabase();
