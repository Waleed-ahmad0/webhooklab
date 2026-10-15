import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex w-fit max-w-full shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border-2 border-accent bg-accent text-accent-foreground hover:border-white hover:bg-white shadow-sm disabled:border-border-default disabled:bg-surface-raised disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        primary:
          "border-2 border-accent bg-accent text-accent-foreground hover:border-white hover:bg-white shadow-sm disabled:border-border-default disabled:bg-surface-raised disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        destructive:
          "bg-red-500/10 text-red-300 border-2 border-red-400/40 hover:bg-red-500/20",
        outline:
          "border-2 border-border-default bg-surface text-foreground hover:border-border-strong hover:bg-surface-elevated",
        secondary:
          "border-2 border-border-default bg-surface-raised text-foreground hover:border-border-strong hover:bg-surface-elevated",
        ghost:
          "text-secondary-foreground hover:bg-surface-elevated hover:text-foreground",
        link: "text-secondary-foreground underline-offset-4 hover:text-foreground hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-6",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
