# AGENTS.md - AI Agent Instructions for LIFF OT App

> **Last Updated:** November 16, 2025  
> **Project:** LIFF OT App (Arun Team)  
> **Current Phase:** Feature Enhancement - Role-Based Dev Tools & Approval System

---

## 🎯 CURRENT MISSION: IMPLEMENT DEV ACCESS CONTROL & APPROVAL SYSTEM

### **PRIORITY 1: DevAdmin Role & Hidden Dev Tools**

**Objective:** Create a special `devadmin` authentication that has exclusive access to dev tools and environment toggle, while keeping these features hidden from regular users.

**Business Context:**
- The system currently has dev tools and environment toggle visible to all users
- For production deployment, these should be hidden from regular users
- A special `devadmin` needs privileged access using environment-based credentials
- Single shared credential for simplicity (stored securely in env vars)

**Current Status:**
- ✅ Dev tools implemented in UI (StyledForm.jsx)
- ✅ Environment toggle (dev/prod) implemented
- ❌ **No role-based access control for dev tools**
- ❌ **Dev tools visible to all users**
- ❌ **No devadmin user implementation**

**⚠️ IMPORTANT: This feature is completely separate from the approval system and should be implemented independently.**

---

### **PRIORITY 2: Functional Approval Handler**

**Objective:** Make the approval system fully functional with web UI as primary interface and LINE as notification channel.

**Current Status:**
- ✅ approvalHandler.js file exists in backend
- ❌ **Not integrated with attendance flow**
- ❌ **No approval UI for managers**
- ❌ **No approval status tracking**

**⚠️ IMPORTANT: This feature is completely separate from dev tools and should be implemented independently.**

---

## 📋 DEVELOPMENT ROADMAP

### **Phase 1: DevAdmin Authentication System** (Days 1-2)

**Goal:** Implement environment-based devadmin authentication without database changes

#### Tasks:

1. **Environment Variable Configuration**
   ```bash
   # Add to Heroku config
   DEVADMIN_USERNAME=devadmin
   DEVADMIN_PASSWORD=<secure_password>
   
   # Local .env.local
   VITE_DEVADMIN_USERNAME=devadmin
   VITE_DEVADMIN_PASSWORD=<secure_password>
   ```

2. **Backend: Create DevAdmin Authentication Endpoint**
   - **File:** `backend/server.mjs`
   - **New Endpoint:** `POST /auth/devadmin`
   - **Purpose:** Authenticate devadmin separately from Strapi users
   
   ```javascript
   // Endpoint specification
   POST /auth/devadmin
   Body: {
     username: string,
     password: string
   }
   Response: {
     success: boolean,
     token: string (JWT),
     user: {
       username: "devadmin",
       role: "devadmin"
     }
   }
   ```

3. **Backend: JWT Token Generation for DevAdmin**
   - Use existing JWT secret
   - Token payload includes: `{ username, role: 'devadmin' }`
   - Token expiry: 24 hours
   - Return JWT in response and set httpOnly cookie

4. **Frontend: DevAdmin Login Component**
   - **File:** `src/components/DevAdminLogin.jsx` (NEW)
   - Simple login form (username + password)
   - Store JWT in localStorage + cookie
   - Redirect to main app after successful login
   - Show error message on failed authentication

5. **Frontend: Auth Context Enhancement**
   - **File:** Update existing auth context or create new
   - Track two auth states:
     - Regular user (Strapi)
     - DevAdmin user (environment-based)
   - Provide `isDevAdmin` boolean flag
   - Provide logout for both user types

---

### **Phase 2: Conditional Dev Tools Rendering** (Days 2-3)

**Goal:** Hide dev tools and environment toggle from non-devadmin users

#### Tasks:

1. **Create useDevAdmin Hook**
   - **File:** `src/hooks/useDevAdmin.js` (NEW)
   - Check JWT token for devadmin role
   - Validate token on mount
   - Return `{ isDevAdmin: boolean, loading: boolean }`

2. **Update StyledForm.jsx**
   - **File:** `src/components/StyledForm.jsx`
   - Import `useDevAdmin` hook
   - Wrap dev tools section with conditional rendering:
   
   ```jsx
   const { isDevAdmin } = useDevAdmin();
   
   // Only render if devadmin
   {isDevAdmin && (
     <div className="dev-tools">
       {/* Development Tools Section */}
     </div>
   )}
   ```

3. **Update Environment Toggle**
   - **Location:** Header/Navbar component
   - Conditional rendering based on `isDevAdmin`
   - Hide toggle button completely for regular users
   - Default to `prod` environment for non-devadmin

4. **Environment Safety Guard**
   - **File:** `src/utils/envGuard.js` (NEW)
   - Prevent non-devadmin from accessing dev environment
   - Force `env=prod` in all API calls for regular users
   - Only allow `env=dev` if `isDevAdmin === true`

5. **Update All Dev Tool References**
   - Manual testing form
   - OT calculation testing
   - Day of Week column updater
   - Sheet selector
   - Environment preview
   - All wrapped with `isDevAdmin` check

---

### **Phase 3: Approval Handler Integration** (Days 3-4)

**Goal:** Make approvalHandler.js functional and integrated with the system

#### Tasks:

1. **Analyze approvalHandler.js**
   - **File:** `backend/utils/approvalHandler.js`
   - Document current implementation
   - Identify missing pieces
   - Determine integration points

2. **LINE Webhook Enhancement**
   - **File:** `backend/server.mjs` (webhook endpoint)
   - Integrate approvalHandler logic
   - Parse LINE messages for approval commands
   - Expected commands:
     - `approve [driver_name] [date]`
     - `reject [driver_name] [date]`
     - `approve all`

3. **Approval Logic Implementation**
   - Update Google Sheets with approval status
   - Add "Approval Status" column if not exists
   - Possible values: "Pending", "Approved", "Rejected"
   - Update Strapi attendance record (if exists)

4. **Notification Flow**
   - When attendance submitted → status = "Pending"
   - Send notification to manager LINE group
   - Manager responds with command
   - Update status in Google Sheets
   - Send confirmation to manager
   - Optionally notify driver

5. **Backend API for Approval Status**
   - **New Endpoint:** `GET /api/attendances/:id/approval-status`
   - **New Endpoint:** `POST /api/attendances/:id/approve`
   - **New Endpoint:** `POST /api/attendances/:id/reject`
   - Allow programmatic approval (for future UI)

---

### **Phase 4: UI Enhancements for Approval** (Days 4-5)

**Goal:** Show approval status in UI and provide visual feedback

#### Tasks:

1. **StyledForm.jsx Enhancement**
   - Show approval status after submission
   - Display badge: "Pending Approval", "Approved", "Rejected"
   - Color coding: Yellow (pending), Green (approved), Red (rejected)

2. **ManagerView.jsx Enhancement**
   - Add approval status column to driver table
   - Add filter: Show all / Pending / Approved / Rejected
   - Add bulk approval actions (devadmin only)

3. **Approval History**
   - **New Component:** `src/components/ApprovalHistory.jsx`
   - Show approval timeline for each attendance record
   - Who approved/rejected and when
   - Comments from manager (if any)

4. **Real-time Status Updates (Optional)**
   - Poll approval status every 30 seconds after submission
   - Show notification when status changes
   - Use Lottie animation for status changes

---

### **Phase 5: Testing & Security Hardening** (Days 5-6)

**Goal:** Ensure security, test all scenarios, and prepare for production

#### Tasks:

1. **Security Checklist**
   - ✅ DevAdmin credentials in environment variables (not in code)
   - ✅ JWT tokens properly validated
   - ✅ No client-side exposure of credentials
   - ✅ Dev tools inaccessible without devadmin role
   - ✅ Environment variable validation on backend
   - ✅ Rate limiting on auth endpoints
   - ✅ HTTPS only for production

2. **Testing Scenarios**
   
   **DevAdmin Authentication:**
   - ✅ Successful login with correct credentials
   - ✅ Failed login with wrong credentials
   - ✅ Token expiry and refresh
   - ✅ Logout functionality
   - ✅ Multiple concurrent devadmin sessions
   
   **Dev Tools Access:**
   - ✅ DevAdmin can see all dev tools
   - ✅ Regular users cannot see dev tools
   - ✅ DevAdmin can toggle environment
   - ✅ Regular users locked to prod environment
   - ✅ Direct URL access to dev features blocked for regular users
   
   **Approval Handler:**
   - ✅ Approval command from LINE updates status
   - ✅ Rejection command from LINE updates status
   - ✅ Invalid commands ignored
   - ✅ Duplicate approval prevented
   - ✅ Status reflected in Google Sheets
   - ✅ Status reflected in Strapi
   - ✅ Notifications sent correctly
   
   **Integration:**
   - ✅ End-to-end: Submit → Pending → Approve → Approved
   - ✅ End-to-end: Submit → Pending → Reject → Rejected
   - ✅ UI updates reflect approval status
   - ✅ Both dev and prod environments work

3. **Error Handling**
   - Authentication failures
   - Network errors
   - Google Sheets API failures
   - LINE API failures
   - Invalid approval commands
   - Race conditions (concurrent approvals)

4. **Performance Testing**
   - Auth endpoint response time
   - Token validation overhead
   - Approval processing time
   - UI rendering with approval status

---

## 🏗️ ARCHITECTURE CHANGES

### **Before: Current Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│              LINE LIFF Frontend (React)                      │
│         Deployed on Heroku (separate from backend)           │
│                                                              │
│  - Dev tools visible to ALL users ⚠️                        │
│  - Environment toggle visible to ALL ⚠️                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Express Backend + Strapi (Node.js)                   │
│                                                              │
│  - Strapi authentication only                               │
│  - No role-based access control ⚠️                          │
│  - approvalHandler.js exists but not integrated ⚠️          │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
   Google         LINE           Strapi DB
   Sheets       Messaging        (PostgreSQL)
```

### **After: Enhanced Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│              LINE LIFF Frontend (React)                      │
│         Deployed on Heroku (separate from backend)           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Authentication Layer (Enhanced)                        │ │
│  │  - Regular user (Strapi) ✅                            │ │
│  │  - DevAdmin user (ENV-based) ✅ NEW                    │ │
│  │  - useDevAdmin hook ✅ NEW                             │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Conditional Rendering (Role-Based)                     │ │
│  │                                                         │ │
│  │  IF isDevAdmin:                                        │ │
│  │    ✅ Show dev tools                                   │ │
│  │    ✅ Show environment toggle                          │ │
│  │    ✅ Allow dev environment access                     │ │
│  │                                                         │ │
│  │  ELSE (Regular User):                                  │ │
│  │    ❌ Hide dev tools                                   │ │
│  │    ❌ Hide environment toggle                          │ │
│  │    🔒 Lock to prod environment                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Approval Status Display ✅ NEW                         │ │
│  │  - Pending / Approved / Rejected badges                │ │
│  │  - Real-time status updates                            │ │
│  │  - Approval history timeline                           │ │
│  └────────────────────────────────────────────────────────┘ │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTP/REST
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         Express Backend + Strapi (Node.js)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ NEW Authentication Endpoints                           │ │
│  │  POST /auth/devadmin ✅                                │ │
│  │  GET /auth/verify-devadmin ✅                          │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Environment Variables (Heroku)                         │ │
│  │  DEVADMIN_USERNAME ✅                                  │ │
│  │  DEVADMIN_PASSWORD (hashed) ✅                         │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Approval Handler Integration ✅ NEW                    │ │
│  │                                                         │ │
│  │  /webhook (LINE) → approvalHandler.js                 │ │
│  │    - Parse approval commands                           │ │
│  │    - Update Google Sheets status                       │ │
│  │    - Update Strapi attendance                          │ │
│  │    - Send confirmation notification                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
       ▼              ▼              ▼
   Google         LINE           Strapi DB
   Sheets       Messaging        (PostgreSQL)
   │              │
   │              │ Approval Commands
   │              │ (approve/reject)
   │              ▼
   │         ┌─────────────┐
   │         │ Manager     │
   │         │ LINE Group  │
   │         └─────────────┘
   │
   │ Status Column: "Pending" → "Approved" / "Rejected"
   ▼
┌─────────────────────────┐
│ Google Sheets           │
│                         │
│ New Columns:            │
│  - Approval Status      │
│  - Approved By          │
│  - Approved At          │
└─────────────────────────┘
```

---

## 📂 NEW FILE STRUCTURE

```
liff-ot-app-arun/
├── backend/
│   ├── server.mjs                          # MODIFY: Add devadmin auth endpoints
│   ├── utils/
│   │   ├── approvalHandler.js              # MODIFY: Enhance and integrate
│   │   ├── devAdminAuth.js                 # NEW: DevAdmin authentication logic
│   │   └── jwtUtils.js                     # NEW: JWT token helpers
│   └── middleware/
│       └── devAdminMiddleware.js           # NEW: DevAdmin verification middleware
│
├── src/
│   ├── components/
│   │   ├── StyledForm.jsx                  # MODIFY: Conditional dev tools
│   │   ├── ManagerView.jsx                 # MODIFY: Add approval status
│   │   ├── DevAdminLogin.jsx               # NEW: DevAdmin login form
│   │   ├── ApprovalHistory.jsx             # NEW: Approval timeline
│   │   └── ApprovalStatusBadge.jsx         # NEW: Status badge component
│   │
│   ├── hooks/
│   │   ├── useDevAdmin.js                  # NEW: DevAdmin state hook
│   │   └── useApprovalStatus.js            # NEW: Approval status polling
│   │
│   ├── contexts/
│   │   └── DevAdminContext.jsx             # NEW: DevAdmin context provider
│   │
│   ├── utils/
│   │   ├── envGuard.js                     # NEW: Environment access guard
│   │   └── approvalUtils.js                # NEW: Approval helper functions
│   │
│   └── constants/
│       └── approvalConstants.js            # NEW: Approval status constants
│
└── .env.local                              # MODIFY: Add VITE_DEVADMIN_* variables
```

---

## 🔐 SECURITY IMPLEMENTATION DETAILS

### **DevAdmin Credential Storage**

#### **Heroku Environment Variables:**
```bash
# Never store plain text passwords!
# Use hashed password with bcrypt

DEVADMIN_USERNAME=devadmin
DEVADMIN_PASSWORD_HASH=$2b$10$... (bcrypt hash)
JWT_SECRET=<strong_random_secret>
JWT_EXPIRY=24h
```

#### **Frontend Environment Variables (Vercel):**
```bash
# Frontend does NOT store password
# Only backend validates credentials

VITE_API_URL=https://liff-ot-app-arun.herokuapp.com
VITE_DEVADMIN_ENABLED=true
```

### **Authentication Flow**

```
1. User enters devadmin credentials
   ↓
2. Frontend sends POST /auth/devadmin
   {
     username: "devadmin",
     password: "plain_text_password"
   }
   ↓
3. Backend validates:
   - Compare username with process.env.DEVADMIN_USERNAME
   - Compare password hash with process.env.DEVADMIN_PASSWORD_HASH
   ↓
4. If valid:
   - Generate JWT with payload: { username, role: 'devadmin' }
   - Set httpOnly cookie
   - Return JWT to frontend
   ↓
5. Frontend stores JWT in:
   - localStorage (for persistence)
   - Cookie (for httpOnly security)
   ↓
6. All subsequent requests include JWT in:
   - Authorization header: Bearer <token>
   - Cookie (automatic)
   ↓
7. Backend middleware verifies:
   - JWT signature valid
   - JWT not expired
   - JWT payload contains role: 'devadmin'
   ↓
8. Grant/deny access to dev tools
```

### **Token Security**

```javascript
// backend/utils/jwtUtils.js

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = process.env.JWT_EXPIRY || '24h';

export function generateDevAdminToken(username) {
  return jwt.sign(
    {
      username,
      role: 'devadmin',
      iat: Math.floor(Date.now() / 1000)
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
}

export function verifyDevAdminToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.role === 'devadmin' ? decoded : null;
  } catch (error) {
    return null;
  }
}

export async function validateDevAdminCredentials(username, password) {
  const envUsername = process.env.DEVADMIN_USERNAME;
  const envPasswordHash = process.env.DEVADMIN_PASSWORD_HASH;
  
  if (username !== envUsername) {
    return false;
  }
  
  return await bcrypt.compare(password, envPasswordHash);
}
```

---

## 📋 IMPLEMENTATION CHECKLIST

### **Phase 1: DevAdmin Authentication** ✅ **COMPLETED - Nov 18, 2025**

#### Backend Tasks:
- [x] Install dependencies: `bcrypt`, `jsonwebtoken` (bcrypt already installed, added jsonwebtoken)
- [x] Create `utils/devAdminAuth.js` (credential validation with bcrypt)
- [x] Create `utils/jwtUtils.js` (JWT token handling with httpOnly cookies)
- [x] ~~Create `backend/middleware/devAdminMiddleware.js`~~ (Not needed - verification integrated into endpoints)
- [x] Add endpoint `POST /auth/devadmin` in `server.mjs`
- [x] Add endpoint `GET /auth/verify-devadmin` in `server.mjs`
- [x] Add endpoint `POST /auth/logout-devadmin` in `server.mjs`
- [x] Generate bcrypt hash for devadmin password
- [x] Set Heroku environment variables:
  - [x] `DEVADMIN_USERNAME`
  - [x] `DEVADMIN_PASSWORD_HASH`
  - [x] `JWT_SECRET`
  - [x] `JWT_EXPIRY`
- [x] Test authentication endpoints with CURL (All tests passed on production)
- [x] Deploy to Heroku (v75)
- [x] Document implementation (DEVADMIN_IMPLEMENTATION.md)

#### Frontend Tasks: ✅ **COMPLETED - Nov 18, 2025**
- [x] Create `src/components/DevAdminLogin.jsx` (250 lines - Tailwind styled)
- [x] Create `src/contexts/DevAdminContext.jsx` (68 lines - Global state)
- [x] Create `src/hooks/useDevAdmin.js` (172 lines - Auth hook)
- [x] Add devadmin login route in router (App.jsx - `/devadmin-login`)
- [x] Style login form (Tailwind - gradient, responsive, accessible)
- [x] Implement error handling for failed auth (error messages, loading states)
- [x] Add logout functionality (clearDevAdminCookie, logout endpoint)
- [x] Test login flow in browser (local testing completed)

### **Phase 2: Conditional Dev Tools** ✅ **COMPLETED - Nov 18, 2025**

#### Frontend Tasks:
- [x] Update `src/components/StyledForm.jsx`:
  - [x] Import `useDevAdmin` hook
  - [x] Wrap dev tools section with `{isDevAdmin && ...}`
  - [x] Test dev tools visibility
- [x] Update environment toggle component:
  - [x] Import `useDevAdmin` hook
  - [x] Conditionally render toggle button (top-right)
  - [x] Test toggle visibility (only DevAdmin sees it)
- [x] Create `src/utils/envGuard.js` (98 lines):
  - [x] Export `getEnvironment()` function
  - [x] Force `prod` for non-devadmin
  - [x] Allow `dev` for devadmin only
  - [x] Added `getSafeEnvironment()` with logging
- [x] Update all API calls:
  - [x] Imported `getSafeEnvironment()` from envGuard
  - [x] Test environment locking (verified)
- [x] Hide manual testing forms:
  - [x] OT calculation test
  - [x] Day of Week updater
  - [x] Sheet selector
  - [x] Month/Year selector
  - [x] Create sheet buttons
  - [x] All other dev-only features (7+ sections)
- [x] Test with regular user account (no dev tools visible - ✅ verified)
- [x] Test with devadmin account (all dev tools visible - ✅ verified)
- [x] Document Phase 2 implementation (DEVADMIN_IMPLEMENTATION.md updated)
- [x] Commit all changes (Git commit: 22f8750, 1ba13a8)

### **Phase 3: Approval Handler Integration**

#### Backend Tasks:
- [ ] Review `backend/utils/approvalHandler.js`:
  - [ ] Document existing code
  - [ ] Identify integration points
  - [ ] List required changes
- [ ] Enhance `approvalHandler.js`:
  - [ ] Add `parseApprovalCommand()` function
  - [ ] Add `updateApprovalStatus()` function
  - [ ] Add Google Sheets status update logic
  - [ ] Add Strapi attendance update logic
  - [ ] Add notification sending logic
- [ ] Update webhook endpoint in `server.mjs`:
  - [ ] Import `approvalHandler`
  - [ ] Call handler on LINE message receive
  - [ ] Handle approval commands
  - [ ] Handle rejection commands
  - [ ] Send confirmation to manager
- [ ] Add new API endpoints:
  - [ ] `GET /api/attendances/:id/approval-status`
  - [ ] `POST /api/attendances/:id/approve`
  - [ ] `POST /api/attendances/:id/reject`
- [ ] Update Google Sheets structure:
  - [ ] Add "Approval Status" column
  - [ ] Add "Approved By" column
  - [ ] Add "Approved At" column
- [ ] Test approval flow with CURL:
  - [ ] Submit attendance → status = "Pending"
  - [ ] Send approve command → status = "Approved"
  - [ ] Send reject command → status = "Rejected"

#### Frontend Tasks:
- [ ] Create `src/constants/approvalConstants.js`:
  - [ ] Define status constants
  - [ ] Define status colors
  - [ ] Define status labels
- [ ] Create `src/components/ApprovalStatusBadge.jsx`:
  - [ ] Show colored badge based on status
  - [ ] Support all status types
  - [ ] Add tooltips
- [ ] Update `src/components/StyledForm.jsx`:
  - [ ] Show approval status after submission
  - [ ] Display status badge
  - [ ] Add loading state for status check
- [ ] Create `src/hooks/useApprovalStatus.js`:
  - [ ] Poll approval status every 30 seconds
  - [ ] Return current status
  - [ ] Handle errors
- [ ] Test approval status display in UI

### **Phase 4: Manager View Enhancements**

#### Frontend Tasks:
- [ ] Update `src/components/ManagerView.jsx`:
  - [ ] Add "Approval Status" column to table
  - [ ] Add filter dropdown (All/Pending/Approved/Rejected)
  - [ ] Implement filter logic
  - [ ] Add bulk approve/reject buttons (devadmin only)
  - [ ] Style approval status badges
- [ ] Create `src/components/ApprovalHistory.jsx`:
  - [ ] Fetch approval history from API
  - [ ] Display timeline of status changes
  - [ ] Show who approved/rejected
  - [ ] Show timestamps
  - [ ] Style with Tailwind
- [ ] Test manager view:
  - [ ] Filter works correctly
  - [ ] Status displayed accurately
  - [ ] Bulk actions work (devadmin only)

### **Phase 5: Testing & Deployment**

#### Testing Tasks:
- [ ] **Unit Tests** (if implementing):
  - [ ] `devAdminAuth.js` functions
  - [ ] `jwtUtils.js` functions
  - [ ] `approvalHandler.js` functions
  - [ ] Frontend utility functions
- [ ] **Integration Tests**:
  - [ ] DevAdmin login flow
  - [ ] Token validation
  - [ ] Approval command processing
  - [ ] Google Sheets updates
  - [ ] Strapi updates
- [ ] **E2E Tests**:
  - [ ] Regular user cannot access dev tools
  - [ ] DevAdmin can access dev tools
  - [ ] Approval flow works end-to-end
  - [ ] Status updates reflect in UI
- [ ] **Security Tests**:
  - [ ] Invalid credentials rejected
  - [ ] Expired tokens rejected
  - [ ] Direct API access blocked without token
  - [ ] XSS/CSRF protection
- [ ] **Performance Tests**:
  - [ ] Auth endpoint response time
  - [ ] Approval processing time
  - [ ] UI rendering performance

#### Deployment Tasks:
- [ ] **Heroku (Backend)**:
  - [ ] Set environment variables
  - [ ] Deploy updated backend
  - [ ] Monitor logs for errors
  - [ ] Test all endpoints
- [ ] **Vercel (Frontend)**:
  - [ ] Set environment variables
  - [ ] Deploy updated frontend
  - [ ] Test in production
  - [ ] Verify dev tools hidden for regular users
- [ ] **Documentation**:
  - [ ] Update AGENTS.md with findings
  - [ ] Document devadmin credentials location
  - [ ] Document approval command syntax
  - [ ] Create troubleshooting guide
  - [ ] Update user guides

---

## 🔧 CODE EXAMPLES

### **Backend: DevAdmin Authentication Endpoint**

```javascript
// backend/server.mjs

import { validateDevAdminCredentials, generateDevAdminToken } from './utils/devAdminAuth.js';

// DevAdmin Authentication
app.post('/auth/devadmin', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password required'
      });
    }
    
    const isValid = await validateDevAdminCredentials(username, password);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    const token = generateDevAdminToken(username);
    
    // Set httpOnly cookie for security
    res.cookie('devadmin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'strict'
    });
    
    res.json({
      success: true,
      token,
      user: {
        username,
        role: 'devadmin'
      }
    });
  } catch (error) {
    console.error('DevAdmin auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
});

// Verify DevAdmin Token
app.get('/auth/verify-devadmin', (req, res) => {
  try {
    const token = req.cookies.devadmin_token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const decoded = verifyDevAdminToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
    
    res.json({
      success: true,
      user: {
        username: decoded.username,
        role: decoded.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
});
```

### **Frontend: useDevAdmin Hook**

```javascript
// src/hooks/useDevAdmin.js

import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useDevAdmin() {
  const [isDevAdmin, setIsDevAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    verifyDevAdmin();
  }, []);
  
  async function verifyDevAdmin() {
    try {
      const token = localStorage.getItem('devadmin_token');
      
      if (!token) {
        setIsDevAdmin(false);
        setLoading(false);
        return;
      }
      
      const response = await fetch(`${API_URL}/auth/verify-devadmin`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsDevAdmin(data.success);
        setUser(data.user);
      } else {
        setIsDevAdmin(false);
        localStorage.removeItem('devadmin_token');
      }
    } catch (error) {
      console.error('DevAdmin verification failed:', error);
      setIsDevAdmin(false);
    } finally {
      setLoading(false);
    }
  }
  
  async function login(username, password) {
    try {
      const response = await fetch(`${API_URL}/auth/devadmin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('devadmin_token', data.token);
        setIsDevAdmin(true);
        setUser(data.user);
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('DevAdmin login failed:', error);
      return { success: false, message: 'Login failed' };
    }
  }
  
  function logout() {
    localStorage.removeItem('devadmin_token');
    setIsDevAdmin(false);
    setUser(null);
  }
  
  return {
    isDevAdmin,
    loading,
    user,
    login,
    logout,
    verifyDevAdmin
  };
}
```

### **Frontend: Environment Guard**

```javascript
// src/utils/envGuard.js

import { useDevAdmin } from '../hooks/useDevAdmin';

export function getEnvironment(requestedEnv, isDevAdmin) {
  // If not devadmin, always return 'prod'
  if (!isDevAdmin) {
    return 'prod';
  }
  
  // DevAdmin can choose any environment
  return requestedEnv || 'prod';
}

export function canAccessDevEnvironment(isDevAdmin) {
  return isDevAdmin === true;
}

export function validateEnvironmentAccess(env, isDevAdmin) {
  if (env === 'dev' && !isDevAdmin) {
    console.warn('Non-devadmin attempting to access dev environment. Access denied.');
    return false;
  }
  return true;
}
```

### **Frontend: Conditional Dev Tools in StyledForm**

```jsx
// src/components/StyledForm.jsx (excerpt)

import { useDevAdmin } from '../hooks/useDevAdmin';
import { getEnvironment } from '../utils/envGuard';

export default function StyledForm() {
  const { isDevAdmin, loading } = useDevAdmin();
  const [selectedEnv, setSelectedEnv] = useState('prod');
  
  // Get actual environment (forced to prod for non-devadmin)
  const actualEnv = getEnvironment(selectedEnv, isDevAdmin);
  
  // ... rest of component logic
  
  return (
    <div className="styled-form">
      {/* Main form content */}
      {/* ... */}
      
      {/* Dev Tools Section - Only visible to devadmin */}
      {isDevAdmin && (
        <div className="dev-tools-section border-t-2 border-purple-500 mt-8 pt-6">
          <h3 className="text-xl font-bold mb-4 text-purple-600">
            🛠️ Developer Tools
          </h3>
          
          {/* Environment Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Environment
            </label>
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="dev">Development</option>
              <option value="prod">Production</option>
            </select>
          </div>
          
          {/* OT Calculator Test */}
          <div className="mb-4">
            <button
              onClick={testOTCalculation}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded"
            >
              Test OT Calculation
            </button>
          </div>
          
          {/* Manual Testing Form */}
          {/* ... */}
          
          {/* Day of Week Updater */}
          {/* ... */}
          
        </div>
      )}
    </div>
  );
}
```

### **Backend: Approval Handler Integration**

```javascript
// backend/utils/approvalHandler.js (enhanced)

import { google } from 'googleapis';
import { sendLineNotification } from './lineUtils.js';
import { updateAttendanceApprovalStatus } from './strapiUtils.js';

const APPROVAL_STATUSES = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected'
};

/**
 * Parse approval command from LINE message
 * @param {string} message - LINE message text
 * @returns {object|null} - Parsed command or null
 */
export function parseApprovalCommand(message) {
  const text = message.trim().toLowerCase();
  
  // Pattern: approve <driver_name> <date>
  const approveMatch = text.match(/^approve\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})$/);
  if (approveMatch) {
    return {
      action: 'approve',
      driverName: approveMatch[1].trim(),
      date: approveMatch[2]
    };
  }
  
  // Pattern: reject <driver_name> <date>
  const rejectMatch = text.match(/^reject\s+(.+?)\s+(\d{2}\/\d{2}\/\d{4})$/);
  if (rejectMatch) {
    return {
      action: 'reject',
      driverName: rejectMatch[1].trim(),
      date: rejectMatch[2]
    };
  }
  
  // Pattern: approve all
  if (text === 'approve all') {
    return {
      action: 'approve_all'
    };
  }
  
  return null;
}

/**
 * Update approval status in Google Sheets
 * @param {object} params - Parameters
 * @param {string} params.driverName - Driver name
 * @param {string} params.date - Date in Thai format
 * @param {string} params.status - Approval status
 * @param {string} params.approvedBy - Manager name
 * @param {string} params.env - Environment (dev/prod)
 * @returns {Promise<boolean>} - Success status
 */
export async function updateApprovalStatusInSheets({
  driverName,
  date,
  status,
  approvedBy,
  env = 'prod'
}) {
  try {
    // Get Google Sheets instance
    const sheets = await getGoogleSheetsInstance();
    const spreadsheetId = env === 'dev' 
      ? process.env.SPREADSHEET_ID_DEV 
      : process.env.SPREADSHEET_ID_PROD;
    
    // Find the row for this driver and date
    const sheetName = getSheetNameFromDate(date);
    const range = `${sheetName}!A:Z`;
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    });
    
    const rows = response.data.values || [];
    const headers = rows[0];
    
    // Find column indexes
    const nameColIndex = headers.indexOf('Name');
    const dateColIndex = headers.indexOf('Date');
    const statusColIndex = headers.indexOf('Approval Status');
    const approvedByColIndex = headers.indexOf('Approved By');
    const approvedAtColIndex = headers.indexOf('Approved At');
    
    // Find the row
    let targetRowIndex = -1;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][nameColIndex] === driverName && rows[i][dateColIndex] === date) {
        targetRowIndex = i;
        break;
      }
    }
    
    if (targetRowIndex === -1) {
      console.error('Row not found for approval update');
      return false;
    }
    
    // Update the row
    const updates = [
      {
        range: `${sheetName}!${getColumnLetter(statusColIndex)}${targetRowIndex + 1}`,
        values: [[status]]
      },
      {
        range: `${sheetName}!${getColumnLetter(approvedByColIndex)}${targetRowIndex + 1}`,
        values: [[approvedBy]]
      },
      {
        range: `${sheetName}!${getColumnLetter(approvedAtColIndex)}${targetRowIndex + 1}`,
        values: [[new Date().toISOString()]]
      }
    ];
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: {
        data: updates,
        valueInputOption: 'USER_ENTERED'
      }
    });
    
    console.log(`✅ Updated approval status for ${driverName} on ${date} to ${status}`);
    return true;
  } catch (error) {
    console.error('Error updating approval status in sheets:', error);
    return false;
  }
}

/**
 * Process approval command
 * @param {object} command - Parsed command
 * @param {string} managerName - Manager who sent command
 * @param {string} env - Environment
 * @returns {Promise<object>} - Result
 */
export async function processApprovalCommand(command, managerName, env = 'prod') {
  try {
    const { action, driverName, date } = command;
    
    if (action === 'approve_all') {
      // Handle bulk approval
      return await approveAllPending(managerName, env);
    }
    
    const status = action === 'approve' 
      ? APPROVAL_STATUSES.APPROVED 
      : APPROVAL_STATUSES.REJECTED;
    
    // Update Google Sheets
    const sheetsSuccess = await updateApprovalStatusInSheets({
      driverName,
      date,
      status,
      approvedBy: managerName,
      env
    });
    
    // Update Strapi (if exists)
    const strapiSuccess = await updateAttendanceApprovalStatus({
      driverName,
      date,
      status,
      approvedBy: managerName
    });
    
    // Send confirmation notification
    const confirmationMessage = `✅ ${driverName}'s attendance on ${date} has been ${status.toLowerCase()} by ${managerName}`;
    await sendLineNotification(confirmationMessage, env);
    
    return {
      success: sheetsSuccess,
      message: confirmationMessage
    };
  } catch (error) {
    console.error('Error processing approval command:', error);
    return {
      success: false,
      message: 'Failed to process approval command'
    };
  }
}

// Helper functions
function getSheetNameFromDate(thaiDate) {
  // Convert Thai date to sheet name
  // Example: "25/11/2568" → "Nov 2568"
  const [day, month, year] = thaiDate.split('/');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function getColumnLetter(index) {
  let letter = '';
  while (index >= 0) {
    letter = String.fromCharCode((index % 26) + 65) + letter;
    index = Math.floor(index / 26) - 1;
  }
  return letter;
}
```

### **Backend: Webhook Integration**

```javascript
// backend/server.mjs (webhook endpoint)

import { parseApprovalCommand, processApprovalCommand } from './utils/approvalHandler.js';

app.post('/webhook', async (req, res) => {
  try {
    const events = req.body.events || [];
    
    for (const event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        const messageText = event.message.text;
        const userId = event.source.userId;
        
        // Get user profile (manager name)
        const profile = await getLineUserProfile(userId);
        const managerName = profile.displayName;
        
        // Parse approval command
        const command = parseApprovalCommand(messageText);
        
        if (command) {
          // This is an approval command
          console.log('📋 Approval command received:', command);
          
          // Determine environment from LINE group
          const env = determineEnvironmentFromGroup(event.source.groupId);
          
          // Process the command
          const result = await processApprovalCommand(command, managerName, env);
          
          if (result.success) {
            // Send confirmation
            await replyToLine(event.replyToken, result.message);
          } else {
            await replyToLine(event.replyToken, '❌ Failed to process approval. Please try again.');
          }
        }
        // If not an approval command, ignore or handle other commands
      }
    }
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Error');
  }
});

function determineEnvironmentFromGroup(groupId) {
  const devGroupId = process.env.LINE_GROUP_ID_DEV;
  const prodGroupId = process.env.LINE_GROUP_ID_PROD;
  
  if (groupId === devGroupId) return 'dev';
  if (groupId === prodGroupId) return 'prod';
  return 'prod'; // Default to prod
}
```

---

## 🧪 TESTING GUIDE

### **DevAdmin Authentication Testing**

```bash
# Test 1: Successful DevAdmin Login
curl -X POST http://localhost:3001/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "devadmin",
    "password": "correct_password"
  }'

# Expected Response:
# {
#   "success": true,
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": {
#     "username": "devadmin",
#     "role": "devadmin"
#   }
# }

# Test 2: Failed DevAdmin Login (wrong password)
curl -X POST http://localhost:3001/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{
    "username": "devadmin",
    "password": "wrong_password"
  }'

# Expected Response:
# {
#   "success": false,
#   "message": "Invalid credentials"
# }

# Test 3: Verify DevAdmin Token
TOKEN="<token_from_login>"
curl -X GET http://localhost:3001/auth/verify-devadmin \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
# {
#   "success": true,
#   "user": {
#     "username": "devadmin",
#     "role": "devadmin"
#   }
# }

# Test 4: Access Protected Endpoint (without token)
curl -X GET http://localhost:3001/api/dev-only-endpoint

# Expected Response:
# {
#   "success": false,
#   "message": "Unauthorized"
# }

# Test 5: Access Protected Endpoint (with token)
curl -X GET http://localhost:3001/api/dev-only-endpoint \
  -H "Authorization: Bearer $TOKEN"

# Expected Response:
# {
#   "success": true,
#   "data": {...}
# }
```

### **Approval Handler Testing**

```bash
# Test 1: Submit Attendance (should set status to "Pending")
curl -X POST http://localhost:3001/submit \
  -H "Content-Type: application/json" \
  -d '{
    "driverName": "Jean",
    "thaiDate": "16/11/2568",
    "clockIn": "08:00",
    "clockOut": "18:00",
    "comments": "Test approval",
    "env": "dev"
  }'

# Check Google Sheets - status should be "Pending"

# Test 2: Simulate Approval Command from LINE
# (In real scenario, this comes via webhook)
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "message",
      "message": {
        "type": "text",
        "text": "approve Jean 16/11/2568"
      },
      "source": {
        "userId": "U1234567890",
        "groupId": "G1234567890"
      },
      "replyToken": "test_reply_token"
    }]
  }'

# Check Google Sheets - status should be "Approved"

# Test 3: Get Approval Status
curl -X GET http://localhost:3001/api/attendances/1/approval-status

# Expected Response:
# {
#   "success": true,
#   "status": "Approved",
#   "approvedBy": "Manager Name",
#   "approvedAt": "2025-11-16T10:30:00Z"
# }
```

### **Environment Guard Testing**

```javascript
// Test in browser console (logged in as regular user)

// Test 1: Check isDevAdmin
console.log('isDevAdmin:', localStorage.getItem('devadmin_token') !== null);
// Should be: false

// Test 2: Try to access dev environment
const env = getEnvironment('dev', false);
console.log('Environment:', env);
// Should be: 'prod'

// Test 3: Check if dev tools are visible
const devTools = document.querySelector('.dev-tools-section');
console.log('Dev tools visible:', devTools !== null);
// Should be: false

// Now login as devadmin and repeat

// Test 4: Check isDevAdmin (after login)
console.log('isDevAdmin:', localStorage.getItem('devadmin_token') !== null);
// Should be: true

// Test 5: Try to access dev environment (after login)
const envAdmin = getEnvironment('dev', true);
console.log('Environment:', envAdmin);
// Should be: 'dev'

// Test 6: Check if dev tools are visible (after login)
const devToolsAdmin = document.querySelector('.dev-tools-section');
console.log('Dev tools visible:', devToolsAdmin !== null);
// Should be: true
```

---

## 📊 SUCCESS METRICS

### **We've succeeded when:**

#### DevAdmin Access Control:
1. ✅ DevAdmin can login with environment credentials
2. ✅ DevAdmin sees all dev tools and environment toggle
3. ✅ DevAdmin can switch between dev and prod environments
4. ✅ Regular users cannot see dev tools or environment toggle
5. ✅ Regular users locked to prod environment only
6. ✅ Direct URL access to dev features blocked for regular users
7. ✅ Tokens expire and refresh correctly
8. ✅ Security: No credentials in frontend code
9. ✅ Security: Passwords hashed with bcrypt
10. ✅ Security: JWT tokens properly validated

#### Approval Handler:
1. ✅ Attendance submitted → status set to "Pending"
2. ✅ Manager sends "approve" command → status updates to "Approved"
3. ✅ Manager sends "reject" command → status updates to "Rejected"
4. ✅ Approval status visible in Google Sheets
5. ✅ Approval status visible in Strapi (if record exists)
6. ✅ Approval status visible in frontend UI
7. ✅ Confirmation notification sent to manager after approval
8. ✅ Invalid commands ignored gracefully
9. ✅ Duplicate approvals prevented
10. ✅ Approval history tracked (who, when, status)

#### Integration & User Experience:
1. ✅ End-to-end flow: Submit → Pending → Approve → Approved works
2. ✅ End-to-end flow: Submit → Pending → Reject → Rejected works
3. ✅ UI shows real-time approval status updates
4. ✅ Manager view includes approval status filter
5. ✅ DevAdmin can perform bulk approvals
6. ✅ System works in both dev and prod environments
7. ✅ No performance degradation
8. ✅ All existing features still work
9. ✅ Documentation updated and complete
10. ✅ Team trained on new features

---

## 🚨 KNOWN RISKS & MITIGATION

### **Risk 1: Environment Variable Security**
- **Risk:** DevAdmin credentials stored in environment variables could be exposed
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Use bcrypt hashed passwords, not plain text
  - Rotate credentials regularly
  - Use Heroku's secure config vars (not committed to git)
  - Implement rate limiting on auth endpoints
  - Monitor for failed login attempts
  - Use HTTPS only in production
- **Fallback:** If credentials compromised, rotate immediately via Heroku dashboard

### **Risk 2: Approval Command Parsing**
- **Risk:** Complex approval commands might fail to parse correctly
- **Likelihood:** Medium
- **Impact:** Medium
- **Mitigation:**
  - Simple, strict command syntax
  - Clear documentation for managers
  - Comprehensive regex testing
  - Fallback to manual approval via Strapi admin
- **Fallback:** Provide web-based approval UI as alternative

### **Risk 3: Google Sheets Race Conditions**
- **Risk:** Concurrent approvals might cause data conflicts
- **Likelihood:** Low (small team, infrequent approvals)
- **Impact:** Medium
- **Mitigation:**
  - Read-modify-write pattern
  - Check current status before updating
  - Use Google Sheets API's conditional update (if available)
  - Log all approval attempts
- **Fallback:** Manual correction in Google Sheets

### **Risk 4: Token Management**
- **Risk:** JWT tokens might expire during active session
- **Likelihood:** Medium
- **Impact:** Low (just re-login)
- **Mitigation:**
  - 24-hour token expiry (reasonable for daily use)
  - Clear error message on expiry
  - Easy re-login flow
  - Consider refresh token mechanism (future)
- **Fallback:** User re-logs in

### **Risk 5: Backward Compatibility**
- **Risk:** New approval system might break existing attendance flow
- **Likelihood:** Low
- **Impact:** High
- **Mitigation:**
  - Approval status optional (default to "Approved" if not set)
  - Existing records continue to work
  - Gradual rollout with feature flag
  - Extensive testing before production
- **Fallback:** Disable approval feature via environment variable

---

## 📝 DOCUMENTATION REQUIREMENTS

### **Technical Documentation:**
1. **DEVADMIN_GUIDE.md** - How to use devadmin features
2. **APPROVAL_SYSTEM.md** - How approval system works
3. **API_REFERENCE.md** - Update with new endpoints
4. **SECURITY.md** - Security considerations and best practices
5. **TROUBLESHOOTING.md** - Common issues and solutions

### **User Documentation:**
1. **MANAGER_GUIDE.md** - How to approve/reject via LINE
2. **DRIVER_GUIDE.md** - How to see approval status (if applicable)
3. **ADMIN_GUIDE.md** - How to manage devadmin access

### **Code Documentation:**
- Inline comments for complex logic
- JSDoc for all public functions
- README in each new folder/module
- Architecture Decision Records (ADRs) for major decisions

---

## 🎯 TIMELINE & MILESTONES

### **Week 1: DevAdmin Foundation**
- **Days 1-2:** Backend auth endpoints + JWT implementation
- **Days 3-4:** Frontend login component + auth context
- **Day 5:** Testing + security hardening
- **Milestone:** DevAdmin can login and token validation works

### **Week 2: Conditional Rendering**
- **Days 1-2:** Update StyledForm.jsx with conditional dev tools
- **Days 3-4:** Environment guard + all API updates
- **Day 5:** Testing + UI polish
- **Milestone:** Dev tools hidden from regular users, visible to devadmin

### **Week 3: Approval System**
- **Days 1-2:** Enhance approvalHandler.js + webhook integration
- **Days 3-4:** Google Sheets updates + Strapi sync
- **Day 5:** Testing approval flow end-to-end
- **Milestone:** Approval commands work via LINE webhook

### **Week 4: UI & Polish**
- **Days 1-2:** Approval status badges + manager view updates
- **Days 3-4:** Approval history component
- **Day 5:** Final testing + bug fixes
- **Milestone:** All UI components complete and tested

### **Week 5: Production Readiness**
- **Days 1-2:** Security audit + performance testing
- **Days 3-4:** Documentation + training materials
- **Day 5:** Production deployment + handoff
- **Milestone:** System live in production

---

## 🛠️ QUICK REFERENCE COMMANDS

### **Generate bcrypt hash for devadmin password:**
```bash
# Install bcrypt (if not installed)
npm install bcrypt

# Generate hash (run in Node REPL or create script)
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('your_password', 10).then(hash => console.log(hash));"

# Output example:
# $2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123
```

### **Set Heroku environment variables:**
```bash
# DevAdmin credentials
heroku config:set DEVADMIN_USERNAME=devadmin --app liff-ot-app-arun
heroku config:set DEVADMIN_PASSWORD_HASH='$2b$10$...' --app liff-ot-app-arun

# JWT secret (generate random)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
heroku config:set JWT_SECRET='<generated_secret>' --app liff-ot-app-arun

# Verify
heroku config --app liff-ot-app-arun | grep DEVADMIN
```

### **Test DevAdmin login locally:**
```bash
# Start backend
cd backend
npm run dev

# In another terminal, test auth
curl -X POST http://localhost:3001/auth/devadmin \
  -H "Content-Type: application/json" \
  -d '{"username":"devadmin","password":"your_password"}'

# Should return JWT token
```

### **Test approval command:**
```bash
# Simulate LINE webhook message
curl -X POST http://localhost:3001/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "type": "message",
      "message": {"type": "text", "text": "approve Jean 16/11/2568"},
      "source": {"userId": "U123", "groupId": "G123"},
      "replyToken": "test"
    }]
  }'
```

---

## ✅ FINAL CHECKLIST

### **Before Production Deployment:**

#### Security:
- [ ] DevAdmin password strong (min 16 characters, mixed case, numbers, symbols)
- [ ] bcrypt hash generated and stored in Heroku
- [ ] JWT_SECRET is random and strong
- [ ] No credentials in frontend code
- [ ] No credentials in git history
- [ ] HTTPS enforced in production
- [ ] httpOnly cookies configured
- [ ] Rate limiting on auth endpoints
- [ ] Token expiry set appropriately
- [ ] Security audit completed

#### Functionality:
- [ ] DevAdmin login works
- [ ] DevAdmin can see dev tools
- [ ] Regular users cannot see dev tools
- [ ] Environment guard prevents dev access
- [ ] Approval commands parse correctly
- [ ] Approval updates Google Sheets
- [ ] Approval updates Strapi
- [ ] Approval status visible in UI
- [ ] Notifications sent correctly
- [ ] All existing features still work

#### Testing:
- [ ] Unit tests pass (if implemented)
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Security tests pass
- [ ] Performance acceptable
- [ ] Mobile testing complete
- [ ] Cross-browser testing complete
- [ ] Accessibility check (WCAG 2.1 Level AA)

#### Documentation:
- [ ] AGENTS.md updated
- [ ] DEVADMIN_GUIDE.md created
- [ ] APPROVAL_SYSTEM.md created
- [ ] API_REFERENCE.md updated
- [ ] MANAGER_GUIDE.md created
- [ ] Code comments added
- [ ] README updated

#### Deployment:
- [ ] Backend deployed to Heroku
- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] Database migrations run (if any)
- [ ] Logs monitored for errors
- [ ] Smoke tests passed
- [ ] Rollback plan ready

#### Handoff:
- [ ] Team trained on new features
- [ ] Documentation shared
- [ ] Support process established
- [ ] Contact information updated
- [ ] Post-launch monitoring plan

---

## 📞 SUPPORT & ESCALATION

### **If You're Stuck:**
1. **Check this file first** - Answer might be here
2. **Check error logs** - Heroku logs, browser console
3. **Review code examples** - Follow patterns shown above
4. **Test in isolation** - Break down problem into smaller pieces
5. **Ask PM** - Don't waste time if blocked

### **Critical Issues (Escalate Immediately):**
- ❌ DevAdmin credentials compromised
- ❌ Security vulnerability discovered
- ❌ Production data loss
- ❌ All users locked out
- ❌ Approval system broken in production

### **Non-Critical Issues (Can be handled post-launch):**
- ⚠️ UI polish for approval badges
- ⚠️ Performance optimization
- ⚠️ Additional approval commands
- ⚠️ Bulk approval UI improvements
- ⚠️ Approval history enhancements

---

## 🎓 KEY LEARNINGS & BEST PRACTICES

### **DevAdmin Pattern:**
1. ✅ **DO:** Use environment variables for credentials
2. ✅ **DO:** Hash passwords with bcrypt
3. ✅ **DO:** Use JWT for stateless auth
4. ✅ **DO:** Set httpOnly cookies
5. ✅ **DO:** Implement token expiry
6. ❌ **DON'T:** Store credentials in frontend
7. ❌ **DON'T:** Commit credentials to git
8. ❌ **DON'T:** Use plain text passwords
9. ❌ **DON'T:** Skip rate limiting
10. ❌ **DON'T:** Expose admin features to regular users

### **Approval System Pattern:**
1. ✅ **DO:** Use simple, strict command syntax
2. ✅ **DO:** Validate commands before processing
3. ✅ **DO:** Update multiple data sources atomically
4. ✅ **DO:** Send confirmation notifications
5. ✅ **DO:** Log all approval attempts
6. ❌ **DON'T:** Allow duplicate approvals
7. ❌ **DON'T:** Trust user input without validation
8. ❌ **DON'T:** Forget to handle errors gracefully
9. ❌ **DON'T:** Skip status checks before updates
10. ❌ **DON'T:** Expose internal errors to users

### **Security Best Practices:**
1. Defense in depth (multiple layers)
2. Principle of least privilege
3. Never trust client-side validation
4. Always validate on backend
5. Use HTTPS in production
6. Rotate credentials regularly
7. Monitor for suspicious activity
8. Log security events
9. Keep dependencies updated
10. Review code for vulnerabilities

---

## 🚀 NEXT STEPS AFTER COMPLETION

### **Immediate (Week 1 after launch):**
1. Monitor logs for errors
2. Gather user feedback
3. Fix critical bugs
4. Document any workarounds
5. Update documentation based on real usage

### **Short-term (Month 1):**
1. Add web-based approval UI (reduce LINE dependency)
2. Implement approval notifications to drivers
3. Add approval analytics/reporting
4. Optimize performance based on usage patterns
5. Enhance security based on audit findings

### **Long-term (Quarter 1):**
1. Migrate to role-based access control (RBAC) system
2. Add more granular permissions
3. Implement approval workflows (multi-step approvals)
4. Create audit trail for all approvals
5. Build approval dashboard for managers

---

**END OF UPDATED AGENTS.MD**

*This file should be the single source of truth for implementing role-based dev tools and approval system.*

---

**Last Modified By:** Claude AI Assistant  
**Last Modified Date:** November 16, 2025  
**Version:** 2.0  
**Status:** Ready for Feature Development
