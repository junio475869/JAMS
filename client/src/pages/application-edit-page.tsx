import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { ApplicationStatus } from "@shared/schema";
import { useParams } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";


export default function ApplicationEditPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "",
    url: "",
    notes: "",
    techStack: [] as string[],
    location:"",
    jobType:"",
    salary:""
  });

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
  });

  const { data: timeline } = useQuery({
    queryKey: ["timeline", id],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}/timeline`);
      if (!response.ok) throw new Error("Failed to fetch timeline");
      return response.json();
    },
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company,
        position: application.position,
        status: application.status,
        url: application.url || "",
        notes: application.notes || "",
        location: application.location || "",
        jobType: application.jobType || "",
        salary: application.salary || ""
      });
    }
  }, [application]);

  const handleSave = async () => {
    // Add your save logic here.  This is a placeholder.
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save application: ${response.statusText}`);
      }

      toast({
        title: "Application saved successfully!",
        description: "Your changes have been saved.",
      });
    } catch (error) {
      toast({
        title: "Error saving application",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Edit Application</h1>
          <p className="text-muted-foreground">Update application details</p>
        </div>
        <Button onClick={() => setLocation("/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2"/> Back to Applications
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Information Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  defaultValue={application.company}
                  placeholder="Enter company name"
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  defaultValue={application.position}
                  placeholder="Enter position"
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  defaultValue={application.location}
                  placeholder="Enter location"
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Input
                  id="jobType"
                  defaultValue={application.jobType}
                  placeholder="Enter job type"
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  defaultValue={application.salary}
                  placeholder="Enter salary"
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select defaultValue={application.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ApplicationStatus.APPLIED}>Applied</SelectItem>
                    <SelectItem value={ApplicationStatus.INTERVIEW}>Interview</SelectItem>
                    <SelectItem value={ApplicationStatus.OFFER}>Offer</SelectItem>
                    <SelectItem value={ApplicationStatus.REJECTED}>Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={application.notes}
                  placeholder="Enter notes"
                  className="min-h-[100px]"
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline Column */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Interview Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 border-l border-border">
                {timeline?.map((event: any) => (
                  <div key={event.id} className="mb-4 relative">
                    <div className="absolute -left-[21px] h-4 w-4 rounded-full bg-primary" />
                    <div className="bg-muted p-4 rounded-lg">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                      <div className="mt-2 text-sm">{event.description}</div>
                    </div>
                  </div>
                ))}
                {(!timeline || timeline.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No timeline events yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}