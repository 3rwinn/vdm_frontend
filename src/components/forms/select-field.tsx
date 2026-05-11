import { useField } from "formik";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  name: string;
  label: string;
  placeholder?: string;
  options: Option[];
  containerClassName?: string;
  className?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}

export function SelectField({
  name,
  label,
  placeholder = "Sélectionner",
  options,
  containerClassName,
  className,
  onValueChange,
  disabled,
}: SelectFieldProps) {
  const [field, meta, helpers] = useField(name);
  const id = useId();
  const showError = meta.touched && meta.error;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === field.value) ?? null,
    [options, field.value]
  );

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(normalized)
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const timer = window.setTimeout(() => {
      searchRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSelect = (value: string) => {
    helpers.setValue(value);
    helpers.setTouched(true, false);
    onValueChange?.(value);
    setOpen(false);
  };

  return (
    <div className={cn("space-y-2.5", containerClassName)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
        <PopoverTrigger asChild>
          <button
            id={id}
            type="button"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            onBlur={() => helpers.setTouched(true, true)}
            className={cn(
              "mt-2 flex h-11 w-full items-center justify-between rounded-lg border border-input bg-background px-3 text-sm shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60b5c2]/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              showError && "border-destructive focus-visible:ring-destructive/40",
              className
            )}
          >
            <span
              className={cn(
                "truncate text-left",
                !selectedOption && "text-muted-foreground"
              )}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-[var(--radix-popover-trigger-width)] p-0"
        >
          <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher…"
              className="h-9 border-0 px-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filteredOptions.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                Aucun résultat
              </p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = option.value === field.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-foreground transition hover:bg-accent hover:text-accent-foreground",
                      isSelected && "bg-accent/60"
                    )}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? (
                      <Check className="ml-2 h-4 w-4 shrink-0 text-[#026c7a]" />
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      {showError ? (
        <p className="text-xs font-medium text-destructive">{meta.error}</p>
      ) : null}
    </div>
  );
}
