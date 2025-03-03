// lib/config.ts
const config = {
    apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
    apiEndpoints: {
      login: '/api/auth/login',
      register: '/api/auth/register',
      userProfile: '/api/users/me',
      events: '/api/events',
      bookings: '/api/bookings',
    }
  };
  
  export default config;