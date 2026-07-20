"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStationGroups, useStationGroupMutations } from "@/hooks/useStationGroups";
import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Pagination } from "@/components/Pagination";
import { FullPageSpinner } from "@/components/Spinner";
import { StationGroupsTable } from "@/components/settings/StationGroupsTable";
import { StationGroupEditDialog } from "@/components/settings/StationGroupEditDialog";
import { STATION_TYPES, STATION_TYPE_LABELS, type StationType } from "@/types/station";
import type { StationGroup } from "@/types/stationGroup";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const TYPE_FILTER_OPTIONS = [
  { value: "all", label: "כל הבעלויות" },
  ...STATION_TYPES.map((t) => ({ value: t, label: STATION_TYPE_LABELS[t] })),
];

export default function StationGroupsSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const userGroups = user?.groups ?? [];
  const isAdmin    = user?.role === "admin";
  const isITAdmin  = userGroups.includes("IT-Admins");
  const canView    = isAuthenticated;
  const canManage  = isAdmin || isITAdmin;

  const [search,     setSearch]     = useState("");
  const [typeFilter, setTypeFilter] = useState<StationType | "all">("all");
  const [page,       setPage]       = useState(1);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      type:   typeFilter === "all" ? undefined : typeFilter,
      page,
      limit:  PAGE_SIZE,
    }),
    [search, typeFilter, page],
  );

  const { groups, total, totalPages, isLoading, error } = useStationGroups(queryParams);

  const {
    createStationGroup,
    updateStationGroup,
    deleteStationGroup,
  } = useStationGroupMutations();

  const [editTarget, setEditTarget] = useState<StationGroup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (g: StationGroup) => {
    setEditTarget(g);
    setDialogOpen(true);
  };

  const handleCreate = async (payload: Parameters<typeof createStationGroup>[0]) => {
    setSaving(true);
    try {
      await createStationGroup(payload);
      toast.success("הקבוצה נוצרה בהצלחה");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateStationGroup>[1]) => {
    setSaving(true);
    try {
      await updateStationGroup(id, payload);
      toast.success("השינויים נשמרו");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (g: StationGroup) => {
    try {
      await deleteStationGroup(g.id ?? g._id ?? "");
      toast.success(`הקבוצה "${g.name}" נמחקה`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "שגיאה במחיקת הקבוצה");
    }
  };

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
          <h2 className="text-xl font-bold text-slate-800">קבוצות תחנות</h2>
          <p className="text-sm text-muted-foreground">
            הטבלאות בדוחות היומיים מחולקות לפי קבוצות אלה בתוך כל סוג בעלות
            (חברת חשמל / יצרנות פרטיות). כל תחנה משויכת לקבוצה אחת.
          </p>
        </div>

        {canManage && (
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            קבוצה חדשה
          </Button>
        )}
      </div>

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
      </div>

      <StationGroupsTable
        groups={groups}
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
        סה״כ {total} קבוצות
      </div>

      <StationGroupEditDialog
        group={editTarget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        saving={saving}
      />
    </div>
  );
}
