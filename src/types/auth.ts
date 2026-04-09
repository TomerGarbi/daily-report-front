export interface User {
  id: string;
  email: string;
  name?: string;
  // extend with whatever fields your JWT payload includes
  [key: string]: unknown;
}

export interface AuthTokens {
  accessToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
}
