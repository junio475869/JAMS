
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { InterviewStepsDialog } from "@/components/ui/interview-steps-dialog";
import { Application, ApplicationStatus } from "@shared/schema";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

export function ApplicationEditPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "",
    url: "",
    notes: ""
  });

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["application", id],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    }
  });

  useEffect(() => {
    if (application) {
      setFormData({
        company: application.company,
        position: application.position,
        status: application.status,
        url: application.url || "",
        notes: application.notes || ""
      });
    }
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to update application");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({ title: "Success", description: "Application updated successfully" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation("/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Application</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={e => setFormData(prev => ({ ...prev, company: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={e => setFormData(prev => ({ ...prev, position: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={value => setFormData(prev => ({ ...prev, status: value }))}>
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
                <Label htmlFor="url">Job URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={e => setFormData(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[100px] rounded-md border p-3"
                  value={formData.notes}
                  onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Interview Process</CardTitle>
          </CardHeader>
          <CardContent>
            <InterviewStepsDialog
              isOpen={true}
              onClose={() => {}}
              applicationId={parseInt(id)}
              onSave={async (steps) => {
                try {
                  await fetch(`/api/applications/${id}/interview-steps`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ steps }),
                  });
                  queryClient.invalidateQueries({ queryKey: ["applications"] });
                  toast({
                    title: "Success",
                    description: "Interview steps updated successfully",
                  });
                } catch (error) {
                  toast({
                    title: "Error",
                    description: "Failed to update interview steps",
                    variant: "destructive",
                  });
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ApplicationEditPage;
