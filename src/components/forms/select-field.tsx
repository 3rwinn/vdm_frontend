import { useField } from "formik";
import { useId } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
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

  // Function to split array into chunks of 5
  const splitArrayIntoChunks = (array: Option[], chunkSize: number) => {
    return array.reduce((result, item, index) => {
      const chunkIndex = Math.floor(index / chunkSize);
      if (!result[chunkIndex]) {
        result[chunkIndex] = [];
      }
      result[chunkIndex].push(item);
      return result;
    }, []);
  };

  const chunks = options.length > 5 ? splitArrayIntoChunks(options, 5) : [options];

  return (
    <div className={cn("space-y-2.5", containerClassName)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <Select
        value={field.value}
        disabled={disabled}
        onValueChange={(value) => {
          helpers.setValue(value);
          helpers.setTouched(true, false);
          onValueChange?.(value);
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
          {chunks.map((chunk, index) => (
            <SelectGroup key={index}>
              <SelectLabel>{index + 1}</SelectLabel>
              {chunk.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
          
        </SelectContent>
      </Select>
      {showError ? (
        <p className="text-xs font-medium text-destructive">{meta.error}</p>
      ) : null}
    </div>
  );
}
