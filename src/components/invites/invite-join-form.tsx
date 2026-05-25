"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { FormSelect } from "@/components/form/form-select";
import { acceptInviteAction } from "@/actions/invites";

type UnlinkedMember = { id: string; name: string };

export function InviteJoinForm({
  token,
  clubName,
  userName,
  unlinkedMembers,
}: {
  token: string;
  clubName: string;
  userName?: string | null;
  unlinkedMembers: UnlinkedMember[];
}) {
  const hasUnlinked = unlinkedMembers.length > 0;

  return (
    <Card className="w-full max-w-md border-[var(--hairline-on-dark)]">
      <CardHeader>
        <CardTitle>Tham gia {clubName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasUnlinked ? (
          <MutationForm
            action={acceptInviteAction.bind(null, token)}
            successToast={false}
            className="space-y-4"
          >
            <input type="hidden" name="mode" value="link" />
            <div className="space-y-2">
              <Label required>Chọn tên trên sổ cái</Label>
              <FormSelect
                name="memberId"
                required
                placeholder="Chọn lông thủ"
                options={unlinkedMembers.map((member) => ({
                  value: member.id,
                  label: member.name,
                }))}
              />
            </div>
            <SubmitButton pendingText="Đang tham gia..." className="w-full">
              Liên kết và tham gia
            </SubmitButton>
          </MutationForm>
        ) : null}

        <div className={hasUnlinked ? "border-t pt-6" : ""}>
          <MutationForm
            action={acceptInviteAction.bind(null, token)}
            successToast={false}
            className="space-y-4"
          >
            <input type="hidden" name="mode" value="create" />
            <div className="space-y-2">
              <Label htmlFor="displayName" required={!hasUnlinked}>
                {hasUnlinked ? "Hoặc dùng tên mới" : "Tên hiển thị trong nhóm"}
              </Label>
              <Input
                id="displayName"
                name="displayName"
                defaultValue={userName ?? ""}
                placeholder="Tên của bạn"
                required={!hasUnlinked}
              />
            </div>
            <SubmitButton
              pendingText="Đang tham gia..."
              variant={hasUnlinked ? "secondary" : "default"}
              className="w-full"
            >
              {hasUnlinked ? "Tạo tên mới và tham gia" : "Tham gia nhóm"}
            </SubmitButton>
          </MutationForm>
        </div>
      </CardContent>
    </Card>
  );
}
