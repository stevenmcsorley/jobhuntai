import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const PreferencesPage = () => {
  const [preferences, setPreferences] = useState({
    keywords: 'Software Developer, Full Stack Developer, Frontend Developer',
    location: 'London',
    town: 'London',
    radius: '30',
    salary: '£60,000',
    stack_keywords: 'javascript,typescript,react,node.js,python,html,css,git',
    market_fit_skills: 'JavaScript,TypeScript,React,Node.js,Python,HTML,CSS,Git',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get('/api/preferences');
        if (response.data) {
          setPreferences(prev => ({ ...prev, ...response.data }));
        }
      } catch (error) {
        toast.error('Failed to load preferences.');
        console.error('Error fetching preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPreferences();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axios.post('/api/preferences', preferences);
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences.');
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading Preferences...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cog6ToothIcon className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Search Preferences</h1>
                <p className="text-indigo-100">Configure your job search criteria</p>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors ${
                isSaving
                  ? 'bg-white/20 cursor-not-allowed text-white/60'
                  : 'bg-white text-indigo-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </button>
          </div>
        </div>

        {/* Preferences Form */}
        <div className="glass-card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Job Search Criteria</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Define your ideal role. The Proactive Job Hunter agent will use these criteria to find and score new opportunities for you.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Keywords
              </label>
              <input
                type="text"
                id="keywords"
                name="keywords"
                value={preferences.keywords}
                onChange={handleChange}
                placeholder="e.g., Senior Python Developer, React, DevOps"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Separate keywords with commas. These are used to find jobs.
              </p>
            </div>

            <div>
              <label htmlFor="stack_keywords" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stack Keywords
              </label>
              <textarea
                id="stack_keywords"
                name="stack_keywords"
                rows="3"
                value={preferences.stack_keywords}
                onChange={handleChange}
                placeholder="e.g., react,typescript,node,python"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comma-separated list of keywords to filter jobs by. This decides if a job is relevant to your stack.
              </p>
            </div>

            <div>
              <label htmlFor="market_fit_skills" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Market-Fit Skills
              </label>
              <textarea
                id="market_fit_skills"
                name="market_fit_skills"
                rows="3"
                value={preferences.market_fit_skills}
                onChange={handleChange}
                placeholder="e.g., React,Node.js,Python,AWS"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Comma-separated list of skills to track in the Market-Fit Analysis page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="town" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Town (for CWJobs)
                </label>
                <input
                  type="text"
                  id="town"
                  name="town"
                  value={preferences.town}
                  onChange={handleChange}
                  placeholder="e.g., Glasgow, Manchester"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Search Radius (miles)
                </label>
                <select
                  id="radius"
                  name="radius"
                  value={preferences.radius}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="0">0</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                General Location (for other sites)
              </label>
              <input
                type="text"
                id="location"
                name="location"
                value={preferences.location}
                onChange={handleChange}
                placeholder="e.g., London, Remote, United Kingdom"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="salary" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Desired Salary
              </label>
              <input
                type="text"
                id="salary"
                name="salary"
                value={preferences.salary}
                onChange={handleChange}
                placeholder="e.g., £80,000, >100k"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Enter a specific number or a range.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesPage;
