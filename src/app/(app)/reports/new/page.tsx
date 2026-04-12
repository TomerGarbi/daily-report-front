
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, LayoutList, CheckCircle2, ArrowLeft, ArrowRight, Zap, Save } from "lucide-react";
import { StepperHeader } from "@/components/StepperHeader";
import type { StepperSection } from "@/components/StepperHeader";
import { StationTable } from "@/components/StationTable/StationTable";
import type { StationData } from "@/components/StationTable/StationTable";
import { Button } from "@/components/ui/button";

// ─── Fake station data ──────────────────────────────────────────────────────

const INITIAL_STATIONS: StationData = {
  "Haifa Power": [
    { stationNumber: 1, installedCapacity: 500, availableCapacity: 450, peakCapacity: 440, minReserveCapacity: 400, secondaryFuelPeakCapacity: 300, status: "Active", startTime: "2026-02-26T08:00:00Z" },
    { stationNumber: 2, installedCapacity: 500, availableCapacity: 480, peakCapacity: 470, minReserveCapacity: 420, secondaryFuelPeakCapacity: 350, status: "Active" },
    { stationNumber: 3, installedCapacity: 350, availableCapacity: 0, peakCapacity: 0, minReserveCapacity: 0, secondaryFuelPeakCapacity: 0, status: "Inactive" },
  ],
  "Ashdod Power": [
    { stationNumber: 1, installedCapacity: 600, availableCapacity: 600, peakCapacity: 590, minReserveCapacity: 550, secondaryFuelPeakCapacity: 400, status: "Active", startTime: "2026-02-26T06:30:00Z" },
    { stationNumber: 2, installedCapacity: 600, availableCapacity: 550, peakCapacity: 540, minReserveCapacity: 500, secondaryFuelPeakCapacity: 380, status: "Active", startTime: "2026-02-26T07:15:00Z" },
  ],
  "Orot Rabin": [
    { stationNumber: 1, installedCapacity: 700, availableCapacity: 700, peakCapacity: 690, minReserveCapacity: 650, secondaryFuelPeakCapacity: 500, status: "Active", startTime: "2026-02-25T22:00:00Z" },
    { stationNumber: 2, installedCapacity: 700, availableCapacity: 680, peakCapacity: 670, minReserveCapacity: 630, secondaryFuelPeakCapacity: 480, status: "Active", startTime: "2026-02-26T05:00:00Z" },
    { stationNumber: 3, installedCapacity: 700, availableCapacity: 0, peakCapacity: 0, minReserveCapacity: 0, secondaryFuelPeakCapacity: 0, status: "Maintenance" },
    { stationNumber: 4, installedCapacity: 700, availableCapacity: 690, peakCapacity: 685, minReserveCapacity: 640, secondaryFuelPeakCapacity: 490, status: "Active", startTime: "2026-02-26T04:30:00Z" },
  ],
  "Eshkol Power": [
    { stationNumber: 1, installedCapacity: 450, availableCapacity: 430, peakCapacity: 420, minReserveCapacity: 380, secondaryFuelPeakCapacity: 300, status: "Active", startTime: "2026-02-26T09:00:00Z" },
  ],
};

const INITIAL_GAS_STATIONS: StationData = {
  "Dalia Gas": [
    { stationNumber: 1, installedCapacity: 800, availableCapacity: 780, peakCapacity: 770, minReserveCapacity: 720, secondaryFuelPeakCapacity: 600, status: "Active", startTime: "2026-02-26T06:00:00Z" },
    { stationNumber: 2, installedCapacity: 800, availableCapacity: 750, peakCapacity: 740, minReserveCapacity: 700, secondaryFuelPeakCapacity: 580, status: "Active", startTime: "2026-02-26T06:45:00Z" },
  ],
  "Ramat Hovav Gas": [
    { stationNumber: 1, installedCapacity: 400, availableCapacity: 400, peakCapacity: 395, minReserveCapacity: 370, secondaryFuelPeakCapacity: 280, status: "Active", startTime: "2026-02-26T05:00:00Z" },
    { stationNumber: 2, installedCapacity: 400, availableCapacity: 0, peakCapacity: 0, minReserveCapacity: 0, secondaryFuelPeakCapacity: 0, status: "Maintenance" },
  ],
};

const INITIAL_RENEWABLE_STATIONS: StationData = {
  "Ashalim Solar": [
    { stationNumber: 1, installedCapacity: 121, availableCapacity: 110, peakCapacity: 105, minReserveCapacity: 90, secondaryFuelPeakCapacity: 0, status: "Active", startTime: "2026-02-26T07:30:00Z" },
  ],
  "Halutziot Wind": [
    { stationNumber: 1, installedCapacity: 200, availableCapacity: 180, peakCapacity: 175, minReserveCapacity: 150, secondaryFuelPeakCapacity: 0, status: "Active", startTime: "2026-02-26T04:00:00Z" },
    { stationNumber: 2, installedCapacity: 200, availableCapacity: 0, peakCapacity: 0, minReserveCapacity: 0, secondaryFuelPeakCapacity: 0, status: "Inactive" },
  ],
  "Ketura Sun": [
    { stationNumber: 1, installedCapacity: 80, availableCapacity: 75, peakCapacity: 72, minReserveCapacity: 60, secondaryFuelPeakCapacity: 0, status: "Active", startTime: "2026-02-26T08:00:00Z" },
  ],
};

const INITIAL_ELECTRIC_STATIONS: StationData = {
  "תחנת רוטנברג": [
    { stationNumber: 1, installedCapacity: 560, availableCapacity: 540, peakCapacity: 530, minReserveCapacity: 500, secondaryFuelPeakCapacity: 400, status: "Active", startTime: "2026-02-26T05:30:00Z" },
    { stationNumber: 2, installedCapacity: 560, availableCapacity: 520, peakCapacity: 510, minReserveCapacity: 480, secondaryFuelPeakCapacity: 380, status: "Active", startTime: "2026-02-26T06:00:00Z" },
    { stationNumber: 3, installedCapacity: 560, availableCapacity: 0, peakCapacity: 0, minReserveCapacity: 0, secondaryFuelPeakCapacity: 0, status: "Maintenance" },
  ],
  "תחנת רדינג": [
    { stationNumber: 1, installedCapacity: 350, availableCapacity: 340, peakCapacity: 335, minReserveCapacity: 310, secondaryFuelPeakCapacity: 250, status: "Active", startTime: "2026-02-26T07:00:00Z" },
    { stationNumber: 2, installedCapacity: 350, availableCapacity: 350, peakCapacity: 345, minReserveCapacity: 320, secondaryFuelPeakCapacity: 260, status: "Active", startTime: "2026-02-26T04:45:00Z" },
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

const SECTION_IDS = ["content", "electric", "review"] as const;
type SectionId = (typeof SECTION_IDS)[number];

// ─── Page ───────────────────────────────────────────────────────────────────

export default function NewReportPage() {
  const router = useRouter();

  const [title, setTitle] = useState(getTodayTitle());
  const [subtitle, setSubtitle] = useState(getDayDescription());
  const [activeSection, setActiveSection] = useState<SectionId>("content");
  const [stationData, setStationData] = useState<StationData>(INITIAL_STATIONS);
  const [gasData, setGasData] = useState<StationData>(INITIAL_GAS_STATIONS);
  const [renewableData, setRenewableData] = useState<StationData>(INITIAL_RENEWABLE_STATIONS);
  const [electricData, setElectricData] = useState<StationData>(INITIAL_ELECTRIC_STATIONS);

  const sections: StepperSection[] = [
    { id: "content", label: "יחידות פרטיות", icon: LayoutList },
    { id: "electric", label: "חברת חשמל", icon: Zap },
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
          <div className="space-y-8">
            <StationTable title="תחנות כוח קונבנציונליות" data={stationData} onChange={setStationData} />
            <StationTable title="תחנות גז טבעי" data={gasData} onChange={setGasData} />
            <StationTable title="תחנות אנרגיה מתחדשת" data={renewableData} onChange={setRenewableData} />

            <div className="flex justify-end">
              <Button size="lg" onClick={() => setActiveSection("electric")} className="gap-2 text-base px-8">
                <span>חברת חשמל</span>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {activeSection === "electric" && (
          <div className="space-y-8">
            <StationTable title="חברת חשמל" data={electricData} onChange={setElectricData} />

            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setActiveSection("content")} className="gap-2 text-base px-8">
                <ArrowRight className="h-5 w-5" />
                <span>חזרה ליחידות פרטיות</span>
              </Button>
              <Button size="lg" onClick={() => setActiveSection("review")} className="gap-2 text-base px-8">
                <span>סיכום ואישור</span>
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {activeSection === "review" && (
          <div className="space-y-8">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-8 text-center text-slate-500">
              סיכום ואישור — בקרוב
            </div>

            <div className="flex justify-between">
              <Button size="lg" variant="outline" onClick={() => setActiveSection("electric")} className="gap-2 text-base px-8">
                <ArrowRight className="h-5 w-5" />
                <span>חזרה לחברת חשמל</span>
              </Button>
              <Button
                size="lg"
                onClick={() => {
                  console.log("Report data:", {
                    title,
                    subtitle,
                    stationData,
                    gasData,
                    renewableData,
                    electricData,
                  });
                }}
                className="gap-2 text-base px-8"
              >
                <Save className="h-5 w-5" />
                <span>שמור דוח</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}