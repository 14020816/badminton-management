"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClubRole } from "@prisma/client";
import { cn } from "@/lib/utils";
import { filterNavItems, type NavItem } from "@/components/layout/nav-items";

function isNavItemActive(pathname: string, href: string) {
  if (pathname === href) return true;
  // Club dashboard (/g/{clubId}) must not prefix-match every club route.
  if (/^\/g\/[^/]+$/.test(href)) return false;
  if (href === "/") return false;
  return pathname.startsWith(`${href}/`);
}

function isSectionActive(
  pathname: string,
  item: NavItem,
  visibleChildren: NavItem["children"],
) {
  if (visibleChildren?.length) {
    const childActive = visibleChildren.some((child) =>
      isNavItemActive(pathname, child.href),
    );
    const prefixActive = item.matchPrefix
      ? isNavItemActive(pathname, item.matchPrefix)
      : false;
    return childActive || prefixActive;
  }

  return isNavItemActive(pathname, item.href);
}

export function NavLinks({
  items,
  role,
  onNavigate,
  className,
  showHomeLink,
}: {
  items: NavItem[];
  role: ClubRole;
  onNavigate?: () => void;
  className?: string;
  showHomeLink?: boolean;
}) {
  const pathname = usePathname();
  const filtered = filterNavItems(items, role);

  return (
    <nav className={cn("space-y-1", className)}>
      {showHomeLink && (
        <Link
          href="/"
          onClick={onNavigate}
          className={cn(
            "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
            pathname === "/"
              ? "bg-[var(--primary)] text-[var(--on-primary)]"
              : "text-[var(--body)] hover:bg-[var(--surface-card-dark)]",
          )}
        >
          Tất cả nhóm
        </Link>
      )}
      {filtered.map((item) => {
        const Icon = item.icon;
        const visibleChildren = item.children?.filter(
          (child) => !child.adminOnly || role === ClubRole.ADMIN,
        );
        const sectionActive = isSectionActive(pathname, item, visibleChildren);
        const hasChildren = Boolean(visibleChildren?.length);

        return (
          <div key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                hasChildren
                  ? sectionActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--body)] hover:bg-[var(--surface-card-dark)]"
                  : sectionActive
                    ? "bg-[var(--primary)] text-[var(--on-primary)]"
                    : "text-[var(--body)] hover:bg-[var(--surface-card-dark)]",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
            {visibleChildren && visibleChildren.length > 0 && (
              <div className="mt-1 ml-5 space-y-0.5 border-l border-[var(--hairline-on-dark)] pl-2">
                {visibleChildren.map((child) => {
                  const childActive = isNavItemActive(pathname, child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex min-h-9 items-center rounded-md px-3 text-sm transition-colors",
                        childActive
                          ? "bg-[var(--primary)] font-medium text-[var(--on-primary)]"
                          : "text-[var(--muted)] hover:bg-[var(--surface-card-dark)] hover:text-[var(--body)]",
                      )}
                    >
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
