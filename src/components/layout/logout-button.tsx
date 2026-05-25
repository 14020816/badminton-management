"use client";

import { LogOut } from "lucide-react";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { logoutAction } from "@/actions/auth";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  variant = "ghost",
}: {
  className?: string;
  variant?: "ghost" | "outline" | "secondary";
}) {
  return (
    <MutationForm action={logoutAction} successToast={false}>
      <SubmitButton
        pendingText="Đang đăng xuất..."
        variant={variant}
        className={cn("gap-2", className)}
      >
        <LogOut className="h-4 w-4" />
        Đăng xuất
      </SubmitButton>
    </MutationForm>
  );
}
