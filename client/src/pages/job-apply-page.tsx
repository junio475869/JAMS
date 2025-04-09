
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckIcon, ExternalLinkIcon, SearchIcon } from "lucide-react";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";
import { JOB_PLATFORMS } from "@/config/job-platforms";
import type { JobPlatform } from "@/config/job-platforms";

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  platform: string;
  salary?: string;
}

export default function JobApplyPage() {
  const [activePlatform, setActivePlatform] = useState<JobPlatform>(JOB_PLATFORMS[0]);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/jobs/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          platform: activePlatform.id,
          params: searchParams,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const data = await response.json();
      setJobs(data.jobs);
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

  const handleApplyDone = async (job: JobListing) => {
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company: job.company,
          position: job.title,
          url: job.url,
          status: "applied",
          notes: `Applied via ${job.platform}\nLocation: ${job.location}\nSalary: ${job.salary || 'Not specified'}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save application");
      }

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
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Job Search</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs
              defaultValue={JOB_PLATFORMS[0].id}
              onValueChange={(value) => {
                const platform = JOB_PLATFORMS.find(p => p.id === value);
                if (platform) {
                  setActivePlatform(platform);
                  setSearchParams({});
                  setJobs([]);
                }
              }}
            >
              <TabsList className="mb-4">
                {JOB_PLATFORMS.map((platform) => (
                  <TabsTrigger key={platform.id} value={platform.id}>
                    {platform.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {JOB_PLATFORMS.map((platform) => (
                <TabsContent key={platform.id} value={platform.id}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {platform.searchParams.map((param) => (
                      <div key={param.name} className="space-y-2">
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
                              <SelectValue placeholder={`Select ${param.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {param.options?.map((option) => (
                                <SelectItem key={option} value={option}>
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
                  <div className="flex justify-end mb-6">
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
                  <TableHead>Position</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Salary</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{job.title}</span>
                        <Badge variant="secondary">{job.platform}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>{job.company}</TableCell>
                    <TableCell>{job.location}</TableCell>
                    <TableCell>{job.salary || "Not specified"}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" asChild>
                          <a href={job.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLinkIcon className="h-4 w-4 mr-1" />
                            Apply
                          </a>
                        </Button>
                        <Button size="sm" onClick={() => handleApplyDone(job)}>
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Done
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {jobs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {isLoading ? "Loading..." : "No jobs found. Try searching with different criteria."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
