import { useState } from "react";
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
  const [url, setUrl] = useState(() => localStorage.getItem("jobSheetUrl") || "");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const saveSheetUrl = (newUrl: string) => {
    localStorage.setItem("jobSheetUrl", newUrl);
    setUrl(newUrl);
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
        body: JSON.stringify({ url }),
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
      setUrl("");
      // Refresh applications list
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Job Applications</DialogTitle>
          <DialogDescription>
            Enter a Google Sheets URL to import job applications. The sheet must
            be publicly accessible with columns for date, count, skills, company,
            position, url, profile and other details.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Input
            placeholder="https://docs.google.com/spreadsheets/d/..."
            value={url}
            onChange={(e) => saveSheetUrl(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={isLoading}>
            {isLoading ? "Importing..." : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
