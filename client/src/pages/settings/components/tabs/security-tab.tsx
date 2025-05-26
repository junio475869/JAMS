import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShieldIcon } from "lucide-react";
import { UseFormReturn } from "react-hook-form";

interface SecurityTabProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => void;
  isPending: boolean;
}

export function SecurityTab({
  form,
  onSubmit,
  isPending,
}: SecurityTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-white">Password</h3>
        <p className="text-gray-400 text-sm mt-1">
          Update your password to keep your account secure.
        </p>
      </div>
      <Separator className="bg-gray-700" />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
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
            control={form.control}
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
                  Password must be at least 8 characters.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
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
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Update Password"}
          </Button>
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
  );
} 