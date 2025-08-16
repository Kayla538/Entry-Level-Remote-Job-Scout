
import React, { useState, useCallback } from 'react';
import { JobListing, JobCategory, JobLead, HiringInfo } from './types';
import { JOB_CATEGORIES, SIMULATION_DATE } from './constants';
import { findJobLeads, verifyAndEnrichLead, findHiringInformation } from './services/geminiService';
import Header from './components/Header';
import CategorySelector from './components/CategorySelector';
import JobCard from './components/JobCard';
import HiringInfoCard from './components/HiringInfoCard';
import LoadingSpinner from './components/LoadingSpinner';
import StartDateSelector from './components/StartDateSelector';
import { BriefcaseIcon, BrainCircuitIcon, HeadsetIcon, GlobeAltIcon, HomeModernIcon, AcademicCapIcon, SearchIcon, CalendarDaysIcon, InboxIcon } from './components/Icons';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const App: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<JobCategory[]>([]);
  const [keyword, setKeyword] = useState<string>('');
  const [targetMonth, setTargetMonth] = useState<string>('');
  const [targetYear, setTargetYear] = useState<string>('');
  const [jobListings, setJobListings] = useState<JobListing[]>([]);
  const [hiringInfoListings, setHiringInfoListings] = useState<HiringInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [lastSearch, setLastSearch] = useState({ categories: [] as JobCategory[], keyword: '', month: '', year: '' });


  const handleCategoryChange = useCallback((category: JobCategory, isChecked: boolean) => {
    setSelectedCategories(prev =>
      isChecked ? [...prev, category] : prev.filter(c => c !== category)
    );
  }, []);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(e.target.value);
  };


  const handleFindJobs = useCallback(async () => {
    if ((selectedCategories.length === 0 && keyword.trim() === '') || !targetMonth || !targetYear) {
        setError('Please select a category or enter a keyword, and provide a full target start date.');
        return;
    }

    setIsLoading(true);
    setError(null);
    setSearched(true);
    setJobListings([]);
    setHiringInfoListings([]);
    setLastSearch({ categories: selectedCategories, keyword, month: targetMonth, year: targetYear });
    
    // Simulate the "current" date to match the context given to the AI.
    const now = SIMULATION_DATE;
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const targetDate = new Date(parseInt(targetYear), MONTHS.indexOf(targetMonth));
    const monthDiff = (targetDate.getFullYear() - currentYear) * 12 + (targetDate.getMonth() - currentMonth);
    const isFutureSearch = monthDiff > 4; // Use hiring outlook for dates > 4 months away

    try {
      if (isFutureSearch) {
        setLoadingMessage('Researching future hiring trends...');
        const info = await findHiringInformation(selectedCategories, keyword, targetMonth, targetYear);
        setHiringInfoListings(info);

      } else {
        // Step 1: Find Leads for near-term search
        setLoadingMessage('Finding potential job opportunities...');
        const leads = await findJobLeads(selectedCategories, keyword, targetMonth, targetYear);

        const MAX_JOBS_TO_FIND = 10;
        let verifiedJobs: JobListing[] = [];

        if (leads.length > 0) {
            // Step 2: Verify and Enrich Leads
            setLoadingMessage(`Found ${leads.length} leads. Verifying to find up to ${MAX_JOBS_TO_FIND} active jobs...`);
            
            let leadsProcessed = 0;
            for (const lead of leads) {
                if (verifiedJobs.length >= MAX_JOBS_TO_FIND) {
                    break; // Stop if we have found our quota of jobs
                }

                leadsProcessed++;
                setLoadingMessage(`Verifying lead ${leadsProcessed} of ${leads.length}... Found ${verifiedJobs.length}/${MAX_JOBS_TO_FIND} jobs.`);

                const finalJob = await verifyAndEnrichLead(lead);

                if (finalJob) {
                    const forbiddenKeywords = ['hybrid', 'on-site', 'in-office'];
                    const isTrulyRemote = (job: JobListing): boolean => {
                        const combinedText = `${job.jobTitle.toLowerCase()} ${job.jobDescription.toLowerCase()}`;
                        return !forbiddenKeywords.some(keyword => combinedText.includes(keyword));
                    };

                    if (isTrulyRemote(finalJob)) {
                        verifiedJobs.push(finalJob);
                        // Update message immediately upon finding a job
                        setLoadingMessage(`Verifying lead ${leadsProcessed} of ${leads.length}... Found ${verifiedJobs.length}/${MAX_JOBS_TO_FIND} jobs.`);
                    }
                }
            }
        }
        
        // Step 3: Check results and decide what to display
        if (verifiedJobs.length > 0) {
            setJobListings(verifiedJobs);
        } else {
            // Fallback mechanism
            const message = leads.length > 0 
                ? 'No active jobs verified. Researching hiring outlooks instead...' 
                : 'No job leads found. Researching hiring outlooks instead...';
            setLoadingMessage(message);
            const info = await findHiringInformation(selectedCategories, keyword, targetMonth, targetYear);
            setHiringInfoListings(info);
        }
      }

    } catch (err) {
      console.error(err);
      setError('An unexpected error occurred during the search. Some results may be incomplete. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [selectedCategories, keyword, targetMonth, targetYear]);

  const getCategoryIcon = (category: JobCategory) => {
    switch (category) {
      case JobCategory.AI_TRAINING:
        return <BrainCircuitIcon className="h-6 w-6" />;
      case JobCategory.CUSTOMER_SERVICE:
        return <HeadsetIcon className="h-6 w-6" />;
      case JobCategory.DATA_ENTRY:
        return <BriefcaseIcon className="h-6 w-6" />;
      default:
        return null;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="text-center p-10">
          <LoadingSpinner />
          <p className="text-lg text-slate-600 dark:text-slate-300 mt-4">{loadingMessage}</p>
        </div>
      );
    }

    if (error) {
      return <div className="text-center p-10 text-red-500 bg-red-100 dark:bg-red-900/20 rounded-lg">{error}</div>;
    }
    
    if (searched && jobListings.length === 0 && hiringInfoListings.length === 0) {
        const searchTerms = [
            lastSearch.categories.length > 0 ? `"${lastSearch.categories.join(', ')}"` : '',
            lastSearch.keyword.trim() ? `keyword "${lastSearch.keyword}"` : ''
        ].filter(Boolean).join(' and ');
        
        return (
            <div className="text-center py-16 px-6 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600">
                <InboxIcon className="mx-auto h-12 w-12 text-slate-400" />
                <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-white">No Verified Results</h3>
                <p className="mt-2 text-base text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                   We couldn't find any active jobs or hiring information for {searchTerms} with a start date around {lastSearch.month} {lastSearch.year}. Try other terms or check back later!
                </p>
            </div>
        );
    }

    if (hiringInfoListings.length > 0) {
      return (
        <>
          <div className="text-center mb-8 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
              <h3 className="text-lg font-semibold text-primary-800 dark:text-primary-200">Future Hiring Outlook</h3>
              <p className="text-sm text-primary-700 dark:text-primary-300 mt-1">Your start date is far in the future, so we've found companies known for hiring in these roles. Check their career pages closer to your target date.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hiringInfoListings.map((info, index) => (
              <HiringInfoCard key={`${info.companyName}-${index}`} info={info} index={index} />
            ))}
          </div>
        </>
      );
    }

    if (jobListings.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {jobListings.map((job, index) => (
            <JobCard key={`${job.companyName}-${job.jobTitle}-${index}`} job={job} index={index} />
          ))}
        </div>
      );
    }
    
    return (
        <div className="text-center py-16 px-6 bg-white dark:bg-gray-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-gray-600">
            <BriefcaseIcon className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-xl font-semibold text-slate-800 dark:text-white">Start Your Job Search</h3>
            <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
                Choose a category, add a keyword, or set your start date to find opportunities.
            </p>
        </div>
    );
  };
  
  const canSearch = (selectedCategories.length > 0 || keyword.trim() !== '') && !!targetMonth && !!targetYear;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg border border-slate-200 dark:border-gray-700 mb-8">
            <div className="mb-6 pb-6 border-b border-slate-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4">Fixed Search Parameters</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-full">
                      <HomeModernIcon className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
                      <strong>Workplace:</strong><span className="ml-1.5">Remote Only</span>
                  </div>
                  <div className="flex items-center bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-full">
                      <GlobeAltIcon className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
                      <strong>Location:</strong><span className="ml-1.5">Hiring in the United States</span>
                  </div>
                  <div className="flex items-center bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 py-1.5 px-3 rounded-full">
                      <AcademicCapIcon className="h-5 w-5 mr-2 text-slate-500 dark:text-slate-400" />
                      <strong>Experience:</strong><span className="ml-1.5">Entry-Level / No Experience</span>
                  </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-100 mb-4">Select Job Categories</h2>
                <CategorySelector
                  categories={JOB_CATEGORIES}
                  selectedCategories={selectedCategories}
                  onCategoryChange={handleCategoryChange}
                  getCategoryIcon={getCategoryIcon}
                />
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-gray-700">
                  <h2 className="text-xl md:text-2xl font-bold text-slate-700 dark:text-slate-100 mb-4">Refine Search Criteria</h2>
                  <div>
                      <label htmlFor="keyword-search" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                          Keyword (optional)
                      </label>
                      <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                              <SearchIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                              type="text"
                              id="keyword-search"
                              value={keyword}
                              onChange={handleKeywordChange}
                              placeholder="e.g., sales, virtual assistant..."
                              className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                          />
                      </div>
                  </div>

                  <StartDateSelector
                    targetMonth={targetMonth}
                    targetYear={targetYear}
                    onMonthChange={setTargetMonth}
                    onYearChange={setTargetYear}
                  />
              </div>
            </div>
            
            <button
              onClick={handleFindJobs}
              disabled={isLoading || !canSearch}
              className="mt-8 w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed disabled:dark:bg-gray-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{loadingMessage ? loadingMessage.split('...')[0] + '...' : 'Find Remote Jobs' }</span>
                </>
              ) : 'Find Remote Jobs'}
            </button>
        </div>
        
        <div className="mt-10">
            {renderContent()}
        </div>
      </main>
      <footer className="text-center p-6 text-slate-500 dark:text-slate-400 text-sm border-t border-slate-200 dark:border-gray-800 mt-8">
        <p>Powered by the Google Gemini API.</p>
        <p className="mt-1">Job listings are generated by AI and may not be exhaustive. Always verify details on the hiring site.</p>
      </footer>
    </div>
  );
};

export default App;