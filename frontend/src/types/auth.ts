// types/auth.ts
export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: string;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterData {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }
  
  export interface AuthResponse {
    success: boolean;
    error?: string;
  }
  
  export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<AuthResponse>;
    register: (userData: RegisterData) => Promise<AuthResponse>;
    logout: () => void;
    loading: boolean;
  }