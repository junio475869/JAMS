import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Application, ApplicationStatus } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Plus, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { InterviewStepsDialog } from "@/components/ui/interview-steps-dialog";

export function ApplicationEditPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "others">("edit");
  const [selectedApplicant, setSelectedApplicant] =
    useState<OtherApplicant | null>(null);

  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "",
    url: "",
    notes: "",
  });

  const { data: application, isLoading } = useQuery<Application>({
    queryKey: ["application", id],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${id}`);
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
  });

  const { data: otherApplicants = [] } = useQuery<OtherApplicant[]>({
    queryKey: ["other-applicants", application?.position],
    enabled: !!application?.position,
    queryFn: async () => {
      const response = await fetch(
        `/api/applications/others?position=${encodeURIComponent(application!.position)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch other applicants");
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
      });
    }
  }, [application]);

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update application");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast({
        title: "Success",
        description: "Application updated successfully",
      });
    },
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

      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      company: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, status: value }))
                  }
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

              <div className="space-y-2">
                <Label htmlFor="url">Job URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Interview Timeline</CardTitle>
          <Button onClick={() => setIsAddingStep(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Step
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative pl-4 border-l-2 border-gray-700 space-y-6">
            {application?.steps?.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-700" />
                <div className={`ml-4 p-4 rounded-lg ${step.completed ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                  <h3 className="font-medium">{step.stepName}</h3>
                  {step.scheduledDate && (
                    <p className="text-sm text-gray-400">
                      Scheduled: {new Date(step.scheduledDate).toLocaleDateString()}
                    </p>
                  )}
                  {step.comments && (
                    <p className="text-sm text-gray-400 mt-2">{step.comments}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {isAddingStep && (
        <InterviewStepsDialog
          isOpen={isAddingStep}
          onClose={() => setIsAddingStep(false)}
          applicationId={parseInt(id)}
          initialSteps={application?.steps || []}
          onSave={async (steps) => {
            try {
              await fetch(`/api/applications/${id}/interview-steps`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ steps }),
              });
              queryClient.invalidateQueries({
                queryKey: ["applications"],
              });
              toast({
                title: "Success",
                description: "Interview steps updated successfully",
              });
              setIsAddingStep(false);
            } catch (error) {
              toast({
                title: "Error",
                description: "Failed to update interview steps",
                variant: "destructive",
              });
            }
          }}
        />
      )}
      <div className="flex space-x-4 mb-6">
        <Button
          variant={activeTab === "edit" ? "default" : "outline"}
          onClick={() => setActiveTab("edit")}
        >
          Interview Process
        </Button>
        <Button
          variant={activeTab === "others" ? "default" : "outline"}
          onClick={() => setActiveTab("others")}
        >
          Other Applicants ({otherApplicants.length})
        </Button>
      </div>

      {activeTab === "edit" ? null : (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Other Applicants</CardTitle>
              <p className="text-sm text-muted-foreground">
                Other candidates who applied for this position
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {otherApplicants.map((applicant) => (
                  <div key={applicant.id} className="border-b border-border pb-4 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{applicant.username}</h3>
                      <span className="text-sm text-muted-foreground">
                        {applicant.steps.length} interview steps
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {applicant.steps.map((step, index) => (
                        <div
                          key={index}
                          className={`px-3 py-1 rounded-full text-sm ${
                            step.completed
                              ? "bg-green-500/10 text-green-500"
                              : "bg-gray-500/10 text-gray-400"
                          }`}
                        >
                          {step.stepName}
                        </div>
                      ))}
                    </div>
                    {applicant.feedback && (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {applicant.feedback}
                      </p>
                    )}
                  </div>
                ))}
                {otherApplicants.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    No other applicants found for this position
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

interface OtherApplicant {
  id: number;
  username: string;
  steps: InterviewStep[];
  feedback?: string;
}

interface InterviewStep {
  id: number;
  stepName: string;
  scheduledDate?: string;
  completed: boolean;
  comments?: string;
}

export default ApplicationEditPage;