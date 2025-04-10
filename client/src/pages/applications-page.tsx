
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplicationStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImportJobsDialog from "@/components/import-jobs-dialog";
import { Pagination } from "@/components/ui/pagination";

const ITEMS_PER_PAGE = 10;

export default function ApplicationsPage() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState(ApplicationStatus.APPLIED);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["applications", activeTab, page, searchQuery, sortField, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        status: activeTab,
        page: page.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        sortBy: sortField,
        sortOrder: sortOrder,
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/applications?${params}`);
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
  });

  const applications = data?.applications || [];
  const totalPages = data?.totalPages || 1;

  const handleSort = (field: string) => {
    setSortOrder(sortField === field && sortOrder === "asc" ? "desc" : "asc");
    setSortField(field);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setPage(1); // Reset to first page on new search
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    setActiveTab(status);
    setPage(1); // Reset to first page on status change
  };

  const handleDeleteApplications = async () => {
    try {
      const response = await fetch("/api/applications/cleanup", {
        method: "DELETE",
      });
      const data = await response.json();
      toast({
        title: "Cleanup Complete",
        description: `Removed ${data.removedCount} invalid applications`,
      });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cleanup applications",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Search applications..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-64"
          />
          <Button onClick={() => setLocation("/applications/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>
          <Button variant="outline" onClick={handleDeleteApplications}>
            Cleanup
          </Button>
          <ImportJobsDialog />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => handleStatusChange(value as ApplicationStatus)}>
        <TabsList>
          <TabsTrigger value={ApplicationStatus.APPLIED}>Applied</TabsTrigger>
          <TabsTrigger value={ApplicationStatus.INTERVIEW}>Interview</TabsTrigger>
          <TabsTrigger value={ApplicationStatus.OFFER}>Offer</TabsTrigger>
          <TabsTrigger value={ApplicationStatus.REJECTED}>Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          {isLoading ? (
            <div className="space-y-4">
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("company")}
                    >
                      Company
                      <span className="ml-2">
                        {sortField === "company" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("position")}
                    >
                      Position
                      <span className="ml-2">
                        {sortField === "position" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("location")}
                    >
                      Location
                      <span className="ml-2">
                        {sortField === "location" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer"
                      onClick={() => handleSort("appliedDate")}
                    >
                      Applied Date
                      <span className="ml-2">
                        {sortField === "appliedDate" && (sortOrder === "asc" ? "↑" : "↓")}
                      </span>
                    </TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => (
                    <TableRow
                      key={app.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/applications/${app.id}`)}
                    >
                      <TableCell>{app.company}</TableCell>
                      <TableCell>{app.position}</TableCell>
                      <TableCell>{app.location || "N/A"}</TableCell>
                      <TableCell>
                        {new Date(app.appliedDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs
                            ${app.status === ApplicationStatus.APPLIED ? "bg-blue-500/20 text-blue-500" :
                              app.status === ApplicationStatus.INTERVIEW ? "bg-yellow-500/20 text-yellow-500" :
                              app.status === ApplicationStatus.OFFER ? "bg-green-500/20 text-green-500" :
                              "bg-red-500/20 text-red-500"}`
                          }
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {applications.length} of {data?.totalItems || 0} applications
                </div>
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                  />
                )}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
