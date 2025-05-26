import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Add Gmail connection schema
const gmailConnectionSchema = z.object({
  email: z.string().email(),
  accessToken: z.string(),
  refreshToken: z.string(),
  expiry: z.date(),
});

type GmailConnection = z.infer<typeof gmailConnectionSchema>;

export function GmailTab() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Connected Gmail Accounts</h2>
      <div className="grid gap-4">
        {isLoadingGmail ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
          </div>
        ) : gmailAccounts?.length > 0 ? (
          gmailAccounts.map((account: GmailConnection) => (
            <div
              key={account.email}
              className="p-4 bg-gray-800 rounded-lg flex items-center justify-between"
            >
              <div>
                <p className="font-medium">{account.email}</p>
                <p className="text-sm text-gray-400">
                  Connected on {new Date(account.expiry).toLocaleDateString()}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => disconnectGmailMutation.mutate(account.email)}
              >
                Disconnect
              </Button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400">
            No Gmail accounts connected
          </div>
        )}
      </div>
      <Button
        onClick={() => connectGmailMutation.mutate()}
        disabled={connectGmailMutation.isPending}
      >
        Connect New Account
      </Button>
    </div>
  );
} 