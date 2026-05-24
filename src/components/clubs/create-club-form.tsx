"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/layout/page-header";
import { AppHeader } from "@/components/layout/app-header";
import { MutationForm } from "@/components/form/mutation-form";
import { createClubAction } from "@/actions/clubs";

export function CreateClubForm({ userName }: { userName?: string | null }) {
  return (
    <div className="theme-dark min-h-[100dvh] bg-[var(--canvas-dark)] p-4 text-[var(--on-dark)] md:p-8">
      <div className="mx-auto max-w-lg space-y-6">
        <AppHeader userName={userName} />
        <PageHeader title="Tạo nhóm mới" description="Bạn sẽ là thủ quỹ của nhóm này" />
        <Card>
          <CardHeader>
            <CardTitle>Thông tin nhóm</CardTitle>
          </CardHeader>
          <CardContent>
            <MutationForm action={createClubAction} successToast={false} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" required>
                  Tên nhóm
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="VD: B15 Cầu lông"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Tạo nhóm
              </Button>
            </MutationForm>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
