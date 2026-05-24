"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm } from "@/components/form/mutation-form";
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
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue="admin@b15.local"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" required>
            Mật khẩu
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            defaultValue="admin123"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Đăng nhập
        </Button>
      </MutationForm>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Chưa có tài khoản?{" "}
        <Link
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-[var(--primary)] underline hover:text-[var(--primary-active)]"
        >
          Đăng ký
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-[var(--muted)]">
        Demo: admin@b15.local / admin123
      </p>
    </>
  );
}
