import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
// eslint-disable-next-line no-unused-vars
import StatusUpdater from '../components/StatusUpdater';
import { 
  ArrowLeftIcon, 
  BuildingOfficeIcon, 
  MapPinIcon, 
  BanknotesIcon,
  StarIcon,
  DocumentTextIcon,
  // eslint-disable-next-line no-unused-vars
  RocketLaunchIcon,
  PencilIcon,
  XMarkIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import NotesTab from '../components/NotesTab';

const JobAnalysisPage = ({ onJobUpdate, onApplicationUpdate, onMatchComplete }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [job, setJob] = useState(null);
  const [skills, setSkills] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  // eslint-disable-next-line no-unused-vars
  const [isMatching, setIsMatching] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isPrepping, setIsPrepping] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isGeneratingLetter, setIsGeneratingLetter] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [isGeneratingCompanyInfo, setIsGeneratingCompanyInfo] = useState(false);
  const [isExtractingSkills, setIsExtractingSkills] = useState(false);
  const [editableDescription, setEditableDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  // Keep local job state in sync when application status changes from StatusUpdater
  const handleLocalApplicationUpdate = (updatedApp) => {
    // Update local job object so the controlled select reflects the new status immediately
    setJob(prev => prev ? { ...prev, status: updatedApp.status } : prev);
    // Also bubble up to App-level state so lists refresh correctly
    if (onApplicationUpdate) onApplicationUpdate(updatedApp);
  };

  useEffect(() => {
    if (location.state?.jobData) {
      // Use the job data passed via navigation state
      setJob(location.state.jobData);
      setLoading(false);
    } else {
      // Fallback to fetching if no state data (direct URL access)
      fetchJobDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, location.state]);

  useEffect(() => {
    setEditableDescription(job?.description || '');
    if (job?.skills) {
      setSkills(typeof job.skills === 'string' ? JSON.parse(job.skills) : job.skills);
    }
  }, [job]);


  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      
      // First get the application data
      const appRes = await axios.get(`/api/applications/${id}`);
      const appData = appRes.data;
      
      if (!appData || !appData.job_id) {
        throw new Error('Application not found');
      }
      
      // Then get job and match data
      const [jobRes, matchRes] = await Promise.all([
        axios.get(`/api/jobs/${appData.job_id}`),
        axios.get(`/api/matches?job_id=${appData.job_id}`)
      ]);

      const jobData = jobRes.data;
      const matchData = matchRes.data?.[0] || {};

      setJob({
        ...jobData,
        ...matchData,
        ...appData,
        job_id: jobData.id,
        id: appData.id,
        reasons: matchData.reasons ? (typeof matchData.reasons === 'string' ? JSON.parse(matchData.reasons) : matchData.reasons) : []
      });
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast.error('Failed to load job details');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleExtractSkills = async () => {
    setIsExtractingSkills(true);
    toast.info('Extracting skills from description...');
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/extract-skills`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Skills extracted!');
    } catch (error) {
      console.error('Error extracting skills:', error);
      toast.error('Failed to extract skills');
    } finally {
      setIsExtractingSkills(false);
    }
  };

  const handleAddSkill = async (skill) => {
    const newSkills = [...skills, skill];
    await saveSkills(newSkills);
  };

  const handleDeleteSkill = async (index) => {
    const newSkills = skills.filter((_, i) => i !== index);
    await saveSkills(newSkills);
  };

  const saveSkills = async (newSkills) => {
    try {
      const response = await axios.patch(`/api/jobs/${job.job_id}`, { skills: JSON.stringify(newSkills) });
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Skills updated!');
    } catch (error) {
      console.error('Error saving skills:', error);
      toast.error('Failed to save skills');
    }
  };


  // eslint-disable-next-line no-unused-vars
  const handleDescriptionSave = async () => {
    setAnalyzing(true);
    toast.info('Saving description...');
    try {
      const response = await axios.patch(`/api/jobs/${job.job_id}`, { description: editableDescription });
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Description saved!');
    } catch (error) {
      console.error('Error saving description:', error);
      toast.error('Failed to save description');
    } finally {
      setAnalyzing(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/analyze`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error analyzing job:', error);
      toast.error('Failed to analyze job');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMatch = async () => {
    setIsMatching(true);
    toast.info(`Matching CV for ${job.title}...`);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/match`);

      // Robustly normalize reasons from server:
      // Accept array, JSON string, or markdown-fenced JSON; ignore invalid.
      const normalizeReasons = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          // strip markdown fences and trim
          const cleaned = val.replace(/```json|```/g, '').trim();
          try {
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed)) return parsed;
            // Some backends return object with reasons array
            if (parsed && Array.isArray(parsed.reasons)) return parsed.reasons;
            return [];
          } catch {
            return [];
          }
        }
        // handle object case with reasons
        if (val && Array.isArray(val.reasons)) return val.reasons;
        return [];
      };

      const data = response.data || {};
      const normalized = { ...data, reasons: normalizeReasons(data.reasons) };

      const updatedJob = { ...job, ...normalized };
      setJob(updatedJob);
      if (onMatchComplete) onMatchComplete(normalized);
      toast.success('CV match complete!');
    } catch (error) {
      console.error('Error matching CV:', error);
      toast.error('Failed to match CV');
    } finally {
      setIsMatching(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setIsGeneratingLetter(true);
    toast.info('Generating cover letter...');
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/generate-cover-letter`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Cover letter generated!');
    } catch (error) {
      console.error('Error generating cover letter:', error);
      toast.error('Failed to generate cover letter');
    } finally {
      setIsGeneratingLetter(false);
    }
  };

  const handleInterviewPrep = async () => {
    setIsPrepping(true);
    toast.info('Generating interview prep...');
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/interview-prep`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Interview prep generated!');
    } catch (error) {
      console.error('Error generating interview prep:', error);
      toast.error('Failed to generate interview prep');
    } finally {
      setIsPrepping(false);
    }
  };

  const handleCompanyInfo = async () => {
    setIsGeneratingCompanyInfo(true);
    toast.info(`Generating info for ${job.company}...`);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/generate-company-info`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('Company info generated!');
    } catch (error) {
      console.error('Error generating company info:', error);
      toast.error('Failed to generate company info');
    } finally {
      setIsGeneratingCompanyInfo(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleTailorCv = async () => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/tailor-cv`);
      const updatedJob = { ...job, ...response.data };
      setJob(updatedJob);
      if (onJobUpdate) onJobUpdate(response.data);
      toast.success('CV tailored successfully!');
    } catch (error) {
      console.error('Error tailoring CV:', error);
      toast.error('Failed to tailor CV');
    } finally {
      setAnalyzing(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleAutoApply = async () => {
    setAnalyzing(true);
    try {
      const response = await axios.post(`/api/jobs/${job.job_id}/auto-apply`);
      const { status, url } = response.data;

      if (status === 'applied') {
        toast.success('Successfully auto-applied!');
      } else if (status === 'external') {
        toast.warn('External application required. Opening page...');
        window.open(url, '_blank');
      } else if (status === 'followup') {
        toast.error('Non-standard application. Opening page for manual review.');
        window.open(url, '_blank');
      }
      
      // Refresh job data
      await fetchJobDetails();
    } catch (error) {
      console.error('Error during auto-apply:', error);
      toast.error('Auto-apply failed');
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner-modern w-8 h-8"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400" data-testid="loading-text">Loading job details...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2" data-testid="error-title">Job Not Found</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">The job you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
            data-testid="back-to-dashboard-button"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'description', label: 'Description', icon: DocumentTextIcon },
    { id: 'company-info', label: 'Company Info', icon: BuildingOfficeIcon },
    { id: 'cv-match', label: 'CV Match', icon: StarIcon },
    { id: 'interview-prep', label: 'Interview Prep', icon: PencilIcon },
    { id: 'cover-letter', label: 'Cover Letter', icon: DocumentTextIcon }
  ];

  if (job?.status === 'applied') {
    tabs.push({ id: 'notes', label: 'Notes', icon: ChatBubbleLeftRightIcon });
  }

  // eslint-disable-next-line no-unused-vars
  const hasDescription = job && job.description && job.description.trim() !== '';
  // eslint-disable-next-line no-unused-vars
  const interviewPrep = job?.interview_prep ? (typeof job.interview_prep === 'string' ? JSON.parse(job.interview_prep) : job.interview_prep) : null;
  // eslint-disable-next-line no-unused-vars
  const coverLetter = job?.cover_letter || '';
  // eslint-disable-next-line no-unused-vars
  const companyInfo = job?.company_info || '';
  // eslint-disable-next-line no-unused-vars
  const matchResult = job;

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        {/* Header Card */}
        <div className="surface-card-elevated p-6 bg-gradient-to-r from-white via-white to-blue-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-blue-900/10" data-testid="job-details-header">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-full transition-colors duration-200"
              data-testid="back-button"
            >
              <ArrowLeftIcon className="w-5 h-5 text-neutral-600 dark:text-neutral-300" />
            </button>
            <div>
              <h1 className="text-display-lg text-gradient-primary font-bold tracking-tight" data-testid="job-title">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-neutral-600 dark:text-neutral-300 mt-3">
                <div className="flex items-center space-x-1">
                  <BuildingOfficeIcon className="w-4 h-4" />
                  <span>{job.company}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MapPinIcon className="w-4 h-4" />
                  <span>{job.location}</span>
                </div>
                {job.salary && (
                  <div className="flex items-center space-x-1">
                    <BanknotesIcon className="w-4 h-4" />
                    <span>{job.salary}</span>
                  </div>
                )}
                {job.score && (
                  <div className="flex items-center space-x-1">
                    <StarIcon className="w-4 h-4" />
                    <span>{(job.score * 10).toFixed(1)} Match</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-neutral-200 dark:border-neutral-700 mt-6" data-testid="job-tabs">
            <nav className="-mb-px flex space-x-6 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' 
                      : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:border-neutral-500'
                  }`}
                  data-testid={`tab-${tab.id}`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="surface-card p-6" data-testid="job-content">
          {/* Status Updater */}
          <div className="flex items-center justify-end mb-6" data-testid="status-updater-section">
            <StatusUpdater application={job} onUpdate={handleLocalApplicationUpdate} />
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div>
              <textarea
                className="w-full h-96 p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                placeholder="Job description will appear here..."
                data-testid="job-description-textarea"
              />
              <div className="flex flex-wrap gap-3 mt-4">
                <button 
                  className="btn-primary" 
                  onClick={handleDescriptionSave}
                  disabled={analyzing}
                  data-testid="save-description-button"
                >
                  {analyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Saving...
                    </>
                  ) : 'Save Description'}
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleExtractSkills}
                  disabled={isExtractingSkills || !hasDescription}
                  title={!hasDescription ? 'Please save a description first' : ''}
                  data-testid="extract-skills-button"
                >
                  {isExtractingSkills ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Extracting...
                    </>
                  ) : 'Extract Skills'}
                </button>
              </div>
              {skills.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4" data-testid="skills-section-title">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 transition-all duration-200 hover:shadow-sm border border-primary-200 dark:border-primary-700" data-testid={`skill-tag-${index}`}>
                        <span>{skill}</span>
                        <button 
                          onClick={() => handleDeleteSkill(index)} 
                          className="ml-2 p-0.5 hover:bg-primary-200 hover:dark:bg-primary-800/50 rounded-full transition-colors duration-200 group"
                          title="Remove skill"
                          data-testid={`remove-skill-${index}`}
                        >
                          <XMarkIcon className="w-3 h-3 text-primary-600 dark:text-primary-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Add a skill"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddSkill(e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full md:w-1/3 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                      data-testid="add-skill-input"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'company-info' && (
            <div>
              <button 
                className="btn-primary mb-4" 
                onClick={handleCompanyInfo}
                disabled={isGeneratingCompanyInfo}
                data-testid="generate-company-info-button"
              >
                {isGeneratingCompanyInfo ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : 'Generate Company Info'}
              </button>
              <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="company-info-content">
                <pre className="whitespace-pre-wrap text-sm text-neutral-900 dark:text-neutral-100 font-mono">
                  {companyInfo || 'No company information available. Click the button to generate it.'}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'cv-match' && (
            <div>
              <button 
                className="btn-primary mb-4" 
                onClick={handleMatch}
                disabled={isMatching || !hasDescription}
                title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                data-testid="run-cv-match-button"
              >
                {isMatching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Matching...
                  </>
                ) : 'Run CV Match'}
              </button>
              {matchResult && matchResult.score !== undefined && (() => {
                const normalizeArray = (val) => {
                  if (!val) return [];
                  if (Array.isArray(val)) return val;
                  if (typeof val === 'string') {
                    try {
                      const parsed = JSON.parse(val);
                      return Array.isArray(parsed) ? parsed : [];
                    } catch {
                      return [];
                    }
                  }
                  return [];
                };

                const matchedSkills = normalizeArray(matchResult.reasons);
                const missingSkills = normalizeArray(matchResult.missing_skills);
                const suggestedTests = normalizeArray(matchResult.suggested_tests);
                const completedTests = normalizeArray(matchResult.completed_tests);
                const keyInsights = normalizeArray(matchResult.key_insights);

                return (
                  <div className="space-y-6">
                    {/* Overall Score */}
                    <div className={`surface-card p-4 border-l-4 ${
                      matchResult.score > 0.7 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 
                      matchResult.score > 0.4 ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' :
                      'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`} data-testid="cv-match-result">
                      <div className="flex items-center justify-between mb-3">
                        <h6 className="font-semibold text-neutral-900 dark:text-neutral-100">CV Match Analysis</h6>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          matchResult.score > 0.7 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                          matchResult.score > 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                        }`}>
                          {(matchResult.score * 100).toFixed(0)}% Match
                        </span>
                      </div>
                      
                      {keyInsights.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-2"><strong>Key Insights:</strong></p>
                          <ul className="list-disc list-inside space-y-1">
                            {keyInsights.map((insight, index) => (
                              <li key={index} className="text-sm text-neutral-700 dark:text-neutral-300">{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Matched Skills */}
                    {matchedSkills.length > 0 && (
                      <div className="surface-card p-4 border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20">
                        <h6 className="font-semibold text-green-900 dark:text-green-100 mb-3">✅ Skills & Experience Matches</h6>
                        <ul className="space-y-2">
                          {matchedSkills.map((skill, index) => (
                            <li key={index} className="text-sm text-green-800 dark:text-green-200 flex items-start">
                              <span className="text-green-600 dark:text-green-400 mr-2">•</span>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {missingSkills.length > 0 && (
                      <div className="surface-card p-4 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20">
                        <h6 className="font-semibold text-red-900 dark:text-red-100 mb-3">❌ Skill Gaps Identified</h6>
                        <ul className="space-y-2">
                          {missingSkills.map((skill, index) => (
                            <li key={index} className="text-sm text-red-800 dark:text-red-200 flex items-start">
                              <span className="text-red-600 dark:text-red-400 mr-2">•</span>
                              {skill}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Test Recommendations */}
                    {suggestedTests.length > 0 && (
                      <div className="surface-card p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
                        <div className="flex items-center justify-between mb-3">
                          <h6 className="font-semibold text-blue-900 dark:text-blue-100">🎯 Suggested Skills Tests</h6>
                          <button
                            onClick={() => navigate('/test')}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Take Tests
                          </button>
                        </div>
                        <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                          Improve your profile by completing these skills tests:
                        </p>
                        <ul className="space-y-2">
                          {suggestedTests.map((test, index) => (
                            <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start">
                              <span className="text-blue-600 dark:text-blue-400 mr-2">•</span>
                              {test}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Completed Tests */}
                    {completedTests.length > 0 && (
                      <div className="surface-card p-4 border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/20">
                        <h6 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">🏆 Completed Skills Tests</h6>
                        <div className="grid gap-3">
                          {completedTests.map((test, index) => (
                            <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg">
                              <div>
                                <p className="font-medium text-purple-900 dark:text-purple-100">{test.skill}</p>
                                <p className="text-sm text-purple-700 dark:text-purple-300">{test.date}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                                test.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                test.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                              }`}>
                                {test.score}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              {job.analysis && (
                <div className="mt-4 bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="job-analysis-content">
                  <h6 className="font-semibold mb-3 text-neutral-900 dark:text-neutral-100">Analysis</h6>
                  <div className="prose dark:prose-invert max-w-none text-sm">
                    <div dangerouslySetInnerHTML={{ __html: job.analysis.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'interview-prep' && (
            <div>
              <button 
                className="btn-primary mb-4" 
                onClick={handleInterviewPrep}
                disabled={isPrepping || !hasDescription}
                title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                data-testid="generate-interview-prep-button"
              >
                {isPrepping ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : 'Generate Interview Prep'}
              </button>
              {interviewPrep && (
                <div className="space-y-4">
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="company-overview-section">
                    <h6 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Company Overview</h6>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300">{interviewPrep.company_overview}</p>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="talking-points-section">
                    <h6 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Talking Points</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.talking_points?.map((point, i) => <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300">{point}</li>)}
                    </ul>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="technical-questions-section">
                    <h6 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Technical Questions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.technical_questions?.map((q, i) => <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300">{q}</li>)}
                    </ul>
                  </div>
                  <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700" data-testid="behavioral-questions-section">
                    <h6 className="font-semibold mb-2 text-neutral-900 dark:text-neutral-100">Behavioral Questions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.behavioral_questions?.map((q, i) => <li key={i} className="text-sm text-neutral-700 dark:text-neutral-300">{q}</li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cover-letter' && (
            <div>
              <button 
                className="btn-primary mb-4" 
                onClick={handleGenerateCoverLetter}
                disabled={isGeneratingLetter || !hasDescription}
                title={!hasDescription ? 'Please analyze the job first to get the description' : ''}
                data-testid="generate-cover-letter-button"
              >
                {isGeneratingLetter ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                    Generating...
                  </>
                ) : 'Generate Cover Letter'}
              </button>
              {coverLetter && (
                <textarea
                  className="w-full h-96 p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 resize-none font-mono text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                  value={coverLetter}
                  readOnly
                  data-testid="cover-letter-textarea"
                />
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <NotesTab application={job} />
          )}
        </div>
      </div>
    </div>
  );
};

export default JobAnalysisPage;
