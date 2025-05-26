import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS, updateGmailStore } from '@/lib/query-store';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface GmailThread {
  id: string;
  snippet: string;
  historyId: string;
  messages: GmailMessage[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  historyId: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      data?: string;
      attachmentId?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
        attachmentId?: string;
      };
    }>;
  };
}

export function useGmail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get Gmail info
  const { data: gmailInfo, isLoading: isLoadingGmailInfo } = useQuery({
    queryKey: QUERY_KEYS.GMAIL.INFO,
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Get Gmail threads
  const { data: threads = [], isLoading: isLoadingThreads } = useQuery<GmailThread[]>({
    queryKey: QUERY_KEYS.GMAIL.THREADS,
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Get Gmail thread by ID
  const useGmailThread = (threadId: string) => {
    return useQuery<GmailThread>({
      queryKey: QUERY_KEYS.GMAIL.THREAD(threadId),
      queryFn: getQueryFn({ on401: 'throw' }),
    });
  };

  // Send email
  const sendEmail = useMutation({
    mutationFn: async (data: {
      to: string;
      subject: string;
      body: string;
      threadId?: string;
    }) => {
      const res = await apiRequest('POST', '/api/gmail/send', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GMAIL.THREADS });
      toast({
        title: 'Email Sent',
        description: 'Your email has been successfully sent.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Email',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Refresh Gmail data
  const refreshGmail = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/gmail/refresh');
      return res.json();
    },
    onSuccess: (data) => {
      updateGmailStore(data);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.GMAIL.THREADS });
      toast({
        title: 'Gmail Data Refreshed',
        description: 'Your Gmail data has been successfully refreshed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Refresh Gmail Data',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    gmailInfo,
    isLoadingGmailInfo,
    threads,
    isLoadingThreads,
    useGmailThread,
    sendEmail,
    refreshGmail,
  };
} 