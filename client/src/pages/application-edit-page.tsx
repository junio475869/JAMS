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
  SelectValue,
} from "@/components/ui/select";
import { ApplicationStatus } from "@shared/schema";
import { useParams } from "wouter";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { InterviewStepsDialog } from "@/components/ui/interview-steps-dialog";

export default function ApplicationEditPage() {
  const [_, setLocation] = useLocation();
  const { id: applicationId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    company: "",
    position: "",
    status: "",
    url: "",
    notes: "",
    techStack: [] as string[],
    location: "",
    jobType: "",
    salary: "",
  });

  const [showStepsDialog, setShowStepsDialog] = useState(false);
  const [showOtherInterviews, setShowOtherInterviews] = useState(false);
  const [selectedStep, setSelectedStep] = useState(null);
  const [otherInterviews, setOtherInterviews] = useState([]);

  const { data: application, isLoading } = useQuery({
    queryKey: ["application", applicationId],
    queryFn: async () => {
      const response = await fetch(`/api/applications/${applicationId}`);
      if (!response.ok) throw new Error("Failed to fetch application");
      return response.json();
    },
  });

  const { data: timeline, refetch: refetchTimeline } = useQuery({
    queryKey: ["timeline", applicationId],
    queryFn: async () => {
      const response = await fetch(
        `/api/applications/${applicationId}/timeline`,
      );
      if (!response.ok) throw new Error("Failed to fetch timeline");
      return response.json();
    },
  });

  const [interviewSteps, setInterviewSteps] = useState([]);

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
        salary: application.salary || "",
      });
      setInterviewSteps(application.interviewSteps || []);
    }
  }, [application]);

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, interviewSteps }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save application: ${response.statusText}`);
      }

      toast({
        title: "Application saved successfully!",
        description: "Your changes have been saved.",
      });
      refetchTimeline();
    } catch (error) {
      toast({
        title: "Error saving application",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred.",
      });
    }
  };

  const handleSaveSteps = async (updatedSteps) => {
    try {
      // Save the updated application with new steps
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...formData, interviewSteps: updatedSteps }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save application: ${response.statusText}`);
      }

      // Create timeline events for new steps
      for (const step of updatedSteps) {
        if (step.scheduledDate && !interviewSteps.find(s => s.id === step.id)) {
          await fetch(`/api/applications/${applicationId}/timeline`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              title: "Interview Scheduled",
              description: `${step.stepName} interview scheduled with ${step.interviewerName || 'TBD'}`,
              type: "interview",
              date: step.scheduledDate,
            }),
          });
        }
      }

      setInterviewSteps(updatedSteps);
      setShowStepsDialog(false);
      
      toast({
        title: "Steps saved successfully!",
        description: "Interview steps have been updated.",
      });
      
      refetchTimeline();
    } catch (error) {
      toast({
        title: "Error saving steps",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleViewOtherInterviews = async (step) => {
    setSelectedStep(step);
    try {
      const response = await fetch(
        `/api/applications/${applicationId}/interviews?stepId=${step.id}`,
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch other interviews: ${response.statusText}`,
        );
      }
      const data = await response.json();
      setOtherInterviews(data);
      setShowOtherInterviews(true);
    } catch (error) {
      toast({
        title: "Error fetching interviews",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex justify-start items-center mb-6 gap-5">
        <Button onClick={() => setLocation("/applications")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Application</h1>
          <p className="text-muted-foreground">Update application details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Information Column */}
        <div className="">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  defaultValue={application?.company}
                  placeholder="Enter company name"
                  onChange={(e) =>
                    setFormData({ ...formData, company: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  defaultValue={application?.position}
                  placeholder="Enter position"
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  defaultValue={application?.location}
                  placeholder="Enter location"
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobType">Job Type</Label>
                <Input
                  id="jobType"
                  defaultValue={application?.jobType}
                  placeholder="Enter job type"
                  onChange={(e) =>
                    setFormData({ ...formData, jobType: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  defaultValue={application?.salary}
                  placeholder="Enter salary"
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={application?.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
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
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  defaultValue={application?.notes}
                  placeholder="Enter notes"
                  className="min-h-[100px]"
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              </div>
              <div className="justify-end mt-6">
                <div className="grid gap-2">
                  <Button onClick={handleSave} disabled={isLoading}>
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowStepsDialog(true)}
                  >
                    Manage Interview Steps
                  </Button>
                </div>
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
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  {STEP_TEMPLATES.map((template) => (
                    <Button
                      key={template.type}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newStep = {
                          id: Date.now(),
                          stepName: template.name,
                          sequence: interviewSteps.length + 1,
                          completed: false,
                        };
                        handleSaveSteps([...interviewSteps, newStep]);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>

                <div className="space-y-4">
                  {interviewSteps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Step Name</Label>
                          <Input
                            value={step.stepName}
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                stepName: e.target.value,
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                            placeholder="Enter step name"
                          />
                        </div>

                        <div>
                          <Label>Interviewer Name</Label>
                          <Input
                            value={step.interviewerName || ""}
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                interviewerName: e.target.value,
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                            placeholder="Enter interviewer name"
                          />
                        </div>

                        <div>
                          <Label>LinkedIn Profile</Label>
                          <div className="flex gap-2">
                            <Input
                              value={step.interviewerLinkedIn || ""}
                              onChange={(e) => {
                                const updatedSteps = [...interviewSteps];
                                updatedSteps[index] = {
                                  ...step,
                                  interviewerLinkedIn: e.target.value,
                                };
                                handleSaveSteps(updatedSteps);
                              }}
                              placeholder="LinkedIn URL"
                            />
                            {step.interviewerLinkedIn && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  window.open(step.interviewerLinkedIn, "_blank")
                                }
                              >
                                <LinkedinIcon className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Meeting URL</Label>
                          <div className="flex gap-2">
                            <Input
                              value={step.meetingUrl || ""}
                              onChange={(e) => {
                                const updatedSteps = [...interviewSteps];
                                updatedSteps[index] = {
                                  ...step,
                                  meetingUrl: e.target.value,
                                };
                                handleSaveSteps(updatedSteps);
                              }}
                              placeholder="Meeting URL"
                            />
                            {step.meetingUrl && (
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  window.open(step.meetingUrl, "_blank")
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Scheduled Date</Label>
                          <Input
                            type="datetime-local"
                            value={
                              step.scheduledDate
                                ? format(
                                    new Date(step.scheduledDate),
                                    "yyyy-MM-dd'T'HH:mm",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                scheduledDate: new Date(e.target.value),
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                          />
                        </div>

                        <div>
                          <Label>Duration (minutes)</Label>
                          <Input
                            type="number"
                            value={step.duration || ""}
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                duration: parseInt(e.target.value),
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                            placeholder="60"
                          />
                        </div>

                        <div className="col-span-2">
                          <Label>Feedback/Notes</Label>
                          <Textarea
                            value={step.feedback || ""}
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                feedback: e.target.value,
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                            placeholder="Enter feedback or notes"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4">
                          <input
                            type="checkbox"
                            checked={step.completed}
                            onChange={(e) => {
                              const updatedSteps = [...interviewSteps];
                              updatedSteps[index] = {
                                ...step,
                                completed: e.target.checked,
                              };
                              handleSaveSteps(updatedSteps);
                            }}
                            className="h-4 w-4"
                          />
                          <Label>Completed</Label>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewOtherInterviews(step)}
                          >
                            <Users className="h-4 w-4 mr-2" />
                            View Similar Interviews
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updatedSteps = interviewSteps.filter(
                                (s) => s.id !== step.id
                              );
                              handleSaveSteps(updatedSteps);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative pl-4 border-l border-border mt-8">
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
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showOtherInterviews} onOpenChange={setShowOtherInterviews}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Other Interviews for {selectedStep?.stepName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {otherInterviews.map((interview) => (
              <div key={interview.id} className="border p-4 rounded-lg">
                <div className="font-medium">{interview.interviewerName}</div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(interview.scheduledDate), "PPP")}
                </div>
                <div className="mt-2">{interview.feedback}</div>
              </div>
            ))}
            {otherInterviews.length === 0 && (
              <div className="text-center text-muted-foreground">
                No other interviews found for this step
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
