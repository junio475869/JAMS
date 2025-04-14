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
      // Add default "Apply" step if no steps exist
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

  const addStep = (template?: (typeof STEP_TEMPLATES)[0]) => {
    const newStep: InterviewStep = {
      id: Date.now(),
      stepName: template?.name || "",
      sequence: steps.length + 1,
      completed: false,
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter((step) => step.id !== id));
  };

  const updateStep = (id: number, field: keyof InterviewStep, value: any) => {
    setSteps(
      steps.map((step) =>
        step.id === id ? { ...step, [field]: value } : step,
      ),
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Steps</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 mb-4 flex-wrap">
            {STEP_TEMPLATES.map((template) => (
              <Button
                key={template.type}
                variant="outline"
                size="sm"
                onClick={() => addStep(template)}
              >
                + {template.name}
              </Button>
            ))}
            <Button
              onClick={() => addStep()}
              variant="outline"
              size="sm"
            >
              + Custom Step
            </Button>

          </div>

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="steps">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {steps.map((step, index) => (
                    <Draggable
                      key={step.id}
                      draggableId={step.id.toString()}
                      index={index}
                      isDragDisabled={step.stepName === "Apply"}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="border p-4 mb-4 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-gray-500" />
                            </div>

                            <div className="flex-1 grid gap-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Step Name</Label>
                                  <Input
                                    value={step.stepName}
                                    onChange={(e) =>
                                      updateStep(
                                        step.id,
                                        "stepName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="e.g. Technical Interview"
                                    disabled={step.stepName === "Apply"}
                                  />
                                </div>
                                <div>
                                  <Label>Interviewer Name</Label>
                                  <Input
                                    value={step.interviewerName}
                                    onChange={(e) =>
                                      updateStep(
                                        step.id,
                                        "interviewerName",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Interviewer's name"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>LinkedIn Profile</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      value={step.interviewerLinkedIn}
                                      onChange={(e) =>
                                        updateStep(
                                          step.id,
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
                                      value={step.meetingUrl}
                                      onChange={(e) =>
                                        updateStep(
                                          step.id,
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
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <Label>Interview Date & Time</Label>
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
                                        step.id,
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
                                        step.id,
                                        "duration",
                                        parseInt(e.target.value),
                                      )
                                    }
                                    placeholder="60"
                                  />
                                </div>
                              </div>

                              {step.completed && (
                                <div>
                                  <Label>Feedback</Label>
                                  <Textarea
                                    value={step.feedback}
                                    onChange={(e) =>
                                      updateStep(
                                        step.id,
                                        "feedback",
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Interview feedback"
                                    className="w-full min-h-[100px] p-2 border rounded"
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  updateStep(
                                    step.id,
                                    "completed",
                                    !step.completed,
                                  )
                                }
                              >
                                <Calendar
                                  className={`h-4 w-4 ${step.completed ? "text-green-500" : ""}`}
                                />
                              </Button>

                              {onViewOtherInterviews && (
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => onViewOtherInterviews(step)}
                                >
                                  <Users className="h-4 w-4" />
                                </Button>
                              )}

                              {step.stepName !== "Apply" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeStep(step.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              )}
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

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => onSave(steps)}>Save Steps</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
