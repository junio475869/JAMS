import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, User, KeyIcon, ShieldIcon, BellIcon, CalendarIcon } from "lucide-react";

// Profile update form schema
const profileFormSchema = z.object({
  fullName: z.string().optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be at most 30 characters"),
  email: z.string().email("Invalid email format"),
  profilePicture: z.string().optional(),
});

// Password update form schema
const passwordFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm password is required"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export default function ProfilePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      username: user?.username || "",
      email: user?.email || "",
      profilePicture: user?.profilePicture || "",
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

  // Update form values when user data loads
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "",
      });
    }
  }, [user, profileForm]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      const res = await apiRequest("PATCH", `/api/user/${user?.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update password mutation
  const updatePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
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
    }
  });

  // Check if in demo mode
  const isDemoMode = localStorage.getItem("demoMode") === "true";

  // Submit profile form
  const onProfileSubmit = (data: ProfileFormValues) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Profile updates are not saved in demo mode",
      });
      return;
    }
    updateProfileMutation.mutate(data);
  };

  // Submit password form
  const onPasswordSubmit = (data: PasswordFormValues) => {
    if (isDemoMode) {
      toast({
        title: "Demo Mode",
        description: "Password updates are not saved in demo mode",
      });
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (user?.fullName) {
      return user.fullName
        .split(" ")
        .map(name => name[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return user?.username.substring(0, 2).toUpperCase() || 'U';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-900 text-gray-200">
        <Header toggleSidebar={toggleSidebar} />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
          <main className="flex-1 overflow-auto bg-gray-900 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </main>
        </div>
      </div>
    );
  }

  return (    
    <div className="max-w-screen-lg mx-auto p-4 md:p-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account information and preferences</p>
        </div>

        {/* Profile Card */}
        <Card className="bg-gray-800 border-gray-700">
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
                <CardTitle className="text-xl">{user?.fullName || user?.username}</CardTitle>
                <CardDescription className="text-gray-400">{user?.email}</CardDescription>
              </div>
            </div>
            <div className="mt-4 md:mt-0">
              <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full">
                Active Account
              </span>
            </div>
          </CardHeader>
          <CardContent className="pb-0">
            <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 bg-gray-750">
                <TabsTrigger value="profile" className="data-[state=active]:bg-gray-700">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </TabsTrigger>
                <TabsTrigger value="security" className="data-[state=active]:bg-gray-700">
                  <KeyIcon className="h-4 w-4 mr-2" />
                  Security
                </TabsTrigger>
                <TabsTrigger value="preferences" className="data-[state=active]:bg-gray-700">
                  <BellIcon className="h-4 w-4 mr-2" />
                  Preferences
                </TabsTrigger>
              </TabsList>
              
              {/* Profile Tab */}
              <TabsContent value="profile" className="pt-6">
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
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
                          <FormDescription className="text-gray-500">
                            This is your public username.
                          </FormDescription>
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
                              value={field.value || ''}
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500">
                            Your full name helps personalize your experience.
                          </FormDescription>
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
                          <FormDescription className="text-gray-500">
                            Your email address is used for notifications and account recovery.
                          </FormDescription>
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
                              value={field.value || ''}
                              placeholder="https://example.com/avatar.jpg"
                              className="bg-gray-700 border-gray-600 text-white"
                            />
                          </FormControl>
                          <FormDescription className="text-gray-500">
                            Enter a URL for your profile picture.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="w-full md:w-auto"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
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
                    <p className="text-gray-400 text-sm mt-1">Update your password to keep your account secure.</p>
                  </div>
                  <Separator className="bg-gray-700" />
                  <Form {...passwordForm}>
                    <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
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
                          {updatePasswordMutation.isPending ? "Updating..." : "Update Password"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm mt-1">Add an extra layer of security to your account.</p>
                    <div className="mt-4 bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div className="flex items-center">
                        <ShieldIcon className="h-5 w-5 text-gray-500 mr-3" />
                        <div>
                          <p className="text-white font-medium">Two-Factor Authentication</p>
                          <p className="text-gray-400 text-sm">Not enabled</p>
                        </div>
                      </div>
                      <Button variant="outline" className="bg-gray-700 border-gray-600">
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
                    <h3 className="text-lg font-medium text-white">Notifications</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage how and when you receive notifications.</p>
                  </div>
                  <Separator className="bg-gray-700" />
                  <div className="space-y-4">
                    <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">Email Notifications</p>
                        <p className="text-gray-400 text-sm">Receive updates about your applications</p>
                      </div>
                      <Button variant="outline" className="bg-gray-700 border-gray-600">
                        Configure
                      </Button>
                    </div>
                    <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                      <div>
                        <p className="text-white font-medium">Application Reminders</p>
                        <p className="text-gray-400 text-sm">Get reminders about upcoming interviews</p>
                      </div>
                      <Button variant="outline" className="bg-gray-700 border-gray-600">
                        Configure
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-white">Data & Privacy</h3>
                    <p className="text-gray-400 text-sm mt-1">Manage your data and privacy preferences.</p>
                    <div className="mt-4 space-y-4">
                      <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">Data Export</p>
                          <p className="text-gray-400 text-sm">Download a copy of your data</p>
                        </div>
                        <Button variant="outline" className="bg-gray-700 border-gray-600">
                          Export
                        </Button>
                      </div>
                      <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">Account Deletion</p>
                          <p className="text-gray-400 text-sm">Permanently delete your account and data</p>
                        </div>
                        <Button variant="destructive">
                          Delete Account
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* Account Activity */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Account Activity</CardTitle>
            <CardDescription>Recent activity on your account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-white">Account created</p>
                  <p className="text-gray-400 text-sm">{user?.createdAt ? new Date(user.createdAt).toLocaleString() : 'Recently'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="h-8 w-8 bg-gray-700 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-white">Last login</p>
                  <p className="text-gray-400 text-sm">Today, {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t border-gray-700 pt-6">
            <Button variant="outline" className="w-full md:w-auto bg-gray-700 border-gray-600">
              View Full Activity Log
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
