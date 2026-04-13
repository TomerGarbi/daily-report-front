export type ReportStatus = "draft" | "published";

export interface IUserRef {
  username: string;
  userId: string;
}

// ─── Station types ──────────────────────────────────────────────────────────

export type StationStatus = "Active" | "Inactive" | "Maintenance";

export interface StationRow {
  stationNumber: number;
  installedCapacity: number;
  availableCapacity: number;
  peakCapacity: number;
  minReserveCapacity: number;
  secondaryFuelPeakCapacity: number;
  status: StationStatus;
  startTime?: string;
  endTime?: string;
  updatedEndTime?: string;
  notes?: string;
}

/** Map of station-group name → rows */
export type StationData = Record<string, StationRow[]>;

// ─── Report content ─────────────────────────────────────────────────────────

export interface ReportContent {
  stationData: StationData;
  gasData: StationData;
  renewableData: StationData;
  electricData: StationData;
}

// ─── Report ─────────────────────────────────────────────────────────────────

export interface Report {
  _id?: string;
  id: string;
  title: string;
  description: string;
  content?: ReportContent;
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
  totalPages: number;
  hasNextPage: boolean;
}
