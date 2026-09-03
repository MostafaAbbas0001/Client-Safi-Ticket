import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-card group-[.toaster]:border-line group-[.toaster]:bg-surface group-[.toaster]:text-ink group-[.toaster]:shadow-overlay",
          title: "group-[.toast]:text-[13px] group-[.toast]:font-semibold",
          description: "group-[.toast]:text-[12px] group-[.toast]:text-ink-muted",
          actionButton:
            "group-[.toast]:rounded-field group-[.toast]:bg-brand group-[.toast]:text-white",
          cancelButton:
            "group-[.toast]:rounded-field group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-success",
          error: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-danger",
          loading: "group-[.toaster]:border-l-[3px] group-[.toaster]:border-l-brand",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
