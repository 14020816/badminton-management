import { PageHeader } from "@/components/layout/page-header";
import { getSessionSchedules } from "@/actions/session-schedules";
import { SessionSchedulesForm } from "@/components/clubs/session-schedules-form";

export default async function ClubSettingsSchedulePage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const sessionSchedules = await getSessionSchedules(clubId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lịch đánh"
        description="Lịch cố định hàng tuần để ghi nhận buổi đánh nhanh"
      />

      <SessionSchedulesForm clubId={clubId} schedules={sessionSchedules} />
    </div>
  );
}
