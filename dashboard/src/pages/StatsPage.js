import React from 'react';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import { ChartBarIcon, DocumentDuplicateIcon, PaperAirplaneIcon, EyeIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: IconComponent }) => (
  <div className="glass-card p-6 text-center">
    <div className="flex flex-col items-center space-y-3">
      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
        <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const StatsPage = ({ stats }) => {
  // More robust check to ensure stats and its properties are available
  if (!stats || !stats.statusBreakdown || !stats.sourcePerformance) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Stats...</span>
          </div>
        </div>
      </div>
    );
  }

  const totalApplications = stats.statusBreakdown.reduce((sum, item) => sum + item.count, 0);
  const appliedCount = stats.statusBreakdown.find(s => s.status === 'applied')?.count || 0;
  const topSource = stats.sourcePerformance[0]?.source || 'N/A';

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Application Statistics</h1>
              <p className="text-green-100">Track your job application performance</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Applications Tracked" value={totalApplications} icon={DocumentDuplicateIcon} />
          <StatCard title="Total Jobs Applied To" value={appliedCount} icon={PaperAirplaneIcon} />
          <StatCard title="Top Source" value={topSource} icon={EyeIcon} />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <PieChart title="Application Status Breakdown" data={stats.statusBreakdown} labels="status" dataKey="count" />
          </div>
          <div className="glass-card p-6">
            <BarChart title="Job Source Performance" data={stats.sourcePerformance} labels="source" dataKey="count" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

