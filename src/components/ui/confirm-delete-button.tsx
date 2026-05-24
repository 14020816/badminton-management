"use client";

import { useState, type ReactNode } from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { useMutationFn } from "@/hooks/use-mutation";

export function ConfirmDeleteButton({
  title,
  description,
  successMessage,
  onConfirm,
  onSuccess,
  children = "Xóa",
  ...buttonProps
}: Omit<ButtonProps, "onClick" | "type"> & {
  title: string;
  description: ReactNode;
  successMessage?: string;
  onConfirm: () => Promise<unknown>;
  onSuccess?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const { run, pending } = useMutationFn(onConfirm, {
    successMessage,
    onSuccess: () => {
      setOpen(false);
      onSuccess?.();
    },
  });

  return (
    <>
      <Button type="button" {...buttonProps} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <ConfirmDeleteDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        description={description}
        pending={pending}
        onConfirm={() => run()}
      />
    </>
  );
}
