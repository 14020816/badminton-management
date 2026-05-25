"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MutationForm, SubmitButton } from "@/components/form/mutation-form";
import { registerAction } from "@/actions/auth";

export function RegisterForm({ callbackUrl }: { callbackUrl: string }) {
  return (
    <>
      <MutationForm
        action={registerAction}
        successToast={false}
        className="space-y-4"
      >
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <div className="space-y-2">
          <Label htmlFor="name" required>
            Tên
          </Label>
          <Input id="name" name="name" required />
        </div>
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
          <Input id="password" name="password" type="password" minLength={6} required />
        </div>
        <SubmitButton pendingText="Đang đăng ký..." className="w-full">
          Đăng ký
        </SubmitButton>
      </MutationForm>
      <p className="mt-4 text-center text-sm text-[var(--muted)]">
        Đã có tài khoản?{" "}
        <Link
          href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-[var(--primary)] underline hover:text-[var(--primary-active)]"
        >
          Đăng nhập
        </Link>
      </p>
    </>
  );
}
