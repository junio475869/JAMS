
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  Plus,
  GripVertical,
  Trash,
  ExternalLink,
  Calendar,
  LinkedinIcon,
  Users,
} from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

const STEP_TEMPLATES = [
  { name: "Apply", type: "APPLY" },
  { name: "HR Screen", type: "HR" },
  { name: "Hiring Manager", type: "HM" },
  { name: "Technical Assessment", type: "ASSESSMENT" },
  { name: "Director of Engineering", type: "DOE" },
  { name: "Technical Interview", type: "TECH" },
  { name: "CTO Interview", type: "CTO" },
  { name: "CEO Interview", type: "CEO" },
  { name: "Behavioral Interview", type: "BEHAVIORAL" },
];

interface InterviewStep {
  id: number;
  stepName: string;
  interviewerName?: string;
  interviewerLinkedIn?: string;
  meetingUrl?: string;
  scheduledDate?: Date;
  duration?: number;
  feedback?: string;
  completed: boolean;
  sequence: number;
}

interface InterviewStepsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  initialSteps?: InterviewStep[];
  onSave: (steps: InterviewStep[]) => void;
  onViewOtherInterviews?: (step: InterviewStep) => void;
}

export function InterviewStepsDialog({
  isOpen,
  onClose,
  applicationId,
  initialSteps = [],
  onSave,
  onViewOtherInterviews,
}: InterviewStepsDialogProps) {
  const [steps, setSteps] = useState<InterviewStep[]>(initialSteps);

  useEffect(() => {
    if (!initialSteps.length) {
      setSteps([
        {
          id: Date.now(),
          stepName: "Apply",
          sequence: 1,
          completed: true,
          scheduledDate: new Date(),
        },
      ]);
    } else {
      setSteps(initialSteps);
    }
  }, [initialSteps]);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence: index + 1,
    }));

    setSteps(updatedItems);
  };

  const addStep = (template?: typeof STEP_TEMPLATES[0]) => {
    const newStep: InterviewStep = {
      id: Date.now(),
      stepName: template?.name || "",
      sequence: steps.length + 1,
      completed: false,
    };
    setSteps([...steps, newStep]);

    // Add calendar event if scheduled date exists
    if (newStep.scheduledDate) {
      fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `${newStep.stepName} - Interview`,
          description: `Interview step for application with ${applicationId}`,
          startTime: newStep.scheduledDate,
          endTime: new Date(newStep.scheduledDate.getTime() + (newStep.duration || 60) * 60000),
          location: newStep.meetingUrl || "TBD",
        }),
      });
    }
  };

  const updateStep = (index: number, field: string, value: any) => {
    const updatedSteps = steps.map((step, i) =>
      i === index ? { ...step, [field]: value } : step
    );
    setSteps(updatedSteps);

    // Update calendar event if date changed
    if (field === "scheduledDate" || field === "duration") {
      const step = updatedSteps[index];
      if (step.scheduledDate) {
        fetch("/api/calendar/events", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            summary: `${step.stepName} - Interview`,
            description: `Interview step for application with ${applicationId}`,
            startTime: step.scheduledDate,
            endTime: new Date(step.scheduledDate.getTime() + (step.duration || 60) * 60000),
            location: step.meetingUrl || "TBD",
          }),
        });
      }
    }
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Manage Interview Steps</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            {STEP_TEMPLATES.map((template) => (
              <Button
                key={template.type}
                variant="outline"
                size="sm"
                onClick={() => addStep(template)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {template.name}
              </Button>
            ))}
          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {steps.map((step, index) => (
                    <Draggable
                      key={step.id}
                      draggableId={String(step.id)}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border rounded-lg p-4"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              {...provided.dragHandleProps}
                              className="mt-3 cursor-move"
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>

                            <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Step Name</Label>
                                  <Input
                                    value={step.stepName}
                                    onChange={(e) =>
                                      updateStep(
                                        index,
                                        "stepName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter step name"
                                  />
                                </div>

                                <div>
                                  <Label>Interviewer Name</Label>
                                  <Input
                                    value={step.interviewerName || ""}
                                    onChange={(e) =>
                                      updateStep(
                                        index,
                                        "interviewerName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Enter interviewer name"
                                  />
                                </div>

                                <div>
                                  <Label>LinkedIn Profile</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={step.interviewerLinkedIn || ""}
                                      onChange={(e) =>
                                        updateStep(
                                          index,
                                          "interviewerLinkedIn",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="LinkedIn URL"
                                    />
                                    {step.interviewerLinkedIn && (
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                          window.open(
                                            step.interviewerLinkedIn,
                                            "_blank",
                                          )
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
                                      onChange={(e) =>
                                        updateStep(
                                          index,
                                          "meetingUrl",
                                          e.target.value,
                                        )
                                      }
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
                                    onChange={(e) =>
                                      updateStep(
                                        index,
                                        "scheduledDate",
                                        new Date(e.target.value),
                                      )
                                    }
                                  />
                                </div>

                                <div>
                                  <Label>Duration (minutes)</Label>
                                  <Input
                                    type="number"
                                    value={step.duration || ""}
                                    onChange={(e) =>
                                      updateStep(
                                        index,
                                        "duration",
                                        parseInt(e.target.value),
                                      )
                                    }
                                    placeholder="60"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label>Feedback/Notes</Label>
                                <Textarea
                                  value={step.feedback || ""}
                                  onChange={(e) =>
                                    updateStep(
                                      index,
                                      "feedback",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Enter feedback or notes"
                                />
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <input
                                    type="checkbox"
                                    checked={step.completed}
                                    onChange={(e) =>
                                      updateStep(
                                        index,
                                        "completed",
                                        e.target.checked,
                                      )
                                    }
                                    className="h-4 w-4"
                                  />
                                  <Label>Completed</Label>
                                </div>

                                <div className="flex gap-2">
                                  {onViewOtherInterviews && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        onViewOtherInterviews(step)
                                      }
                                    >
                                      <Users className="h-4 w-4 mr-2" />
                                      View Similar Interviews
                                    </Button>
                                  )}
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeStep(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(steps)}>Save Changes</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
