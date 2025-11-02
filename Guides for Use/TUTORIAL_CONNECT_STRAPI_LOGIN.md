# Tutorial: Connect Your Strapi User Table to Your Login Form

This tutorial will teach you step-by-step how to connect your Strapi user authentication table to your React login form.

## 🎯 What You'll Learn

By the end of this tutorial, you'll understand:
1. How the three-part architecture works (Frontend → Backend → Strapi)
2. How to configure each component
3. How to create and manage users in Strapi
4. How to test the complete flow

---

## 📐 Architecture Overview (Understanding the Flow)

Your login system has **3 parts** that work together:

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React App     │  ──1──▶ │  Express Server │  ──2──▶ │   Strapi API    │
│  (Login Form)   │  ◀──3── │   (Backend)     │  ◀──4── │  (User Database)│
│  Port 5173      │         │   Port 3001     │         │   Port 1337    │
└─────────────────┘         └─────────────────┘         └─────────────────┘
```

### The Flow:

1. **User submits login form** → React sends email/password to Express
2. **Express receives request** → Proxies it to Strapi's authentication API
3. **Strapi validates credentials** → Checks if user exists in Strapi's user table
4. **Strapi returns JWT token** → Express adds it to cookies and sends user info back
5. **React stores user info** → Redirects to main app

---

## ✅ Step 1: Verify What's Already Built

Good news! Most of the code is already in place. Let's verify:

### Frontend (`src/login/LoginForm.jsx`)
- ✅ Already sends login request to backend
- ✅ Handles authentication state
- ✅ Redirects after successful login

### Backend (`server.mjs` + `src/login/authRoutes.js`)
- ✅ Already configured to proxy requests to Strapi
- ✅ Handles `/login`, `/logout`, `/me` endpoints
- ✅ Stores JWT in secure cookies

### Strapi Configuration
- ⚠️ **You need to configure this** (steps below)

---

## 🔧 Step 2: Configure Environment Variables

Your backend needs to know where Strapi is running.

**Create/Update `.env.local` in your project root:**

```bash
# .env.local
STRAPI_URL=http://localhost:1337
```

This tells your Express backend: "Strapi is running at http://localhost:1337"

> **Note:** For production, you'll set this to your Strapi Heroku URL.

---

## 🌐 Step 3: Configure Strapi CORS

CORS (Cross-Origin Resource Sharing) allows your Express backend to make requests to Strapi.

**Your Strapi config is already set up!** Check `strapi/config/plugins.ts`:

```typescript
cors: {
  enabled: true,
  origin: [
    'http://localhost:3001',        // ✅ Your Express backend
    'http://localhost:5173',        // ✅ Your React frontend
    // ... production URLs
  ],
}
```

If you need to add more URLs, edit `strapi/config/plugins.ts`.

---

## 👥 Step 4: Create Users in Strapi

You can't log in without users! Strapi uses its built-in **Users & Permissions** plugin, which creates a `User` content type automatically.

### Method 1: Via Strapi Admin UI (Easiest)

1. **Start Strapi:**
   ```bash
   cd strapi
   npm run develop
   ```

2. **Open Strapi Admin:**
   - Go to `http://localhost:1337/admin`
   - Create your admin account (first time only)

3. **Create a User:**
   - Click **Content Manager** in left sidebar
   - Click **User** (under Collection Types)
   - Click **Create new entry**
   - Fill in:
     - **Username**: (e.g., "john")
     - **Email**: (e.g., "john@example.com")
     - **Password**: (e.g., "password123")
     - **Confirmed**: ✅ **Check this box!** (Important!)
   - Click **Save** → **Publish**

### Method 2: Via Strapi API

```bash
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

> **Important:** When registering via API, you may need to confirm the user manually in Strapi Admin.

---

## 🧪 Step 5: Test the Complete Flow

### 5.1 Start All Three Services

Open **3 terminal windows**:

**Terminal 1 - Strapi:**
```bash
cd strapi
npm run develop
```
✅ You should see: `Server running on http://localhost:1337`

**Terminal 2 - Express Backend:**
```bash
cd /Users/charena/Projects/liff-ot-app-arun
npm start
```
✅ You should see: `Server running on port 3001`

**Terminal 3 - React Frontend:**
```bash
cd /Users/charena/Projects/liff-ot-app-arun
npm run dev
```
✅ You should see: `Local: http://localhost:5173`

### 5.2 Test Each Connection

#### Test 1: Is Strapi Running?
```bash
curl http://localhost:1337/api
```
**Expected:** `{"status": 200}`

#### Test 2: Can Express Reach Strapi?
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "test@example.com",
    "password": "password123"
  }'
```
**Expected:** `{"success": true, "jwt": "...", "user": {...}}`

> **Note:** Replace `test@example.com` and `password123` with a user you created in Step 4.

#### Test 3: Test via Browser
1. Open `http://localhost:5173/login`
2. Enter your email and password
3. Click **Sign In**
4. ✅ You should be redirected to the main app!

---

## 🔍 How It Works (Deep Dive)

### What Happens When You Click "Sign In"?

1. **LoginForm.jsx** (Line 157):
   ```javascript
   fetch(`${API_BASE_URL}/login`, {
     method: 'POST',
     body: JSON.stringify({
       identifier: formData.email,  // Your email
       password: formData.password   // Your password
     })
   })
   ```
   - Sends request to: `http://localhost:3001/login`

2. **authRoutes.js** (Line 46):
   ```javascript
   const strapiResponse = await fetch(`${strapiUrl}/api/auth/local`, {
     method: 'POST',
     body: JSON.stringify({ identifier, password })
   })
   ```
   - Proxies to: `http://localhost:1337/api/auth/local`
   - Strapi checks its **User** table for matching email/password

3. **Strapi User Table Lookup:**
   - Strapi searches for a user with matching email/username
   - Validates the password (encrypted/hashed)
   - Returns `{ jwt: "...", user: {...} }` if successful

4. **authRoutes.js** (Line 82):
   ```javascript
   res.cookie('jwt', jwt, {
     httpOnly: true,  // Secure: JavaScript can't access
     secure: false,   // true in production (HTTPS)
     sameSite: 'lax',
     maxAge: 24 * 60 * 60 * 1000  // 1 day
   })
   ```
   - Stores JWT in httpOnly cookie (secure)
   - Returns user info to frontend

5. **LoginForm.jsx** (Line 186):
   ```javascript
   localStorage.setItem('user', JSON.stringify(result.user));
   window.location.href = returnUrl || '/';
   ```
   - Stores user in localStorage
   - Redirects to main app

---

## 🛠️ Troubleshooting

### Problem: "Network Error" or CORS Error

**Solution:**
1. Check Strapi is running: `curl http://localhost:1337/api`
2. Check `STRAPI_URL` in `.env.local` is correct
3. Verify CORS in `strapi/config/plugins.ts` includes `http://localhost:3001`

### Problem: Login Fails with 401 "Invalid credentials"

**Solution:**
1. ✅ User exists in Strapi? Check in Strapi Admin → Content Manager → User
2. ✅ Password is correct?
3. ✅ User is **Confirmed**? (Must be checked in Strapi Admin)

### Problem: Backend Can't Reach Strapi

**Solution:**
1. Check `STRAPI_URL` environment variable:
   ```bash
   # In your backend terminal, check:
   echo $STRAPI_URL
   # Should show: http://localhost:1337
   ```
2. Restart your Express backend after changing `.env.local`

### Problem: User Created But Can't Login

**Solution:**
- ⚠️ **User must be Confirmed!**
- In Strapi Admin → Content Manager → User → Find your user → Edit → Check **Confirmed** → Save

---

## 📚 What Table Does Strapi Use?

Strapi automatically creates a **User** content type when you install the `users-permissions` plugin. This creates a database table called `users` (or similar, depending on your database).

**You don't need to create this table manually** - Strapi does it for you!

The User table typically has these fields:
- `id` - Unique identifier
- `username` - Username (can use email instead)
- `email` - Email address
- `password` - Encrypted password (never stored in plain text)
- `confirmed` - Boolean (must be true to login)
- `blocked` - Boolean (prevents login if true)
- `role` - User role/permissions

---

## ✅ Quick Checklist

Before testing, make sure:

- [ ] Strapi is running on port 1337
- [ ] `.env.local` has `STRAPI_URL=http://localhost:1337`
- [ ] At least one user exists in Strapi
- [ ] User's **Confirmed** field is `true`
- [ ] Express backend is running on port 3001
- [ ] React frontend is running on port 5173
- [ ] Strapi CORS allows `http://localhost:3001`

---

## 🎓 Next Steps

Now that you understand how it works:

1. **Create more users** via Strapi Admin
2. **Customize user fields** (add more fields to User content type)
3. **Set up roles/permissions** in Strapi
4. **Deploy to production** (update `STRAPI_URL` to your production Strapi URL)

---

## 📖 Related Documentation

- **Detailed Guide:** `STRAPI_LOGIN_CONNECTION.md`
- **Strapi Setup:** `STRAPI_SETUP.md`
- **Heroku Deployment:** `STRAPI_HEROKU_DEPLOYMENT.md`

---

**Questions?** Check the logs in each terminal - they show exactly what's happening at each step!

