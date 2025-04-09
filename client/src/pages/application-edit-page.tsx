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
import { Textarea } from "@/components/ui/textarea";

interface OtherApplicant {
  id: number;
  username: string;
  steps: InterviewStep[];
  feedback?: string;
}

export function ApplicationEditPage() {
  const [_, setLocation] = useLocation();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Basic info form fields */}
          </form>
        </CardContent>
      </Card>

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

      {activeTab === "edit" ? (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Interview Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-4 border-l-2 border-gray-700 space-y-6">
                {application?.steps?.map((step, index) => (
                  <div key={step.id} className="relative">
                    <div className="absolute -left-[25px] w-4 h-4 rounded-full bg-gray-800 border-2 border-gray-700" />
                    <div className={`ml-4 p-4 rounded-lg ${step.completed ? 'bg-green-900/30' : 'bg-gray-800'}`}>
                      <h3 className="font-medium">{step.stepName}</h3>
                      {step.date && (
                        <p className="text-sm text-gray-400">
                          Scheduled: {new Date(step.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Other applicants content
      )}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" onClick={() => setLocation("/applications")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Edit Application</h1>
      </div>

      {activeTab === "edit" ? (
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
                    queryClient.invalidateQueries({
                      queryKey: ["applications"],
                    });
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Other Applicants</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {otherApplicants.map((applicant) => (
                  <div
                    key={applicant.id}
                    onClick={() => setSelectedApplicant(applicant)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedApplicant?.id === applicant.id
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="font-medium">{applicant.username}</div>
                    <div className="text-sm text-muted-foreground">
                      {applicant.steps.length} steps
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedApplicant && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>{selectedApplicant.username}'s Journey</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Interview Steps</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedApplicant.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center">
                          {index !== 0 && (
                            <div className="w-4 h-[2px] bg-gray-600 mx-2" />
                          )}
                          <div
                            className={`px-3 py-1.5 rounded-full text-sm ${
                              step.completed
                                ? "bg-green-900/30 text-green-400"
                                : "bg-gray-700 text-gray-300"
                            }`}
                          >
                            {step.stepName}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedApplicant.feedback && (
                    <div className="space-y-2">
                      <h3 className="font-medium">Feedback</h3>
                      <div className="bg-muted p-4 rounded-lg">
                        {selectedApplicant.feedback}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default ApplicationEditPage;
