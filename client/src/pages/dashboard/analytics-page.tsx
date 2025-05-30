import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ResponsiveBar } from "@nivo/bar";
import { ResponsivePie } from "@nivo/pie";
import { ResponsiveLine } from "@nivo/line";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, BarChart, LineChart, Download, Share2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { JourneyProgressMap } from "@/components/journey-progress-map";
import { InsightsSharing } from "@/components/insights-sharing";
import { ApplicationStatus } from "@shared/schema";

// Define types for our stats
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
}

// Format the status for display
const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    applied: "Applied",
    interview: "Interview",
    offer: "Offer",
    rejected: "Rejected",
    accepted: "Accepted"
  };
  return statusMap[status] || status;
};

// Status color mapping
const statusColors: Record<string, string> = {
  applied: "#3b82f6", // blue
  interview: "#8b5cf6", // purple
  offer: "#10b981", // green
  rejected: "#ef4444", // red
  accepted: "#f59e0b", // amber
  unknown: "#6b7280" // gray
};

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Query for dashboard stats
  const { data: stats, isLoading, error } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !isDemoMode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Mock data for demo mode
  const [demoStats, setDemoStats] = useState<DashboardStats | null>(null);
  
  useEffect(() => {
    if (isDemoMode && !demoStats) {
      // Generate mock data for demo mode
      setDemoStats({
        totalApplications: 42,
        interviews: 15,
        offers: 3,
        completionRate: 33.3,
        statusBreakdown: [
          { status: "applied", count: 20 },
          { status: "interview", count: 10 },
          { status: "offer", count: 3 },
          { status: "rejected", count: 7 },
          { status: "accepted", count: 2 }
        ],
        applicationsByCompany: [
          { company: "Acme Inc", count: 5 },
          { company: "Globex", count: 4 },
          { company: "Initech", count: 3 },
          { company: "Stark Industries", count: 3 },
          { company: "Wayne Enterprises", count: 2 },
          { company: "Cyberdyne Systems", count: 2 },
          { company: "Umbrella Corp", count: 2 },
          { company: "Other", count: 21 }
        ],
        applicationsByMonth: [
          { month: "Jan 2025", count: 10 },
          { month: "Feb 2025", count: 15 },
          { month: "Mar 2025", count: 17 }
        ],
        responseRate: 45.2,
        averageDaysToInterview: 14.3,
        averageDaysToOffer: 34.7
      });
    }
  }, [isDemoMode]);
  
  // Merge real data or demo data
  const displayStats = isDemoMode ? demoStats : stats;
  
  // Prepare data for charts
  const statusPieData = displayStats?.statusBreakdown.map(item => ({
    id: formatStatus(item.status),
    label: formatStatus(item.status),
    value: item.count,
    color: statusColors[item.status] || statusColors.unknown
  })) || [];
  
  const companyBarData = displayStats?.applicationsByCompany.map(item => ({
    company: item.company,
    count: item.count
  })) || [];
  
  const monthlyLineData = [
    {
      id: "applications",
      data: displayStats?.applicationsByMonth.map(item => ({
        x: item.month,
        y: item.count
      })) || []
    }
  ];
  
  if (isLoading) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[1, 2].map(i => (
            <Card key={i} className="h-64">
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  if (error && !isDemoMode) {
    toast({
      title: "Error loading analytics",
      description: "There was an error loading your analytics data. Please try again later.",
      variant: "destructive"
    });
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-red-500">
              Error loading analytics data. Please try again later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (!displayStats) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-6">Analytics Dashboard</h1>
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-500">
              No data available yet. Start adding job applications to see analytics.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      {isDemoMode && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-300 font-medium">
            You're in demo mode. The analytics data shown is for demonstration purposes only.
          </p>
        </div>
      )}
    
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          <InsightsSharing insightType="analytics" buttonText="Share & Export" />
        </div>
      </div>
      
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {/* Overview stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayStats.totalApplications}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayStats.interviews}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((displayStats.interviews / displayStats.totalApplications) * 100) || 0}% Interview Rate
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Offers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{displayStats.offers}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {Math.round((displayStats.offers / displayStats.totalApplications) * 100) || 0}% Offer Rate
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(displayStats.completionRate)}%</div>
                <div className="w-full mt-2">
                  <Progress value={displayStats.completionRate} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Response Rate</CardTitle>
                <CardDescription>Percentage of applications that received a response</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-5xl font-bold mb-4">{Math.round(displayStats.responseRate)}%</div>
                <Progress value={displayStats.responseRate} className="h-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg. Days to Interview</CardTitle>
                <CardDescription>Average time from application to first interview</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-5xl font-bold">{Math.round(displayStats.averageDaysToInterview)}</div>
                <p className="text-muted-foreground text-sm">days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Avg. Days to Offer</CardTitle>
                <CardDescription>Average time from application to receiving an offer</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-5xl font-bold">{Math.round(displayStats.averageDaysToOffer)}</div>
                <p className="text-muted-foreground text-sm">days</p>
              </CardContent>
            </Card>
          </div>
        
          {/* Status breakdown */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Application Status Breakdown</CardTitle>
              <CardDescription>Distribution of your applications by current status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {displayStats.statusBreakdown.length > 0 ? (
                  <ResponsivePie
                    data={statusPieData}
                    margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                    innerRadius={0.5}
                    padAngle={0.7}
                    cornerRadius={3}
                    colors={{ datum: 'data.color' }}
                    borderWidth={1}
                    borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                    enableArcLinkLabels={true}
                    arcLinkLabelsSkipAngle={10}
                    arcLinkLabelsTextColor="#888888"
                    arcLinkLabelsThickness={2}
                    arcLinkLabelsColor={{ from: 'color' }}
                    arcLabelsSkipAngle={10}
                    arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                    legends={[
                      {
                        anchor: 'bottom',
                        direction: 'row',
                        justify: false,
                        translateX: 0,
                        translateY: 56,
                        itemsSpacing: 0,
                        itemWidth: 100,
                        itemHeight: 18,
                        itemTextColor: '#999',
                        itemDirection: 'left-to-right',
                        itemOpacity: 1,
                        symbolSize: 18,
                        symbolShape: 'circle'
                      }
                    ]}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No status data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      
        <TabsContent value="charts">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Applications by Company</CardTitle>
                <CardDescription>Top 10 companies you've applied to</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {displayStats.applicationsByCompany.length > 0 ? (
                    <ResponsiveBar
                      data={companyBarData}
                      keys={['count']}
                      indexBy="company"
                      margin={{ top: 50, right: 30, bottom: 100, left: 60 }}
                      padding={0.3}
                      layout="vertical"
                      valueScale={{ type: 'linear' }}
                      indexScale={{ type: 'band', round: true }}
                      colors={["#3b82f6"]}
                      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      axisTop={null}
                      axisRight={null}
                      axisBottom={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 45,
                        legend: 'Company',
                        legendPosition: 'middle',
                        legendOffset: 80
                      }}
                      axisLeft={{
                        tickSize: 5,
                        tickPadding: 5,
                        tickRotation: 0,
                        legend: 'Applications',
                        legendPosition: 'middle',
                        legendOffset: -50
                      }}
                      labelSkipWidth={12}
                      labelSkipHeight={12}
                      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                      animate={true}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No company data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Applications Over Time</CardTitle>
                <CardDescription>Number of applications submitted per month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  {displayStats.applicationsByMonth.length > 0 ? (
                    <ResponsiveLine
                      data={monthlyLineData}
                      margin={{ top: 50, right: 50, bottom: 50, left: 60 }}
                      xScale={{ type: 'point' }}
                      yScale={{ type: 'linear', min: 'auto', max: 'auto', stacked: false, reverse: false }}
                      colors={["#3b82f6"]}
                      pointSize={10}
                      pointColor={{ theme: 'background' }}
                      pointBorderWidth={2}
                      pointBorderColor={{ from: 'serieColor' }}
                      pointLabelYOffset={-12}
                      useMesh={true}
                      legends={[
                        {
                          anchor: 'bottom-right',
                          direction: 'column',
                          justify: false,
                          translateX: 0,
                          translateY: 0,
                          itemsSpacing: 0,
                          itemDirection: 'left-to-right',
                          itemWidth: 80,
                          itemHeight: 20,
                          itemOpacity: 0.75,
                          symbolSize: 12,
                          symbolShape: 'circle',
                          symbolBorderColor: 'rgba(0, 0, 0, .5)',
                        }
                      ]}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No timeline data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      
        <TabsContent value="metrics">
          {/* Journey Progress Map */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Your Job Search Journey</CardTitle>
              <CardDescription>Visualize your job application milestones and progress</CardDescription>
            </CardHeader>
            <CardContent>
              <JourneyProgressMap 
                userId={isDemoMode ? 0 : (displayStats as any)?.userId || 0} 
                className="bg-gray-800 rounded-lg p-4" 
              />
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Job Search Efficiency</CardTitle>
                <CardDescription>Key metrics about your job search performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">Response Rate</div>
                      <div className="text-sm font-medium">{Math.round(displayStats.responseRate)}%</div>
                    </div>
                    <Progress value={displayStats.responseRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">Interview Rate</div>
                      <div className="text-sm font-medium">
                        {Math.round((displayStats.interviews / displayStats.totalApplications) * 100) || 0}%
                      </div>
                    </div>
                    <Progress 
                      value={(displayStats.interviews / displayStats.totalApplications) * 100 || 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">Offer Rate</div>
                      <div className="text-sm font-medium">
                        {Math.round((displayStats.offers / displayStats.totalApplications) * 100) || 0}%
                      </div>
                    </div>
                    <Progress 
                      value={(displayStats.offers / displayStats.totalApplications) * 100 || 0} 
                      className="h-2" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm">Interview to Offer Conversion</div>
                      <div className="text-sm font-medium">
                        {displayStats.interviews > 0 
                          ? Math.round((displayStats.offers / displayStats.interviews) * 100) 
                          : 0}%
                      </div>
                    </div>
                    <Progress 
                      value={displayStats.interviews > 0 
                        ? (displayStats.offers / displayStats.interviews) * 100 
                        : 0} 
                      className="h-2" 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Timing Metrics</CardTitle>
                <CardDescription>Time-based metrics for your job search</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="text-lg font-medium">Average Days to First Response</div>
                    </div>
                    <div className="text-4xl font-bold">
                      {Math.round(displayStats.averageDaysToInterview * 0.7)} <span className="text-base text-muted-foreground">days</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      On average, it takes this many days to get your first response after applying
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="text-lg font-medium">Average Days to Interview</div>
                    </div>
                    <div className="text-4xl font-bold">
                      {Math.round(displayStats.averageDaysToInterview)} <span className="text-base text-muted-foreground">days</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      On average, it takes this many days to get to an interview after applying
                    </p>
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-2">
                      <div className="text-lg font-medium">Average Days to Offer</div>
                    </div>
                    <div className="text-4xl font-bold">
                      {Math.round(displayStats.averageDaysToOffer)} <span className="text-base text-muted-foreground">days</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      On average, it takes this many days to receive an offer after applying
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
