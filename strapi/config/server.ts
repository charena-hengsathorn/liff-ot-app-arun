export default ({ env }) => {
  // On Heroku, if STRAPI_PORT is set, use it (for same-app deployment)
  // Otherwise, use PORT (for separate Strapi app) or default to 1337
  const port = env.int('STRAPI_PORT') || env.int('PORT') || 1337;

  // Only set public URL if STRAPI_URL is provided and it's NOT localhost
  // For same-app deployment via proxy, STRAPI_URL is localhost (internal communication)
  // and we don't want Strapi to set a public URL (prevents redirect loops)
  const strapiUrl = env('STRAPI_URL');
  const publicUrl = strapiUrl && !strapiUrl.includes('localhost') && !strapiUrl.includes('127.0.0.1')
    ? strapiUrl
    : undefined;

  return {
    host: env('HOST', '0.0.0.0'),
    port,
    // Only set url if it's a public URL (not localhost)
    // When using proxy, don't set url to prevent redirect loops
    ...(publicUrl ? { url: publicUrl } : {}),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
