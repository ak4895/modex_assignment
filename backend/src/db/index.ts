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
  connectionTimeoutMillis: 30000, // Increased from 10000 to 30000ms
  statement_timeout: 30000, // Added statement timeout
  query_timeout: 30000, // Added query timeout
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

export const query = async (text: string, params?: any[], retries: number = 3) => {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await pool.query(text, params);
    } catch (error: any) {
      lastError = error;
      console.error(`Query attempt ${attempt}/${retries} failed:`, error.message);
      
      // If it's not a timeout or connection error, don't retry
      if (!error.message.includes('timeout') && 
          !error.message.includes('ECONNREFUSED') &&
          !error.message.includes('ETIMEDOUT')) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  throw lastError || new Error('Query failed after retries');
};

export const getClient = async (): Promise<PoolClient> => {
  return pool.connect();
};

export default pool;
