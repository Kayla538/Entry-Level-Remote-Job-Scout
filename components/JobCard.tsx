import React from 'react';
import { JobListing } from '../types';
import { ClockIcon, ArrowTopRightOnSquareIcon } from './Icons';

interface JobCardProps {
  job: JobListing;
  index: number;
}

const JobCard: React.FC<JobCardProps> = ({ job, index }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200 dark:border-gray-700 flex flex-col h-full overflow-hidden job-card-animation"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <p className="text-md font-semibold text-slate-700 dark:text-slate-300 pr-4">{job.companyName}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="bg-primary-100 text-primary-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-primary-900/50 dark:text-primary-300">
              Remote
            </div>
            {job.employmentType && (
              <div className="bg-green-100 text-green-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-green-900/50 dark:text-green-300">
                {job.employmentType}
              </div>
            )}
          </div>
        </div>

        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{job.jobTitle}</h3>
        
        <div className="flex items-center text-sm text-slate-500 dark:text-slate-400 mt-3">
          <ClockIcon className="h-4 w-4 mr-1.5" />
          <span>{job.datePosted}</span>
        </div>
        
        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mt-4">
          {job.jobDescription}
        </p>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-gray-800/50 mt-auto">
        <a
          href={job.applyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full text-center px-4 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
        >
          <span>View & Apply</span>
          <ArrowTopRightOnSquareIcon className="h-5 w-5 ml-2" />
        </a>
      </div>
    </div>
  );
};

export default JobCard;