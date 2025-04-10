import { useMemo, useState, useEffect } from "react";
import { Application, ApplicationStatus } from "@shared/schema";
import ApplicationCard from "@/components/application-card";
import { Filter, SortAsc } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

const COLUMN_DEFINITIONS = [
  { id: ApplicationStatus.APPLIED, title: "Applied", color: "bg-sky-500" },
  {
    id: ApplicationStatus.INTERVIEW,
    title: "Interview",
    color: "bg-amber-500",
  },
  { id: ApplicationStatus.OFFER, title: "Offer", color: "bg-emerald-500" },
  { id: ApplicationStatus.REJECTED, title: "Rejected", color: "bg-rose-500" },
];

const fetchApplications = async (columnId: string, page: number) => {
  const response = await fetch(
    `/api/applications?status=${columnId}&page=${page}&limit=${ITEMS_PER_PAGE}`,
  );
  const data = await response.json();
  return {
    applications: data.applications,
    totalPages: data.totalPages,
    totalItems: data.totalItems,
  };
};

interface KanbanBoardProps {
  applications: Application[];
  onDrop: (applicationId: number, newStatus: string) => void;
  onApplicationClick: (applicationId: number) => void;
}

const ITEMS_PER_PAGE = 20;

export default function KanbanBoard({
  onDrop,
  onApplicationClick,
}: KanbanBoardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [columnPages, setColumnPages] = useState<Record<string, number>>({});
  const [columnData, setColumnData] = useState<
    Record<
      string,
      {
        applications: Application[];
        totalPages: number;
        totalItems: number;
      }
    >
  >({});

  const fetchColumnData = async (columnId: string, page: number) => {
    try {
      const response = await fetch(
        `/api/applications?status=${columnId}&page=${page}&limit=${ITEMS_PER_PAGE}`,
      );
      const data = await response.json();
      setColumnData((prev) => ({
        ...prev,
        [columnId]: {
          applications: data.applications,
          totalPages: data.totalPages,
          totalItems: data.totalItems,
        },
      }));
    } catch (error) {
      console.error(`Error fetching ${columnId} applications:`, error);
    }
  };

  useEffect(() => {
    COLUMN_DEFINITIONS.forEach((column) => {
      fetchColumnData(column.id, getColumnPage(column.id));
    });
    setIsLoading(false);
  }, []);

  // Initialize or get current page for a column
  const getColumnPage = (columnId: string) => columnPages[columnId] || 1;

  // Handle page change for a column
  const handlePageChange = async (columnId: string, newPage: number) => {
    setColumnPages((prev) => ({
      ...prev,
      [columnId]: newPage,
    }));
    await fetchColumnData(columnId, newPage);
  };

  const columns = COLUMN_DEFINITIONS.map((column) => ({
    ...column,
    applications: columnData[column.id]?.applications || [],
    totalPages: columnData[column.id]?.totalPages || 1,
    totalItems: columnData[column.id]?.totalItems || 0,
  }));

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, applicationId: number) => {
    e.dataTransfer.setData("applicationId", applicationId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    const applicationId = parseInt(e.dataTransfer.getData("applicationId"));

    if (!isNaN(applicationId)) {
      const application = applications.find((app) => app.id === applicationId);
      if (application && application.status !== columnId) {
        onDrop(applicationId, columnId);
      }
    }
  };

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
          {COLUMN_DEFINITIONS.map((column) => (
            <div
              key={column.id}
              className="kanban-column bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col"
            >
              <div className="p-4 border-b border-gray-700 bg-gray-750 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className={`h-3 w-3 ${column.color} rounded-full mr-2`}
                    ></span>
                    <h3 className="font-medium text-white">{column.title}</h3>
                  </div>
                  <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                    0
                  </span>
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
        {columns.map((column) => (
          <div
            key={column.id}
            className="kanban-column bg-gray-800 rounded-lg border border-gray-700 h-full flex flex-col"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="p-4 border-b border-gray-700 bg-gray-750 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className={`h-3 w-3 ${column.color} rounded-full mr-2`}
                  ></span>
                  <h3 className="font-medium text-white">{column.title}</h3>
                </div>
                <span className="text-sm bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
                  {column.totalApps}
                </span>
              </div>
            </div>
            <div className="flex-1 p-3 space-y-3 overflow-y-auto scrollbar-hide">
              {column.applications.map((application) => (
                <div
                  key={application.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, application.id)}
                >
                  <ApplicationCard
                    application={application}
                    status={column.id as keyof typeof ApplicationStatus}
                    isUpdating={isUpdating}
                    onClick={() => onApplicationClick(application.id)}
                  />
                </div>
              ))}
              {column.applications.length === 0 && (
                <div className="h-24 border border-dashed border-gray-700 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                  No applications yet
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">
                Showing {columnData[column.id]?.applications.length || 0} of{" "}
                {columnData[column.id]?.totalItems || 0}
              </div>
              {columnData[column.id]?.totalPages > 1 && (
                <Pagination
                  currentPage={getColumnPage(column.id)}
                  totalPages={columnData[column.id]?.totalPages || 1}
                  onPageChange={(page) => handlePageChange(column.id, page)}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
