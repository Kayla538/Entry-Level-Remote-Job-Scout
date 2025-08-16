
import React from 'react';
import { SearchIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-5 md:px-8 flex items-center justify-between">
        <div className="flex items-center">
            <div className="bg-primary-600 p-2 rounded-lg mr-4">
               <SearchIcon className="h-8 w-8 text-white" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-white">
                Entry-Level Remote Job Scout
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your AI-powered guide to remote careers.
                </p>
            </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
