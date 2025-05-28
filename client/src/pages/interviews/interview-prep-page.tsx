import { useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition.tsx";
import { useInterviewPrep } from "@/hooks/useInterviewPrep";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Users,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";

export default function InterviewPrepPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const { transcript, listening, waveformData, duration, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const {
    questions,
    isLoadingQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    mockInterviews,
    isLoadingMockInterviews,
    createMockInterview,
    updateMockInterview,
    deleteMockInterview,
    aiResponses,
    isLoadingAIResponses,
    createAIResponse,
    deleteAIResponse,
  } = useInterviewPrep();

  // Question management
  const [questionFilter, setQuestionFilter] = useState("");
  const [selectedQuestion, setSelectedQuestion] = useState<typeof questions[0] | null>(null);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    answer: "",
    category: "Behavioral",
    difficulty: "Medium" as "Easy" | "Medium" | "Hard" | "Expert",
    company: "",
    role: "",
    tags: [] as string[],
    isPublic: true,
  });

  // Mock interview management
  const [selectedInterview, setSelectedInterview] = useState<typeof mockInterviews[0] | null>(null);
  const [showInterviewModal, setShowInterviewModal] = useState(false);
  const [interviewInProgress, setInterviewInProgress] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [showMicModal, setShowMicModal] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);

  // AI Interview Assistance
  const [aiPrompt, setAiPrompt] = useState("");

  // Filter questions based on search input
  const filteredQuestions = questionFilter
    ? questions.filter(
        (q) =>
          q.question.toLowerCase().includes(questionFilter.toLowerCase()) ||
          (q.company &&
            q.company.toLowerCase().includes(questionFilter.toLowerCase())) ||
          (q.role &&
            q.role.toLowerCase().includes(questionFilter.toLowerCase())) ||
          q.category.toLowerCase().includes(questionFilter.toLowerCase()) ||
          q.tags.some((tag) =>
            tag.toLowerCase().includes(questionFilter.toLowerCase()),
          ),
      )
    : questions;

  const handleCreateQuestion = async () => {
    try {
      await createQuestion.mutateAsync({
        ...newQuestion,
        tags: newQuestion.tags.filter(Boolean),
        upvotes: 0,
        downvotes: 0,
        userId: 1, // This should come from the authenticated user
      });
      setShowQuestionModal(false);
      setNewQuestion({
        question: "",
        answer: "",
        category: "Behavioral",
        difficulty: "Medium",
        company: "",
        role: "",
        tags: [],
        isPublic: true,
      });
      toast({
        title: "Success",
        description: "Question created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create question",
        variant: "destructive",
      });
    }
  };

  const handleUpdateQuestion = async (id: number, data: Partial<typeof questions[0]>) => {
    try {
      await updateQuestion.mutateAsync({ id, data });
      toast({
        title: "Success",
        description: "Question updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update question",
        variant: "destructive",
      });
    }
  };

  const handleDeleteQuestion = async (id: number) => {
    try {
      await deleteQuestion.mutateAsync(id);
      toast({
        title: "Success",
        description: "Question deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete question",
        variant: "destructive",
      });
    }
  };

  const handleStartMockInterview = (interview: typeof mockInterviews[0]) => {
    setSelectedInterview(interview);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setInterviewInProgress(true);
    setInterviewComplete(false);
  };

  const handleNextQuestion = async () => {
    if (!selectedInterview) return;

    // Save the answer to the current question
    const updatedInterview = { ...selectedInterview };
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
      updatedInterview.feedback =
        "Good answers overall. You demonstrated strong technical knowledge and communication skills. Consider providing more specific examples in behavioral questions.";

      try {
        await updateMockInterview.mutateAsync({
          id: updatedInterview.id,
          data: updatedInterview,
        });

        setSelectedInterview(updatedInterview);
        setInterviewComplete(true);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save interview progress",
          variant: "destructive",
        });
      }
    }
  };

  const handleCreateAIResponse = async () => {
    if (!aiPrompt.trim()) return;

    try {
      await createAIResponse.mutateAsync({
        question: aiPrompt,
        response: "This is a mock AI response. In a real app, this would be generated by an AI model.",
      });
      setAiPrompt("");
      toast({
        title: "Success",
        description: "AI response created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create AI response",
        variant: "destructive",
      });
    }
  };

  const handleStartRecording = () => {
    resetTranscript();
    startListening();
    setShowMicModal(true);
  };

  const handleStopRecording = () => {
    stopListening();
    setShowMicModal(false);
    if (transcript) {
      setUserAnswer(transcript);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
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
            {isLoadingQuestions ? (
              <div className="col-span-2 flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredQuestions.length > 0 ? (
              filteredQuestions.map((question) => (
                <Card key={question.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <Badge
                        variant={
                          question.difficulty === "Easy"
                            ? "outline"
                            : question.difficulty === "Medium"
                              ? "secondary"
                              : question.difficulty === "Hard"
                                ? "destructive"
                                : "default"
                        }
                      >
                        {question.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateQuestion(question.id, { upvotes: question.upvotes + 1 })}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {question.upvotes}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleUpdateQuestion(question.id, { downvotes: question.downvotes + 1 })}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {question.downvotes}
                        </span>
                      </div>
                    </div>
                    <CardTitle className="text-lg mt-2">{question.question}</CardTitle>
                    <CardDescription>
                      {question.category}
                      {question.company && ` • ${question.company}`}
                      {question.role && ` • ${question.role}`}
                    </CardDescription>
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
                      {question.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between border-t pt-4 pb-2">
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
          {isLoadingMockInterviews ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : interviewInProgress ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedInterview?.title}
                  </h2>
                  <p className="text-muted-foreground">
                    Question {currentQuestionIndex + 1} of{" "}
                    {selectedInterview?.questions?.length || 0}
                  </p>
                </div>
                <div className="flex items-center">
                  <Timer className="h-5 w-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {Math.floor(selectedInterview?.duration || 0) /
                      (selectedInterview?.questions?.length || 1)}{" "}
                    minutes per question
                  </span>
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {
                      selectedInterview?.questions[currentQuestionIndex]
                        .question
                    }
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {interviewComplete ? (
                    <div>
                      <div className="mb-4">
                        <Label>Your Answer</Label>
                        <div className="mt-2 p-4 border rounded-md bg-muted">
                          {selectedInterview?.questions[currentQuestionIndex]
                            .answer || "No answer provided"}
                        </div>
                      </div>

                      {selectedInterview?.questions[currentQuestionIndex]
                        .aiAnalysis && (
                        <div>
                          <h3 className="font-medium text-lg mb-2">
                            AI Analysis
                          </h3>

                          <div className="space-y-4">
                            <div>
                              <div className="flex items-center mb-1">
                                <div className="mr-2 text-sm font-medium">
                                  Score:
                                </div>
                                <div className="text-lg font-bold">
                                  {
                                    selectedInterview.questions[
                                      currentQuestionIndex
                                    ].aiAnalysis?.score
                                  }
                                  /10
                                </div>
                              </div>
                              <div className="text-sm">
                                {
                                  selectedInterview.questions[
                                    currentQuestionIndex
                                  ].aiAnalysis?.feedback
                                }
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">
                                  Strengths
                                </h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {selectedInterview.questions[
                                    currentQuestionIndex
                                  ].aiAnalysis?.strengths.map((strength, i) => (
                                    <li key={i}>{strength}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-2">
                                  Areas for Improvement
                                </h4>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                  {selectedInterview.questions[
                                    currentQuestionIndex
                                  ].aiAnalysis?.weaknesses.map(
                                    (weakness, i) => (
                                      <li key={i}>{weakness}</li>
                                    ),
                                  )}
                                </ul>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">
                                Suggestions
                              </h4>
                              <ul className="list-disc list-inside text-sm text-muted-foreground">
                                {selectedInterview.questions[
                                  currentQuestionIndex
                                ].aiAnalysis?.improvementSuggestions.map(
                                  (suggestion, i) => (
                                    <li key={i}>{suggestion}</li>
                                  ),
                                )}
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
                          onClick={handleStartRecording}
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
                            if (
                              currentQuestionIndex <
                              (selectedInterview?.questions?.length || 0) - 1
                            ) {
                              setCurrentQuestionIndex(currentQuestionIndex + 1);
                            }
                          }}
                          disabled={
                            currentQuestionIndex ===
                            (selectedInterview?.questions?.length || 0) - 1
                          }
                        >
                          Next Question
                        </Button>
                        <Button
                          onClick={() => {
                            setInterviewInProgress(false);
                            setSelectedInterview(null);
                          }}
                        >
                          Finish Review
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex w-full justify-end">
                      <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex ===
                        (selectedInterview?.questions?.length || 0) - 1
                          ? "Complete Interview"
                          : "Next Question"}
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
                      Completed on{" "}
                      {selectedInterview?.completedAt
                        ? format(selectedInterview.completedAt, "MMMM d, yyyy")
                        : "Today"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Overall Score
                        </h3>
                        <div className="flex items-baseline">
                          <span className="text-4xl font-bold">
                            {selectedInterview?.score || 0}/10
                          </span>
                          <span className="ml-2 text-muted-foreground">
                            {selectedInterview?.score &&
                            selectedInterview.score >= 8
                              ? "Excellent"
                              : selectedInterview?.score &&
                                  selectedInterview.score >= 6
                                ? "Good"
                                : "Needs Improvement"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-medium mb-2">Feedback</h3>
                        <p className="text-muted-foreground">
                          {selectedInterview?.feedback ||
                            "No feedback available"}
                        </p>
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
                <Button onClick={() => setShowInterviewModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Custom Interview
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockInterviews.length > 0 ? (
                  mockInterviews.map((interview) => (
                    <Card key={interview.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <Badge
                            variant={
                              interview.difficulty === "Easy"
                                ? "outline"
                                : interview.difficulty === "Medium"
                                  ? "secondary"
                                  : interview.difficulty === "Hard"
                                    ? "destructive"
                                    : "default"
                            }
                          >
                            {interview.difficulty}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {interview.duration} min
                          </div>
                        </div>
                        <CardTitle className="text-lg mt-2">
                          {interview.title}
                        </CardTitle>
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
                            <span>
                              Completed on{" "}
                              {format(interview.completedAt, "MMM d, yyyy")}
                            </span>
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
                          {interview.completedAt
                            ? "Review Interview"
                            : "Start Interview"}
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-12">
                    <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mock interviews</h3>
                    <p className="text-muted-foreground">
                      Create your first mock interview to start practicing.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-10">
                <h2 className="text-2xl font-bold mb-6">
                  AI-Generated Interview Prep
                </h2>

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
                      AI-generated behavioral questions based on the job
                      description and company values.
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          toast({
                            title: "Not available in demo mode",
                            description:
                              "This would generate custom behavioral questions",
                          })
                        }
                      >
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
                      Role-specific technical questions with real-time feedback
                      on your answers.
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          toast({
                            title: "Not available in demo mode",
                            description:
                              "This would start a technical assessment",
                          })
                        }
                      >
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
                      Practice interviews with your webcam and get AI feedback
                      on your presentation skills.
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() =>
                          toast({
                            title: "Not available in demo mode",
                            description:
                              "This would start a video practice session",
                          })
                        }
                      >
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
                      {isLoadingAIResponses ? (
                        <div className="flex justify-center items-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                      ) : aiResponses.length > 0 ? (
                        aiResponses.map((response, index) => (
                          <div key={index} className="space-y-3">
                            <div className="flex items-start">
                              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                                <User className="h-4 w-4 text-primary" />
                              </div>
                              <div className="bg-muted p-3 rounded-lg rounded-tl-none max-w-[80%]">
                                <p className="text-sm font-medium">
                                  {response.question}
                                </p>
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
                                <p className="text-sm whitespace-pre-line">
                                  {response.response}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <h3 className="text-lg font-medium mb-2">No AI responses yet</h3>
                          <p className="text-muted-foreground">
                            Ask a question to get started with the AI assistant.
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
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleCreateAIResponse();
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      className="h-10 w-10"
                      onClick={handleCreateAIResponse}
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
                      onClick={() =>
                        setAiPrompt(
                          "How do I prepare for a behavioral interview?",
                        )
                      }
                    >
                      How do I prepare for a behavioral interview?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() =>
                        setAiPrompt(
                          "What are the most common system design interview questions?",
                        )
                      }
                    >
                      What are the most common system design interview
                      questions?
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() =>
                        setAiPrompt(
                          "How should I answer 'What is your greatest weakness?'",
                        )
                      }
                    >
                      How should I answer "What is your greatest weakness?"
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-2"
                      onClick={() =>
                        setAiPrompt(
                          "What questions should I ask the interviewer?",
                        )
                      }
                    >
                      What questions should I ask the interviewer?
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Interview Question Analysis</CardTitle>
                  <CardDescription>
                    Get feedback on your answers
                  </CardDescription>
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
                    onClick={() =>
                      toast({
                        title: "Not available in demo mode",
                        description:
                          "This would analyze your answer and provide feedback",
                      })
                    }
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
              {selectedQuestion
                ? "Interview Question Details"
                : "Add New Interview Question"}
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
                <h3 className="text-lg font-medium">
                  {selectedQuestion.question}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">{selectedQuestion.category}</Badge>
                  <Badge
                    variant={
                      selectedQuestion.difficulty === "Easy"
                        ? "outline"
                        : selectedQuestion.difficulty === "Medium"
                          ? "secondary"
                          : selectedQuestion.difficulty === "Hard"
                            ? "destructive"
                            : "default"
                    }
                  >
                    {selectedQuestion.difficulty}
                  </Badge>
                  {selectedQuestion.company && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {selectedQuestion.company}
                    </Badge>
                  )}
                  {selectedQuestion.role && (
                    <Badge
                      variant="outline"
                      className="bg-green-50 text-green-700 border-green-200"
                    >
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
                  {selectedQuestion.tags.map((tag) => (
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
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, question: e.target.value })
                  }
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
                  onChange={(e) =>
                    setNewQuestion({ ...newQuestion, answer: e.target.value })
                  }
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={newQuestion.category}
                    onValueChange={(value) =>
                      setNewQuestion({ ...newQuestion, category: value })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Behavioral">Behavioral</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Coding">Coding</SelectItem>
                      <SelectItem value="System Design">
                        System Design
                      </SelectItem>
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
                    onValueChange={(value) =>
                      setNewQuestion({
                        ...newQuestion,
                        difficulty: value as
                          | "Easy"
                          | "Medium"
                          | "Hard"
                          | "Expert",
                      })
                    }
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
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        company: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role (Optional)</Label>
                  <Input
                    id="role"
                    placeholder="e.g. Software Engineer, Product Manager, etc."
                    value={newQuestion.role}
                    onChange={(e) =>
                      setNewQuestion({ ...newQuestion, role: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tags">Tags (Optional)</Label>
                  <Input
                    id="tags"
                    placeholder="e.g. algorithms, leadership, teamwork (comma separated)"
                    value={newQuestion.tags.join(", ")}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        tags: e.target.value.split(", ").map((tag) => tag.trim()),
                      })
                    }
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
                      setNewQuestion({
                        ...newQuestion,
                        isPublic: checked as boolean,
                      })
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
            <Button
              variant="outline"
              onClick={() => {
                setShowQuestionModal(false);
                setSelectedQuestion(null);
                setNewQuestion({
                  question: "",
                  answer: "",
                  category: "Behavioral",
                  difficulty: "Medium",
                  company: "",
                  role: "",
                  tags: [],
                  isPublic: true,
                });
              }}
            >
              Cancel
            </Button>
            {selectedQuestion ? (
              <Button
                onClick={() => {
                  setShowQuestionModal(false);
                  setSelectedQuestion(null);
                }}
              >
                Close
              </Button>
            ) : (
              <Button onClick={handleCreateQuestion}>Add Question</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recording Modal */}
      <Dialog open={showMicModal} onOpenChange={setShowMicModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Voice Recording</DialogTitle>
            <DialogDescription>
              Speak your answer clearly. The recording will automatically stop after 2 minutes.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-center">
              <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                {waveformData?.map((value, index) => (
                  <div
                    key={index}
                    className="absolute bottom-0 bg-blue-500"
                    style={{
                      left: `${(index / waveformData.length) * 100}%`,
                      width: `${100 / waveformData.length}%`,
                      height: `${(value / 255) * 100}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center space-x-4">
              <Button
                variant={listening ? "destructive" : "default"}
                onClick={listening ? handleStopRecording : handleStartRecording}
                className="w-24"
              >
                {listening ? "Stop" : "Record"}
              </Button>
              <div className="text-sm text-gray-500">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{transcript || "Your speech will appear here..."}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMicModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStopRecording}>Save Answer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
