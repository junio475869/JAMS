import { useMemo, useState, useEffect } from "react";
import { 
  Application, 
  ApplicationStatus,
} from "@shared/schema";
import ApplicationCard from "@/components/application-card";
import { Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Define column configurations that won't change between renders
const COLUMN_DEFINITIONS = [
  { id: ApplicationStatus.APPLIED, title: "Applied", color: "bg-blue-500" },
  { id: ApplicationStatus.INTERVIEW, title: "Interview", color: "bg-purple-500" },
  { id: ApplicationStatus.OFFER, title: "Offer", color: "bg-green-500" },
  { id: ApplicationStatus.REJECTED, title: "Rejected", color: "bg-red-500" },
];

// Demo applications for demo mode
const DEMO_APPLICATIONS = [
  {
    id: 1,
    userId: 0,
    company: "Tech Innovations Inc.",
    position: "Senior Frontend Developer",
    status: "applied",
    url: "https://techinnovations.example.com/careers",
    description: "Senior frontend developer position focusing on React and TypeScript",
    notes: "Applied through company website. Used resume v2.0.",
    appliedDate: new Date(),
    lastActivity: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 2,
    userId: 0,
    company: "Global Solutions Ltd.",
    position: "Full Stack Engineer",
    status: "interview",
    url: "https://globalsolutions.example.com/jobs",
    description: "Full stack role working with Node.js and React",
    notes: "First interview scheduled for next week. Research company products.",
    appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 3,
    userId: 0,
    company: "Startup Ventures",
    position: "React Developer",
    status: "offer",
    url: "https://startupventures.example.com/careers",
    description: "React frontend role for a growing startup",
    notes: "Received offer! Need to review contract details.",
    appliedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 4,
    userId: 0,
    company: "Enterprise Solutions",
    position: "UI/UX Developer",
    status: "rejected",
    url: "https://enterprise.example.com/jobs",
    description: "UI/UX developer with React experience",
    notes: "Rejected after second interview. Follow up for feedback.",
    appliedDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

interface KanbanBoardProps {
  applications: Application[];
  onDrop: (applicationId: number, newStatus: string) => void;
}

export default function KanbanBoard({ applications, onDrop }: KanbanBoardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const isDemoMode = localStorage.getItem("demoMode") === "true";
  
  useEffect(() => {
    // In a real app, we would get applications from the context
    // For now, we're using demo applications for simplicity
    if (isDemoMode) {
      setApplications(DEMO_APPLICATIONS);
      setIsLoading(false);
    } else {
      // For non-demo mode, we would get applications from the API
      // This is simplified for now
      setApplications([]);
      setIsLoading(false);
    }
  }, [isDemoMode]);
  
  // Mock update function for demo mode
  const updateApplication = (id: number, data: any) => {
    if (isDemoMode) {
      setIsUpdating(true);
      setTimeout(() => {
        setApplications(prevApplications => 
          prevApplications.map(app => 
            app.id === id ? { ...app, ...data } : app
          )
        );
        setIsUpdating(false);
      }, 500);
    }
  };
  
  // Compute columns only when applications change
  const columns = useMemo(() => {
    return COLUMN_DEFINITIONS.map(column => ({
      ...column,
      applications: applications.filter(app => app.status === column.id)
    }));
  }, [applications]);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, applicationId: number) => {
    e.dataTransfer.setData('applicationId', applicationId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const applicationId = parseInt(e.dataTransfer.getData('applicationId'));
    
    if (!isNaN(applicationId)) {
      const application = applications.find(app => app.id === applicationId);
      if (application && application.status !== columnId) {
        onDrop(applicationId, columnId);
      }
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Application Pipeline</h2>
          <div className="flex">
            <Button variant="ghost" size="sm" className="text-gray-300">
              <Filter className="h-4 w-4 mr-1" /> Filter
            </Button>
            <Button variant="ghost" size="sm" className="ml-2 text-gray-300">
              <SortAsc className="h-4 w-4 mr-1" /> Sort
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
          {COLUMN_DEFINITIONS.map(column => (
            <div key={column.id} className="kanban-column bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col">
              <div className="p-4 border-b border-gray-700 bg-gray-750 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className={`h-3 w-3 ${column.color} rounded-full mr-2`}></span>
                    <h3 className="font-medium text-white">{column.title}</h3>
                  </div>
                  <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">0</span>
                </div>
              </div>
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                <Skeleton className="h-[140px] w-full bg-gray-750 rounded-lg" />
                <Skeleton className="h-[140px] w-full bg-gray-750 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Regular render
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Application Pipeline</h2>
        <div className="flex">
          <Button variant="ghost" size="sm" className="text-gray-300">
            <Filter className="h-4 w-4 mr-1" /> Filter
          </Button>
          <Button variant="ghost" size="sm" className="ml-2 text-gray-300">
            <SortAsc className="h-4 w-4 mr-1" /> Sort
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-2">
        {columns.map(column => (
          <div 
            key={column.id} 
            className="kanban-column bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-4 border-b border-gray-700 bg-gray-750 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`h-3 w-3 ${column.color} rounded-full mr-2`}></span>
                  <h3 className="font-medium text-white">{column.title}</h3>
                </div>
                <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                  {column.applications.length}
                </span>
              </div>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
              {column.applications.map(application => (
                <div 
                  key={application.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, application.id)}
                >
                  <ApplicationCard 
                    application={application}
                    status={column.id as keyof typeof ApplicationStatus}
                    isUpdating={isUpdating}
                  />
                </div>
              ))}
              {column.applications.length === 0 && (
                <div className="h-24 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  No applications yet
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
