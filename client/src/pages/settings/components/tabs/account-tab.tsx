import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { User, insertUserSchema } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";

const updateUserSchema = insertUserSchema.pick({
  username: true,
  fullname: true,
  email: true,
  profilePicture: true,
});

// interface AccountTabProps {
//   form: UseFormReturn<any>;
//   onSubmit: (data: any) => void;
//   isPending: boolean;
// }

export function AccountTab() {

  const { user } = useAuth();
  
  const updateUserMutation = useMutation({
    mutationFn: (data: z.infer<typeof updateUserSchema>) => apiRequest("PUT", `/api/users/${user?.id}`, data),
    onMutate: (data) => {
      queryClient.setQueryData(["/api/users", user?.id], data);
      return { data };
    },
    onSuccess: () => {
      toast({
        title: "User updated successfully",
        description: "Your user information has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id] });
    },
    onError: () => {
      toast({
        title: "Failed to update user",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const form = useForm<z.infer<typeof updateUserSchema>>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      username: "",
      fullname: "",
      email: "",
      profilePicture: "",
    }
  });

  useEffect(() => {
    if (user) {
      form.setValue("username", user.username);
      form.setValue("fullname", user.fullname);
      form.setValue("email", user.email);
      form.setValue("profilePicture", user.profilePicture);
    }
  }, [user]);

  const onSubmit = (data: z.infer<typeof updateUserSchema>) => {
    console.log(data);
    updateUserMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fullname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="profilePicture"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Profile Picture URL</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ""}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={updateUserMutation.isPending}>
          {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </Form>
  );
} 