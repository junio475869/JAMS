import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import StatsCard from "@/components/stats-card";
import KanbanBoard from "@/components/ui/kanban-board";
import InterviewList from "@/components/interview-list";
import DocumentList from "@/components/document-list";
import { JourneyProgressMap } from "@/components/journey-progress-map";
import { QuickShareButton } from "@/components/insights-sharing";
import { useAuth } from "@/hooks/use-auth";
import { Interview, Document } from "@shared/schema";
import {
  FileText,
  Users,
  Award,
  ChartPie,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

// Define the stats interface to match what's returned from the API
interface DashboardStats {
  totalApplications: number;
  interviews: number;
  offers: number;
  completionRate: number;
  statusBreakdown: { status: string; count: number }[];
  applicationsByCompany: { company: string; count: number }[];
  applicationsByMonth: { month: string; count: number }[];
  responseRate: number;
  averageDaysToInterview: number;
  averageDaysToOffer: number;
  userId?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();

  // Fetch dashboard stats
  const { data: stats, isLoading: isLoadingStats } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch upcoming interviews
  const { data: interviews, isLoading: isLoadingInterviews } = useQuery<Interview[]>({
    queryKey: ["/api/interviews"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Fetch documents
  const { data: documents, isLoading: isLoadingDocuments } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!user,
  });

  // Filter documents by type
  const resumes = documents?.filter(doc => doc.type === "resume") || [];
  const coverLetters = documents?.filter(doc => doc.type === "cover_letter") || [];

  const handleViewInterview = (interview: Interview) => {
    console.log("View interview:", interview);
    // Implement interview details modal/page
  };

  const handleNewDocument = () => {
    console.log("Create new document");
    // Implement document creation modal/page
  };

  const handleEditDocument = (document: Document) => {
    console.log("Edit document:", document);
    // Implement document editing modal/page
  };

  const handleViewDocument = (document: Document) => {
    console.log("View document:", document);
    // Implement document viewing modal/page
  };

  const handleDeleteDocument = (documentId: number) => {
    console.log("Delete document:", documentId);
    // Implement document deletion confirmation
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Job Applications</h1>
          <p className="text-muted-foreground mt-1">Track and manage your job applications</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3">
          <div className="relative mb-2 sm:mb-0">
            <select className="block w-full py-2 text-base bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm">
              <option>All applications</option>
              <option>Last 30 days</option>
              <option>Active only</option>
            </select>
          </div>
          <div className="flex space-x-2">
            <QuickShareButton text="Share" />
            <Button className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Application
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          <>
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </>
        ) : (
          <>
            <StatsCard
              label="Total Applications"
              value={stats?.totalApplications || 0}
              icon={<FileText className="h-8 w-8 text-primary bg-primary/10 p-1.5 rounded-lg" />}
              trend={{ value: 12, isPositive: true }}
            />
            <StatsCard
              label="Interviews"
              value={stats?.interviews || 0}
              icon={<Users className="h-8 w-8 text-blue-500 bg-blue-500/10 p-1.5 rounded-lg" />}
              trend={{ value: 8, isPositive: true }}
            />
            <StatsCard
              label="Offers"
              value={stats?.offers || 0}
              icon={<Award className="h-8 w-8 text-green-500 bg-green-500/10 p-1.5 rounded-lg" />}
              trend={{ value: 100, isPositive: true }}
            />
            <StatsCard
              label="Completion Rate"
              value={`${stats?.completionRate || 0}%`}
              icon={<ChartPie className="h-8 w-8 text-purple-500 bg-purple-500/10 p-1.5 rounded-lg" />}
              trend={{ value: 3, isPositive: false }}
            />
          </>
        )}
      </div>
      
      {/* Journey Progress */}
      <JourneyProgressMap 
        userId={user?.id || 0} 
        compact={true} 
        className="bg-card rounded-lg border"
      />

      {/* Kanban Board */}
      <KanbanBoard />

      {/* Upcoming Interviews & Document Management */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Upcoming Interviews</h3>
            </div>
            <div className="p-4">
              <InterviewList 
                interviews={interviews || []}
                isLoading={isLoadingInterviews}
                onViewInterview={handleViewInterview}
              />
            </div>
          </div>
        </div>

        {/* Document Management */}
        <div>
          <div className="bg-card rounded-lg border h-full">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Document Management</h3>
            </div>
            <div className="p-4">
              <DocumentList 
                title="Resumes & CVs"
                documents={resumes}
                type="resume"
                isLoading={isLoadingDocuments}
                onNewDocument={handleNewDocument}
                onEditDocument={handleEditDocument}
                onViewDocument={handleViewDocument}
                onDeleteDocument={handleDeleteDocument}
              />

              <div className="mt-6">
                <DocumentList 
                  title="Cover Letters"
                  documents={coverLetters}
                  type="cover_letter"
                  isLoading={isLoadingDocuments}
                  onNewDocument={handleNewDocument}
                  onEditDocument={handleEditDocument}
                  onViewDocument={handleViewDocument}
                  onDeleteDocument={handleDeleteDocument}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
