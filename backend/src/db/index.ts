import { Pool, PoolClient, PoolConfig } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

// Get database URLs from environment
const internalUrl = process.env.DATABASE_INTERNAL_URL;
const externalUrl = process.env.DATABASE_EXTERNAL_URL || process.env.DATABASE_URL;

console.log('Database URLs configured:');
console.log('- Internal:', internalUrl ? `${internalUrl.split('@')[1]?.split('/')[0] || 'SET'}` : 'NOT SET');
console.log('- External:', externalUrl ? `${externalUrl.split('@')[1]?.split('/')[0] || 'SET'}` : 'NOT SET');

if (!internalUrl && !externalUrl) {
  console.error('ERROR: No database URLs configured');
  console.error('Please set DATABASE_INTERNAL_URL or DATABASE_EXTERNAL_URL or DATABASE_URL');
}

// Create connection pools for both URLs
let primaryPool: Pool | null = null;
let fallbackPool: Pool | null = null;
let activeDatabaseUrl: string = '';

const createPoolForUrl = (url: string, label: string): Pool => {
  const isInternal = url.includes('.internal');
  const isLocal = url.includes('localhost');

  console.log(`Creating ${label} pool for: ${url.split('@')[1]?.split(':')[0] || 'database'}`);

  const poolConfig: PoolConfig = {
    connectionString: url,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: isInternal ? 20 : 10,
    min: isInternal ? 5 : 2,
    idleTimeoutMillis: isInternal ? 30000 : 60000,
    connectionTimeoutMillis: isInternal ? 10000 : 30000,
    statement_timeout: 30000,
    query_timeout: 30000,
  };

  return new Pool(poolConfig);
};

// Initialize pools
if (internalUrl) {
  primaryPool = createPoolForUrl(internalUrl, 'PRIMARY (Internal)');
  activeDatabaseUrl = 'INTERNAL';
}

if (externalUrl && externalUrl !== internalUrl) {
  fallbackPool = createPoolForUrl(externalUrl, 'FALLBACK (External)');
  if (!primaryPool) {
    primaryPool = fallbackPool;
    activeDatabaseUrl = 'EXTERNAL';
  }
}

if (!primaryPool) {
  throw new Error('Failed to create database connection pool');
}

// Setup error handlers
primaryPool.on('error', (err: any) => {
  console.error(`[${activeDatabaseUrl}] Database pool error:`, err.message);
});

if (fallbackPool) {
  fallbackPool.on('error', (err: any) => {
    console.error('[FALLBACK] Database pool error:', err.message);
  });
}

// Test primary connection on startup
const testConnection = async () => {
  try {
    if (primaryPool) {
      await primaryPool.query('SELECT NOW()');
      console.log(`✓ PRIMARY (${activeDatabaseUrl}) connection successful`);
    }
  } catch (err: any) {
    console.error(`❌ PRIMARY (${activeDatabaseUrl}) connection failed:`, err.message);
    
    // Try fallback if available
    if (fallbackPool && primaryPool !== fallbackPool) {
      console.log('⚠️ Trying fallback connection...');
      try {
        await fallbackPool.query('SELECT NOW()');
        console.log('✓ FALLBACK connection successful');
      } catch (fallbackErr: any) {
        console.error('❌ FALLBACK connection also failed:', fallbackErr.message);
      }
    }
  }
};

// Run connection test asynchronously (non-blocking)
setTimeout(() => {
  testConnection().catch(err => {
    console.error('Connection test error:', err.message);
  });
}, 1000); // Delay by 1 second to allow server to start

export const getConnection = (): Pool => {
  if (!primaryPool) {
    throw new Error('Database connection pool not initialized');
  }
  return primaryPool;
};

export const query = async (text: string, params?: any[], retries: number = 3) => {
  let lastError: any = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!primaryPool) throw new Error('Connection pool not available');
      return await primaryPool.query(text, params);
    } catch (error: any) {
      lastError = error;
      console.error(`[Attempt ${attempt}/${retries}] Query failed:`, error.message);

      // Try fallback pool if available and primary fails
      if (attempt === 1 && fallbackPool && primaryPool !== fallbackPool) {
        console.log('⚠️ Primary pool failed, trying fallback pool...');
        try {
          return await fallbackPool.query(text, params);
        } catch (fallbackError: any) {
          console.error('Fallback pool also failed:', fallbackError.message);
          lastError = fallbackError;
        }
      }

      // If it's not a timeout or connection error, don't retry
      if (!error.message.includes('timeout') &&
        !error.message.includes('ECONNREFUSED') &&
        !error.message.includes('ETIMEDOUT')) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt - 1) * 1000;
        console.log(`Retrying in ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Query failed after retries');
};

export const getClient = async (): Promise<PoolClient> => {
  if (!primaryPool) throw new Error('Connection pool not available');
  return primaryPool.connect();
};

export default getConnection();
