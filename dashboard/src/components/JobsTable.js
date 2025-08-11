import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from './Table';
import TableStats from './TableStats';
import { EllipsisVerticalIcon, TrashIcon, EyeIcon, DocumentTextIcon, RocketLaunchIcon, CalendarIcon } from '@heroicons/react/24/outline';

const ModernDropdown = ({ children, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className="relative" ref={containerRef} data-no-row-click>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          className="dropdown-modern z-50"
          onClick={(e) => {
            // keep clicks inside from bubbling to row
            e.stopPropagation();
          }}
        >
          {children.map((child, index) => (
            <div key={index} onClick={() => setIsOpen(false)}>
              {child}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const JobsTable = ({ title, icon, jobs, columns, statsConfig, onAnalyze, analyzingId, onViewAnalysis, onScheduleInterview, onApply, onDismiss, onDelete, onJobUpdate, onMatchComplete, onTailorCv, onViewCv, onAutoApply }) => {
  const navigate = useNavigate();
  const tableColumns = [
    ...columns,
    {
      key: 'actions',
      label: 'Actions',
      width: '8%',
      sortable: false,
      render: (job) => {
        const hasDescription = job && job.description && job.description.trim() !== '';
        const hasTailoredCv = job && job.tailored_cv && job.tailored_cv.trim() !== '';
        const isCwJobs = job && job.source === 'cwjobs';
        
        const handleDeleteClick = () => {
          if (window.confirm(`Are you sure you want to permanently delete "${job.title}"? This action cannot be undone.`)) {
            // Prefer application_id when available (Opportunities/Dashboard pass application records)
            const idForDelete = job.application_id ?? job.id;
            onDelete(idForDelete);
          }
        };

        const dropdownItems = [];

        // View Details (replaces "View Analysis")
        dropdownItems.push(
          <button
            key="view-details"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              navigate(`/job/${job.id}`, { state: { jobData: job } });
            }}
            className="dropdown-item flex items-center space-x-2"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Details</span>
          </button>
        );

        // Quick actions that work from the table
        if (hasDescription && onTailorCv) {
          dropdownItems.push(
            <button
              key="tailor-cv"
              onClick={() => onTailorCv(job.job_id)}
              className="dropdown-item flex items-center space-x-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>Tailor CV</span>
            </button>
          );
        }

        if (hasTailoredCv && onViewCv) {
          dropdownItems.push(
            <button
              key="view-cv"
              onClick={() => onViewCv(job)}
              className="dropdown-item flex items-center space-x-2"
            >
              <DocumentTextIcon className="w-4 h-4" />
              <span>View Tailored CV</span>
            </button>
          );
        }

        if (isCwJobs && hasDescription && onAutoApply) {
          dropdownItems.push(
            <button
              key="auto-apply"
              onClick={() => onAutoApply(job.job_id)}
              className="dropdown-item flex items-center space-x-2"
            >
              <RocketLaunchIcon className="w-4 h-4" />
              <span>Auto-Apply</span>
            </button>
          );
        }

        if (hasDescription && onScheduleInterview) {
          dropdownItems.push(
            <button
              key="schedule-interview"
              onClick={() => onScheduleInterview(job)}
              className="dropdown-item flex items-center space-x-2"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Schedule Interview</span>
            </button>
          );
        }

        if (hasDescription && onApply) {
          dropdownItems.push(
            <button
              key="apply"
              onClick={() => onApply(job.id)}
              className="dropdown-item flex items-center space-x-2"
            >
              <RocketLaunchIcon className="w-4 h-4" />
              <span>Apply</span>
            </button>
          );
        }

        if (onDismiss) {
          dropdownItems.push(
            <button
              key="dismiss"
              onClick={() => onDismiss(job.id)}
              className="dropdown-item flex items-center space-x-2"
            >
              <EyeIcon className="w-4 h-4 opacity-50" />
              <span>Dismiss</span>
            </button>
          );
        }

        // Divider and external links
        if (dropdownItems.length > 1) {
          dropdownItems.push(
            <div key="divider-1" className="dropdown-divider" />
          );
        }

        dropdownItems.push(
          <a
            key="view-original"
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="dropdown-item flex items-center space-x-2"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Original Post</span>
          </a>
        );

        dropdownItems.push(
          <div key="divider-2" className="dropdown-divider" />,
          <button
            key="delete"
            onClick={handleDeleteClick}
            className="dropdown-item flex items-center space-x-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <TrashIcon className="w-4 h-4" />
            <span>Delete</span>
          </button>
        );

        return (
          <div className="flex justify-center" onClick={(e) => e.stopPropagation()} data-no-row-click>
            <ModernDropdown trigger={
              <div className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors duration-150">
                <EllipsisVerticalIcon className="w-4 h-4" />
              </div>
            }>
              {dropdownItems}
            </ModernDropdown>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="glass-card">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-3">
            <i className={`fas ${icon} text-blue-600 dark:text-blue-400`}></i>
            <span className="text-gradient">{title}</span>
          </h2>
          <TableStats data={jobs} config={statsConfig} />
        </div>
        <div className="p-6 overflow-visible">
          <Table 
            columns={tableColumns} 
            data={jobs} 
            searchable={true} 
            pageSize={10} 
            onRowClick={(job) => navigate(`/job/${job.id}`, { state: { jobData: job } })}
          />
        </div>
      </div>
    </div>
  );
};

export default JobsTable;
