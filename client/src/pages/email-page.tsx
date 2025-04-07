import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertCircle, 
  Archive, 
  ArrowUpRight, 
  CheckCircle, 
  ChevronDown,
  ExternalLink,
  FileQuestion, 
  Inbox, 
  Info,
  Mail, 
  MailPlus, 
  MailX, 
  MessageSquare, 
  Pin,
  Plus,
  RefreshCcw, 
  Search, 
  Settings, 
  Star, 
  Tag,
  Trash2, 
  UserCheck, 
  Users
} from "lucide-react";
import { format, isToday, isYesterday, subDays } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Email types
type EmailCategory = 
  | "Job Application Confirmation"
  | "Interview Invite"
  | "Recruiter Outreach"
  | "Availability Request"
  | "Offer"
  | "Rejection"
  | "Follow-up Required"
  | "Other";

interface Email {
  id: string;
  from: {
    name: string;
    email: string;
  };
  to: string;
  subject: string;
  body: string;
  date: Date;
  read: boolean;
  starred: boolean;
  pinned?: boolean;
  todo?: boolean;
  category: EmailCategory;
  labels?: string[];
  jobUrl?: string;
  companyName?: string;
}

// Email folder type
type EmailFolder = "inbox" | "starred" | "important" | "sent" | "drafts" | "trash";

export default function EmailPage() {
  const { toast } = useToast();
  const [activeFolder, setActiveFolder] = useState<EmailFolder>("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [composeMode, setComposeMode] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<EmailCategory | "All">("All");
  
  // New email composition state
  const [newEmail, setNewEmail] = useState({
    to: "",
    subject: "",
    body: ""
  });
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";
  
  // Mock emails for demo mode
  const [emails, setEmails] = useState<Email[]>([]);
  
  useEffect(() => {
    if (isDemoMode) {
      // Generate mock emails
      const now = new Date();
      const mockEmails: Email[] = [
        {
          id: "1",
          from: { name: "Acme Inc. Recruiting", email: "recruiting@acme.example.com" },
          to: "you@example.com",
          subject: "Your application for Software Engineer has been received",
          body: `Dear Applicant,

Thank you for applying to the Software Engineer position at Acme Inc. We have received your application and are currently reviewing it.

We will contact you within the next 7-10 business days if your qualifications match our requirements for the role.

Best regards,
Acme Inc. Recruiting Team`,
          date: subDays(now, 1),
          read: true,
          starred: true,
          pinned: true,
          category: "Job Application Confirmation",
          companyName: "Acme Inc",
          jobUrl: "https://example.com/jobs/software-engineer-acme"
        },
        {
          id: "2",
          from: { name: "Sarah Thompson", email: "sarah.thompson@globex.example.com" },
          to: "you@example.com",
          subject: "Interview Invitation - Senior Developer Position",
          body: `Hello,

Thank you for your application for the Senior Developer position at Globex Corporation.

We were impressed with your qualifications and would like to invite you for a technical interview. Could you please provide your availability for the upcoming week?

The interview will be approximately 60 minutes and will focus on your technical skills and experience.

Looking forward to your response.

Best regards,
Sarah Thompson
Technical Recruiting Manager
Globex Corporation`,
          date: now,
          read: false,
          starred: true,
          todo: true,
          category: "Interview Invite",
          companyName: "Globex Corporation",
          jobUrl: "https://example.com/jobs/senior-developer-globex"
        },
        {
          id: "3",
          from: { name: "John Davis", email: "john.davis@techjobs.example.com" },
          to: "you@example.com",
          subject: "Exciting opportunity at Initech",
          body: `Hello,

I came across your profile and I'm reaching out because I think you could be a great fit for a Senior Developer position at Initech.

They're looking for someone with your skillset and experience. The role offers competitive compensation and excellent benefits.

Would you be interested in learning more about this opportunity? I'd be happy to provide additional details.

Best regards,
John Davis
Tech Jobs Recruiter`,
          date: subDays(now, 3),
          read: true,
          starred: false,
          category: "Recruiter Outreach",
          companyName: "Initech"
        },
        {
          id: "4",
          from: { name: "Umbrella Corp HR", email: "hr@umbrella.example.com" },
          to: "you@example.com",
          subject: "Thank you for your application - Application Status Update",
          body: `Dear Applicant,

Thank you for your interest in the Full Stack Developer position at Umbrella Corporation.

After careful consideration of your application, we regret to inform you that we have decided to pursue other candidates whose qualifications more closely align with our current needs.

We appreciate your interest in joining Umbrella Corporation and wish you success in your job search.

Sincerely,
Umbrella Corp HR Team`,
          date: subDays(now, 4),
          read: true,
          starred: false,
          category: "Rejection",
          companyName: "Umbrella Corporation",
          jobUrl: "https://example.com/jobs/fullstack-umbrella"
        },
        {
          id: "5",
          from: { name: "Wayne Enterprises", email: "careers@wayne.example.com" },
          to: "you@example.com",
          subject: "Offer Letter - Senior Software Engineer",
          body: `Dear Candidate,

We are pleased to offer you the position of Senior Software Engineer at Wayne Enterprises. After thorough consideration of your qualifications and our recent interviews, we believe you would be a valuable addition to our team.

Position: Senior Software Engineer
Department: Technology Division
Start Date: May 15, 2025
Salary: $145,000 per annum
Benefits: Health, dental, vision insurance, 401(k) matching, etc.

Please review the attached formal offer letter for complete details. If you choose to accept this offer, please sign and return the letter by April 10, 2025.

We look forward to welcoming you to Wayne Enterprises.

Best regards,
Human Resources
Wayne Enterprises`,
          date: subDays(now, 2),
          read: false,
          starred: true,
          pinned: true,
          todo: true,
          category: "Offer",
          companyName: "Wayne Enterprises",
          jobUrl: "https://example.com/jobs/senior-software-engineer-wayne"
        },
        {
          id: "6",
          from: { name: "Mark Wilson", email: "mark.wilson@cyberdyne.example.com" },
          to: "you@example.com",
          subject: "Interview Scheduling - Availability Request",
          body: `Hello,

Thank you for your application for the Machine Learning Engineer position at Cyberdyne Systems.

We would like to schedule a video interview with our technical team. Could you please provide your availability for next week (April 8-12, 2025) including your preferred time slots?

The interview will be approximately 90 minutes long.

Looking forward to your response.

Best regards,
Mark Wilson
Technical Recruiting
Cyberdyne Systems`,
          date: subDays(now, 1),
          read: false,
          starred: false,
          todo: true,
          category: "Availability Request",
          companyName: "Cyberdyne Systems",
          jobUrl: "https://example.com/jobs/ml-engineer-cyberdyne"
        },
        {
          id: "7",
          from: { name: "Lisa Rodriguez", email: "lisa.rodriguez@stark.example.com" },
          to: "you@example.com",
          subject: "Follow-up: Technical Interview",
          body: `Hello,

Thank you for taking the time to interview for the Software Engineer position at Stark Industries yesterday. Our team was impressed with your technical knowledge and problem-solving skills.

We are still in the process of interviewing other candidates and expect to make a decision by the end of next week. We will contact you as soon as we have an update.

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
Lisa Rodriguez
Technical Recruiting Manager
Stark Industries`,
          date: now,
          read: false,
          starred: false,
          category: "Follow-up Required",
          companyName: "Stark Industries",
          jobUrl: "https://example.com/jobs/software-engineer-stark"
        },
        {
          id: "8",
          from: { name: "David Wong", email: "david.wong@oceanic.example.com" },
          to: "you@example.com",
          subject: "Application Received - Frontend Developer",
          body: `Dear Applicant,

Thank you for applying to the Frontend Developer position at Oceanic Airlines. This email confirms that we have received your application.

Our recruitment team will review your qualifications and experience. If your profile matches our requirements, we will contact you to schedule an interview.

Please note that due to the high volume of applications, it may take up to two weeks to process your application.

Thank you for your interest in Oceanic Airlines.

Best regards,
David Wong
Talent Acquisition
Oceanic Airlines`,
          date: subDays(now, 5),
          read: true,
          starred: false,
          category: "Job Application Confirmation",
          companyName: "Oceanic Airlines",
          jobUrl: "https://example.com/jobs/frontend-oceanic"
        },
        {
          id: "9",
          from: { name: "Emma Chen", email: "emma.chen@aperture.example.com" },
          to: "you@example.com",
          subject: "Thank you for your interview - Next steps",
          body: `Hello,

Thank you for participating in the interview for the UX Designer position at Aperture Science. We appreciate the time you took to discuss your qualifications and experience with our team.

We are pleased to inform you that you have been selected for the next round of interviews, which will focus on your portfolio and design process. Our UX Director would like to meet with you to discuss some specific projects.

Please let me know your availability for next week so we can schedule this follow-up interview.

Best regards,
Emma Chen
Design Recruitment
Aperture Science`,
          date: subDays(now, 1),
          read: false,
          starred: true,
          pinned: true,
          todo: true,
          category: "Interview Invite",
          companyName: "Aperture Science",
          jobUrl: "https://example.com/jobs/ux-designer-aperture"
        },
        {
          id: "10",
          from: { name: "Michael Johnson", email: "michael.johnson@recruiters.example.com" },
          to: "you@example.com",
          subject: "Potential opportunity at TechStart Inc",
          body: `Hi there,

I'm a recruiter specializing in tech positions, and I came across your profile. I have a client, TechStart Inc, who is looking for an experienced Full Stack Developer.

The position offers:
- Competitive salary: $140,000 - $170,000
- Remote work with quarterly on-site meetings
- Comprehensive benefits package
- Stock options

If you're interested in learning more about this opportunity, please let me know and I can provide additional details.

Best regards,
Michael Johnson
Senior Tech Recruiter
Top Talent Recruiters`,
          date: subDays(now, 2),
          read: true,
          starred: false,
          category: "Recruiter Outreach",
          companyName: "TechStart Inc"
        }
      ];
      
      setEmails(mockEmails);
    }
  }, [isDemoMode]);
  
  // Filter emails based on active folder, search query, and category
  const filteredEmails = emails.filter(email => {
    // Filter by folder
    const matchesFolder = (
      (activeFolder === "inbox") ||
      (activeFolder === "starred" && email.starred) ||
      (activeFolder === "important" && ["Interview Invite", "Offer"].includes(email.category))
    );
    
    // Filter by search query
    const matchesSearch = searchQuery === "" || 
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) || 
      email.from.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      email.body.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    const matchesCategory = categoryFilter === "All" || email.category === categoryFilter;
    
    return matchesFolder && matchesSearch && matchesCategory;
  });
  
  // Get unread count
  const unreadCount = emails.filter(email => !email.read).length;
  
  // Get todo count
  const todoCount = emails.filter(email => email.todo).length;
  
  // Mark email as read
  const markAsRead = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId 
        ? { ...email, read: true } 
        : email
    ));
  };
  
  // Toggle starred status
  const toggleStarred = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId 
        ? { ...email, starred: !email.starred } 
        : email
    ));
  };
  
  // Toggle pinned status
  const togglePinned = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId 
        ? { ...email, pinned: !email.pinned } 
        : email
    ));
  };
  
  // Toggle todo status
  const toggleTodo = (emailId: string) => {
    setEmails(emails.map(email => 
      email.id === emailId 
        ? { ...email, todo: !email.todo } 
        : email
    ));
  };
  
  // Format date for display
  const formatEmailDate = (date: Date) => {
    if (isToday(date)) {
      return format(date, "h:mm a");
    } else if (isYesterday(date)) {
      return "Yesterday";
    } else {
      return format(date, "MMM d");
    }
  };
  
  // Get category badge
  const getCategoryBadge = (category: EmailCategory) => {
    switch (category) {
      case "Job Application Confirmation":
        return <Badge className="bg-blue-500">Application</Badge>;
      case "Interview Invite":
        return <Badge className="bg-green-500">Interview</Badge>;
      case "Recruiter Outreach":
        return <Badge className="bg-purple-500">Recruiter</Badge>;
      case "Availability Request":
        return <Badge className="bg-amber-500">Availability</Badge>;
      case "Offer":
        return <Badge className="bg-emerald-500">Offer</Badge>;
      case "Rejection":
        return <Badge className="bg-red-500">Rejection</Badge>;
      case "Follow-up Required":
        return <Badge className="bg-indigo-500">Follow-up</Badge>;
      default:
        return <Badge className="bg-gray-500">Other</Badge>;
    }
  };
  
  // Email categories for filter
  const emailCategories: EmailCategory[] = [
    "Job Application Confirmation",
    "Interview Invite",
    "Recruiter Outreach",
    "Availability Request",
    "Offer",
    "Rejection",
    "Follow-up Required",
    "Other"
  ];
  
  // Handle select email
  const handleSelectEmail = (email: Email) => {
    setSelectedEmail(email);
    markAsRead(email.id);
    setComposeMode(false);
  };
  
  // Handle send email
  const handleSendEmail = () => {
    // In a real app, this would send the email via API
    toast({
      title: "Email sent",
      description: "Your email has been sent successfully."
    });
    
    // Clear the compose form
    setNewEmail({
      to: "",
      subject: "",
      body: ""
    });
    
    // Exit compose mode
    setComposeMode(false);
  };
  
  // Generate smart reply
  const generateSmartReply = () => {
    if (!selectedEmail) return;
    
    let response = "";
    
    switch (selectedEmail.category) {
      case "Interview Invite":
        response = `Dear ${selectedEmail.from.name.split(' ')[0]},

Thank you for considering my application and inviting me for an interview. I am very interested in this opportunity.

I am available on the following days next week:
- Monday: 9am-12pm, 2pm-5pm
- Tuesday: 9am-12pm, 2pm-5pm
- Thursday: 9am-12pm, 2pm-5pm

Please let me know which time works best for your team.

Looking forward to discussing the position in more detail.

Best regards,
[Your Name]`;
        break;
      
      case "Availability Request":
        response = `Dear ${selectedEmail.from.name.split(' ')[0]},

Thank you for your email. I'm excited about the opportunity to interview with the team.

I am available during the following times:
- Monday: 10am-12pm, 2pm-4pm
- Tuesday: 9am-12pm
- Wednesday: 1pm-5pm
- Thursday: 9am-12pm, 2pm-5pm
- Friday: 9am-1pm

Please let me know which time works best.

Best regards,
[Your Name]`;
        break;
        
      case "Offer":
        response = `Dear ${selectedEmail.from.name.split(' ')[0]},

Thank you very much for offering me the position. I am excited about the opportunity to join your team.

I would like to formally accept the offer. I am looking forward to starting on the proposed date and contributing to your team.

Please let me know if there are any additional forms or information needed from my side before the start date.

Best regards,
[Your Name]`;
        break;
        
      case "Rejection":
        response = `Dear ${selectedEmail.from.name.split(' ')[0]},

Thank you for taking the time to consider my application and for providing feedback.

While I'm disappointed to hear that I wasn't selected for this position, I appreciate the opportunity to have been considered.

I would appreciate being kept in mind for future opportunities that might be a better match for my skills and experience.

Best regards,
[Your Name]`;
        break;
        
      default:
        response = `Dear ${selectedEmail.from.name.split(' ')[0]},

Thank you for your email. I appreciate you reaching out.

[Your response here]

Best regards,
[Your Name]`;
    }
    
    setNewEmail({
      to: selectedEmail.from.email,
      subject: selectedEmail.subject.startsWith("Re:") 
        ? selectedEmail.subject 
        : `Re: ${selectedEmail.subject}`,
      body: response
    });
    
    setComposeMode(true);
  };

  // Sort emails with pinned emails at the top
  const sortedEmails = [...filteredEmails].sort((a, b) => {
    // First sort by pinned status
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Then sort by date (newest first)
    return b.date.getTime() - a.date.getTime();
  });

  return (
    <div className="container max-w-full py-6 px-4">
      {isDemoMode && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-300 font-medium">
            You're in demo mode. Email integration is simulated with sample emails only.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-180px)]">
        {/* Sidebar */}
        <div className="col-span-12 md:col-span-3 lg:col-span-2 border rounded-lg overflow-hidden">
          <div className="p-4">
            <Button className="w-full mb-4" onClick={() => setComposeMode(true)}>
              <MailPlus className="h-4 w-4 mr-2" />
              Compose
            </Button>
            
            <div className="space-y-1">
              <button
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "inbox" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => setActiveFolder("inbox")}
              >
                <div className="flex items-center">
                  <Inbox className="h-4 w-4 mr-2" />
                  Inbox
                </div>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              
              <button
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "starred" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => setActiveFolder("starred")}
              >
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Starred
                </div>
                {emails.filter(e => e.starred).length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {emails.filter(e => e.starred).length}
                  </Badge>
                )}
              </button>
              
              <button
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "important" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => setActiveFolder("important")}
              >
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Important
                </div>
              </button>
              
              <button
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-secondary`}
              >
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Todo Replies
                </div>
                {todoCount > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {todoCount}
                  </Badge>
                )}
              </button>
              
              <button
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "sent" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => {
                  setActiveFolder("sent");
                  toast({
                    title: "No sent emails",
                    description: "Sent emails are not available in demo mode"
                  });
                }}
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Sent
              </button>
              
              <button
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "drafts" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => {
                  setActiveFolder("drafts");
                  toast({
                    title: "No drafts",
                    description: "Drafts are not available in demo mode"
                  });
                }}
              >
                <FileQuestion className="h-4 w-4 mr-2" />
                Drafts
              </button>
              
              <button
                className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md ${
                  activeFolder === "trash" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => {
                  setActiveFolder("trash");
                  toast({
                    title: "Trash is empty",
                    description: "Trash is not available in demo mode"
                  });
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Trash
              </button>
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Email Types</h3>
            <div className="space-y-1">
              <button 
                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                  categoryFilter === "All" 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-secondary"
                }`}
                onClick={() => setCategoryFilter("All")}
              >
                <div className="flex items-center">
                  <Tag className="h-4 w-4 mr-2" />
                  All Types
                </div>
              </button>
              
              {emailCategories.map(category => (
                <button 
                  key={category}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-md ${
                    categoryFilter === category 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                  onClick={() => setCategoryFilter(category)}
                >
                  <div className="flex items-center">
                    {getCategoryBadge(category)}
                    <span className="ml-2">{category === "Job Application Confirmation" ? "Applications" : 
                                           category === "Interview Invite" ? "Interviews" :
                                           category === "Recruiter Outreach" ? "Recruiters" :
                                           category === "Follow-up Required" ? "Follow-ups" :
                                           category}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="p-4">
            <h3 className="text-sm font-medium mb-3">Connected Accounts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <UserCheck className="h-4 w-4" />
                  <span>Personal Gmail</span>
                </div>
                <Badge variant="outline" className="text-xs">Connected</Badge>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full justify-start text-muted-foreground" 
                onClick={() => toast({
                  title: "Not available in demo mode",
                  description: "This would allow connecting additional accounts"
                })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Account
              </Button>
            </div>
          </div>
        </div>
        
        {/* Email List */}
        <div className="col-span-12 md:col-span-9 lg:col-span-3 border rounded-lg overflow-hidden">
          <div className="p-4 border-b">
            <div className="flex items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input 
                  type="text" 
                  placeholder="Search emails..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" className="ml-2" onClick={() => setSearchQuery("")}>
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[calc(100vh-280px)]">
            {sortedEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <Mail className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No emails found</h3>
                <p className="text-sm text-muted-foreground">
                  {activeFolder === "inbox" 
                    ? "Your inbox is empty or no emails match your search" 
                    : `No emails in ${activeFolder}`}
                </p>
              </div>
            ) : (
              <div>
                {sortedEmails.map((email) => (
                  <div 
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                    className={`p-4 border-b cursor-pointer hover:bg-muted ${
                      selectedEmail?.id === email.id ? "bg-muted" : ""
                    } ${!email.read ? "bg-primary/5" : ""} ${email.pinned ? "border-l-4 border-l-amber-500" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="font-medium truncate flex-1 flex items-center">
                        <div className="flex gap-1 mr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStarred(email.id);
                            }}
                            className="text-muted-foreground hover:text-amber-400"
                          >
                            <Star className={`h-4 w-4 ${email.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              togglePinned(email.id);
                            }}
                            className="text-muted-foreground hover:text-amber-500"
                          >
                            <Pin className={`h-4 w-4 ${email.pinned ? "text-amber-500" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTodo(email.id);
                            }}
                            className="text-muted-foreground hover:text-green-500"
                          >
                            <CheckCircle className={`h-4 w-4 ${email.todo ? "text-green-500" : ""}`} />
                          </button>
                        </div>
                        <span className={!email.read ? "font-semibold" : ""}>
                          {email.from.name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground min-w-20 text-right">
                        {formatEmailDate(email.date)}
                      </div>
                    </div>
                    <div className="text-sm font-medium mb-1 truncate">
                      {email.subject}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground truncate max-w-48">
                        {email.body.substring(0, 60)}...
                      </div>
                      <div className="flex items-center gap-1">
                        {email.todo && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Todo</Badge>}
                        {getCategoryBadge(email.category)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
        
        {/* Email Content or Compose */}
        <div className="col-span-12 md:col-span-9 lg:col-span-7 border rounded-lg overflow-hidden">
          {composeMode ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="text-lg font-medium">New Message</h3>
                <Button variant="ghost" size="sm" onClick={() => setComposeMode(false)}>
                  <MailX className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">To:</label>
                    <Input 
                      value={newEmail.to} 
                      onChange={(e) => setNewEmail({...newEmail, to: e.target.value})}
                      placeholder="recipient@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Subject:</label>
                    <Input 
                      value={newEmail.subject} 
                      onChange={(e) => setNewEmail({...newEmail, subject: e.target.value})}
                      placeholder="Enter subject"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-sm font-medium">Message:</label>
                    <Textarea 
                      value={newEmail.body} 
                      onChange={(e) => setNewEmail({...newEmail, body: e.target.value})}
                      placeholder="Compose your message..."
                      className="h-64 resize-none"
                    />
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Select defaultValue="default">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Response template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">No template</SelectItem>
                      <SelectItem value="interview">Interview Response</SelectItem>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="application">Application</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setComposeMode(false)}>
                      Discard
                    </Button>
                    <Button onClick={handleSendEmail}>
                      Send Email
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : selectedEmail ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold">{selectedEmail.subject}</h2>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleTodo(selectedEmail.id)}
                      className={selectedEmail.todo ? "text-green-500" : ""}
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="ml-1">{selectedEmail.todo ? "Remove Todo" : "Mark as Todo"}</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => togglePinned(selectedEmail.id)}
                      className={selectedEmail.pinned ? "text-amber-500" : ""}
                    >
                      <Pin className="h-4 w-4" />
                      <span className="ml-1">{selectedEmail.pinned ? "Unpin" : "Pin"}</span>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)}>
                      <MailX className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium mr-3">
                        {selectedEmail.from.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{selectedEmail.from.name}</div>
                        <div className="text-xs text-muted-foreground">{selectedEmail.from.email}</div>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(selectedEmail.date, "MMM d, yyyy h:mm a")}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {getCategoryBadge(selectedEmail.category)}
                  {selectedEmail.companyName && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selectedEmail.companyName}
                    </Badge>
                  )}
                  {selectedEmail.todo && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Todo Reply
                    </Badge>
                  )}
                </div>
                
                {selectedEmail.jobUrl && (
                  <div className="mt-2 flex">
                    <a 
                      href={selectedEmail.jobUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline flex items-center"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Job Posting
                    </a>
                  </div>
                )}
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="whitespace-pre-line">{selectedEmail.body}</div>
              </ScrollArea>
              
              <div className="p-4 border-t flex justify-between">
                <div className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Not available in demo mode",
                    description: "This would archive the email"
                  })}>
                    <Archive className="h-4 w-4 mr-2" />
                    Archive
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Not available in demo mode",
                    description: "This would mark the email as spam"
                  })}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Spam
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toast({
                    title: "Not available in demo mode",
                    description: "This would delete the email"
                  })}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
                
                <div className="space-x-2">
                  <Button onClick={generateSmartReply}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Smart Reply
                  </Button>
                  <Button onClick={() => {
                    setNewEmail({
                      to: selectedEmail.from.email,
                      subject: selectedEmail.subject.startsWith("Re:") 
                        ? selectedEmail.subject 
                        : `Re: ${selectedEmail.subject}`,
                      body: ""
                    });
                    setComposeMode(true);
                  }}>
                    Reply
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <Mail className="h-16 w-16 text-muted-foreground mb-4" />
              <h2 className="text-xl font-medium mb-2">Select an email to view</h2>
              <p className="text-muted-foreground max-w-md">
                Select an email from the list or click the compose button to write a new email.
              </p>
              {todoCount > 0 && (
                <div className="mt-6 bg-green-50 p-4 rounded-md border border-green-200">
                  <p className="text-green-800 font-medium flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                    You have {todoCount} emails that need replies
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
