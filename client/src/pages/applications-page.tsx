
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplicationStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ImportJobsDialog from "@/components/import-jobs-dialog";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 10;

export default function ApplicationsPage() {
  const [_, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("all");
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
        status: activeTab !== "all" ? activeTab : "",
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
    setPage(1);
  };

  const handleStatusChange = (status: string) => {
    setActiveTab(status);
    setPage(1);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">Track your job applications</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search applications..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-64"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setLocation("/applications/new")} variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
            <ImportJobsDialog />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <Tabs value={activeTab} onValueChange={handleStatusChange} className="w-full">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={ApplicationStatus.INTERVIEW}>Interview</TabsTrigger>
            <TabsTrigger value={ApplicationStatus.OFFER}>Offer</TabsTrigger>
            <TabsTrigger value={ApplicationStatus.REJECTED}>Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {totalPages > 1 && (
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="cursor-pointer w-[180px]" onClick={() => handleSort("company")}>
                Company
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("position")}>
                Position
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("location")}>
                Location
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("jobType")}>
                Type
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("salary")}>
                Salary
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("appliedDate")}>
                Applied
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead className="cursor-pointer" onClick={() => handleSort("lastActivity")}>
                Last Activity
                <ArrowUpDown className="ml-2 h-4 w-4 inline" />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {applications.map((app) => (
              <TableRow
                key={app.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setLocation(`/applications/${app.id}`)}
              >
                <TableCell className="font-medium">{app.company}</TableCell>
                <TableCell>{app.position}</TableCell>
                <TableCell>{app.location || "N/A"}</TableCell>
                <TableCell>{app.jobType || "N/A"}</TableCell>
                <TableCell>{app.salary || "N/A"}</TableCell>
                <TableCell>{new Date(app.appliedDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(app.lastActivity).toLocaleDateString()}</TableCell>
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
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Filter className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/applications/${app.id}/edit`);
                      }}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Handle delete
                        }}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {applications.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
                  {isLoading ? (
                    "Loading..."
                  ) : (
                    "No applications found"
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {applications.length} of {data?.totalItems || 0} applications
        </div>
      </div>
    </div>
  );
}
