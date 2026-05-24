import { ClubRole } from "@prisma/client";
import { getClubViewAccess } from "@/lib/club-context";
import { getDashboardData } from "@/lib/data/dashboard";
import { DashboardView } from "@/components/dashboard/dashboard-view";

export default async function ClubDashboardPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const { access } = await getClubViewAccess(clubId);
  const data = await getDashboardData(clubId);
  const isAdmin = access?.role === ClubRole.ADMIN;

  return (
    <DashboardView
      clubId={clubId}
      fundSummary={data.fundSummary}
      expenseBreakdown={data.expenseBreakdown}
      memberLedger={data.memberLedger}
      sessionCount={data.sessionCount}
      upcomingItem={data.upcomingItem}
      isAdmin={isAdmin}
      currentMemberId={access?.memberId}
      showFullLedger={!access || isAdmin}
    />
  );
}
