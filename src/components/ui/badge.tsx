import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
          "border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
        variant === "secondary" &&
          "border-transparent bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]",
        variant === "destructive" &&
          "border-transparent bg-[var(--color-destructive)] text-white",
        variant === "outline" && "text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
