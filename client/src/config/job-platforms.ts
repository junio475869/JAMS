import { z } from "zod";

export type JobPlatform = {
  id: string;
  name: string;
  baseUrl: string;
  apiKeyRequired: boolean;
  apiKeyName?: string;
  searchParams: {
    name: string;
    label: string;
    type: "text" | "select";
    options?: string[];
  }[];
};

export const jobPlatformSchema = z.object({
  id: z.string(),
  name: z.string(),
  baseUrl: z.string(),
  apiKeyRequired: z.boolean(),
  apiKeyName: z.string().optional(),
  searchParams: z.array(
    z.object({
      name: z.string(),
      label: z.string(),
      type: z.string(),
      required: z.boolean(),
      options: z.array(z.string()).optional(),
    }),
  ),
});

export const JOB_PLATFORMS: JobPlatform[] = [
  {
    id: "remoteok",
    name: "RemoteOK",
    baseUrl: "https://remoteok.io/api",
    apiKeyRequired: false,
    searchParams: [
      { name: "search", label: "Search", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false },
    ],
  },
  {
    id: "arbeitnow",
    name: "Arbeitnow",
    baseUrl: "https://www.arbeitnow.com/api/job-board-api",
    apiKeyRequired: false,
    searchParams: [
      { name: "search", label: "Search", type: "text", required: true },
      { name: "category", label: "Category", type: "text", required: false },
    ],
  },
  {
    id: "openskills",
    name: "OpenSkills",
    baseUrl: "https://api.openskills.co/v1/jobs",
    apiKeyRequired: true,
    apiKeyName: "OPENSKILLS_API_KEY",
    searchParams: [
      { name: "search", label: "Keywords", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false },
    ],
  },
  {
    id: "adzuna",
    name: "Adzuna",
    baseUrl: "https://api.adzuna.com/v1/api/jobs",
    apiKeyRequired: true,
    apiKeyName: "ADZUNA_API_KEY",
    searchParams: [
      { name: "what", label: "Keywords", type: "text", required: true },
      { name: "where", label: "Location", type: "text", required: false },
      {
        name: "country",
        label: "Country",
        type: "select",
        required: true,
        options: ["us", "uk", "au", "de", "fr"],
      },
    ],
  },
  {
    id: "remotive",
    name: "Remotive",
    baseUrl: "https://remotive.com/api/remote-jobs",
    apiKeyRequired: false,
    searchParams: [
      {
        name: "category",
        label: "Category",
        type: "select",
        options: ["software-dev", "customer-service", "design", "marketing", "sales", "product"],
      },
      {
        name: "company_name",
        label: "Company",
        type: "text",
      },
      {
        name: "search",
        label: "Search",
        type: "text",
      },
      {
        name: "limit",
        label: "Limit Results",
        type: "text",
      },
    ],
  },
  {
    id: "usajobs",
    name: "USAJobs",
    baseUrl: "https://data.usajobs.gov/api/search",
    apiKeyRequired: true,
    apiKeyName: "USAJOBS_API_KEY",
    searchParams: [
      { name: "keyword", label: "Keywords", type: "text", required: true },
      { name: "location", label: "Location", type: "text", required: false },
      {
        name: "grade",
        label: "Grade Level",
        type: "select",
        required: false,
        options: ["5", "7", "9", "11", "12", "13", "14", "15"],
      },
    ],
  },
];