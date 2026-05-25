import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";

  return (
    <div className="theme-dark flex min-h-[100dvh] items-center justify-center bg-[var(--canvas-dark)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] text-[var(--on-dark)]">
      <Card className="w-full max-w-md border-[var(--hairline-on-dark)] shadow-none">
        <CardHeader>
          <CardTitle>Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm callbackUrl={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}
