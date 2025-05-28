import { db } from "../utils/db.js";
import {
  interviewPrepQuestions,
  mockInterviews,
  aiInterviewResponses,
} from "../models/schema.js";
import { subDays } from "date-fns";

export async function seedInterviewPrepData() {
  try {
    // Clear existing data
    await db.delete(interviewPrepQuestions);
    await db.delete(mockInterviews);
    await db.delete(aiInterviewResponses);

    // Seed interview prep questions
    const mockQuestions = [
      {
        userId: 1,
        question:
          "Tell me about a time when you had to handle a difficult team member.",
        answer:
          "I once had a team member who was consistently missing deadlines. I scheduled a one-on-one meeting to understand their challenges, provided additional resources, and set up regular check-ins. This improved their performance and team morale.",
        category: "Behavioral",
        difficulty: "Medium",
        company: "Google",
        role: "Software Engineer",
        upvotes: 15,
        downvotes: 2,
        tags: ["leadership", "conflict-resolution", "teamwork"],
        isPublic: true,
        createdAt: subDays(new Date(), 30),
      },
      {
        userId: 1,
        question: "How do you handle tight deadlines?",
        answer:
          "I prioritize tasks based on impact and urgency, break down complex projects into manageable chunks, and communicate proactively with stakeholders about progress and potential blockers.",
        category: "Behavioral",
        difficulty: "Easy",
        company: "Microsoft",
        role: "Product Manager",
        upvotes: 12,
        downvotes: 1,
        tags: ["time-management", "communication", "prioritization"],
        isPublic: true,
        createdAt: subDays(new Date(), 25),
      },
      {
        userId: 1,
        question:
          "Explain a complex technical concept to a non-technical person.",
        answer:
          "I would use analogies and real-world examples, avoid jargon, and break down the concept into simpler parts. I'd also use visual aids when possible and check for understanding throughout the explanation.",
        category: "Communication",
        difficulty: "Medium",
        company: "Amazon",
        role: "Technical Lead",
        upvotes: 20,
        downvotes: 3,
        tags: ["communication", "technical", "teaching"],
        isPublic: true,
        createdAt: subDays(new Date(), 20),
      },
      {
        userId: 1,
        question: "How do you stay updated with industry trends?",
        answer:
          "I follow key industry blogs, participate in online communities, attend conferences, take online courses, and network with peers. I also contribute to open-source projects to stay hands-on with new technologies.",
        category: "Professional Development",
        difficulty: "Easy",
        company: "Meta",
        role: "Frontend Developer",
        upvotes: 18,
        downvotes: 2,
        tags: ["learning", "professional-development", "networking"],
        isPublic: true,
        createdAt: subDays(new Date(), 15),
      },
      {
        userId: 1,
        question:
          "Describe a project where you had to make a difficult technical decision.",
        answer:
          "In a recent project, we had to choose between using a new, promising framework or sticking with a stable but older one. I led a proof-of-concept, evaluated trade-offs, and made a data-driven decision that balanced innovation with stability.",
        category: "Technical",
        difficulty: "Hard",
        company: "Apple",
        role: "Senior Developer",
        upvotes: 25,
        downvotes: 4,
        tags: ["technical", "decision-making", "leadership"],
        isPublic: true,
        createdAt: subDays(new Date(), 10),
      },
      {
        userId: 1,
        question: "How do you handle feedback and criticism?",
        answer:
          "I view feedback as an opportunity for growth. I listen actively, ask clarifying questions, and take time to reflect on the feedback. I then create an action plan to address areas for improvement.",
        category: "Behavioral",
        difficulty: "Medium",
        company: "Netflix",
        role: "Engineering Manager",
        upvotes: 22,
        downvotes: 3,
        tags: ["feedback", "growth", "communication"],
        isPublic: true,
        createdAt: subDays(new Date(), 8),
      },
      {
        userId: 1,
        question: "What's your approach to debugging complex issues?",
        answer:
          "I follow a systematic approach: reproduce the issue, gather relevant logs, isolate the problem, test hypotheses, and document the solution. I also use debugging tools and pair programming when needed.",
        category: "Technical",
        difficulty: "Hard",
        company: "Twitter",
        role: "Backend Developer",
        upvotes: 28,
        downvotes: 5,
        tags: ["technical", "problem-solving", "debugging"],
        isPublic: true,
        createdAt: subDays(new Date(), 5),
      },
      {
        userId: 1,
        question: "How do you ensure code quality in your team?",
        answer:
          "I implement code reviews, automated testing, continuous integration, and coding standards. I also encourage pair programming and regular refactoring sessions to maintain code quality.",
        category: "Technical",
        difficulty: "Medium",
        company: "LinkedIn",
        role: "Tech Lead",
        upvotes: 30,
        downvotes: 4,
        tags: ["technical", "leadership", "quality"],
        isPublic: true,
        createdAt: subDays(new Date(), 3),
      },
    ];
    mockQuestions.map((q) => ({
      ...q,
      tags: `{${q.tags.join(",")}}`, // convert to PostgreSQL array literal
    }));
    await db.insert(interviewPrepQuestions).values(mockQuestions);

    // Seed mock interviews
    const mockInterviewsData = [
      {
        userId: 1,
        title: "Senior Software Engineer Interview",
        role: "Senior Software Engineer",
        company: "Google",
        duration: 60,
        questionCount: 5,
        difficulty: "Hard",
        createdAt: subDays(new Date(), 7),
        questions: [
          {
            id: "1",
            question: "Design a scalable notification system",
            answer:
              "I would use a message queue system like Kafka, implement rate limiting, and use a distributed cache for user preferences.",
            aiAnalysis: {
              score: 85,
              feedback: "Good understanding of distributed systems",
              strengths: [
                "Architecture knowledge",
                "Scalability consideration",
              ],
              weaknesses: ["Could elaborate more on failure handling"],
              improvementSuggestions: [
                "Add more details about monitoring and alerting",
              ],
            },
          },
        ],
      },
      {
        userId: 1,
        title: "Product Manager Interview",
        role: "Product Manager",
        company: "Microsoft",
        duration: 45,
        questionCount: 4,
        difficulty: "Medium",
        createdAt: subDays(new Date(), 5),
        questions: [
          {
            id: "1",
            question: "How would you prioritize features for a new product?",
            answer:
              "I would use a framework like RICE (Reach, Impact, Confidence, Effort) and gather input from stakeholders.",
            aiAnalysis: {
              score: 90,
              feedback: "Excellent use of prioritization framework",
              strengths: ["Structured thinking", "Stakeholder consideration"],
              weaknesses: ["Could include more data-driven aspects"],
              improvementSuggestions: ["Add metrics for measuring success"],
            },
          },
        ],
      },
      {
        userId: 1,
        title: "Frontend Developer Interview",
        role: "Frontend Developer",
        company: "Meta",
        duration: 30,
        questionCount: 3,
        difficulty: "Easy",
        createdAt: subDays(new Date(), 2),
        questions: [
          {
            id: "1",
            question: "Explain React hooks and their benefits",
            answer:
              "Hooks allow functional components to use state and lifecycle features, making code more reusable and easier to test.",
            aiAnalysis: {
              score: 95,
              feedback: "Clear and concise explanation",
              strengths: ["Technical accuracy", "Practical understanding"],
              weaknesses: ["Could mention more specific use cases"],
              improvementSuggestions: ["Add examples of custom hooks"],
            },
          },
        ],
      },
    ];

    await db.insert(mockInterviews).values(mockInterviewsData);

    // Seed AI responses
    const aiResponses = [
      {
        userId: 1,
        question: "What are your greatest strengths?",
        response:
          "My greatest strengths include strong problem-solving abilities, effective communication skills, and a proven track record of delivering high-quality work under pressure. I'm also highly adaptable and continuously seek to learn and grow.",
        timestamp: subDays(new Date(), 1),
      },
      {
        userId: 1,
        question: "Where do you see yourself in 5 years?",
        response:
          "In 5 years, I aim to have grown into a leadership role while maintaining hands-on technical expertise. I want to have led significant projects, mentored junior team members, and contributed to the company's technical strategy.",
        timestamp: subDays(new Date(), 1),
      },
    ];

    await db.insert(aiInterviewResponses).values(aiResponses);

    console.log("Successfully seeded interview prep data");
  } catch (error) {
    console.error("Error seeding interview prep data:", error);
    throw error;
  }
}

// Run the seed function
seedInterviewPrepData()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
