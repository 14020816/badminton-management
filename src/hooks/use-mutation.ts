"use client";

import { useCallback, useTransition, type FormEvent } from "react";
import { runMutation } from "@/lib/mutation-toast";

export type MutationOptions = {
  successMessage?: string;
  successToast?: boolean;
  onSuccess?: () => void;
};

export function useMutationForm(
  action: (formData: FormData) => Promise<unknown>,
  {
    successMessage,
    successToast,
    onSuccess,
  }: MutationOptions,
) {
  const [pending, startTransition] = useTransition();

  const onSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      const formData = new FormData(form);

      startTransition(() => {
        void runMutation(() => action(formData), {
          successMessage,
          successToast,
          onSuccess,
        });
      });
    },
    [action, successMessage, successToast, onSuccess],
  );

  return { onSubmit, pending };
}

export function useMutationFn<T extends unknown[]>(
  action: (...args: T) => Promise<unknown>,
  {
    successMessage,
    successToast,
    onSuccess,
  }: MutationOptions,
) {
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    (...args: T) => {
      startTransition(() => {
        void runMutation(() => action(...args), {
          successMessage,
          successToast,
          onSuccess,
        });
      });
    },
    [action, successMessage, successToast, onSuccess],
  );

  return { run, pending };
}
