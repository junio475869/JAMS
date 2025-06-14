import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export function PreferencesTab() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user preferences
  const { data: preferences, isLoading: isLoadingPreferences } = useQuery({
    queryKey: ["/api/users", user?.id, "preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/users/${user?.id}/preferences`);
      return res.json();
    },
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: { emailNotifications: boolean; applicationReminders: boolean }) => {
      const res = await apiRequest("PUT", `/api/users/${user?.id}/preferences`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Preferences updated",
        description: "Your preferences have been successfully updated",
      });
    },
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", `/api/users/${user?.id}/export`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({
        title: "Data exported",
        description: "Your data has been successfully exported",
      });
    },
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/users/${user?.id}`);
      window.location.href = "/auth/signin";
    },
    onSuccess: () => {
      toast({
        title: "Account deleted",
        description: "Your account has been successfully deleted",
      });
    },
  });

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      deleteAccountMutation.mutate();
    }
  };

  if (isLoadingPreferences) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
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
            onClick={() => updatePreferencesMutation.mutate({
              ...preferences,
              emailNotifications: !preferences?.emailNotifications
            })}
          >
            {preferences?.emailNotifications ? "Disable" : "Enable"}
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
            onClick={() => updatePreferencesMutation.mutate({
              ...preferences,
              applicationReminders: !preferences?.applicationReminders
            })}
          >
            {preferences?.applicationReminders ? "Disable" : "Enable"}
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
              onClick={() => exportDataMutation.mutate()}
              disabled={exportDataMutation.isPending}
            >
              {exportDataMutation.isPending ? "Exporting..." : "Export"}
            </Button>
          </div>
          <div className="bg-gray-750 p-4 rounded-md border border-gray-700 flex justify-between items-center">
            <div>
              <p className="text-white font-medium">
                Account Deletion
              </p>
              <p className="text-gray-400 text-sm">
                Permanently delete your account and data
              </p>
            </div>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={deleteAccountMutation.isPending}
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete Account"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 