"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ClubLinkSection({ clubId }: { clubId: string }) {
  const [copied, setCopied] = useState(false);
  const clubUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/g/${clubId}`
      : `/g/${clubId}`;

  async function handleCopy() {
    const url = `${window.location.origin}/g/${clubId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may fail; URL is still shown below.
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link xem công khai</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Ai có link này đều có thể xem nhóm ở chế độ chỉ đọc — không cần đăng nhập.
        </p>
        <Button type="button" onClick={handleCopy}>
          {copied ? "Đã sao chép" : "Sao chép link"}
        </Button>
        <p className="break-all rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] p-3 text-sm">
          {clubUrl}
        </p>
      </CardContent>
    </Card>
  );
}
