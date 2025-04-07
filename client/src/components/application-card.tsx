import { format, formatDistanceToNow } from "date-fns";
import { Application, ApplicationStatus } from "@shared/schema";
import { 
  CalendarIcon, 
  Paperclip, 
  MessageCircle, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar, 
  Award,
  ThumbsDown
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ApplicationCardProps {
  application: Application;
  status: string;
  isUpdating?: boolean;
}

interface StatusColorAnalysis {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  intensity: number;
  visualCues: {
    icon?: string;
    description: string;
  };
  explanation: string;
}

interface ColorAnalysisResponse {
  colorAnalysis: StatusColorAnalysis;
}

// Default status colors as a fallback
const statusColors: Record<string, string> = {
  applied: "bg-blue-900/30 text-blue-400 border-blue-700/50",
  interview: "bg-purple-900/30 text-purple-400 border-purple-700/50",
  offer: "bg-green-900/30 text-green-400 border-green-700/50",
  rejected: "bg-red-900/30 text-red-400 border-red-700/50",
  accepted: "bg-amber-900/30 text-amber-400 border-amber-700/50",
};

const statusNames: Record<string, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  accepted: "Accepted",
};

// Map icon names to Lucide React components
const iconMap: Record<string, React.FC<{ className?: string }>> = {
  "alert-circle": AlertCircle,
  "check-circle": CheckCircle,
  "clock": Clock,
  "calendar": Calendar,
  "award": Award,
  "thumbs-down": ThumbsDown,
  "message-circle": MessageCircle,
  "paperclip": Paperclip
};

export function ApplicationCard({ application, status, isUpdating }: ApplicationCardProps) {
  const { toast } = useToast();
  const [customStyles, setCustomStyles] = useState<{
    backgroundColor: string;
    textColor: string;
    borderColor: string;
    icon?: React.ReactNode;
    description: string;
  } | null>(null);
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Query for AI color analysis
  const { data: colorAnalysisData } = useQuery<ColorAnalysisResponse>({
    queryKey: [`/api/ai/application-status-analysis/${application.id}`],
    queryFn: async () => {
      try {
        const response = await apiRequest("POST", "/api/ai/application-status-analysis", {
          applicationId: application.id
        });
        return await response.json();
      } catch (error) {
        console.error("Error fetching color analysis:", error);
        throw error;
      }
    },
    enabled: !isDemoMode && !isUpdating, // Don't run in demo mode or while updating
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Process color analysis and apply custom styles
  useEffect(() => {
    if (colorAnalysisData?.colorAnalysis) {
      const analysis = colorAnalysisData.colorAnalysis;
      
      // Create icon component if one was suggested
      let iconComponent = null;
      if (analysis.visualCues.icon && iconMap[analysis.visualCues.icon]) {
        const IconComponent = iconMap[analysis.visualCues.icon];
        iconComponent = <IconComponent className="h-3 w-3 mr-1" />;
      }
      
      setCustomStyles({
        backgroundColor: analysis.backgroundColor,
        textColor: analysis.textColor,
        borderColor: analysis.borderColor,
        icon: iconComponent,
        description: analysis.visualCues.description
      });
    }
  }, [colorAnalysisData]);

  if (isUpdating) {
    return <Skeleton className="h-[140px] w-full bg-gray-750 rounded-lg" />;
  }

  // Handle null appliedDate
  const formattedDate = application.appliedDate
    ? (application.appliedDate instanceof Date 
        ? formatDistanceToNow(application.appliedDate, { addSuffix: true })
        : formatDistanceToNow(new Date(application.appliedDate), { addSuffix: true }))
    : "recently";

  // Default card style
  const defaultCardStyle = "bg-gray-750 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors duration-200 cursor-pointer";
  // Custom card style if AI analysis is available
  const customCardStyle = customStyles 
    ? `rounded-lg p-4 hover:border-opacity-70 transition-colors duration-200 cursor-pointer`
    : defaultCardStyle;
  
  // Default status badge style
  const defaultStatusBadgeStyle = `${statusColors[status]} text-xs px-2 py-1 rounded font-medium`;
  // Custom status badge style if AI analysis is available
  const customStatusBadgeStyle = customStyles
    ? `text-xs px-2 py-1 rounded font-medium border`
    : defaultStatusBadgeStyle;

  return (
    <div 
      className={customCardStyle}
      style={customStyles ? {
        backgroundColor: customStyles.backgroundColor,
        borderColor: customStyles.borderColor,
        borderWidth: '1px',
        borderStyle: 'solid'
      } : {}}
    >
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-medium text-white">{application.position}</h4>
          <p style={customStyles ? {color: customStyles.textColor, opacity: 0.8} : {}} 
             className={`text-sm mt-1 ${customStyles ? '' : 'text-gray-400'}`}>
            {application.company}
          </p>
        </div>
        <span 
          className={customStatusBadgeStyle}
          style={customStyles ? {
            backgroundColor: `${customStyles.backgroundColor}`,
            color: customStyles.textColor,
            borderColor: customStyles.borderColor
          } : {}}
        >
          {statusNames[status]}
        </span>
      </div>
      <div className="mt-3 flex items-center text-xs" style={customStyles ? {color: customStyles.textColor, opacity: 0.7} : {color: '#9ca3af'}}>
        {customStyles?.icon || <CalendarIcon className="h-3 w-3 mr-1" />}
        <span>
          {(() => {
            switch(status) {
              case 'applied':
                return `Applied ${formattedDate}`;
              case 'interview':
                return 'Interview scheduled';
              case 'offer':
                return 'Offer received';
              case 'rejected':
                return `Rejected ${formattedDate}`;
              default:
                return `Status: ${status} ${formattedDate}`;
            }
          })()}
        </span>
      </div>
      {customStyles && (
        <div className="mt-2 text-xs italic" style={{color: customStyles.textColor, opacity: 0.6}}>
          {customStyles.description}
        </div>
      )}
      <div className="mt-3 pt-3" style={{
        borderTopWidth: '1px', 
        borderTopStyle: 'solid',
        borderTopColor: customStyles ? customStyles.borderColor : '#374151'
      }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <span className="flex items-center text-xs mr-3" style={customStyles ? {color: customStyles.textColor, opacity: 0.7} : {color: '#9ca3af'}}>
              <Paperclip className="h-3 w-3 mr-1" /> 2
            </span>
            <span className="flex items-center text-xs" style={customStyles ? {color: customStyles.textColor, opacity: 0.7} : {color: '#9ca3af'}}>
              <MessageCircle className="h-3 w-3 mr-1" /> 3
            </span>
          </div>
          <div>
            <span 
              className="inline-flex items-center justify-center h-6 w-6 rounded-full text-xs"
              style={{
                backgroundColor: customStyles ? customStyles.borderColor : '#374151',
                color: customStyles ? customStyles.textColor : '#d1d5db'
              }}
            >
              JD
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApplicationCard;
