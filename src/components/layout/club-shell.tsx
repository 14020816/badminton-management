"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ClubRole } from "@prisma/client";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavLinks } from "@/components/layout/nav-links";
import { clubNavItems } from "@/components/layout/nav-items";
import { LogoutButton } from "@/components/layout/logout-button";
import { FormSelect } from "@/components/form/form-select";

type ClubSummary = {
  clubId: string;
  clubName: string;
};

export function ClubShell({
  clubId,
  clubName,
  role,
  userName,
  userClubs,
  readonly = false,
  loginHref,
  children,
}: {
  clubId: string;
  clubName: string;
  role: ClubRole;
  userName?: string | null;
  userClubs: ClubSummary[];
  readonly?: boolean;
  loginHref?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = clubNavItems(clubId);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <div className="theme-dark flex min-h-[100dvh] flex-col md:flex-row">
      <aside className="hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-[var(--hairline-on-dark)] bg-[var(--canvas-dark)] md:flex">
        <SidebarHeader
          clubName={clubName}
          userName={userName}
          role={role}
          readonly={readonly}
        />
        {!readonly && userClubs.length > 1 && (
          <ClubSwitcher clubs={userClubs} currentClubId={clubId} className="px-4 pb-2" />
        )}
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <NavLinks
            items={navItems}
            role={role}
            showHomeLink={!readonly}
            className="flex-1"
          />
          {readonly && loginHref ? (
            <GuestLoginLink href={loginHref} />
          ) : (
            <SidebarLogout />
          )}
        </div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-[var(--hairline-on-dark)] bg-[var(--canvas-dark)] px-4 pt-[env(safe-area-inset-top)] md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 text-[var(--body)]"
          onClick={() => setMenuOpen(true)}
          aria-label="Mở menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[var(--primary)]">
            {clubName}
          </p>
          <p className="truncate text-xs text-[var(--muted)]">
            {readonly
              ? "Chế độ xem công khai"
              : `${userName ?? "Người dùng"} · ${role === ClubRole.ADMIN ? "Thủ quỹ" : "Lông thủ"}`}
          </p>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Đóng menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[min(280px,85vw)] flex-col bg-[var(--canvas-dark)] shadow-xl">
            <div className="flex items-start justify-between gap-2 border-b border-[var(--hairline-on-dark)] px-4 py-4">
              <SidebarHeader
                clubName={clubName}
                userName={userName}
                role={role}
                readonly={readonly}
                compact
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {!readonly && userClubs.length > 1 && (
              <ClubSwitcher
                clubs={userClubs}
                currentClubId={clubId}
                className="px-4 py-2"
              />
            )}
            <div className="flex flex-1 flex-col overflow-y-auto p-4">
              <NavLinks
                items={navItems}
                role={role}
                showHomeLink={!readonly}
                onNavigate={() => setMenuOpen(false)}
                className="flex-1"
              />
              {readonly && loginHref ? (
                <GuestLoginLink href={loginHref} />
              ) : (
                <SidebarLogout />
              )}
            </div>
          </aside>
        </div>
      )}

      <main className="min-w-0 flex-1 overflow-x-hidden bg-[var(--color-background)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[var(--color-foreground)] md:p-8">
        {children}
      </main>
    </div>
  );
}

function SidebarHeader({
  clubName,
  userName,
  role,
  readonly,
  compact,
}: {
  clubName: string;
  userName?: string | null;
  role: ClubRole;
  readonly?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "min-w-0 flex-1" : "border-b border-[var(--hairline-on-dark)] px-6 py-5"
      }
    >
      <h1 className="text-base font-semibold text-[var(--primary)]">{clubName}</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">
        {readonly
          ? "Chế độ xem công khai"
          : `${userName ?? "Người dùng"} · ${role === ClubRole.ADMIN ? "Thủ quỹ" : "Lông thủ"}`}
      </p>
    </div>
  );
}

function ClubSwitcher({
  clubs,
  currentClubId,
  className,
}: {
  clubs: ClubSummary[];
  currentClubId: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-xs text-[var(--muted)]">Chuyển nhóm</label>
      <FormSelect
        value={currentClubId}
        onValueChange={(clubId) => {
          window.location.href = `/g/${clubId}`;
        }}
        options={clubs.map((club) => ({
          value: club.clubId,
          label: club.clubName,
        }))}
      />
    </div>
  );
}

function SidebarLogout() {
  return (
    <div className="mt-4 border-t border-[var(--hairline-on-dark)] pt-4">
      <LogoutButton className="w-full justify-start text-[var(--body)] hover:bg-[var(--surface-card-dark)] hover:text-[var(--on-dark)]" />
    </div>
  );
}

function GuestLoginLink({ href }: { href: string }) {
  return (
    <div className="mt-4 border-t border-[var(--hairline-on-dark)] pt-4">
      <Link
        href={href}
        className="flex h-10 w-full items-center justify-center rounded-md bg-[var(--primary)] px-3 text-sm font-semibold text-[var(--on-primary)] hover:bg-[var(--primary-active)]"
      >
        Đăng nhập để chỉnh sửa
      </Link>
    </div>
  );
}
