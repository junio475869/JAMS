import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { JobProfile } from '@shared/schema';
import { QUERY_KEYS, updateJobProfilesStore } from '@/lib/query-store';
import { getQueryFn, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export function useJobProfiles() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all job profiles
  const { data: jobProfiles = [], isLoading: isLoadingProfiles } = useQuery<JobProfile[]>({
    queryKey: QUERY_KEYS.JOB_PROFILES.ALL,
    queryFn: getQueryFn({ on401: 'throw' }),
  });

  // Get job profile by ID
  const useJobProfile = (id: number) => {
    return useQuery<JobProfile>({
      queryKey: QUERY_KEYS.JOB_PROFILES.BY_ID(id),
      queryFn: getQueryFn({ on401: 'throw' }),
    });
  };

  // Get job profiles by user ID
  const useUserJobProfiles = (userId: number) => {
    return useQuery<JobProfile[]>({
      queryKey: QUERY_KEYS.JOB_PROFILES.BY_USER(userId),
      queryFn: getQueryFn({ on401: 'throw' }),
    });
  };

  // Create job profile
  const createJobProfile = useMutation({
    mutationFn: async (data: Omit<JobProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
      const res = await apiRequest('POST', '/api/job-profiles', data);
      return res.json();
    },
    onSuccess: (newProfile) => {
      const currentProfiles = queryClient.getQueryData<JobProfile[]>(QUERY_KEYS.JOB_PROFILES.ALL) || [];
      updateJobProfilesStore([...currentProfiles, newProfile]);
      toast({
        title: 'Job Profile Created',
        description: 'Your job profile has been successfully created.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Job Profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update job profile
  const updateJobProfile = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<JobProfile> }) => {
      const res = await apiRequest('PUT', `/api/job-profiles/${id}`, data);
      return res.json();
    },
    onSuccess: (updatedProfile) => {
      const currentProfiles = queryClient.getQueryData<JobProfile[]>(QUERY_KEYS.JOB_PROFILES.ALL) || [];
      const updatedProfiles = currentProfiles.map(profile => 
        profile.id === updatedProfile.id ? updatedProfile : profile
      );
      updateJobProfilesStore(updatedProfiles);
      toast({
        title: 'Job Profile Updated',
        description: 'Your job profile has been successfully updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Job Profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete job profile
  const deleteJobProfile = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/job-profiles/${id}`);
    },
    onSuccess: (_, id) => {
      const currentProfiles = queryClient.getQueryData<JobProfile[]>(QUERY_KEYS.JOB_PROFILES.ALL) || [];
      const updatedProfiles = currentProfiles.filter(profile => profile.id !== id);
      updateJobProfilesStore(updatedProfiles);
      toast({
        title: 'Job Profile Deleted',
        description: 'Your job profile has been successfully deleted.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Job Profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    jobProfiles,
    isLoadingProfiles,
    useJobProfile,
    useUserJobProfiles,
    createJobProfile,
    updateJobProfile,
    deleteJobProfile,
  };
} 