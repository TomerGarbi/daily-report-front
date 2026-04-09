export type ReportStatus = "draft" | "published";

export interface IUserRef {
  username: string;
  userId: string;
}

export interface Report {
  _id?: string;
  id: string;
  title: string;
  description: string;
  content: Record<string, unknown>;
  group: string;
  status: ReportStatus;
  version: number;
  createdBy: IUserRef;
  updatedBy: IUserRef;
  createdAt: string;
  updatedAt: string;
}

export interface ReportsResponse {
  data: Report[];
  total: number;
  page: number;
  limit: number;
}
