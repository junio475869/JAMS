
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash, ExternalLink, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Textarea } from "./textarea";

interface InterviewStep {
  id: number;
  stepName: string;
  interviewerName?: string;
  interviewerLinkedIn?: string;
  meetingUrl?: string;
  scheduledDate?: Date;
  duration?: number;
  comments?: string;
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
}

const STEP_TEMPLATES = [
  "Apply",
  "HR Screen",
  "Hiring Manager",
  "Technical Assessment",
  "Director of Engineering",
  "Technical Interview",
  "CTO Interview",
  "CEO Interview",
  "Behavioral Interview"
];

export function InterviewStepsDialog({
  isOpen,
  onClose,
  applicationId,
  initialSteps = [],
  onSave
}: InterviewStepsDialogProps) {
  const [steps, setSteps] = useState<InterviewStep[]>(initialSteps);

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      sequence: index + 1
    }));

    setSteps(updatedItems);
  };

  const addStep = () => {
    const newStep: InterviewStep = {
      id: Date.now(),
      stepName: "",
      sequence: steps.length + 1,
      completed: false
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (id: number) => {
    setSteps(steps.filter(step => step.id !== id));
  };

  const updateStep = (id: number, field: keyof InterviewStep, value: any) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, [field]: value } : step
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Interview Steps</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-2 mb-4 flex-wrap">
          {STEP_TEMPLATES.map((template) => (
            <Button
              key={template}
              variant="outline"
              size="sm"
              onClick={() => {
                const newStep: InterviewStep = {
                  id: Date.now(),
                  stepName: template,
                  sequence: steps.length + 1,
                  completed: false
                };
                setSteps([...steps, newStep]);
              }}
            >
              + {template}
            </Button>
          ))}
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
                                  onChange={(e) => updateStep(step.id, 'stepName', e.target.value)}
                                  placeholder="e.g. Technical Interview"
                                />
                              </div>
                              <div>
                                <Label>Interviewer Name</Label>
                                <Input
                                  value={step.interviewerName}
                                  onChange={(e) => updateStep(step.id, 'interviewerName', e.target.value)}
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
                                    onChange={(e) => updateStep(step.id, 'interviewerLinkedIn', e.target.value)}
                                    placeholder="LinkedIn URL"
                                  />
                                  {step.interviewerLinkedIn && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => window.open(step.interviewerLinkedIn, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <div>
                                <Label>Meeting URL</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={step.meetingUrl}
                                    onChange={(e) => updateStep(step.id, 'meetingUrl', e.target.value)}
                                    placeholder="Meeting URL"
                                  />
                                  {step.meetingUrl && (
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => window.open(step.meetingUrl, '_blank')}
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
                                  value={step.scheduledDate ? format(new Date(step.scheduledDate), "yyyy-MM-dd'T'HH:mm") : ''}
                                  onChange={(e) => updateStep(step.id, 'scheduledDate', new Date(e.target.value))}
                                />
                              </div>
                              <div>
                                <Label>Duration (minutes)</Label>
                                <Input
                                  type="number"
                                  value={step.duration || ''}
                                  onChange={(e) => updateStep(step.id, 'duration', parseInt(e.target.value))}
                                  placeholder="60"
                                />
                              </div>
                            </div>

                            <div>
                              <Label>Comments/Notes</Label>
                              <Textarea
                                value={step.comments}
                                onChange={(e) => updateStep(step.id, 'comments', e.target.value)}
                                placeholder="Add any notes about this interview step"
                              />
                            </div>

                            {step.completed && (
                              <div>
                                <Label>Feedback</Label>
                                <Textarea
                                  value={step.feedback}
                                  onChange={(e) => updateStep(step.id, 'feedback', e.target.value)}
                                  placeholder="Interview feedback"
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateStep(step.id, 'completed', !step.completed)}
                            >
                              <Calendar className={`h-4 w-4 ${step.completed ? 'text-green-500' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeStep(step.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
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

        <Button onClick={addStep} variant="outline" className="w-full mt-4">
          <Plus className="h-4 w-4 mr-2" />
          Add Custom Step
        </Button>

        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(steps)}>
            Save Steps
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
