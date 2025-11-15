export default ({ env }) => {
  // Use STRAPI_PORT if set (for same-app deployment), otherwise PORT or default to 1337
  const port = env.int('STRAPI_PORT') || 1337;
  
  return {
    host: env('HOST', '0.0.0.0'),
    port,
    url: env('STRAPI_URL', 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com'),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};

