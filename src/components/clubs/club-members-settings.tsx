"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { ClubRole, type MemberGender, type MemberRank } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MobileDataCard,
  MobileDataEmpty,
  MobileDataField,
  MobileDataFields,
  MobileDataList,
  ResponsiveDataView,
} from "@/components/ui/mobile-data-list";
import { PageHeader } from "@/components/layout/page-header";
import { MemberAddDialog } from "@/components/clubs/member-add-dialog";
import {
  MemberEditDialog,
  type EditableMember,
} from "@/components/clubs/member-edit-dialog";
import {
  formatMemberGender,
  formatMemberRank,
  isMemberActive,
  MEMBER_RANKS,
} from "@/lib/domain/member";
import { formatDate, formatVND } from "@/lib/format";
import { cn } from "@/lib/utils";

type SortKey =
  | "rank"
  | "name"
  | "sessionCount"
  | "totalPaid"
  | "totalPlayCost"
  | "remainingBalance"
  | "account"
  | "role";

type SortDir = "asc" | "desc";

const DEFAULT_SORT: { key: SortKey; dir: SortDir } = { key: "rank", dir: "asc" };

const DEFAULT_SORT_DIR: Record<SortKey, SortDir> = {
  rank: "asc",
  name: "asc",
  sessionCount: "desc",
  totalPaid: "desc",
  totalPlayCost: "desc",
  remainingBalance: "asc",
  account: "asc",
  role: "asc",
};

const SORT_OPTIONS: { value: `${SortKey}:${SortDir}`; label: string }[] = [
  { value: "rank:asc", label: "Hạng (S→D)" },
  { value: "name:asc", label: "Tên (A→Z)" },
  { value: "sessionCount:desc", label: "Buổi đánh (nhiều→ít)" },
  { value: "sessionCount:asc", label: "Buổi đánh (ít→nhiều)" },
  { value: "totalPaid:desc", label: "Đã đóng (cao→thấp)" },
  { value: "totalPaid:asc", label: "Đã đóng (thấp→cao)" },
  { value: "totalPlayCost:desc", label: "Chi phí (cao→thấp)" },
  { value: "totalPlayCost:asc", label: "Chi phí (thấp→cao)" },
  { value: "remainingBalance:asc", label: "Còn lại (âm→dương)" },
  { value: "remainingBalance:desc", label: "Còn lại (dương→âm)" },
  { value: "account:asc", label: "Tài khoản (A→Z)" },
  { value: "role:asc", label: "Vai trò" },
];

type MemberRow = {
  id: string;
  name: string;
  rank: MemberRank | null;
  gender: MemberGender | null;
  deactivatedAt: Date | string | null;
  deactivationReason: string | null;
  totalPaid: number;
  totalPlayCost: number;
  remainingBalance: number;
  sessionCount: number;
  membership: {
    role: ClubRole;
    user: { name: string | null; email: string };
  } | null;
};

function rankOrder(rank: MemberRank | null) {
  if (!rank) return MEMBER_RANKS.length;
  return MEMBER_RANKS.indexOf(rank);
}

function roleOrder(member: MemberRow) {
  if (!member.membership) return 2;
  if (member.membership.role === ClubRole.ADMIN) return 0;
  return 1;
}

function accountLabel(member: MemberRow) {
  if (!member.membership) return "";
  return (member.membership.user.name ?? member.membership.user.email).toLowerCase();
}

function compareMembers(a: MemberRow, b: MemberRow, key: SortKey) {
  switch (key) {
    case "rank":
      return rankOrder(a.rank) - rankOrder(b.rank) || a.name.localeCompare(b.name, "vi");
    case "name":
      return a.name.localeCompare(b.name, "vi");
    case "sessionCount":
      return a.sessionCount - b.sessionCount || a.name.localeCompare(b.name, "vi");
    case "totalPaid":
      return a.totalPaid - b.totalPaid || a.name.localeCompare(b.name, "vi");
    case "totalPlayCost":
      return a.totalPlayCost - b.totalPlayCost || a.name.localeCompare(b.name, "vi");
    case "remainingBalance":
      return (
        a.remainingBalance - b.remainingBalance || a.name.localeCompare(b.name, "vi")
      );
    case "account": {
      const aLinked = Boolean(a.membership);
      const bLinked = Boolean(b.membership);
      if (aLinked !== bLinked) return aLinked ? -1 : 1;
      return accountLabel(a).localeCompare(accountLabel(b), "vi");
    }
    case "role":
      return roleOrder(a) - roleOrder(b) || a.name.localeCompare(b.name, "vi");
  }
}

function sortMembers(
  members: MemberRow[],
  key: SortKey,
  dir: SortDir,
) {
  const sorted = [...members].sort((a, b) => compareMembers(a, b, key));
  const directed = dir === "desc" ? sorted.reverse() : sorted;
  const active = directed.filter((member) => isMemberActive(member));
  const inactive = directed.filter((member) => !isMemberActive(member));
  return [...active, ...inactive];
}

function SortableTableHead({
  label,
  sortKey,
  activeKey,
  activeDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey;
  activeDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = activeKey === sortKey;
  const Icon = isActive
    ? activeDir === "asc"
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={className}>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-1 font-medium transition-colors hover:text-[var(--primary)]",
          isActive && "text-[var(--primary)]",
          className?.includes("text-right") && "float-right",
        )}
        onClick={() => onSort(sortKey)}
      >
        {label}
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
      </button>
    </TableHead>
  );
}

function MemberBalance({
  balance,
  className,
}: {
  balance: number;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      <span
        className={cn(
          "font-number font-medium",
          balance < 0
            ? "text-trading-down"
            : balance > 0
              ? "text-trading-up"
              : "",
        )}
      >
        {formatVND(balance)}
      </span>
      {balance < 0 && (
        <Badge variant="destructive" className="shrink-0">
          Phải đóng thêm
        </Badge>
      )}
    </div>
  );
}

function MemberNameLink({
  clubId,
  memberId,
  name,
}: {
  clubId: string;
  memberId: string;
  name: string;
}) {
  return (
    <Link
      href={`/g/${clubId}/members/${memberId}`}
      className="font-medium text-[var(--primary)] hover:text-[var(--primary-active)] hover:underline"
    >
      {name}
    </Link>
  );
}

function MemberNameCell({
  clubId,
  member,
}: {
  clubId: string;
  member: MemberRow;
}) {
  const inactive = !isMemberActive(member);

  return (
    <div className={cn("space-y-1", inactive && "opacity-60")}>
      <div className="flex flex-wrap items-center gap-2">
        <MemberNameLink clubId={clubId} memberId={member.id} name={member.name} />
        {inactive && (
          <Badge variant="outline" className="shrink-0">
            Ngưng hoạt động
          </Badge>
        )}
      </div>
      {inactive && (
        <p className="text-xs text-[var(--color-muted-foreground)]">
          {member.deactivatedAt && (
            <span>Từ {formatDate(member.deactivatedAt)}</span>
          )}
          {member.deactivationReason && (
            <span>
              {member.deactivatedAt ? " · " : ""}
              {member.deactivationReason}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

function toEditableMember(member: MemberRow): EditableMember {
  return {
    id: member.id,
    name: member.name,
    rank: member.rank,
    gender: member.gender,
    deactivatedAt: member.deactivatedAt,
    deactivationReason: member.deactivationReason,
  };
}

function SessionCount({
  count,
  total,
}: {
  count: number;
  total: number;
}) {
  return (
    <span className="font-number">
      {count}
      <span className="text-[var(--color-muted-foreground)]">/{total}</span>
    </span>
  );
}

export function ClubMembersSettings({
  clubId,
  members,
  totalSessionCount,
}: {
  clubId: string;
  members: MemberRow[];
  totalSessionCount: number;
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditableMember | null>(null);
  const [needsTopupOnly, setNeedsTopupOnly] = useState(false);
  const [hideInactive, setHideInactive] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(DEFAULT_SORT.key);
  const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_SORT.dir);

  const needsTopupCount = useMemo(
    () => members.filter((member) => member.remainingBalance < 0).length,
    [members],
  );

  const inactiveCount = useMemo(
    () => members.filter((member) => !isMemberActive(member)).length,
    [members],
  );

  const filteredMembers = useMemo(() => {
    let result = members;
    if (needsTopupOnly) {
      result = result.filter((member) => member.remainingBalance < 0);
    }
    if (hideInactive) {
      result = result.filter((member) => isMemberActive(member));
    }
    return result;
  }, [members, needsTopupOnly, hideInactive]);

  const visibleMembers = useMemo(
    () => sortMembers(filteredMembers, sortKey, sortDir),
    [filteredMembers, sortKey, sortDir],
  );

  const sortValue = `${sortKey}:${sortDir}` as `${SortKey}:${SortDir}`;

  function handleSort(nextKey: SortKey) {
    if (nextKey === sortKey) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(nextKey);
    setSortDir(DEFAULT_SORT_DIR[nextKey]);
  }

  function handleSortSelect(value: string) {
    const [key, dir] = value.split(":") as [SortKey, SortDir];
    setSortKey(key);
    setSortDir(dir);
  }

  const listLabel =
    needsTopupOnly || hideInactive
      ? `${visibleMembers.length}/${members.length}`
      : String(members.length);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thành viên"
        description="Quản lý lông thủ trong nhóm và liên kết tài khoản"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Danh sách ({listLabel})</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {needsTopupCount > 0 && (
              <Button
                type="button"
                variant={needsTopupOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setNeedsTopupOnly((value) => !value)}
              >
                Cần đóng quỹ ({needsTopupCount})
              </Button>
            )}
            {inactiveCount > 0 && (
              <Button
                type="button"
                variant={hideInactive ? "default" : "outline"}
                size="sm"
                onClick={() => setHideInactive((value) => !value)}
              >
                Ẩn ngưng hoạt động ({inactiveCount})
              </Button>
            )}
            <Button size="sm" onClick={() => setAddOpen(true)}>
              Thêm thành viên
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 md:hidden">
            <Select value={sortValue} onValueChange={handleSortSelect}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ResponsiveDataView
            mobile={
              visibleMembers.length === 0 ? (
                <MobileDataEmpty>
                  {needsTopupOnly
                    ? "Không có thành viên cần đóng quỹ"
                    : hideInactive
                      ? "Không có thành viên đang hoạt động"
                      : "Chưa có thành viên"}
                </MobileDataEmpty>
              ) : (
                <MobileDataList>
                  {visibleMembers.map((member) => (
                    <MobileDataCard
                      key={member.id}
                      title={<MemberNameCell clubId={clubId} member={member} />}
                      actions={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingMember(toEditableMember(member))}
                        >
                          Sửa
                        </Button>
                      }
                    >
                      <MobileDataFields>
                        <MobileDataField label="Giới tính">
                          {formatMemberGender(member.gender)}
                        </MobileDataField>
                        <MobileDataField label="Hạng">
                          {member.rank ? (
                            <Badge variant="secondary">{member.rank}</Badge>
                          ) : (
                            formatMemberRank(member.rank)
                          )}
                        </MobileDataField>
                        <MobileDataField label="Buổi đánh">
                          <SessionCount
                            count={member.sessionCount}
                            total={totalSessionCount}
                          />
                        </MobileDataField>
                        <MobileDataField label="Đã đóng">
                          <span className="font-number">
                            {formatVND(member.totalPaid)}
                          </span>
                        </MobileDataField>
                        <MobileDataField label="Chi phí">
                          <span className="font-number">
                            {formatVND(member.totalPlayCost)}
                          </span>
                        </MobileDataField>
                        <MobileDataField label="Còn lại" fullWidth>
                          <MemberBalance balance={member.remainingBalance} />
                        </MobileDataField>
                        <MobileDataField label="Vai trò">
                          {member.membership?.role === ClubRole.ADMIN
                            ? "Thủ quỹ"
                            : member.membership
                              ? "Lông thủ"
                              : "—"}
                        </MobileDataField>
                        <MobileDataField label="Tài khoản" fullWidth>
                          {member.membership ? (
                            member.membership.user.name ??
                            member.membership.user.email
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">
                              Chưa liên kết
                            </span>
                          )}
                        </MobileDataField>
                      </MobileDataFields>
                    </MobileDataCard>
                  ))}
                </MobileDataList>
              )
            }
            desktop={
              <Table minWidth="56rem">
                <TableHeader>
                  <TableRow>
                    <SortableTableHead
                      label="Hạng"
                      sortKey="rank"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      className="w-16"
                    />
                    <SortableTableHead
                      label="Tên"
                      sortKey="name"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Buổi"
                      sortKey="sessionCount"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortableTableHead
                      label="Đã đóng"
                      sortKey="totalPaid"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortableTableHead
                      label="Chi phí"
                      sortKey="totalPlayCost"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortableTableHead
                      label="Còn lại"
                      sortKey="remainingBalance"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                      className="text-right"
                    />
                    <SortableTableHead
                      label="Tài khoản"
                      sortKey="account"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                    />
                    <SortableTableHead
                      label="Vai trò"
                      sortKey="role"
                      activeKey={sortKey}
                      activeDir={sortDir}
                      onSort={handleSort}
                    />
                    <TableHead className="w-24">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleMembers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="py-8 text-center text-[var(--color-muted-foreground)]"
                      >
                        {needsTopupOnly
                          ? "Không có thành viên cần đóng quỹ"
                          : hideInactive
                            ? "Không có thành viên đang hoạt động"
                            : "Chưa có thành viên"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    visibleMembers.map((member) => (
                      <TableRow
                        key={member.id}
                        className={cn(!isMemberActive(member) && "opacity-60")}
                      >
                        <TableCell>
                          {member.rank ? (
                            <Badge variant="secondary">{member.rank}</Badge>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">
                              {formatMemberRank(member.rank)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <MemberNameCell clubId={clubId} member={member} />
                        </TableCell>
                        <TableCell className="text-right">
                          <SessionCount
                            count={member.sessionCount}
                            total={totalSessionCount}
                          />
                        </TableCell>
                        <TableCell className="font-number text-right">
                          {formatVND(member.totalPaid)}
                        </TableCell>
                        <TableCell className="font-number text-right">
                          {formatVND(member.totalPlayCost)}
                        </TableCell>
                        <TableCell className="text-right">
                          <MemberBalance
                            balance={member.remainingBalance}
                            className="justify-end"
                          />
                        </TableCell>
                        <TableCell>
                          {member.membership ? (
                            <span>
                              {member.membership.user.name ??
                                member.membership.user.email}
                            </span>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">
                              Chưa liên kết
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {member.membership?.role === ClubRole.ADMIN
                            ? "Thủ quỹ"
                            : member.membership
                              ? "Lông thủ"
                              : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingMember(toEditableMember(member))}
                          >
                            Sửa
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            }
          />
        </CardContent>
      </Card>

      <MemberAddDialog clubId={clubId} open={addOpen} onOpenChange={setAddOpen} />

      <MemberEditDialog
        clubId={clubId}
        member={editingMember}
        open={editingMember !== null}
        onOpenChange={(open) => {
          if (!open) setEditingMember(null);
        }}
      />
    </div>
  );
}
