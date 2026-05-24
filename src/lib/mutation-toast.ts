import { toast } from "sonner";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export function getMutationErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string") return error;
  return "Có lỗi xảy ra. Vui lòng thử lại.";
}

export type RunMutationOptions = {
  successMessage?: string;
  /** When false, only errors show a toast (e.g. actions that redirect on success). */
  successToast?: boolean;
  onSuccess?: () => void;
};

export async function runMutation<T>(
  fn: () => Promise<T>,
  options: RunMutationOptions = {},
): Promise<T | undefined> {
  const { successMessage, successToast = true, onSuccess } = options;

  try {
    const result = await fn();
    if (successToast && successMessage) {
      toast.success(successMessage);
    }
    onSuccess?.();
    return result;
  } catch (error) {
    if (isRedirectError(error)) throw error;
    toast.error(getMutationErrorMessage(error));
    return undefined;
  }
}
