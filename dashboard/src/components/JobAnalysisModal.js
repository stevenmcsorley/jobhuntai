import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import StatusUpdater from './StatusUpdater';

const JobAnalysisModal = ({ job, application, onClose, onJobUpdate, onApplicationUpdate, onMatchComplete }) => {
  const [activeTab, setActiveTab] = useState('description');
  const [isMatching, setIsMatching] = useState(false);
  const [isPrepping, setIsPrepping] = useState(false);
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  const [isGeneratingCompanyInfo, setIsGeneratingCompanyInfo] = useState(false);
  const [editableDescription, setEditableDescription] = useState(job.description || '');

  useEffect(() => {
    setEditableDescription(job.description || '');
  }, [job.description]);

  const hasDescription = job && job.description && job.description.trim() !== '';

  const handleDescriptionSave = async () => {
    toast.info('Saving description...');
    try {
      const response = await axios.patch(`/api/jobs/${job.job_id}`, { description: editableDescription });
      if (onJobUpdate) {
        onJobUpdate(response.data);
      }
      toast.success('Description saved!');
    } catch (error) {
      toast.error('Failed to save description.');
    }
  };

  const handleGenerateCompanyInfo = async () => {
    setIsGeneratingCompanyInfo(true);
    toast.info(`Generating info for ${job.company}...`);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/generate-company-info`);
      if (onJobUpdate) {
        onJobUpdate(response.data);
      }
      toast.success('Company info generated!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to generate company info.');
    } finally {
      setIsGeneratingCompanyInfo(false);
    }
  };

  const handleRunMatch = async () => {
    setIsMatching(true);
    toast.info(`Matching CV for ${job.title}...`);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/match`);
      if (onMatchComplete) {
        onMatchComplete(response.data);
      }
      toast.success('CV match complete!');
    } catch (error) {
      console.error(`Error matching job ${job.job_id}:`, error);
      toast.error(error.response?.data?.error || 'Failed to match CV.');
    } finally {
      setIsMatching(false);
    }
  };

  const handleGeneratePrep = async () => {
    setIsPrepping(true);
    toast.info('Generating interview prep...');
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/interview-prep`);
      if (onJobUpdate) {
        onJobUpdate(response.data);
      }
      toast.success('Interview prep generated!');
    } catch (error) {
      console.error(`Error generating prep for job ${job.job_id}:`, error);
      toast.error(error.response?.data?.error || 'Failed to generate interview prep.');
    } finally {
      setIsPrepping(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    toast.info('Generating cover letter...');
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/generate-cover-letter`);
      if (onJobUpdate) {
        onJobUpdate(response.data);
      }
      toast.success('Cover letter generated!');
    } catch (error) {
      console.error(`Error generating cover letter for job ${job.job_id}:`, error);
      toast.error(error.response?.data?.error || 'Failed to generate cover letter.');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  // Derive all display data directly from props
  const interviewPrep = job?.interview_prep ? (() => {
    if (typeof job.interview_prep === 'string') {
      try {
        return JSON.parse(job.interview_prep);
      } catch (error) {
        console.error('Failed to parse interview_prep:', job.interview_prep, error);
        return null;
      }
    }
    return job.interview_prep;
  })() : null;
  const coverLetter = job?.cover_letter || '';
  const companyInfo = job?.company_info || '';
  const matchResult = application;

  return (
    <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <div className="modal-title">
              <h5>{job.title}</h5>
              <h6 className="text-muted">{job.company}</h6>
            </div>
            <div className="ms-auto">
              <StatusUpdater application={application} onUpdate={onApplicationUpdate} onClose={onClose} />
            </div>
            <button type="button" className="btn-close ms-2" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'description' ? 'active' : ''}`} onClick={() => setActiveTab('description')}>Description</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'company-info' ? 'active' : ''}`} onClick={() => setActiveTab('company-info')}>Company Info</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'cv-match' ? 'active' : ''}`} onClick={() => setActiveTab('cv-match')}>CV Match</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'interview-prep' ? 'active' : ''}`} onClick={() => setActiveTab('interview-prep')}>Interview Prep</button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === 'cover-letter' ? 'active' : ''}`} onClick={() => setActiveTab('cover-letter')}>Cover Letter</button>
              </li>
            </ul>

            <div className="tab-content p-3">
              {activeTab === 'description' && (
                <div>
                  <textarea
                    className="form-control"
                    rows="20"
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                  />
                  <button className="btn btn-primary mt-2" onClick={handleDescriptionSave}>Save Description</button>
                </div>
              )}
              {activeTab === 'company-info' && (
                <div>
                  <button 
                    className="btn btn-info mb-3" 
                    onClick={handleGenerateCompanyInfo} 
                    disabled={isGeneratingCompanyInfo}
                  >
                    {isGeneratingCompanyInfo ? 'Generating...' : 'Generate Company Info'}
                  </button>
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.9rem' }}>
                    {companyInfo || 'No company information available. Click the button to generate it.'}
                  </pre>
                </div>
              )}
              {activeTab === 'cv-match' && (
                <div>
                  <button 
                    className="btn btn-success mb-3" 
                    onClick={handleRunMatch} 
                    disabled={isMatching || !hasDescription}
                    title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                  >
                    {isMatching ? 'Matching...' : 'Run CV Match'}
                  </button>
                  {matchResult && matchResult.score !== undefined && (
                    <div className={`card ${matchResult.score > 0.5 ? 'border-success' : 'border-danger'}`}>
                      <div className="card-body">
                        <h6 className="card-title">Match Result</h6>
                        <p className="card-text"><strong>Score:</strong> {matchResult.score.toFixed(2)}</p>
                        <div>
                          <strong>Key Reasons:</strong>
                          <ul>
                            {matchResult.reasons && matchResult.reasons.map((reason, index) => (
                              <li key={index}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'interview-prep' && (
                <div>
                  <button 
                    className="btn btn-info mb-3" 
                    onClick={handleGeneratePrep} 
                    disabled={isPrepping || !hasDescription}
                    title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                  >
                    {isPrepping ? 'Generating...' : 'Generate Interview Prep'}
                  </button>
                  {interviewPrep && (
                    <div>
                      <h6>Company Overview</h6>
                      <p>{interviewPrep.company_overview}</p>
                      <h6>Talking Points</h6>
                      <ul>
                        {interviewPrep.talking_points.map((point, i) => <li key={i}>{point}</li>)}
                      </ul>
                      <h6>Technical Questions</h6>
                      <ul>
                        {interviewPrep.technical_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                      <h6>Behavioral Questions</h6>
                      <ul>
                        {interviewPrep.behavioral_questions.map((q, i) => <li key={i}>{q}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'cover-letter' && (
                <div>
                  <button 
                    className="btn btn-primary mb-3" 
                    onClick={handleGenerateCoverLetter} 
                    disabled={isGeneratingLetter || !hasDescription}
                    title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                  >
                    {isGeneratingLetter ? 'Generating...' : 'Generate Cover Letter'}
                  </button>
                  {coverLetter && (
                    <textarea
                      className="form-control"
                      rows="20"
                      value={coverLetter}
                      readOnly
                      style={{ fontFamily: 'monospace' }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAnalysisModal;
