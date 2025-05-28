import React from "react";
import { Card, CardContent } from "@/components/ui/card";

interface LiveCaptionProps {
  speaker: "interviewer" | "candidate";
  transcript: string;
  isActive: boolean;
}

export const LiveCaption: React.FC<LiveCaptionProps> = ({
  speaker,
  transcript,
  isActive,
}) => {
  if (!isActive || !transcript) return null;

  return (
    <Card className="mb-2">
      <CardContent className="p-2">
        <div className="flex items-start space-x-2">
          <div
            className={`w-2 h-2 rounded-full mt-1.5 ${
              speaker === "interviewer" ? "bg-blue-500" : "bg-indigo-500"
            }`}
          />
          <div className="flex-1">
            <div className="text-xs font-medium mb-0.5">
              {speaker === "interviewer" ? "Interviewer" : "You"}
            </div>
            <div className="text-sm">{transcript}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 