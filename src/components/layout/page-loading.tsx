import { Skeleton } from "@/components/ui/skeleton";

export function PageLoadingShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {children}
    </div>
  );
}

export function TablePageLoading({ rows = 6 }: { rows?: number }) {
  return (
    <PageLoadingShell>
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-xl" />
        <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
          <div className="space-y-0 border-b border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3">
            <Skeleton className="h-4 w-full" />
          </div>
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-4 border-b border-[var(--color-border)] p-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </PageLoadingShell>
  );
}

export function DashboardPageLoading() {
  return (
    <PageLoadingShell>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
      <Skeleton className="h-96 rounded-xl" />
    </PageLoadingShell>
  );
}

export function FormPageLoading() {
  return (
    <PageLoadingShell>
      <Skeleton className="h-96 rounded-xl" />
    </PageLoadingShell>
  );
}

export function AuthPageLoading() {
  return (
    <div className="theme-dark flex min-h-[100dvh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--canvas-dark)] p-6">
        <Skeleton className="mx-auto h-8 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
