import { Pool, PoolClient } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  console.error('Please set DATABASE_URL in your .env file or Render environment variables');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err: any) => {
  console.error('Database pool error:', err.message);
  console.error('Error code:', err.code);
  if (err.code === 'ECONNREFUSED') {
    console.error('Connection refused - PostgreSQL server may not be running or accessible');
  } else if (err.code === 'ETIMEDOUT') {
    console.error('Connection timeout - PostgreSQL server is not responding');
  }
});

// Test connection on startup
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed on startup:', err.message);
  } else {
    console.log('✓ Database connection successful');
  }
});

export const getConnection = (): Pool => pool;

export const query = async (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export default pool;
