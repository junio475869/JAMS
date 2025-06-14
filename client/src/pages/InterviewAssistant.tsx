import React, { useState, useEffect, useRef } from "react";
import { useAudioDevices } from "@/hooks/useAudioDevices";
import { useRedis } from "@/hooks/useRedis";
import { useOpenAI } from "@/hooks/useOpenAI";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LiveCaption } from "@/components/live-caption";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useChat } from "@/hooks/useChat";
import { useAI } from "@/hooks/useAI";
import { useInterview } from "@/hooks/useInterview";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Interview } from "@/types/interview";
import { Message } from "@/types/chat";
import { AIResponse } from "@/types/ai";
import { format } from "date-fns";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition.tsx";
import { useVoskRecognition } from "@/hooks/useVoskRecognition";

interface InterviewInfo {
  id: string;
  title: string;
  date: string;
  duration: number;
  type: string;
  status: string;
  candidate: {
    name: string;
    email: string;
  };
  interviewer: {
    name: string;
    email: string;
  };
  observers?: Array<{
    name: string;
    email: string;
  }>;
}

interface Observer {
  name: string;
  email: string;
}

const predefinedQuestions = [
  "Tell me about yourself",
  "What are your strengths?",
  "What are your weaknesses?",
  "Why do you want to work for this company?",
  "Where do you see yourself in 5 years?",
  "Describe a challenging situation you faced at work",
  "What is your greatest achievement?",
];

const aiResponseTabs = ["STAR", "CAR", "Code", "Behavioral", "Technical"];

const InterviewAssistant: React.FC = () => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState("chat");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<string>("");
  const [activeTab, setActiveTab] = useState(aiResponseTabs[0]);
  // const [interviewerTranscript, setInterviewerTranscript] = useState("");
  // const [candidateTranscript, setCandidateTranscript] = useState("");
  const [isInterviewerSpeaking, setIsInterviewerSpeaking] = useState(false);
  const [isCandidateSpeaking, setIsCandidateSpeaking] = useState(false);

  const {
    inputDevices,
    outputDevices,
    selectedCandidateInputDevice,
    // selectedInterviewerInputDevice,
    selectedOutputDevice,
    setSelectedCandidateInputDevice,
    // setSelectedInterviewerInputDevice,
    setSelectedOutputDevice,
    // isCandidateListening,
    // // isInterviewerListening,
    // startCandidateListening,
    // startInterviewerListening,
    // stopCandidateListening,
    // stopInterviewerListening,
    // candidateTranscript: liveCandidateTranscript,
    // interviewerTranscript: liveInterviewerTranscript,
    // onCandidateSilenceThreshold,
    // onInterviewerSilenceThreshold,
    // startScreenShare,
    // stopScreenShare,
  } = useAudioDevices();

  const { messages, addMessage, clearChat } = useChat();
  const { isProcessing, aiResponses, generateResponse } = useAI();
  const { interview, updateInterview } = useInterview();

  const {
    transcript: candidateTranscript,
    listening: isCandidateListening,
    waveformData: candidateWaveformData,
    duration: candidateDuration,
    startListening: startCandidateSpeech,
    stopListening: stopCandidateSpeech,
    resetTranscript: resetCandidateTranscript,
    setTranscript: setCandidateTranscript,
  } = useSpeechRecognition("candidate", {
    onTranscriptionComplete: (text) => {
      if (text) {
        addMessage({
          role: "candidate",
          content: text,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });

  const {
    transcript: interviewerTranscript,
    listening: isInterviewerListening,
    waveformData: interviewerWaveformData,
    duration: interviewerDuration,
    startListening: startInterviewerSpeech,
    stopListening: stopInterviewerSpeech,
    resetTranscript: resetInterviewerTranscript,
    setTranscript: setInterviewerTranscript,
    stream: interviewerStream,
  } = useVoskRecognition({
    onTranscriptionComplete: (text) => {
      if (text) {
        addMessage({
          role: "interviewer",
          content: text,
          timestamp: new Date().toISOString(),
        });
      }
    },
  });

  useEffect(() => {
    if (isInterviewerListening) {
      videoRef.current!.srcObject = interviewerStream;
    } else {
      videoRef.current!.srcObject = null;
    }
  }, [interviewerStream, isInterviewerListening]);

  const handleStartRecording = async () => {
    try {
      // Start each service one by one to better handle errors
      try {
        await startCandidateSpeech();
      } catch (error) {
        console.error("Error starting candidate listening:", error);
        stopCandidateSpeech();
        throw new Error("Failed to start candidate listening");
      }

      try {
        await startInterviewerSpeech();
      } catch (error) {
        console.error("Error starting interviewer listening:", error);
        stopInterviewerSpeech();
        throw new Error("Failed to start interviewer speech");
      }

      setIsCandidateSpeaking(true);
      setIsInterviewerSpeaking(true);
      resetCandidateTranscript();
      resetInterviewerTranscript();
      
      toast({
        title: "Recording started",
        description: "Both microphones are now active",
      });
    } catch (error) {
      console.error("Error starting recording:", error);
      // Clean up any services that might have started
      stopCandidateSpeech();
      stopInterviewerSpeech();
      stopCandidateSpeech();
      stopInterviewerSpeech();
      setIsCandidateSpeaking(false);
      setIsInterviewerSpeaking(false);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start recording. Please check microphone permissions.",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    try {
      // Stop all services in reverse order
      stopInterviewerSpeech();
      stopCandidateSpeech();
      stopInterviewerSpeech();
      stopCandidateSpeech();
      
      // Reset state
      setIsCandidateSpeaking(false);
      setIsInterviewerSpeaking(false);
      resetCandidateTranscript();
      resetInterviewerTranscript();
      
      toast({
        title: "Recording stopped",
        description: "Both microphones are now inactive",
      });
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast({
        title: "Error",
        description: "Failed to stop recording properly. Please refresh the page if issues persist.",
        variant: "destructive",
      });
    }
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    const message: Message = {
      role: "interviewer",
      content: question,
      timestamp: new Date().toISOString(),
    };
    addMessage(message);
  };

  // Update the transcript effects
  useEffect(() => {
    if (isCandidateListening) {
      setCandidateTranscript(candidateTranscript || "Listening...");
    } else {
      resetCandidateTranscript();
    }
  }, [candidateTranscript, isCandidateListening]);

  useEffect(() => {
    if (isInterviewerListening) {
      setInterviewerTranscript(interviewerTranscript || "Listening...");
    } else {
      resetInterviewerTranscript();
    }
  }, [interviewerTranscript, isInterviewerListening]);

  const handleClearChat = async () => {
    clearChat();
    toast({
      title: "Chat cleared",
      description: "All messages have been cleared.",
    });
  };

  // const handleStartScreenShare = async () => {
  //   try {
  //     const stream = await startScreenShare();
  //     setIsScreenSharing(true);
  //     if (videoRef.current && stream) {
  //       videoRef.current.srcObject = stream;
  //     }
  //   } catch (error) {
  //     console.error("Error starting screen share:", error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to start screen share",
  //       variant: "destructive",
  //     });
  //   }
  // };

  // const handleStopScreenShare = () => {
  //   stopScreenShare();
  //   setIsScreenSharing(false);
  //   if (videoRef.current) {
  //     videoRef.current.srcObject = null;
  //   }
  // };

  // Add visualizer component
  const AudioVisualizer = ({
    data,
    color,
  }: {
    data: number[];
    color: string;
  }) => {
    if (!data || data.length === 0) return null;

    return (
      <div className="flex items-center justify-center">
        <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
          {data?.map((value, index) => (
            <div
              key={index}
              className="absolute bottom-0 bg-blue-500"
              style={{
                left: `${(index / data.length) * 100}%`,
                width: `${100 / data.length}%`,
                height: `${(value / 255) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  // Update the Live Captions section
  const LiveCaption = ({
    transcript,
    isListening,
    waveformData,
    duration,
    color,
    className,
  }: {
    transcript: string;
    isListening: boolean;
    waveformData: number[];
    duration: number;
    color: string;
    className?: string;
  }) => {
    return isListening ? (
      <div className={`rounded-lg p-2 border border-gray-200 bg-black bg-opacity-80 ${className}`}>
        <div className="overflow-y-auto max-h-40">
          <span className="text-white">
            {isListening ? transcript : "Not listening"}
          </span>
          {duration > 0 && (
            <span className="text-xs text-gray-500 mt-1 block">
              Duration: {Math.floor(duration / 60)}:
              {(duration % 60).toString().padStart(2, "0")}
            </span>
          )}
        </div>
      </div>
    ) : null;
  };

  return (
    <div className="flex h-screen">
      {/* Left Panel - Interview Info */}
      <div className="w-1/4 p-4 border-r border-gray-200">
        <Card className="h-full p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">Interview Info</h2>
              <div className="space-y-2 pl-4">
                <p>
                  <span className="font-medium">Title:</span> {interview?.title}
                </p>
                <p>
                  <span className="font-medium">Date:</span>
                  {format(new Date(interview?.date || new Date()), "PPP")}
                </p>
                <p>
                  <span className="font-medium">Type:</span> {interview?.type}
                </p>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <Badge>{interview?.status || "Not started"}</Badge>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Listening Status</h2>
              <div className="space-y-2 pl-4">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${isCandidateListening ? "bg-green-500" : "bg-red-500"} rounded-full`}></div>
                  <p className="font-medium">Candidate</p>
                  <p>{interview?.candidate?.name}</p>
                  <p className="text-sm text-gray-500">
                    {interview?.candidate?.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 ${isInterviewerListening ? "bg-green-500" : "bg-red-500"} rounded-full`}></div>
                  <p className="font-medium">Interviewer</p>
                  <p>{interview?.interviewer?.name}</p>
                  <p className="text-sm text-gray-500">
                    {interview?.interviewer?.email}
                  </p>
                </div>
                {interview?.observers && interview?.observers?.length > 0 && (
                  <div>
                    <p className="font-medium">Observers</p>
                    {interview?.observers?.map(
                      (observer: Observer, index: number) => (
                        <div key={index}>
                          <p>{observer.name}</p>
                          <p className="text-sm text-gray-500">
                            {observer.email}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    My Microphone
                  </label>
                  <Select
                    value={selectedCandidateInputDevice}
                    onValueChange={setSelectedCandidateInputDevice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your microphone" />
                    </SelectTrigger>
                    <SelectContent>
                      {inputDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId || "default"}
                        >
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">
                    Speaker
                  </label>
                  <Select
                    value={selectedOutputDevice}
                    onValueChange={setSelectedOutputDevice}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select speaker" />
                    </SelectTrigger>
                    <SelectContent>
                      {outputDevices.map((device) => (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId || "default"}
                        >
                          {device.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="mt-2">
                  <Button
                    onClick={
                      isCandidateSpeaking
                        ? handleStopRecording
                        : handleStartRecording
                    }
                    variant={isCandidateSpeaking ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isCandidateSpeaking ? "Stop Recording" : "Start Recording"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Middle Panel - Chat and Screen Share */}
      <div className="flex-1 flex flex-col">
        {/* Top Section - Screen Share and Live Captions */}
        <div className="h-1/2 p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 gap-4 h-full relative">
            {/* Screen Share */}
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                controls
                className="w-full h-full object-contain"
              />
              {!isInterviewerListening && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                  <p className="text-white">No screen share active</p>
                </div>
              )}
            </div>

            {/* Chat history with candidate and interviewer */}
            <div className="space-y-4 bottom-4 absolute w-1/2 translate-x-1/2 h-full items-center flex flex-col justify-center gap-2 bg-black bg-opacity-80 overflow-y-auto p-4">
              <div className="flex flex-col gap-2 w-full">
              {messages.map((message) => (
                <div key={message.timestamp} className="w-full flex flex-col gap-1 hover:bg-gray-800 p-1 px-2 rounded-lg cursor-pointer" onClick={()=>{
                  addMessage({
                    role: message.role,
                    content: message.content,
                    timestamp: new Date().toISOString(),
                  });
                }}>
                  <div className={`${message.role === "candidate" ? "text-right" : "text-left"}`}>
                    <p className="text-white font-bold">{message.role === "candidate" ? "Candidate" : "Interviewer"}</p>
                  </div>
                  <p className="text-white pl-4">{message.content}</p>
                </div>
              ))}
              </div>
              <LiveCaption
                transcript={candidateTranscript}
                isListening={isCandidateListening}
                waveformData={candidateWaveformData}
                duration={candidateDuration}
                color="#10B981"
                className="ml-6"
              />
              <LiveCaption
                transcript={interviewerTranscript}
                isListening={isInterviewerListening}
                waveformData={interviewerWaveformData}
                duration={interviewerDuration}
                color="#3B82F6"
                className="mr-6"
              />
            </div>
          </div>
        </div>

        {/* Bottom Section - Chat History */}
        <div className="flex-1 p-4">
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList>
              {aiResponseTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {tab}
                </TabsTrigger>
              ))}
            </TabsList>
            {aiResponseTabs.map((tab) => (
              <TabsContent key={tab} value={tab}>
                <ScrollArea className="h-[calc(100vh-200px)]">
                  <div className="p-4">
                    {isProcessing ? (
                      <p className="text-gray-500">Generating response...</p>
                    ) : aiResponses[tab] ? (
                      <p className="text-sm">{aiResponses[tab]}</p>
                    ) : (
                      <p className="text-gray-500">No response yet</p>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Right Panel - Pre-defined and Predicted Questions */}
      <div className="w-1/4 p-4 border-l border-gray-200">
        <Card className="h-full">
          <div className="space-y-4 p-4">
            {/* Predefined Questions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Predefined Questions
              </h2>
              <div className="space-y-2">
                {predefinedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionSelect(question)}
                    className="w-full text-left text-white bg-gray-800 p-3 border border-gray-200 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <span className="text-sm">{question}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Predictive Questions */}
            <div>
              <h2 className="text-lg font-semibold mb-3">
                Predictive Questions
              </h2>
              <div className="space-y-2">
                {/* Add predictive questions here */}
                <div className="text-sm text-gray-400 italic">
                  Based on your responses, we'll suggest relevant questions...
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default InterviewAssistant;
