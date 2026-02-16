import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'

let _pool: pg.Pool | null = null

function getPool(): pg.Pool {
  if (!_pool) {
    const config = useRuntimeConfig()
    if (!config.databaseUrl) {
      throw new Error('DATABASE_URL is not configured')
    }
    _pool = new pg.Pool({
      connectionString: config.databaseUrl,
      max: 10
    })
  }
  return _pool
}

export function useDB() {
  return drizzle(getPool())
}

export function usePool() {
  return getPool()
}
