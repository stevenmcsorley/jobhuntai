import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const CVEditorPage = () => {
  const [cvContent, setCvContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchCv = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/cv');
        setCvContent(response.data.content);
      } catch (error) {
        toast.error('Failed to load CV content.');
        console.error('Error fetching CV:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCv();
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.post('/api/cv', { content: cvContent });
      toast.success('CV saved successfully!');
    } catch (error) {
      toast.error('Failed to save CV.');
      console.error('Error saving CV:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading CV...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="cv-editor-title">CV Editor</h1>
              <p className="text-blue-100">Edit and manage your CV content</p>
            </div>
          </div>
        </div>

        {/* Main Editor Card */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CV Content</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your CV is used by the AI to generate cover letters and match you to jobs.
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                isSaving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              data-testid="save-cv-button"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save CV'
              )}
            </button>
          </div>

          <textarea
            className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={cvContent}
            onChange={(e) => setCvContent(e.target.value)}
            placeholder="Paste your CV content here..."
            data-testid="cv-content-textarea"
          />
        </div>
      </div>
    </div>
  );
};

export default CVEditorPage;
