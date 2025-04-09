
import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Badge } from "./ui/badge";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InterviewFeedbackFormProps {
  interviewId: number;
  onSubmit: () => void;
}

export function InterviewFeedbackForm({ interviewId, onSubmit }: InterviewFeedbackFormProps) {
  const [comments, setComments] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = async () => {
    try {
      const formData = new FormData();
      formData.append("comments", comments);
      formData.append("tags", JSON.stringify(tags));
      if (videoFile) {
        formData.append("video", videoFile);
      }

      const response = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        body: formData
      });

      if (!response.ok) throw new Error("Failed to submit feedback");

      toast({
        title: "Success",
        description: "Interview feedback submitted successfully"
      });
      onSubmit();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Interview Feedback</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Comments</Label>
          <Textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder="Share your thoughts about the interview..."
            className="min-h-[100px]"
          />
        </div>

        <div>
          <Label>Video Recording</Label>
          <Input
            type="file"
            accept="video/*"
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mb-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add tags..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
            />
            <Button onClick={handleAddTag}>Add</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit}>Submit Feedback</Button>
      </CardFooter>
    </Card>
  );
}
