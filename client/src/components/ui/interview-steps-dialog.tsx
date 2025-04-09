
import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, GripVertical, Trash, ExternalLink } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "./dialog";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";

interface InterviewStep {
  id: number;
  stepName: string;
  interviewerName?: string;
  interviewerLinkedIn?: string;
  meetingUrl?: string;
  date?: Date;
  duration?: number;
  comments?: string;
  sequence: number;
}

interface InterviewStepsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: number;
  initialSteps?: InterviewStep[];
  onSave: (steps: InterviewStep[]) => void;
}

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

    // Update sequences
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
      sequence: steps.length + 1
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Interview Steps</DialogTitle>
        </DialogHeader>
        
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
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Step Name</Label>
                                <Input
                                  value={step.stepName}
                                  onChange={(e) => updateStep(step.id, 'stepName', e.target.value)}
                                  placeholder="e.g. HR Interview"
                                />
                              </div>
                              <div>
                                <Label>Interviewer Name</Label>
                                <Input
                                  value={step.interviewerName}
                                  onChange={(e) => updateStep(step.id, 'interviewerName', e.target.value)}
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>LinkedIn Profile</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={step.interviewerLinkedIn}
                                    onChange={(e) => updateStep(step.id, 'interviewerLinkedIn', e.target.value)}
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
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStep(step.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
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

        <Button onClick={addStep} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Step
        </Button>

        <DialogFooter>
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
