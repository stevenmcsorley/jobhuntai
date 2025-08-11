import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Tooltip } from 'react-tooltip';

const StatItem = ({ icon, label, value }) => (
  <div 
    className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm"
    data-tooltip-id="stat-tooltip"
    data-tooltip-content={label}
  >
    <FontAwesomeIcon icon={icon} className="text-gray-500 dark:text-gray-400 w-4 h-4" />
    <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
  </div>
);

const TableStats = ({ data, config }) => {
  if (!data || data.length === 0 || !config) {
    return null;
  }

  const stats = config.map(stat => {
    const value = stat.calculator(data);
    return <StatItem key={stat.label} icon={stat.icon} label={stat.label} value={value} />;
  });

  return (
    <>
      <div className="flex items-center space-x-3">
        {stats}
      </div>
      <Tooltip id="stat-tooltip" />
    </>
  );
};

export default TableStats;
