export default ({ env }) => {
  // On Heroku, if STRAPI_PORT is set, use it (for same-app deployment)
  // Otherwise, use PORT (for separate Strapi app) or default to 1337
  const port = env.int('STRAPI_PORT') || env.int('PORT') || 1337;

  // Determine public URL for asset generation:
  // 1. Use STRAPI_ADMIN_BACKEND_URL if set (for generating correct asset URLs)
  // 2. Fall back to STRAPI_URL if it's not localhost
  // 3. Otherwise, don't set a public URL (local development)
  const adminBackendUrl = env('STRAPI_ADMIN_BACKEND_URL');
  const strapiUrl = env('STRAPI_URL');

  let publicUrl;
  if (adminBackendUrl) {
    // Use admin backend URL for public asset URLs
    publicUrl = adminBackendUrl;
  } else if (strapiUrl && !strapiUrl.includes('localhost') && !strapiUrl.includes('127.0.0.1')) {
    // Use STRAPI_URL if it's not localhost
    publicUrl = strapiUrl;
  } else {
    // No public URL (local development)
    publicUrl = undefined;
  }

  return {
    host: env('HOST', '0.0.0.0'),
    port,
    // Set url for generating correct asset URLs (images, etc.)
    // This ensures Strapi returns full URLs instead of localhost URLs
    ...(publicUrl ? { url: publicUrl } : {}),
    app: {
      keys: env.array('APP_KEYS'),
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};
