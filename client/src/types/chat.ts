export interface Message {
  role: 'assistant' | 'candidate' | 'interviewer';
  content: string;
  timestamp: string;
}

export interface ChatMessage extends Message {
  speaker: string;
} 