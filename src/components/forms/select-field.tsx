import { useField } from "formik";
import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
}

export function SelectField({
  name,
  label,
  placeholder = "Sélectionner",
  options,
  containerClassName,
  className,
}: SelectFieldProps) {
  const [field, meta, helpers] = useField(name);
  const id = useId();
  const showError = meta.touched && meta.error;

  return (
    <div className={cn("space-y-2.5", containerClassName)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Select
        value={field.value}
        onValueChange={(value) => {
          helpers.setValue(value);
          helpers.setTouched(true, false);
        }}
      >
        <SelectTrigger
          id={id}
          className={cn(
            className,
            showError && "border-destructive focus-visible:ring-destructive/40",
            "mt-2"
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showError ? (
        <p className="text-xs font-medium text-destructive">{meta.error}</p>
      ) : null}
    </div>
  );
}
