import { Toaster as Sonner } from "sonner";
import { CircleAlert, CircleCheck, Info, LoaderCircle, TriangleAlert } from "lucide-react";
import type { ToasterProps } from "@/models";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      offset={{ top: 18 }}
      mobileOffset={{ top: 10, left: 10, right: 10 }}
      gap={10}
      duration={3500}
      visibleToasts={4}
      swipeDirections={["left", "right", "top"]}
      icons={{
        success: <CircleCheck className="h-5 w-5" />,
        error: <CircleAlert className="h-5 w-5" />,
        info: <Info className="h-5 w-5" />,
        warning: <TriangleAlert className="h-5 w-5" />,
        loading: <LoaderCircle className="h-5 w-5 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:w-[min(420px,calc(100vw-20px))] group-[.toaster]:rounded-card group-[.toaster]:border group-[.toaster]:border-line group-[.toaster]:bg-surface group-[.toaster]:px-4 group-[.toaster]:py-3.5 group-[.toaster]:text-ink group-[.toaster]:shadow-overlay",
          content: "group-[.toast]:gap-0.5",
          icon: "group-[.toast]:self-start group-[.toast]:pt-0.5",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-semibold group-[.toast]:leading-5",
          description:
            "group-[.toast]:text-[12px] group-[.toast]:leading-5 group-[.toast]:text-ink-muted",
          actionButton:
            "group-[.toast]:rounded-field group-[.toast]:bg-brand group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:rounded-field group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success:
            "group-[.toaster]:!border-success/30 group-[.toaster]:!bg-emerald-50 group-[.toaster]:!text-success-strong",
          error:
            "group-[.toaster]:!border-danger/30 group-[.toaster]:!bg-rose-50 group-[.toaster]:!text-danger-strong",
          info: "group-[.toaster]:!border-brand/25 group-[.toaster]:!bg-brand-soft group-[.toaster]:!text-brand-strong",
          warning:
            "group-[.toaster]:!border-amber-300 group-[.toaster]:!bg-amber-50 group-[.toaster]:!text-amber-700",
          loading:
            "group-[.toaster]:!border-brand/25 group-[.toaster]:!bg-brand-soft group-[.toaster]:!text-brand",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
