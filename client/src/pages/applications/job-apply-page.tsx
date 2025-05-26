import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckIcon,
  ExternalLinkIcon,
  SearchIcon,
  ArrowUpDown,
} from "lucide-react";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { JOB_PLATFORMS } from "@/config/job-platforms";
import type { JobPlatform } from "@/config/job-platforms";
import { apiRequest } from "@/lib/queryClient";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  platform: string;
  salary?: string;
  jobType?: string;
  publicationDate?: string;
  description?: string;
}

export default function JobApplyPage() {
  const [activePlatform, setActivePlatform] = useState<JobPlatform>(
    JOB_PLATFORMS[0],
  );
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<string>("publicationDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [filterText, setFilterText] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const jobsPerPage = 10;
  const { toast } = useToast();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/jobs/search", {
          platform: activePlatform.id,
          params: {
            ...searchParams,
            limit: 100, // Get more results for client-side pagination
          },
      });

      const data = await response.json();
      setJobs(data.jobs);
      setPage(1); // Reset to first page on new search
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch job listings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Sort and filter jobs
  const filteredAndSortedJobs = jobs
    .filter((job) => {
      if (!filterText) return true;
      const searchLower = filterText.toLowerCase();
      return (
        job.title.toLowerCase().includes(searchLower) ||
        job.company.toLowerCase().includes(searchLower) ||
        job.location.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortField as keyof JobListing] || "";
      const bValue = b[sortField as keyof JobListing] || "";
      return sortOrder === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / jobsPerPage);
  const paginatedJobs = filteredAndSortedJobs.slice(
    (page - 1) * jobsPerPage,
    page * jobsPerPage,
  );

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleApplyDone = async (job: JobListing) => {
    try {
      // Check for duplicates
      const checkResponse = await apiRequest("GET", `/api/applications/check-duplicate?platformJobId=${job.id}&platform=${job.platform}`);
      const { exists } = await checkResponse.json();

      if (exists) {
        toast({
          title: "Already Applied",
          description: "You have already applied to this position",
          variant: "warning",
        });
        return;
      }

      const response = await apiRequest("POST", "/api/applications", {
          company: job.company,
          position: job.title,
          url: job.url,
          status: "applied",
          platform: job.platform,
          platformJobId: job.id,
          description: job.description,
          publicationDate: job.publicationDate,
          location: job.location,
          salary: job.salary,
          jobType: job.jobType,
          notes: `Applied via ${job.platform}\nLocation: ${job.location}\nSalary: ${job.salary || "-"}\nJob Type: ${job.jobType || "-"}`,
      });

      setAppliedJobs((prev) => new Set([...prev, job.id]));
      toast({
        title: "Success",
        description: "Application saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save application",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Job Search</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={JOB_PLATFORMS[0].id}
            onValueChange={(value) => {
              const platform = JOB_PLATFORMS.find((p) => p.id === value);
              if (platform) {
                setActivePlatform(platform);
                setSearchParams({});
                setJobs([]);
              }
            }}
          >
            <TabsList className="mb-4">
              {JOB_PLATFORMS.map((platform, k) => (
                <TabsTrigger key={k} value={platform.id}>
                  {platform.name}
                </TabsTrigger>
              ))}
            </TabsList>

            {JOB_PLATFORMS.map((platform, k) => (
              <TabsContent key={k} value={platform.id}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {platform.searchParams.map((param, k2) => (
                    <div key={k + "-" + k2} className="space-y-2">
                      <Label htmlFor={param.name}>{param.label}</Label>
                      {param.type === "select" ? (
                        <Select
                          value={searchParams[param.name] || ""}
                          onValueChange={(value) =>
                            setSearchParams((prev) => ({
                              ...prev,
                              [param.name]: value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={`Select ${param.label}`}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {param.options?.map((option, k3) => (
                              <SelectItem
                                key={k + "-" + k2 + "-" + k3}
                                value={option}
                              >
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          id={param.name}
                          value={searchParams[param.name] || ""}
                          onChange={(e) =>
                            setSearchParams((prev) => ({
                              ...prev,
                              [param.name]: e.target.value,
                            }))
                          }
                          placeholder={`Enter ${param.label.toLowerCase()}`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mb-6">
                  <Input
                    placeholder="Filter results..."
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    className="max-w-sm"
                  />
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <SearchIcon className="h-4 w-4 mr-2" />
                    Search Jobs
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => handleSort("title")}
                  className="cursor-pointer"
                >
                  Position <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("company")}
                  className="cursor-pointer"
                >
                  Company <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("location")}
                  className="cursor-pointer"
                >
                  Location <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("salary")}
                  className="cursor-pointer"
                >
                  Salary <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("jobType")}
                  className="cursor-pointer"
                >
                  Type <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead
                  onClick={() => handleSort("publicationDate")}
                  className="cursor-pointer"
                >
                  Posted <ArrowUpDown className="h-4 w-4 inline-block" />
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedJobs.map((job, k) => (
                <TableRow key={job.id + "-" + k}>
                  <TableCell>
                    <button
                      className="text-left hover:text-primary"
                      onClick={() => {
                        setSelectedJob(job);
                        setShowDescription(true);
                      }}
                    >
                      {job.title}
                    </button>
                  </TableCell>
                  <TableCell>{job.company}</TableCell>
                  <TableCell>{job.location}</TableCell>
                  <TableCell>{job.salary || "-"}</TableCell>
                  <TableCell>{job.jobType || "-"}</TableCell>
                  <TableCell>
                    {job.publicationDate
                      ? new Date(job.publicationDate).toLocaleDateString()
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {!appliedJobs.has(job.id) && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <a
                              href={job.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLinkIcon className="h-4 w-4 mr-1" />
                              Apply
                            </a>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleApplyDone(job)}
                          >
                            <CheckIcon className="h-4 w-4 mr-1" />
                            Done
                          </Button>
                        </>
                      )}
                      {appliedJobs.has(job.id) && (
                        <Badge variant="success">Applied</Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Description Modal */}
              <Dialog open={showDescription} onOpenChange={setShowDescription}>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>{selectedJob?.title}</DialogTitle>
                    <DialogDescription>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="font-semibold">
                          {selectedJob?.company}
                        </span>
                        <span>•</span>
                        <span>{selectedJob?.location}</span>
                      </div>
                    </DialogDescription>
                  </DialogHeader>
                  <div className="max-h-[400px] overflow-y-auto">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: selectedJob?.description || "",
                      }}
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={() => setShowDescription(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {paginatedJobs.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center py-8 text-muted-foreground"
                  >
                    {isLoading
                      ? "Loading..."
                      : "No jobs found. Try searching with different criteria."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {filteredAndSortedJobs.length > 0 && (
            <div className="flex justify-center mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="py-2 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
