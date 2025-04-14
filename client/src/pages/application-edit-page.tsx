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
    setInterviewSteps(updatedSteps);
    setShowStepsDialog(false);
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
              <div className="flex justify-between items-center mb-4">
                <Button
                  onClick={async () => {
                    try {
                      const response = await fetch(
                        `/api/applications/${applicationId}/timeline`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            title: "Status Update",
                            description: "Added a new status update",
                            type: "note",
                            date: new Date(),
                          }),
                        },
                      );
                      if (!response.ok)
                        throw new Error("Failed to add timeline event");
                      refetchTimeline();
                      toast({
                        title: "Timeline event added",
                        description: "Successfully added new timeline event",
                      });
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to add timeline event",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Add Timeline Event
                </Button>
              </div>
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

      <InterviewStepsDialog
        isOpen={showStepsDialog}
        onClose={() => setShowStepsDialog(false)}
        applicationId={applicationId}
        initialSteps={interviewSteps}
        onSave={handleSaveSteps}
        onViewOtherInterviews={handleViewOtherInterviews}
      />

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

// // Placeholder for InterviewStepsDialog component -  Replace with your actual component
// const InterviewStepsDialog = ({ isOpen, onClose, applicationId, initialSteps, onSave, onViewOtherInterviews }) => {
//   const [steps, setSteps] = useState(initialSteps);

//   const handleStepChange = (index, newStep) => {
//     const updatedSteps = [...steps];
//     updatedSteps[index] = newStep;
//     setSteps(updatedSteps);
//   };

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent>
//         <DialogHeader>
//           <DialogTitle>Manage Interview Steps</DialogTitle>
//         </DialogHeader>
//         <div>
//           {/* Add your step management UI here.  This is a placeholder */}
//           {steps.map((step, index) => (
//             <div key={index}>
//               <Input type="text" value={step.stepName} onChange={e => handleStepChange(index, {...step, stepName: e.target.value})}/>
//               <Button onClick={() => onViewOtherInterviews(step)}>View Other Interviews</Button>
//             </div>
//           ))}
//         </div>
//         <div className="flex justify-end mt-4">
//             <Button onClick={() => onSave(steps)}>Save</Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// };
