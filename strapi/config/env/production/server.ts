export default ({ env }) => {
    // Use STRAPI_PORT if set (for same-app deployment), otherwise PORT or default to 1337
    const port = env.int('STRAPI_PORT') || 1337;

    // For same-app deployment via proxy, Strapi should NOT set a public URL
    // This prevents redirect loops. The proxy will handle URL rewriting.
    // Only set URL if explicitly provided (for separate Strapi deployment)
    const publicUrl = env('STRAPI_PUBLIC_URL');
    
    return {
        host: env('HOST', '0.0.0.0'),
        port,
        // Don't set url if using proxy (prevents redirect loops)
        // The proxy will rewrite URLs in responses
        ...(publicUrl ? { url: publicUrl } : {}),
        app: {
            keys: env.array('APP_KEYS'),
        },
        webhooks: {
            populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
        },
    };
};

