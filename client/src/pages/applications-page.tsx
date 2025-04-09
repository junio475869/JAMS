import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import KanbanBoard from "@/components/ui/kanban-board";
import { Plus, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApplicationStatus } from "@shared/schema";

export default function ApplicationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [status, setStatus] = useState(ApplicationStatus.APPLIED);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["/api/applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }
      return response.json();
    },
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  const createApplicationMutation = useMutation({
    mutationFn: async (newApplication: any) => {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newApplication),
      });
      if (!response.ok) throw new Error("Failed to create application");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Application created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateApplicationStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!company || !position)
      return setError("Company and position are required.");
    if (url && !url.startsWith("http"))
      return setError("URL must start with http or https.");
    if (notes.length > 500)
      return setError("Notes must be less than 500 characters.");

    const newApplication = { company, position, status, url, notes };
    createApplicationMutation.mutate(newApplication);
  };

  const handleDrop = async (applicationId: number, newStatus: string) => {
    updateApplicationStatusMutation.mutate({
      id: applicationId,
      status: newStatus,
    });
  };

  // Filter applications based on search and status
  const filteredApplications =
    applications &&
    applications?.filter((app) => {
      const matchesSearch =
        !searchQuery ||
        app.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
        app.position.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filterStatus === "all" || app.status === filterStatus;

      return matchesSearch && matchesFilter;
    });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage all your job applications
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3">
          <div className="relative mb-2 sm:mb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search applications..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <Select
            value={filterStatus || ""}
            onValueChange={(value) => setFilterStatus(value || null)}
          >
            <SelectTrigger className="w-[180px] mb-2 sm:mb-0">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={ApplicationStatus.APPLIED}>Applied</SelectItem>
              <SelectItem value={ApplicationStatus.INTERVIEW}>
                Interview
              </SelectItem>
              <SelectItem value={ApplicationStatus.OFFER}>Offer</SelectItem>
              <SelectItem value={ApplicationStatus.REJECTED}>
                Rejected
              </SelectItem>
            </SelectContent>
          </Select>
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>Add New Application</DialogTitle>
                  <DialogDescription>
                    Fill out the details for your new job application.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      placeholder="Enter company name"
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      placeholder="Enter job position"
                      onChange={(e) => setPosition(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      defaultValue={ApplicationStatus.APPLIED}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ApplicationStatus.APPLIED}>
                          Applied
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.INTERVIEW}>
                          Interview
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.OFFER}>
                          Offer
                        </SelectItem>
                        <SelectItem value={ApplicationStatus.REJECTED}>
                          Rejected
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="url">Job Posting URL</Label>
                    <Input
                      id="url"
                      placeholder="Enter job posting URL"
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <textarea
                      id="notes"
                      placeholder="Enter any notes about this application"
                      className="min-h-[100px] rounded-md border bg-background p-3"
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">Save Application</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[200px] w-full" />
        </div>
      ) : (
        <KanbanBoard applications={applications} onDrop={handleDrop} />
      )}
    </div>
  );
}
