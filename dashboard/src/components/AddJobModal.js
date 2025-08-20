import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddJobModal = ({ onClose, onJobAdded }) => {
  const [job, setJob] = useState({
    title: '',
    company: '',
    location: '',
    url: '',
    description: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setJob(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!job.title || !job.company || !job.url) {
      toast.error('Please fill in at least Title, Company, and URL.');
      return;
    }
    setIsSaving(true);
    toast.info('Adding new job...');
    try {
      const response = await axios.post('/api/jobs', job);
      toast.success('Job added successfully!');
      if (onJobAdded) {
        onJobAdded(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Error adding job:', error);
      toast.error(error.response?.data?.error || 'Failed to add job.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="surface-card-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-modern animate-scale-in">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-slate-700">
            <h2 className="text-display-md text-gradient-primary font-bold">Add New Job</h2>
            <button 
              type="button" 
              onClick={onClose}
              className="btn-icon text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Job Title *
                </label>
                <input 
                  type="text" 
                  className="input-modern" 
                  id="title" 
                  name="title" 
                  value={job.title} 
                  onChange={handleChange} 
                  placeholder="e.g. Senior React Developer"
                  required 
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Company *
                </label>
                <input 
                  type="text" 
                  className="input-modern" 
                  id="company" 
                  name="company" 
                  value={job.company} 
                  onChange={handleChange} 
                  placeholder="e.g. TechCorp Inc."
                  required 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="location" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Location
                </label>
                <input 
                  type="text" 
                  className="input-modern" 
                  id="location" 
                  name="location" 
                  value={job.location} 
                  onChange={handleChange}
                  placeholder="e.g. London, Remote"
                />
              </div>
              <div>
                <label htmlFor="url" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Job URL *
                </label>
                <input 
                  type="url" 
                  className="input-modern" 
                  id="url" 
                  name="url" 
                  value={job.url} 
                  onChange={handleChange} 
                  placeholder="https://..."
                  required 
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                Job Description
              </label>
              <textarea 
                className="textarea-modern" 
                id="description" 
                name="description" 
                rows="6" 
                value={job.description} 
                onChange={handleChange}
                placeholder="Paste the full job description here..."
              ></textarea>
            </div>
          </div>
          
          <div className="flex items-center justify-end space-x-3 p-6 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-800/50">
            <button 
              type="button" 
              className="btn-secondary" 
              onClick={onClose} 
              disabled={isSaving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <div className="spinner-modern w-4 h-4 mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Job'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
