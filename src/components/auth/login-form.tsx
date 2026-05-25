"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { loginAction } from "@/actions/auth";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <MutationForm
        action={loginAction}
        successToast={false}
        className="space-y-4"
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="email" required>
            Email
          </Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <Input id="password" name="password" type="password" required />
        </div>
        <SubmitButton pendingText="Đang đăng nhập..." className="w-full">
          Đăng nhập
        </SubmitButton>
      </MutationForm>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Chưa có tài khoản?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-primary underline hover:text-(--primary-active)"
        >
          Đăng ký
        </Link>
      </p>
    </>
  );
}
