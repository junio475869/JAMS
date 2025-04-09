
import fetch from "node-fetch";
import { JobPlatform } from "../client/src/config/job-platforms";

export async function searchJobs(platform: JobPlatform, params: Record<string, string>) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (platform.apiKeyRequired && platform.apiKeyName) {
    const apiKey = process.env[platform.apiKeyName];
    if (!apiKey) {
      throw new Error(`API key not found for ${platform.name}`);
    }
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  const queryParams = new URLSearchParams(params);
  const response = await fetch(`${platform.baseUrl}?${queryParams}`, { headers });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch jobs from ${platform.name}`);
  }

  const data = await response.json();
  return normalizeJobData(platform.id, data);
}

function normalizeJobData(platformId: string, data: any) {
  switch (platformId) {
    case "adzuna":
      return data.results.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company.display_name,
        location: job.location.display_name,
        salary: job.salary_min ? `${job.salary_min}-${job.salary_max}` : "Not specified",
        url: job.redirect_url,
        platform: "Adzuna"
      }));

    case "remotive":
      return data.jobs.map((job: any) => ({
        id: job.id,
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location,
        salary: job.salary || "Not specified",
        url: job.url,
        platform: "Remotive"
      }));

    case "usajobs":
      return data.SearchResult.SearchResultItems.map((job: any) => ({
        id: job.MatchedObjectId,
        title: job.MatchedObjectDescriptor.PositionTitle,
        company: job.MatchedObjectDescriptor.DepartmentName,
        location: job.MatchedObjectDescriptor.PositionLocationDisplay,
        salary: `${job.MatchedObjectDescriptor.PositionRemuneration[0].MinimumRange}-${job.MatchedObjectDescriptor.PositionRemuneration[0].MaximumRange}`,
        url: job.MatchedObjectDescriptor.PositionURI,
        platform: "USAJobs"
      }));

    default:
      return [];
  }
}
