import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Đăng ký",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl ?? "/";

  return (
    <div className="theme-dark flex min-h-[100dvh] items-center justify-center bg-[var(--canvas-dark)] p-4 text-[var(--on-dark)]">
      <Card className="w-full max-w-md border-[var(--hairline-on-dark)]">
        <CardHeader>
          <CardTitle>Đăng ký</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm callbackUrl={redirectTo} />
        </CardContent>
      </Card>
    </div>
  );
}
