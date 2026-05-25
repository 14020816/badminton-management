import Link from "next/link";
import { ClubRole } from "@prisma/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { AppHeader } from "@/components/layout/app-header";
import { formatVND } from "@/lib/format";
import { APP_NAME } from "@/lib/site-metadata";

export type UserClubCard = {
  clubId: string;
  clubName: string;
  clubSlug: string;
  role: ClubRole;
  memberCount: number;
  fundBalance: number;
};

export function ClubsDashboard({
  clubs,
  userName,
}: {
  clubs: UserClubCard[];
  userName?: string | null;
}) {
  return (
    <div className="theme-dark min-h-[100dvh] bg-[var(--canvas-dark)] p-4 text-[var(--on-dark)] md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <AppHeader userName={userName} title={APP_NAME} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHeader
            title="Nhóm cầu lông"
            description="Chọn nhóm để xem quỹ và sổ cái"
          />
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="h-4 w-4" />
              Tạo nhóm
            </Link>
          </Button>
        </div>

        {clubs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center text-[var(--muted)]">
              <p>Bạn chưa tham gia nhóm nào.</p>
              <p className="mt-2">Tạo nhóm mới hoặc dùng link mời từ thủ quỹ.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {clubs.map((club) => (
              <Card key={club.clubId}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{club.clubName}</span>
                    <span className="text-xs font-normal text-[var(--muted)]">
                      {club.role === ClubRole.ADMIN ? "Thủ quỹ" : "Lông thủ"}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Số dư quỹ</span>
                    <span className="font-number font-semibold text-[var(--primary)]">
                      {formatVND(club.fundBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--muted)]">Thành viên</span>
                    <span>{club.memberCount}</span>
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/g/${club.clubId}`}>Vào nhóm</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
