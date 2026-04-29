"use client";

import { useAuth } from "@/hooks/useAuth";
import { ShieldCheck, User as UserIcon, Users as UsersIcon } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  admin:   "מנהל",
  manager: "מנהל ביניים",
  user:    "משתמש",
  guest:   "אורח",
};

export default function AccountSettingsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-muted-foreground">
        לא נמצאו פרטי משתמש.
      </div>
    );
  }

  const groups = user.groups ?? [];

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">חשבון</h2>
        <p className="text-sm text-muted-foreground">
          פרטי המשתמש המחובר. לעריכת התפקיד או הקבוצות יש לפנות למנהל המערכת.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm divide-y divide-slate-100">
        <Row icon={<UserIcon className="h-5 w-5 text-slate-500" />} label="שם משתמש">
          <span className="font-medium text-slate-800">{user.username}</span>
        </Row>
        <Row icon={<ShieldCheck className="h-5 w-5 text-slate-500" />} label="תפקיד">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
            {ROLE_LABELS[user.role] ?? user.role}
          </span>
        </Row>
        <Row icon={<UsersIcon className="h-5 w-5 text-slate-500" />} label="קבוצות">
          {groups.length === 0 ? (
            <span className="text-muted-foreground text-sm">אין קבוצות</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <span
                  key={g}
                  className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </Row>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      {icon}
      <div className="flex-1 min-w-0 grid grid-cols-[160px_1fr] items-center gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
