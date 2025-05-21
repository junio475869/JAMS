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

interface GmailAccount {
  email: string;
  isSelected: boolean;
}

interface GmailAccountFilterProps {
  accounts: GmailAccount[];
  onFilterChange: (selectedEmails: string[]) => void;
}

export const GmailAccountFilter: React.FC<GmailAccountFilterProps> = ({
  accounts,
  onFilterChange,
}) => {
  const [open, setOpen] = React.useState(false);
  const selectedEmails = accounts
    .filter((a) => a.isSelected)
    .map((a) => a.email);

  const handleSelect = (email: string) => {
    const newSelectedEmails = selectedEmails.includes(email)
      ? selectedEmails.filter((e) => e !== email)
      : [...selectedEmails, email];
    onFilterChange(newSelectedEmails);
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
            {selectedEmails.length > 0
              ? selectedEmails.length + " accounts selected"
              : "Select Gmail accounts..."}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search Gmail accounts..." />
            <CommandEmpty>No accounts found.</CommandEmpty>
            <CommandGroup>
              {accounts.map((account) => (
                <CommandItem
                  key={account.email}
                  onSelect={() => handleSelect(account.email)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedEmails.includes(account.email)
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  {account.email}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};
