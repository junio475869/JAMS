import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

interface InterviewQuestion {
  id: number;
  question: string;
  answer?: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  company?: string;
  role?: string;
  upvotes: number;
  downvotes: number;
  tags: string[];
  createdAt: Date;
  userId: number;
  isPublic: boolean;
}

interface MockInterview {
  id: number;
  title: string;
  role: string;
  company?: string;
  duration: number;
  questionCount: number;
  difficulty: "Easy" | "Medium" | "Hard" | "Expert";
  createdAt: Date;
  completedAt?: Date;
  score?: number;
  feedback?: string;
  questions: {
    id: string;
    question: string;
    answer?: string;
    aiAnalysis?: {
      score: number;
      feedback: string;
      strengths: string[];
      weaknesses: string[];
      improvementSuggestions: string[];
    };
  }[];
}

interface AIResponse {
  id: number;
  question: string;
  response: string;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export function useInterviewPrep() {
  const queryClient = useQueryClient();

  // Questions
  const { data: questions = [], isLoading: isLoadingQuestions } = useQuery<InterviewQuestion[]>({
    queryKey: ['interviewPrepQuestions'],
    queryFn: async () => {
      const response = await axios.get('/api/interview-prep/questions');
      return response.data;
    },
  });

  const createQuestion = useMutation({
    mutationFn: async (data: Omit<InterviewQuestion, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await axios.post('/api/interview-prep/questions', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewPrepQuestions'] });
    },
  });

  const updateQuestion = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InterviewQuestion> }) => {
      const response = await axios.put(`/api/interview-prep/questions/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewPrepQuestions'] });
    },
  });

  const deleteQuestion = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/interview-prep/questions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewPrepQuestions'] });
    },
  });

  // Mock Interviews
  const { data: mockInterviews = [], isLoading: isLoadingMockInterviews } = useQuery<MockInterview[]>({
    queryKey: ['mockInterviews'],
    queryFn: async () => {
      const response = await axios.get('/api/interview-prep/mock-interviews');
      return response.data;
    },
  });

  const createMockInterview = useMutation({
    mutationFn: async (data: Omit<MockInterview, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await axios.post('/api/interview-prep/mock-interviews', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockInterviews'] });
    },
  });

  const updateMockInterview = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<MockInterview> }) => {
      const response = await axios.put(`/api/interview-prep/mock-interviews/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockInterviews'] });
    },
  });

  const deleteMockInterview = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/interview-prep/mock-interviews/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mockInterviews'] });
    },
  });

  // AI Responses
  const { data: aiResponses = [], isLoading: isLoadingAIResponses } = useQuery<AIResponse[]>({
    queryKey: ['aiResponses'],
    queryFn: async () => {
      const response = await axios.get('/api/interview-prep/ai-responses');
      return response.data;
    },
  });

  const createAIResponse = useMutation({
    mutationFn: async (data: { question: string; response: string }) => {
      const response = await axios.post('/api/interview-prep/ai-responses', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiResponses'] });
    },
  });

  const deleteAIResponse = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/api/interview-prep/ai-responses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiResponses'] });
    },
  });

  return {
    // Questions
    questions,
    isLoadingQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,

    // Mock Interviews
    mockInterviews,
    isLoadingMockInterviews,
    createMockInterview,
    updateMockInterview,
    deleteMockInterview,

    // AI Responses
    aiResponses,
    isLoadingAIResponses,
    createAIResponse,
    deleteAIResponse,
  };
} 