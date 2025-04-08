import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
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

// Demo events types
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
}

// Calendar sources
interface CalendarSource {
  id: string;
  name: string;
  color: string;
  enabled: boolean;
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7),
  });

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
  >("monthly");

  // Selected event for modal
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null,
  );
  const [showEventModal, setShowEventModal] = useState(false);

  // Generate mock events for demo mode
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");

  useEffect(() => {
    if (isDemoMode) {
      // Current month and next month
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();

      // Generate mock interview events
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          title: "Technical Interview - Acme Inc",
          date: new Date(
            currentYear,
            currentMonth,
            currentDate.getDate() + 3,
            14,
            0,
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
            0,
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
            30,
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
            59,
          ),
          type: "deadline",
          notes: "Last day to submit application for Lead Developer position.",
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
            0,
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
            0,
          ),
          type: "interview",
          notes: "Complete coding assessment for Senior Full Stack position.",
          company: "Wayne Enterprises",
          jobUrl: "https://example.com/jobs/senior-fullstack-wayne",
          companyOverview:
            "Wayne Enterprises is a global technology conglomerate with interests in software, hardware, and digital services.",
          interviewLink: "https://codingchallenge.example.com/wayne-assessment",
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
            30,
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
    }
  }, [isDemoMode]);

  // Handle form submission for creating a new event
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const newEvent = {
      title: eventTitle,
      description: eventDescription,
      date: new Date(eventDate),
    };
    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });
      if (response.ok) {
        // Optionally, you can handle successful submission
        setEventTitle("");
        setEventDescription("");
        setEventDate("");
        alert("Event created successfully!");
      } else {
        alert("Failed to create event.");
      }
    } catch (error) {
      console.error("Error creating event:", error);
    }
  };
  // Toggle calendar source
  const toggleCalendarSource = (id: string) => {
    setCalendarSources((sources) =>
      sources.map((source) =>
        source.id === id ? { ...source, enabled: !source.enabled } : source,
      ),
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
    isSameDay(event.date, new Date()),
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
      (_, i) => workHoursStart + i,
    );

    const hourEvents = hours.map((hour) => {
      const hourStart = setHours(viewDate, hour);
      const hourEnd = setHours(viewDate, hour + 1);
      return {
        hour,
        time: format(hourStart, "h:mm a"),
        events: events.filter(
          (event) =>
            isSameDay(event.date, viewDate) && getHours(event.date) === hour,
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

  return (
    <div className="container py-10">
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
        <Button
          onClick={() =>
            toast({
              title: "Calendar sync not available in demo mode",
              description:
                "Connect Google Calendar to enable calendar sync functionality.",
            })
          }
        >
          <Plus className="h-4 w-4 mr-2" />
          Connect Calendar
        </Button>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <div className="mb-6 flex flex-wrap justify-between items-center">
            <div className="flex items-center space-x-2 mb-2 sm:mb-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate((prev) =>
                    prev
                      ? subDays(
                          prev,
                          calendarViewType === "monthly"
                            ? 30
                            : calendarViewType === "weekly"
                              ? 7
                              : 1,
                        )
                      : new Date(),
                  )
                }
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setDate((prev) =>
                    prev
                      ? addDays(
                          prev,
                          calendarViewType === "monthly"
                            ? 30
                            : calendarViewType === "weekly"
                              ? 7
                              : 1,
                        )
                      : new Date(),
                  )
                }
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <span className="text-lg font-medium">
                {calendarViewType === "daily"
                  ? format(date || new Date(), "MMMM d, yyyy")
                  : calendarViewType === "weekly"
                    ? `Week of ${format(startOfWeek(date || new Date(), { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(date || new Date(), { weekStartsOn: 1 }), "MMM d, yyyy")}`
                    : format(date || new Date(), "MMMM yyyy")}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={calendarViewType}
                onValueChange={(value) => setCalendarViewType(value as any)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="timeline">Timeline</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-64 max-w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  className="pl-10"
                  onChange={(e) => {
                    // Search functionality would go here in a real implementation
                    if (e.target.value) {
                      toast({
                        title: "Search not available in demo mode",
                        description:
                          "This would search through your calendar events",
                      });
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Calendar View Tabs */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {calendarViewType === "monthly" && (
                <div>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="w-full"
                    modifiers={{
                      event: (date) =>
                        events.some((event) => isSameDay(date, event.date)),
                      weekend: isWeekend,
                    }}
                    modifiersClassNames={{
                      event: "border-2 border-primary font-bold",
                      weekend: "text-red-500",
                    }}
                  />

                  {/* Show events for selected day */}
                  {date && (
                    <div className="mt-6 border-t pt-6">
                      <h3 className="font-medium mb-4">
                        Events for {format(date, "MMMM d, yyyy")}
                      </h3>

                      {events.filter((event) => isSameDay(event.date, date))
                        .length > 0 ? (
                        <div className="space-y-3">
                          {events
                            .filter((event) => isSameDay(event.date, date))
                            .sort((a, b) => a.date.getTime() - b.date.getTime())
                            .map((event) => (
                              <button
                                key={event.id}
                                className="w-full text-left border rounded-md p-3 hover:border-primary transition-colors"
                                onClick={() => handleViewEvent(event)}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {event.title}
                                    </div>
                                    <div className="text-sm text-muted-foreground flex items-center mt-1">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {format(event.date, "h:mm a")}
                                      {event.location && (
                                        <span className="ml-2">
                                          • {event.location}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Badge
                                    className={getEventBadgeColor(event.type)}
                                  >
                                    {event.type}
                                  </Badge>
                                </div>
                              </button>
                            ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarIcon className="h-8 w-8 mx-auto mb-2" />
                          <p>No events for this day</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {calendarViewType === "weekly" && (
                <div>
                  <div className="grid grid-cols-7 gap-1">
                    {getWeeklyViewData().map((day, index) => (
                      <div
                        key={index}
                        className={`min-h-60 border rounded-md ${isSameDay(day.date, new Date()) ? "bg-primary/5 border-primary" : isWeekend(day.date) ? "bg-muted/30" : ""}`}
                      >
                        <div className="p-2 text-center border-b sticky top-0 bg-card">
                          <div className="font-medium">
                            {format(day.date, "EEE")}
                          </div>
                          <div
                            className={`text-2xl ${isSameDay(day.date, new Date()) ? "font-bold text-primary" : ""}`}
                          >
                            {format(day.date, "d")}
                          </div>
                        </div>
                        <div className="p-1">
                          {day.events.length > 0 ? (
                            <div className="space-y-1">
                              {day.events
                                .sort(
                                  (a, b) => a.date.getTime() - b.date.getTime(),
                                )
                                .map((event) => (
                                  <button
                                    key={event.id}
                                    className="w-full text-left text-xs p-1 rounded-sm bg-primary/10 hover:bg-primary/20"
                                    onClick={() => handleViewEvent(event)}
                                  >
                                    <div className="font-medium truncate">
                                      {event.title}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {format(event.date, "h:mm a")}
                                    </div>
                                  </button>
                                ))}
                            </div>
                          ) : (
                            <div className="h-full flex items-center justify-center text-xs text-muted-foreground p-4">
                              No events
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {calendarViewType === "daily" && (
                <div>
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-medium">
                      {format(date || new Date(), "EEEE, MMMM d, yyyy")}
                    </h3>
                  </div>

                  <div className="border rounded-md">
                    {getDailyViewData().map((hourSlot, index) => (
                      <div
                        key={index}
                        className={`flex border-b last:border-b-0 ${
                          hourSlot.hour === getHours(new Date())
                            ? "bg-primary/5"
                            : ""
                        }`}
                      >
                        <div className="w-20 p-2 border-r text-sm text-muted-foreground flex-shrink-0">
                          {hourSlot.time}
                        </div>
                        <div className="flex-grow p-1">
                          {hourSlot.events.length > 0 ? (
                            <div className="space-y-1">
                              {hourSlot.events.map((event) => (
                                <button
                                  key={event.id}
                                  className="w-full text-left p-2 rounded-md border border-primary/20 bg-primary/5 hover:bg-primary/10"
                                  onClick={() => handleViewEvent(event)}
                                >
                                  <div className="font-medium">
                                    {event.title}
                                  </div>
                                  <div className="text-sm text-muted-foreground flex items-center mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {format(event.date, "h:mm a")}
                                    {event.location && (
                                      <span className="ml-2">
                                        • {event.location}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {calendarViewType === "timeline" && (
                <div className="overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-[100px_minmax(0,1fr)] border rounded-md">
                      <div className="border-r">
                        <div className="h-12 border-b"></div>
                        <div className="p-2 h-12 border-b font-medium">
                          All Day
                        </div>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className="p-2 h-12 border-b text-sm text-muted-foreground"
                          >
                            {format(setHours(new Date(), i + 8), "h a")}
                          </div>
                        ))}
                      </div>

                      <div
                        className="grid"
                        style={{
                          gridTemplateColumns: `repeat(${getTimelineViewData().length}, minmax(120px, 1fr))`,
                        }}
                      >
                        {getTimelineViewData().map((day, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={`border-r last:border-r-0 ${day.isWeekend ? "bg-muted/30" : ""} ${day.isToday ? "bg-primary/5" : ""}`}
                          >
                            <div className="h-12 border-b p-2 text-center sticky top-0 bg-card">
                              <div className="font-medium">
                                {format(day.date, "EEE")}
                              </div>
                              <div
                                className={
                                  day.isToday ? "font-bold text-primary" : ""
                                }
                              >
                                {format(day.date, "MMM d")}
                              </div>
                            </div>

                            {/* All day events */}
                            <div className="p-1 h-12 border-b">
                              {day.events
                                .filter(
                                  (event) =>
                                    getHours(event.date) === 0 ||
                                    event.type === "deadline",
                                )
                                .map((event, i) => (
                                  <button
                                    key={`${event.id}-${i}`}
                                    className="w-full text-left text-xs p-0.5 rounded-sm bg-primary/10 hover:bg-primary/20 truncate"
                                    onClick={() => handleViewEvent(event)}
                                  >
                                    {event.title}
                                  </button>
                                ))}
                            </div>

                            {/* Hourly events */}
                            {Array.from({ length: 12 }).map((_, hourIndex) => {
                              const hour = hourIndex + 8; // Start from 8 AM
                              const hourEvents = day.events.filter(
                                (event) => getHours(event.date) === hour,
                              );

                              return (
                                <div
                                  key={hourIndex}
                                  className="p-1 h-12 border-b"
                                >
                                  {hourEvents.map((event) => (
                                    <button
                                      key={event.id}
                                      className={`w-full text-left text-xs p-0.5 rounded-sm ${getEventBadgeColor(event.type)} text-white truncate`}
                                      onClick={() => handleViewEvent(event)}
                                    >
                                      {format(event.date, "h:mm")} {event.title}
                                    </button>
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                    onSelect={setDateRange}
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
        <DialogContent className="max-w-3xl">
          {selectedEvent && (
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
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedEvent.notes && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Notes</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.notes}
                      </p>
                    </div>
                  )}

                  {selectedEvent.location && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Location</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.location}
                      </p>
                    </div>
                  )}

                  {selectedEvent.company && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Company</h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.company}
                      </p>
                    </div>
                  )}

                  {selectedEvent.companyOverview && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Company Overview
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {selectedEvent.companyOverview}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {selectedEvent.contactEmail && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Contact</h3>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={`mailto:${selectedEvent.contactEmail}`}
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {selectedEvent.contactEmail}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedEvent.interviewLink && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">
                        Interview Link
                      </h3>
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedEvent.interviewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          Join Meeting
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedEvent.jobUrl && (
                    <div>
                      <h3 className="text-sm font-medium mb-1">Job Posting</h3>
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        <a
                          href={selectedEvent.jobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          View Job Posting
                        </a>
                      </div>
                    </div>
                  )}
                </div>  
              </div>
              <div>
                <h1>Create Event</h1>
                <form onSubmit={handleSubmit}>
                  <Input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Event Title"
                    required
                  />
                  <Input
                    type="text"
                    value={eventDescription}
                    onChange={(e) => setEventDescription(e.target.value)}
                    placeholder="Event Description"
                  />
                  <Input
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    required
                  />
                  <Button type="submit">Create Event</Button>
                </form>
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
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
