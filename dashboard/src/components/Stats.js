import React from 'react';
import { DocumentTextIcon, CheckCircleIcon, CalendarDaysIcon, CalendarIcon } from '@heroicons/react/24/outline';

const StatCard = ({ icon: Icon, value, label, variant = "primary", trend }) => {
  const colorClasses = {
    primary: {
      bg: 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30',
      icon: 'text-violet-600 dark:text-violet-400'
    },
    success: {
      bg: 'bg-gradient-to-br from-emerald-100 to-green-100 dark:from-emerald-900/30 dark:to-green-900/30',
      icon: 'text-emerald-600 dark:text-emerald-400'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30',
      icon: 'text-amber-600 dark:text-amber-400'
    },
    info: {
      bg: 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30',
      icon: 'text-cyan-600 dark:text-cyan-400'
    }
  };

  const colors = colorClasses[variant] || colorClasses.primary;

  return (
    <div className="stats-card group">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`stats-card-icon ${colors.bg}`}>
            <Icon className={`w-6 h-6 ${colors.icon}`} />
          </div>
          <div>
            <div className="stats-value">{value}</div>
            <div className="stats-label">{label}</div>
          </div>
        </div>
        {trend && (
          <div className={trend > 0 ? 'stats-trend-up' : trend < 0 ? 'stats-trend-down' : 'stats-trend'}>
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
      variant="primary"
    />
    <StatCard
      icon={CheckCircleIcon}
      value={appliedCount}
      label="Total Applications"
      variant="success"
    />
    <StatCard
      icon={CalendarDaysIcon}
      value={appliedToday}
      label="Applied Today"
      variant="warning"
    />
    <StatCard
      icon={CalendarIcon}
      value={appliedThisWeek}
      label="Applied This Week"
      variant="info"
    />
  </div>
);

export default Stats;
