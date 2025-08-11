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
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Market Analysis...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!marketData || marketData.analysis.length === 0) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Market-Fit Analysis</h1>
                <p className="text-purple-100">Analyze market demand for skills</p>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="glass-card p-8">
            <div className="text-center">
              <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Available</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No job descriptions have been analyzed yet.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
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
    <div className="h-full overflow-y-auto scrollbar-thin p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Market-Fit Analysis</h1>
              <p className="text-purple-100">
                Based on an analysis of {marketData.totalJobsAnalyzed} saved job descriptions
              </p>
            </div>
          </div>
        </div>

        {/* Analysis Card */}
        <div className="glass-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Skills Analysis</h2>
            <p className="text-gray-600 dark:text-gray-400">
              This chart shows the percentage of jobs that mention a specific skill or technology. It helps you understand which skills are most valued by employers in the roles you are targeting.
            </p>
          </div>
          
          <BarChart
            title="Top In-Demand Skills"
            data={topSkills}
            labels="skill"
            dataKey="percentage"
          />
        </div>
      </div>
    </div>
  );
};

export default MarketFitPage;
