import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export function PreferencesTab() {
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
                Account Deletion
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
  );
} 