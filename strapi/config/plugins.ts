export default ({ env }) => ({
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: '7d',
      },
      cors: {
        enabled: true,
        origin: [
          // Production URLs
          'https://liff-ot-app-raksaard-2de47d0ac48c.herokuapp.com', // Main backend
          'https://liff-ot-app-positive.vercel.app', // Frontend
          'https://liff-ot-app-positive.herokuapp.com', // Alternative frontend
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
