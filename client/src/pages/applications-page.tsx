
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ApplicationStatus } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ImportJobsDialog from "@/components/import-jobs-dialog";

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
    setPage(1);
  };

  const handleStatusChange = (status: ApplicationStatus) => {
    setActiveTab(status);
    setPage(1);
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
    <section className="bg-gray-50 dark:bg-gray-900 py-3 sm:py-5">
      <div className="px-4 mx-auto max-w-screen-2xl lg:px-12">
        <div className="relative overflow-hidden bg-white shadow-md dark:bg-gray-800 sm:rounded-lg">
          <div className="flex flex-col px-4 py-3 space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
            <div className="flex items-center flex-1 space-x-4">
              <h5>
                <span className="text-gray-500">All Applications:</span>
                <span className="dark:text-white ml-1">{data?.totalItems || 0}</span>
              </h5>
            </div>
            <div className="flex flex-col flex-shrink-0 space-y-3 md:flex-row md:items-center lg:justify-end md:space-y-0 md:space-x-3">
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

          <div className="flex flex-col px-4 py-3 space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0 lg:space-x-4">
            <div className="w-full md:w-1/2">
              <Input
                type="search"
                placeholder="Search applications..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => handleStatusChange(value as ApplicationStatus)} className="w-full">
            <TabsList className="px-4">
              <TabsTrigger value={ApplicationStatus.APPLIED}>Applied</TabsTrigger>
              <TabsTrigger value={ApplicationStatus.INTERVIEW}>Interview</TabsTrigger>
              <TabsTrigger value={ApplicationStatus.OFFER}>Offer</TabsTrigger>
              <TabsTrigger value={ApplicationStatus.REJECTED}>Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort("company")}>
                        Company
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort("position")}>
                        Position
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort("location")}>
                        Location
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="px-4 py-3 cursor-pointer" onClick={() => handleSort("appliedDate")}>
                        Applied Date
                        <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                      </TableHead>
                      <TableHead className="px-4 py-3">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((app) => (
                      <TableRow
                        key={app.id}
                        className="border-b dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => setLocation(`/applications/${app.id}`)}
                      >
                        <TableCell className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                          {app.company}
                        </TableCell>
                        <TableCell className="px-4 py-2">{app.position}</TableCell>
                        <TableCell className="px-4 py-2">{app.location || "N/A"}</TableCell>
                        <TableCell className="px-4 py-2">
                          {new Date(app.appliedDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs
                              ${app.status === ApplicationStatus.APPLIED ? "bg-blue-500/20 text-blue-500" :
                                app.status === ApplicationStatus.INTERVIEW ? "bg-yellow-500/20 text-yellow-500" :
                                app.status === ApplicationStatus.OFFER ? "bg-green-500/20 text-green-500" :
                                "bg-red-500/20 text-red-500"
                              }`}
                          >
                            {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <nav className="flex flex-col items-start justify-between p-4 space-y-3 md:flex-row md:items-center md:space-y-0">
                <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                  Showing <span className="font-semibold text-gray-900 dark:text-white">{applications.length}</span> of{" "}
                  <span className="font-semibold text-gray-900 dark:text-white">{data?.totalItems || 0}</span>
                </span>

                {totalPages > 1 && (
                  <ul className="inline-flex items-stretch -space-x-px">
                    <li>
                      <button
                        onClick={() => setPage(page > 1 ? page - 1 : 1)}
                        className="flex items-center justify-center h-full py-1.5 px-3 ml-0 text-gray-500 bg-white rounded-l-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <li key={pageNum}>
                        <button
                          onClick={() => setPage(pageNum)}
                          className={`flex items-center justify-center px-3 py-2 text-sm leading-tight ${
                            pageNum === page
                              ? "z-10 text-primary-600 bg-primary-50 border-primary-300 hover:bg-primary-100 hover:text-primary-700 dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                              : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                          }`}
                        >
                          {pageNum}
                        </button>
                      </li>
                    ))}
                    <li>
                      <button
                        onClick={() => setPage(page < totalPages ? page + 1 : totalPages)}
                        className="flex items-center justify-center h-full py-1.5 px-3 leading-tight text-gray-500 bg-white rounded-r-lg border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </li>
                  </ul>
                )}
              </nav>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
