import { LogoutButton } from "@/components/layout/logout-button";

export function AppHeader({
  userName,
  title = "B15 Cầu lông",
}: {
  userName?: string | null;
  title?: string;
}) {
  return (
    <header className="mb-6 flex items-center justify-between gap-4 border-b border-[var(--hairline-on-dark)] pb-4">
      <div className="min-w-0">
        <p className="text-base font-semibold text-[var(--primary)]">{title}</p>
        {userName && (
          <p className="mt-0.5 truncate text-sm text-[var(--muted)]">{userName}</p>
        )}
      </div>
      <LogoutButton className="shrink-0" />
    </header>
  );
}
