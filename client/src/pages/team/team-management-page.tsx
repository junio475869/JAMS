import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { User, UserRole } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, UserPlus, Edit, Trash2, Users } from "lucide-react";

export default function TeamManagementPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch team members based on user role
  const { data: teamMembers, isLoading } = useQuery<User[]>({
    queryKey: ["/api/team/members"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/team/members");
      return await res.json();
    },
    enabled: !authLoading && !!user && (user.role === UserRole.ADMIN || user.role === UserRole.GROUP_LEADER),
  });

  // Add user mutation
  const addUserMutation = useMutation({
    mutationFn: async (newUser: any) => {
      const res = await apiRequest("POST", "/api/team/members", newUser);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      setIsAddUserOpen(false);
      toast({
        title: "User added",
        description: "The team member has been added successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<User> }) => {
      const res = await apiRequest("PATCH", `/api/team/members/${id}`, updates);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      setIsEditUserOpen(false);
      toast({
        title: "User updated",
        description: "The team member has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/team/members/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/team/members"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "User removed",
        description: "The team member has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove user",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditUserOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const newUser = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      fullname: formData.get("fullname") as string,
      role: formData.get("role") as string,
      teamId: user?.role === UserRole.GROUP_LEADER ? user.teamId : parseInt(formData.get("teamId") as string),
    };

    addUserMutation.mutate(newUser);
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUser) return;

    const formData = new FormData(e.currentTarget);
    
    const updates = {
      fullname: formData.get("fullname") as string,
      role: formData.get("role") as string,
      teamId: user?.role === UserRole.GROUP_LEADER ? user.teamId : parseInt(formData.get("teamId") as string),
    };

    updateUserMutation.mutate({ id: selectedUser.id, updates });
  };

  const handleConfirmDelete = () => {
    if (selectedUser) {
      deleteUserMutation.mutate(selectedUser.id);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Check if user is admin or group leader
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.GROUP_LEADER)) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don't have permission to view this page. This area is restricted to administrators and group leaders.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-muted-foreground mt-1">
            {user.role === UserRole.ADMIN 
              ? "Manage all team members and their roles" 
              : "Manage your team members"}
          </p>
        </div>

        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Team Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Team Member</DialogTitle>
              <DialogDescription>
                Create a new account for a team member. They will receive login credentials.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" name="username" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" name="password" type="password" required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fullname">Full Name</Label>
                  <Input id="fullname" name="fullname" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select name="role" defaultValue={UserRole.JOB_SEEKER}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Admin can assign any role */}
                      {user.role === UserRole.ADMIN && (
                        <>
                          <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                          <SelectItem value={UserRole.GROUP_LEADER}>Group Leader</SelectItem>
                        </>
                      )}
                      <SelectItem value={UserRole.JOB_SEEKER}>Job Seeker</SelectItem>
                      <SelectItem value={UserRole.JOB_BIDDER}>Job Bidder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user.role === UserRole.ADMIN && (
                  <div className="grid gap-2">
                    <Label htmlFor="teamId">Team ID</Label>
                    <Input id="teamId" name="teamId" type="number" />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addUserMutation.isPending}>
                  {addUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Add User
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Team Members Table */}
      <div className="rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : teamMembers && teamMembers.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Team ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.fullname || 'N/A'}</TableCell>
                  <TableCell>{member.username}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary/10 text-primary">
                      {member.role}
                    </span>
                  </TableCell>
                  <TableCell>{member.teamId || 'N/A'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditUser(member)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDeleteUser(member)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No team members found</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first team member to get started</p>
          </div>
        )}
      </div>

      {/* Edit User Dialog */}
      {selectedUser && (
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Team Member</DialogTitle>
              <DialogDescription>
                Update team member information and role.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-fullname">Full Name</Label>
                  <Input 
                    id="edit-fullname" 
                    name="fullname" 
                    defaultValue={selectedUser.fullname || ''} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select name="role" defaultValue={selectedUser.role}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Admin can assign any role */}
                      {user.role === UserRole.ADMIN && (
                        <>
                          <SelectItem value={UserRole.ADMIN}>Administrator</SelectItem>
                          <SelectItem value={UserRole.GROUP_LEADER}>Group Leader</SelectItem>
                        </>
                      )}
                      <SelectItem value={UserRole.JOB_SEEKER}>Job Seeker</SelectItem>
                      <SelectItem value={UserRole.JOB_BIDDER}>Job Bidder</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user.role === UserRole.ADMIN && (
                  <div className="grid gap-2">
                    <Label htmlFor="edit-teamId">Team ID</Label>
                    <Input 
                      id="edit-teamId" 
                      name="teamId" 
                      type="number" 
                      defaultValue={selectedUser.teamId?.toString() || ''} 
                    />
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditUserOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateUserMutation.isPending}>
                  {updateUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {selectedUser && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Delete</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove {selectedUser.fullname || selectedUser.username} from your team? 
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleConfirmDelete}
                disabled={deleteUserMutation.isPending}
              >
                {deleteUserMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}