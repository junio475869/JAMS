import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import KanbanBoard from "@/components/ui/kanban-board";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationStatus } from "@shared/schema";
import { cn } from "@/lib/utils";

const STATUSES = [
  { id: ApplicationStatus.APPLIED, label: 'Applied', color: 'bg-blue-500' },
  { id: ApplicationStatus.INTERVIEW, label: 'Interview', color: 'bg-yellow-500' },
  { id: ApplicationStatus.OFFER, label: 'Offer', color: 'bg-green-500' },
  { id: ApplicationStatus.REJECTED, label: 'Rejected', color: 'bg-red-500' }
];

export default function ApplicationsPage() {
  const [activeTab, setActiveTab] = useState(ApplicationStatus.APPLIED);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["applications"],
    queryFn: async () => {
      const response = await fetch("/api/applications");
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  const applications = data?.applications || [];

  const handleDrop = async (applicationId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update status");
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Status updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Applications</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search applications..."
              className="pl-10 w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-4 bg-transparent">
          {STATUSES.map(status => {
            const count = applications.filter(app => app.status === status.id).length;
            return (
              <TabsTrigger
                key={status.id}
                value={status.id}
                className={cn(
                  "flex items-center justify-between p-4 border rounded-lg",
                  activeTab === status.id && "border-primary"
                )}
              >
                <span>{status.label}</span>
                <span className={cn("px-2 py-1 rounded text-sm", status.color)}>
                  {count}
                </span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="mt-6">
          <KanbanBoard
            applications={applications.filter(app => app.status === activeTab)}
            onDrop={handleDrop}
            onApplicationClick={(id) => window.location.href = `/applications/${id}`}
          />
        </div>
      </Tabs>
    </div>
  );
}