
import { GoogleGenAI, Type } from "@google/genai";
import { JobListing, JobLead, JobCategory, HiringInfo } from '../types';
import { SIMULATION_DATE } from "../constants";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const leadGenerationSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            jobTitle: {
                type: Type.STRING,
                description: "The title of the job."
            },
            companyName: {
                type: Type.STRING,
                description: "The name of the company hiring."
            },
        },
        required: ["jobTitle", "companyName"],
    },
};

export const findJobLeads = async (categories: JobCategory[], keyword: string, targetMonth: string, targetYear: string): Promise<JobLead[]> => {
    let searchInstruction = '';
    const today = SIMULATION_DATE.toDateString();

    if (categories.length > 0 && keyword.trim()) {
        searchInstruction = `Search for job titles at companies hiring in the categories "${categories.join('", "')}" that also match the keyword "${keyword}".`;
    } else if (categories.length > 0) {
        searchInstruction = `Search for job titles at companies hiring in the categories "${categories.join('", "')}".`;
    } else if (keyword.trim()) {
        searchInstruction = `Search for job titles at companies hiring for roles matching the keyword "${keyword}".`;
    } else {
        return [];
    }
    
    const now = new Date(); // Use real time for cache busting
    const prompt = `
      Act as an expert job-scouting assistant. For context, today's date is ${today}.
      This is a unique request sent at ${now.toISOString()} with nonce ${Math.random()}. You MUST perform a new search and not use cached results.
      Your first task is to find a list of 15 to 17 potential, entry-level, fully remote job opportunities available to candidates in the United States.
      These can include full-time employee roles, W-2 contract roles, and independent contractor (1099/freelance) positions.
      The desired start date is around ${targetMonth} ${targetYear}.
      
      Use your search tools to find job postings that are as recent as possible. Focus on extreme freshness—prioritize jobs posted within the past week, and ideally within the last 24-48 hours. Your goal is to identify active, recent opportunities.

      ${searchInstruction}
      
      CRITICAL INSTRUCTIONS:
      1.  Your ONLY task is to identify potential job titles and the companies that hire for them based on VERY RECENT postings.
      2.  DO NOT search for application URLs, job descriptions, or posting dates at this stage.
      3.  The jobs MUST be entry-level and 100% remote for US residents.
      4.  Return a list of company/job title pairs in the specified JSON format.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: leadGenerationSchema,
                temperature: 0.7,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedLeads: JobLead[] = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedLeads)) {
            console.warn("Lead generation did not return a valid array:", parsedLeads);
            return [];
        }

        return parsedLeads.filter(lead => lead.jobTitle && lead.companyName);

    } catch (error) {
        console.error("Error fetching job leads from Gemini API:", error);
        throw new Error("Failed to generate job leads.");
    }
};

export const verifyAndEnrichLead = async (lead: JobLead): Promise<JobListing | null> => {
    const today = SIMULATION_DATE.toDateString();
    const now = new Date(); // Use real time for cache busting
    const prompt = `
      Act as a meticulous job verification expert. For context, today's date is ${today}. 
      This is a unique request sent at ${now.toISOString()} with nonce ${Math.random()}. You MUST perform a new search and not use cached results.
      Your mission is to find a live, active, and publicly accessible application URL for the job lead provided.

      Job Lead:
      - Job Title: "${lead.jobTitle}"
      - Company: "${lead.companyName}"

      **Verification Protocol:**
      1.  **Search:** Use your search tools to locate the specific job posting on the company's official careers page or a major, reputable job board (like LinkedIn, Indeed, Greenhouse, Lever). Prioritize the most recently posted version of this job.
      2.  **Verify Liveness:** Before you conclude, you MUST confirm the URL is a direct link to an ACTIVE job posting. A live page will show the job description and an application button. If the page says "Job no longer available," "This position has been filled," or shows a 404 error, the link is DEAD.
      3.  **URL Quality Control:** The URL must be the final destination.
          -   **DO NOT** return internal search result URLs (e.g., links starting with \`https://www.google.com/search?q=...\`).
          -   **DO NOT** return links to a list of jobs; it must be the link to the specific job.
          -   **DO NOT** return a URL that requires a login just to view the job description.

      **Output Format:**

      *   **If you find a valid, live application page:**
          Return ONLY a single, clean JSON object with these exact keys. No extra text or markdown.
          -   "applyUrl": The direct, live URL to the job application page.
          -   "jobDescription": A concise summary of the job's core responsibilities and qualifications.
          -   "datePosted": How long ago the job was posted (e.g., "Posted 2 days ago"). If a date is not available, use "Recently posted".
          -   "employmentType": The type of employment. Analyze the job description for terms like 'full-time', 'contract', 'freelance', '1099', 'W2'. Use one of these specific values: "Full-Time", "Contract", "Freelance". If it's unclear, default to "Full-Time".
          
          Example: \`{"applyUrl":"https://jobs.lever.co/company/123","jobDescription":"Responsible for data entry...","datePosted":"Posted 2 days ago","employmentType":"Contract"}\`

      *   **If you CANNOT find a live, valid link after searching:**
          If all links are dead, expired, or you cannot confidently verify an active posting, you MUST return ONLY the string "UNAVAILABLE".
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              tools: [{googleSearch: {}}],
              temperature: 0.1, // Lower temperature for more deterministic, fact-based responses
            },
        });

        if (!response?.text) {
            console.log(`Verification failed for "${lead.jobTitle}": No text response from API. Possibly blocked or empty.`);
            return null;
        }
        
        const text = response.text.trim();

        if (text === 'UNAVAILABLE' || !text.startsWith('{') || text === '{}') {
            console.log(`Verification failed for "${lead.jobTitle}": Marked as UNAVAILABLE or invalid response.`);
            return null;
        }

        try {
            const enrichedData: Omit<JobListing, 'jobTitle' | 'companyName'> = JSON.parse(text);
            
            if (!enrichedData.applyUrl || !enrichedData.jobDescription || !enrichedData.datePosted || !enrichedData.employmentType) {
                console.log(`Verification failed for "${lead.jobTitle}": Parsed JSON is missing required fields.`);
                return null;
            }

            // A final sanity check on the URL format
            if (!enrichedData.applyUrl.startsWith('http')) {
                console.log(`Verification failed for "${lead.jobTitle}": Invalid URL format.`);
                return null;
            }

            // Added sanity check to prevent the AI from returning search engine result links.
            const forbiddenDomains = ['google.com/search', 'bing.com/search'];
            if (forbiddenDomains.some(domain => enrichedData.applyUrl.includes(domain))) {
                console.log(`Verification failed for "${lead.jobTitle}": URL is a search result page.`);
                return null;
            }

            const finalJob: JobListing = {
                ...lead,
                ...enrichedData
            };
            return finalJob;

        } catch (e) {
            console.error(`Failed to parse JSON from verification step for "${lead.jobTitle}". Response text: "${text}"`, e);
            return null;
        }

    } catch (error) {
        console.error(`Error verifying lead "${lead.jobTitle}" at ${lead.companyName}:`, error);
        return null;
    }
};

export const findHiringInformation = async (categories: JobCategory[], keyword: string, targetMonth: string, targetYear: string): Promise<HiringInfo[]> => {
    let searchInstruction = '';
    const today = SIMULATION_DATE.toDateString();
    if (categories.length > 0 && keyword.trim()) {
        searchInstruction = `roles in the categories "${categories.join('", "')}" that also match the keyword "${keyword}"`;
    } else if (categories.length > 0) {
        searchInstruction = `roles in the categories "${categories.join('", "')}"`;
    } else if (keyword.trim()) {
        searchInstruction = `roles matching the keyword "${keyword}"`;
    } else {
        return [];
    }

    const prompt = `
      Act as a strategic career advisor. For context, today's date is ${today}. The user wants to find a job starting in the distant future (${targetMonth} ${targetYear}).
      It is IMPOSSIBLE to find specific, active job postings this far in advance.
      Instead, your task is to use Google Search to identify COMPANIES that are likely to hire for these roles in the future.

      Search for companies that regularly hire for entry-level, fully remote roles in the US for ${searchInstruction}. Include companies that hire full-time employees, W-2 contractors, and 1099 freelancers.

      For each company you identify, find:
      1.  The company's name.
      2.  A helpful "hiringInsight": A piece of advice about their hiring patterns (e.g., "Frequently posts new full-time roles in the fall," or "Known for using 1099 contractors for project-based work.").
      3.  The main "careersUrl": The URL to their main careers or jobs page.

      CRITICAL INSTRUCTIONS:
      - You MUST use Google Search to find this information.
      - DO NOT look for individual job application links.
      - Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, explanations, or markdown formatting like \`\`\`json.
      - Each object in the array must have these exact keys: "companyName", "hiringInsight", "careersUrl".
      - Return up to 10 company profiles.

      Example of the required output format:
      [
        {
          "companyName": "Example Corp",
          "hiringInsight": "Often hires for data entry roles quarterly. Check their careers page around September.",
          "careersUrl": "https://example.com/careers"
        },
        {
          "companyName": "Innovate Inc",
          "hiringInsight": "Known for seasonal customer service hiring ahead of the holiday season.",
          "careersUrl": "https://innovate.inc/jobs"
        }
      ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.2,
                tools: [{googleSearch: {}}],
            },
        });
        
        const text = response.text.trim();
        const jsonText = text.replace(/^```json\s*/, '').replace(/```$/, '');

        const parsedInfo: HiringInfo[] = JSON.parse(jsonText);
        
        if (!Array.isArray(parsedInfo)) {
            console.warn("Hiring info generation did not return a valid array:", parsedInfo);
            return [];
        }

        return parsedInfo.filter(info => 
            info &&
            info.companyName && 
            info.hiringInsight && 
            info.careersUrl &&
            info.careersUrl.startsWith('http')
        );

    } catch (error) {
        console.error("Error fetching or parsing hiring information from Gemini API:", error, "Response text:", (error as any)?.response?.text?.() || "N/A");
        throw new Error("Failed to generate hiring information.");
    }
};