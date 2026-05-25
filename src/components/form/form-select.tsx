"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

const EMPTY_SENTINEL = "__form_select_empty__";

function toInternalValue(value: string) {
  return value === "" ? EMPTY_SENTINEL : value;
}

function toExternalValue(value: string) {
  return value === EMPTY_SENTINEL ? "" : value;
}

type FormSelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  options: FormSelectOption[];
  className?: string;
};

export function FormSelect({
  id,
  name,
  value: controlledValue,
  defaultValue = "",
  onValueChange,
  required,
  disabled,
  placeholder,
  options,
  className,
}: FormSelectProps) {
  const isControlled = controlledValue !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue);
  const value = isControlled ? controlledValue : internalValue;

  function handleChange(next: string) {
    const external = toExternalValue(next);
    if (!isControlled) {
      setInternalValue(external);
    }
    onValueChange?.(external);
  }

  const selectValue = toInternalValue(value);

  return (
    <>
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required && !value}
        />
      ) : null}
      <Select
        value={selectValue || undefined}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={id} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={option.value || EMPTY_SENTINEL}
              value={toInternalValue(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

export const nativeSelectClassName = cn(
  "flex h-10 w-full appearance-none rounded-md border border-[var(--color-input)]",
  "bg-transparent px-3 py-2 text-sm text-[var(--color-foreground)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);
