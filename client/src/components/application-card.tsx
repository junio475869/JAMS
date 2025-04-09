import { formatDistanceToNow } from "date-fns";
import { useLocation } from "wouter";
import { Application, ApplicationStatus } from "@shared/schema";
import { CalendarIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ApplicationCardProps {
  application: Application;
  status: string;
  isUpdating?: boolean;
  onClick?: () => void;
}

const statusNames = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};

export function ApplicationCard({
  application,
  status,
  isUpdating,
  onClick,
}: ApplicationCardProps) {
  if (isUpdating) {
    return <Skeleton className="h-[140px] w-full bg-gray-750 rounded-lg" />;
  }
  const [location, setLocation] = useLocation();

  const formattedDate = application.appliedDate
    ? application.appliedDate instanceof Date
      ? formatDistanceToNow(application.appliedDate, { addSuffix: true })
      : formatDistanceToNow(new Date(application.appliedDate), {
          addSuffix: true,
        })
    : "recently";

  return (
    <div
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
      onClick={() => setLocation(`/applications/${application.id}`)}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="font-medium text-white">{application.position}</h4>
            <p className="text-sm mt-1 text-gray-400">{application.company}</p>
          </div>
          <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
            {statusNames[status]}
          </span>
        </div>
        {application.steps && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Progress: {application.steps.filter(s => s.completed).length}/{application.steps.length}</span>
            </div>
            <div className="flex items-center gap-1">
              {application.steps.map((step, index) => (
                <div 
                  key={step.id} 
                  className={`flex items-center ${index !== 0 ? 'ml-1' : ''}`}
                >
                  {index !== 0 && <div className="w-2 h-[2px] bg-gray-600 mr-1" />}
                  <div 
                    className={`text-xs px-2 py-1 rounded ${
                      step.completed 
                        ? 'bg-green-900/30 text-green-400' 
                        : 'bg-gray-700 text-gray-300'
                    }`}
                    title={step.stepName}
                  >
                    {step.stepName.split(' ')[0]}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center text-xs text-gray-400">
          <CalendarIcon className="h-3 w-3 mr-1" />
          <span>Applied {formattedDate}</span>
        </div>
      </div>
    </div>
  );
}

export default ApplicationCard;