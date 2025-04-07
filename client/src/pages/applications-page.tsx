import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import KanbanBoard from "@/components/ui/kanban-board";
import { Plus, SlidersHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ApplicationStatus } from "@shared/schema";

export default function ApplicationsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your job applications</p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row sm:space-x-3">
          <div className="relative mb-2 sm:mb-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search applications..."
                className="pl-10"
              />
            </div>
          </div>
          <Button variant="outline" className="mb-2 sm:mb-0">
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Application</DialogTitle>
                <DialogDescription>
                  Fill out the details for your new job application.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    placeholder="Enter company name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    placeholder="Enter job position"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={ApplicationStatus.APPLIED}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ApplicationStatus.APPLIED}>Applied</SelectItem>
                      <SelectItem value={ApplicationStatus.INTERVIEW}>Interview</SelectItem>
                      <SelectItem value={ApplicationStatus.OFFER}>Offer</SelectItem>
                      <SelectItem value={ApplicationStatus.REJECTED}>Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">Job Posting URL</Label>
                  <Input
                    id="url"
                    placeholder="Enter job posting URL"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    placeholder="Enter any notes about this application"
                    className="min-h-[100px] rounded-md border bg-background p-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save Application</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard />
    </div>
  );
}
