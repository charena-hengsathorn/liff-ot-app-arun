export default ({ env }) => {
  // Use STRAPI_PORT if set (for same-app deployment), otherwise PORT or default to 1337
  const port = env.int('STRAPI_PORT') || 1337;
  
  // For same-app deployment, Strapi should use the public Heroku URL
  // The proxy will forward requests from /admin to Strapi on localhost:1337
  const publicUrl = env('STRAPI_PUBLIC_URL') || env('STRAPI_URL') || 'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com';
  
  return {
    host: env('HOST', '0.0.0.0'),
    port,
    url: publicUrl, // Public URL for redirects and API responses
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};

