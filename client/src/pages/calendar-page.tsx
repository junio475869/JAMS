import { useState, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import rrulePlugin from "@fullcalendar/rrule";
import resourceTimelinePlugin from "@fullcalendar/resource-timeline";
import resourceDayGridPlugin from "@fullcalendar/resource-daygrid";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  AlertCircle,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Mail,
  Plus,
  Search,
  Share2,
  Video,
  Building,
  Link,
  Loader2,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { DateRange } from "react-day-picker";
import {
  addDays,
  addHours,
  eachDayOfInterval,
  eachHourOfInterval,
  format,
  getDay,
  getHours,
  isSameDay,
  isWeekend,
  parse,
  set,
  setHours,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  addWeeks,
  addMonths,
  getWeek,
} from "date-fns";

// Calendar event types
interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "interview" | "followup" | "deadline" | "other";
  notes?: string;
  company?: string;
  jobUrl?: string;
  companyOverview?: string;
  interviewLink?: string;
  contactEmail?: string;
  location?: string;
  startTime?: Date;
  endTime?: Date;
  description?: string;
  // New fields from Google Calendar
  htmlLink?: string;
  status?: string;
  visibility?: string;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  reminders?: {
    useDefault: boolean;
    overrides?: {
      method: string;
      minutes: number;
    }[];
  };
  timeZone?: string;
  created?: Date;
  updated?: Date;
  organizer?: {
    email: string;
    displayName?: string;
  };
}

// Calendar sources
interface CalendarSource {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

// Gmail connection
interface GmailConnection {
  id?: number;
  userId: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  expiry: Date;
  updatedAt?: Date;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

  // Gmail connection state
  const [gmailConnections, setGmailConnections] = useState<GmailConnection[]>(
    []
  );
  const [isLoadingGmail, setIsLoadingGmail] = useState(true);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Connected calendars
  const [calendarSources, setCalendarSources] = useState<CalendarSource[]>([
    { id: "primary", name: "JAMS Calendar", color: "#3b82f6", enabled: true },
    { id: "work", name: "Work Calendar", color: "#10b981", enabled: true },
    {
      id: "personal",
      name: "Personal Calendar",
      color: "#8b5cf6",
      enabled: false,
    },
  ]);

  // View type state
  const [calendarViewType, setCalendarViewType] = useState<
    "monthly" | "weekly" | "daily" | "timeline"
  >("timeline");

  // Selected event for modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [showEventModal, setShowEventModal] = useState(false);

  // Event form state
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventStartTime, setEventStartTime] = useState("");
  const [eventEndTime, setEventEndTime] = useState("");
  const [eventLocation, setEventLocation] = useState("");

  // Events state
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // Load Gmail connections
  useEffect(() => {
    const loadGmailConnections = async () => {
      try {
        const response = await fetch("/api/gmail/connections");
        if (response.ok) {
          const data = await response.json();
          setGmailConnections(data.connections);
        }
      } catch (error) {
        console.error("Error loading Gmail connections:", error);
      } finally {
        setIsLoadingGmail(false);
      }
    };

    loadGmailConnections();
  }, []);

  // Load calendar events
  useEffect(() => {
    const loadCalendarEvents = async () => {
      if (isDemoMode) {
        // Load demo events
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const mockEvents: CalendarEvent[] = [
          {
            id: "1",
            title: "Technical Interview - Acme Inc",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 3,
              14,
              0
            ),
            type: "interview",
            notes:
              "Technical interview for Software Engineer position. Focus on algorithms and system design.",
            company: "Acme Inc",
            jobUrl: "https://example.com/jobs/software-engineer",
            companyOverview:
              "Acme Inc is a leading technology company specializing in cloud infrastructure and services with over 5,000 employees worldwide.",
            interviewLink: "https://meeting.example.com/acme-interview",
            contactEmail: "recruiting@acme.example.com",
            location: "Remote (Zoom)",
          },
          {
            id: "2",
            title: "HR Interview - Globex",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 5,
              11,
              0
            ),
            type: "interview",
            notes: "HR interview to discuss compensation and benefits.",
            company: "Globex Corporation",
            jobUrl: "https://example.com/jobs/senior-developer",
            companyOverview:
              "Globex Corporation is a multinational technology firm focused on innovative software solutions and digital transformation.",
            interviewLink: "https://teams.example.com/globex-hr",
            contactEmail: "sarah.thompson@globex.example.com",
            location: "Globex HQ - Floor 12, Room 1204",
          },
          {
            id: "3",
            title: "Follow-up with Jane (Recruiter)",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 2,
              15,
              30
            ),
            type: "followup",
            notes: "Check on application status for Senior Developer role.",
            company: "TechRecruit Agency",
            contactEmail: "jane.smith@techrecruit.example.com",
            jobUrl: "https://example.com/jobs/senior-developer-initech",
          },
          {
            id: "4",
            title: "Application Deadline - Umbrella Corp",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 8,
              23,
              59
            ),
            type: "deadline",
            notes:
              "Last day to submit application for Lead Developer position.",
            company: "Umbrella Corporation",
            jobUrl: "https://example.com/jobs/lead-developer-umbrella",
            companyOverview:
              "Umbrella Corporation is a pharmaceutical company known for cutting-edge research and development in biotechnology.",
          },
          {
            id: "5",
            title: "Resume Review Session",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 1,
              13,
              0
            ),
            type: "other",
            notes: "Meet with career coach to review resume.",
            interviewLink: "https://meet.example.com/resume-review",
            contactEmail: "coach@careerservices.example.com",
            location: "Virtual Meeting",
          },
          {
            id: "6",
            title: "Technical Assessment - Wayne Enterprises",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 4,
              10,
              0
            ),
            type: "interview",
            notes: "Complete coding assessment for Senior Full Stack position.",
            company: "Wayne Enterprises",
            jobUrl: "https://example.com/jobs/senior-fullstack-wayne",
            companyOverview:
              "Wayne Enterprises is a global technology conglomerate with interests in software, hardware, and digital services.",
            interviewLink:
              "https://codingchallenge.example.com/wayne-assessment",
            contactEmail: "tech-recruiting@wayne.example.com",
          },
          {
            id: "7",
            title: "Team Interview - Cyberdyne Systems",
            date: new Date(
              currentYear,
              currentMonth,
              currentDate.getDate() + 6,
              14,
              30
            ),
            type: "interview",
            notes:
              "Panel interview with engineering team for Machine Learning Engineer role.",
            company: "Cyberdyne Systems",
            jobUrl: "https://example.com/jobs/ml-engineer-cyberdyne",
            companyOverview:
              "Cyberdyne Systems is a pioneer in AI and machine learning technologies with a focus on autonomous systems.",
            interviewLink: "https://meet.example.com/cyberdyne-panel",
            contactEmail: "mark.wilson@cyberdyne.example.com",
            location: "Cyberdyne Office - 123 Tech Parkway, Building B",
          },
        ];

        setEvents(mockEvents);
      } else {
        // Load real calendar events
        try {
          const response = await fetch("/api/calendar/events");
          if (response.ok) {
            const data = await response.json();
            // Transform Google Calendar events to our format
            const transformedEvents = data.events.flat().map((event: any) => ({
              id: event.id,
              title: event.summary,
              date: new Date(event.start?.dateTime || event.start?.date),
              type: determineEventType(event.summary, event.description),
              description: event.description,
              location: event.location,
              startTime: new Date(event.start?.dateTime || event.start?.date),
              endTime: new Date(event.end?.dateTime || event.end?.date),
              htmlLink: event.htmlLink,
              status: event.status,
              visibility: event.visibility,
              attendees: event.attendees,
              reminders: event.reminders,
              timeZone: event.start?.timeZone || event.end?.timeZone,
              created: new Date(event.created),
              updated: new Date(event.updated),
              organizer: event.organizer,
              // Extract additional metadata from description
              ...extractMetadataFromDescription(event.description),
            }));
            setEvents(transformedEvents);
          }
        } catch (error) {
          console.error("Error loading calendar events:", error);
          toast({
            title: "Error",
            description: "Failed to load calendar events",
            variant: "destructive",
          });
        }
      }
    };

    loadCalendarEvents();
  }, [isDemoMode, toast]);

  // Helper function to determine event type based on title and description
  const determineEventType = (
    title: string,
    description: string = ""
  ): CalendarEvent["type"] => {
    if (!title) return "other";
    if (!description) return "other";

    const lowerTitle = title.toLowerCase();
    const lowerDesc = description.toLowerCase();

    if (lowerTitle.includes("interview") || lowerDesc.includes("interview")) {
      return "interview";
    }
    if (lowerTitle.includes("follow") || lowerDesc.includes("follow")) {
      return "followup";
    }
    if (lowerTitle.includes("deadline") || lowerDesc.includes("deadline")) {
      return "deadline";
    }
    return "other";
  };

  // Helper function to extract metadata from event description
  const extractMetadataFromDescription = (description: string = "") => {
    const metadata: any = {};

    // Extract company name
    const companyMatch = description.match(/Company:\s*([^\n]+)/i);
    if (companyMatch) {
      metadata.company = companyMatch[1].trim();
    }

    // Extract job URL
    const jobUrlMatch = description.match(/Job URL:\s*(https?:\/\/[^\s\n]+)/i);
    if (jobUrlMatch) {
      metadata.jobUrl = jobUrlMatch[1].trim();
    }

    // Extract contact email
    const emailMatch = description.match(
      /Contact:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i
    );
    if (emailMatch) {
      metadata.contactEmail = emailMatch[1].trim();
    }

    // Extract interview link
    const interviewLinkMatch = description.match(
      /Interview Link:\s*(https?:\/\/[^\s\n]+)/i
    );
    if (interviewLinkMatch) {
      metadata.interviewLink = interviewLinkMatch[1].trim();
    }

    return metadata;
  };

  // Handle Gmail calendar connection
  const handleConnectCalendar = async () => {
    try {
      const response = await fetch("/api/gmail/auth");
      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to Google Calendar",
        variant: "destructive",
      });
    }
  };

  // Handle calendar sync
  const handleCalendarSync = async () => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Calendar sync is not available in demo mode",
      });
      return;
    }

    setIsSyncingCalendar(true);
    try {
      const response = await fetch("/api/calendar/sync", {
        method: "POST",
      });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events);
        toast({
          title: "Success",
          description: "Calendar synchronized successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync calendar",
        variant: "destructive",
      });
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Handle form submission for creating a new event
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Event creation is not available in demo mode",
      });
      return;
    }

    try {
      const startTime = new Date(`${eventDate}T${eventStartTime}`);
      const endTime = new Date(`${eventDate}T${eventEndTime}`);

      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: eventTitle,
          description: eventDescription,
          startTime,
          endTime,
          location: eventLocation,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create event");
      }

      const newEvent = await response.json();
      setEvents((prev) => [...prev, newEvent]);

      // Reset form
      setEventTitle("");
      setEventDescription("");
      setEventDate("");
      setEventStartTime("");
      setEventEndTime("");
      setEventLocation("");
      setShowEventModal(false);

      toast({
        title: "Success",
        description: "Event created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    }
  };

  // Toggle calendar source
  const toggleCalendarSource = (id: string) => {
    setCalendarSources((sources) =>
      sources.map((source) =>
        source.id === id ? { ...source, enabled: !source.enabled } : source
      )
    );
  };

  // Format day based on events
  const formatDayWithEvents = (day: Date) => {
    const dayEvents = events.filter((event) => isSameDay(event.date, day));
    const hasEvents = dayEvents.length > 0;

    return {
      hasEvents,
      isWeekend: isWeekend(day),
      events: dayEvents,
    };
  };

  // Generate availability text
  const generateAvailabilityText = () => {
    if (!dateRange?.from || !dateRange?.to) return "";

    const availabilityLines = [];
    let currentDate = dateRange.from;

    while (currentDate <= (dateRange.to || dateRange.from)) {
      if (!isWeekend(currentDate)) {
        const dateStr = format(currentDate, "EEE MMM do");
        availabilityLines.push(`- ${dateStr}: 9am-12pm, 2pm-5pm`);
      }
      currentDate = addDays(currentDate, 1);
    }

    return `I'm available on the following days:\n${availabilityLines.join("\n")}\n\nPlease let me know what works best for you.`;
  };

  // Find today's events
  const todayEvents = events.filter((event) =>
    isSameDay(event.date, new Date())
  );

  // Find upcoming events (next 7 days)
  const upcomingEvents = events
    .filter((event) => {
      const now = new Date();
      const sevenDaysFromNow = addDays(now, 7);
      return event.date > now && event.date <= sevenDaysFromNow;
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  // Handle view event click
  const handleViewEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Event type to badge color mapping
  const getEventBadgeColor = (type: string) => {
    switch (type) {
      case "interview":
        return "bg-blue-500 hover:bg-blue-600";
      case "followup":
        return "bg-purple-500 hover:bg-purple-600";
      case "deadline":
        return "bg-red-500 hover:bg-red-600";
      default:
        return "bg-gray-500 hover:bg-gray-600";
    }
  };

  // Weekly view data preparation
  const getWeeklyViewData = () => {
    const today = date || new Date();
    const startOfWeekDate = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const endOfWeekDate = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const days = eachDayOfInterval({
      start: startOfWeekDate,
      end: endOfWeekDate,
    });

    const dayEvents = days.map((day) => ({
      date: day,
      events: events.filter((event) => isSameDay(event.date, day)),
    }));

    return dayEvents;
  };

  // Daily view data preparation
  const getDailyViewData = () => {
    const viewDate = date || new Date();
    const workHoursStart = 8; // 8 AM
    const workHoursEnd = 18; // 6 PM

    const hours = Array.from(
      { length: workHoursEnd - workHoursStart + 1 },
      (_, i) => workHoursStart + i
    );

    const hourEvents = hours.map((hour) => {
      const hourStart = setHours(viewDate, hour);
      const hourEnd = setHours(viewDate, hour + 1);
      return {
        hour,
        time: format(hourStart, "h:mm a"),
        events: events.filter(
          (event) =>
            isSameDay(event.date, viewDate) && getHours(event.date) === hour
        ),
      };
    });

    return hourEvents;
  };

  // Timeline view data preparation
  const getTimelineViewData = () => {
    const today = date || new Date();
    const startDate = subDays(today, 3);
    const endDate = addDays(today, 10);

    const days = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    return days.map((day) => ({
      date: day,
      isToday: isSameDay(day, new Date()),
      isWeekend: isWeekend(day),
      events: events.filter((event) => isSameDay(event.date, day)),
    }));
  };

  // Transform events for FullCalendar
  const getFullCalendarEvents = () => {
    return events.map((event) => ({
      id: event.id,
      title: event.title,
      start: event.startTime || event.date,
      end: event.endTime || addHours(event.date, 1),
      extendedProps: {
        type: event.type,
        description: event.description,
        location: event.location,
        company: event.company,
        jobUrl: event.jobUrl,
        interviewLink: event.interviewLink,
        contactEmail: event.contactEmail,
        htmlLink: event.htmlLink,
        status: event.status,
        visibility: event.visibility,
        attendees: event.attendees,
        reminders: event.reminders,
        timeZone: event.timeZone,
      },
      backgroundColor: getEventColor(event.type),
      borderColor: getEventColor(event.type),
    }));
  };

  // Get event color based on type
  const getEventColor = (type: string) => {
    switch (type) {
      case "interview":
        return "#3b82f6"; // blue-500
      case "followup":
        return "#8b5cf6"; // purple-500
      case "deadline":
        return "#ef4444"; // red-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    const event = events.find((e) => e.id === info.event.id);
    if (event) {
      setSelectedEvent(event);
      setShowEventModal(true);
    }
  };

  // Handle date click
  const handleDateClick = (info: any) => {
    setDate(info.date);
    setShowEventModal(true);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {isDemoMode && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-300 font-medium">
            You're in demo mode. Calendar features are limited with sample data
            only.
          </p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Calendar</h1>
        <div className="flex gap-2">
          {!isDemoMode && (
            <Button
              variant="outline"
              onClick={handleCalendarSync}
              disabled={isSyncingCalendar}
            >
              {isSyncingCalendar ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sync Calendar
            </Button>
          )}
          <Button onClick={handleConnectCalendar}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Calendar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <Card className="mb-6">
            <CardContent className="p-6">
              <FullCalendar
                plugins={[
                  dayGridPlugin,
                  timeGridPlugin,
                  interactionPlugin,
                  listPlugin,
                  multiMonthPlugin,
                  rrulePlugin,
                  resourceTimelinePlugin,
                  resourceDayGridPlugin,
                ]}
                initialView="timeGridWeek"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "multiMonthYear,dayGridMonth,timeGridWeek,timeGridDay,listWeek,resourceTimelineDay",
                }}
                views={{
                  multiMonthYear: {
                    type: "multiMonth",
                    duration: { years: 1 },
                    multiMonthMaxColumns: 3,
                    multiMonthMinWidth: 300,
                  },
                  timeGridWeek: {
                    titleFormat: { year: "numeric", month: "long", day: "2-digit" },
                    slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: true },
                    slotMinTime: "08:00:00",
                    slotMaxTime: "20:00:00",
                    slotDuration: "00:30:00",
                    allDaySlot: true,
                    allDayText: "All Day",
                    nowIndicator: true,
                    eventMinHeight: 25,
                    eventMinWidth: 25,
                    eventMaxStack: 3,
                    eventOverlap: true,
                  },
                  listWeek: {
                    listDayFormat: { weekday: "long", month: "long", day: "numeric", year: "numeric" },
                    listDaySideFormat: { hour: "2-digit", minute: "2-digit", hour12: true },
                    noEventsMessage: "No events to display",
                  },
                  resourceTimelineDay: {
                    resourceAreaWidth: "15%",
                    slotDuration: "00:30:00",
                    slotLabelFormat: { hour: "2-digit", minute: "2-digit", hour12: true },
                  },
                }}
                events={getFullCalendarEvents()}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                height="auto"
                nowIndicator={true}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                eventTimeFormat={{
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                }}
                slotMinTime="08:00:00"
                slotMaxTime="20:00:00"
                allDaySlot={true}
                slotDuration="00:30:00"
                expandRows={true}
                stickyHeaderDates={true}
                dayHeaderFormat={{ weekday: "long" }}
                eventDisplay="block"
                eventMinHeight={25}
                eventMinWidth={25}
                eventMaxStack={3}
                eventOverlap={true}
                eventConstraint={{
                  startTime: "08:00",
                  endTime: "20:00",
                  dows: [1, 2, 3, 4, 5], // Monday to Friday
                }}
                eventDidMount={(info) => {
                  // Add tooltips or custom styling
                  info.el.title = info.event.title;
                  // Add custom classes based on event type
                  const eventType = info.event.extendedProps.type;
                  info.el.classList.add(`event-type-${eventType}`);
                }}
                select={(info) => {
                  // Handle date range selection
                  setDateRange({
                    from: info.start,
                    to: info.end,
                  });
                  setShowEventModal(true);
                }}
                eventDrop={(info) => {
                  // Handle event drag and drop
                  const event = events.find((e) => e.id === info.event.id);
                  if (event) {
                    event.date = info.event.start!;
                    if (info.event.end) {
                      event.endTime = info.event.end;
                    }
                    // Update event in backend
                    toast({
                      title: "Event moved",
                      description: `${event.title} has been moved to ${format(event.date, "PPp")}`,
                    });
                  }
                }}
                eventResize={(info) => {
                  // Handle event resizing
                  const event = events.find((e) => e.id === info.event.id);
                  if (event) {
                    event.date = info.event.start!;
                    if (info.event.end) {
                      event.endTime = info.event.end;
                    }
                    // Update event in backend
                    toast({
                      title: "Event resized",
                      description: `${event.title} duration has been updated`,
                    });
                  }
                }}
                datesSet={(info) => {
                  // Handle view change
                  setDate(info.start);
                }}
                loading={(isLoading) => {
                  // Handle loading state
                  if (isLoading) {
                    toast({
                      title: "Loading events",
                      description: "Please wait while we fetch your calendar events",
                    });
                  }
                }}
                eventContent={(info) => {
                  // Custom event rendering
                  return (
                    <div className="fc-event-main-frame">
                      <div className="fc-event-title-container">
                        <div className="fc-event-title fc-sticky">
                          {info.event.title}
                        </div>
                      </div>
                      {info.event.extendedProps.location && (
                        <div className="fc-event-location text-xs text-muted-foreground">
                          {info.event.extendedProps.location}
                        </div>
                      )}
                    </div>
                  );
                }}
                dayMaxEventRows={true}
                moreLinkContent={(args) => {
                  return `+${args.num} more`;
                }}
                navLinks={true}
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                  startTime: "08:00",
                  endTime: "20:00",
                }}
                firstDay={0} // Start week on Sunday
                weekNumbers={true}
                weekText="Week"
                eventMinDistance={5}
                eventLongPressDelay={300}
                longPressDelay={300}
                forceEventDuration={true}
                displayEventTime={true}
                displayEventEnd={true}
                eventOrder="start,-duration"
                rerenderDelay={10}
                progressiveEventRendering={true}
                handleWindowResize={true}
                windowResizeDelay={100}
                locale="en"
                direction="ltr"
                buttonText={{
                  today: "Today",
                  month: "Month",
                  week: "Week",
                  day: "Day",
                  list: "List",
                }}
                titleFormat={{
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }}
                // Add custom CSS classes
                className="calendar-container"
                // Add custom event colors
                eventColor={getEventColor}
                // Add custom event background colors
                eventBackgroundColor={getEventColor}
                // Add custom event border colors
                eventBorderColor={getEventColor}
                // Add custom event text colors
                // eventTextColor="#ffffff"
              />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Events</CardTitle>
                  <CardDescription>
                    Your schedule for the next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingEvents.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingEvents.map((event) => (
                        <button
                          key={event.id}
                          className="w-full text-left border rounded-md p-3 hover:border-primary transition-colors"
                          onClick={() => handleViewEvent(event)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <CalendarIcon className="h-3 w-3 mr-1" />
                                {format(event.date, "EEE, MMM d")} at{" "}
                                {format(event.date, "h:mm a")}
                              </div>
                            </div>
                            <Badge className={getEventBadgeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          {event.company && (
                            <div className="text-sm mt-2">
                              <span className="text-muted-foreground">
                                Company:
                              </span>{" "}
                              {event.company}
                            </div>
                          )}
                          {event.location && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">
                                Location:
                              </span>{" "}
                              {event.location}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium mb-2">
                        No upcoming events
                      </h3>
                      <p className="text-muted-foreground">
                        You don't have any events scheduled for the next 7 days.
                      </p>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/calendar/events", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            summary: "New Event",
                            description: "Event Description",
                            startTime: new Date(),
                            endTime: new Date(Date.now() + 3600000), // 1 hour later
                            location: "Virtual",
                          }),
                        });

                        if (!response.ok) {
                          throw new Error("Failed to create event");
                        }

                        toast({
                          title: "Event created",
                          description:
                            "The event has been added to your calendar",
                        });
                      } catch (error) {
                        toast({
                          title: "Error",
                          description:
                            "Failed to create event. Make sure your Google Calendar is connected.",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Event
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div>
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Today</CardTitle>
                  <CardDescription>
                    {format(new Date(), "EEEE, MMMM do, yyyy")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {todayEvents.length > 0 ? (
                    <div className="space-y-4">
                      {todayEvents.map((event) => (
                        <button
                          key={event.id}
                          className="w-full text-left border rounded-md p-3 hover:border-primary transition-colors"
                          onClick={() => handleViewEvent(event)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{event.title}</div>
                              <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Clock className="h-3 w-3 mr-1" />
                                {format(event.date, "h:mm a")}
                              </div>
                            </div>
                            <Badge className={getEventBadgeColor(event.type)}>
                              {event.type}
                            </Badge>
                          </div>
                          {event.notes && (
                            <p className="text-sm mt-2 text-muted-foreground">
                              {event.notes}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CalendarIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">
                        No events scheduled for today
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Calendar Legend</CardTitle>
                  <CardDescription>
                    Event types and their colors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-500">interview</Badge>
                      <span className="text-sm">Interview events</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-500">followup</Badge>
                      <span className="text-sm">Follow-up tasks</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-500">deadline</Badge>
                      <span className="text-sm">Application deadlines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-500">other</Badge>
                      <span className="text-sm">Other events</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="availability">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Share Your Availability</CardTitle>
                <CardDescription>
                  Select a date range to generate availability text
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <Calendar
                    mode="range"
                    selected={dateRange}
                    onSelect={(dateRange) => setDateRange(dateRange)}
                    numberOfMonths={2}
                    className="w-full"
                    modifiers={{
                      weekend: isWeekend,
                    }}
                    modifiersClassNames={{
                      weekend: "text-red-500",
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="time-preferences">Time Preferences</Label>
                    <Select defaultValue="default">
                      <SelectTrigger id="time-preferences">
                        <SelectValue placeholder="Select time preferences" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">
                          Standard work hours (9am-5pm)
                        </SelectItem>
                        <SelectItem value="morning">
                          Morning only (9am-12pm)
                        </SelectItem>
                        <SelectItem value="afternoon">
                          Afternoon only (1pm-5pm)
                        </SelectItem>
                        <SelectItem value="flexible">Flexible hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select defaultValue="est">
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select your timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="est">
                          Eastern Time (EST/EDT)
                        </SelectItem>
                        <SelectItem value="cst">
                          Central Time (CST/CDT)
                        </SelectItem>
                        <SelectItem value="mst">
                          Mountain Time (MST/MDT)
                        </SelectItem>
                        <SelectItem value="pst">
                          Pacific Time (PST/PDT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability Text</CardTitle>
                <CardDescription>
                  Copy and paste into emails or messages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-md p-4 min-h-40">
                  <pre className="whitespace-pre-wrap text-sm">
                    {generateAvailabilityText() ||
                      "Select a date range to generate availability text"}
                  </pre>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() =>
                    toast({
                      title: "Availability copied to clipboard",
                      description:
                        "You can now paste it into your email or message",
                    })
                  }
                >
                  Copy Text
                </Button>
                <Button
                  onClick={() =>
                    toast({
                      title: "Sharing not available in demo",
                      description:
                        "This would generate a shareable link with your availability",
                    })
                  }
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Calendars</CardTitle>
                <CardDescription>
                  Manage your connected calendar accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {calendarSources.map((source) => (
                    <div
                      key={source.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: source.color }}
                        ></div>
                        <div>{source.name}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={`calendar-${source.id}`}
                          checked={source.enabled}
                          onCheckedChange={() =>
                            toggleCalendarSource(source.id)
                          }
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            toast({
                              title: "Not available in demo mode",
                              description: "This would open calendar settings",
                            })
                          }
                        >
                          Settings
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    toast({
                      title: "Not available in demo mode",
                      description:
                        "This would allow connecting to Google, Outlook, or other calendar services",
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect New Calendar
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>
                  Manage calendar notifications and reminders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-interviews" className="flex-1">
                      Interview reminders
                    </Label>
                    <Select defaultValue="1hour">
                      <SelectTrigger id="notify-interviews" className="w-32">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15min">15 minutes</SelectItem>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                        <SelectItem value="3hour">3 hours</SelectItem>
                        <SelectItem value="1day">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="notify-deadlines" className="flex-1">
                      Application deadline alerts
                    </Label>
                    <Select defaultValue="1day">
                      <SelectTrigger id="notify-deadlines" className="w-32">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3hour">3 hours</SelectItem>
                        <SelectItem value="1day">1 day</SelectItem>
                        <SelectItem value="2day">2 days</SelectItem>
                        <SelectItem value="1week">1 week</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-4">
                    <Checkbox id="email-notifications" />
                    <Label htmlFor="email-notifications">
                      Email notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="browser-notifications" />
                    <Label htmlFor="browser-notifications">
                      Browser notifications
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox id="slack-notifications" />
                    <Label htmlFor="slack-notifications">
                      Slack notifications
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Calendar Integration</CardTitle>
                <CardDescription>
                  Import and export calendar data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
                  <div className="flex items-center space-x-3">
                    <AlertCircle className="h-5 w-5" />
                    <div className="font-medium">
                      Google Calendar integration is disabled in demo mode
                    </div>
                  </div>
                  <div className="mt-2 pl-8 text-sm">
                    In a real implementation, you would be able to connect to
                    Google Calendar, Outlook, and Apple Calendar.
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast({
                        title: "Not available in demo mode",
                        description:
                          "This would import events from connected calendars",
                      })
                    }
                  >
                    Import Calendar Events
                  </Button>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() =>
                      toast({
                        title: "Not available in demo mode",
                        description:
                          "This would export your calendar in iCal format",
                      })
                    }
                  >
                    Export Calendar (iCal)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
        <DialogContent className="max-w-3xl max-h-[calc(100vh-100px)]">
          {selectedEvent ? (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Badge className={getEventBadgeColor(selectedEvent.type)}>
                    {selectedEvent.type}
                  </Badge>
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                </div>
                <DialogDescription>
                  {format(selectedEvent.date, "EEEE, MMMM d, yyyy")} at{" "}
                  {format(selectedEvent.date, "h:mm a")}
                  {selectedEvent.timeZone && ` (${selectedEvent.timeZone})`}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedEvent.location && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-1">Company</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.company || "N/A"}
                    </p>
                  </div>

                  {selectedEvent.attendees &&
                    selectedEvent.attendees.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium mb-1">Attendees</h3>
                        <div className="space-y-1">
                          {selectedEvent.attendees.map((attendee, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">
                                {attendee.displayName || attendee.email}
                                {attendee.responseStatus && (
                                  <Badge variant="outline" className="ml-2">
                                    {attendee.responseStatus}
                                  </Badge>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  {selectedEvent.reminders && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Reminders</h3>
                      <div className="space-y-1">
                        {selectedEvent.reminders.overrides?.map(
                          (reminder, index) => (
                            <div
                              key={index}
                              className="text-sm text-muted-foreground"
                            >
                              {reminder.method}: {reminder.minutes} minutes
                              before
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium mb-1">Contact</h3>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedEvent.contactEmail ? (
                        <a
                          href={`mailto:${selectedEvent.contactEmail}`}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {selectedEvent.contactEmail}
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Interview Link</h3>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      {selectedEvent.interviewLink ? (
                        <a
                          href={selectedEvent.interviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Job Posting</h3>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      {selectedEvent.jobUrl ? (
                        <a
                          href={selectedEvent.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View Job Posting
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-1">Calendar Link</h3>
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                      {selectedEvent.htmlLink ? (
                        <a
                          href={selectedEvent.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View in Google Calendar
                        </a>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          N/A
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedEvent.description && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Description</h3>
                      <ScrollArea className="max-h-[calc(100vh-300px)]">
                        <div
                          className="text-sm text-muted-foreground prose prose-sm max-w-none whitespace-pre-line"
                          dangerouslySetInnerHTML={{
                            __html: selectedEvent.description,
                          }}
                        />
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex justify-between items-center gap-2">
                <div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      toast({
                        title: "Not available in demo mode",
                        description:
                          "This would add the event to your calendar",
                      })
                    }
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Add to Calendar
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEventModal(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      toast({
                        title: "Email composed",
                        description:
                          "A new email to the contact has been prepared",
                      });
                      setShowEventModal(false);
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Email Contact
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <div>
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add a new event to your calendar
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Event Title</Label>
                  <Input
                    id="title"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={eventLocation}
                      onChange={(e) => setEventLocation(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={eventStartTime}
                      onChange={(e) => setEventStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={eventEndTime}
                      onChange={(e) => setEventEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Create Event</Button>
                </DialogFooter>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
