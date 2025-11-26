# How to Reuse Login Component in Other Apps

## Option 1: Copy the Files (Simple)

1. Copy these files to your new app:
   ```
   src/login/
   ├── LoginForm.jsx (or LoginForm.standalone.jsx)
   ├── login.config.js
   └── REUSE_GUIDE.md (this file)
   ```

2. Update `login.config.js` with your API URLs:
   ```js
   apiBaseURL: () => {
     return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
   }
   ```

3. Import and use:
   ```jsx
   import LoginForm from './login/LoginForm.standalone';
   
   function App() {
     return <LoginForm />;
   }
   ```

## Option 2: Create a Reusable Package (Advanced)

### Step 1: Create a separate package structure

```
my-login-package/
├── src/
│   ├── LoginForm.jsx
│   ├── login.config.js
│   └── index.js
├── package.json
└── README.md
```

### Step 2: Create package.json

```json
{
  "name": "@your-org/login-component",
  "version": "1.0.0",
  "main": "src/index.js",
  "peerDependencies": {
    "react": "^19.0.0"
  }
}
```

### Step 3: Export from index.js

```js
export { default as LoginForm } from './LoginForm';
export { loginConfig } from './login.config';
```

### Step 4: Use in your apps

```bash
# In each app
npm install @your-org/login-component
```

```jsx
import { LoginForm } from '@your-org/login-component';
import { loginConfig } from '@your-org/login-component';

// Customize config for this app
const myConfig = {
  ...loginConfig,
  apiBaseURL: () => 'https://my-api.example.com'
};

function App() {
  return <LoginForm config={myConfig} />;
}
```

## Option 3: Git Submodule (Shared Codebase)

```bash
# In your main project
git submodule add https://github.com/your-org/shared-login-component src/login

# In other projects
git submodule add https://github.com/your-org/shared-login-component src/login
```

## Customization Options

### 1. Custom API URL per app

```jsx
import LoginForm from './login/LoginForm.standalone';
import { loginConfig } from './login/login.config';

const customConfig = {
  ...loginConfig,
  apiBaseURL: () => {
    // Different URL for this app
    return 'https://another-api.example.com';
  }
};

<LoginForm config={customConfig} />
```

### 2. Custom styling

```jsx
const customConfig = {
  ...loginConfig,
  theme: {
    background: "linear-gradient(135deg, #your-colors)",
    primaryColor: "#your-color",
    // ... other theme options
  }
};

<LoginForm config={customConfig} />
```

### 3. Custom labels/translations

```jsx
const customConfig = {
  ...loginConfig,
  labels: {
    en: {
      ...loginConfig.labels.en,
      title: "Login to My App",
      // ... override specific labels
    },
    th: {
      ...loginConfig.labels.th,
      title: "เข้าสู่ระบบแอปของฉัน"
    }
  }
};

<LoginForm config={customConfig} />
```

### 4. Custom success handler

```jsx
<LoginForm 
  config={loginConfig}
  onLoginSuccess={(result) => {
    // Custom logic after login
    console.log('User logged in:', result.user);
    // Navigate to dashboard, etc.
    window.location.href = '/dashboard';
  }}
/>
```

### 5. Custom Loading Component

```jsx
const MyCustomLoader = ({ isVisible }) => {
  if (!isVisible) return null;
  return <YourCustomLoader />;
};

<LoginForm 
  config={loginConfig}
  LoadingComponent={MyCustomLoader}
/>
```

## Environment Variables

Each app can set its own:

```env
# .env
VITE_API_BASE_URL_DEV=http://localhost:3001
VITE_API_BASE_URL_PROD=https://api.production.com
```

## Backend Requirements

The backend endpoint must match:
- `POST /login` - Accepts `{ identifier, password, rememberMe }`
- Returns: `{ success, jwt, user }`
- Sets httpOnly cookie with JWT

## Shared Backend?

If multiple apps use the same backend:
1. Keep the backend endpoint (`/login`) the same
2. Only customize the frontend config per app
3. Backend handles multiple origins via CORS

## Example: Multiple Apps Setup

```
project-root/
├── app1/              # Attendance app
│   └── src/
│       └── login/    # Shared login (submodule or copy)
├── app2/             # Another app
│   └── src/
│       └── login/    # Shared login
└── shared-backend/   # Same backend for all apps
    └── server.mjs    # Has /login endpoint
```

## Best Practices

1. **Keep config separate** - Each app can have its own `login.config.js`
2. **Version control** - Tag versions if using as package
3. **Documentation** - Document any app-specific customizations
4. **Testing** - Test login in each app after copying
5. **Backend compatibility** - Ensure backend supports all app endpoints

