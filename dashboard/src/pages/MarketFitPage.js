import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import BarChart from '../components/BarChart';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const MarketFitPage = () => {
  const [marketData, setMarketData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/market-fit');
        setMarketData(response.data);
      } catch (error) {
        toast.error('Failed to load market-fit analysis.');
        console.error('Error fetching market-fit data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMarketData();
  }, []);

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="spinner-modern w-8 h-8"></div>
            <span className="ml-3 text-neutral-600 dark:text-neutral-400" data-testid="loading-text">Loading Market Analysis...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData || marketData.analysis.length === 0) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-responsive">
          <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-pink-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-pink-900/10">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
              <div className="space-y-3">
                <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight" data-testid="market-fit-page-title">Market-Fit Analysis</h1>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                  <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                    Analyze market demand for skills
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="surface-card p-8" data-testid="empty-state-container">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-neutral-400 mb-4" data-testid="empty-state-icon" />
              <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2" data-testid="empty-state-title">No Data Available</h3>
              <p className="text-neutral-600 dark:text-neutral-400 mb-4">
                No job descriptions have been analyzed yet.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-500">
                Run a scrape or the proactive hunter to gather data, then come back to see which skills are most in-demand.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const topSkills = marketData.analysis.filter(skill => skill.count > 0);

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-pink-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-pink-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight" data-testid="market-fit-loaded-title">Market-Fit Analysis</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm" data-testid="analysis-subtitle">
                  Based on an analysis of {marketData.totalJobsAnalyzed} saved job descriptions
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Card */}
        <div className="surface-card p-6" data-testid="analysis-card">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2" data-testid="skills-analysis-title">Skills Analysis</h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              This chart shows the percentage of jobs that mention a specific skill or technology. It helps you understand which skills are most valued by employers in the roles you are targeting.
            </p>
          </div>
          
          <div data-testid="skills-chart">
            <BarChart
              title="Top In-Demand Skills"
              data={topSkills}
              labels="skill"
              dataKey="percentage"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketFitPage;
