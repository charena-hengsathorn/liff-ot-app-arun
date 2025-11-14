export default ({ env }) => ({
  connection: {
    client: 'postgres',
    connection: {
      // Heroku automatically provides DATABASE_URL
      connectionString: env('DATABASE_URL'),
      ssl: {
        rejectUnauthorized: false, // Required for Heroku PostgreSQL
      },
    },
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});

