"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

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

export const nativeSelectClassName = cn(
  "flex h-10 w-full appearance-none rounded-md border border-[var(--color-input)]",
  "bg-transparent px-3 py-2 pr-8 text-sm text-[var(--color-foreground)]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

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

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const next = event.target.value;
    if (!isControlled) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  }

  return (
    <div className="relative min-w-0">
      <select
        id={id}
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        onChange={handleChange}
        className={cn(nativeSelectClassName, className)}
      >
        {placeholder ? (
          <option value="" disabled={required}>
            {placeholder}
          </option>
        ) : null}
        {options.map((option) => (
          <option
            key={option.value || "__empty__"}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50"
      />
    </div>
  );
}
