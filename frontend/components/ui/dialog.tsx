"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => unknown;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  variant?: "dialog" | "drawer";
}

export function Dialog({ open, onClose, title, description, children, className, variant = "dialog" }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;

    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
      className={cn("app-dialog w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-xl border-2 border-border-default bg-surface p-0 text-foreground shadow-2xl", variant === "drawer" && "app-drawer", className)}
    >
      <div className="flex shrink-0 items-start gap-3 border-b border-border-subtle px-4 py-4 sm:px-6">
        <div className="min-w-0 flex-1 py-1">
          <h2 id={titleId} className="break-words text-lg font-semibold tracking-tight">{title}</h2>
          {description && <div id={descriptionId} className="mt-1 break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">{description}</div>}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog" className="-mr-2 -mt-1">
          <X className="h-5 w-5" aria-hidden="true" />
        </Button>
      </div>
      <div className={variant === "drawer" ? "flex min-h-0 flex-1 flex-col overflow-y-auto" : "p-4 sm:p-6"}>{open && children}</div>
    </dialog>
  );
}
