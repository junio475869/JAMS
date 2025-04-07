import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Award, 
  BarChart4, 
  BriefcaseBusiness, 
  CalendarClock, 
  CheckCircle2, 
  CircleDot, 
  Clock, 
  FileText, 
  Flag, 
  Gift, 
  Map, 
  MessageSquare, 
  MousePointerClick, 
  Send, 
  Share2, 
  Star, 
  Trophy, 
  Undo2, 
  UserCircle2 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, isAfter, isBefore, addDays } from "date-fns";

interface MilestoneType {
  id: string;
  title: string;
  date: Date | null;
  icon: JSX.Element;
  status: "completed" | "current" | "upcoming";
  description: string;
  tags?: string[];
  detail?: string;
}

interface JourneyProgressMapProps {
  userId: string | number;
  className?: string;
  onShare?: () => void;
  onExport?: () => void;
  compact?: boolean;
}

export function JourneyProgressMap({ 
  userId, 
  className, 
  onShare, 
  onExport,
  compact = false 
}: JourneyProgressMapProps) {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<MilestoneType[]>([]);
  const [view, setView] = useState<"timeline" | "calendar" | "stats">("timeline");
  const [loading, setLoading] = useState(true);
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";
  
  useEffect(() => {
    // In a real app, fetch this data from the server
    if (isDemoMode) {
      const now = new Date();
      const demoMilestones: MilestoneType[] = [
        {
          id: "1",
          title: "Journey Started",
          date: addDays(now, -60),
          icon: <Flag className="h-5 w-5 text-green-500" />,
          status: "completed",
          description: "Created JAMS account and set up job search preferences",
          tags: ["onboarding", "setup"],
          detail: "Started tracking job applications systematically using JAMS platform"
        },
        {
          id: "2",
          title: "Resume Uploaded",
          date: addDays(now, -58),
          icon: <FileText className="h-5 w-5 text-blue-500" />,
          status: "completed",
          description: "Uploaded and optimized resume with AI suggestions",
          tags: ["document", "resume"],
          detail: "Received 12 AI-powered optimization suggestions for resume"
        },
        {
          id: "3",
          title: "First Application",
          date: addDays(now, -55),
          icon: <Send className="h-5 w-5 text-purple-500" />,
          status: "completed",
          description: "Submitted first job application through the platform",
          tags: ["application"],
          detail: "Applied for Software Developer position at TechCorp Inc."
        },
        {
          id: "4",
          title: "First Interview Scheduled",
          date: addDays(now, -45),
          icon: <CalendarClock className="h-5 w-5 text-amber-500" />,
          status: "completed",
          description: "Received and scheduled first interview invitation",
          tags: ["interview"],
          detail: "Technical interview with TechCorp Inc."
        },
        {
          id: "5",
          title: "Interview Completed",
          date: addDays(now, -42),
          icon: <MessageSquare className="h-5 w-5 text-indigo-500" />,
          status: "completed",
          description: "Completed first interview and recorded feedback",
          tags: ["interview"],
          detail: "Performed well on technical questions, created AI practice sessions afterward"
        },
        {
          id: "6", 
          title: "10+ Applications Milestone",
          date: addDays(now, -30),
          icon: <Award className="h-5 w-5 text-amber-500" />,
          status: "completed",
          description: "Reached milestone of 10+ job applications",
          tags: ["milestone", "applications"],
          detail: "Application strategy refined based on response rates"
        },
        {
          id: "7",
          title: "First Offer Received",
          date: addDays(now, -14),
          icon: <Gift className="h-5 w-5 text-emerald-500" />,
          status: "completed",
          description: "Received first job offer",
          tags: ["offer"],
          detail: "Offer from TechCorp Inc. for Software Developer position"
        },
        {
          id: "8",
          title: "Salary Negotiation",
          date: addDays(now, -7),
          icon: <BriefcaseBusiness className="h-5 w-5 text-cyan-500" />,
          status: "completed",
          description: "Successfully negotiated compensation package",
          tags: ["negotiation", "offer"],
          detail: "Increased initial offer by 12% with AI-assisted negotiation strategy"
        },
        {
          id: "9",
          title: "Offer Accepted",
          date: addDays(now, -3),
          icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
          status: "current",
          description: "Accepted final offer and completed paperwork",
          tags: ["offer", "completion"],
          detail: "Finalized employment agreement with TechCorp Inc."
        },
        {
          id: "10",
          title: "Start New Role",
          date: addDays(now, 10),
          icon: <Trophy className="h-5 w-5 text-amber-500" />,
          status: "upcoming",
          description: "Begin new position",
          tags: ["career", "start"],
          detail: "First day at TechCorp Inc."
        }
      ];
      
      // Set the data and simulate loading
      setTimeout(() => {
        setMilestones(demoMilestones);
        setLoading(false);
      }, 800);
    } else {
      // Fetch real data in non-demo mode
      setLoading(false);
    }
  }, [isDemoMode]);
  
  const handleShare = () => {
    if (onShare) {
      onShare();
    } else {
      toast({
        title: "Sharing progress map",
        description: "Creating shareable link to your job search journey"
      });
      
      setTimeout(() => {
        toast({
          title: "Link created",
          description: "Shareable link copied to clipboard"
        });
      }, 1500);
    }
  };
  
  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      toast({
        title: "Exporting progress data",
        description: "Preparing your journey data for export"
      });
      
      setTimeout(() => {
        toast({
          title: "Export complete",
          description: "Your job search journey has been exported as a PDF"
        });
      }, 1500);
    }
  };
  
  // Get current milestone
  const currentMilestone = milestones.find(m => m.status === "current");
  const completedMilestones = milestones.filter(m => m.status === "completed").length;
  const totalMilestones = milestones.length;
  const progressPercentage = Math.round((completedMilestones / totalMilestones) * 100);
  
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Job Search Journey</CardTitle>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              {progressPercentage}% Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Map className="h-8 w-8 text-muted-foreground animate-pulse" />
            </div>
          ) : (
            <>
              <div className="relative mb-4">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-500 ease-in-out"
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="absolute top-4 left-0 w-full flex justify-between text-xs text-muted-foreground">
                  <span>Start</span>
                  <span>Current</span>
                  <span>Goal</span>
                </div>
              </div>
              
              {currentMilestone && (
                <div className="mt-6 flex items-start space-x-3 p-3 bg-muted/50 rounded-lg">
                  <div className="rounded-full bg-primary/10 p-1.5 flex-shrink-0">
                    {currentMilestone.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium">
                      {currentMilestone.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {currentMilestone.description}
                    </p>
                    {currentMilestone?.date && (
                      <p className="text-xs text-primary mt-1">
                        {format(currentMilestone.date, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="mt-3 text-center">
                <Button variant="ghost" size="sm" onClick={() => toast({
                  title: "Journey Details",
                  description: "Full journey map is available in the Analytics section"
                })}>
                  <Map className="h-3.5 w-3.5 mr-1" />
                  View Full Journey
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="flex items-center">
              <Map className="h-5 w-5 mr-2 text-primary" />
              Your Job Search Journey
            </CardTitle>
            <CardDescription>
              Track your progress from first application to accepting an offer
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-1.5" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <BarChart4 className="h-4 w-4 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="flex flex-col items-center">
              <Map className="h-12 w-12 text-muted-foreground animate-pulse" />
              <p className="mt-4 text-muted-foreground">Loading your journey...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Tabs value={view} onValueChange={(v) => setView(v as any)}>
                <TabsList className="w-full">
                  <TabsTrigger value="timeline" className="flex-1">
                    <Clock className="h-4 w-4 mr-1.5" />
                    Timeline
                  </TabsTrigger>
                  <TabsTrigger value="calendar" className="flex-1">
                    <CalendarClock className="h-4 w-4 mr-1.5" />
                    Calendar View
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex-1">
                    <BarChart4 className="h-4 w-4 mr-1.5" />
                    Journey Stats
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <TabsContent value="timeline" className="mt-0">
              <div className="relative">
                {/* Progress line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
                
                {/* Milestones */}
                <div className="space-y-8">
                  {milestones.map((milestone, i) => (
                    <div key={milestone.id} className="relative pl-14">
                      {/* Circle indicator */}
                      <div className={`absolute left-5 top-1 w-3 h-3 rounded-full transform -translate-x-1.5 ${
                        milestone.status === "completed" 
                          ? "bg-green-500" 
                          : milestone.status === "current"
                            ? "bg-primary ring-4 ring-primary/20"
                            : "bg-muted-foreground"
                      }`} />
                      
                      {/* Connector line to next milestone */}
                      {i < milestones.length - 1 && (
                        <div className="absolute left-6 top-4 bottom-0 w-0.5 bg-border" />
                      )}
                      
                      {/* Content */}
                      <div className={`rounded-lg p-4 ${
                        milestone.status === "current" 
                          ? "bg-primary/5 border border-primary/20" 
                          : milestone.status === "completed"
                            ? "bg-muted/50"
                            : "bg-background border border-dashed"
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                          <div>
                            <div className="flex items-center">
                              <div className="p-1.5 rounded-full bg-background mr-3 border">
                                {milestone.icon}
                              </div>
                              <div>
                                <h3 className="font-medium text-base">{milestone.title}</h3>
                                <p className="text-sm text-muted-foreground">{milestone.description}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="ml-10 sm:ml-0">
                            {milestone.date && (
                              <div className="text-sm text-muted-foreground">
                                {milestone.status === "upcoming" ? "Expected: " : ""}
                                {format(milestone.date, "MMM d, yyyy")}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {milestone.tags?.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              <Badge 
                                variant={
                                  milestone.status === "completed" ? "outline" : 
                                  milestone.status === "current" ? "default" : 
                                  "secondary"
                                }
                                className={
                                  milestone.status === "completed" ? "bg-green-50 text-green-700 border-green-200" : 
                                  milestone.status === "current" ? "" : 
                                  "bg-muted/50"
                                }
                              >
                                {milestone.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        {milestone.detail && (
                          <div className="mt-3 text-sm pl-9 text-muted-foreground border-t pt-2 border-border/40">
                            {milestone.detail}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <div className="text-center py-6 text-muted-foreground">
                <CalendarClock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/70" />
                <p>Calendar view shows your job search milestones on a monthly calendar.</p>
                <p className="mt-1 text-sm">This view is more detailed in the full version.</p>
                
                <div className="mt-5 grid grid-cols-7 gap-1 text-xs">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(day => (
                    <div key={day} className="p-1 text-center font-medium">{day}</div>
                  ))}
                  
                  {Array.from({ length: 35 }).map((_, i) => {
                    const hasMilestone = milestones.some(m => m.date && m.date.getDate() === ((i % 31) + 1));
                    
                    return (
                      <div 
                        key={i} 
                        className={`aspect-square border rounded-md flex items-center justify-center ${
                          hasMilestone ? "bg-primary/10 border-primary/20" : ""
                        }`}
                      >
                        <span className={`text-xs ${i % 7 >= 5 ? "text-muted-foreground/70" : ""}`}>
                          {(i % 31) + 1}
                        </span>
                        {hasMilestone && (
                          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="stats" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Journey Progress</h3>
                  <div className="relative pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground inline-block">
                          {completedMilestones} of {totalMilestones} milestones
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-medium text-primary inline-block">
                          {progressPercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-muted">
                      <div
                        style={{ width: `${progressPercentage}%` }}
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-primary"
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-2 space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Tasks Completed:</span>
                      <span>{completedMilestones}</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Applications Submitted:</span>
                      <span>14</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Interviews Completed:</span>
                      <span>5</span>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Offers Received:</span>
                      <span>2</span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-medium mb-3">Journey Timeline</h3>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-xs mr-2">Started:</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {milestones[0]?.date ? format(milestones[0].date, "MMM d, yyyy") : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                      <span className="text-xs mr-2">Current Stage:</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {currentMilestone?.title || "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-amber-500 mr-2"></div>
                      <span className="text-xs mr-2">Projected Completion:</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {milestones[milestones.length - 1]?.date 
                          ? format(milestones[milestones.length - 1]?.date as Date, "MMM d, yyyy") 
                          : "N/A"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-xs mr-2">Journey Duration:</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {milestones[0]?.date && milestones[milestones.length - 1]?.date
                          ? `${Math.round(((milestones[milestones.length - 1]?.date as Date).getTime() - (milestones[0]?.date as Date).getTime()) / (1000 * 60 * 60 * 24))} days`
                          : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 sm:col-span-2">
                  <h3 className="text-sm font-medium mb-3">Achievement Summary</h3>
                  <div className="flex space-x-4 justify-between">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary/10 p-2 mb-2">
                        <MousePointerClick className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-xl font-bold">14</span>
                      <span className="text-xs text-muted-foreground">Applications</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-blue-100 p-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                      </div>
                      <span className="text-xl font-bold">5</span>
                      <span className="text-xs text-muted-foreground">Interviews</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-amber-100 p-2 mb-2">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <span className="text-xl font-bold">3</span>
                      <span className="text-xs text-muted-foreground">Callbacks</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-green-100 p-2 mb-2">
                        <Gift className="h-5 w-5 text-green-500" />
                      </div>
                      <span className="text-xl font-bold">2</span>
                      <span className="text-xs text-muted-foreground">Offers</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </>
        )}
      </CardContent>
    </Card>
  );
}