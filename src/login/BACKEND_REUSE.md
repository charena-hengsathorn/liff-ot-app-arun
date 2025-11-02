# Reusing Backend Auth Endpoints

## Option 1: Use the Reusable Module (Recommended)

### In your server.mjs:

```js
import express from 'express';
import cookieParser from 'cookie-parser';
import { setupAuthRoutes } from './src/login/authRoutes.js';

const app = express();

// Required middleware
app.use(express.json());
app.use(cookieParser());

// Setup auth routes
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL || 'http://localhost:1337',
  enableCookie: true,
  cookieName: 'jwt',
  secureCookie: process.env.NODE_ENV === 'production'
});

app.listen(3001);
```

That's it! You now have:
- `POST /login` - Login endpoint
- `POST /logout` - Logout endpoint  
- `GET /me` - Get current user

## Option 2: Copy and Customize

Copy the auth routes section from `server.mjs` and customize:

```js
// Login endpoint
app.post('/login', async (req, res) => {
  // ... copied code
  // Customize as needed
});
```

## Option 3: Import Individual Functions

```js
import { handleLogin } from './src/login/authRoutes.js';

app.post('/login', (req, res) => {
  handleLogin(req, res, process.env.STRAPI_URL);
});
```

## Configuration Options

### Basic Setup

```js
setupAuthRoutes(app);
```

### Custom Strapi URL

```js
setupAuthRoutes(app, {
  strapiUrl: 'https://your-strapi-instance.com'
});
```

### Disable Cookie Storage (use JWT in response only)

```js
setupAuthRoutes(app, {
  enableCookie: false
});
```

Then handle JWT storage on frontend:

```js
// In frontend after login
const response = await fetch('/login', { ... });
const { jwt } = await response.json();
localStorage.setItem('jwt', jwt);
```

### Custom Cookie Name

```js
setupAuthRoutes(app, {
  cookieName: 'authToken'
});
```

### Custom Secure Settings

```js
setupAuthRoutes(app, {
  secureCookie: true,  // Always use secure cookies
  cookieName: 'jwt',
  strapiUrl: process.env.STRAPI_URL
});
```

## Shared Backend for Multiple Apps

If you have multiple apps using the same backend:

```js
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { setupAuthRoutes } from './src/login/authRoutes.js';

const app = express();

// CORS - allow multiple frontend origins
app.use(cors({
  origin: [
    'http://localhost:5173',      // App 1
    'http://localhost:5174',      // App 2
    'https://app1.production.com',
    'https://app2.production.com'
  ],
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Setup auth routes (same for all apps)
setupAuthRoutes(app);

app.listen(3001);
```

## Multiple Strapi Instances

If different apps use different Strapi instances:

```js
import { setupAuthRoutes } from './src/login/authRoutes.js';

const app = express();

// Setup routes for App 1 (using its own path prefix)
app.use('/api/app1', (req, res, next) => {
  req.strapiUrl = process.env.STRAPI_URL_APP1;
  next();
});
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL_APP1
});

// Setup routes for App 2 (different Strapi)
app.use('/api/app2', (req, res, next) => {
  req.strapiUrl = process.env.STRAPI_URL_APP2;
  next();
});
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL_APP2
});
```

## Required Dependencies

```bash
npm install express cookie-parser node-fetch
```

## Required Middleware

```js
app.use(express.json());        // Parse JSON bodies
app.use(cookieParser());        // Parse cookies (for JWT storage)
```

## Environment Variables

```env
# .env
STRAPI_URL=http://localhost:1337
# or
STRAPI_URL=https://your-strapi-instance.com
```

## Endpoints Provided

### POST /login
- **Request:** `{ identifier: "email@example.com", password: "password", rememberMe: false }`
- **Response:** `{ success: true, jwt: "...", user: {...} }`
- **Cookie:** Sets httpOnly JWT cookie (if enabled)

### POST /logout
- **Request:** None
- **Response:** `{ success: true, message: "Logged out successfully" }`
- **Cookie:** Clears JWT cookie

### GET /me
- **Request:** Requires JWT in cookie or Authorization header
- **Response:** `{ success: true, user: {...} }`
- **Auth:** Validates JWT with Strapi

## Example: Complete Setup

```js
// server.mjs
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupAuthRoutes } from './src/login/authRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Auth routes
setupAuthRoutes(app, {
  strapiUrl: process.env.STRAPI_URL,
  enableCookie: true
});

// Other routes...
app.get('/api', (req, res) => {
  res.json({ message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

## Troubleshooting

### Cookie not being set?
- Ensure `cookieParser()` middleware is added
- Check CORS `credentials: true`
- Verify `secure` setting matches your environment

### Strapi connection error?
- Verify `STRAPI_URL` is correct
- Check Strapi is running and accessible
- Verify CORS is enabled in Strapi for your backend origin

### Multiple apps, same backend?
- Ensure CORS allows all frontend origins
- Cookies are domain-scoped, so they'll work for all apps on same domain
- Different subdomains may need domain configuration

