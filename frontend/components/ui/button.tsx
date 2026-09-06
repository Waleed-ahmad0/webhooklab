import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm",
        primary:
          "bg-white text-zinc-950 hover:bg-zinc-200 shadow-sm",
        destructive:
          "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20",
        outline:
          "border border-white/[0.1] bg-transparent text-white hover:bg-white/[0.05]",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700",
        ghost:
          "text-zinc-400 hover:bg-white/[0.05] hover:text-white",
        link: "text-zinc-300 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
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
