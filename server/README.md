# Login Module

Separate login module for Strapi authentication integration.

## File Structure

```
src/login/
├── LoginForm.jsx             # Main login form component (single file pattern like StyledForm)
└── README.md                 # This file
```

## Features

- Email/Password authentication via Strapi
- JWT token management (httpOnly cookies)
- Session persistence with "Remember me"
- Multi-language support (Thai/English)
- Form validation and error handling
- Loading states

## Pattern

Following the same pattern as `StyledForm.jsx`:
- Single file component with all logic
- Helper functions at the top
- Labels object for i18n
- Inline styling
- Direct fetch calls to API

## Backend Endpoint

- `POST /login` - Proxies to Strapi `/api/auth/local`
- Sets httpOnly JWT cookie on successful login
- Returns user data for frontend storage

## Usage

```jsx
import LoginForm from './login/LoginForm';

// In your router (when you add React Router)
<Route path="/login" element={<LoginForm />} />
```

## Environment Variables

Add to `.env.local`:
```
STRAPI_URL=http://localhost:1337  # Or your Strapi production URL
```

## Strapi Setup

Make sure your Strapi instance has:
- Users-permissions plugin enabled
- Email/Password authentication enabled
- Users can register/login via `/api/auth/local`

