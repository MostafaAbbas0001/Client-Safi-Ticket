import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Disables the field and swaps the chevron for a spinner. */
  loading?: boolean;
}
