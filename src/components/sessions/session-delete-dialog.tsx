"use client";

import { useRouter } from "next/navigation";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { deleteSessionAction } from "@/actions/sessions";
import { formatSessionDate } from "@/lib/format";
import { useMutationFn } from "@/hooks/use-mutation";

export function SessionDeleteDialog({
  clubId,
  session,
  open,
  onOpenChange,
  redirectTo,
}: {
  clubId: string;
  session: { id: string; date: Date } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  redirectTo?: string;
}) {
  const router = useRouter();
  const { run, pending } = useMutationFn(
    async () => {
      if (!session) return;
      await deleteSessionAction(clubId, session.id);
    },
    {
      successMessage: "Đã xóa buổi đánh",
      onSuccess: () => {
        onOpenChange(false);
        if (redirectTo) router.push(redirectTo);
      },
    },
  );

  if (!session) return null;

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xóa buổi đánh?"
      description={
        <>
          Buổi đánh ngày {formatSessionDate(session.date)} sẽ bị xóa. Hành động
          này không thể hoàn tác.
        </>
      }
      pending={pending}
      onConfirm={() => run()}
    />
  );
}
