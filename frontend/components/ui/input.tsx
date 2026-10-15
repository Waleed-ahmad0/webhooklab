import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full min-w-0 rounded-lg border-2 border-border-default bg-surface-raised px-3 py-2 text-base text-foreground placeholder:text-muted-foreground transition-colors duration-150 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none hover:border-border-strong focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
