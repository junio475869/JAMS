import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Loader2,
  User,
  KeyIcon,
  ShieldIcon,
  BellIcon,
  CalendarIcon,
  MailIcon,
  PlusIcon,
  TrashIcon,
  ActivityIcon,
  UsersIcon,
} from "lucide-react";
import {
  Table,
  TableHead,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Profile update form schema
const profileFormSchema = z.object({
  fullName: z.string().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters"),
  email: z.string().email("Invalid email format"),
  profilePicture: z.string().optional(),
});

// Profile schema for multiple profiles
const profileSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthday: z.string().min(1, "Birthday is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  resumes: z
    .array(
      z.object({
        id: z.string(),
        createdAt: z.date(),
        url: z.string(),
      })
    )
    .default([]),
  gmails: z.array(z.string().email()).default([]),
});

type Profile = z.infer<typeof profileSchema>;

// Password update form schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Add Gmail connection schema
const gmailConnectionSchema = z.object({
  email: z.string().email(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiry: z.date(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;
type GmailConnection = z.infer<typeof gmailConnectionSchema>;

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile form for adding/editing profiles
  const profileForm = useForm<Profile>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      birthday: "",
      state: "",
      city: "",
      address: "",
      country: "",
      phoneNumber: "",
      resumes: [],
      gmails: [],
    },
  });

  // Password form
  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Add Gmail connections query
  const { data: gmailConnections, isLoading: isLoadingGmail } = useQuery({
    queryKey: ["/api/gmail/connections"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/gmail/connections");
      return res.json();
    },
  });

  // Add Gmail connection mutation
  const connectGmailMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/gmail/auth-url");
      const { url } = await res.json();
      window.location.href = url;
    },
  });

  // Add Gmail disconnection mutation
  const disconnectGmailMutation = useMutation({
    mutationFn: async (email: string) => {
      await apiRequest("DELETE", `/api/gmail/connections/${email}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gmail/connections"] });
      toast({
        title: "Gmail disconnected",
        description: "The Gmail account has been successfully disconnected",
      });
    },
  });

  // Fetch profiles
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profiles");
      return res.json();
    },
  });

  // Add/Update profile mutation
  const profileMutation = useMutation({
    mutationFn: async (data: Profile) => {
      if (data.id) {
        const res = await apiRequest("PUT", `/api/profiles/${data.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/profiles", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      setIsProfileModalOpen(false);
      setSelectedProfile(null);
      toast({
        title: selectedProfile ? "Profile updated" : "Profile added",
        description: `Profile has been successfully ${selectedProfile ? "updated" : "added"}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete profile mutation
  const deleteProfileMutation = useMutation({
    mutationFn: async (profileId: string) => {
      await apiRequest("DELETE", `/api/profiles/${profileId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profiles"] });
      toast({
        title: "Profile deleted",
        description: "Profile has been successfully deleted",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        username: user.username || "",
        email: user.email || "",
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user, profileForm]);

  const onPasswordSubmit = (data: PasswordFormValues) => {
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      const res = await apiRequest("POST", `/api/user/password`, data);
      return res.json();
    },
    onSuccess: () => {
      passwordForm.reset();
      toast({
        title: "Password updated",
        description: "Your password has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating password",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if in demo mode
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  const handleAddProfile = () => {
    setSelectedProfile(null);
    profileForm.reset({
      firstName: "",
      lastName: "",
      birthday: "",
      state: "",
      city: "",
      address: "",
      country: "",
      phoneNumber: "",
      resumes: [],
      gmails: [],
    });
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    profileForm.reset(profile);
    setIsProfileModalOpen(true);
  };

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      deleteProfileMutation.mutate(profileId);
    }
  };

  const onSubmitProfile = (data: Profile) => {
    profileMutation.mutate(data);
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map((name) => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.username.substring(0, 2).toUpperCase() || "U";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            sidebarCollapsed={sidebarOpen}
            setSidebarCollapsed={setSidebarOpen}
            isMobileMenuOpen={false}
            setIsMobileMenuOpen={() => {}}
          />
          <main className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-gray-400 mt-1">
            Manage your account information and preferences
          </p>
        </div>

        {/* Profile Card */}
        <Card className="bg-gray-800 border-gray-700 pb-6">
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between pb-2">
            <div className="flex flex-col items-center md:flex-row md:items-center">
              <Avatar className="h-16 w-16 border-2 border-primary-600">
                {user?.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.username} />
                ) : (
                  <AvatarFallback className="bg-primary-700 text-white text-lg">
                    {getUserInitials()}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="mt-4 md:mt-0 md:ml-6 text-center md:text-left">
                <CardTitle className="text-xl">
                  {user?.fullName || user?.username}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {user?.email}
                </CardDescription>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                Active Account
              </span>
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            <Tabs
              defaultValue="profile"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid grid-cols-6 bg-gray-750">
                <TabsTrigger
                  value="profile"
                  className="data-[state=active]:bg-gray-700"
                >
                  <User className="h-4 w-4 mr-2" />
                  Account
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="data-[state=active]:bg-gray-700"
                >
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger
                  value="preferences"
                  className="data-[state=active]:bg-gray-700"
                >
                  <BellIcon className="h-4 w-4 mr-2" />
                  Preferences
                </TabsTrigger>
                <TabsTrigger
                  value="profiles"
                  className="data-[state=active]:bg-gray-700"
                >
                  <UsersIcon className="h-4 w-4 mr-2" />
                  Profiles
                </TabsTrigger>
                <TabsTrigger
                  value="gmail"
                  className="data-[state=active]:bg-gray-700"
                >
                  <MailIcon className="h-4 w-4 mr-2" />
                  Gmail
                </TabsTrigger>
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gray-700"
                >
                  <ActivityIcon className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile" className="pt-6">
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                    className="space-y-4"
                  >
                    <FormField
                      control={profileForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="profilePicture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              value={field.value || ""}
                              placeholder="https://example.com/avatar.jpg"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={profileMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {profileMutation.isPending
                          ? "Saving..."
                          : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security" className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">Password</h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Update your password to keep your account secure.
                    </p>
                  </div>
                  <Separator className="bg-gray-700" />
                  <Form {...passwordForm}>
                    <form
                      onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Current Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>New Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              Password must be at least 6 characters.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={passwordForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="password"
                                className="bg-gray-700 border-gray-600 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="pt-2">
                        <Button
                          type="submit"
                          disabled={updatePasswordMutation.isPending}
                          className="w-full md:w-auto"
                        >
                          {updatePasswordMutation.isPending
                            ? "Updating..."
                            : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>

                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white">
                      Two-Factor Authentication
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Add an extra layer of security to your account.
                    </p>
                    <div className="mt-4 bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div className="flex items-center">
                        <ShieldIcon className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-white font-medium">
                            Two-Factor Authentication
                          </p>
                          <p className="text-gray-400 text-sm">Not enabled</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gray-700 border-gray-600"
                      >
                        Set Up
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Preferences Tab */}
              <TabsContent value="preferences" className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      Notifications
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Manage how and when you receive notifications.
                    </p>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="space-y-4">
                    <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">
                          Email Notifications
                        </p>
                        <p className="text-gray-400 text-sm">
                          Receive updates about your applications
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gray-700 border-gray-600"
                      >
                        Configure
                      </Button>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">
                          Application Reminders
                        </p>
                        <p className="text-gray-400 text-sm">
                          Get reminders about upcoming interviews
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="bg-gray-700 border-gray-600"
                      >
                        Configure
                      </Button>
                    </div>
                  </div>

                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white">
                      Data & Privacy
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Manage your data and privacy preferences.
                    </p>
                    <div className="mt-4 space-y-4">
                      <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">Data Export</p>
                          <p className="text-gray-400 text-sm">
                            Download a copy of your data
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          className="bg-gray-700 border-gray-600"
                        >
                          Export
                        </Button>
                      </div>
                      <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">
                            Account Delefgdsfgdstion
                          </p>
                          <p className="text-gray-400 text-sm">
                            Permanently delete your account and data
                          </p>
                        </div>
                        <Button variant="destructive">Delete Account</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Gmail Tab */}
              <TabsContent value="gmail" className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-medium text-white">
                      Gmail Accounts
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">
                      Manage your connected Gmail accounts for email tracking
                      and calendar integration.
                    </p>
                  </div>
                  <Separator className="bg-gray-700" />

                  {/* Connected Gmail Accounts */}
                  <div className="space-y-4">
                    {isLoadingGmail ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                      </div>
                    ) : gmailConnections?.length > 0 ? (
                      gmailConnections.map((connection: GmailConnection) => (
                        <div
                          key={connection.email}
                          className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <MailIcon className="h-5 w-5 text-gray-500 mr-3" />
                            <div>
                              <p className="text-white font-medium">
                                {connection.email}
                              </p>
                              <p className="text-gray-400 text-sm">
                                Connected{" "}
                                {new Date(
                                  connection.expiry
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="bg-gray-700 border-gray-600 hover:bg-red-900/20 hover:text-red-400"
                            onClick={() =>
                              disconnectGmailMutation.mutate(connection.email)
                            }
                          >
                            <TrashIcon className="h-4 w-4 mr-2" />
                            Disconnect
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        No Gmail accounts connected
                      </div>
                    )}

                    {/* Connect New Gmail Button */}
                    <Button
                      variant="outline"
                      className="w-full bg-gray-700 border-gray-600"
                      onClick={() => connectGmailMutation.mutate()}
                      disabled={connectGmailMutation.isPending}
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      {connectGmailMutation.isPending
                        ? "Connecting..."
                        : "Connect Gmail Account"}
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Profiles Tab */}
              <TabsContent value="profiles" className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-white">
                        Profiles
                      </h3>
                      <p className="text-gray-400 text-sm mt-1">
                        Manage your application profiles
                      </p>
                    </div>
                    <Button onClick={handleAddProfile}>
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Add Profile
                    </Button>
                  </div>
                  <Separator className="bg-gray-700" />

                  {isLoadingProfiles ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                    </div>
                  ) : profiles?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Resumes</TableHead>
                            <TableHead>Gmail Accounts</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profiles.map((profile: Profile) => (
                            <TableRow key={profile.id}>
                              <TableCell>
                                {profile.firstName} {profile.lastName}
                              </TableCell>
                              <TableCell>
                                {profile.city}, {profile.state}
                              </TableCell>
                              <TableCell>{profile.phoneNumber}</TableCell>
                              <TableCell>{profile.resumes.length}</TableCell>
                              <TableCell>{profile.gmails.length}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditProfile(profile)}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteProfile(profile.id!)
                                    }
                                  >
                                    <TrashIcon className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      No profiles found. Add your first profile to get started.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Profile Modal */}
      <Dialog open={isProfileModalOpen} onOpenChange={setIsProfileModalOpen}>
        <DialogContent className="max-h-[90vh] max-w-[80vw]">
          <DialogHeader>
            <DialogTitle>
              {selectedProfile ? "Edit Profile" : "Add Profile"}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile
                ? "Update your profile information"
                : "Create a new profile for your applications"}
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form
              onSubmit={profileForm.handleSubmit(onSubmitProfile)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="birthday"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={profileForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div>
                  <FormField
                    control={profileForm.control}
                    name="summary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Summary</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skills</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            className="bg-gray-700 border-gray-600 text-white"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Saving..." : "Save Profile"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
