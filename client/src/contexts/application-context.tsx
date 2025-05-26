import { createContext, ReactNode, useContext, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Application,
  InsertApplication,
  TimelineEvent,
  InsertTimelineEvent,
  Contact,
  InsertContact,
} from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getQueryFn } from "@/lib/queryClient";

interface ApplicationsContextType {
  applications: Application[];
  isLoading: boolean;
  error: Error | null;
  createApplication: (data: Omit<InsertApplication, "userId">) => Promise<void>;
  updateApplication: (id: number, data: Partial<Application>) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  isUpdating: boolean;
  timelineEvents: Record<number, TimelineEvent[]>;
  contacts: Record<number, Contact[]>;
  loadTimelineEvents: (applicationId: number) => Promise<void>;
  loadContacts: (applicationId: number) => Promise<void>;
  createTimelineEvent: (
    data: Omit<InsertTimelineEvent, "userId">,
  ) => Promise<void>;
  createContact: (data: Omit<InsertContact, "userId">) => Promise<void>;
}

const ApplicationsContext = createContext<ApplicationsContextType | undefined>(
  undefined,
);

export function ApplicationProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [timelineEvents, setTimelineEvents] = useState<
    Record<number, TimelineEvent[]>
  >({});
  const [contacts, setContacts] = useState<Record<number, Contact[]>>({});
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Sample demo applications
  const demoApplications: Application[] = isDemoMode
    ? [
        {
          id: 1,
          userId: 0,
          company: "Tech Innovations Inc.",
          position: "Senior Frontend Developer",
          status: "applied",
          url: "https://techinnovations.example.com/careers",
          description:
            "Senior frontend developer position focusing on React and TypeScript",
          notes: "Applied through company website. Used resume v2.0.",
          appliedDate: new Date(),
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 0,
          company: "Global Solutions Ltd.",
          position: "Full Stack Engineer",
          status: "interview",
          url: "https://globalsolutions.example.com/jobs",
          description: "Full stack role working with Node.js and React",
          notes:
            "First interview scheduled for next week. Research company products.",
          appliedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          lastActivity: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
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
          updatedAt: new Date(),
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
          updatedAt: new Date(),
        },
      ]
    : [];

  // Fetch all applications (only if not in demo mode)
  const {
    data: apiApplications = [],
    isLoading: isApiLoading,
    error: apiError,
  } = useQuery<Application[], Error>({
    queryKey: ["/api/applications"],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !isDemoMode,
    onError: (error) => {
      toast({
        title: "Error loading applications",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Use either API data or demo data
  const applications = isDemoMode ? demoApplications : apiApplications;
  const isLoading = isDemoMode ? false : isApiLoading;
  const error = isDemoMode ? null : apiError;

  // Create application
  const createApplicationMutation = useMutation({
    mutationFn: async (applicationData: Omit<InsertApplication, "userId">) => {
      const res = await apiRequest(
        "POST",
        "/api/applications",
        applicationData,
      );
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      toast({
        title: "Application created",
        description: "Your application has been successfully created",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error creating application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update application
  const updateApplicationMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<Application>;
    }) => {
      const res = await apiRequest("PATCH", `/api/applications/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Application updated",
        description: "Your application has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete application
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Application deleted",
        description: "Your application has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting application",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create timeline event
  const createTimelineEventMutation = useMutation({
    mutationFn: async (eventData: Omit<InsertTimelineEvent, "userId">) => {
      const res = await apiRequest(
        "POST",
        `/api/applications/${eventData.applicationId}/timeline`,
        eventData,
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/applications"] });
      loadTimelineEvents(variables.applicationId);
      toast({
        title: "Event added",
        description: "Timeline event has been added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding timeline event",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create contact
  const createContactMutation = useMutation({
    mutationFn: async (contactData: Omit<InsertContact, "userId">) => {
      const res = await apiRequest(
        "POST",
        `/api/applications/${contactData.applicationId}/contacts`,
        contactData,
      );
      return res.json();
    },
    onSuccess: (data, variables) => {
      loadContacts(variables.applicationId);
      toast({
        title: "Contact added",
        description: "Contact has been added",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error adding contact",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load timeline events for a specific application
  const loadTimelineEvents = async (applicationId: number) => {
    if (isDemoMode) {
      const events = getDemoTimelineEvents(applicationId);
      setTimelineEvents((prev) => ({
        ...prev,
        [applicationId]: events,
      }));
    } else {
      try {
        const res = await apiRequest(
          "GET",
          `/api/applications/${applicationId}/timeline`,
        );
        const events = await res.json();
        setTimelineEvents((prev) => ({
          ...prev,
          [applicationId]: events,
        }));
      } catch (error) {
        toast({
          title: "Error loading timeline events",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    }
  };

  // Load contacts for a specific application
  const loadContacts = async (applicationId: number) => {
    if (isDemoMode) {
      const contactList = getDemoContacts(applicationId);
      setContacts((prev) => ({
        ...prev,
        [applicationId]: contactList,
      }));
    } else {
      try {
        const res = await apiRequest(
          "GET",
          `/api/applications/${applicationId}/contacts`,
        );
        const contactList = await res.json();
        setContacts((prev) => ({
          ...prev,
          [applicationId]: contactList,
        }));
      } catch (error) {
        toast({
          title: "Error loading contacts",
          description: (error as Error).message,
          variant: "destructive",
        });
      }
    }
  };

  // Sample demo timeline events
  const getDemoTimelineEvents = (applicationId: number): TimelineEvent[] => {
    if (applicationId === 1) {
      return [
        {
          id: 1,
          userId: 0,
          applicationId: 1,
          date: new Date(),
          title: "Applied for position",
          description: "Submitted application through company website",
          type: "application",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 2,
          userId: 0,
          applicationId: 1,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
          title: "Application received",
          description: "Received confirmation email from HR",
          type: "email",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
    return [];
  };

  // Sample demo contacts
  const getDemoContacts = (applicationId: number): Contact[] => {
    if (applicationId === 2) {
      return [
        {
          id: 1,
          userId: 0,
          applicationId: 2,
          name: "Jane Smith",
          role: "HR Manager",
          email: "jane.smith@example.com",
          phone: "555-123-4567",
          notes: "Initial contact person. Very responsive to emails.",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }
    return [];
  };

  // Wrapper functions with demo mode support
  const createApplication = async (data: Omit<InsertApplication, "userId">) => {
    if (isDemoMode) {
      const newId =
        demoApplications.length > 0
          ? Math.max(...demoApplications.map((a) => a.id)) + 1
          : 1;
      const newApplication: Application = {
        id: newId,
        userId: 0,
        company: data.company,
        position: data.position,
        status: data.status || "applied",
        url: data.url || null,
        description: data.description || null,
        notes: data.notes || null,
        appliedDate: data.appliedDate || new Date(),
        lastActivity: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to demo applications
      demoApplications.push(newApplication);

      toast({
        title: "Application created",
        description:
          "Your application has been successfully created (Demo Mode)",
      });

      return newApplication;
    } else {
      return await createApplicationMutation.mutateAsync(data);
    }
  };

  const updateApplication = async (id: number, data: Partial<Application>) => {
    if (isDemoMode) {
      const index = demoApplications.findIndex((app) => app.id === id);
      if (index !== -1) {
        demoApplications[index] = {
          ...demoApplications[index],
          ...data,
          lastActivity: new Date(),
          updatedAt: new Date(),
        };

        toast({
          title: "Application updated",
          description:
            "Your application has been successfully updated (Demo Mode)",
        });
      }
    } else {
      await updateApplicationMutation.mutateAsync({ id, data });
    }
  };

  const deleteApplication = async (id: number) => {
    if (isDemoMode) {
      const index = demoApplications.findIndex((app) => app.id === id);
      if (index !== -1) {
        demoApplications.splice(index, 1);

        toast({
          title: "Application deleted",
          description:
            "Your application has been successfully deleted (Demo Mode)",
        });
      }
    } else {
      await deleteApplicationMutation.mutateAsync(id);
    }
  };

  const createTimelineEvent = async (
    data: Omit<InsertTimelineEvent, "userId">,
  ) => {
    if (isDemoMode) {
      const newId = Object.values(timelineEvents).flat().length + 1;
      const newEvent: TimelineEvent = {
        id: newId,
        userId: 0,
        applicationId: data.applicationId,
        title: data.title,
        description: data.description || "",
        type: data.type,
        date: data.date || new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to timeline events
      setTimelineEvents((prev) => ({
        ...prev,
        [data.applicationId]: [...(prev[data.applicationId] || []), newEvent],
      }));

      toast({
        title: "Event added",
        description: "Timeline event has been added (Demo Mode)",
      });
    } else {
      await createTimelineEventMutation.mutateAsync(data);
    }
  };

  const createContact = async (data: Omit<InsertContact, "userId">) => {
    if (isDemoMode) {
      const newId = Object.values(contacts).flat().length + 1;
      const newContact: Contact = {
        id: newId,
        userId: 0,
        applicationId: data.applicationId,
        name: data.name,
        role: data.role || "",
        email: data.email || "",
        phone: data.phone || "",
        notes: data.notes || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add to contacts
      setContacts((prev) => ({
        ...prev,
        [data.applicationId]: [...(prev[data.applicationId] || []), newContact],
      }));

      toast({
        title: "Contact added",
        description: "Contact has been added (Demo Mode)",
      });
    } else {
      await createContactMutation.mutateAsync(data);
    }
  };

  const isUpdating =
    updateApplicationMutation.isPending ||
    createApplicationMutation.isPending ||
    deleteApplicationMutation.isPending;

  return (
    <ApplicationsContext.Provider
      value={{
        applications,
        isLoading,
        error,
        createApplication,
        updateApplication,
        deleteApplication,
        isUpdating,
        timelineEvents,
        contacts,
        loadTimelineEvents,
        loadContacts,
        createTimelineEvent,
        createContact,
      }}
    >
      {children}
    </ApplicationsContext.Provider>
  );
}

export function useApplications() {
  const context = useContext(ApplicationsContext);
  if (context === undefined) {
    throw new Error(
      "useApplications must be used within an ApplicationProvider",
    );
  }
  return context;
}
