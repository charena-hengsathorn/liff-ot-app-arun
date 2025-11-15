# Admin Login Issue Fix

## Problem

The Strapi admin login panel was showing an error:
```
Unexpected token '<', "<!DOCTYPE" ... is not valid JSON
```

And the browser console showed:
```
Failed to load resource: the server responded with a status of 503 (Service Unavailable)
```

## Root Cause

The Express server (`server.mjs`) had hardcoded proxy configuration that always pointed to `http://localhost:1337`, even when Strapi was running on a separate Heroku app with a different URL.

### Issue Details:

1. **Hardcoded Proxy Target**: The proxy was hardcoded to `localhost:1337`:
   ```javascript
   target: 'http://localhost:1337',  // ❌ Hardcoded!
   ```

2. **Production Deployment**: On Heroku, Strapi is deployed as a separate app (e.g., `https://liff-ot-app-strapi-prod.herokuapp.com`), not on `localhost:1337`.

3. **Failed Requests**: When the admin panel tried to make API requests:
   - Browser → Express server `/admin/auth/login`
   - Express server → Proxy to `localhost:1337` (doesn't exist on Heroku)
   - Returns 503 error or HTML error page
   - Admin panel tries to parse HTML as JSON → Error!

## Solution

Updated the proxy configuration to:

1. **Use `STRAPI_URL` Environment Variable**: Instead of hardcoded localhost, use the `STRAPI_URL` environment variable.

2. **Detect Local vs Remote Strapi**: 
   - If `STRAPI_URL` contains `localhost` or `127.0.0.1` → Strapi is running locally (same server)
   - Otherwise → Strapi is running on a remote server (separate Heroku app)

3. **Handle Both Cases**:
   - **Local Strapi**: Proxy requests to localhost (same as before)
   - **Remote Strapi**: Redirect `/admin` directly to the remote Strapi URL (no proxy needed)

## Changes Made

### File: `server.mjs`

**Before:**
```javascript
const strapiProxy = createProxyMiddleware({
  target: 'http://localhost:1337',  // ❌ Hardcoded!
  // ...
});
```

**After:**
```javascript
// Determine if Strapi is running locally or remotely
const isLocalStrapi = STRAPI_URL.includes('localhost') || STRAPI_URL.includes('127.0.0.1');
const strapiTarget = STRAPI_URL.replace(/\/$/, ''); // Remove trailing slash

const strapiProxy = createProxyMiddleware({
  target: strapiTarget,  // ✅ Uses STRAPI_URL!
  // ...
});

// Only proxy if Strapi is local
if (isLocalStrapi) {
  app.use('/admin', createProxyMiddleware({ /* ... */ }));
} else {
  // Redirect to remote Strapi directly
  app.use('/admin', (req, res) => {
    const adminUrl = `${strapiTarget}/admin${req.path === '/admin' ? '' : req.path}`;
    res.redirect(adminUrl);
  });
}
```

## Verification

To verify the fix is working:

1. **Check Environment Variable**:
   ```bash
   heroku config:get STRAPI_URL --app your-app-name
   ```
   Should show your Strapi Heroku URL (not localhost).

2. **Test Admin Access**:
   - Visit: `https://your-app.herokuapp.com/admin`
   - If Strapi is remote: Should redirect to `https://your-strapi-app.herokuapp.com/admin`
   - If Strapi is local: Should proxy to `localhost:1337/admin`

3. **Check Logs**:
   ```bash
   heroku logs --tail --app your-app-name
   ```
   Look for:
   ```
   [Strapi Proxy] Strapi URL: https://your-strapi-app.herokuapp.com
   [Strapi Proxy] Is local: false
   [Strapi Proxy] Target: https://your-strapi-app.herokuapp.com
   ```

## Configuration Requirements

### For Remote Strapi (Separate Heroku App):

Set environment variable on your Express server:
```bash
heroku config:set STRAPI_URL=https://your-strapi-app.herokuapp.com --app your-express-app
```

### For Local Strapi (Same Server):

Set environment variable:
```bash
# In .env.local or Heroku config
STRAPI_URL=http://localhost:1337
```

## Testing Checklist

- [ ] Admin panel loads without JSON parsing errors
- [ ] Login form displays correctly
- [ ] Login request succeeds (no 503 errors)
- [ ] Admin panel redirects correctly for remote Strapi
- [ ] Admin panel proxies correctly for local Strapi
- [ ] Console shows correct proxy target in logs

## Related Files

- `server.mjs` - Main Express server with proxy configuration
- `strapi/config/server.ts` - Strapi server configuration
- `strapi/config/admin.ts` - Strapi admin configuration
- `.env.local` or Heroku config vars - Environment variables

## Notes

- The proxy is only used when Strapi runs on the same server (localhost)
- When Strapi is remote, `/admin` redirects directly to it (simpler and more reliable)
- All API routes (`/api/drivers`, `/api/attendances`, etc.) already use direct fetch to `STRAPI_URL`, so they work regardless of proxy configuration
