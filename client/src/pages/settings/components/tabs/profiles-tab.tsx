import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

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
  gmails: z.array(z.string()),
  summary: z.string().optional(),
  skills: z.string().optional(),
  experience: z.string().optional(),
});

type Profile = z.infer<typeof profileSchema>;

interface ProfilesTabProps {
  onAddProfile: () => void;
  onEditProfile: (profile: Profile) => void;
}

export function ProfilesTab({ onAddProfile, onEditProfile }: ProfilesTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profiles
  const { data: profiles, isLoading: isLoadingProfiles } = useQuery({
    queryKey: ["/api/profiles"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profiles");
      return res.json();
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

  const handleDeleteProfile = (profileId: string) => {
    if (window.confirm("Are you sure you want to delete this profile?")) {
      deleteProfileMutation.mutate(profileId);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Job Profiles</h2>
        <Button onClick={onAddProfile}>
          Add Profile
        </Button>
      </div>
      <div className="grid gap-4">
        {isLoadingProfiles ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : profiles?.length > 0 ? (
          profiles.map((profile: Profile) => (
            <div
              key={profile.id}
              className="p-4 bg-gray-800 rounded-lg"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {profile.firstName} {profile.lastName}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {profile.city}, {profile.state}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => onEditProfile(profile)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDeleteProfile(profile.id!)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No profiles found. Add your first profile to get started.
          </div>
        )}
      </div>
    </div>
  );
} 