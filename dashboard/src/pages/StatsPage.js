import React from 'react';
import PieChart from '../components/PieChart';
import BarChart from '../components/BarChart';
import { ChartBarIcon, DocumentDuplicateIcon, PaperAirplaneIcon, EyeIcon } from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: IconComponent }) => (
  <div className="surface-card p-6 text-center group hover:scale-105 transition-all duration-200">
    <div className="flex flex-col items-center space-y-3">
      <div className="p-3 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/50 rounded-xl shadow-sm group-hover:shadow-md transition-all">
        <IconComponent className="h-8 w-8 text-blue-600 dark:text-blue-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-3xl font-bold text-gradient-primary mt-1">{value}</p>
      </div>
    </div>
  </div>
);

const StatsPage = ({ stats }) => {
  // More robust check to ensure stats and its properties are available
  if (!stats || !stats.statusBreakdown || !stats.sourcePerformance) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="spinner-modern w-8 h-8"></div>
            <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading Stats...</span>
          </div>
        </div>
      </div>
    );
  }

  const totalApplications = stats.statusBreakdown.reduce((sum, item) => sum + item.count, 0);
  const appliedCount = stats.statusBreakdown.find(s => s.status === 'applied')?.count || 0;
  const topSource = stats.sourcePerformance[0]?.source || 'N/A';

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-blue-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-blue-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Application Statistics</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Track your job application performance and insights
                </p>
              </div>
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
          <div className="surface-card p-6">
            <PieChart title="Application Status Breakdown" data={stats.statusBreakdown} labels="status" dataKey="count" />
          </div>
          <div className="surface-card p-6">
            <BarChart title="Job Source Performance" data={stats.sourcePerformance} labels="source" dataKey="count" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsPage;

