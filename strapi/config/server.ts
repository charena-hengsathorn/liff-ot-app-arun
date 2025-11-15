export default ({ env }) => {
  // On Heroku, if STRAPI_PORT is set, use it (for same-app deployment)
  // Otherwise, use PORT (for separate Strapi app) or default to 1337
  const port = env.int('STRAPI_PORT') || env.int('PORT') || 1337;

  return {
    host: env('HOST', '0.0.0.0'),
    port,
    url: env('STRAPI_URL'), // Will be undefined in dev, set in production
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
