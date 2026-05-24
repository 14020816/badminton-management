import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddressFields({
  idPrefix = "",
  defaultAddress = "",
  defaultGoogleAddressUrl = "",
}: {
  idPrefix?: string;
  defaultAddress?: string;
  defaultGoogleAddressUrl?: string;
}) {
  return (
    <>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}address`}>Địa chỉ</Label>
        <Input
          id={`${idPrefix}address`}
          name="address"
          defaultValue={defaultAddress}
          placeholder="VD: Sân cầu lông ABC, Quận 1"
        />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor={`${idPrefix}googleAddressUrl`}>Link Google Maps</Label>
        <Input
          id={`${idPrefix}googleAddressUrl`}
          name="googleAddressUrl"
          type="url"
          defaultValue={defaultGoogleAddressUrl}
          placeholder="https://maps.google.com/..."
        />
      </div>
    </>
  );
}

export function AddressDisplay({
  address,
  googleAddressUrl,
}: {
  address: string | null;
  googleAddressUrl: string | null;
}) {
  if (!address && !googleAddressUrl) return null;

  return (
    <p className="sm:col-span-2">
      <span className="text-[var(--color-muted-foreground)]">Địa chỉ: </span>
      {googleAddressUrl ? (
        <a
          href={googleAddressUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-[var(--primary)] hover:text-[var(--primary-active)]"
        >
          {address ?? googleAddressUrl}
        </a>
      ) : (
        address
      )}
    </p>
  );
}
