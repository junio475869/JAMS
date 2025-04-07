import { Interview, InterviewType } from "@shared/schema";
import { format } from "date-fns";
import { 
  Video, 
  Users, 
  Phone 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface InterviewListProps {
  interviews: Interview[];
  isLoading: boolean;
  onViewInterview: (interview: Interview) => void;
}

export function InterviewList({ 
  interviews, 
  isLoading,
  onViewInterview
}: InterviewListProps) {
  const getInterviewIcon = (type: string) => {
    switch (type) {
      case InterviewType.TECHNICAL:
      case InterviewType.PANEL:
        return <Video className="h-5 w-5" />;
      case InterviewType.ONSITE:
        return <Users className="h-5 w-5" />;
      case InterviewType.PHONE:
      case InterviewType.HR:
      default:
        return <Phone className="h-5 w-5" />;
    }
  };

  const getInterviewIconBackground = (type: string) => {
    switch (type) {
      case InterviewType.TECHNICAL:
      case InterviewType.PANEL:
        return "bg-purple-900/30 text-purple-400";
      case InterviewType.ONSITE:
        return "bg-purple-900/30 text-purple-400";
      case InterviewType.PHONE:
      case InterviewType.HR:
      default:
        return "bg-blue-900/30 text-blue-400";
    }
  };

  const getFormattedDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (dateObj.toDateString() === today.toDateString()) {
      return "Today";
    } else if (dateObj.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return format(dateObj, 'E, MMM d');
    }
  };

  const getFormattedTime = (date: Date | string, duration: number) => {
    const dateObj = date instanceof Date ? date : new Date(date);
    const startTime = format(dateObj, 'h:mm a');
    
    const endDate = new Date(dateObj);
    endDate.setMinutes(endDate.getMinutes() + duration);
    const endTime = format(endDate, 'h:mm a');
    
    return `${startTime} - ${endTime}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="flex items-center p-3 h-20 w-full rounded-lg bg-gray-750" />
        <Skeleton className="flex items-center p-3 h-20 w-full rounded-lg bg-gray-750" />
        <Skeleton className="flex items-center p-3 h-20 w-full rounded-lg bg-gray-750" />
      </div>
    );
  }

  if (interviews.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 border border-dashed border-gray-700 rounded-lg">
        <span className="text-gray-500 text-sm">No upcoming interviews</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {interviews.map(interview => (
        <div 
          key={interview.id} 
          className="flex items-center p-3 bg-gray-750 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors duration-200 cursor-pointer"
          onClick={() => onViewInterview(interview)}
        >
          <div className={`h-10 w-10 ${getInterviewIconBackground(interview.type)} flex items-center justify-center rounded-lg mr-4`}>
            {getInterviewIcon(interview.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-white">{interview.title}</h4>
            <p className="text-sm text-gray-400">{interview.company}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">{getFormattedDate(interview.date)}</p>
            <p className="text-xs text-gray-400">{getFormattedTime(interview.date, interview.duration)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default InterviewList;
