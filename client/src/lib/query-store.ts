import { QueryClient } from '@tanstack/react-query';
import { User, JobProfile, GmailInfo } from '@shared/schema';

// Query keys as constants to avoid typos and enable better type safety
export const QUERY_KEYS = {
  USER: {
    CURRENT: ['user', 'current'] as const,
    PROFILE: (userId: number) => ['user', 'profile', userId] as const,
  },
  JOB_PROFILES: {
    ALL: ['job-profiles'] as const,
    BY_ID: (id: number) => ['job-profiles', id] as const,
    BY_USER: (userId: number) => ['job-profiles', 'user', userId] as const,
  },
  GMAIL: {
    INFO: ['gmail', 'info'] as const,
    THREADS: ['gmail', 'threads'] as const,
    THREAD: (threadId: string) => ['gmail', 'thread', threadId] as const,
  },
  APPLICATIONS: {
    ALL: ['applications'] as const,
    BY_ID: (id: number) => ['applications', id] as const,
    BY_USER: (userId: number) => ['applications', 'user', userId] as const,
  },
  DOCUMENTS: {
    ALL: ['documents'] as const,
    BY_ID: (id: number) => ['documents', id] as const,
    BY_USER: (userId: number) => ['documents', 'user', userId] as const,
  },
  INTERVIEWS: {
    ALL: ['interviews'] as const,
    BY_ID: (id: number) => ['interviews', id] as const,
    BY_USER: (userId: number) => ['interviews', 'user', userId] as const,
    BY_APPLICATION: (applicationId: number) => ['interviews', 'application', applicationId] as const,
  },
} as const;

// Type for our query store
export type QueryStore = {
  user: {
    current: User | null;
    profile: Record<number, User>;
  };
  jobProfiles: {
    all: JobProfile[];
    byId: Record<number, JobProfile>;
    byUser: Record<number, JobProfile[]>;
  };
  gmail: {
    info: GmailInfo | null;
    threads: any[]; // Replace with proper type
    threadById: Record<string, any>; // Replace with proper type
  };
  applications: {
    all: any[]; // Replace with proper type
    byId: Record<number, any>; // Replace with proper type
    byUser: Record<number, any[]>; // Replace with proper type
  };
  documents: {
    all: any[]; // Replace with proper type
    byId: Record<number, any>; // Replace with proper type
    byUser: Record<number, any[]>; // Replace with proper type
  };
  interviews: {
    all: any[]; // Replace with proper type
    byId: Record<number, any>; // Replace with proper type
    byUser: Record<number, any[]>; // Replace with proper type
    byApplication: Record<number, any[]>; // Replace with proper type
  };
};

// Create a new QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Helper functions to update the query store
export const updateUserStore = (user: User | null) => {
  queryClient.setQueryData(QUERY_KEYS.USER.CURRENT, user);
};

export const updateJobProfilesStore = (profiles: JobProfile[]) => {
  queryClient.setQueryData(QUERY_KEYS.JOB_PROFILES.ALL, profiles);
  // Update byId cache
  profiles.forEach(profile => {
    queryClient.setQueryData(QUERY_KEYS.JOB_PROFILES.BY_ID(profile.id), profile);
  });
  // Update byUser cache
  const byUser = profiles.reduce((acc, profile) => {
    if (!acc[profile.userId]) {
      acc[profile.userId] = [];
    }
    acc[profile.userId].push(profile);
    return acc;
  }, {} as Record<number, JobProfile[]>);
  Object.entries(byUser).forEach(([userId, userProfiles]) => {
    queryClient.setQueryData(QUERY_KEYS.JOB_PROFILES.BY_USER(Number(userId)), userProfiles);
  });
};

export const updateGmailStore = (info: GmailInfo) => {
  queryClient.setQueryData(QUERY_KEYS.GMAIL.INFO, info);
};

// Helper function to clear all data on logout
export const clearQueryStore = () => {
  queryClient.clear();
}; 