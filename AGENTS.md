# AGENTS.md - AI Agent Instructions for LIFF OT App

> **Last Updated:** November 14, 2025  
> **Project:** LIFF OT App (Arun Team)  
> **Critical Deadline:** Production database must be live by Monday

---

## 🎯 CURRENT MISSION: PRODUCTION DATABASE MIGRATION

### **PRIORITY 1: Create NEW Heroku App & Attach Strapi Database**

**Deadline:** Monday (Arun team starts using on Monday)

**CRITICAL UPDATE FROM PM:**
```
"Remove the old heroku production links and make a new production 
heroku on YOUR account and connect it there instead"

"The most important priority is to attach the strapi database to 
the production server which is to be used by Arun team on Monday"
```

**Current Status:**
- ✅ Frontend: Deployed on Vercel (https://liff-ot-app-arun.vercel.app)
- ⚠️ Backend: Currently on PM's Heroku (https://liff-ot-app-positive.herokuapp.com)
- ❌ **Need to create NEW Heroku app on YOUR account** ⚠️
- ❌ **Strapi Database: NOT connected to production PostgreSQL** ⚠️
- ❌ **Using SQLite locally (not production-ready)**

**Required Actions:**
1. **Create YOUR own Heroku account** (if you don't have one)
2. **Create NEW Heroku app** on your account (e.g., liff-ot-app-arun)
3. **Add PostgreSQL database** to your new Heroku app
4. **Configure Strapi** to use PostgreSQL in production
5. **Deploy everything** to YOUR new Heroku app
6. **Update frontend** to point to your new backend URL
7. **Migrate/seed initial data** (drivers)
8. **Test end-to-end integration**
9. **Remove references** to old Heroku app
10. **Handoff to Arun team** with documentation

---

## 📋 PROJECT OVERVIEW

### What This System Does
A LINE LIFF-based attendance tracking system for drivers that:
- Tracks daily clock-in/clock-out times
- Automatically calculates overtime (OT) hours
- Saves data to Google Sheets (primary) + Strapi database (secondary)
- Sends LINE notifications to managers
- Multi-language support (Thai/English)

### Technology Stack
```
Frontend:  React 19 + Vite 7 + Tailwind + LINE LIFF SDK
Backend:   Express.js + Node.js
CMS:       Strapi 5.30.0
Database:  PostgreSQL (prod) / SQLite (dev) ← NEEDS PRODUCTION SETUP
APIs:      Google Sheets API, LINE Messaging API
Hosting:   Vercel (frontend) + Heroku (backend)
```

### Key Integrations
1. **Google Sheets** - Primary data storage (managers view here)
2. **LINE LIFF** - Mobile app interface (runs inside LINE app)
3. **LINE Messaging** - Real-time notifications to manager groups
4. **Strapi CMS** - Driver management, user authentication

---

---

## 💡 UNDERSTANDING "ATTACH THE DATABASE" (Read This First!)

### **What Your PM Is Really Asking For**

When PM says: *"Attach the Strapi database to the production server"*

**It means:**
1. **Create YOUR own Heroku account and app** (not use PM's)
2. **Add PostgreSQL database** to your new Heroku app
3. **Configure Strapi** to use PostgreSQL instead of SQLite
4. **Deploy everything** to YOUR Heroku app
5. **Update frontend** to point to your new backend

### **Why This Matters**

**Current Problem:**
- Strapi is probably using **SQLite** (file-based database)
- SQLite file gets **deleted** when Heroku restarts
- You **lose all data** (drivers, users, attendance records)
- **Not production-ready!**

**Solution:**
- Use **PostgreSQL** (professional database server)
- Database is **separate service** on Heroku
- Data is **persistent** (never deleted)
- **Production-ready!**

### **What "Attaching" Means (Step-by-Step)**

Think of it like connecting a printer to your computer:

```
Step 1: Buy a printer (Create PostgreSQL database)
↓
Step 2: Get printer cable (Heroku gives you DATABASE_URL)
↓
Step 3: Plug cable into computer (Configure Strapi to use DATABASE_URL)
↓
Step 4: Turn on printer (Deploy Strapi)
↓
Step 5: Printer works! (Strapi uses PostgreSQL)
```

**In Technical Terms:**

```
1. heroku addons:create postgresql
   → Creates PostgreSQL database
   → Heroku automatically sets DATABASE_URL environment variable
   → DATABASE_URL contains connection string (username, password, host, port)

2. Edit: backend/strapi/config/env/production/database.js
   → Tell Strapi to use PostgreSQL
   → Read DATABASE_URL from environment
   → Configure SSL connection

3. git push heroku main
   → Deploy Strapi to Heroku
   → Strapi reads DATABASE_URL
   → Strapi connects to PostgreSQL
   → Strapi creates tables automatically

4. Database is now "attached"!
   → Strapi saves data to PostgreSQL
   → Data persists forever
   → No more data loss
```

### **Visual Explanation**

**BEFORE (Using SQLite - BAD for Production):**
```
┌──────────────────────┐
│  Heroku Dyno         │
│  ┌────────────────┐  │
│  │ Your App       │  │
│  │  ├── Express   │  │
│  │  └── Strapi ───┼──┼──→ SQLite File (data.db)
│  │                │  │         ↑
│  └────────────────┘  │         │
└──────────────────────┘    Stored in dyno
                            (gets deleted on restart!)
                            
Problems:
❌ Data in SQLite file
❌ File stored on dyno filesystem
❌ Dyno restarts = file deleted
❌ All data LOST!
```

**AFTER (Using PostgreSQL - GOOD for Production):**
```
┌──────────────────────┐
│  Heroku Dyno         │
│  ┌────────────────┐  │
│  │ Your App       │  │
│  │  ├── Express   │  │
│  │  └── Strapi    │  │
│  │       ↓        │  │
│  │  DATABASE_URL  │  │
│  └───────┼────────┘  │
└──────────┼───────────┘
           │ Connection String
           │ (postgres://user:pass@host:5432/db)
           ↓
┌──────────────────────┐
│ PostgreSQL Database  │  ← Separate service
│ (Heroku Add-on)      │  ← Persistent storage
│                      │  ← Never deleted
│ ┌──────────────────┐ │
│ │ Tables:          │ │
│ │ - drivers        │ │
│ │ - attendances    │ │
│ │ - users          │ │
│ │ - admin_users    │ │
│ └──────────────────┘ │
└──────────────────────┘

Benefits:
✅ Data in PostgreSQL server
✅ Separate from app
✅ Dyno restarts = no problem
✅ Data SAFE and persistent!
```

### **Why PM Wants NEW Heroku App (Not PM's Old One)**

**PM Said:**
```
"Remove the old heroku production links and make a new production 
heroku on YOUR account and connect it there instead"
```

**Reasons:**

1. **Ownership & Control**
   - Old app: On PM's account → PM must deploy for you
   - New app: On YOUR account → You can deploy anytime

2. **Learning Experience**
   - You learn full production setup
   - You understand deployment process
   - You can troubleshoot issues yourself

3. **Independence**
   - Can scale independently
   - Can manage database yourself
   - Can add services as needed

4. **Clean Start**
   - No legacy configs
   - Fresh production environment
   - Best practices from day 1

### **What You'll Actually Do (High-Level)**

```
Day 1 (Friday):
├── Create Heroku account (if needed)
├── Install Heroku CLI
├── Create new Heroku app (liff-ot-app-arun)
├── Add PostgreSQL database
└── Verify database is working

Day 2 (Saturday):
├── Configure Strapi for PostgreSQL
├── Set environment variables on Heroku
├── Create production config files
└── Deploy backend to YOUR Heroku

Day 3 (Sunday):
├── Create Strapi admin account
├── Import driver data
├── Update frontend to use new backend
├── Test everything thoroughly
└── Write documentation

Monday:
└── Handoff to Arun team
    ├── Provide admin credentials
    ├── Share documentation
    └── System ready for production use!
```

---

## 🏗️ CURRENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│              LINE LIFF Frontend (React)                      │
│         https://liff-ot-app-arun.vercel.app                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Express Backend + Strapi (Node.js)                   │
│      https://liff-ot-app-positive.herokuapp.com             │
│                                                              │
│  ⚠️  CURRENT ISSUE: Strapi using SQLite (not production)    │
│  ✅  GOAL: Connect Strapi to PostgreSQL on Heroku           │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
   Google         LINE           Strapi DB
   Sheets       Messaging      (SQLite → PostgreSQL)
                                    ↑
                              MIGRATION NEEDED
```

---

## 📂 PROJECT STRUCTURE

```
liff-ot-app-arun/
├── src/                          # Frontend React code
│   ├── components/
│   │   ├── StyledForm.jsx       # Main attendance form (800 lines - needs refactoring)
│   │   ├── ManagerView.jsx      # Driver management UI (600 lines)
│   │   ├── LoginForm.jsx        # Authentication UI
│   │   └── LoadingAnimation.jsx # Shared loading component
│   ├── login/                   # Reusable login module
│   └── App.jsx                  # Router and main app
│
├── backend/                      # Backend (if separate directory)
│   └── strapi/                  # Strapi CMS
│       ├── config/
│       │   ├── database.js      # ⚠️ NEEDS UPDATE: Add production config
│       │   └── server.js        # Server configuration
│       ├── src/
│       │   └── api/
│       │       ├── driver/      # Driver content type
│       │       └── attendance/  # Attendance content type
│       └── .env                 # ⚠️ NEEDS UPDATE: Production DATABASE_URL
│
├── server.mjs                    # Express backend server
├── googleSheetsHandler.js        # Google Sheets integration
├── package.json                  # Dependencies
├── .env.local                    # Environment variables (local dev)
├── google-credentials.json       # Google Service Account key
│
├── docs/                         # Documentation
│   └── Guides for Use/          # Setup and deployment guides
│
└── AGENTS.md                     # THIS FILE - AI agent instructions
```

---

## 🔥 CRITICAL FILES FOR PRODUCTION MIGRATION

### Files That MUST Be Modified:

1. **`backend/strapi/config/database.js`** (or `config/env/production/database.js`)
   - **Current:** Uses SQLite
   - **Needed:** Add PostgreSQL configuration for production
   - **Action:** Create production database config

2. **`backend/strapi/config/server.js`** (or `config/env/production/server.js`)
   - **Current:** May have localhost settings
   - **Needed:** Production URL and settings
   - **Action:** Update for Heroku deployment

3. **`.env` or `.env.production`** (Heroku config vars)
   - **Current:** Missing DATABASE_URL and Strapi secrets
   - **Needed:** PostgreSQL connection string, JWT secrets
   - **Action:** Set Heroku environment variables

4. **`Procfile`** (Heroku deployment)
   - **Current:** May only run Express server
   - **Needed:** Ensure Strapi starts properly
   - **Action:** Verify/update Procfile

5. **`package.json`**
   - **Current:** Has all dependencies
   - **Needed:** Verify PostgreSQL driver (`pg`) is included
   - **Action:** Check dependencies

---

## 🎯 MIGRATION PLAN (Step-by-Step)

### **PHASE 0: Heroku Account Setup** (NEW - Do This First!)
```
Timeline: 30 minutes
Prerequisites: None - START HERE

Tasks:
[ ] Create Heroku account (if you don't have one)
    URL: https://signup.heroku.com/
    Use your email address
    
[ ] Verify email address
    Check inbox for verification email
    
[ ] Install Heroku CLI
    macOS: brew tap heroku/brew && brew install heroku
    Windows: Download from https://devcenter.heroku.com/articles/heroku-cli
    Linux: curl https://cli-assets.heroku.com/install.sh | sh
    
[ ] Verify Heroku CLI installation
    Command: heroku --version
    Expected: heroku/8.x.x or higher
    
[ ] Login to Heroku via CLI
    Command: heroku login
    Follow browser authentication flow
    
[ ] Verify login successful
    Command: heroku auth:whoami
    Should show your email
    
[ ] Check existing apps (should be empty or show your apps)
    Command: heroku apps --all

Deliverable: Heroku account ready, CLI installed and authenticated
```

### **PHASE 1: Create New Heroku App** (UPDATED)
```
Timeline: 15 minutes
Prerequisites: Phase 0 complete

Tasks:
[ ] Create new Heroku app on YOUR account
    Command: heroku create liff-ot-app-arun
    Note: If name taken, try: liff-ot-app-arun-prod or liff-ot-app-[your-name]
    
[ ] Verify app was created
    Command: heroku apps:info --app liff-ot-app-arun
    Note: Save your app name and URL
    
[ ] Check app URL
    Your new backend URL will be: https://[your-app-name].herokuapp.com
    Example: https://liff-ot-app-arun.herokuapp.com
    
[ ] Add git remote for deployment
    Command: heroku git:remote --app liff-ot-app-arun
    This allows: git push heroku main
    
[ ] Verify git remote added
    Command: git remote -v
    Should see: heroku  https://git.heroku.com/liff-ot-app-arun.git

Deliverable: New Heroku app created on YOUR account, ready for deployment
```

### **PHASE 2: Add PostgreSQL Database** (UPDATED - This is "Attaching the Database!")
```
Timeline: 30 minutes
Prerequisites: Phase 1 complete (Heroku app created)

IMPORTANT: This is what "attach the Strapi database" means!
You're creating a PostgreSQL database and connecting it to your Heroku app.

Tasks:
[ ] Add PostgreSQL add-on to your Heroku app
    
    Option A (Recommended for production):
    Command: heroku addons:create heroku-postgresql:essential-0 --app liff-ot-app-arun
    Cost: $5/month (10M rows, 20 connections, 1GB RAM)
    
    Option B (For testing first):
    Command: heroku addons:create heroku-postgresql:mini --app liff-ot-app-arun
    Cost: Free tier (10k rows, 20 connections)
    
    Choose based on budget and needs!
    
[ ] Wait for PostgreSQL provisioning (2-3 minutes)
    Command: heroku addons:info postgresql --app liff-ot-app-arun
    Wait until status shows "available"
    
[ ] Verify DATABASE_URL was automatically set
    Command: heroku config:get DATABASE_URL --app liff-ot-app-arun
    Should see: postgres://username:password@host:5432/database
    This is your database connection string!
    
[ ] Test database connection
    Command: heroku pg:psql --app liff-ot-app-arun
    You should connect to PostgreSQL
    Type: \l (to list databases)
    Type: \q (to quit)
    
[ ] Check database info
    Command: heroku pg:info --app liff-ot-app-arun
    Note: Plan, Status, Connections, Size
    
[ ] Check database is empty (no tables yet - Strapi will create them)
    Command: heroku pg:psql --app liff-ot-app-arun
    Type: \dt
    Should see: "Did not find any relations" (normal at this stage)
    Type: \q

Deliverable: PostgreSQL database created and "attached" to your Heroku app
Note: "Attached" means DATABASE_URL environment variable is automatically set
```

### **PHASE 1: Pre-Work** (Waiting for Access) - DEPRECATED
```
Status: NO LONGER NEEDED - You're creating your own Heroku app!
This phase is replaced by Phase 0 (Heroku Account Setup)

Old tasks (ignore these):
[ ] ~~PM adds developer as Heroku collaborator~~
[ ] ~~PM adds developer as Vercel collaborator~~
```

### **PHASE 2: Database Setup** (Friday-Saturday) - NOW PHASE 3
```
Status: UPDATED - See Phase 2 above for complete database setup
```

### **PHASE 3: Strapi Configuration** (Friday-Saturday) - NOW PHASE 4
```
Timeline: 2-3 hours
Prerequisites: Phase 2 complete (PostgreSQL database created)

IMPORTANT: This configures Strapi to USE the PostgreSQL database you just attached!

Tasks:
[ ] Create production database configuration directory
    Command: mkdir -p backend/strapi/config/env/production
    
[ ] Create production database config file
    File: backend/strapi/config/env/production/database.js
    
    Content:
    ```javascript
    module.exports = ({ env }) => ({
      connection: {
        client: 'postgres',
        connection: {
          // Heroku automatically provides DATABASE_URL
          connectionString: env('DATABASE_URL'),
          ssl: {
            rejectUnauthorized: false, // Required for Heroku PostgreSQL
          },
        },
        pool: {
          min: env.int('DATABASE_POOL_MIN', 2),
          max: env.int('DATABASE_POOL_MAX', 10),
        },
        acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
      },
    });
    ```
    
    What this does:
    - Tells Strapi to use PostgreSQL (not SQLite)
    - Gets connection from DATABASE_URL (set by Heroku)
    - Enables SSL (required by Heroku)
    - Sets connection pool (for performance)
    
[ ] Create production server config file
    File: backend/strapi/config/env/production/server.js
    
    Content:
    ```javascript
    module.exports = ({ env }) => ({
      host: env('HOST', '0.0.0.0'),
      port: env.int('PORT', 1337),
      url: env('STRAPI_URL', 'https://liff-ot-app-arun.herokuapp.com'), // YOUR URL
      app: {
        keys: env.array('APP_KEYS'),
      },
      webhooks: {
        populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
      },
    });
    ```
    
    Replace 'liff-ot-app-arun.herokuapp.com' with YOUR Heroku app URL!
    
[ ] Verify PostgreSQL client is in dependencies
    Command: grep '"pg"' package.json
    Should see: "pg": "^8.x.x" or similar
    If missing, add it:
    Command: npm install pg --save
    
[ ] Generate Strapi secrets (run this command 4 times, save each output)
    Command: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
    
    Save outputs as:
    - Secret 1: ADMIN_JWT_SECRET
    - Secret 2: API_TOKEN_SALT
    - Secret 3: JWT_SECRET
    - Secrets 4-7: APP_KEYS (comma-separated)
    
[ ] Set Heroku environment variables with your secrets
    Commands:
    heroku config:set NODE_ENV=production --app liff-ot-app-arun
    heroku config:set ADMIN_JWT_SECRET="<paste-secret-1>" --app liff-ot-app-arun
    heroku config:set API_TOKEN_SALT="<paste-secret-2>" --app liff-ot-app-arun
    heroku config:set JWT_SECRET="<paste-secret-3>" --app liff-ot-app-arun
    heroku config:set APP_KEYS="secret4,secret5,secret6,secret7" --app liff-ot-app-arun
    heroku config:set STRAPI_URL=https://liff-ot-app-arun.herokuapp.com --app liff-ot-app-arun
    heroku config:set DATABASE_SSL_SELF=false --app liff-ot-app-arun
    
[ ] Copy existing environment variables from .env.local
    Get these values from your .env.local file:
    
    heroku config:set LINE_CHANNEL_ACCESS_TOKEN="<from-env-local>" --app liff-ot-app-arun
    heroku config:set LINE_GROUP_ID_DEV="<from-env-local>" --app liff-ot-app-arun
    heroku config:set LINE_GROUP_ID_PROD="<from-env-local>" --app liff-ot-app-arun
    heroku config:set MANAGER_USER_IDS_DEV="<from-env-local>" --app liff-ot-app-arun
    heroku config:set MANAGER_USER_IDS_PROD="<from-env-local>" --app liff-ot-app-arun
    heroku config:set VITE_GOOGLE_SHEET_ID_DEV="<from-env-local>" --app liff-ot-app-arun
    heroku config:set VITE_GOOGLE_SHEET_ID_PROD="<from-env-local>" --app liff-ot-app-arun
    heroku config:set VITE_LIFF_ID="<from-env-local>" --app liff-ot-app-arun
    
[ ] Set Google Service Account credentials
    Option A (Base64 encoded - recommended):
    Command: cat google-credentials.json | base64 | tr -d '\n' | pbcopy
    Then: heroku config:set GOOGLE_SERVICE_ACCOUNT_KEY="<paste-from-clipboard>" --app liff-ot-app-arun
    
    Option B (File path - not recommended for Heroku):
    You'll need to include the file in your git repo (not secure!)
    
[ ] Verify all environment variables are set
    Command: heroku config --app liff-ot-app-arun
    Should see: DATABASE_URL, ADMIN_JWT_SECRET, API_TOKEN_SALT, etc.
    
[ ] Commit configuration changes to git
    Commands:
    git add backend/strapi/config/env/production/
    git add package.json (if you added 'pg' dependency)
    git commit -m "Configure Strapi for production PostgreSQL on new Heroku app"

Deliverable: Strapi configured to use PostgreSQL, all secrets set
```

### **PHASE 4: Deployment** (Saturday-Sunday) - NOW PHASE 5
```
Timeline: 2-3 hours
Prerequisites: Configuration complete

Tasks:
[ ] Deploy to Heroku
    Command: git push heroku main
    
[ ] Monitor deployment logs
    Command: heroku logs --tail --app liff-ot-app-positive
    
[ ] Run database migrations
    Command: heroku run npm run strapi -- migrations:run --app liff-ot-app-positive
    
[ ] Build Strapi admin
    Command: heroku run npm run strapi -- build --app liff-ot-app-positive
    
[ ] Verify Strapi admin access
    URL: https://liff-ot-app-positive.herokuapp.com/admin
    
[ ] Create first admin user
    Via UI or CLI: heroku run npm run strapi -- admin:create-user
```

### **PHASE 5: Deployment to YOUR Heroku** (Saturday-Sunday)
```
Timeline: 2-3 hours
Prerequisites: Phase 4 complete (Strapi configured)

IMPORTANT: You're now deploying to YOUR new Heroku app, not the old one!

Tasks:
[ ] Ensure you're in project root directory
    Command: cd /path/to/liff-ot-app-arun
    Command: pwd (verify you're in correct directory)
    
[ ] Check git status (should be clean or only have config changes)
    Command: git status
    
[ ] Verify Heroku git remote is set to YOUR app
    Command: git remote -v
    Should see: heroku  https://git.heroku.com/liff-ot-app-arun.git (fetch)
    Should see: heroku  https://git.heroku.com/liff-ot-app-arun.git (push)
    
[ ] Check Procfile exists and is correct
    File: Procfile (in project root)
    
    Should contain:
    ```
    web: node server.mjs
    ```
    
    Or if Strapi is separate process:
    ```
    web: node server.mjs
    release: cd backend/strapi && npm run strapi build
    ```
    
    If Procfile doesn't exist, create it!
    
[ ] Deploy to YOUR Heroku app
    Command: git push heroku main
    
    Or if you're on different branch:
    Command: git push heroku your-branch-name:main
    
    Watch the build output - should see:
    - Building dependencies
    - Installing node modules
    - Running build scripts
    - Launching app
    
[ ] Monitor deployment logs in real-time
    Command: heroku logs --tail --app liff-ot-app-arun
    
    Look for:
    ✅ "Server running on port..."
    ✅ "Strapi started"
    ✅ Database connection successful
    ❌ Any errors (stop and debug if you see errors)
    
[ ] Check dyno status (should be "up")
    Command: heroku ps --app liff-ot-app-arun
    Should see: web.1: up
    
[ ] Test backend health endpoint
    Command: curl https://liff-ot-app-arun.herokuapp.com/health
    Expected: {"status":"healthy","timestamp":"...","env":"production"}
    
[ ] Test Strapi API endpoint
    Command: curl https://liff-ot-app-arun.herokuapp.com/api
    Expected: {"data":{...}} or similar JSON response
    
[ ] Check if Strapi created database tables
    Command: heroku pg:psql --app liff-ot-app-arun
    SQL: \dt
    Should now see tables: admin_users, admin_permissions, drivers, attendances, etc.
    SQL: \q (to exit)
    
    If no tables yet, Strapi will create them on first admin access
    
[ ] Access Strapi admin panel
    URL: https://liff-ot-app-arun.herokuapp.com/admin
    
    First time: You'll see "Create your admin account" page
    Fill in:
    - First name: Admin
    - Last name: Arun
    - Email: your-email@example.com (use your email or PM's email)
    - Password: [Strong password - save it securely!]
    
    Click "Let's start"
    
[ ] Verify Strapi admin login works
    Login with credentials you just created
    Should see Strapi dashboard
    
[ ] Check database tables were created by Strapi
    Command: heroku pg:psql --app liff-ot-app-arun
    SQL: SELECT COUNT(*) FROM admin_users;
    Should see: 1 (the admin user you just created)
    SQL: \q
    
[ ] Save admin credentials securely
    Create file: PRODUCTION_CREDENTIALS.txt (DO NOT COMMIT TO GIT!)
    Content:
    ```
    Strapi Admin Credentials (CONFIDENTIAL)
    =========================================
    URL: https://liff-ot-app-arun.herokuapp.com/admin
    Email: your-email@example.com
    Password: [your-password]
    Created: [date]
    
    Share with PM only via secure channel!
    ```

Deliverable: Backend deployed to YOUR Heroku, Strapi admin accessible, database working
```

### **PHASE 6: Update Frontend to Use NEW Backend** (Sunday)
```
Timeline: 1 hour
Prerequisites: Phase 5 complete (backend deployed and working)

IMPORTANT: Frontend must point to YOUR new Heroku app, not the old one!

Tasks:
[ ] Login to Vercel
    URL: https://vercel.com
    Login with your account (or get access from PM)
    
[ ] Navigate to your project
    Project: liff-ot-app-arun
    Go to: Settings → Environment Variables
    
[ ] Update STRAPI_URL environment variable
    Variable: STRAPI_URL
    Old value: https://liff-ot-app-positive.herokuapp.com
    New value: https://liff-ot-app-arun.herokuapp.com (YOUR app!)
    
    Update for all environments:
    - Production
    - Preview
    - Development
    
[ ] Update VITE_STRAPI_URL (if it exists)
    Variable: VITE_STRAPI_URL
    New value: https://liff-ot-app-arun.herokuapp.com
    
[ ] OR update via Vercel CLI
    Commands:
    vercel env rm STRAPI_URL production
    vercel env add STRAPI_URL production
    # Enter: https://liff-ot-app-arun.herokuapp.com
    
    vercel env rm VITE_STRAPI_URL production
    vercel env add VITE_STRAPI_URL production
    # Enter: https://liff-ot-app-arun.herokuapp.com
    
[ ] Update .env.local for local development
    File: .env.local
    
    Change:
    STRAPI_URL=http://localhost:1337  # Keep for local dev
    # OR for testing against production:
    STRAPI_URL=https://liff-ot-app-arun.herokuapp.com
    
[ ] Update backend CORS to allow YOUR frontend
    File: server.mjs
    
    Find: const allowedOrigins = [...]
    
    Ensure it includes:
    ```javascript
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'https://liff-ot-app-arun.vercel.app',
      'https://liff-ot-app-arun-git-main-your-team.vercel.app',
      /^https:\/\/liff-ot-app-arun-.*\.vercel\.app$/,  // Preview deployments
    ];
    ```
    
    REMOVE old references:
    - https://liff-ot-app-positive.herokuapp.com (old Heroku)
    - https://liff-ot-app-positive.vercel.app (if exists)
    
[ ] Commit CORS changes
    Commands:
    git add server.mjs
    git commit -m "Update CORS for new Heroku backend URL"
    git push heroku main
    
[ ] Redeploy frontend on Vercel
    Option A - Via Vercel Dashboard:
    - Go to project → Deployments
    - Click "..." on latest deployment → Redeploy
    
    Option B - Via Vercel CLI:
    Command: vercel --prod
    
    Option C - Via Git:
    Make a small change (add comment) and push to main branch
    Vercel will auto-deploy
    
[ ] Wait for Vercel deployment to complete
    Watch deployment logs in Vercel dashboard
    Should see: "Deployment completed"
    
[ ] Verify frontend environment variables are correct
    Vercel Dashboard → Project → Settings → Environment Variables
    Confirm STRAPI_URL points to YOUR Heroku app

Deliverable: Frontend now points to YOUR new Heroku backend
```

### **PHASE 7: Integration Testing** (Sunday)
```
Timeline: 1-2 hours
Prerequisites: Strapi deployed successfully

Tasks:
[ ] Export existing driver data (if any)
    Command: curl https://liff-ot-app-positive.herokuapp.com/api/drivers > drivers-backup.json
    
[ ] Import/create Arun team drivers
    Methods:
    - Via Strapi admin UI (Content Manager → Driver)
    - Via API (bulk import script)
    - Via CLI (Strapi console)
    
[ ] Verify data in database
    Command: heroku pg:psql --app liff-ot-app-positive
    SQL: SELECT * FROM drivers;
    
[ ] Test data via API
    Command: curl https://liff-ot-app-positive.herokuapp.com/api/drivers
```

### **PHASE 7: Integration Testing** (Sunday)
```
Timeline: 2-3 hours
Prerequisites: Phase 6 complete (frontend updated)

CRITICAL: Test everything thoroughly before Arun team uses on Monday!

Tests:
[ ] Test 1: Backend Health Check
    Command: curl https://liff-ot-app-arun.herokuapp.com/health
    Expected: {"status":"healthy",...}
    
[ ] Test 2: Strapi API Responds
    Command: curl https://liff-ot-app-arun.herokuapp.com/api
    Expected: JSON response (not 404 or error)
    
[ ] Test 3: Strapi Admin Accessible
    URL: https://liff-ot-app-arun.herokuapp.com/admin
    Action: Login with admin credentials
    Expected: Dashboard loads successfully
    
[ ] Test 4: Database Has Tables
    Command: heroku pg:psql --app liff-ot-app-arun
    SQL: \dt
    Expected: See tables (drivers, attendances, admin_users, etc.)
    SQL: \q
    
[ ] Test 5: Frontend Loads
    URL: https://liff-ot-app-arun.vercel.app
    Expected: App loads without console errors
    
[ ] Test 6: Driver Dropdown (Frontend → Strapi Integration)
    Action: Open frontend, look at driver dropdown
    Expected: Dropdown should be empty (no drivers yet)
    Note: We'll add drivers in Phase 8
    
[ ] Test 7: Create Test Driver via Strapi Admin
    Strapi Admin → Content Manager → Driver → Create new entry
    Fill in:
    - Name: "Test Driver"
    - Age: 30
    - Status: active
    Click: Save & Publish
    
[ ] Test 8: Verify Driver in Database
    Command: heroku pg:psql --app liff-ot-app-arun
    SQL: SELECT * FROM drivers;
    Expected: See "Test Driver" record
    SQL: \q
    
[ ] Test 9: Frontend Shows Driver
    Refresh frontend page
    Check dropdown
    Expected: "Test Driver" appears in dropdown
    
[ ] Test 10: Clock-In Flow (Full Integration Test)
    Action:
    1. Select "Test Driver" from dropdown
    2. Click "Clock In" button
    3. Wait for success message
    
    Expected:
    - Success message appears
    - Clock-in time shows in form
    - Check Google Sheets: Entry created
    - Check Strapi Admin → Attendance: Entry created (optional)
    
[ ] Test 11: Clock-Out Flow with OT Calculation
    Action:
    1. Same driver still selected
    2. Change time to 18:00 (or use current time if after 17:00)
    3. Click "Clock Out" button
    4. Wait for success message
    
    Expected:
    - Success message appears
    - OT hours calculated and shown
    - Google Sheets updated with clock-out time and OT
    - LINE notification sent to manager group
    
[ ] Test 12: Verify OT Calculation
    Check Google Sheets:
    - Clock In: [time]
    - Clock Out: [time]
    - OT Start: 17:00 (if clock out after 17:00)
    - OT End: [clock out time]
    - OT Hours: [calculated decimal]
    
    Manual calculation:
    If clock out at 18:00: OT = 1.00 hour
    If clock out at 19:30: OT = 2.50 hours
    
[ ] Test 13: LINE Notification Received
    Check LINE group (manager group)
    Expected: Notification with driver name, times, OT hours
    
[ ] Test 14: Multi-Language Switch
    Action: Click language toggle (Thai/English)
    Expected: UI text changes language
    
[ ] Test 15: Dark Mode
    Action: Change system dark mode
    Expected: App adapts to dark theme
    
[ ] Test 16: Manager View
    URL: https://liff-ot-app-arun.vercel.app/manager
    Expected: 
    - Shows "Test Driver"
    - Shows last clock-in time
    - Can edit driver
    - Can delete driver (don't actually delete yet!)
    
[ ] Test 17: Comments Auto-Save
    Action:
    1. Select driver
    2. Type in comments field
    3. Wait 2 seconds
    
    Expected:
    - Comments saved to Google Sheets automatically
    - No need to click save button
    
[ ] Test 18: Data Persistence
    Action:
    1. Close browser
    2. Open frontend again
    3. Select same driver
    
    Expected:
    - Today's clock-in data auto-loads
    - Shows existing clock-in time
    - Shows existing comments
    
[ ] Test 19: Error Handling
    Action: Try to clock in without selecting driver
    Expected: Error message shown, action blocked
    
[ ] Test 20: Month-End OT Blackout (if date is 25-31)
    Action:
    1. Clock in early (e.g., 07:00)
    2. Clock out late (e.g., 19:00)
    
    Expected:
    - If date is 1-24: OT calculated normally
    - If date is 25-31: OT = 0.00 (blackout period)
    
[ ] Test 21: Check Heroku Logs for Errors
    Command: heroku logs --tail --app liff-ot-app-arun
    Look for: Any errors or warnings
    Expected: No critical errors
    
[ ] Test 22: Database Connection Pool
    Command: heroku pg:info --app liff-ot-app-arun
    Check: Connection count should be low (< 5)
    
[ ] Test 23: API Response Times
    Command: curl -w "Time: %{time_total}s\n" https://liff-ot-app-arun.herokuapp.com/api/drivers
    Expected: Response time < 2 seconds

Deliverable: All tests passing, system ready for production use
```

### **PHASE 8: Data Migration & Seeding** (Sunday)
```
Timeline: 2-3 hours
Prerequisites: Data migrated

Tests:
[ ] Frontend can load drivers from Strapi
    URL: https://liff-ot-app-arun.vercel.app
    Action: Open driver dropdown, verify drivers appear
    
[ ] Attendance submission saves to both Sheets + Strapi
    Action: Clock in/out, verify in both systems
    
[ ] OT calculation works correctly
    Test: Clock in 07:00, Clock out 19:00
    Expected: 3.00 hours OT
    
[ ] LINE notifications send successfully
    Test: Clock out, verify notification in LINE group
    
[ ] Manager view shows drivers with last clock-in
    URL: https://liff-ot-app-arun.vercel.app/manager
    
[ ] Multi-language works (Thai/English)
    Test: Switch language, verify translations
    
[ ] Dark mode works
    Test: System dark mode, verify UI adapts
```

### **PHASE 9: Documentation & Handoff** (Sunday Evening/Monday Morning)
```
Timeline: 2 hours
Prerequisites: Phase 8 complete (drivers imported)

Deliverables:
[ ] Production guide for Arun team
    File: docs/PRODUCTION_GUIDE_ARUN.md
    
[ ] Admin credentials document (secure)
    Info: Strapi admin email + password
    
[ ] Troubleshooting guide
    File: docs/TROUBLESHOOTING.md
    
[ ] Handoff checklist completed
    File: docs/HANDOFF_CHECKLIST.md
    
[ ] Demo to PM
    Schedule: Monday morning
    
[ ] Training for Arun team (if needed)
    Schedule: Monday
```

---

## 🚨 CRITICAL ISSUES & RISKS

### Issue 1: Dual Backend Problem
**Problem:** System uses BOTH Google Sheets AND Strapi as data stores
- Google Sheets = Primary (managers view here)
- Strapi = Secondary (optional, sync may fail silently)
- No guaranteed consistency between systems

**Current Behavior:**
```javascript
// In server.mjs - submit endpoint
await updateGoogleSheets(data);  // Always happens
await saveToStrapi(data);         // Best effort (may fail silently)
```

**Risk:** Data in Sheets ≠ Data in Strapi

**Mitigation (For Now):**
- Prioritize Google Sheets as source of truth
- Treat Strapi as supplementary
- Add error logging for Strapi failures
- Future: Decide on single source of truth

### Issue 2: No Automated Tests
**Problem:** Zero unit tests, integration tests, or E2E tests
- Every deployment is manual verification
- High risk of breaking changes
- No regression protection

**Risk:** Production bugs not caught until users report

**Mitigation:**
- Manual testing checklist (see Phase 6)
- Monitor Heroku logs closely
- Have rollback plan ready

### Issue 3: Large Component Files
**Problem:** 
- `StyledForm.jsx` = 800+ lines
- `ManagerView.jsx` = 600+ lines
- Business logic mixed with UI

**Risk:** Hard to modify, test, debug

**Mitigation (For Now):**
- Don't refactor before deadline
- Add comments to complex sections
- Plan refactoring for after launch

### Issue 4: Silent Failures
**Problem:** Many API calls use `.catch()` with only `console.error()`
- No user notification
- No retry logic
- No alerting to operations team

**Risk:** Users think operation succeeded when it failed

**Mitigation:**
- Add user-facing error messages
- Log errors with context
- Monitor Heroku logs

### Issue 5: Time Zone Complexity
**Problem:** Thai Buddhist calendar + Bangkok timezone
- Easy to make mistakes
- Date conversion logic scattered

**Risk:** OT calculated for wrong date

**Mitigation:**
- Centralize date/time logic
- Test extensively with Thai dates
- Document conversion rules

---

## 🔐 SECURITY CONSIDERATIONS

### Secrets Management
**Current State:**
- Secrets in `.env.local` (local dev)
- Secrets in Heroku config vars (production)

**For Production:**
```bash
# Generate strong secrets (32 bytes, base64)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Required secrets:
- ADMIN_JWT_SECRET
- API_TOKEN_SALT  
- JWT_SECRET
- APP_KEYS (4 secrets, comma-separated)
- DATABASE_URL (auto-set by Heroku PostgreSQL)
- LINE_CHANNEL_ACCESS_TOKEN
- GOOGLE_SERVICE_ACCOUNT_KEY
```

**Never commit to git:**
- `.env.local`
- `.env.production`
- `google-credentials.json`
- Any file with secrets

### Access Control
**Strapi Roles:**
- Super Admin: Full access (1 user only)
- Admin: Content management (Arun managers)
- Author/Editor: Limited access
- Public: Read-only (drivers via API)

**LINE Integration:**
- Manager user IDs hardcoded in environment
- Only specific users can approve via LINE
- Production vs Dev groups separated

---

## 📊 SUCCESS CRITERIA

### Technical Success ✅
- [ ] Strapi accessible at https://liff-ot-app-positive.herokuapp.com/admin
- [ ] PostgreSQL database connected (verify with `heroku pg:info`)
- [ ] All API endpoints return 200 OK
- [ ] No errors in Heroku logs (critical errors only)
- [ ] Database has tables: drivers, attendances, users

### Functional Success ✅
- [ ] Driver dropdown loads from Strapi
- [ ] Clock in/out saves to both Sheets + Strapi
- [ ] OT calculation correct (test multiple scenarios)
- [ ] LINE notifications send successfully
- [ ] Manager view shows drivers with last clock-in
- [ ] Language switching works (Thai/English)

### Business Success ✅
- [ ] Arun team can log in to Strapi admin
- [ ] All drivers imported and visible
- [ ] Documentation provided and clear
- [ ] PM approves handoff
- [ ] System ready for Monday production use

---

## 🛠️ USEFUL COMMANDS FOR AI AGENTS

### Heroku Commands
```bash
# Login
heroku login

# Check apps
heroku apps --all

# Check config
heroku config --app liff-ot-app-positive

# Check logs (real-time)
heroku logs --tail --app liff-ot-app-positive

# Check database
heroku pg:info --app liff-ot-app-positive
heroku pg:psql --app liff-ot-app-positive

# Add environment variable
heroku config:set KEY=value --app liff-ot-app-positive

# Deploy
git push heroku main

# Rollback (if deployment fails)
heroku releases:rollback --app liff-ot-app-positive

# Run command on Heroku
heroku run <command> --app liff-ot-app-positive
```

### Database Commands
```bash
# Connect to database
heroku pg:psql --app liff-ot-app-positive

# Inside psql:
\l          # List databases
\dt         # List tables
\d drivers  # Describe drivers table
SELECT * FROM drivers;  # Query drivers

# Backup database (manual)
heroku pg:backups:capture --app liff-ot-app-positive
heroku pg:backups:download --app liff-ot-app-positive
```

### Strapi Commands
```bash
# Build admin panel
npm run strapi build

# Start Strapi
npm run strapi develop  # Development
npm run strapi start    # Production

# Create admin user
npm run strapi admin:create-user \
  --firstname=Admin \
  --lastname=User \
  --email=admin@example.com \
  --password=SecurePass123

# Generate API token
npm run strapi admin:create-api-token
```

### Testing Commands
```bash
# Test backend health
curl https://liff-ot-app-positive.herokuapp.com/health

# Test Strapi API
curl https://liff-ot-app-positive.herokuapp.com/api

# Test drivers endpoint
curl https://liff-ot-app-positive.herokuapp.com/api/drivers

# Test clock-in (with data)
curl -X POST https://liff-ot-app-positive.herokuapp.com/clock-event \
  -H "Content-Type: application/json" \
  -d '{
    "driverName": "Test Driver",
    "thaiDate": "14/11/2568",
    "type": "clockIn",
    "timestamp": "08:00",
    "env": "prod"
  }'
```

---

## 📚 IMPORTANT DOCUMENTATION REFERENCES

### External Docs
- Strapi Docs: https://docs.strapi.io
- Heroku PostgreSQL: https://devcenter.heroku.com/articles/heroku-postgresql
- LINE LIFF: https://developers.line.biz/en/docs/liff/
- Google Sheets API: https://developers.google.com/sheets/api

### Internal Docs (in `/docs/Guides for Use/`)
- `STRAPI_HEROKU_DEPLOYMENT.md` - Detailed Strapi deployment guide
- `DEPLOY_STRAPI_HEROKU_PROD.md` - Production deployment steps
- `HEROKU_DEPLOYMENT.md` - General Heroku deployment
- `GOOGLE_SHEETS_SETUP.md` - Google Sheets API setup
- `ENV_SETUP.md` - Environment variables guide

### Key Code Files to Understand
1. `server.mjs` - Main Express server, all API endpoints
2. `googleSheetsHandler.js` - Google Sheets integration, OT calculation
3. `src/components/StyledForm.jsx` - Main UI, form logic
4. `backend/strapi/config/database.js` - Database configuration

---

## 🎯 AI AGENT BEHAVIORAL GUIDELINES

### When Working on This Project:

1. **Always Check Environment**
   - Is this dev or prod?
   - Which Google Sheet (dev/prod)?
   - Which Strapi URL (local/prod)?
   - Which LINE group (dev/prod)?

2. **Never Commit Secrets**
   - Double-check files before `git add`
   - Use `.gitignore` for sensitive files
   - Use environment variables, never hardcode

3. **Test Before Deploying**
   - Run locally first
   - Check Heroku logs after deploy
   - Verify with curl commands
   - Test in browser

4. **Document Changes**
   - Update this AGENTS.md
   - Add comments to code
   - Update docs/ folder
   - Note any issues/gotchas

5. **Communicate Progress**
   - Daily updates to PM
   - Note blockers immediately
   - Share test results
   - Ask questions early

6. **Prioritize Data Integrity**
   - Google Sheets is source of truth (for now)
   - Never delete production data
   - Always backup before migrations
   - Test with dummy data first

7. **Be Timezone Aware**
   - Always use Bangkok timezone (Asia/Bangkok)
   - Always use Thai Buddhist calendar for display
   - Test date edge cases (month end, year boundary)

8. **Handle Errors Gracefully**
   - User-friendly error messages
   - Log errors with context
   - Don't let one failure break everything
   - Have rollback plans

---

## 🔍 DEBUGGING CHECKLIST

### If Deployment Fails:
```
1. Check Heroku logs
   heroku logs --tail --app liff-ot-app-positive
   
2. Check if Strapi started
   heroku ps --app liff-ot-app-positive
   
3. Check environment variables
   heroku config --app liff-ot-app-positive
   
4. Check database connection
   heroku pg:info --app liff-ot-app-positive
   
5. Check last releases
   heroku releases --app liff-ot-app-positive
   
6. Rollback if needed
   heroku releases:rollback --app liff-ot-app-positive
```

### If Database Connection Fails:
```
1. Verify DATABASE_URL is set
   heroku config:get DATABASE_URL --app liff-ot-app-positive
   
2. Test connection manually
   heroku pg:psql --app liff-ot-app-positive
   
3. Check database status
   heroku pg:info --app liff-ot-app-positive
   
4. Check for credential rotation
   (Heroku rotates credentials, may need to restart)
   
5. Restart dyno
   heroku restart --app liff-ot-app-positive
```

### If Frontend Can't Reach Strapi:
```
1. Check CORS settings in server.mjs
   - Is Vercel URL in allowedOrigins?
   
2. Check Strapi URL in frontend
   - Vercel environment variables correct?
   
3. Test API directly
   curl https://liff-ot-app-positive.herokuapp.com/api/drivers
   
4. Check browser console
   - CORS errors?
   - 404 errors?
   - Network timeout?
   
5. Verify Strapi is running
   heroku ps --app liff-ot-app-positive
```

---

## 📞 ESCALATION PATH

### If You're Stuck:
1. **Check this file first** - Answer might be here
2. **Check Heroku logs** - Error messages are helpful
3. **Check documentation** - `/docs/Guides for Use/`
4. **Ask PM** - Don't waste time if blocked
5. **Check Strapi/Heroku docs** - Official documentation
6. **Search GitHub issues** - Someone might have solved it

### Critical Issues (Escalate Immediately):
- ❌ Production data loss
- ❌ Security breach
- ❌ Cannot deploy by Monday
- ❌ Database corrupted
- ❌ All users locked out

### Non-Critical Issues (Can be handled post-launch):
- ⚠️ UI polish
- ⚠️ Performance optimization
- ⚠️ Code refactoring
- ⚠️ Missing tests
- ⚠️ Documentation improvements

---

---

## ⚡ QUICK REFERENCE: Most Important Commands

### **Heroku Account Setup**
```bash
# Install Heroku CLI (macOS)
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Verify login
heroku auth:whoami
```

### **Create New App with Database**
```bash
# Create app
heroku create liff-ot-app-arun

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0 --app liff-ot-app-arun

# Verify database
heroku pg:info --app liff-ot-app-arun
heroku config:get DATABASE_URL --app liff-ot-app-arun
```

### **Set Environment Variables**
```bash
# Generate secrets (run 4 times)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Set on Heroku
heroku config:set ADMIN_JWT_SECRET="secret1" --app liff-ot-app-arun
heroku config:set API_TOKEN_SALT="secret2" --app liff-ot-app-arun
heroku config:set JWT_SECRET="secret3" --app liff-ot-app-arun
heroku config:set APP_KEYS="s4,s5,s6,s7" --app liff-ot-app-arun
heroku config:set NODE_ENV=production --app liff-ot-app-arun
heroku config:set STRAPI_URL=https://liff-ot-app-arun.herokuapp.com --app liff-ot-app-arun

# Copy from .env.local
heroku config:set LINE_CHANNEL_ACCESS_TOKEN="..." --app liff-ot-app-arun
heroku config:set VITE_LIFF_ID="..." --app liff-ot-app-arun
# ... etc
```

### **Deploy**
```bash
# Add git remote
heroku git:remote --app liff-ot-app-arun

# Deploy
git push heroku main

# Monitor logs
heroku logs --tail --app liff-ot-app-arun
```

### **Database Operations**
```bash
# Connect to database
heroku pg:psql --app liff-ot-app-arun

# Inside psql:
\l          # List databases
\dt         # List tables
\d drivers  # Describe drivers table
SELECT * FROM drivers;  # Query
\q          # Quit

# Database info
heroku pg:info --app liff-ot-app-arun

# Backup
heroku pg:backups:capture --app liff-ot-app-arun
```

### **Testing**
```bash
# Test backend
curl https://liff-ot-app-arun.herokuapp.com/health

# Test Strapi
curl https://liff-ot-app-arun.herokuapp.com/api

# Test drivers
curl https://liff-ot-app-arun.herokuapp.com/api/drivers
```

### **Troubleshooting**
```bash
# Check app status
heroku ps --app liff-ot-app-arun

# Check logs
heroku logs --tail --app liff-ot-app-arun

# Check config
heroku config --app liff-ot-app-arun

# Restart app
heroku restart --app liff-ot-app-arun

# Rollback deployment
heroku releases:rollback --app liff-ot-app-arun
```

---

## ✅ FINAL PRE-LAUNCH CHECKLIST

```markdown
# Monday Morning Go-Live Checklist

## System Health
- [ ] Heroku dyno running (heroku ps)
- [ ] Database accessible (heroku pg:info)
- [ ] Strapi admin loads (visit URL)
- [ ] Frontend loads (visit Vercel URL)
- [ ] API responds (curl health check)

## Data Verification
- [ ] Drivers imported (check Strapi admin)
- [ ] Test attendance record created
- [ ] Google Sheets syncing
- [ ] LINE notifications working

## Access & Permissions
- [ ] Admin credentials provided to PM
- [ ] Arun team has Strapi access
- [ ] Google Sheets shared with team
- [ ] LINE bot in correct group

## Documentation
- [ ] Production guide delivered
- [ ] Troubleshooting guide delivered
- [ ] Support process documented
- [ ] Contact information shared

## Testing
- [ ] End-to-end flow tested
- [ ] OT calculation verified
- [ ] Multi-language tested
- [ ] Mobile responsiveness verified

## Monitoring
- [ ] Heroku logs clear (no critical errors)
- [ ] Database usage normal
- [ ] API response times acceptable
- [ ] No user-reported issues

## Communication
- [ ] PM notified of completion
- [ ] Arun team notified
- [ ] Demo scheduled (if needed)
- [ ] Support available
```

---

## 🎬 QUICK START FOR AI AGENTS

**If you're an AI agent starting work on this project, here's what to do:**

1. **Read this entire file** (you're doing it now! ✓)
2. **Check current phase** (see timeline above)
3. **Verify prerequisites** (access granted? database created?)
4. **Follow the phase you're in** (step-by-step tasks)
5. **Test thoroughly** (use testing commands)
6. **Document changes** (update this file if needed)
7. **Communicate progress** (daily updates to PM)

**Need to make a code change?**
- Read the "Critical Files" section first
- Understand current behavior before changing
- Test locally before deploying
- Have rollback plan ready
- Update documentation

**Need to deploy?**
- Follow Phase 4 deployment steps
- Monitor logs during deployment
- Verify with testing commands
- Update this file with any learnings

**Stuck or confused?**
- Re-read relevant section in this file
- Check `/docs/Guides for Use/` folder
- Check Heroku logs for errors
- Ask PM for clarification

---

## 📝 NOTES & LEARNINGS (Update as you go)

### 2025-11-14: Initial Planning
- Created comprehensive migration plan
- Identified critical deadline: Monday
- Documented current architecture and issues
- Prepared testing checklists
- Waiting for Heroku/Vercel access

### [Add Your Notes Here]
- Date: YYYY-MM-DD
- What you did:
- What worked:
- What didn't work:
- Lessons learned:
- Next steps:

---

## 🎯 SUCCESS DEFINITION

**We've succeeded when:**
1. ✅ Arun team can log in to Strapi admin on Monday
2. ✅ Drivers can clock in/out via LINE LIFF app
3. ✅ Attendance data saves to PostgreSQL database
4. ✅ Google Sheets continues to work (backwards compatibility)
5. ✅ LINE notifications send to managers
6. ✅ OT calculates correctly
7. ✅ System is stable and monitored
8. ✅ Documentation is complete and clear
9. ✅ PM is satisfied with handoff
10. ✅ Arun team is trained and ready

---

**END OF AGENTS.MD**

*This file should be updated as the project evolves. Keep it as the single source of truth for AI agents working on this project.*

---

**Last Modified By:** Claude AI Assistant  
**Last Modified Date:** November 14, 2025  
**Version:** 1.0  
**Status:** Ready for Production Migration
