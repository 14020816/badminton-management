import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getShuttleTypes } from "@/lib/data/dashboard";
import { ShuttleTypesForm } from "@/components/clubs/shuttle-types-form";

export default async function ClubSettingsShuttlesPage({
  params,
}: {
  params: Promise<{ clubId: string }>;
}) {
  const { clubId } = await params;
  const shuttleTypes = await getShuttleTypes(clubId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cầu lông"
        description="Cấu hình giá cầu, số quả mỗi hộp và tồn kho"
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Cấu hình cầu lông</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Mỗi loại cầu có giá theo hộp và số quả trong hộp (mặc định 12). Chi phí buổi
            đánh = số quả dùng × (giá hộp ÷ quả/hộp).
          </p>
          <ShuttleTypesForm
            clubId={clubId}
            initialTypes={shuttleTypes.map((t) => ({
              id: t.id,
              name: t.name,
              pricePerBlock: t.pricePerBlock,
              shuttlesPerBlock: t.shuttlesPerBlock,
              inventory: t.inventory,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
