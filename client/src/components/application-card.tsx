import { formatDistanceToNow } from "date-fns";
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
  rejected: "Rejected"
};

export function ApplicationCard({ application, status, isUpdating, onClick }: ApplicationCardProps) {
  if (isUpdating) {
    return <Skeleton className="h-[140px] w-full bg-gray-750 rounded-lg" />;
  }

  const formattedDate = application.appliedDate
    ? (application.appliedDate instanceof Date 
        ? formatDistanceToNow(application.appliedDate, { addSuffix: true })
        : formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true }))
    : "recently";

  return (
    <div 
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors"
      onClick={() => window.location.href = `/applications/${application.id}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-white">{application.position}</h4>
          <p className="text-sm mt-1 text-gray-400">{application.company}</p>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
          {statusNames[status]}
        </span>
      </div>
      <div className="mt-3 flex items-center text-xs text-gray-400">
        <CalendarIcon className="h-3 w-3 mr-1" />
        <span>Applied {formattedDate}</span>
      </div>
    </div>
  );
}

export default ApplicationCard;