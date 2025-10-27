import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.hxyhqfgkvgexkqmxrrdc',
    password: '4h5_C5H7LkprX*T',
    database: 'postgres',
  },
  pool: {
    min: 2,
    max: 10, // đừng để 200
    idleTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    acquireTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 100
  },
  debug: false
});

export default db;
