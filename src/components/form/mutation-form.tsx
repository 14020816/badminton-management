"use client";

import {
  createContext,
  useContext,
  type FormHTMLAttributes,
  type ReactNode,
} from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useMutationForm, type MutationOptions } from "@/hooks/use-mutation";

type MutationFormContextValue = {
  pending: boolean;
};

const MutationFormContext = createContext<MutationFormContextValue | null>(
  null,
);

export function useMutationFormContext() {
  const context = useContext(MutationFormContext);
  if (!context) {
    throw new Error("SubmitButton must be used within MutationForm");
  }
  return context;
}

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
    <MutationFormContext.Provider value={{ pending }}>
      <form {...formProps} onSubmit={onSubmit} aria-busy={pending}>
        {children}
      </form>
    </MutationFormContext.Provider>
  );
}

export function SubmitButton({
  children,
  pendingText,
  loading,
  disabled,
  ...props
}: ButtonProps & { pendingText?: string }) {
  const { pending } = useMutationFormContext();
  const isLoading = loading ?? pending;

  return (
    <Button
      type="submit"
      {...props}
      loading={isLoading}
      disabled={disabled || isLoading}
    >
      {isLoading && pendingText ? pendingText : children}
    </Button>
  );
}
