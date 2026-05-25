import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { getShuttleTypes } from "@/lib/data/dashboard";
import { ShuttleTypesForm } from "@/components/clubs/shuttle-types-form";

export const metadata: Metadata = {
  title: "Cầu lông",
};

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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách loại cầu</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[var(--color-muted-foreground)]">
            Mỗi loại cầu có giá theo hộp và số quả trong hộp (mặc định 12). Chi phí
            buổi đánh = số quả dùng × (giá hộp ÷ quả/hộp).
          </p>
          <ShuttleTypesForm
            clubId={clubId}
            initialTypes={shuttleTypes.map((type) => ({
              id: type.id,
              name: type.name,
              pricePerBlock: type.pricePerBlock,
              shuttlesPerBlock: type.shuttlesPerBlock,
              inventory: type.inventory,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
