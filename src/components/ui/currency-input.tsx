"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  formatCurrencyInput,
  formatVND,
  parseCurrency,
} from "@/lib/format";

type CurrencyInputProps = Omit<
  React.ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  name?: string;
  allowNegative?: boolean;
};

export function CurrencyInput({
  value,
  defaultValue = 0,
  onValueChange,
  name,
  className,
  disabled,
  readOnly,
  id,
  required,
  onFocus,
  onBlur,
  allowNegative = false,
  ...props
}: CurrencyInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const numericValue = isControlled ? value : internalValue;

  const [displayValue, setDisplayValue] = React.useState(() =>
    formatCurrencyInput(numericValue),
  );
  const [isFocused, setIsFocused] = React.useState(false);

  React.useEffect(() => {
    if (isFocused) return;
    setDisplayValue(formatCurrencyInput(numericValue));
  }, [isFocused, numericValue]);

  function normalizeValue(raw: string) {
    let parsed = parseCurrency(raw);
    if (!allowNegative && parsed < 0) parsed = 0;
    return parsed;
  }

  function commit(raw: string) {
    const parsed = normalizeValue(raw);
    if (!isControlled) setInternalValue(parsed);
    onValueChange?.(parsed);
    setDisplayValue(formatCurrencyInput(parsed));
  }

  if (readOnly || disabled) {
    return (
      <>
        {name ? <input type="hidden" name={name} value={numericValue} /> : null}
        <Input
          {...props}
          id={id}
          type="text"
          readOnly={readOnly}
          disabled={disabled}
          value={formatVND(numericValue)}
          className={cn("font-number text-left", className)}
        />
      </>
    );
  }

  return (
    <>
      {name ? <input type="hidden" name={name} value={numericValue} /> : null}
      <Input
        {...props}
        id={id}
        type="text"
        inputMode="numeric"
        required={required}
        value={displayValue}
        className={cn("font-number text-left", className)}
        onFocus={(event) => {
          setIsFocused(true);
          setDisplayValue(numericValue === 0 ? "" : String(numericValue));
          onFocus?.(event);
        }}
        onChange={(event) => {
          const raw = event.target.value;
          setDisplayValue(raw);
          const parsed = normalizeValue(raw);
          if (!isControlled) setInternalValue(parsed);
          onValueChange?.(parsed);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          commit(event.target.value);
          onBlur?.(event);
        }}
      />
    </>
  );
}
