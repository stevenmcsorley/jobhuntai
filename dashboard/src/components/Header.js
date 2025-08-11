import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, CloudArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Header = ({ lastRun, onRunScrape, onAddJob, onRunHunt, isLoading, progressMessage }) => {
  const [showScrapeMenu, setShowScrapeMenu] = useState(false);

  return (
    <header className="glass-card p-6 mb-8 relative z-[999]">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">Job Hunt Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last Updated: <span className="font-medium text-gray-900 dark:text-white">{lastRun}</span>
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <button 
            className="btn-primary flex items-center space-x-2" 
            onClick={onAddJob} 
            disabled={isLoading}
          >
            <PlusIcon className="w-4 h-4" />
            <span>Add Job</span>
          </button>
          
          <button 
            className="btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700" 
            onClick={onRunHunt} 
            disabled={isLoading}
          >
            <MagnifyingGlassIcon className="w-4 h-4" />
            <span>Find New Jobs</span>
          </button>
          
          <div className="relative">
            <button
              className={`btn-primary flex items-center space-x-2 ${isLoading ? 'cursor-not-allowed opacity-75' : ''}`}
              onClick={() => !isLoading && setShowScrapeMenu(!showScrapeMenu)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  <span>{progressMessage}</span>
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="w-4 h-4" />
                  <span>Manual Scrape</span>
                  <ChevronDownIcon className="w-4 h-4" />
                </>
              )}
            </button>
            
            {showScrapeMenu && !isLoading && (
              <>
                {/* Backdrop with high z-index to sit above glass cards */}
                <div 
                  className="fixed inset-0" 
                  style={{ zIndex: 99999 }}
                  onClick={() => setShowScrapeMenu(false)}
                />
                {/* Ensure dropdown renders above cards and aligns icons consistently */}
                <div className="dropdown-modern" style={{ zIndex: 100000 }}>
                  <button
                    className="dropdown-item flex items-center space-x-2 w-full"
                    onClick={() => {
                      onRunScrape('all');
                      setShowScrapeMenu(false);
                    }}
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                    <span>All Sources</span>
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                  
                  <button
                    className="dropdown-item flex items-center space-x-2 w-full"
                    onClick={() => {
                      onRunScrape('cwjobs');
                      setShowScrapeMenu(false);
                    }}
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                    <span>CWJobs Only</span>
                  </button>
                  
                  <button
                    className="dropdown-item flex items-center space-x-2 w-full"
                    onClick={() => {
                      onRunScrape('linkedin');
                      setShowScrapeMenu(false);
                    }}
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                    <span>LinkedIn Only</span>
                  </button>
                  
                  <button
                    className="dropdown-item flex items-center space-x-2 w-full"
                    onClick={() => {
                      onRunScrape('indeed');
                      setShowScrapeMenu(false);
                    }}
                  >
                    <CloudArrowDownIcon className="w-4 h-4" />
                    <span>Indeed Only</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
