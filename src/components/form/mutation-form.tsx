"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { useMutationForm, type MutationOptions } from "@/hooks/use-mutation";

type MutationFormProps = MutationOptions &
  Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
    action: (formData: FormData) => Promise<unknown>;
    children: ReactNode;
  };

export function MutationForm({
  action,
  successMessage,
  successToast,
  onSuccess,
  children,
  ...formProps
}: MutationFormProps) {
  const { onSubmit, pending } = useMutationForm(action, {
    successMessage,
    successToast,
    onSuccess,
  });

  return (
    <form {...formProps} onSubmit={onSubmit} aria-busy={pending}>
      {children}
    </form>
  );
}
