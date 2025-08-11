import React from 'react';
import { DocumentTextIcon, CheckCircleIcon, CalendarDaysIcon, CalendarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, value, label, variant = "blue", trend }) => {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900/30',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      icon: 'text-green-600 dark:text-green-400'
    },
    orange: {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      icon: 'text-orange-600 dark:text-orange-400'
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900/30',
      icon: 'text-purple-600 dark:text-purple-400'
    }
  };

  const colors = colorClasses[variant] || colorClasses.blue;

  return (
    <div className="stats-card group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-xl ${colors.bg} group-hover:scale-110 transition-transform duration-200`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          </div>
        </div>
        {trend && (
          <div className={`text-sm font-medium ${trend > 0 ? 'text-green-600 dark:text-green-400' : trend < 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
    </div>
  );
};

const Stats = ({ jobsFound, appliedCount, followupCount, appliedToday, appliedThisWeek }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <StatCard
      icon={DocumentTextIcon}
      value={jobsFound}
      label="Total Jobs Scraped"
      variant="blue"
    />
    <StatCard
      icon={CheckCircleIcon}
      value={appliedCount}
      label="Total Applications"
      variant="green"
    />
    <StatCard
      icon={CalendarDaysIcon}
      value={appliedToday}
      label="Applied Today"
      variant="orange"
    />
    <StatCard
      icon={CalendarIcon}
      value={appliedThisWeek}
      label="Applied This Week"
      variant="purple"
    />
  </div>
);

export default Stats;
