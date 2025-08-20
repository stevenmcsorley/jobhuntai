import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CloudArrowUpIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const BulkAddPage = ({ fetchData }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const requiredFormat = `[
  {
    "title": "Software Engineer",
    "company": "Tech Corp",
    "url": "https://example.com/job/123",
    "location": "San Francisco, CA",
    "description": "Looking for a skilled software engineer...",
    "posted": "2 days ago",
    "salary": "$120,000 - $150,000"
  }
]`;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    let jobs;
    try {
      jobs = JSON.parse(jsonInput);
    } catch (error) {
      toast.error('Invalid JSON format. Please check your input.');
      setIsLoading(false);
      return;
    }

    if (!Array.isArray(jobs)) {
      toast.error('Input must be a JSON array of job objects.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('/api/jobs/bulk', jobs);
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        response.data.errors.forEach(err => {
          toast.warn(`Failed to import job (${err.url}): ${err.reason}`);
        });
      }
      setJsonInput('');
      if (fetchData) {
        await fetchData();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <CloudArrowUpIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold">Bulk Add Jobs</h1>
              <p className="text-emerald-100">Import multiple job listings from JSON data</p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="glass-card p-6">
          <div className="flex items-start space-x-3">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">How it works</h2>
              <p className="text-gray-600 dark:text-gray-300">
                Paste a JSON array of job objects into the text area below to add them to the database.
                The <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-sm">source</code> will be automatically set to "manual-bulk".
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* JSON Input */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">JSON Input</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Paste your job data in JSON format below
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste your JSON here..."
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Importing...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                    Import Jobs
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Format Guide */}
          <div className="glass-card p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Required JSON Format</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The input must be a valid JSON array with the following structure
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Required Keys:</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-sm">title</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-sm">company</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 rounded text-sm">url</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string, must be unique)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Optional Keys:</h4>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm">location</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm">description</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm">posted</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded text-sm">salary</code>
                    <span className="text-sm text-gray-600 dark:text-gray-300">(string)</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Example:</h4>
                <pre className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs text-gray-800 dark:text-gray-100 overflow-x-auto">
                  <code>{requiredFormat}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkAddPage;
