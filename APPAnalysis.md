# LIFF OT App (Arun) - Comprehensive Project Analysis

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Backend Analysis](#backend-analysis)
5. [Frontend Analysis](#frontend-analysis)
6. [API Endpoints](#api-endpoints)
7. [Data Models](#data-models)
8. [Authentication Flow](#authentication-flow)
9. [Google Sheets Integration](#google-sheets-integration)
10. [LINE Messaging Integration](#line-messaging-integration)
11. [Environment Configuration](#environment-configuration)
12. [Key Features](#key-features)
13. [Known Issues & Limitations](#known-issues--limitations)

---

## 📖 Project Overview

**Project Name:** LIFF OT App (Arun)  
**Purpose:** LINE LIFF (LINE Front-end Framework) based attendance and overtime tracking system  
**Repository:** https://github.com/charena-hengsathorn/liff-ot-app-arun.git

### Business Context
This is an attendance tracking system for drivers that:
- Tracks daily clock-in/clock-out times
- Automatically calculates overtime (OT) hours
- Integrates with LINE for notifications
- Uses Google Sheets as the primary data store
- Has Strapi CMS as an optional backend
- Supports multiple languages (Thai/English)

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 19.1.0 + Vite 7.0.0
- **Router:** React Router DOM 7.9.5
- **UI Components:** 
  - Radix UI (select, label, slot)
  - shadcn/ui components
  - Tailwind CSS 4.1.11
  - Lucide React (icons)
- **Animations:** Lottie React 2.4.1
- **LINE Integration:** @line/liff 2.27.0
- **Date/Time:** Luxon 3.6.1

### Backend
- **Server:** Express 4.18.2 (Node.js)
- **CMS:** Strapi 5.30.0
- **Database:** PostgreSQL (prod), better-sqlite3 (dev)
- **APIs:** 
  - Google Sheets API (googleapis 154.0.0)
  - LINE Messaging API
- **Authentication:** Strapi Users & Permissions plugin

### Development Tools
- **Bundler:** Vite
- **Linter:** ESLint 9.29.0
- **CSS:** PostCSS 8.5.6, Autoprefixer 10.4.21

### Deployment
- **Frontend Hosting:** Vercel
- **Backend Hosting:** Heroku
- **Primary URL:** https://liff-ot-app-arun.vercel.app
- **Backend URL:** https://liff-ot-app-positive.herokuapp.com

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     LINE LIFF Frontend                       │
│         (React + Vite + Tailwind + LIFF SDK)                │
│                                                              │
│  - StyledForm.jsx (Main attendance form)                    │
│  - ManagerView.jsx (Driver management)                      │
│  - LoginForm.jsx (Authentication)                           │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ HTTP/REST
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Express.js Backend (server.mjs)                 │
│                                                              │
│  Routes:                                                     │
│  - /login, /logout, /me (Auth)                             │
│  - /sheets, /submit, /clock-event (Attendance)             │
│  - /api/drivers (Driver CRUD)                              │
│  - /api/attendances (Attendance CRUD)                      │
│  - /notify-line (LINE notifications)                       │
│  - /webhook (LINE webhook)                                 │
└────┬─────────────┬──────────────┬─────────────────┬────────┘
     │             │              │                 │
     │             │              │                 │
     ▼             ▼              ▼                 ▼
┌─────────┐  ┌────────────┐  ┌───────────┐  ┌────────────┐
│ Strapi  │  │   Google   │  │   LINE    │  │  LINE      │
│   CMS   │  │   Sheets   │  │ Messaging │  │  Webhook   │
│         │  │    API     │  │    API    │  │            │
└─────────┘  └────────────┘  └───────────┘  └────────────┘
     │
     ▼
┌─────────┐
│  Postgres│
│ (Production)│
└─────────┘
```

### Data Flow Architecture

```
User Interaction → React Component → Express Backend → Multiple Backends
                                           ↓
                                     ┌─────┴─────┐
                                     │           │
                                     ▼           ▼
                              Google Sheets   Strapi
                             (Primary Data)  (Optional)
```

---

## 🔧 Backend Analysis

### Server Configuration (`server.mjs`)

**Port:** 3001 (dev) or process.env.PORT (prod)

**CORS Configuration:**
```javascript
Allowed Origins:
- http://localhost:5173, 5174, 5175 (Vite dev servers)
- http://localhost:3000
- https://liff-ot-app-positive.vercel.app (legacy)
- https://liff-ot-app-positive.herokuapp.com (legacy)
- https://liff-ot-app-arun.vercel.app (current)
- Vercel deployment previews
```

**Key Middleware:**
- `express.json()` - JSON body parsing
- `cookieParser()` - Cookie handling
- `multer` - File upload handling (memory storage)
- Custom CORS middleware with credentials support

---

## 📡 API Endpoints

### Authentication Endpoints

#### **POST /login**
**Purpose:** User authentication via Strapi
**Body:**
```json
{
  "identifier": "username",
  "password": "password",
  "rememberMe": true
}
```
**Response:**
```json
{
  "success": true,
  "jwt": "token",
  "user": {
    "id": 1,
    "username": "user",
    "email": "user@example.com"
  }
}
```

#### **POST /logout**
**Purpose:** User logout, clear session
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### **GET /me**
**Purpose:** Get current user info
**Headers:** Authorization: Bearer {jwt}
**Response:**
```json
{
  "id": 1,
  "username": "user",
  "email": "user@example.com"
}
```

---

### Attendance Endpoints

#### **POST /sheets**
**Purpose:** Unified Google Sheets operations
**Body:**
```json
{
  "action": "checkExisting" | "submitWithClockTimes" | "clockEvent" | "updateField",
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "clockIn": "08:00",
  "clockOut": "18:00",
  "comments": "Normal work day",
  "env": "dev" | "prod",
  "language": "en" | "th"
}
```

**Actions:**
- `checkExisting` - Check if entry exists
- `checkAndGetRow` - Check AND get row data (optimized)
- `submitWithClockTimes` - Submit attendance with clock times
- `clockEvent` - Record clock-in or clock-out event
- `updateField` - Update a specific field
- `createMonthlySheet` - Create new monthly sheet

#### **POST /submit**
**Purpose:** Submit attendance (legacy, calls /sheets internally)
**Body:**
```json
{
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "clockIn": "08:00",
  "clockOut": "18:00",
  "comments": "Normal work day",
  "env": "dev"
}
```
**Note:** Also saves to Strapi if driver exists

#### **POST /clock-event**
**Purpose:** Record clock-in or clock-out event with OT calculation
**Body:**
```json
{
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "type": "clockIn" | "clockOut",
  "timestamp": "08:00",
  "comments": "Starting work",
  "env": "dev"
}
```
**Features:**
- Auto-calculates OT hours on clock-out
- Updates existing rows or creates new ones
- Sends LINE notification on clock-out
- Saves to both Google Sheets and Strapi

#### **POST /check-existing**
**Purpose:** Check if attendance entry exists
**Body:**
```json
{
  "action": "checkExisting",
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "env": "dev"
}
```
**Response:**
```json
{
  "success": true,
  "exists": true,
  "row": 5
}
```

---

### Driver Management Endpoints

#### **GET /api/drivers**
**Purpose:** Get all drivers from Strapi
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "attributes": {
        "name": "Jean",
        "age": 30,
        "photo": {
          "data": {
            "id": 1,
            "attributes": {
              "url": "/uploads/photo.jpg"
            }
          }
        },
        "createdAt": "2025-01-01T00:00:00.000Z"
      }
    }
  ]
}
```

#### **GET /api/drivers/manager-view**
**Purpose:** Get all drivers with additional info (age, created date, last clock-in)
**Features:**
- Fetches driver data from Strapi
- Gets last clock-in from Google Sheets
- Batch operation for efficiency
**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Jean",
      "age": 30,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "photo": {
        "id": 1,
        "url": "https://example.com/photo.jpg"
      },
      "user": {
        "id": 1,
        "username": "jean",
        "email": "jean@example.com",
        "createdAt": "2025-01-01T00:00:00.000Z"
      },
      "lastClockIn": {
        "date": "25/11/2568",
        "time": "08:00"
      }
    }
  ],
  "meta": {
    "total": 1
  }
}
```

#### **GET /api/drivers/:id**
**Purpose:** Get single driver by ID
**Response:** Same structure as GET /api/drivers, but single object

#### **GET /api/drivers/name/:name**
**Purpose:** Get driver by name
**Response:** Same structure as GET /api/drivers

#### **POST /api/drivers**
**Purpose:** Create new driver
**Body:**
```json
{
  "data": {
    "name": "New Driver",
    "age": 25,
    "photo": 1
  }
}
```

#### **PUT /api/drivers/:id**
**Purpose:** Update driver
**Body:**
```json
{
  "data": {
    "name": "Updated Name",
    "age": 26
  }
}
```

#### **DELETE /api/drivers/:id**
**Purpose:** Delete driver

#### **POST /api/upload**
**Purpose:** Upload photo/file to Strapi
**Body:** FormData with 'files' field
**Response:**
```json
[
  {
    "id": 1,
    "url": "/uploads/photo.jpg"
  }
]
```

---

### Attendance Record Endpoints (Strapi)

#### **GET /api/attendances**
**Purpose:** Get all attendance records
**Query params:** Filters, sorting, pagination

#### **GET /api/attendances/:id**
**Purpose:** Get single attendance record

#### **POST /api/attendances**
**Purpose:** Create attendance record
**Body:**
```json
{
  "data": {
    "driver": 1,
    "thaiDate": "25/11/2568",
    "clockIn": "08:00",
    "clockOut": "18:00",
    "comments": "Normal work day",
    "approved": false
  }
}
```

#### **PUT /api/attendances/:id**
**Purpose:** Update attendance record

#### **DELETE /api/attendances/:id**
**Purpose:** Delete attendance record

#### **GET /api/attendances/driver/:driverName**
**Purpose:** Get all attendances for a driver (supports both name and driver relation)

---

### LINE Integration Endpoints

#### **POST /notify-line**
**Purpose:** Send LINE notification to group
**Body:**
```json
{
  "message": "Notification text",
  "env": "dev" | "prod"
}
```
**Features:**
- Sends to different LINE groups based on environment
- Duplicate notification prevention (30-second cache)
- Error handling and logging

#### **POST /webhook**
**Purpose:** Handle LINE webhook events (for approval system)
**Handles:**
- Group messages from managers
- Approval/denial commands
- Format: "Approve" or "Approve {submittedAt}"

---

### Sheet Management Endpoints (Dev Only)

#### **POST /create-monthly-sheet**
**Purpose:** Create new monthly attendance sheet
**Body:**
```json
{
  "env": "dev" | "prod",
  "force": true,
  "month": 0-11,
  "year": 2025
}
```
**Features:**
- Auto-runs on 1st of each month (scheduled)
- Copies header from previous sheet
- Creates test entry
- Sends LINE notification

#### **POST /get-sheets**
**Purpose:** Get list of available sheets in a spreadsheet
**Body:**
```json
{
  "environment": "dev" | "prod"
}
```
**Response:**
```json
{
  "sheets": ["January 2025 Attendance", "February 2025 Attendance"]
}
```

#### **POST /update-day-of-week**
**Purpose:** Update Day of Week column in a specific sheet
**Body:**
```json
{
  "environment": "dev",
  "sheetName": "January 2025 Attendance"
}
```

---

### OT Calculation Endpoints (Dev Only)

#### **POST /calculate-ot-manual**
**Purpose:** Manually calculate OT hours
**Body:**
```json
{
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "clockIn": "08:00",
  "clockOut": "20:00",
  "env": "dev"
}
```
**Response:**
```json
{
  "success": true,
  "otStart": "17:00",
  "otEnd": "20:00",
  "otHours": "3.00",
  "morningOTHours": "0.00",
  "eveningOTHours": "3.00",
  "businessRule": "enabled",
  "calculation": {
    "clockIn": "08:00",
    "clockOut": "20:00",
    "eveningOTPeriod": "17:00 → 20:00",
    "totalOTPeriod": "17:00 → 20:00"
  }
}
```

#### **POST /read-and-update-ot**
**Purpose:** Read row data and calculate OT, then update sheet
**Body:**
```json
{
  "driverName": "Jean",
  "thaiDate": "25/11/2568",
  "env": "dev"
}
```

#### **POST /read-and-update-ot-by-row**
**Purpose:** Read specific row by number and update OT
**Body:**
```json
{
  "rowNumber": 5,
  "thaiDate": "25/11/2568",
  "env": "dev",
  "sheetName": "January 2025 Attendance"
}
```

#### **POST /get-ot-sheets**
**Purpose:** Get available sheets for OT calculation
**Body:**
```json
{
  "env": "dev"
}
```

#### **POST /read-row-data**
**Purpose:** Read row data for auto-population
**Body:**
```json
{
  "sheetName": "January 2025 Attendance",
  "rowNumber": 5,
  "env": "dev"
}
```

#### **POST /update-ot-hours**
**Purpose:** Update OT Hours column directly
**Body:**
```json
{
  "sheetName": "January 2025 Attendance",
  "rowNumber": 5,
  "otHours": "3.00",
  "env": "dev"
}
```

---

### Login History Endpoint

#### **POST /api/logins/sync-from-sheets**
**Purpose:** Sync login history from Google Sheets to Strapi
**Body:**
```json
{
  "env": "prod",
  "sheetName": "Login History",
  "month": 11,
  "year": 2025
}
```

---

### Health Check

#### **GET /health**
**Purpose:** Check server health
**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-13T10:30:00.000Z",
  "env": "production"
}
```

#### **GET /api**
**Purpose:** API root endpoint
**Response:**
```json
{
  "message": "LIFF Attendance OT App Backend",
  "status": "running",
  "timestamp": "2025-11-13T10:30:00.000Z"
}
```

---

## 🗄️ Data Models

### Strapi Content Types

#### **Driver**
```typescript
{
  id: number;
  name: string;
  age?: number;
  photo?: Media;  // Single image
  user?: User;    // Relation to Strapi user
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
}
```

#### **Attendance**
```typescript
{
  id: number;
  driver?: Driver;     // Relation (optional for backwards compatibility)
  driverName: string;  // Legacy field
  thaiDate: string;    // Format: "DD/MM/YYYY" (Thai Buddhist year)
  clockIn?: string;    // Format: "HH:MM"
  clockOut?: string;   // Format: "HH:MM"
  comments?: string;
  submittedAt: string; // ISO 8601
  approved: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### **Month**
```typescript
{
  id: number;
  year: number;
  month: number;       // 1-12
  monthName: string;   // "January 2025"
  startDate: string;   // "YYYY-MM-DD"
  endDate: string;     // "YYYY-MM-DD"
  thaiYear: number;    // Gregorian year + 543
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

#### **Login**
```typescript
{
  id: number;
  user: User;          // Relation
  loginStatus: 'success' | 'failed' | 'blocked';
  loginAttemptAt: string; // ISO 8601
  ipAddress?: string;
  userAgent?: string;
  rememberMe: boolean;
  failureReason?: string;
  deviceInfo?: object;
  month?: Month;       // Relation
  createdAt: string;
}
```

### Google Sheets Schema

#### **Sheet Structure (New Format with Day of Week)**
```
Column A: Driver Name
Column B: Date (Thai format: DD/MM/YYYY)
Column C: Day of Week (Thai: วันจันทร์, etc.)
Column D: Clock In (HH:MM)
Column E: Clock Out (HH:MM)
Column F: OT Start (HH:MM)
Column G: OT End (HH:MM)
Column H: Comments
Column I: Submitted At (ISO 8601)
Column J: OT Hours (decimal)
Column K: Approval (Approve/Deny)
```

#### **Sheet Structure (Old Format without Day of Week)**
```
Column A: Driver Name
Column B: Date (Thai format: DD/MM/YYYY)
Column C: Clock In (HH:MM)
Column D: Clock Out (HH:MM)
Column E: OT Start (HH:MM)
Column F: OT End (HH:MM)
Column G: Comments
Column H: Submitted At (ISO 8601)
Column I: OT Hours (decimal)
Column J: Approval (Approve/Deny)
```

**Note:** The system automatically detects which structure is being used.

---

## 🔐 Authentication Flow

```
1. User visits /login
2. Enters username + password
3. POST /login → Express Backend
4. Backend proxies to Strapi /api/auth/local
5. Strapi validates credentials
6. On success:
   - Strapi returns JWT token
   - Backend sets httpOnly cookie (if rememberMe)
   - Backend returns user info
7. Frontend stores user in localStorage
8. Frontend redirects to / or return URL
9. Protected routes check localStorage for user
10. API calls include credentials (cookies)
```

### Protected Routes
- `/` (root) - Requires authentication
- `/th` - Thai language version (protected)
- `/en` - English language version (protected)
- `/prod` - Production preview (protected)
- `/manager` - Manager view (protected)

### Public Routes
- `/login` - Login page
- `/health` - Health check
- `/api` - API root

---

## 📊 Google Sheets Integration

### Key Functions (`googleSheetsHandler.js`)

#### **Authentication**
Uses Google Service Account with credentials stored in:
- `process.env.GOOGLE_SERVICE_ACCOUNT_KEY` (base64 encoded)
- `./google-credentials.json` (file path)

#### **Sheet Naming Convention**
Format: `{Month} {Year} Attendance`
Example: `"January 2025 Attendance"`

#### **Date Handling**
- **Thai Date Format:** DD/MM/YYYY (Thai Buddhist year, e.g., 25/11/2568)
- **Conversion:** Thai year - 543 = Gregorian year
- **Day of Week:** Calculated from Thai date and translated to Thai/English

#### **OT Calculation Rules**

**Business Rule:**
- OT calculation is **DISABLED** from 25th to end of month
- Days 1-24: OT calculation enabled
- Days 25-31: OT hours = 0.00

**Morning OT (Early Start):**
- If clock-in < 08:00
- OT hours = 08:00 - clock-in time
- Example: Clock in at 06:00 → 2.00 hours morning OT

**Evening OT (Late End):**
- If clock-out > 17:00
- OT hours = clock-out time - 17:00
- Example: Clock out at 20:00 → 3.00 hours evening OT

**Combined OT:**
- Total = Morning OT + Evening OT
- OT Start = earliest OT time
- OT End = latest OT time

**Example Calculations:**
```
Clock In: 06:00, Clock Out: 20:00
→ Morning OT: 06:00 - 08:00 = 2.00 hours
→ Evening OT: 17:00 - 20:00 = 3.00 hours
→ Total OT: 5.00 hours
→ OT Period: 06:00 - 20:00

Clock In: 08:00, Clock Out: 18:00
→ Morning OT: 0.00 hours (started at 08:00)
→ Evening OT: 17:00 - 18:00 = 1.00 hours
→ Total OT: 1.00 hours
→ OT Period: 17:00 - 18:00
```

#### **Sheet Structure Detection**
The system automatically detects whether a sheet has the "Day of Week" column:
- Checks column C header for "day" and "week"
- Adjusts column positions accordingly
- Ensures backwards compatibility

#### **Optimization: Combined Operations**
Function `checkAndGetRowByDriverAndDate()` performs:
1. Check if entry exists
2. Get row data
3. Detect sheet structure
All in a **single operation** (3 API calls total), instead of 5+ separate calls.

---

## 📱 LINE Messaging Integration

### Configuration

**Environment Variables:**
```
LINE_CHANNEL_ACCESS_TOKEN=FeJ00mhoud7ER...
LINE_GROUP_ID_DEV=C29503f9caac4842653560e0953021434
LINE_GROUP_ID_PROD=Ce1bf6faf79ace4245bcee60e9e2655f8
MANAGER_USER_IDS_DEV=568265772854935963
MANAGER_USER_IDS_PROD=U568263835757577014
```

### Notification Types

#### **Clock-Out Notification**
Sent when a driver clocks out:
```
🕔 CLOCK OUT

👤 Driver: Jean
📅 Date: 25/11/2568
🕒 Clock In: 08:00
🕔 Clock Out: 18:00
💬 Comments: Normal work day
⏰ OT Hours: 1.00 hours
🕕 OT Start: 17:00
🕖 OT End: 18:00

📊 Google Sheets updated

📄 View in Google Sheets:
https://docs.google.com/spreadsheets/d/...
```

#### **Monthly Sheet Creation Notification**
Sent when new monthly sheet is created:
```
📅 NEW MONTHLY SHEET CREATED

📊 Sheet: January 2025 Attendance
📅 Date: 1/1/2568
🕐 Time: 00:00:00

✅ Header row copied from previous sheet
🧪 Test entry added for verification

📄 View in Google Sheets:
https://docs.google.com/spreadsheets/d/...
```

### Webhook Handling
Processes messages from LINE groups:
- Identifies manager users
- Processes approval commands:
  - "Approve" - Approves most recent request
  - "Approve {submittedAt}" - Approves specific request
  - "Deny" - (To be implemented)

### Duplicate Prevention
- Uses in-memory cache (30-second TTL)
- Prevents duplicate notifications for same message
- Auto-cleans old cache entries (60-second TTL)

---

## ⚙️ Environment Configuration

### Environment Variables (`.env.local`)

```bash
# Google Sheets API
GOOGLE_SERVICE_ACCOUNT_KEY_FILE=./google-credentials.json

# LIFF
VITE_LIFF_ID=2007661538-Ka1DlJ20

# Google Sheets IDs
VITE_GOOGLE_SHEET_ID_DEV=1diiYf4TaTLwsLA0O48xjwBSTC76BvOAS2woezN_Z4lQ
VITE_GOOGLE_SHEET_ID_PROD=1_ObqjB3eMOgbKmf3xvzQHeCttjyAUIn5meiu4nT0z34

# LINE Messaging
LINE_CHANNEL_ACCESS_TOKEN=FeJ00mhoud7ER...
LINE_GROUP_ID_DEV=C29503f9caac4842653560e0953021434
LINE_GROUP_ID_PROD=Ce1bf6faf79ace4245bcee60e9e2655f8

# Manager User IDs (comma-separated)
MANAGER_USER_IDS_DEV=568265772854935963
MANAGER_USER_IDS_PROD=U568263835757577014

# Google Apps Script (for direct integration)
GOOGLE_APPS_SCRIPT_ID=AKfycbyQ0uUxdmCaVJiyCemBkkdMhs01dNUowCSksUlbKbeJMl-rWhSjUy9HlvKoByGO0gPr

# Strapi
STRAPI_URL=http://localhost:1337  # Dev
# STRAPI_URL=https://your-strapi.herokuapp.com  # Prod
```

### Frontend Environment Detection

```javascript
// Priority:
// 1. NODE_ENV (process.env.NODE_ENV)
// 2. STRAPI_URL detection (localhost = dev)
// 3. Default to prod for safety

getEffectiveEnv() {
  if (NODE_ENV === 'development') return 'dev';
  if (NODE_ENV === 'production') return 'prod';
  if (STRAPI_URL.includes('localhost')) return 'dev';
  return 'prod';
}
```

### UI Environment Toggle
- UI has environment switcher button (top-right)
- Cookie: `uiEnvironment` (dev/prod)
- Can test production UI with dev backend (prod preview mode)

---

## 🎨 Frontend Analysis

### Main Components

#### **App.jsx**
- React Router setup
- Protected route wrapper
- Routes:
  - `/login` - Login page
  - `/` - Main form (protected)
  - `/th` - Thai version (protected)
  - `/en` - English version (protected)
  - `/prod` - Production preview (protected)
  - `/manager` - Manager view (protected)

#### **StyledForm.jsx** (Main Attendance Form)
**Features:**
- Driver selection dropdown
- Clock-in/Clock-out buttons (one-click)
- Comments field with weather emoji shortcuts
- Auto-saves comments to Google Sheets (debounced)
- Auto-loads existing data for selected driver
- Day of week display (auto-calculated)
- Loading animation
- Language switcher (Thai/English)
- Environment switcher (Dev/Prod) - top right
- Mobile-responsive design

**Key State Management:**
```javascript
formData: {
  driverName: '',
  clockIn: '',
  clockOut: '',
  comments: ''
}
invalidFields: {}
isSubmitting: boolean
isLoadingData: boolean
isDarkMode: boolean
browserLang: 'en' | 'th'
```

**Cookie Management:**
- Saves driver-specific data in cookies
- Format: `{driverName}_{field}` (e.g., `Jean_clockIn`)
- Persists across sessions
- Auto-clears on date change or submission

**Validation:**
- Required: Driver name, Clock-in
- If Clock-in exists, Clock-out and Comments become required
- Visual feedback with red borders on invalid fields

#### **ManagerView.jsx** (Driver Management)
**Features:**
- List all drivers with:
  - Name, Age, Photo
  - Account created date
  - Last clock-in date and time
- Selection mode for bulk operations
- Edit driver (single selection)
- Delete driver(s) (multiple selection)
- Add new driver (from main form)
- Photo upload support
- Responsive: Table view (desktop), Card view (mobile)
- Dark mode support

**Data Loading:**
```javascript
// Optimized loading:
1. Fetch all drivers from Strapi
2. Batch fetch last clock-ins from Google Sheets
3. Merge data and display
```

#### **LoginForm.jsx** (Authentication)
**Features:**
- Username/Password fields
- Remember me checkbox (saves username in cookie)
- Form validation
- Loading animation
- Error display
- Language support (Thai/English)
- Dark mode support

#### **LoadingAnimation.jsx** (Shared Component)
**Features:**
- Lottie animation
- Configurable size
- Dark mode support
- Centered overlay
- Used in: Login, Main form, Manager view

---

### UI/UX Patterns

#### **Dark Mode Detection**
```javascript
useEffect(() => {
  const match = window.matchMedia('(prefers-color-scheme: dark)');
  setIsDarkMode(match.matches);
  const handler = (e) => setIsDarkMode(e.matches);
  match.addEventListener('change', handler);
  return () => match.removeEventListener('change', handler);
}, []);
```

#### **Mobile Detection**
```javascript
function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
}
```

#### **Language Detection**
```javascript
// Priority:
// 1. URL path (/th, /en)
// 2. Browser language (navigator.language)
// 3. Default to Thai

getLanguagePreference() {
  if (path === '/th') return 'th';
  if (path === '/en') return 'en';
  if (path === '/prod') {
    // Check cookie, then browser
    return getCookie('preferredLanguage') || navigator.language;
  }
  if (navigator.language.startsWith('th')) return 'th';
  return 'en';
}
```

#### **Modal System**
```javascript
// Custom alert/modal instead of browser alert()
showAlert(message, type = 'info'|'success'|'error'|'warning')

Modal Features:
- Animated slide-in
- Dark mode support
- Icon based on type (✅ ❌ ⚠️ ℹ️)
- Centered overlay
- Click outside to dismiss
```

#### **Clock Event Flow**
```
1. User clicks "Clock In" or "Clock Out"
2. Get current time (Bangkok timezone)
3. Check if row exists in Google Sheets
4. If exists:
   - Update existing row with new time
   - Calculate OT if clocking out
5. If doesn't exist:
   - Create new row with time
6. Send LINE notification if clocking out
7. Save to Strapi (non-blocking)
8. Show success message
9. Update UI
```

---

## 🔑 Key Features

### 1. **Dual Backend System**
- **Google Sheets:** Primary data store (attendance records)
- **Strapi:** Secondary backend (drivers, users, optional attendance sync)
- **Rationale:** 
  - Google Sheets for easy viewing and editing by managers
  - Strapi for structured data and authentication

### 2. **Automatic OT Calculation**
- Calculates morning OT (before 08:00)
- Calculates evening OT (after 17:00)
- Business rule: No OT from 25th to end of month
- Precision: 2 decimal places
- Auto-updates on clock-out

### 3. **Multi-Language Support**
- Thai (th)
- English (en)
- URL-based language routing (/th, /en)
- Browser language detection
- Persistent language preference

### 4. **Environment Switching**
- Dev/Prod toggle in UI
- Separate Google Sheets for each environment
- Separate LINE groups for each environment
- Cookie-based persistence

### 5. **LINE Integration**
- Real-time notifications to LINE groups
- Manager approval system via webhook
- Environment-specific groups
- Duplicate prevention

### 6. **Auto-Population**
- When selecting a driver, auto-loads existing data for today
- Shows loading animation during fetch
- Prevents duplicate entries
- Enables quick updates without re-entering all data

### 7. **Monthly Sheet Creation**
- Automatic on 1st of each month (scheduler)
- Manual creation for any month (dev only)
- Copies header and formatting from previous sheet
- Creates test entry
- Sends LINE notification

### 8. **Responsive Design**
- Mobile-first approach
- Adaptive layouts:
  - Form: Vertical layout on mobile
  - Manager view: Cards on mobile, table on desktop
- Touch-friendly buttons
- Optimized for LINE in-app browser

### 9. **Dark Mode**
- Auto-detects system preference
- Consistent across all pages
- Adapts colors for readability

### 10. **Driver Management**
- CRUD operations on drivers
- Photo upload (to Strapi)
- Bulk operations (delete multiple)
- Last clock-in tracking
- User account association

### 11. **Authentication & Authorization**
- Strapi-based authentication
- JWT token management
- Remember me functionality
- Protected routes
- Session management

### 12. **Development Tools** (Dev Environment Only)
- Manual testing form (with preset scenarios)
- OT calculation testing
- Day of Week column updater
- Sheet selector
- Environment preview
- Test auto-submit functionality

---

## ⚠️ Known Issues & Limitations

### Technical Limitations

1. **Google Sheets as Primary Database**
   - **Limitation:** No ACID transactions
   - **Limitation:** Rate limits (100 requests/100 seconds/user)
   - **Limitation:** No real-time updates
   - **Impact:** Concurrent edits can cause conflicts

2. **Date Handling**
   - **Issue:** Thai Buddhist year conversion required
   - **Issue:** Time zone complexity (Bangkok time)
   - **Workaround:** All dates stored in Thai format

3. **OT Calculation Business Rule**
   - **Limitation:** Hard-coded 25th-end of month rule
   - **Limitation:** Cannot handle exceptions or overrides
   - **Impact:** Manual corrections needed for special cases

4. **LINE Integration**
   - **Limitation:** Requires manager to be in specific LINE group
   - **Limitation:** Approval via text commands (not buttons)
   - **Impact:** User must type exact command format

5. **Strapi Sync**
   - **Issue:** Attendance sync is non-blocking (may fail silently)
   - **Issue:** Driver lookup by name (case-sensitive)
   - **Workaround:** Google Sheets is source of truth

### Known Bugs

1. **Duplicate Notifications**
   - **Status:** Partially fixed with cache
   - **Remaining Issue:** Cache doesn't persist across server restarts

2. **Sheet Structure Detection**
   - **Issue:** Relies on header text (fragile)
   - **Workaround:** Manual detection if header is modified

3. **Mobile Browser Compatibility**
   - **Issue:** Some older mobile browsers may have layout issues
   - **Status:** Tested on modern iOS Safari and Android Chrome

### Security Considerations

1. **API Keys in Environment Variables**
   - Google Service Account key stored in file
   - LINE Channel Access Token in environment
   - **Recommendation:** Use secrets manager in production

2. **CORS Configuration**
   - Open CORS for specific origins
   - **Recommendation:** Tighten CORS for production

3. **No Rate Limiting**
   - No rate limiting on API endpoints
   - **Recommendation:** Add rate limiting middleware

4. **Error Messages**
   - Some error messages may expose system details
   - **Recommendation:** Generic error messages for production

### Performance Considerations

1. **Batch Operations**
   - Manager view loads all drivers + last clock-ins
   - **Optimization:** Pagination not implemented
   - **Impact:** Slow loading with many drivers

2. **Google Sheets API Calls**
   - Multiple API calls per operation
   - **Optimization:** Batch operations implemented where possible
   - **Remaining:** Some operations still require multiple calls

3. **No Caching Strategy**
   - No caching of frequently accessed data
   - **Recommendation:** Implement Redis or in-memory cache

### Deployment Issues

1. **Heroku Free Tier Sleep**
   - Backend may sleep after 30 minutes of inactivity
   - **Impact:** First request after sleep is slow (cold start)
   - **Workaround:** Ping endpoint every 25 minutes

2. **Environment Variable Management**
   - Many environment variables needed
   - **Challenge:** Keeping dev and prod in sync
   - **Recommendation:** Use configuration management tool

### Future Improvements

1. **Approval System**
   - Current: Text-based commands via LINE
   - **Proposed:** Interactive buttons or web interface

2. **Reporting**
   - Current: Manual review in Google Sheets
   - **Proposed:** Dashboard with charts and analytics

3. **Offline Support**
   - Current: Requires internet connection
   - **Proposed:** Progressive Web App (PWA) with offline queue

4. **Notifications**
   - Current: LINE only
   - **Proposed:** Email, SMS, push notifications

5. **Advanced OT Rules**
   - Current: Simple time-based calculation
   - **Proposed:** Configurable rules, holiday handling, break times

6. **Audit Trail**
   - Current: Basic timestamp in Google Sheets
   - **Proposed:** Full audit log of all changes

7. **Multi-Tenancy**
   - Current: Single organization
   - **Proposed:** Support multiple organizations

8. **Mobile App**
   - Current: LINE LIFF only
   - **Proposed:** Native iOS/Android apps

---

## 📚 Additional Resources

### Documentation Files in Repository

#### **Main Documentation:**
- `README.md` - Basic project overview
- `DAY_OF_WEEK_UPDATE_README.md` - Guide for updating Day of Week column

#### **Guides for Use:** (`/Guides for Use/`)
- `CURL_GUIDE.md` - CURL examples for API testing
- `DEPLOY_STRAPI_HEROKU_PROD.md` - Strapi deployment guide
- `ENV_SETUP.md` - Environment setup guide
- `GOOGLE_SHEETS_SETUP.md` - Google Sheets API setup
- `HEROKU_DEPLOYMENT.md` - Heroku deployment guide
- `LOGIN_BRAINSTORM.md` - Login system brainstorm notes
- `MAKE_EMAIL_OPTIONAL.md` - Guide to make email optional in Strapi
- `QUICK_STRAPI_HEROKU_SETUP.md` - Quick Strapi setup guide
- `STRAPI_DATABASE_COMPARISON.md` - Database options comparison
- `STRAPI_HEROKU_DEPLOYMENT.md` - Detailed Strapi deployment
- `STRAPI_LOGIN_COLLECTION.md` - Login collection setup
- `STRAPI_LOGIN_CONNECTION.md` - Login connection guide
- `STRAPI_SETUP.md` - Complete Strapi setup
- `TUTORIAL_CONNECT_STRAPI_LOGIN.md` - Tutorial for connecting login

#### **Login Module:** (`/src/login/`)
- `README.md` - Login module documentation
- `REUSE_GUIDE.md` - Guide to reuse login module
- `BACKEND_REUSE.md` - Backend reuse guide

---

## 🎯 Summary

This LIFF OT App is a comprehensive attendance tracking system built with:
- **Modern Frontend:** React + Vite + Tailwind
- **Flexible Backend:** Express.js with dual data store (Google Sheets + Strapi)
- **LINE Integration:** Real-time notifications and webhook handling
- **Multi-Language:** Thai/English support
- **Responsive Design:** Works on mobile and desktop
- **Developer Tools:** Extensive testing and management tools

### Key Strengths:
✅ Easy for managers to view/edit data (Google Sheets)  
✅ Real-time notifications (LINE)  
✅ Automatic OT calculation  
✅ Multi-language and dark mode support  
✅ Mobile-optimized for LINE in-app browser  
✅ Comprehensive API endpoints  

### Areas for Improvement:
⚠️ Scalability (Google Sheets as primary DB)  
⚠️ Security (API key management)  
⚠️ Performance (no caching)  
⚠️ Error handling (some silent failures)  
⚠️ Testing (no automated tests)  

---

**Document Version:** 1.0  
**Last Updated:** November 13, 2025  
**Prepared By:** Claude (AI Assistant)
