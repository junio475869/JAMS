import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowUpDown, 
  Brain, 
  CheckCircle, 
  Code,
  FileText,
  HelpCircle, 
  MessageCircle, 
  Mic, 
  Monitor, 
  PencilLine, 
  Plus, 
  Search, 
  Send, 
  Star, 
  ThumbsDown, 
  ThumbsUp, 
  Timer, 
  User, 
  Users
} from "lucide-react";
import { format, subDays } from "date-fns";

interface InterviewQuestion {
  id: string;
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
  userId: string;
  isPublic: boolean;
}

interface MockInterview {
  id: string;
  title: string;
  role: string;
  company?: string;
  duration: number; // in minutes
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

export default function InterviewPrepPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  
  // Demo mode check
  const isDemoMode = localStorage.getItem("demoMode") === "true";
  
  // Question management
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [questionFilter, setQuestionFilter] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<InterviewQuestion | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: "",
    category: "Behavioral",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard" | "Expert",
    company: "",
    role: "",
    tags: "",
    isPublic: true
  });
  
  // Mock interview management
  const [mockInterviews, setMockInterviews] = useState<MockInterview[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<MockInterview | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewInProgress, setInterviewInProgress] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showMicModal, setShowMicModal] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  
  // AI Interview Assistance
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiResponses, setAiResponses] = useState<{
    question: string;
    response: string;
    timestamp: Date;
  }[]>([]);
  
  useEffect(() => {
    if (isDemoMode) {
      // Generate mock interview questions
      const mockQuestions: InterviewQuestion[] = [
        {
          id: "1",
          question: "Tell me about a time you had to handle a difficult situation with a team member.",
          answer: "The STAR method is useful here: describe the Situation, Task, Action, and Result. Focus on how you communicated effectively and found a resolution that benefited the team.",
          category: "Behavioral",
          difficulty: "Medium",
          company: "Amazon",
          role: "Product Manager",
          upvotes: 143,
          downvotes: 12,
          tags: ["leadership", "conflict-resolution", "teamwork"],
          createdAt: subDays(new Date(), 120),
          userId: "user1",
          isPublic: true
        },
        {
          id: "2",
          question: "How would you design a URL shortening service like bit.ly?",
          answer: "Consider: 1) Hash function to create unique short URLs 2) Database schema 3) API design 4) Analytics features 5) Rate limiting 6) Caching strategy 7) Scaling considerations for high traffic",
          category: "System Design",
          difficulty: "Hard",
          company: "Google",
          role: "Senior Software Engineer",
          upvotes: 210,
          downvotes: 18,
          tags: ["system-design", "scalability", "backend"],
          createdAt: subDays(new Date(), 90),
          userId: "user2",
          isPublic: true
        },
        {
          id: "3",
          question: "Implement a function to check if a binary tree is balanced.",
          category: "Coding",
          difficulty: "Medium",
          company: "Microsoft",
          role: "Software Engineer",
          upvotes: 87,
          downvotes: 5,
          tags: ["binary-tree", "recursion", "dfs"],
          createdAt: subDays(new Date(), 60),
          userId: "user3",
          isPublic: true
        },
        {
          id: "4",
          question: "How would you improve the search functionality on our e-commerce platform?",
          answer: "Consider: 1) Implementing autocomplete 2) Fuzzy search for typos 3) Semantic search 4) Faceted filtering 5) Personalized results based on user behavior 6) A/B testing different approaches",
          category: "Product",
          difficulty: "Medium",
          company: "Shopify",
          role: "Product Manager",
          upvotes: 65,
          downvotes: 8,
          tags: ["search", "product-improvement", "user-experience"],
          createdAt: subDays(new Date(), 45),
          userId: "user4",
          isPublic: true
        },
        {
          id: "5",
          question: "What are the key considerations when designing a distributed cache?",
          category: "System Design",
          difficulty: "Expert",
          company: "Netflix",
          role: "Senior Backend Engineer",
          upvotes: 132,
          downvotes: 11,
          tags: ["distributed-systems", "caching", "scalability"],
          createdAt: subDays(new Date(), 30),
          userId: "user5",
          isPublic: true
        },
        {
          id: "6",
          question: "Describe a time when you had to make a difficult decision with limited information.",
          category: "Behavioral",
          difficulty: "Hard",
          company: "Apple",
          role: "Engineering Manager",
          upvotes: 97,
          downvotes: 9,
          tags: ["decision-making", "leadership", "uncertainty"],
          createdAt: subDays(new Date(), 25),
          userId: "user6",
          isPublic: true
        },
        {
          id: "7",
          question: "How would you implement a rate limiter for an API?",
          answer: "There are several approaches: 1) Token bucket algorithm 2) Leaky bucket algorithm 3) Fixed window counter 4) Sliding window log. Consider distributed implementation with Redis. Track by IP, user ID, or API key.",
          category: "System Design",
          difficulty: "Medium",
          company: "Stripe",
          role: "Backend Engineer",
          upvotes: 76,
          downvotes: 4,
          tags: ["api-design", "rate-limiting", "backend"],
          createdAt: subDays(new Date(), 15),
          userId: "user7",
          isPublic: true
        },
        {
          id: "8",
          question: "What motivates you to work in this industry?",
          category: "Behavioral",
          difficulty: "Easy",
          upvotes: 54,
          downvotes: 3,
          tags: ["motivation", "career-goals"],
          createdAt: subDays(new Date(), 10),
          userId: "user8",
          isPublic: true
        }
      ];
      
      // Create some mock interviews
      const mockInterviewsData: MockInterview[] = [
        {
          id: "1",
          title: "Frontend Developer Practice",
          role: "Frontend Developer",
          company: "Tech Innovations Inc.",
          duration: 30,
          questionCount: 5,
          difficulty: "Medium",
          createdAt: subDays(new Date(), 5),
          completedAt: subDays(new Date(), 4),
          score: 8.5,
          feedback: "Good knowledge of React and state management. Could improve on system design explanations.",
          questions: [
            {
              id: "q1",
              question: "Explain the virtual DOM and its benefits.",
              answer: "I explained how React uses a virtual DOM to optimize rendering by minimizing actual DOM manipulations.",
              aiAnalysis: {
                score: 9,
                feedback: "Excellent explanation of the virtual DOM concept.",
                strengths: ["Clear technical explanation", "Good examples", "Showed deep understanding"],
                weaknesses: ["Could have mentioned reconciliation process more specifically"],
                improvementSuggestions: ["Add a brief comparison with other frameworks"]
              }
            },
            {
              id: "q2",
              question: "How would you optimize the performance of a React application?",
              answer: "I discussed code splitting, memoization, lazy loading, and using production builds.",
              aiAnalysis: {
                score: 8,
                feedback: "Good coverage of optimization techniques.",
                strengths: ["Comprehensive list of techniques", "Practical focus"],
                weaknesses: ["Didn't mention profiling tools"],
                improvementSuggestions: ["Include examples of when to use each technique"]
              }
            }
          ]
        },
        {
          id: "2",
          title: "System Design Interview Prep",
          role: "Senior Backend Engineer",
          duration: 45,
          questionCount: 3,
          difficulty: "Hard",
          createdAt: subDays(new Date(), 2),
          questions: [
            {
              id: "q1",
              question: "Design a distributed file storage system like Google Drive."
            },
            {
              id: "q2",
              question: "How would you design Twitter's timeline feature?"
            },
            {
              id: "q3",
              question: "Design a global video streaming service like Netflix."
            }
          ]
        },
        {
          id: "3",
          title: "Product Manager Interview",
          role: "Product Manager",
          company: "FinTech Startup",
          duration: 25,
          questionCount: 4,
          difficulty: "Medium",
          createdAt: subDays(new Date(), 1),
          questions: [
            {
              id: "q1",
              question: "How would you prioritize features for our new mobile banking app?"
            },
            {
              id: "q2",
              question: "Describe a product you managed from ideation to launch."
            },
            {
              id: "q3",
              question: "How do you gather and incorporate user feedback?"
            },
            {
              id: "q4",
              question: "How would you measure the success of a new feature?"
            }
          ]
        }
      ];
      
      setQuestions(mockQuestions);
      setMockInterviews(mockInterviewsData);
      
      // Sample AI responses
      setAiResponses([
        {
          question: "How should I prepare for a system design interview?",
          response: "For system design interviews, focus on understanding scalability concepts, database design, caching strategies, load balancing, and microservices architecture. Practice drawing system diagrams and explaining your thought process clearly. Study existing system designs of popular applications like Twitter, Netflix, or Uber. Be ready to discuss trade-offs between different approaches.",
          timestamp: subDays(new Date(), 2)
        },
        {
          question: "What's a good answer for 'Tell me about yourself'?",
          response: "A strong response to 'Tell me about yourself' should be concise (1-2 minutes) and structured like this:\n\n1. Current role and key responsibilities\n2. Relevant past experience that prepared you for this role\n3. Key achievements or skills that align with the job\n4. Why you're interested in this specific position and company\n\nFocus on professional information relevant to the role rather than personal details. Tailor your answer to highlight experiences that match the job description.",
          timestamp: subDays(new Date(), 1)
        }
      ]);
    }
  }, [isDemoMode]);
  
  // Filter questions based on search input
  const filteredQuestions = questionFilter
    ? questions.filter(q => 
        q.question.toLowerCase().includes(questionFilter.toLowerCase()) ||
        (q.company && q.company.toLowerCase().includes(questionFilter.toLowerCase())) ||
        (q.role && q.role.toLowerCase().includes(questionFilter.toLowerCase())) ||
        q.category.toLowerCase().includes(questionFilter.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(questionFilter.toLowerCase()))
      )
    : questions;
    
  // Sort questions by upvotes (most popular first)
  const sortedQuestions = [...filteredQuestions].sort((a, b) => b.upvotes - a.upvotes);
  
  const handleCreateQuestion = () => {
    if (!newQuestion.question.trim()) {
      toast({
        title: "Question is required",
        description: "Please enter a question before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would make an API call
    const question: InterviewQuestion = {
      id: `new-${Math.random().toString(36).substr(2, 9)}`,
      question: newQuestion.question,
      answer: newQuestion.answer,
      category: newQuestion.category,
      difficulty: newQuestion.difficulty,
      company: newQuestion.company || undefined,
      role: newQuestion.role || undefined,
      upvotes: 0,
      downvotes: 0,
      tags: newQuestion.tags ? newQuestion.tags.split(',').map(tag => tag.trim()) : [],
      createdAt: new Date(),
      userId: "current-user",
      isPublic: newQuestion.isPublic
    };
    
    setQuestions([question, ...questions]);
    setShowQuestionModal(false);
    setNewQuestion({
      question: "",
      answer: "",
      category: "Behavioral",
      difficulty: "Medium",
      company: "",
      role: "",
      tags: "",
      isPublic: true
    });
    
    toast({
      title: "Question created",
      description: "Your question has been added successfully."
    });
  };
  
  const handleVote = (id: string, isUpvote: boolean) => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          upvotes: isUpvote ? q.upvotes + 1 : q.upvotes,
          downvotes: !isUpvote ? q.downvotes + 1 : q.downvotes
        };
      }
      return q;
    }));
  };
  
  const handleStartMockInterview = (interview: MockInterview) => {
    setSelectedInterview(interview);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setInterviewInProgress(true);
    setInterviewComplete(false);
  };
  
  const handleNextQuestion = () => {
    if (!selectedInterview) return;
    
    // Save the answer to the current question
    const updatedInterview = {...selectedInterview};
    updatedInterview.questions[currentQuestionIndex].answer = userAnswer;
    
    // Move to next question or finish interview
    if (currentQuestionIndex < (selectedInterview.questions?.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer("");
    } else {
      // Interview is complete
      updatedInterview.completedAt = new Date();
      // In a real app, this would send the interview to be analyzed
      updatedInterview.score = 8.7; // Mock score
      updatedInterview.feedback = "Good answers overall. You demonstrated strong technical knowledge and communication skills. Consider providing more specific examples in behavioral questions.";
      
      // Update mock interviews list
      setMockInterviews(mockInterviews.map(mi => 
        mi.id === updatedInterview.id ? updatedInterview : mi
      ));
      
      setSelectedInterview(updatedInterview);
      setInterviewComplete(true);
    }
  };
  
  const handleAskAI = () => {
    if (!aiPrompt.trim()) {
      toast({
        title: "Question is required",
        description: "Please enter a question to ask the AI assistant.",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would call the OpenAI API
    const mockResponse = "To prepare effectively for this interview, I recommend researching the company's products, values, and recent news. Practice answering common questions for your specific role using the STAR method (Situation, Task, Action, Result) for behavioral questions. Prepare questions to ask the interviewer that demonstrate your interest in the role. For technical interviews, review fundamentals and practice problem-solving out loud to demonstrate your thought process.";
    
    setAiResponses([
      {
        question: aiPrompt,
        response: mockResponse,
        timestamp: new Date()
      },
      ...aiResponses
    ]);
    
    setAiPrompt("");
    
    toast({
      title: "AI response generated",
      description: "The AI assistant has answered your question."
    });
  };

  return (
    <div className="container py-10">
      {isDemoMode && (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-6">
          <p className="text-blue-300 font-medium">
            You're in demo mode. Interview preparation features use sample data only.
          </p>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Interview Preparation</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="questions">Question Bank</TabsTrigger>
          <TabsTrigger value="mock">Mock Interviews</TabsTrigger>
          <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>
        </TabsList>
        
        <TabsContent value="questions">
          <div className="flex justify-between items-center mb-6">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions by keyword, company, or role..." 
                className="pl-10"
                value={questionFilter}
                onChange={(e) => setQuestionFilter(e.target.value)}
              />
            </div>
            <Button onClick={() => setShowQuestionModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sortedQuestions.length > 0 ? (
              sortedQuestions.map(question => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <Badge variant="outline">{question.category}</Badge>
                      <Badge variant={
                        question.difficulty === "Easy" ? "outline" : 
                        question.difficulty === "Medium" ? "secondary" :
                        question.difficulty === "Hard" ? "destructive" : 
                        "default"
                      }>
                        {question.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2 line-clamp-2">{question.question}</CardTitle>
                    {(question.company || question.role) && (
                      <CardDescription>
                        {question.company && `${question.company}`}{question.company && question.role && " • "}
                        {question.role && `${question.role}`}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    {question.answer ? (
                      <div className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {question.answer}
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground mb-4 italic">
                        No sample answer provided
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {question.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4 pb-2">
                    <div className="flex items-center space-x-1 text-sm">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-green-600"
                        onClick={() => handleVote(question.id, true)}
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        <span>{question.upvotes}</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 px-2 text-red-600"
                        onClick={() => handleVote(question.id, false)}
                      >
                        <ThumbsDown className="h-4 w-4 mr-1" />
                        <span>{question.downvotes}</span>
                      </Button>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedQuestion(question);
                        setShowQuestionModal(true);
                      }}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No questions found</h3>
                <p className="text-muted-foreground">
                  {questionFilter 
                    ? "No questions match your search criteria. Try a different search term."
                    : "There are no interview questions in the database yet. Add your first question to get started."}
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="mock">
          {interviewInProgress ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedInterview?.title}</h2>
                  <p className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of {selectedInterview?.questions?.length || 0}
                  </p>
                </div>
                <div className="flex items-center">
                  <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {Math.floor(selectedInterview?.duration || 0) / (selectedInterview?.questions?.length || 1)} minutes per question
                  </span>
                </div>
              </div>
              
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {selectedInterview?.questions[currentQuestionIndex].question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interviewComplete ? (
                    <div>
                      <div className="mb-4">
                        <Label>Your Answer</Label>
                        <div className="mt-2 p-4 border rounded-md bg-muted">
                          {selectedInterview?.questions[currentQuestionIndex].answer || "No answer provided"}
                        </div>
                      </div>
                      
                      {selectedInterview?.questions[currentQuestionIndex].aiAnalysis && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">AI Analysis</h3>
                          
                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center mb-1">
                                <div className="mr-2 text-sm font-medium">Score:</div>
                                <div className="text-lg font-bold">
                                  {selectedInterview.questions[currentQuestionIndex].aiAnalysis?.score}/10
                                </div>
                              </div>
                              <div className="text-sm">
                                {selectedInterview.questions[currentQuestionIndex].aiAnalysis?.feedback}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Strengths</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {selectedInterview.questions[currentQuestionIndex].aiAnalysis?.strengths.map((strength, i) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">Areas for Improvement</h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {selectedInterview.questions[currentQuestionIndex].aiAnalysis?.weaknesses.map((weakness, i) => (
                                    <li key={i}>{weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {selectedInterview.questions[currentQuestionIndex].aiAnalysis?.improvementSuggestions.map((suggestion, i) => (
                                  <li key={i}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="answer">Your Answer</Label>
                      <div className="flex items-center mb-2 mt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mr-2"
                          onClick={() => setShowMicModal(true)}
                        >
                          <Mic className="h-4 w-4 mr-1" />
                          Record Answer
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Speak your answer or type below
                        </span>
                      </div>
                      <Textarea 
                        id="answer"
                        placeholder="Type your answer here..."
                        className="min-h-[200px]"
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  {interviewComplete ? (
                    <div className="flex w-full justify-between">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (currentQuestionIndex > 0) {
                            setCurrentQuestionIndex(currentQuestionIndex - 1);
                          }
                        }}
                        disabled={currentQuestionIndex === 0}
                      >
                        Previous Question
                      </Button>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          onClick={() => {
                            if (currentQuestionIndex < (selectedInterview?.questions?.length || 0) - 1) {
                              setCurrentQuestionIndex(currentQuestionIndex + 1);
                            }
                          }}
                          disabled={currentQuestionIndex === (selectedInterview?.questions?.length || 0) - 1}
                        >
                          Next Question
                        </Button>
                        <Button onClick={() => {
                          setInterviewInProgress(false);
                          setSelectedInterview(null);
                        }}>
                          Finish Review
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full justify-end">
                      <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === (selectedInterview?.questions?.length || 0) - 1
                          ? "Complete Interview"
                          : "Next Question"
                        }
                      </Button>
                    </div>
                  )}
                </CardFooter>
              </Card>
              
              {interviewComplete && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interview Summary</CardTitle>
                    <CardDescription>
                      Completed on {selectedInterview?.completedAt ? format(selectedInterview.completedAt, "MMMM d, yyyy") : "Today"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">Overall Score</h3>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">{selectedInterview?.score || 0}/10</span>
                          <span className="ml-2 text-muted-foreground">{selectedInterview?.score && selectedInterview.score >= 8 ? "Excellent" : selectedInterview?.score && selectedInterview.score >= 6 ? "Good" : "Needs Improvement"}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-medium mb-2">Feedback</h3>
                        <p className="text-muted-foreground">{selectedInterview?.feedback || "No feedback available"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Practice Interviews</h2>
                <Button onClick={() => toast({
                  title: "Not available in demo mode",
                  description: "This would create a custom mock interview"
                })}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Interview
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockInterviews.map(interview => (
                  <Card key={interview.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <Badge variant={
                          interview.difficulty === "Easy" ? "outline" : 
                          interview.difficulty === "Medium" ? "secondary" :
                          interview.difficulty === "Hard" ? "destructive" : 
                          "default"
                        }>
                          {interview.difficulty}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                          {interview.duration} min
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{interview.title}</CardTitle>
                      <CardDescription>
                        {interview.role}
                        {interview.company && ` • ${interview.company}`}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground mb-4">
                        {interview.questionCount} questions
                      </div>
                      
                      {interview.completedAt && (
                        <div className="flex items-center text-sm mb-4">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                          <span>Completed on {format(interview.completedAt, "MMM d, yyyy")}</span>
                          {interview.score && (
                            <Badge className="ml-2 bg-green-100 text-green-800 hover:bg-green-100">
                              Score: {interview.score}/10
                            </Badge>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleStartMockInterview(interview)}
                      >
                        {interview.completedAt ? "Review Interview" : "Start Interview"}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6">AI-Generated Interview Prep</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="h-5 w-5 mr-2 text-purple-500" />
                        Behavioral Questions
                      </CardTitle>
                      <CardDescription>
                        Leadership, teamwork, conflict resolution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      AI-generated behavioral questions based on the job description and company values.
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => toast({
                        title: "Not available in demo mode",
                        description: "This would generate custom behavioral questions"
                      })}>
                        Generate Questions
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Code className="h-5 w-5 mr-2 text-blue-500" />
                        Technical Assessment
                      </CardTitle>
                      <CardDescription>
                        Coding, system design, technical questions
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Role-specific technical questions with real-time feedback on your answers.
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => toast({
                        title: "Not available in demo mode",
                        description: "This would start a technical assessment"
                      })}>
                        Start Assessment
                      </Button>
                    </CardFooter>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Monitor className="h-5 w-5 mr-2 text-green-500" />
                        Video Interview Practice
                      </CardTitle>
                      <CardDescription>
                        Analyze body language, tone, and content
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-sm text-muted-foreground">
                      Practice interviews with your webcam and get AI feedback on your presentation skills.
                    </CardContent>
                    <CardFooter>
                      <Button variant="outline" className="w-full" onClick={() => toast({
                        title: "Not available in demo mode",
                        description: "This would start a video practice session"
                      })}>
                        Start Video Practice
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="ai-assistant">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="overflow-hidden h-[calc(100vh-300px)]">
                <CardHeader className="pb-3">
                  <CardTitle>Interview AI Assistant</CardTitle>
                  <CardDescription>
                    Get personalized advice for your upcoming interviews
                  </CardDescription>
                </CardHeader>
                <div className="border-t"></div>
                <CardContent className="p-0">
                  <ScrollArea className="h-[calc(100vh-450px)]">
                    <div className="p-4 space-y-6">
                      {aiResponses.length > 0 ? (
                        aiResponses.map((response, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                <p className="text-sm font-medium">{response.question}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(response.timestamp, "MMM d, h:mm a")}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center mr-3">
                                <Brain className="h-4 w-4 text-primary-foreground" />
                              </div>
                              <div className="bg-primary/5 p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                <p className="text-sm whitespace-pre-line">{response.response}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-10">
                          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">AI Assistant</h3>
                          <p className="text-muted-foreground max-w-md mx-auto">
                            Ask questions about interview preparation, get feedback on answers, or request tips for specific interview types.
                          </p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
                <div className="border-t"></div>
                <CardFooter className="p-3">
                  <div className="flex items-center w-full">
                    <Textarea 
                      placeholder="Ask a question about interview preparation..."
                      className="min-h-[60px] resize-none flex-1 mr-2"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAskAI();
                        }
                      }}
                    />
                    <Button 
                      size="icon" 
                      className="h-10 w-10"
                      onClick={handleAskAI}
                      disabled={!aiPrompt.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
            
            <div>
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Popular Questions</CardTitle>
                  <CardDescription>Try asking these questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setAiPrompt("How do I prepare for a behavioral interview?")}
                    >
                      How do I prepare for a behavioral interview?
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setAiPrompt("What are the most common system design interview questions?")}
                    >
                      What are the most common system design interview questions?
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setAiPrompt("How should I answer 'What is your greatest weakness?'")}
                    >
                      How should I answer "What is your greatest weakness?"
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() => setAiPrompt("What questions should I ask the interviewer?")}
                    >
                      What questions should I ask the interviewer?
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Interview Question Analysis</CardTitle>
                  <CardDescription>Get feedback on your answers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="question">Interview Question</Label>
                      <Input 
                        id="question"
                        placeholder="Paste the interview question here..."
                        className="mb-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="answer">Your Answer</Label>
                      <Textarea 
                        id="answer"
                        placeholder="Type or paste your answer here..."
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => toast({
                      title: "Not available in demo mode",
                      description: "This would analyze your answer and provide feedback"
                    })}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Analyze Answer
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Question Modal */}
      <Dialog open={showQuestionModal} onOpenChange={setShowQuestionModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion ? "Interview Question Details" : "Add New Interview Question"}
            </DialogTitle>
            <DialogDescription>
              {selectedQuestion 
                ? "View and edit question details" 
                : "Share a question to help others prepare for interviews"}
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">{selectedQuestion.question}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{selectedQuestion.category}</Badge>
                  <Badge variant={
                    selectedQuestion.difficulty === "Easy" ? "outline" : 
                    selectedQuestion.difficulty === "Medium" ? "secondary" :
                    selectedQuestion.difficulty === "Hard" ? "destructive" : 
                    "default"
                  }>
                    {selectedQuestion.difficulty}
                  </Badge>
                  {selectedQuestion.company && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {selectedQuestion.company}
                    </Badge>
                  )}
                  {selectedQuestion.role && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {selectedQuestion.role}
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Sample Answer</h4>
                {selectedQuestion.answer ? (
                  <div className="p-4 border rounded-md bg-muted">
                    {selectedQuestion.answer}
                  </div>
                ) : (
                  <div className="p-4 border rounded-md bg-muted text-muted-foreground italic">
                    No sample answer provided
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedQuestion.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                  Added {format(selectedQuestion.createdAt, "MMMM d, yyyy")}
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <ThumbsUp className="h-4 w-4 mr-1 text-green-500" />
                    <span>{selectedQuestion.upvotes}</span>
                  </div>
                  <div className="flex items-center">
                    <ThumbsDown className="h-4 w-4 mr-1 text-red-500" />
                    <span>{selectedQuestion.downvotes}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Question *</Label>
                <Textarea 
                  id="question"
                  placeholder="Enter the interview question here..."
                  value={newQuestion.question}
                  onChange={(e) => setNewQuestion({...newQuestion, question: e.target.value})}
                  className="min-h-[100px]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="answer">Sample Answer (Optional)</Label>
                <Textarea 
                  id="answer"
                  placeholder="Share a good answer or approach to this question..."
                  value={newQuestion.answer}
                  onChange={(e) => setNewQuestion({...newQuestion, answer: e.target.value})}
                  className="min-h-[100px]"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newQuestion.category}
                    onValueChange={(value) => setNewQuestion({...newQuestion, category: value})}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Behavioral">Behavioral</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Coding">Coding</SelectItem>
                      <SelectItem value="System Design">System Design</SelectItem>
                      <SelectItem value="Product">Product</SelectItem>
                      <SelectItem value="Leadership">Leadership</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <Select
                    value={newQuestion.difficulty}
                    onValueChange={(value) => setNewQuestion({...newQuestion, difficulty: value as "Easy" | "Medium" | "Hard" | "Expert"})}
                  >
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Easy">Easy</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Hard">Hard</SelectItem>
                      <SelectItem value="Expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="company">Company (Optional)</Label>
                  <Input 
                    id="company"
                    placeholder="e.g. Google, Amazon, etc."
                    value={newQuestion.company}
                    onChange={(e) => setNewQuestion({...newQuestion, company: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role (Optional)</Label>
                  <Input 
                    id="role"
                    placeholder="e.g. Software Engineer, Product Manager, etc."
                    value={newQuestion.role}
                    onChange={(e) => setNewQuestion({...newQuestion, role: e.target.value})}
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input 
                    id="tags"
                    placeholder="e.g. algorithms, leadership, teamwork (comma separated)"
                    value={newQuestion.tags}
                    onChange={(e) => setNewQuestion({...newQuestion, tags: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Separate tags with commas
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 md:col-span-2">
                  <Checkbox 
                    id="isPublic"
                    checked={newQuestion.isPublic}
                    onCheckedChange={(checked) => 
                      setNewQuestion({...newQuestion, isPublic: checked as boolean})
                    }
                  />
                  <Label htmlFor="isPublic">
                    Share with community (make public)
                  </Label>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowQuestionModal(false);
              setSelectedQuestion(null);
              setNewQuestion({
                question: "",
                answer: "",
                category: "Behavioral",
                difficulty: "Medium",
                company: "",
                role: "",
                tags: "",
                isPublic: true
              });
            }}>
              Cancel
            </Button>
            {selectedQuestion ? (
              <Button onClick={() => {
                setShowQuestionModal(false);
                setSelectedQuestion(null);
              }}>
                Close
              </Button>
            ) : (
              <Button onClick={handleCreateQuestion}>
                Add Question
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Recording Modal */}
      <Dialog open={showMicModal} onOpenChange={setShowMicModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Your Answer</DialogTitle>
            <DialogDescription>
              Speak your answer and we'll transcribe it for you
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 relative">
              <Mic className="h-10 w-10 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-ping"></div>
            </div>
            <p className="text-center text-muted-foreground">
              Recording in progress...
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowMicModal(false)}
            >
              Cancel
            </Button>
            <Button onClick={() => {
              setShowMicModal(false);
              
              // Mock transcription
              setUserAnswer(
                userAnswer + 
                (userAnswer ? "\n\n" : "") + 
                "In my previous role, I implemented a caching layer that reduced database load by 30%. I identified that our application was making redundant queries which was causing performance issues during peak hours. After analyzing the access patterns, I implemented a Redis cache with appropriate TTL values based on data volatility. This not only improved response times by 40% but also reduced our infrastructure costs."
              );
              
              toast({
                title: "Answer transcribed",
                description: "Your spoken answer has been added to the text area"
              });
            }}>
              Stop & Transcribe
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}