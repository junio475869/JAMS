import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ImportJobsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [savedSettings, setSavedSettings] = useState([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [columnMapping, setColumnMapping] = useState({
    date: 0,
    skills: 2,
    company: 3,
    position: 4,
    url: 5,
    profile: 6,
  });

  useEffect(() => {
    // Load saved settings
    fetch("/api/sheet-settings")
      .then((res) => res.json())
      .then((data) => setSavedSettings(data))
      .catch(console.error);
  }, []);

  const columnOptions = [
    { label: "Applied Date", value: "date" },
    { label: "Skills", value: "skills" },
    { label: "Company", value: "company" },
    { label: "Position", value: "position" },
    { label: "URL", value: "url" },
    { label: "Profile", value: "profile" },
  ];

  const handleSaveSettings = async () => {
    try {
      const response = await fetch("/api/sheet-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, sheetUrl: url, columnMapping }),
      });
      if (!response.ok) throw new Error("Failed to save settings");

      const newSettings = await response.json();
      setSavedSettings([...savedSettings, newSettings]);
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const loadSettings = (setting) => {
    setName(setting.name);
    setEmail(setting.email);
    setUrl(setting.sheetUrl);
    setColumnMapping(setting.columnMapping);
  };

  const handleImport = async () => {
    if (!url.includes("docs.google.com/spreadsheets")) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid Google Sheets URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/applications/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url, columnMapping }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error);
      }

      const data = await response.json();
      toast({
        title: "Success",
        description: `Imported ${data.count} applications successfully`,
      });
      setIsOpen(false);
      queryClient.invalidateQueries(["applications"]);
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to import applications",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Import from Sheet</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Job Applications</DialogTitle>
          <DialogDescription>
            Enter sheet details and column mappings or select a saved
            configuration.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {savedSettings && savedSettings.length > 0 &&
              savedSettings.map((setting) => (
                <Button
                  key={setting.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSettings(setting)}
                >
                  {setting.name}
                </Button>
              ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              placeholder="Bidder Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              placeholder="Gmail Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Input
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            {columnOptions.map((option) => (
              <div key={option.value} className="flex flex-col gap-2">
                <label className="text-sm font-medium">{option.label}</label>
                <Input
                  type="number"
                  min="0"
                  value={columnMapping[option.value]}
                  onChange={(e) =>
                    setColumnMapping({
                      ...columnMapping,
                      [option.value]: parseInt(e.target.value) || 0,
                    })
                  }
                  placeholder="Column index"
                />
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleSaveSettings}
            disabled={!name || !email || !url}
          >
            Save Settings
          </Button>
          <Button onClick={handleImport} disabled={isLoading || !url}>
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
