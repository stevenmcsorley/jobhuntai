import React from 'react';
import { CalendarDaysIcon, ClockIcon, BuildingOfficeIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const InterviewsPage = ({ interviews }) => {
  const upcomingInterviews = interviews.filter(i => new Date(i.interview_date) >= new Date());
  const pastInterviews = interviews.filter(i => new Date(i.interview_date) < new Date());

  const renderInterviewList = (title, list, isUpcoming = false) => (
    <div className="surface-card animate-fade-in">
      <div className="px-6 py-4 border-b border-neutral-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          {isUpcoming ? (
            <ClockIcon className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <CheckCircleIcon className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
          )}
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">{title}</h2>
          <span className="bg-gradient-to-r from-violet-100 to-purple-100 text-violet-800 dark:from-violet-900/30 dark:to-purple-900/30 dark:text-violet-400 px-3 py-1 rounded-full text-sm font-medium">
            {list.length}
          </span>
        </div>
      </div>
      <div className="p-6">
        {list.length > 0 ? (
          <div className="space-y-4">
            {list.map(interview => (
              <div key={interview.id} className="surface-card-soft p-4 hover:scale-[1.02] transition-all duration-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{interview.job_title}</h3>
                  <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center space-x-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{new Date(interview.interview_date).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span><strong>Company:</strong> {interview.company_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-300">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span><strong>Type:</strong> {interview.interview_type}</span>
                  </div>
                  {interview.notes && (
                    <div className="mt-3 p-3 bg-neutral-50 dark:bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300 italic">
                        <strong>Notes:</strong> {interview.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📅</div>
            <p className="text-neutral-600 dark:text-neutral-400">No interviews to display.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (!interviews) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner-modern w-8 h-8"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading interviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-purple-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-purple-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Interview Hub</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Manage your upcoming and past interviews
                </p>
              </div>
            </div>
          </div>
        </div>

        {renderInterviewList('Upcoming Interviews', upcomingInterviews, true)}
        {renderInterviewList('Past Interviews', pastInterviews, false)}
      </div>
    </div>
  );
};

export default InterviewsPage;

