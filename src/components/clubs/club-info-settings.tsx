"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { ClubLinkSection } from "@/components/clubs/club-link-section";
import { InviteLinkSection } from "@/components/clubs/invite-link-section";
import { MutationForm } from "@/components/form/mutation-form";
import { updateClubNameAction } from "@/actions/clubs";

export function ClubInfoSettings({
  clubId,
  clubName,
}: {
  clubId: string;
  clubName: string;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Thông tin"
        description="Link chia sẻ và lời mời tham gia nhóm"
      />

      <Card>
        <CardHeader>
          <CardTitle>Nhóm</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <MutationForm
              action={updateClubNameAction.bind(null, clubId)}
              successMessage="Đã lưu tên nhóm"
              className="space-y-4"
              onSuccess={() => {
                setIsEditing(false);
                router.refresh();
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="name" required>
                  Tên nhóm
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={clubName}
                  placeholder="VD: B15 Cầu lông"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">Lưu</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                >
                  Hủy
                </Button>
              </div>
            </MutationForm>
          ) : (
            <div>
              <p className="text-sm text-[var(--muted)]">Tên nhóm</p>
              <div className="mt-1 flex items-center justify-between gap-4">
                <p className="text-base font-medium">{clubName}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Sửa
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ClubLinkSection clubId={clubId} />
        <InviteLinkSection clubId={clubId} />
      </div>
    </div>
  );
}
