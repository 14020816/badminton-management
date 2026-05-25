import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function ResponsiveDataView({
  mobile,
  desktop,
  breakpoint = "md",
}: {
  mobile: ReactNode;
  desktop: ReactNode;
  breakpoint?: "sm" | "md";
}) {
  const mobileClass = breakpoint === "md" ? "md:hidden" : "sm:hidden";
  const desktopClass =
    breakpoint === "md" ? "hidden md:block" : "hidden sm:block";

  return (
    <>
      <div className={mobileClass}>{mobile}</div>
      <div className={desktopClass}>{desktop}</div>
    </>
  );
}

export function MobileDataList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("space-y-2", className)}>{children}</ul>;
}

export function MobileDataCard({
  children,
  title,
  actions,
  className,
  subdued = false,
}: {
  children: ReactNode;
  title?: ReactNode;
  actions?: ReactNode;
  className?: string;
  subdued?: boolean;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border border-[var(--color-border)] p-3",
        subdued
          ? "bg-[var(--color-accent)]/40"
          : "bg-[var(--color-card)]",
        className,
      )}
    >
      {(title || actions) && (
        <div className="mb-2 flex items-start justify-between gap-2">
          {title ? (
            <div className="min-w-0 text-sm font-medium">{title}</div>
          ) : (
            <span />
          )}
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
      )}
      {children}
    </li>
  );
}

export function MobileDataFields({
  children,
  columns = 2,
}: {
  children: ReactNode;
  columns?: 1 | 2;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-3 gap-y-2 text-xs",
        columns === 2 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {children}
    </dl>
  );
}

export function MobileDataField({
  label,
  children,
  fullWidth = false,
  valueClassName,
}: {
  label: string;
  children: ReactNode;
  fullWidth?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className={fullWidth ? "col-span-2" : undefined}>
      <dt className="text-[var(--color-muted-foreground)]">{label}</dt>
      <dd className={cn("mt-0.5 text-sm", valueClassName)}>{children}</dd>
    </div>
  );
}

export function MobileDataEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
      {children}
    </p>
  );
}

export function MobileEditorField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-xs text-[var(--color-muted-foreground)]">
        {label}
      </span>
      {children}
    </div>
  );
}
