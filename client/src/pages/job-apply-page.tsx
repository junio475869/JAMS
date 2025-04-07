import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckIcon, CopyIcon, SaveIcon, LaptopIcon } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import Header from "@/components/layout/header";

// Job platforms
const JOB_PLATFORMS = [
  { id: "indeed", name: "Indeed", url: "https://www.indeed.com" },
  { id: "linkedin", name: "LinkedIn", url: "https://www.linkedin.com/jobs" },
  { id: "glassdoor", name: "Glassdoor", url: "https://www.glassdoor.com" },
  { id: "ziprecruiter", name: "ZipRecruiter", url: "https://www.ziprecruiter.com" },
  { id: "dice", name: "Dice", url: "https://www.dice.com" },
  { id: "monster", name: "Monster", url: "https://www.monster.com" },
];

export default function JobApplyPage() {
  const [activeTab, setActiveTab] = useState("indeed");
  const [selectedPlatform, setSelectedPlatform] = useState(JOB_PLATFORMS[0]);
  const [form, setForm] = useState({
    company: "",
    position: "",
    location: "",
    description: "",
    requirements: "",
    notes: "",
    status: "draft",
  });
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handlePlatformChange = (platform: string) => {
    setActiveTab(platform);
    const newPlatform = JOB_PLATFORMS.find(p => p.id === platform);
    if (newPlatform) setSelectedPlatform(newPlatform);
  };

  const handleCopy = () => {
    // In a real app, this would copy form data to clipboard in a formatted way
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    // In a real app, this would save to database
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left side - Application form */}
          <div className="w-full md:w-1/2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold flex items-center">
                  <LaptopIcon className="mr-2 h-6 w-6" />
                  Job Application Form
                </CardTitle>
                <CardDescription>
                  Enter details about the job you're applying for
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company</Label>
                    <Input
                      id="company"
                      name="company"
                      value={form.company}
                      onChange={handleInputChange}
                      placeholder="Company name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      name="position"
                      value={form.position}
                      onChange={handleInputChange}
                      placeholder="Job title"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="City, State or Remote"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Job Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Copy and paste the job description here"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea
                    id="requirements"
                    name="requirements"
                    value={form.requirements}
                    onChange={handleInputChange}
                    placeholder="Copy and paste the job requirements here"
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Personal Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={form.notes}
                    onChange={handleInputChange}
                    placeholder="Any personal notes about this application"
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Application Status</Label>
                  <Select
                    defaultValue={form.status}
                    onValueChange={(value) => handleSelectChange("status", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="ready">Ready to Apply</SelectItem>
                      <SelectItem value="applied">Applied</SelectItem>
                      <SelectItem value="inProgress">In Progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 flex space-x-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={handleCopy}
                    className="w-[140px]"
                  >
                    {copied ? (
                      <>
                        <CheckIcon className="mr-1 h-4 w-4" /> Copied
                      </>
                    ) : (
                      <>
                        <CopyIcon className="mr-1 h-4 w-4" /> Copy Details
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="w-[140px]"
                  >
                    {saved ? (
                      <>
                        <CheckIcon className="mr-1 h-4 w-4" /> Saved
                      </>
                    ) : (
                      <>
                        <SaveIcon className="mr-1 h-4 w-4" /> Save
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right side - Job portal iframe */}
          <div className="w-full md:w-1/2 space-y-6">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold">
                  Job Portals
                </CardTitle>
                <CardDescription>
                  Browse and find jobs on popular platforms
                </CardDescription>
              </CardHeader>
              <Tabs defaultValue="indeed" value={activeTab} onValueChange={handlePlatformChange} className="w-full">
                <TabsList className="w-full overflow-x-auto flex-wrap justify-start h-auto py-1 px-1">
                  {JOB_PLATFORMS.map((platform) => (
                    <TabsTrigger key={platform.id} value={platform.id} className="flex-shrink-0">
                      {platform.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {JOB_PLATFORMS.map((platform) => (
                  <TabsContent key={platform.id} value={platform.id} className="flex-grow">
                    <div className="rounded-md border bg-card overflow-hidden h-[700px]">
                      <iframe
                        src={platform.url}
                        title={platform.name}
                        className="w-full h-full"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                      ></iframe>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}