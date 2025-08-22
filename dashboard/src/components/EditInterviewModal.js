import React, { useState } from 'react';

const EditInterviewModal = ({ interview, onSave, onClose }) => {
  const [interviewDate, setInterviewDate] = useState(
    interview.interview_date ? new Date(interview.interview_date).toISOString().slice(0, 16) : ''
  );
  const [interviewType, setInterviewType] = useState(interview.interview_type || 'Phone Screen');
  const [notes, setNotes] = useState(interview.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const updatedData = {
        interview_date: interviewDate,
        interview_type: interviewType,
        notes,
      };
      
      await onSave(interview, updatedData);
    } catch (error) {
      console.error('Error saving interview:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="glass-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Interview</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">for {interview.job_title}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-150"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          <div className="px-6 py-4 space-y-4">
            <div>
              <label htmlFor="interviewDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date and Time
              </label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                id="interviewDate"
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label htmlFor="interviewType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interview Type
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                id="interviewType"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
              >
                <option>Phone Screen</option>
                <option>Technical</option>
                <option>Behavioral</option>
                <option>Final Round</option>
                <option>HR Call</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                id="notes"
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., Interviewer names, video call link, topics to prepare..."
              />
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Update Interview'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInterviewModal;