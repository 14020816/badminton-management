export type AddressFields = {
  address: string | null;
  googleAddressUrl: string | null;
};

export function parseAddressFields(formData: FormData): AddressFields {
  const address = String(formData.get("address") ?? "").trim() || null;
  const googleAddressUrl =
    String(formData.get("googleAddressUrl") ?? "").trim() || null;
  return { address, googleAddressUrl };
}
