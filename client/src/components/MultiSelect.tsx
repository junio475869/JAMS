import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  label: string;
  value: string;
  color?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  onFilterChange: (selectedOptions: MultiSelectOption[]) => void;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  options,
  onFilterChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const [selectedOptions, setSelectedOptions] = React.useState<
    MultiSelectOption[]
  >(options);

  const handleSelect = (option: MultiSelectOption) => {
    if (option.value === "") {
      setSelectedOptions(options);
      onFilterChange(options);
      return;
    }
    const newSelectedOptions = selectedOptions.some(
      (o) => o.value === option.value
    )
      ? selectedOptions.filter((o) => o.value !== option.value)
      : [...selectedOptions, option];
    setSelectedOptions(newSelectedOptions);
    onFilterChange(newSelectedOptions);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-xs flex-wrap"
          >
            {selectedOptions.length > 0
              ? selectedOptions.length + " options selected"
              : "Select options..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandEmpty>No options found.</CommandEmpty>
            <CommandGroup>
              { options.length > 0 && (
                <CommandItem
                  key={""}
                  onSelect={() => handleSelect({ label: "All", value: "" })}
                >
                  All
                </CommandItem>
              )}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedOptions.some(
                        (o) => o.value === option.value
                      )
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <Badge variant="outline" className={cn(
                    "ml-0",
                    option.color && `${option.color}`
                  )}
                  >
                    {option.label}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
