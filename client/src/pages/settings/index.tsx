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
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Loader2,
} from "lucide-react";

import { AccountTab } from "./components/tabs/account-tab";
import { SecurityTab } from "./components/tabs/security-tab";
import { PreferencesTab } from "./components/tabs/preferences-tab";
import { GmailTab } from "./components/tabs/gmail-tab";
import { ProfilesTab } from "./components/tabs/profiles-tab";
import { ProfileModal } from "./components/modals/profile-modal";
import { DeleteConfirmationModal } from "./components/modals/delete-confirmation-modal";

// Profile update form schema
const profileFormSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  username: z.string().min(1, "Username is required"),
  email: z.string().email("Invalid email address"),
  profilePicture: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthday: z.string().min(1, "Date of birth is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  zip: z.string().min(1, "ZIP code is required"),
  resumes: z.array(z.string()),
  gmails: z.array(z.string()),
  summary: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
});

// Profile schema for multiple profiles
const profileSchema = z.object({
  id: z.string().optional(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  birthday: z.string().min(1, "Date of birth is required"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  address: z.string().min(1, "Address is required"),
  country: z.string().min(1, "Country is required"),
  phone: z.string().min(1, "Phone number is required"),
  zip: z.string().min(1, "ZIP code is required"),
  resumes: z.array(z.object({
    id: z.string(),
    createdAt: z.date(),
    url: z.string(),
  })),
});

type Profile = z.infer<typeof profileSchema>;

// Password update form schema
const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
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
  const [activeTab, setActiveTab] = useState("account");
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
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
      phone: "",
      zip: "",
      resumes: [],
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
  const { data: gmailAccounts, isLoading: isLoadingGmail } = useQuery({
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
        firstName: "",
        lastName: "",
        birthday: "",
        state: "",
        city: "",
        address: "",
        country: "",
        phone: "",
        zip: "",
        resumes: [],
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
      phone: "",
      zip: "",
      resumes: [],
    });
    setIsProfileModalOpen(true);
  };

  const handleEditProfile = (profile: Profile) => {
    console.log(profile);
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
    <div className="flex h-screen bg-gray-900 text-white">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto py-8 px-4">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="gmail">Gmail</TabsTrigger>
              <TabsTrigger value="profiles">Profiles</TabsTrigger>
            </TabsList>

            <TabsContent value="account">
              <AccountTab
                form={profileForm}
                onSubmit={onSubmitProfile}
                isPending={profileMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="security">
              <SecurityTab
                form={passwordForm}
                onSubmit={updatePasswordMutation.mutate}
                isPending={updatePasswordMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="preferences">
              <PreferencesTab />
            </TabsContent>

            <TabsContent value="gmail">
              <GmailTab />
            </TabsContent>

            <TabsContent value="profiles">
              <ProfilesTab
                onAddProfile={handleAddProfile}
                onEditProfile={handleEditProfile}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ProfileModal
        isOpen={isProfileModalOpen}
        onOpenChange={setIsProfileModalOpen}
        form={profileForm}
        onSubmit={onSubmitProfile}
        isPending={profileMutation.isPending}
        selectedProfile={selectedProfile}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={() => handleDeleteProfile(selectedProfile?.id!)}
        isPending={deleteProfileMutation.isPending}
        title="Delete Profile"
        description="Are you sure you want to delete this profile? This action cannot be undone."
      />
    </div>
  );
}
