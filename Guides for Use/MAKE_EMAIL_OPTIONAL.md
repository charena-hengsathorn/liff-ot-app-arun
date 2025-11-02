# Making Email Optional in Strapi User Collection

This guide shows how to make email optional for users who don't have email addresses.

## Why Make Email Optional?

Some users may not have email addresses, but you still need to:
- ✅ Authenticate them via username/password
- ✅ Track their login history
- ✅ Manage their accounts

## Solution: Make Email Optional in Built-in User Collection

**Important:** Keep using Strapi's built-in User collection - don't create a custom one. Just make email optional.

---

## Method 1: Via Strapi Admin UI (Recommended - Easiest)

### Step 1: Start Strapi

```bash
cd strapi
npm run develop
```

### Step 2: Open Strapi Admin

Go to: `http://localhost:1337/admin`

### Step 3: Navigate to User Model

1. Click **Content-Type Builder** in left sidebar
2. Under **Plugin Content Types**, find **User**
3. Click on **User**

### Step 4: Make Email Optional

1. Find the **email** field
2. Click on it to edit
3. **Uncheck** the **Required** checkbox
4. Click **Finish**
5. Click **Save** at the top

### Step 5: Restart Strapi

Restart Strapi to apply changes:
```bash
# Stop Strapi (Ctrl+C)
# Start again
npm run develop
```

---

## Method 2: Via Extension File (Automatic)

An extension file has been created at:
```
strapi/src/extensions/users-permissions/strapi-server.ts
```

This extension automatically:
- Makes email optional in User model
- Allows registration without email
- Still validates email uniqueness if provided

### How It Works

The extension:
1. Modifies the User schema to make email optional
2. Customizes the register controller to allow users without email
3. Sets email to `null` if not provided

### Activate Extension

Just restart Strapi - the extension loads automatically:

```bash
cd strapi
npm run develop
```

---

## Creating Users Without Email

After making email optional, you can create users in three ways:

### Method 1: Via Strapi Admin UI

1. Go to: **Content Manager** → **User** → **Create new entry**
2. Fill in:
   - **Username**: (required)
   - **Password**: (required)
   - **Email**: (optional - leave blank or set to null)
   - **Confirmed**: ✅ Check this
3. Click **Save** → **Publish**

### Method 2: Via API Registration

**If using the extension:**

```bash
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123",
    "email": null
  }'
```

Or omit email entirely:
```bash
curl -X POST http://localhost:1337/api/auth/local/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'
```

### Method 3: Via Your Backend Registration Endpoint

Your backend now has a `/register` endpoint:

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "john",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "john",
    "email": null
  },
  "jwt": "..."
}
```

---

## Login Still Works

After making email optional, login still works the same way:

### Via Your Backend:
```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "john",
    "password": "password123"
  }'
```

The `identifier` can be:
- Username (if email is null)
- Email (if email is provided)
- Username always works

---

## Important Notes

### 1. Username is Still Required

Email is optional, but **username is still required** for:
- User identification
- Login authentication
- Display purposes

### 2. Email Uniqueness

If you provide an email, it must still be unique:
- ✅ `username: "john", email: null` - OK
- ✅ `username: "john2", email: null` - OK
- ✅ `username: "john", email: "john@example.com"` - OK
- ❌ `username: "john", email: "john@example.com"` AND `username: "john2", email: "john@example.com"` - Email must be unique

### 3. Querying Users

When querying users, handle null emails:

```javascript
// Get all users
const users = await fetch('http://localhost:1337/api/users');

// Filter users without email
const usersWithoutEmail = users.filter(u => !u.email);

// Filter users with email
const usersWithEmail = users.filter(u => u.email);
```

---

## Testing

### Test 1: Create User Without Email

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test123"
  }'
```

**Expected:** Success - user created with `email: null`

### Test 2: Login with Username

```bash
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "testuser",
    "password": "test123"
  }'
```

**Expected:** Success - login works with username only

### Test 3: Create User with Email (Optional)

```bash
curl -X POST http://localhost:3001/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser2",
    "password": "test123",
    "email": "test@example.com"
  }'
```

**Expected:** Success - email is optional but works if provided

---

## Troubleshooting

### Problem: Still requires email

**Solutions:**
1. ✅ Restart Strapi after making changes
2. ✅ Check Content-Type Builder - email field should not be required
3. ✅ Verify extension file is in correct location
4. ✅ Clear Strapi cache: Delete `.cache` folder in `strapi`

### Problem: Can't login with username only

**Solutions:**
1. ✅ Check user exists in Strapi
2. ✅ Verify user is confirmed (`confirmed: true`)
3. ✅ Check password is correct
4. ✅ Use `identifier` field (not `username`) in login request

### Problem: Registration fails

**Solutions:**
1. ✅ Check username is unique
2. ✅ Check email (if provided) is unique
3. ✅ Verify permissions are set correctly
4. ✅ Check Strapi logs for errors

---

## Summary

✅ **Use Method 1 (Admin UI)** - Simplest, no code changes
✅ **Extension file** - Automatic, persists across restarts
✅ **Login still works** - Username/password authentication
✅ **Email is optional** - Users can exist without email
✅ **Email uniqueness** - Still enforced if email is provided

---

## Related Documentation

- [Strapi Login Connection Guide](./STRAPI_LOGIN_CONNECTION.md)
- [Login Collection Guide](./STRAPI_LOGIN_COLLECTION.md)

---

**Last Updated:** January 2024

