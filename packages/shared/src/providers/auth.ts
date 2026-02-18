import type { Profile } from '../types/user.js';

export interface User {
  id: string;
  email?: string;
  isAnonymous: boolean;
}

export interface AuthProvider {
  signIn(email: string, password: string): Promise<User>;
  signUp(email: string, password: string): Promise<User>;
  signOut(): Promise<void>;
  getUser(): Promise<User | null>;
  /** Returns the JWT access token for API requests */
  getToken(): Promise<string | null>;
  /** Subscribe to auth state changes; returns unsubscribe fn */
  onAuthChange(cb: (user: User | null) => void): () => void;
  getProfile(): Promise<Profile | null>;
}
