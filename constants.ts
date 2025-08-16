import { JobCategory } from './types';

export const JOB_CATEGORIES: JobCategory[] = [
  JobCategory.AI_TRAINING,
  JobCategory.CUSTOMER_SERVICE,
  JobCategory.DATA_ENTRY,
];

// The simulated "current" date for the entire application to ensure consistency.
export const SIMULATION_DATE = new Date('2025-08-14T12:00:00Z');
export const SIMULATION_YEAR = SIMULATION_DATE.getFullYear();