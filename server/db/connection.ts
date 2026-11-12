import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

const dbConfig: DbConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: Number(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rltsms_db',
};

let pool: mysql.Pool | null = null;
let isMySqlActive = false;

export async function initDatabase(): Promise<{ isMySql: boolean }> {
  try {
    const testPool = mysql.createPool({
      ...dbConfig,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2000,
    });

    const conn = await testPool.getConnection();
    await conn.ping();
    conn.release();

    pool = testPool;
    isMySqlActive = true;
    console.log(`[RLTSMS DB] Connected to MySQL 8.4 LTS on ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

    // Check if schema needs to be executed
    const [tables] = await pool.query('SHOW TABLES');
    if (Array.isArray(tables) && tables.length === 0) {
      console.log('[RLTSMS DB] Empty database detected. Running schema migrations...');
      const schemaPath = path.join(import.meta.dirname, 'schema.sql');
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        const statements = sql
          .split(';')
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith('--') && !s.startsWith('USE'));
        for (const stmt of statements) {
          try {
            await pool.query(stmt);
          } catch (e: any) {
            // Ignore minor statements like drop table if not exists
          }
        }
        console.log('[RLTSMS DB] MySQL schema created successfully.');
      }
    }

    return { isMySql: true };
  } catch (err: any) {
    console.warn(`[RLTSMS DB] MySQL is not reachable (${err.message}). Using persistent local data store fallback.`);
    isMySqlActive = false;
    return { isMySql: false };
  }
}

export function getMySqlPool(): mysql.Pool | null {
  return pool;
}

export function isUsingMySql(): boolean {
  return isMySqlActive;
}
