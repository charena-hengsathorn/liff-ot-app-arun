export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwtSecret: env('ADMIN_JWT_SECRET'),
      jwt: {
        expiresIn: '7d',
      },
      cors: {
        enabled: true,
        origin: [
          // Production URLs
          'https://liff-ot-app-arun-d0ff4972332c.herokuapp.com', // Production backend
          'https://liff-ot-app-arun.vercel.app', // Production frontend
          'https://liff-ot-app-arun-c4kr6e91j-charenas-projects.vercel.app', // Vercel preview URL
          // Development URLs
          'http://localhost:3001', // Local backend
          'http://localhost:5173', // Local Vite frontend
          'http://localhost:5174',
          'http://localhost:5175',
        ],
      },
    },
  },
});
