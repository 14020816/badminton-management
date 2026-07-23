"use client";

import * as React from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type MultiSelectOption = {
  value: string;
  label: string;
};

type MultiSelectProps = {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  id?: string;
};

const triggerClassName =
  "flex h-10 w-full items-center justify-between rounded-md border border-[var(--color-input)] bg-transparent px-3 py-2 text-sm text-[var(--color-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]";

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Chọn...",
  emptyMessage = "Không có mục",
  className,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const listboxId = React.useId();

  const label = React.useMemo(() => {
    if (value.length === 0) return placeholder;
    if (value.length === 1) {
      return options.find((option) => option.value === value[0])?.label ?? placeholder;
    }
    return `${value.length} đã chọn`;
  }, [options, placeholder, value]);

  function toggle(optionValue: string) {
    onChange(
      value.includes(optionValue)
        ? value.filter((current) => current !== optionValue)
        : [...value, optionValue],
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          className={cn(
            triggerClassName,
            value.length === 0 && "text-[var(--color-muted-foreground)]",
            className,
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        id={listboxId}
        className="w-[var(--radix-popover-trigger-width)] p-2"
        align="start"
        sideOffset={4}
      >
        {options.length === 0 ? (
          <p className="px-2 py-1.5 text-sm text-[var(--color-muted-foreground)]">
            {emptyMessage}
          </p>
        ) : (
          <div className="max-h-56 space-y-1 overflow-y-auto">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 hover:bg-[var(--color-accent)]"
              >
                <Checkbox
                  checked={value.includes(option.value)}
                  onCheckedChange={() => toggle(option.value)}
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
