# Strapi Login Collection Guide

This guide explains the optimized Login Collection that tracks authentication history, security events, and user sessions.

## 📋 Overview

The Login Collection is designed to automatically track:
- ✅ Successful login attempts
- ❌ Failed login attempts  
- 📊 Session duration and logout times
- 🔒 Security information (IP addresses, device info)
- 📱 Device and browser information

**Important:** This collection tracks login **history** - it does NOT handle authentication itself. Authentication is handled by Strapi's built-in User collection.

---

## 🏗️ Schema Structure

The Login collection has the following fields:

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `user` | Relation (manyToOne) | Links to Strapi User collection |
| `loginStatus` | Enumeration | `success`, `failed`, or `blocked` |
| `loginAttemptAt` | Datetime | When the login attempt occurred |
| `logoutAt` | Datetime | When the user logged out (if successful) |
| `sessionDuration` | Integer | Session duration in milliseconds |

### Security & Tracking Fields

| Field | Type | Description |
|-------|------|-------------|
| `ipAddress` | String | IP address of the login attempt |
| `userAgent` | Text | Browser/device user agent string |
| `rememberMe` | Boolean | Whether "remember me" was checked |
| `failureReason` | String | Reason for failed login (e.g., "Invalid password") |
| `deviceInfo` | JSON | Additional device/browser information |
| `location` | JSON | Geographic location (if available) |

### Relationship

- **Many-to-One** with User collection
- One user can have many login records
- Each login record belongs to one user

---

## 🚀 Setup Instructions

### Step 1: Restart Strapi

After updating the schema, restart Strapi:

```bash
cd strapi
npm run develop
```

Strapi will automatically:
- Create/update the database table
- Register the new fields
- Make the API endpoints available

### Step 2: Set Permissions

1. Go to Strapi Admin: `http://localhost:1337/admin`
2. Navigate to: **Settings** → **Users & Permissions** → **Roles** → **Public**
3. Under **Login History**, enable:
   - ✅ `find` - View login history
   - ✅ `create` - Log new login attempts
   - ✅ `update` - Update logout time
   - ⚠️ `delete` - Optional (for cleanup)
4. Click **Save**

### Step 3: Verify Setup

Test that login logging works:

```bash
# Try a successful login
curl -X POST http://localhost:3001/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "yourusername",
    "password": "yourpassword"
  }'

# Check if a login record was created
curl http://localhost:1337/api/logins?populate=user
```

---

## 🔄 How It Works

### Automatic Login Tracking

The login collection **automatically logs** all authentication attempts through `authRoutes.js`:

#### On Successful Login:
1. User authenticates via Strapi User collection (`/api/auth/local`)
2. System automatically creates a login record with:
   - `loginStatus: 'success'`
   - `user: [user ID]`
   - `loginAttemptAt: [current timestamp]`
   - `ipAddress: [client IP]`
   - `userAgent: [browser info]`
   - `rememberMe: [true/false]`
   - `deviceInfo: [JSON device data]`

#### On Failed Login:
1. Invalid credentials detected
2. System attempts to find user by identifier
3. Creates a login record with:
   - `loginStatus: 'failed'`
   - `user: [user ID if found, null if not]`
   - `loginAttemptAt: [current timestamp]`
   - `ipAddress: [client IP]`
   - `failureReason: [error message]`

#### On Logout:
1. User calls `/logout` endpoint
2. System finds the most recent successful login for that user
3. Updates the login record with:
   - `logoutAt: [current timestamp]`
   - `sessionDuration: [calculated duration in milliseconds]`

---

## 📡 API Endpoints

### Backend Endpoints

Your Express backend provides these endpoints:

#### 1. Login (Automatic Logging)
```http
POST /login
Content-Type: application/json

{
  "identifier": "username",
  "password": "password123",
  "rememberMe": true
}
```

**Response:**
```json
{
  "success": true,
  "jwt": "...",
  "user": {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "role": {...}
  }
}
```

**What Happens:** Automatically creates a login record in Strapi

#### 2. Logout (Automatic Tracking)
```http
POST /logout
Cookie: jwt=...
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**What Happens:** Updates the most recent login record with logout time and session duration

#### 3. Get Login History
```http
GET /login-history
Cookie: jwt=...
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "attributes": {
        "loginStatus": "success",
        "loginAttemptAt": "2024-01-15T10:30:00Z",
        "logoutAt": "2024-01-15T18:00:00Z",
        "sessionDuration": 27000000,
        "ipAddress": "192.168.1.1",
        "userAgent": "Mozilla/5.0...",
        "rememberMe": true
      }
    }
  ]
}
```

### Strapi API Endpoints

You can also query Strapi directly:

#### Get All Login Records
```bash
GET http://localhost:1337/api/logins?populate=user
```

#### Get Login Records for Specific User
```bash
GET http://localhost:1337/api/logins?filters[user][id][$eq]=1&populate=user
```

#### Get Failed Login Attempts
```bash
GET http://localhost:1337/api/logins?filters[loginStatus][$eq]=failed
```

#### Get Recent Logins (Last 10)
```bash
GET http://localhost:1337/api/logins?sort=loginAttemptAt:desc&pagination[limit]=10
```

#### Get Logins by IP Address
```bash
GET http://localhost:1337/api/logins?filters[ipAddress][$eq]=192.168.1.1
```

---

## 🔍 Query Examples

### In Strapi Admin

1. **View All Successful Logins:**
   - Go to: Content Manager → Login History
   - Filter: `loginStatus` = `success`

2. **Find Failed Attempts:**
   - Filter: `loginStatus` = `failed`
   - Sort by: `loginAttemptAt` (descending)

3. **See User's Login History:**
   - Filter: `user` = `[Select User]`

4. **Track by IP Address:**
   - Filter: `ipAddress` = `192.168.1.1`

5. **View Active Sessions:**
   - Filter: `loginStatus` = `success` AND `logoutAt` is `null`

### In Code (React/Frontend)

```javascript
// Get login history for current user
const getLoginHistory = async () => {
  const response = await fetch('http://localhost:3001/login-history', {
    credentials: 'include' // Include JWT cookie
  });
  const data = await response.json();
  console.log('Login history:', data.data);
};

// Get failed login attempts for security monitoring
const getFailedLogins = async () => {
  const response = await fetch(
    'http://localhost:1337/api/logins?filters[loginStatus][$eq]=failed&sort=loginAttemptAt:desc',
    {
      headers: {
        'Authorization': `Bearer ${yourJwtToken}`
      }
    }
  );
  const data = await response.json();
  console.log('Failed logins:', data.data);
};
```

### In Backend (Express)

```javascript
// Query login history via Strapi API
const fetch = (await import('node-fetch')).default;

const getLoginHistory = async (userId) => {
  const response = await fetch(
    `${STRAPI_URL}/api/logins?filters[user][id][$eq]=${userId}&sort=loginAttemptAt:desc`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.data;
};

// Find suspicious activity (multiple failed attempts)
const findSuspiciousActivity = async (ipAddress, minutes = 15) => {
  const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);
  
  const response = await fetch(
    `${STRAPI_URL}/api/logins?filters[ipAddress][$eq]=${ipAddress}&filters[loginStatus][$eq]=failed&filters[loginAttemptAt][$gte]=${cutoffTime.toISOString()}`,
    {
      headers: {
        'Content-Type': 'application/json'
      }
    }
  );
  const data = await response.json();
  return data.data.length; // Count of failed attempts
};
```

---

## 🛡️ Security Features

### Automatic Tracking

1. **IP Address Logging** - Track where users log in from
2. **Device Information** - Browser, platform, device type
3. **Failed Attempt Monitoring** - Detect brute force attacks
4. **Session Tracking** - Know when users are active

### Security Use Cases

#### Detect Brute Force Attacks:
```javascript
// Check for multiple failed attempts from same IP
const checkBruteForce = async (ipAddress) => {
  const response = await fetch(
    `${STRAPI_URL}/api/logins?filters[ipAddress][$eq]=${ipAddress}&filters[loginStatus][$eq]=failed&filters[loginAttemptAt][$gte]=${new Date(Date.now() - 15 * 60 * 1000).toISOString()}`
  );
  const data = await response.json();
  
  if (data.data.length >= 5) {
    // Block IP address or send alert
    console.warn('Potential brute force attack detected!');
    return true;
  }
  return false;
};
```

#### Monitor Suspicious Activity:
```javascript
// Find logins from unusual locations
const findUnusualLogins = async (userId) => {
  // Get user's typical IP addresses
  const userLogins = await getLoginHistory(userId);
  const typicalIPs = [...new Set(userLogins.map(l => l.attributes.ipAddress))];
  
  // Find logins from different IPs
  // ... implement your logic
};
```

---

## 📊 Analytics & Reporting

### Login Statistics

```javascript
// Get login statistics for a user
const getLoginStats = async (userId) => {
  const response = await fetch(
    `${STRAPI_URL}/api/logins?filters[user][id][$eq]=${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  );
  const data = await response.json();
  
  const logins = data.data || [];
  const successful = logins.filter(l => l.attributes.loginStatus === 'success');
  const failed = logins.filter(l => l.attributes.loginStatus === 'failed');
  
  const totalSessionTime = successful
    .filter(l => l.attributes.sessionDuration)
    .reduce((sum, l) => sum + l.attributes.sessionDuration, 0);
  
  return {
    totalLogins: logins.length,
    successfulLogins: successful.length,
    failedLogins: failed.length,
    totalSessionTime: totalSessionTime, // milliseconds
    averageSessionTime: successful.length > 0 
      ? totalSessionTime / successful.length 
      : 0,
    lastLogin: logins[0]?.attributes.loginAttemptAt
  };
};
```

---

## 🔧 Maintenance

### Cleanup Old Records

Periodically clean up old login records to keep the database manageable:

```javascript
// Delete login records older than 90 days
const cleanupOldLogins = async () => {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);
  
  // Get old records
  const response = await fetch(
    `${STRAPI_URL}/api/logins?filters[loginAttemptAt][$lt]=${cutoffDate.toISOString()}`
  );
  const data = await response.json();
  
  // Delete each record
  for (const login of data.data) {
    await fetch(`${STRAPI_URL}/api/logins/${login.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
  }
};
```

---

## 🎯 Best Practices

1. **Regular Monitoring** - Check failed login attempts regularly
2. **IP Tracking** - Monitor for unusual IP addresses
3. **Session Management** - Track active sessions
4. **Compliance** - Keep records for required retention periods
5. **Privacy** - Be aware of data privacy regulations (GDPR, etc.)
6. **Cleanup** - Regularly archive or delete old records

---

## 🐛 Troubleshooting

### Problem: Login records not being created

**Solutions:**
1. ✅ Check Strapi is running
2. ✅ Verify permissions are set (create permission enabled)
3. ✅ Check backend logs for errors
4. ✅ Ensure `STRAPI_URL` is correct

### Problem: Can't query login history

**Solutions:**
1. ✅ Check permissions (find permission enabled)
2. ✅ Verify JWT token is valid
3. ✅ Check user has access to login collection

### Problem: Logout time not updating

**Solutions:**
1. ✅ Check user has successful login record
2. ✅ Verify update permission is enabled
3. ✅ Check JWT token is passed correctly

---

## 📝 Summary

The Login Collection provides:
- ✅ Automatic login attempt tracking
- ✅ Security monitoring capabilities
- ✅ Session duration tracking
- ✅ Device and location information
- ✅ Audit trail for compliance
- ✅ Analytics and reporting data

**Remember:** This collection tracks login **history** - authentication is handled by Strapi's built-in User collection. The login collection simply records what happens during authentication.

---

## 🔗 Related Documentation

- [Strapi Login Connection Guide](./STRAPI_LOGIN_CONNECTION.md) - How authentication works
- [Tutorial: Connect Strapi Login](./TUTORIAL_CONNECT_STRAPI_LOGIN.md) - Step-by-step tutorial
- [Strapi Setup Guide](./STRAPI_SETUP.md) - Initial Strapi setup

---

**Last Updated:** January 2024

