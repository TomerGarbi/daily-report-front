"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useFuelSites, useFuelSiteMutations } from "@/hooks/useFuelSites";
import { Button } from "@/components/ui/button";
import { FieldText } from "@/components/inputs/FieldText";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { Pagination } from "@/components/Pagination";
import { FullPageSpinner } from "@/components/Spinner";
import { FuelSitesTable } from "@/components/settings/FuelSitesTable";
import { FuelSiteEditDialog } from "@/components/settings/FuelSiteEditDialog";
import {
  STATION_FUELS,
  STATION_FUEL_LABELS,
  type StationFuel,
} from "@/types/station";
import type { FuelSite } from "@/types/fuelSite";
import { toast } from "sonner";

const PAGE_SIZE = 50;

const FUEL_FILTER_OPTIONS = [
  { value: "all", label: "כל הדלקים" },
  ...STATION_FUELS.map((f) => ({ value: f, label: STATION_FUEL_LABELS[f] })),
];

export default function FuelSitesSettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const groups     = user?.groups ?? [];
  const isAdmin    = user?.role === "admin";
  const isITAdmin  = groups.includes("IT-Admins");
  const canView    = isAuthenticated;
  const canManage  = isAdmin || isITAdmin;

  const [search,     setSearch]     = useState("");
  const [fuelFilter, setFuelFilter] = useState<StationFuel | "all">("all");
  const [page,       setPage]       = useState(1);

  const queryParams = useMemo(
    () => ({
      search: search.trim() || undefined,
      fuel:   fuelFilter === "all" ? undefined : fuelFilter,
      page,
      limit:  PAGE_SIZE,
    }),
    [search, fuelFilter, page],
  );

  const { sites, total, totalPages, isLoading, error } = useFuelSites(queryParams);

  const { createFuelSite, updateFuelSite, deleteFuelSite } = useFuelSiteMutations();

  const [editTarget, setEditTarget] = useState<FuelSite | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving,     setSaving]     = useState(false);

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (s: FuelSite) => {
    setEditTarget(s);
    setDialogOpen(true);
  };

  const handleCreate = async (payload: Parameters<typeof createFuelSite>[0]) => {
    setSaving(true);
    try {
      await createFuelSite(payload);
      toast.success("אתר הדלק נוצר בהצלחה");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string, payload: Parameters<typeof updateFuelSite>[1]) => {
    setSaving(true);
    try {
      await updateFuelSite(id, payload);
      toast.success("השינויים נשמרו");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: FuelSite) => {
    try {
      await deleteFuelSite(s.id ?? s._id ?? "");
      toast.success(`אתר הדלק "${s.name}" נמחק`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "שגיאה במחיקת אתר הדלק");
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
          <h2 className="text-xl font-bold text-slate-800">אתרי דלק</h2>
          <p className="text-sm text-muted-foreground">
            ניהול קטלוג אתרי הדלק והמיכלים. ערכים אלה משמשים כברירת-מחדל בסעיף הדלקים של הדוחות.
          </p>
        </div>

        {canManage && (
          <Button onClick={openCreate} className="bg-orange-500 hover:bg-orange-600 text-white gap-1.5">
            <Plus className="h-4 w-4" />
            אתר חדש
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
            label="דלק"
            value={fuelFilter}
            onValueChange={(v) => {
              setPage(1);
              setFuelFilter(v as StationFuel | "all");
            }}
            options={FUEL_FILTER_OPTIONS}
          />
        </div>
      </div>

      <FuelSitesTable
        sites={sites}
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
        סה״כ {total} אתרי דלק
      </div>

      <FuelSiteEditDialog
        site={editTarget}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        saving={saving}
      />
    </div>
  );
}
