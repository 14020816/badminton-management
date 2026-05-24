"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createInviteAction } from "@/actions/invites";
import { runMutation } from "@/lib/mutation-toast";

export function InviteLinkSection({ clubId }: { clubId: string }) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    const token = await runMutation(() => createInviteAction(clubId), {
      successMessage: "Đã tạo và sao chép link mời",
    });
    setLoading(false);
    if (!token) return;

    const url = `${window.location.origin}/invite/${token}`;
    setInviteUrl(url);
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may fail; link is still shown below.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lời mời thành viên</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Tạo link mời — thành viên có thể đăng nhập hoặc đăng ký rồi tham gia nhóm.
          Link hết hạn sau 7 ngày.
        </p>
        <Button type="button" onClick={handleCreate} disabled={loading}>
          {loading ? "Đang tạo..." : "Tạo và sao chép link"}
        </Button>
        {inviteUrl && (
          <p className="break-all rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
            {inviteUrl}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
