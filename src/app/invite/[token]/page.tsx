import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getInviteJoinData } from "@/actions/invites";
import { InviteJoinForm } from "@/components/invites/invite-join-form";
import { Button } from "@/components/ui/button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  const { token } = await params;
  const data = await getInviteJoinData(token);

  return {
    title: data ? `Tham gia CLB ${data.clubName}` : "Lời mời không hợp lệ",
  };
}

const pageClassName =
  "theme-dark flex min-h-[100dvh] items-center justify-center bg-[var(--canvas-dark)] p-4 text-[var(--on-dark)]";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getInviteJoinData(token);

  if (!data) {
    return (
      <div className={pageClassName}>
        <div className="text-center">
          <h1 className="text-xl font-semibold">Lời mời không hợp lệ</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Link đã hết hạn hoặc không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Về trang chủ</Link>
          </Button>
        </div>
      </div>
    );
  }

  const session = await auth();
  const callbackUrl = `/invite/${token}`;

  if (!session?.user) {
    return (
      <div className="theme-dark flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-[var(--canvas-dark)] p-4 text-[var(--on-dark)]">
        <div className="text-center">
          <h1 className="text-xl font-semibold">Tham gia {data.clubName}</h1>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Đăng nhập hoặc tạo tài khoản để tiếp tục
          </p>
        </div>
        <div className="flex gap-3">
          <Button asChild>
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Đăng nhập
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Đăng ký
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={pageClassName}>
      <InviteJoinForm
        token={token}
        clubName={data.clubName}
        userName={session.user.name}
        unlinkedMembers={data.unlinkedMembers}
      />
    </div>
  );
}
