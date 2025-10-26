import knex from 'knex';

const db = knex({
  client: 'pg',
  connection: {
    host: 'aws-1-us-east-2.pooler.supabase.com',
    port: 5432,
    user: 'postgres.hxyhqfgkvgexkqmxrrdc',
    password: '4h5_C5H7LkprX*T',
    database: 'postgres',
    pool: { min: 0, max: 20 },
  }
});

export default db;
