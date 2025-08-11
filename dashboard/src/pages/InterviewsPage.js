import React from 'react';
import { CalendarDaysIcon, ClockIcon, BuildingOfficeIcon, ChatBubbleLeftRightIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const InterviewsPage = ({ interviews }) => {
  const upcomingInterviews = interviews.filter(i => new Date(i.interview_date) >= new Date());
  const pastInterviews = interviews.filter(i => new Date(i.interview_date) < new Date());

  const renderInterviewList = (title, list, isUpcoming = false) => (
    <div className="glass-card animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          {isUpcoming ? (
            <ClockIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <CheckCircleIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          )}
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full text-sm font-medium">
            {list.length}
          </span>
        </div>
      </div>
      <div className="p-6">
        {list.length > 0 ? (
          <div className="space-y-4">
            {list.map(interview => (
              <div key={interview.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{interview.job_title}</h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center space-x-1">
                    <CalendarDaysIcon className="w-4 h-4" />
                    <span>{new Date(interview.interview_date).toLocaleString()}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <BuildingOfficeIcon className="w-4 h-4" />
                    <span><strong>Company:</strong> {interview.company_name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span><strong>Type:</strong> {interview.interview_type}</span>
                  </div>
                  {interview.notes && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
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
            <p className="text-gray-600 dark:text-gray-400">No interviews to display.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (!interviews) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading interviews...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-card p-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Interview Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your upcoming and past interviews.
            </p>
          </div>
        </div>

        {renderInterviewList('Upcoming Interviews', upcomingInterviews, true)}
        {renderInterviewList('Past Interviews', pastInterviews, false)}
      </div>
    </div>
  );
};

export default InterviewsPage;

