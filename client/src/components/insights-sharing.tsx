import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowUpToLine, 
  BarChart2, 
  Calendar, 
  Check, 
  ChevronDown, 
  ClipboardCopy, 
  Code,
  Copy, 
  Download, 
  ExternalLink, 
  FileDown, 
  FileText, 
  Image, 
  Link as LinkIcon, 
  Linkedin, 
  Mail, 
  MessagesSquare, 
  QrCode, 
  Share, 
  Share2 
} from "lucide-react";

interface InsightsSharingProps {
  insightType?: "analytics" | "applications" | "documents" | "interviews" | "all";
  timeRange?: "1w" | "1m" | "3m" | "6m" | "1y" | "all";
  showExportOptions?: boolean;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary";
  className?: string;
  children?: React.ReactNode;
  onShare?: (data: any) => void;
  onExport?: (format: string, data: any) => void;
}

export function InsightsSharing({
  insightType = "all",
  showExportOptions = true,
  buttonText = "Share & Export",
  buttonVariant = "default",
  className,
  children,
  onShare,
  onExport
}: InsightsSharingProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"share" | "export">("share");
  const [sharingOptions, setSharingOptions] = useState({
    applications: true,
    interviews: true,
    offers: true,
    timeline: true,
    statistics: true,
    privateData: false
  });
  const [exportFormat, setExportFormat] = useState("pdf");
  const [timeRange, setTimeRange] = useState<"1w" | "1m" | "3m" | "6m" | "1y" | "all">("all");
  const [shareMethod, setShareMethod] = useState<"link" | "email" | "embed" | "qr">("link");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState("");
  const [exportReady, setExportReady] = useState(false);
  const [exportUrl, setExportUrl] = useState("");
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";
  
  const handleShare = () => {
    // In a real app, this would call the API to generate a shareable link
    setGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setGenerating(false);
      setGeneratedUrl("https://jams.example.com/share/insights/abc123xyz");
      
      if (onShare) {
        onShare({
          url: "https://jams.example.com/share/insights/abc123xyz",
          options: sharingOptions,
          method: shareMethod
        });
      }
      
      if (shareMethod === "email" && emailRecipient) {
        toast({
          title: "Insights shared via email",
          description: `Your job search insights have been shared with ${emailRecipient}`
        });
      }
    }, 1500);
  };
  
  const handleExport = () => {
    // In a real app, this would call the API to generate an export file
    setGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setGenerating(false);
      setExportReady(true);
      setExportUrl(`data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwo...`);
      
      if (onExport) {
        onExport(exportFormat, {
          options: sharingOptions,
          timeRange
        });
      }
      
      toast({
        title: `Export ready (${exportFormat.toUpperCase()})`,
        description: "Your job search insights have been exported"
      });
    }, 2000);
  };
  
  const handleCopyLink = () => {
    // In a real app, this would copy the link to clipboard
    navigator.clipboard.writeText(generatedUrl).then(() => {
      toast({
        title: "Link copied",
        description: "Shareable link copied to clipboard"
      });
    });
  };
  
  const handleDownload = () => {
    // In a real app, this would trigger the download
    toast({
      title: `Download started (${exportFormat.toUpperCase()})`,
      description: "Your job search insights are being downloaded"
    });
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button 
            variant={buttonVariant} 
            className={className}
            size="sm"
          >
            <Share2 className="h-4 w-4 mr-1.5" />
            {buttonText}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share & Export Insights</DialogTitle>
          <DialogDescription>
            Share your job search progress or export your data
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue={tab} onValueChange={(v) => setTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="share">
              <Share className="h-4 w-4 mr-1.5" />
              Share
            </TabsTrigger>
            {showExportOptions && (
              <TabsTrigger value="export">
                <Download className="h-4 w-4 mr-1.5" />
                Export
              </TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="share" className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">What to include:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="applications" 
                      checked={sharingOptions.applications}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, applications: !!checked})
                      }
                    />
                    <Label htmlFor="applications">Applications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="interviews" 
                      checked={sharingOptions.interviews}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, interviews: !!checked})
                      }
                    />
                    <Label htmlFor="interviews">Interviews</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="offers" 
                      checked={sharingOptions.offers}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, offers: !!checked})
                      }
                    />
                    <Label htmlFor="offers">Offers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="timeline" 
                      checked={sharingOptions.timeline}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, timeline: !!checked})
                      }
                    />
                    <Label htmlFor="timeline">Timeline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="statistics" 
                      checked={sharingOptions.statistics}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, statistics: !!checked})
                      }
                    />
                    <Label htmlFor="statistics">Statistics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="privateData" 
                      checked={sharingOptions.privateData}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, privateData: !!checked})
                      }
                    />
                    <Label htmlFor="privateData">Private Data</Label>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Share via:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={shareMethod === "link" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShareMethod("link")}
                    className="justify-start"
                  >
                    <LinkIcon className="h-4 w-4 mr-1.5" />
                    Create Link
                  </Button>
                  <Button 
                    variant={shareMethod === "email" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShareMethod("email")}
                    className="justify-start"
                  >
                    <Mail className="h-4 w-4 mr-1.5" />
                    Email
                  </Button>
                  <Button 
                    variant={shareMethod === "embed" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShareMethod("embed")}
                    className="justify-start"
                  >
                    <Code className="h-4 w-4 mr-1.5" />
                    Embed
                  </Button>
                  <Button 
                    variant={shareMethod === "qr" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setShareMethod("qr")}
                    className="justify-start"
                  >
                    <QrCode className="h-4 w-4 mr-1.5" />
                    QR Code
                  </Button>
                </div>
              </div>
              
              {shareMethod === "email" && (
                <div>
                  <Label htmlFor="email-recipient">Recipient email:</Label>
                  <Input 
                    id="email-recipient" 
                    placeholder="colleague@example.com" 
                    type="email"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                  />
                </div>
              )}
              
              {generatedUrl && !generating && (
                <div className="pt-2">
                  <h3 className="text-sm font-medium mb-2">
                    {shareMethod === "link" && "Shareable Link"}
                    {shareMethod === "embed" && "Embed Code"}
                    {shareMethod === "qr" && "QR Code"}
                  </h3>
                  
                  {shareMethod === "link" && (
                    <div className="flex">
                      <Input value={generatedUrl} readOnly className="flex-1 rounded-r-none" />
                      <Button 
                        variant="outline" 
                        className="rounded-l-none" 
                        onClick={handleCopyLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  {shareMethod === "embed" && (
                    <div>
                      <Textarea 
                        value={`<iframe src="${generatedUrl}" width="100%" height="600" frameborder="0"></iframe>`} 
                        readOnly 
                        className="h-20"
                      />
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-2"
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="${generatedUrl}" width="100%" height="600" frameborder="0"></iframe>`);
                          toast({
                            title: "Embed code copied",
                            description: "Embed code copied to clipboard"
                          });
                        }}
                      >
                        <ClipboardCopy className="h-4 w-4 mr-1.5" />
                        Copy Code
                      </Button>
                    </div>
                  )}
                  
                  {shareMethod === "qr" && (
                    <div className="flex flex-col items-center">
                      <div className="bg-white p-4 rounded-lg">
                        <div className="w-48 h-48 border border-border rounded">
                          <div className="flex items-center justify-center h-full">
                            <QrCode className="h-32 w-32 text-primary" />
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "QR code downloaded",
                              description: "QR code saved as PNG image"
                            });
                          }}
                        >
                          <Download className="h-4 w-4 mr-1.5" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            toast({
                              title: "QR code copied",
                              description: "QR code image copied to clipboard"
                            });
                          }}
                        >
                          <ClipboardCopy className="h-4 w-4 mr-1.5" />
                          Copy Image
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className="pt-4">
                <Button 
                  disabled={generating || (shareMethod === "email" && !emailRecipient)}
                  onClick={handleShare}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <LoadingAnimation variant="default" size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : generatedUrl ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      {shareMethod === "email" ? "Send Email" : "Update"}
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-1.5" />
                      {shareMethod === "email" ? "Share via Email" : "Generate"}
                    </>
                  )}
                </Button>
                
                {!isDemoMode && generatedUrl && shareMethod === "link" && (
                  <div className="flex justify-between mt-4 text-xs text-muted-foreground">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Link shared to LinkedIn",
                          description: "Your insights have been shared on LinkedIn"
                        });
                      }}
                    >
                      <Linkedin className="h-4 w-4 mr-1" />
                      LinkedIn
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Analytics settings",
                          description: "Configure link analytics and settings"
                        });
                      }}
                    >
                      <BarChart2 className="h-4 w-4 mr-1" />
                      Link Analytics
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="export" className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Export format:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={exportFormat === "pdf" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setExportFormat("pdf")}
                    className="justify-start"
                  >
                    <FileText className="h-4 w-4 mr-1.5" />
                    PDF Report
                  </Button>
                  <Button 
                    variant={exportFormat === "csv" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setExportFormat("csv")}
                    className="justify-start"
                  >
                    <FileDown className="h-4 w-4 mr-1.5" />
                    CSV (Raw Data)
                  </Button>
                  <Button 
                    variant={exportFormat === "image" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setExportFormat("image")}
                    className="justify-start"
                  >
                    <Image className="h-4 w-4 mr-1.5" />
                    Image (PNG)
                  </Button>
                  <Button 
                    variant={exportFormat === "json" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setExportFormat("json")}
                    className="justify-start"
                  >
                    <Code className="h-4 w-4 mr-1.5" />
                    JSON
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Time range:</h3>
                <div className="grid grid-cols-3 gap-2">
                  <Button 
                    variant={timeRange === "1w" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("1w")}
                  >
                    1 Week
                  </Button>
                  <Button 
                    variant={timeRange === "1m" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("1m")}
                  >
                    1 Month
                  </Button>
                  <Button 
                    variant={timeRange === "3m" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("3m")}
                  >
                    3 Months
                  </Button>
                  <Button 
                    variant={timeRange === "6m" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("6m")}
                  >
                    6 Months
                  </Button>
                  <Button 
                    variant={timeRange === "1y" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("1y")}
                  >
                    1 Year
                  </Button>
                  <Button 
                    variant={timeRange === "all" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setTimeRange("all")}
                  >
                    All Data
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Data to include:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-applications" 
                      checked={sharingOptions.applications}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, applications: !!checked})
                      }
                    />
                    <Label htmlFor="exp-applications">Applications</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-interviews" 
                      checked={sharingOptions.interviews}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, interviews: !!checked})
                      }
                    />
                    <Label htmlFor="exp-interviews">Interviews</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-offers" 
                      checked={sharingOptions.offers}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, offers: !!checked})
                      }
                    />
                    <Label htmlFor="exp-offers">Offers</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-timeline" 
                      checked={sharingOptions.timeline}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, timeline: !!checked})
                      }
                    />
                    <Label htmlFor="exp-timeline">Timeline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-statistics" 
                      checked={sharingOptions.statistics}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, statistics: !!checked})
                      }
                    />
                    <Label htmlFor="exp-statistics">Statistics</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="exp-privateData" 
                      checked={sharingOptions.privateData}
                      onCheckedChange={(checked) => 
                        setSharingOptions({...sharingOptions, privateData: !!checked})
                      }
                    />
                    <Label htmlFor="exp-privateData">Private Data</Label>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  disabled={generating}
                  onClick={exportReady ? handleDownload : handleExport}
                  className="w-full"
                >
                  {generating ? (
                    <>
                      <LoadingAnimation variant="default" size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : exportReady ? (
                    <>
                      <ArrowUpToLine className="h-4 w-4 mr-1.5" />
                      Download {exportFormat.toUpperCase()}
                    </>
                  ) : (
                    <>
                      <FileDown className="h-4 w-4 mr-1.5" />
                      Export {exportFormat.toUpperCase()}
                    </>
                  )}
                </Button>
                
                {exportReady && (
                  <div className="text-xs text-muted-foreground mt-2 text-center">
                    Export will be available for 24 hours
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast({
              title: "Export Scheduler",
              description: "Set up automated regular exports of your job search data"
            })}
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Schedule Regular Exports
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Drop-in component for quickly adding share functionality to any component
export function QuickShareButton({ 
  text = "Share",
  className
}: { 
  text?: string,
  className?: string 
}) {
  const { toast } = useToast();
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share className="h-4 w-4 mr-1.5" />
          {text}
          <ChevronDown className="h-4 w-4 ml-1.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => toast({
          title: "Copied to clipboard",
          description: "Link has been copied to your clipboard"
        })}>
          <ClipboardCopy className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast({
          title: "Email share",
          description: "Share via email dialog opened"
        })}>
          <Mail className="h-4 w-4 mr-2" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast({
          title: "LinkedIn share",
          description: "Share to LinkedIn dialog opened"
        })}>
          <Linkedin className="h-4 w-4 mr-2" />
          LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast({
          title: "Download PDF",
          description: "Starting PDF download"
        })}>
          <FileDown className="h-4 w-4 mr-2" />
          Download PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}