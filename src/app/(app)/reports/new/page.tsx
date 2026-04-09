
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutList, CheckCircle2 } from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData } from "@/components/StationTable/StationTable";

// ─── Fake station data ──────────────────────────────────────────────────────

const INITIAL_STATIONS: StationData = {
  "Haifa Power": [
    { stationNumber: 1, installedCapacity: 500, currentCapacity: 450, degradingCapacity: 50, status: "Active", startTime: "2026-02-26T08:00:00Z" },
    { stationNumber: 2, installedCapacity: 500, currentCapacity: 480, degradingCapacity: 20, status: "Active" },
    { stationNumber: 3, installedCapacity: 350, currentCapacity: 0, degradingCapacity: 0, status: "Inactive" },
  ],
  "Ashdod Power": [
    { stationNumber: 1, installedCapacity: 600, currentCapacity: 600, degradingCapacity: 0, status: "Active", startTime: "2026-02-26T06:30:00Z" },
    { stationNumber: 2, installedCapacity: 600, currentCapacity: 550, degradingCapacity: 50, status: "Active", startTime: "2026-02-26T07:15:00Z" },
  ],
  "Orot Rabin": [
    { stationNumber: 1, installedCapacity: 700, currentCapacity: 700, degradingCapacity: 0, status: "Active", startTime: "2026-02-25T22:00:00Z" },
    { stationNumber: 2, installedCapacity: 700, currentCapacity: 680, degradingCapacity: 20, status: "Active", startTime: "2026-02-26T05:00:00Z" },
    { stationNumber: 3, installedCapacity: 700, currentCapacity: 0, degradingCapacity: 0, status: "Maintenance" },
    { stationNumber: 4, installedCapacity: 700, currentCapacity: 690, degradingCapacity: 10, status: "Active", startTime: "2026-02-26T04:30:00Z" },
  ],
  "Eshkol Power": [
    { stationNumber: 1, installedCapacity: 450, currentCapacity: 430, degradingCapacity: 20, status: "Active", startTime: "2026-02-26T09:00:00Z" },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTodayTitle() {
  const d = new Date();
  return `דוח יומי - ${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const DAY_NAMES_HE = ["יום ראשון", "יום שני", "יום שלישי", "יום רביעי", "יום חמישי", "יום שישי", "שבת"];

function getDayDescription() {
  return `דוח יומי ל${DAY_NAMES_HE[new Date().getDay()]}`;
}

// ─── Section definitions ────────────────────────────────────────────────────

const SECTION_IDS = ["content", "review"] as const;
type SectionId = (typeof SECTION_IDS)[number];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewReportPage() {
  const router = useRouter();

  const [title, setTitle] = useState(getTodayTitle());
  const [subtitle, setSubtitle] = useState(getDayDescription());
  const [activeSection, setActiveSection] = useState<SectionId>("content");
  const [stationData, setStationData] = useState<StationData>(INITIAL_STATIONS);

  const sections: StepperSection[] = [
    { id: "content", label: "תוכן", icon: LayoutList },
    { id: "review", label: "סיכום ואישור", icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <StepperHeader
        icon={FileText}
        title={title}
        onTitleChange={setTitle}
        subtitle={subtitle}
        onSubtitleChange={setSubtitle}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={(id) => setActiveSection(id as SectionId)}
        backLabel="חזרה לדוחות"
        onBack={() => router.push("/reports")}
      />

      <div className="w-full px-6 py-8">
        {activeSection === "content" && (
          <StationTable data={stationData} onChange={setStationData} />
        )}

        {activeSection === "review" && (
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center text-slate-500">
            סיכום ואישור — בקרוב
          </div>
        )}
      </div>
    </div>
  );
}