import { BaseMicroservice } from '../base.service';
import { OpenAI } from 'openai';
import { SpeechClient } from '@google-cloud/speech';

interface InterviewQuestion {
  text: string;
  type: 'behavioral' | 'technical' | 'situational';
  timestamp: number;
}

interface AIResponse {
  answer: string;
  framework: 'STAR' | 'CAR' | 'SOAR';
  keywords: string[];
  confidence: number;
}

export class InterviewService extends BaseMicroservice {
  private openai: OpenAI;
  private speechClient: SpeechClient;
  private activeInterviews: Map<string, InterviewQuestion[]>;

  constructor(app: any, io: any, redis: any) {
    super(app, io, redis);
    this.openai = new OpenAI();
    this.speechClient = new SpeechClient();
    this.activeInterviews = new Map();
  }

  async initialize(): Promise<void> {
    // Initialize WebSocket handlers
    this.io.on('connection', (socket) => {
      socket.on('start_interview', this.handleInterviewStart.bind(this));
      socket.on('question_detected', this.handleQuestionDetected.bind(this));
      socket.on('end_interview', this.handleInterviewEnd.bind(this));
    });

    // Initialize REST endpoints
    this.app.post('/api/interview/analyze', this.handleQuestionAnalysis.bind(this));
    this.app.post('/api/interview/feedback', this.handleInterviewFeedback.bind(this));
  }

  async cleanup(): Promise<void> {
    // Cleanup any active interviews
    this.activeInterviews.clear();
  }

  private async handleInterviewStart(socket: any, data: { userId: string, jobId: string }) {
    const { userId, jobId } = data;
    this.activeInterviews.set(`${userId}-${jobId}`, []);
    
    // Initialize speech recognition
    const request = {
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
      },
      interimResults: false,
    };

    // Start streaming recognition
    const recognizeStream = this.speechClient
      .streamingRecognize(request)
      .on('data', (data) => {
        const question = data.results[0].alternatives[0].transcript;
        this.handleQuestionDetected(socket, { question, userId, jobId });
      })
      .on('error', console.error)
      .on('end', () => {
        console.log('Stream ended');
      });
  }

  private async handleQuestionDetected(socket: any, data: { question: string, userId: string, jobId: string }) {
    const { question, userId, jobId } = data;
    
    // Analyze question type
    const questionType = await this.analyzeQuestionType(question);
    
    // Generate AI response
    const response = await this.generateAIResponse(question, questionType);
    
    // Store question
    const interviewKey = `${userId}-${jobId}`;
    const questions = this.activeInterviews.get(interviewKey) || [];
    questions.push({
      text: question,
      type: questionType,
      timestamp: Date.now()
    });
    this.activeInterviews.set(interviewKey, questions);
    
    // Send response to client
    socket.emit('ai_response', response);
  }

  private async handleInterviewEnd(socket: any, data: { userId: string, jobId: string }) {
    const { userId, jobId } = data;
    const interviewKey = `${userId}-${jobId}`;
    const questions = this.activeInterviews.get(interviewKey) || [];
    
    // Generate interview summary
    const summary = await this.generateInterviewSummary(questions);
    
    // Store interview data
    await this.storeInterviewData(userId, jobId, questions, summary);
    
    // Cleanup
    this.activeInterviews.delete(interviewKey);
    
    // Send summary to client
    socket.emit('interview_summary', summary);
  }

  private async analyzeQuestionType(question: string): Promise<'behavioral' | 'technical' | 'situational'> {
    const prompt = `Analyze this interview question and classify it as either behavioral, technical, or situational: "${question}"`;
    
    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const type = response.choices[0].message.content?.toLowerCase() || 'behavioral';
    return type as 'behavioral' | 'technical' | 'situational';
  }

  private async generateAIResponse(question: string, type: 'behavioral' | 'technical' | 'situational'): Promise<AIResponse> {
    const prompt = `Generate a professional response to this ${type} interview question: "${question}". 
    Use the STAR framework and include relevant keywords.`;

    const response = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    return {
      answer: response.choices[0].message.content || '',
      framework: 'STAR',
      keywords: [], // TODO: Extract keywords from response
      confidence: 0.9
    };
  }

  private async generateInterviewSummary(questions: InterviewQuestion[]): Promise<any> {
    // TODO: Implement interview summary generation
    return {
      totalQuestions: questions.length,
      questionTypes: questions.reduce((acc, q) => {
        acc[q.type] = (acc[q.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      duration: questions[questions.length - 1].timestamp - questions[0].timestamp
    };
  }

  private async storeInterviewData(userId: string, jobId: string, questions: InterviewQuestion[], summary: any): Promise<void> {
    // TODO: Implement interview data storage
    console.log('Storing interview data:', { userId, jobId, questions, summary });
  }

  private async handleQuestionAnalysis(req: any, res: any) {
    // TODO: Implement question analysis endpoint
    res.json({ status: 'not implemented' });
  }

  private async handleInterviewFeedback(req: any, res: any) {
    // TODO: Implement interview feedback endpoint
    res.json({ status: 'not implemented' });
  }
} 