import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-border-subtle bg-surface-raised text-secondary-foreground",
        primary:
          "border-border-strong bg-surface-raised text-foreground",
        success:
          "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
        warning:
          "border-amber-500/20 bg-amber-500/10 text-amber-400",
        destructive:
          "border-red-500/20 bg-red-500/10 text-red-400",
        outline:
          "border-border-default text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
