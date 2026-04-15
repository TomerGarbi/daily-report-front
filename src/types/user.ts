export type UserRole = "guest" | "user" | "manager" | "admin";

export interface UserGroup {
  _id: string;
  name: string;
}

export interface UserEntry {
  _id: string;
  username: string;
  role: UserRole;
  groups: UserGroup[];
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: UserEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface UserStats {
  total: number;
  byRole: Record<UserRole, number>;
  byGroup: { group: string; groupId: string; count: number }[];
  recent: {
    last7Days: number;
    last30Days: number;
  };
}
