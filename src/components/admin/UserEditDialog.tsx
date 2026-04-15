"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FieldSelect } from "@/components/inputs/FieldSelect";
import { FieldMultiSelect } from "@/components/inputs/FieldMultiSelect";
import type { UserEntry, UserRole } from "@/types/user";

const ROLE_OPTIONS = [
  { value: "admin", label: "מנהל" },
  { value: "manager", label: "מנהל ביניים" },
  { value: "user", label: "משתמש" },
  { value: "guest", label: "אורח" },
];

interface GroupOption {
  value: string;
  label: string;
}

interface UserEditDialogProps {
  user: UserEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (userId: string, updates: { role?: UserRole; groups?: string[] }) => Promise<void>;
  groupOptions: GroupOption[];
  saving?: boolean;
}

export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onSave,
  groupOptions,
  saving = false,
}: UserEditDialogProps) {
  const [role, setRole] = useState<UserRole>("user");
  const [groups, setGroups] = useState<string[]>([]);

  // Sync local state when user changes
  useEffect(() => {
    if (user) {
      setRole(user.role);
      setGroups(user.groups.map((g) => g._id));
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    const updates: { role?: UserRole; groups?: string[] } = {};
    if (role !== user.role) updates.role = role;
    const currentGroupIds = user.groups.map((g) => g._id).sort().join(",");
    const newGroupIds = [...groups].sort().join(",");
    if (newGroupIds !== currentGroupIds) updates.groups = groups;

    if (Object.keys(updates).length === 0) {
      onOpenChange(false);
      return;
    }

    await onSave(user._id, updates);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>עריכת משתמש — {user?.username}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <FieldSelect
            label="תפקיד"
            options={ROLE_OPTIONS}
            value={role}
            onValueChange={(val) => setRole(val as UserRole)}
          />

          <FieldMultiSelect
            label="קבוצות"
            placeholder="בחר קבוצות…"
            options={groupOptions}
            value={groups}
            onChange={setGroups}
          />
        </div>

        <DialogFooter className="flex-row-reverse gap-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "שומר…" : "שמור"}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            ביטול
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
