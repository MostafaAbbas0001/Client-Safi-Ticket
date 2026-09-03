import type { ComponentPropsWithoutRef } from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";

export interface SheetContentProps extends ComponentPropsWithoutRef<typeof SheetPrimitive.Content> {
  side?: "top" | "bottom" | "left" | "right" | null;
  showOverlay?: boolean;
}
