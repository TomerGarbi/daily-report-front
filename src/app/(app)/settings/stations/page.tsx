"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStations, useStationMutations } from "@/hooks/useStations";
import { useStationGroups } from "@/hooks/useStationGroups";
import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Pagination } from "@/components/Pagination";
import { FullPageSpinner } from "@/components/Spinner";
import { StationsTable } from "@/components/settings/StationsTable";
import { StationEditDialog } from "@/components/settings/StationEditDialog";
import {
  STATION_TYPES,
  STATION_TYPE_LABELS,
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type Station,
  type StationType,
  type StationFuel,
} from "@/types/station";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "כל הבעלויות" },
  ...STATION_TYPES.map((t) => ({ value: t, label: STATION_TYPE_LABELS[t] })),
];

const FUEL_FILTER_OPTIONS = [
  { value: "all", label: "כל הדלקים" },
  ...STATION_FUELS.map((f) => ({ value: f, label: STATION_FUEL_LABELS[f] })),
];

export default function StationsSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const groups = user?.groups ?? [];
  const isAdmin    = user?.role === "admin";
  const isITAdmin  = groups.includes("IT-Admins");
  const canView    = isAuthenticated; // any authenticated user can browse the catalog
  const canManage  = isAdmin || isITAdmin;

  // ── Filters ────────────────────────────────────────────────────────────────
  const [search,   setSearch]   = useState("");
  const [typeFilter, setTypeFilter] = useState<StationType | "all">("all");
  const [fuelFilter, setFuelFilter] = useState<StationFuel | "all">("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [page,     setPage]     = useState(1);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      type: typeFilter === "all" ? undefined : typeFilter,
      fuel: fuelFilter === "all" ? undefined : fuelFilter,
      groupId: groupFilter === "all" ? undefined : groupFilter,
      page,
      limit: PAGE_SIZE,
    }),
    [search, typeFilter, fuelFilter, groupFilter, page],
  );

  const { stations, total, totalPages, isLoading, error } = useStations(queryParams);

  // All groups (unfiltered) — used to render the group filter, the table
  // column, and the group selector inside the edit dialog.
  const { groups: stationGroups } = useStationGroups({});

  const {
    createStation,
    updateStation,
    deleteStation,
  } = useStationMutations();

  // ── Dialog state ───────────────────────────────────────────────────────────
  const [editTarget, setEditTarget] = useState<Station | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (s: Station) => {
    setEditTarget(s);
    setDialogOpen(true);
  };

  const handleCreate = async (payload: Parameters<typeof createStation>[0]) => {
    setSaving(true);
    try {
      await createStation(payload);
      toast.success("התחנה נוצרה בהצלחה");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateStation>[1]) => {
    setSaving(true);
    try {
      await updateStation(id, payload);
      toast.success("השינויים נשמרו");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: Station) => {
    try {
      await deleteStation(s.id ?? s._id ?? "");
      toast.success(`התחנה "${s.name}" נמחקה`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "שגיאה במחיקת התחנה");
    }
  };

  // ── Auth gating ────────────────────────────────────────────────────────────
  if (authLoading) return <FullPageSpinner label="טוען…" />;
  if (!isAuthenticated) {
    if (typeof window !== "undefined") router.replace("/login");
    return null;
  }
  if (!canView) {
    return (
      <div className="p-8 text-center text-rose-500">אין לך הרשאה לצפות במסך זה.</div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">תחנות ויחידות</h2>
          <p className="text-sm text-muted-foreground">
            ניהול קטלוג התחנות והיחידות. ערכים אלה משמשים כברירת-מחדל בדוחות היומיים.
          </p>
        </div>

        {canManage && (
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            תחנה חדשה
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="flex-1 min-w-[240px]">
          <FieldText
            label="חיפוש"
            startIcon={<Search className="h-4 w-4" />}
            value={search}
            onChange={(e) => {
              setPage(1);
              setSearch(e.target.value);
            }}
            placeholder="חפש לפי שם או תג…"
          />
        </div>
        <div className="w-full md:w-52">
          <FieldSelect
            label="בעלות"
            value={typeFilter}
            onValueChange={(v) => {
              setPage(1);
              setTypeFilter(v as StationType | "all");
            }}
            options={TYPE_FILTER_OPTIONS}
          />
        </div>
        <div className="w-full md:w-52">
          <FieldSelect
            label="דלק"
            value={fuelFilter}
            onValueChange={(v) => {
              setPage(1);
              setFuelFilter(v as StationFuel | "all");
            }}
            options={FUEL_FILTER_OPTIONS}
          />
        </div>
        <div className="w-full md:w-52">
          <FieldSelect
            label="קבוצה"
            value={groupFilter}
            onValueChange={(v) => {
              setPage(1);
              setGroupFilter(v);
            }}
            options={[
              { value: "all", label: "כל הקבוצות" },
              ...stationGroups
                .filter((g) => typeFilter === "all" || g.type === typeFilter)
                .map((g) => ({ value: (g.id ?? g._id) as string, label: g.name })),
            ]}
          />
        </div>
      </div>

      <StationsTable
        stations={stations}
        groups={stationGroups}
        isLoading={isLoading}
        error={error?.message ?? null}
        canManage={canManage}
        onEdit={openEdit}
        onDelete={handleDelete}
      />

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <div className="text-xs text-muted-foreground text-center">
        סה״כ {total} תחנות
      </div>

      <StationEditDialog
        station={editTarget}
        groups={stationGroups}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        saving={saving}
      />
    </div>
  );
}
