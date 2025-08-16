import React from 'react';
import { CalendarDaysIcon } from './Icons';
import { SIMULATION_YEAR } from '../constants';

interface StartDateSelectorProps {
  targetMonth: string;
  targetYear: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

const generateYearOptions = () => {
  return [SIMULATION_YEAR];
};

const StartDateSelector: React.FC<StartDateSelectorProps> = ({ 
  targetMonth, 
  targetYear, 
  onMonthChange, 
  onYearChange 
}) => {
  const yearOptions = generateYearOptions();

  return (
    <div className="mt-6">
      <label className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
        <CalendarDaysIcon className="h-5 w-5 mr-2 text-slate-400" />
        Target Start Date <span className="ml-1 text-red-600 dark:text-red-400 font-semibold">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start-month" className="sr-only">Month</label>
          <select
            id="start-month"
            value={targetMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="" disabled>Select Month</option>
            {MONTHS.map((month) => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="start-year" className="sr-only">Year</label>
          <select
            id="start-year"
            value={targetYear}
            onChange={(e) => onYearChange(e.target.value)}
            required
            className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 transition-colors"
          >
            <option value="" disabled>Select Year</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default StartDateSelector;