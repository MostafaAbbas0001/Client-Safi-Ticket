import type { ReactNode, RefObject } from "react";

export interface MenuFieldProps {
  /** Small caption shown above the field. Omit when a label already exists elsewhere. */
  label?: string;
  value: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
  fieldRef: RefObject<HTMLDivElement | null>;
  id?: string;
  disabled?: boolean;
  /** Disables the field and swaps the chevron for a spinner. */
  loading?: boolean;
  className?: string;
  menuClassName?: string;
}
