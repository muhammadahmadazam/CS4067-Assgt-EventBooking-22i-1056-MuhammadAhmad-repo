// lib/api.ts
import config  from './config';

interface FetchOptions {
  method?: string;
  data?: Record<string, unknown>;
  token?: string;
}

// Generic API client function
export async function apiClient<T>(
  endpoint: string, 
  { method, data, token }: FetchOptions = {}
): Promise<T> {
  
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const url = `${apiUrl}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    method: method || 'GET',
    headers,
    credentials: 'include',
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(url, config);
  
  // Handle HTTP errors
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || response.statusText);
  }
  
  // Return the data
  return response.json();
}

// Auth-specific API functions
export const auth = {
  login: (email: string, password: string) => 
    apiClient<{ access_token: string; token_type: string }>(
      config.apiEndpoints.login, 
      { 
        method: 'POST', 
        data: { 
          username: email,  // FastAPI OAuth2PasswordRequestForm expects 'username'
          password 
        } 
      }
    ),
    
  register: (userData: { email: string; password: string; first_name: string; last_name: string }) => 
    apiClient(
      config.apiEndpoints.register, 
      { method: 'POST', data: userData }
    ),
    
  getUserProfile: (token: string) => 
    apiClient(config.apiEndpoints.userProfile, { token }),
};

// Events API functions
export const events = {
  getAll: (token: string) => 
    apiClient(config.apiEndpoints.events, { token }),
    
  getById: (id: string, token: string) => 
    apiClient(`${config.apiEndpoints.events}/${id}`, { token }),
};

// Bookings API functions  
export const bookings = {
  create: (bookingData: { eventId: string; userId: string; date: string }, token: string) => 
    apiClient(
      config.apiEndpoints.bookings, 
      { method: 'POST', data: bookingData, token }
    ),
    
  getAll: (token: string) => 
    apiClient(config.apiEndpoints.bookings, { token }),
};

// // Generic API client function
// export async function apiClient<T>(
//   endpoint: string, 
//   { method, data, token }: FetchOptions = {}
// ): Promise<T> {
//   const url = `${config.apiUrl}${endpoint}`;
  
//   const headers: Record<string, string> = {
//     'Content-Type': 'application/json',
//   };

//   if (token) {
//     headers['Authorization'] = `Bearer ${token}`;
//   }

//   const config: RequestInit = {
//     method: method || 'GET',
//     headers,
//     credentials: 'include',
//   };

//   if (data) {
//     config.body = JSON.stringify(data);
//   }

//   const response = await fetch(url, config);
  
//   // Handle HTTP errors
//   if (!response.ok) {
//     const errorData = await response.json();
//     throw new Error(errorData.detail || response.statusText);
//   }
  
//   // Return the data
//   return response.json();
// }

// // Auth-specific API functions
// export const auth = {
//   login: (email: string, password: string) => 
//     apiClient<{ access_token: string; token_type: string }>(
//       config.apiEndpoints.login, 
//       { 
//         method: 'POST', 
//         data: { 
//           username: email,  // FastAPI OAuth2PasswordRequestForm expects 'username'
//           password 
//         } 
//       }
//     ),
    
//   register: (userData: { email: string; password: string; first_name: string; last_name: string }) => 
//     apiClient(
//       config.apiEndpoints.register, 
//       { method: 'POST', data: userData }
//     ),
    
//   getUserProfile: (token: string) => 
//     apiClient(config.apiEndpoints.userProfile, { token }),
// };

// // Events API functions
// export const events = {
//   getAll: (token: string) => 
//     apiClient(config.apiEndpoints.events, { token }),
    
//   getById: (id: string, token: string) => 
//     apiClient(`${config.apiEndpoints.events}/${id}`, { token }),
// };

// // Bookings API functions  
// export const bookings = {
//   create: (bookingData: { eventId: string; userId: string; date: string }, token: string) => 
//     apiClient(
//       config.apiEndpoints.bookings, 
//       { method: 'POST', data: bookingData, token }
//     ),
    
//   getAll: (token: string) => 
//     apiClient(config.apiEndpoints.bookings, { token }),
// };