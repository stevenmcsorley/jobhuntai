import React, { useState } from 'react';
import { PlusIcon, MagnifyingGlassIcon, CloudArrowDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

const Header = ({ lastRun, onRunScrape, onAddJob, onRunHunt, isLoading, progressMessage }) => {
  const [showScrapeMenu, setShowScrapeMenu] = useState(false);

  return (
    <header className="surface-card-elevated p-8 mb-8 relative z-[999] bg-gradient-to-r from-white via-white to-violet-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-violet-900/10">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
        <div className="space-y-3">
          <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Job Hunt Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm">
              Last Updated: <span className="font-semibold text-neutral-900 dark:text-white">{lastRun}</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <button 
            className="btn-secondary flex items-center space-x-2 relative z-10" 
            onClick={onAddJob} 
            disabled={isLoading}
          >
            <PlusIcon className="w-5 h-5" />
            <span>Add Job</span>
          </button>
          
          <button 
            className="btn-success flex items-center space-x-2" 
            onClick={onRunHunt} 
            disabled={isLoading}
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
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
                  <div className="spinner-modern w-5 h-5"></div>
                  <span>{progressMessage}</span>
                </>
              ) : (
                <>
                  <CloudArrowDownIcon className="w-5 h-5" />
                  <span>Manual Scrape</span>
                  <ChevronDownIcon className="w-4 h-4 transition-transform duration-200 group-hover:rotate-180" />
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
                  
                  <div className="dropdown-divider" />
                  
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
