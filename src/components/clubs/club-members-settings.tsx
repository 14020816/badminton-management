"use client";

import { useState } from "react";
import { ClubRole, type MemberRank } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatMemberRank } from "@/lib/domain/member";

type MemberRow = {
  id: string;
  name: string;
  rank: MemberRank | null;
  membership: {
    role: ClubRole;
    user: { name: string | null; email: string };
  } | null;
};

export function ClubMembersSettings({
  clubId,
  members,
}: {
  clubId: string;
  members: MemberRow[];
}) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<EditableMember | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thành viên"
        description="Quản lý lông thủ trong nhóm và liên kết tài khoản"
      />

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Danh sách ({members.length})</CardTitle>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            Thêm thành viên
          </Button>
        </CardHeader>
        <CardContent>
          <ResponsiveDataView
            mobile={
              members.length === 0 ? (
                <MobileDataEmpty>Chưa có thành viên</MobileDataEmpty>
              ) : (
                <MobileDataList>
                  {members.map((member) => (
                    <MobileDataCard
                      key={member.id}
                      title={member.name}
                      actions={
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditingMember({
                              id: member.id,
                              name: member.name,
                              rank: member.rank,
                            })
                          }
                        >
                          Sửa
                        </Button>
                      }
                    >
                      <MobileDataFields>
                        <MobileDataField label="Hạng">
                          {member.rank ? (
                            <Badge variant="secondary">{member.rank}</Badge>
                          ) : (
                            formatMemberRank(member.rank)
                          )}
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
              <Table minWidth="36rem">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Hạng</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Tài khoản</TableHead>
                    <TableHead>Vai trò</TableHead>
                    <TableHead className="w-24">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="py-8 text-center text-[var(--color-muted-foreground)]"
                      >
                        Chưa có thành viên
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.rank ? (
                            <Badge variant="secondary">{member.rank}</Badge>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">
                              {formatMemberRank(member.rank)}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{member.name}</TableCell>
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
                            onClick={() =>
                              setEditingMember({
                                id: member.id,
                                name: member.name,
                                rank: member.rank,
                              })
                            }
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
