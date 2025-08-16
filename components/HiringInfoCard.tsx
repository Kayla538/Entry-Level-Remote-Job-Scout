import React from 'react';
import { HiringInfo } from '../types';
import { LightBulbIcon, ArrowTopRightOnSquareIcon } from './Icons';

interface HiringInfoCardProps {
  info: HiringInfo;
  index: number;
}

const HiringInfoCard: React.FC<HiringInfoCardProps> = ({ info, index }) => {
  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-slate-200 dark:border-gray-700 flex flex-col h-full overflow-hidden job-card-animation"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="p-6 flex-grow">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{info.companyName}</h3>
          <div className="flex-shrink-0 bg-amber-100 text-amber-800 text-xs font-bold px-2.5 py-1 rounded-full dark:bg-amber-900/50 dark:text-amber-300">
            Outlook
          </div>
        </div>
        
        <div className="flex items-start text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-4">
          <LightBulbIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0 text-amber-500" />
          <p>
            <strong className="text-slate-700 dark:text-slate-300">Hiring Insight:</strong> {info.hiringInsight}
          </p>
        </div>
      </div>

      <div className="p-4 bg-slate-50 dark:bg-gray-800/50 mt-auto">
        <a
          href={info.careersUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-full text-center px-4 py-2.5 bg-slate-600 text-white font-semibold rounded-lg hover:bg-slate-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 focus:ring-offset-white dark:focus:ring-offset-gray-800"
        >
          <span>Visit Careers Page</span>
          <ArrowTopRightOnSquareIcon className="h-5 w-5 ml-2" />
        </a>
      </div>
    </div>
  );
};

export default HiringInfoCard;
