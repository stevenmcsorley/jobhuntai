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
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <form onSubmit={handleSubmit}>
            <div className="modal-header">
              <h5 className="modal-title">Manually Add Job</h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">Job Title</label>
                <input type="text" className="form-control" id="title" name="title" value={job.title} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="company" className="form-label">Company</label>
                <input type="text" className="form-control" id="company" name="company" value={job.company} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="location" className="form-label">Location</label>
                <input type="text" className="form-control" id="location" name="location" value={job.location} onChange={handleChange} />
              </div>
              <div className="mb-3">
                <label htmlFor="url" className="form-label">Job URL</label>
                <input type="url" className="form-control" id="url" name="url" value={job.url} onChange={handleChange} required />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">Description</label>
                <textarea className="form-control" id="description" name="description" rows="8" value={job.description} onChange={handleChange}></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Job'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddJobModal;
