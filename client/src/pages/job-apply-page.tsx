import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckIcon, ExternalLinkIcon, SearchIcon } from "lucide-react";
import Header from "@/components/layout/header";
import { useToast } from "@/hooks/use-toast";

// Job platforms configuration
const PLATFORMS = [
  {
    id: "adzuna",
    name: "Adzuna",
    searchParams: ["what", "where", "country"],
    baseUrl: "https://api.adzuna.com/v1/api/jobs",
  },
  {
    id: "remotive",
    name: "Remotive",
    searchParams: ["search", "category"],
    baseUrl: "https://remotive.com/api/remote-jobs",
  },
  {
    id: "usajobs",
    name: "USAJobs.gov",
    searchParams: ["keyword", "location", "grade"],
    baseUrl: "https://data.usajobs.gov/api/search",
  },
  {
    id: "themuse",
    name: "The Muse",
    searchParams: ["category", "level", "location"],
    baseUrl: "https://www.themuse.com/api/public/jobs",
  },
];

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  url: string;
  platform: string;
  salary?: string;
  description?: string;
}

export default function JobApplyPage() {
  const [activePlatform, setActivePlatform] = useState(PLATFORMS[0]);
  const [searchParams, setSearchParams] = useState<Record<string, string>>({});
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would call your backend API that handles the different platform APIs
      const response = await fetch(`/api/jobs/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: activePlatform.id,
          params: searchParams,
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch jobs');
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
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          company: job.company,
          position: job.title,
          url: job.url,
          status: 'applied',
          appliedDate: new Date().toISOString(),
          description: job.description,
        }),
      });

      if (!response.ok) throw new Error('Failed to save application');

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
              defaultValue={PLATFORMS[0].id}
              onValueChange={(value) => {
                const platform = PLATFORMS.find(p => p.id === value);
                if (platform) {
                  setActivePlatform(platform);
                  setSearchParams({});
                  setJobs([]);
                }
              }}
            >
              <TabsList className="mb-4">
                {PLATFORMS.map((platform) => (
                  <TabsTrigger key={platform.id} value={platform.id}>
                    {platform.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {PLATFORMS.map((platform) => (
                <TabsContent key={platform.id} value={platform.id}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {platform.searchParams.map((param) => (
                      <div key={param} className="space-y-2">
                        <Label htmlFor={param}>{param.charAt(0).toUpperCase() + param.slice(1)}</Label>
                        <Input
                          id={param}
                          value={searchParams[param] || ''}
                          onChange={(e) => setSearchParams(prev => ({
                            ...prev,
                            [param]: e.target.value
                          }))}
                          placeholder={`Enter ${param}`}
                        />
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
                    <TableCell>{job.salary || 'Not specified'}</TableCell>
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
                      {isLoading ? 'Loading...' : 'No jobs found. Try searching with different criteria.'}
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