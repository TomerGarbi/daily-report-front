import type { LucideIcon } from "lucide-react";

/** A single step / section in the stepper */
export interface StepperSection {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional Lucide icon rendered next to the label */
  icon?: LucideIcon;
  /** Mark this step as completed */
  done?: boolean;
}

/** Props for the full StepperHeader (bar + stepper nav) */
export interface StepperHeaderProps {
  /** Page title (editable when `onTitleChange` is provided) */
  title: string;
  onTitleChange?: (value: string) => void;

  /** Optional subtitle line below the title */
  subtitle?: string;
  onSubtitleChange?: (value: string) => void;

  /** Optional third line (e.g. creator name) */
  meta?: string;
  onMetaChange?: (value: string) => void;

  /** Icon shown in the colored badge on the left */
  icon?: LucideIcon;

  /** Stepper sections */
  sections: StepperSection[];
  /** Currently active section id */
  activeSection: string;
  /** Called when the user clicks a section */
  onSectionChange: (id: string) => void;

  /** Back button config (hidden when omitted) */
  backLabel?: string;
  onBack?: () => void;
}
