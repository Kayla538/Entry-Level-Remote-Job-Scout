export interface JobLead {
  jobTitle: string;
  companyName: string;
}

export interface JobListing extends JobLead {
  applyUrl: string;
  jobDescription: string;
  datePosted: string;
  employmentType: string;
}

export interface HiringInfo {
  companyName: string;
  hiringInsight: string;
  careersUrl: string;
}

export enum JobCategory {
  AI_TRAINING = 'Train AI / Data Annotation',
  CUSTOMER_SERVICE = 'Customer Service / Support',
  DATA_ENTRY = 'Data Entry',
}