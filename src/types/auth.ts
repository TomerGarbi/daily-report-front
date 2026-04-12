export type Role = "guest" | "user" | "manager" | "admin";

export interface User {
  username: string;
  role: Role;
  groups: string[];
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
