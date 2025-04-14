import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "sk-placeholder" });

// Color format types for application status visualization
export interface StatusColorAnalysis {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  intensity: number; // 0-100 scale for visual intensity
  visualCues: {
    icon?: string;
    description: string;
  };
  explanation: string;
}

export async function generateCoverLetter(
  jobDescription: string,
  resumeContent: string,
  company: string,
  position: string
): Promise<string> {
  try {
    const prompt = `
    I need a professional cover letter for a ${position} position at ${company}.
    
    Job Description:
    ${jobDescription}
    
    ${resumeContent ? `My Resume/CV Details:\n${resumeContent}` : ""}
    
    Please write a cover letter that:
    1. Is personalized to the company and position
    2. Highlights relevant skills and experiences from my resume
    3. Aligns my background with the job requirements
    4. Has a professional tone
    5. Is formatted properly with date, address blocks, greeting, body paragraphs, closing, and signature
    6. Is approximately 300-400 words
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert cover letter writer with experience in professional job applications." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "Unable to generate cover letter. Please try again.";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please check your OpenAI API key or try again later.");
  }
}

export async function analyzeResume(
  resumeContent: string,
  jobDescription: string
): Promise<{ 
  matchScore: number; 
  missingKeywords: string[]; 
  suggestions: string[] 
}> {
  try {
    const prompt = `
    Please analyze this resume against the job description and provide:
    1. A match score from 0-100
    2. A list of important keywords from the job description that are missing from the resume
    3. 3-5 specific suggestions to improve the resume for this job
    
    Resume Content:
    ${resumeContent}
    
    Job Description:
    ${jobDescription}
    
    Format your response as JSON with these fields:
    - matchScore: number (0-100)
    - missingKeywords: array of strings
    - suggestions: array of strings
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert resume analyzer and ATS (Applicant Tracking System) specialist." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      matchScore: analysis.matchScore || 0,
      missingKeywords: analysis.missingKeywords || [],
      suggestions: analysis.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing resume:", error);
    throw new Error("Failed to analyze resume. Please check your OpenAI API key or try again later.");
  }
}

export async function generateInterviewQuestions(
  jobDescription: string,
  position: string,
  company: string
): Promise<string[]> {
  try {
    const prompt = `
    Generate 10 likely interview questions for a ${position} position at ${company}.
    
    Job Description:
    ${jobDescription}
    
    Create a mix of:
    - Technical/skill-based questions
    - Behavioral questions
    - Company-specific questions
    - Role-specific questions
    
    Format your response as a JSON array of strings, with each string being a complete interview question.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert in technical and behavioral interviewing for tech companies." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const questions = JSON.parse(response.choices[0].message.content || "{}");
    return questions.questions || [];
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions. Please check your OpenAI API key or try again later.");
  }
}

export async function generateResponseToQuestion(
  question: string,
  resumeContent: string,
  framework: string = "STAR",
  keywords: string[] = [],
  tone: string = "professional"
): Promise<string> {
  try {
    const prompt = `
    Help me answer this interview question: "${question}"
    
    My resume details:
    ${resumeContent}
    
    Please structure the answer using the ${framework} framework.
    
    Include these keywords if relevant: ${keywords.join(", ")}
    
    Use a ${tone} tone.
    
    The answer should be concise (approximately 250 words) and highlight relevant experience from my resume.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach who helps job candidates prepare compelling answers." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || "Unable to generate response. Please try again.";
  } catch (error) {
    console.error("Error generating interview response:", error);
    throw new Error("Failed to generate interview response. Please check your OpenAI API key or try again later.");
  }
}

export async function analyzeInterviewTranscript(
  transcript: string,
  jobDescription: string,
  position: string
): Promise<{
  feedback: {
    strengths: string[];
    weaknesses: string[];
    overallScore: number;
    communication: number;
    technicalAccuracy: number;
    relevance: number;
  };
  suggestions: string[];
}> {
  try {
    const prompt = `
    Analyze this interview transcript for a ${position} position and provide feedback:
    
    Transcript:
    ${transcript}
    
    Job Description:
    ${jobDescription}
    
    Please analyze the interview responses for:
    1. Communication skills (clarity, conciseness, confidence)
    2. Technical accuracy and depth of answers
    3. Relevance to the position and job description
    4. Overall impression
    
    Provide a JSON response with:
    - feedback: an object containing:
      - strengths: array of 2-4 key strengths demonstrated
      - weaknesses: array of 2-4 areas for improvement
      - overallScore: number from 1-10
      - communication: number from 1-10
      - technicalAccuracy: number from 1-10  
      - relevance: number from 1-10
    - suggestions: array of 3-5 specific suggestions for improvement
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach and feedback specialist." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      feedback: {
        strengths: analysis.feedback?.strengths || [],
        weaknesses: analysis.feedback?.weaknesses || [],
        overallScore: analysis.feedback?.overallScore || 0,
        communication: analysis.feedback?.communication || 0,
        technicalAccuracy: analysis.feedback?.technicalAccuracy || 0,
        relevance: analysis.feedback?.relevance || 0,
      },
      suggestions: analysis.suggestions || []
    };
  } catch (error) {
    console.error("Error analyzing interview transcript:", error);
    throw new Error("Failed to analyze interview. Please check your OpenAI API key or try again later.");
  }
}

export async function generateInterviewFeedback(
  questions: string[],
  answers: string[],
  position: string
): Promise<{
  questionFeedback: {
    questionId: number;
    rating: number;
    feedback: string;
    improvementSuggestion: string;
  }[];
  overallFeedback: {
    strengths: string[];
    areasForImprovement: string[];
    overallRating: number;
  };
}> {
  try {
    // Combine questions and answers for context
    const qaContext = questions.map((q, i) => `Q${i+1}: ${q}\nA${i+1}: ${answers[i] || "No answer provided"}`).join("\n\n");
    
    const prompt = `
    Analyze these interview questions and answers for a ${position} position and provide detailed feedback:
    
    ${qaContext}
    
    Provide a JSON response with:
    1. questionFeedback: an array of objects, each containing:
       - questionId: the 1-based index of the question
       - rating: a score from 1-10
       - feedback: a brief assessment of what was good or needed improvement
       - improvementSuggestion: specific advice on how to improve the answer
    
    2. overallFeedback: an object containing:
       - strengths: an array of 2-3 key strengths demonstrated across all answers
       - areasForImprovement: an array of 2-3 key areas for improvement
       - overallRating: a score from 1-10 representing overall interview performance
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interview coach specializing in providing constructive feedback." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const feedback = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      questionFeedback: feedback.questionFeedback || [],
      overallFeedback: {
        strengths: feedback.overallFeedback?.strengths || [],
        areasForImprovement: feedback.overallFeedback?.areasForImprovement || [],
        overallRating: feedback.overallFeedback?.overallRating || 0
      }
    };
  } catch (error) {
    console.error("Error generating interview feedback:", error);
    throw new Error("Failed to generate feedback. Please check your OpenAI API key or try again later.");
  }
}

export async function createMockInterview(
  position: string,
  company: string,
  level: string = "intermediate",
  focusAreas: string[] = []
): Promise<{
  questions: {
    id: number;
    question: string;
    questionType: string;
    difficulty: string;
    expectedTopics: string[];
  }[];
}> {
  try {
    const prompt = `
    Create a mock interview for a ${position} position at ${company}.
    Experience level: ${level}
    ${focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(", ")}` : ''}
    
    Generate 8 interview questions that would be likely asked in this scenario.
    
    For each question, provide:
    1. question: The full interview question
    2. questionType: The category (technical, behavioral, situational, company-specific)
    3. difficulty: A rating (easy, medium, hard)
    4. expectedTopics: Array of 2-4 key topics/concepts the answer should address
    
    Format as a JSON with a "questions" array containing these question objects.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert technical interviewer who specializes in creating realistic interview scenarios." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const mockInterview = JSON.parse(response.choices[0].message.content || "{}");
    
    // Add IDs to the questions if not present
    const questions = (mockInterview.questions || []).map((q: any, index: number) => ({
      id: index + 1,
      ...q
    }));
    
    return { questions };
  } catch (error) {
    console.error("Error creating mock interview:", error);
    throw new Error("Failed to create mock interview. Please check your OpenAI API key or try again later.");
  }
}

export async function analyzeApplicationStatus(
  application: {
    company: string;
    position: string;
    status: string;
    appliedDate: Date | string | null;
    notes?: string | null;
    description?: string | null;
  },
  statusHistory?: { status: string; date: Date | string | null }[]
): Promise<StatusColorAnalysis> {
  try {
    // Handle null appliedDate
    const appliedDate = application.appliedDate 
      ? (application.appliedDate instanceof Date 
          ? application.appliedDate.toISOString() 
          : new Date(application.appliedDate).toISOString()
        )
      : new Date().toISOString(); // Default to now if null
    
    const historyContext = statusHistory && statusHistory.length > 0
      ? `Status History:\n${statusHistory.map(h => {
          const dateStr = h.date
            ? (h.date instanceof Date 
                ? h.date.toISOString() 
                : new Date(h.date).toISOString()
              )
            : new Date().toISOString();
          return `- ${h.status} (${dateStr})`;
        }).join('\n')}` 
      : '';
    
    const prompt = `
    Analyze this job application and provide an optimized color scheme and visual cues:
    
    Company: ${application.company}
    Position: ${application.position}
    Current Status: ${application.status}
    Applied Date: ${appliedDate}
    Description: ${application.description || 'N/A'}
    Notes: ${application.notes || 'N/A'}
    ${historyContext}
    
    Today's date: ${new Date().toISOString()}
    
    Based on this information, provide a color scheme and visual representation that:
    1. Represents the current status emotionally and informationally
    2. Takes into account the time elapsed since application/last status change
    3. Creates an intuitive visual representation of the application's progress
    
    Provide a JSON response with:
    - backgroundColor: A hex color code for the background (must be dark and suitable for a dark theme)
    - textColor: A hex color code for the text that will be visible on the background
    - borderColor: A hex color code for the border
    - intensity: A number from 0-100 representing visual intensity/urgency
    - visualCues: An object with:
        - icon: A suggested icon name from the Lucide React icon set (optional)
        - description: A brief explanation of the visual representation
    - explanation: A detailed explanation of why these colors were chosen
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { 
          role: "system", 
          content: "You are an expert UI/UX designer specializing in data visualization and color psychology for job application tracking systems."
        },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const analysis = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      backgroundColor: analysis.backgroundColor || "#293141",
      textColor: analysis.textColor || "#ffffff",
      borderColor: analysis.borderColor || "#3e4a61",
      intensity: analysis.intensity || 50,
      visualCues: {
        icon: analysis.visualCues?.icon || undefined,
        description: analysis.visualCues?.description || "Standard application status"
      },
      explanation: analysis.explanation || "Default color scheme applied"
    };
  } catch (error) {
    console.error("Error analyzing application status:", error);
    throw new Error("Failed to analyze application status. Please check your OpenAI API key or try again later.");
  }
}
