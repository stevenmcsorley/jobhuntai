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
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading job details...</span>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The job you're looking for doesn't exist.</p>
          <button 
            onClick={() => navigate('/')} 
            className="btn-primary"
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
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors duration-200"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gradient">{job.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-gray-600 dark:text-gray-300 mt-2">
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
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap flex items-center py-3 px-1 border-b-2 font-medium text-sm transition-all duration-200 ${
                    activeTab === tab.id 
                      ? 'border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-300 dark:hover:text-gray-100 dark:hover:border-gray-400'
                  }`}
                >
                  <tab.icon className="w-5 h-5 mr-2" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="glass-card p-6">
          {/* Status Updater */}
          <div className="flex items-center justify-end mb-6">
            <StatusUpdater application={job} onUpdate={handleLocalApplicationUpdate} />
          </div>

          {/* Tab Content */}
          {activeTab === 'description' && (
            <div>
              <textarea
                className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none font-mono text-sm"
                value={editableDescription}
                onChange={(e) => setEditableDescription(e.target.value)}
                placeholder="Job description will appear here..."
              />
              <div className="flex space-x-3">
                <button 
                  className="btn-primary" 
                  onClick={handleDescriptionSave}
                  disabled={analyzing}
                >
                  {analyzing ? 'Saving...' : 'Save Description'}
                </button>
                <button 
                  className="btn-secondary" 
                  onClick={handleExtractSkills}
                  disabled={isExtractingSkills || !hasDescription}
                  title={!hasDescription ? 'Please save a description first' : ''}
                >
                  {isExtractingSkills ? 'Extracting...' : 'Extract Skills'}
                </button>
              </div>
              {skills.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Extracted Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <div key={index} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 transition-all duration-200 hover:shadow-sm">
                        <span>{skill}</span>
                        <button 
                          onClick={() => handleDeleteSkill(index)} 
                          className="ml-2 p-0.5 hover:bg-blue-200 hover:dark:bg-blue-800/50 rounded-full transition-colors duration-200 group"
                          title="Remove skill"
                        >
                          <XMarkIcon className="w-3 h-3 text-blue-600 dark:text-blue-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
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
                      className="w-full md:w-1/3 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
              >
                {isGeneratingCompanyInfo ? 'Generating...' : 'Generate Company Info'}
              </button>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
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
              >
                {isMatching ? 'Matching...' : 'Run CV Match'}
              </button>
              {matchResult && matchResult.score !== undefined && (() => {
                const normalizeReasons = (val) => {
                  if (!val) return [];
                  if (Array.isArray(val)) return val;
                  if (typeof val === 'string') {
                    // Handle plain text list, markdown fences, or JSON string
                    const cleaned = val.replace(/```json|```/g, '').trim();
                    // If it looks like JSON array or object, try parse
                    if (/^[\\[{]/.test(cleaned)) {
                      try {
                        const parsed = JSON.parse(cleaned);
                        if (Array.isArray(parsed)) return parsed;
                        if (parsed && Array.isArray(parsed.reasons)) return parsed.reasons;
                      } catch {
                        // fall through to split
                      }
                    }
                    // Fallback: split by newlines or semicolons into bullet list
                    return cleaned
                      .split(/\\r?\\n|;|\\u2022|\\*/g)
                      .map(s => s.trim())
                      .filter(Boolean);
                  }
                  if (typeof val === 'object' && Array.isArray(val.reasons)) return val.reasons;
                  return [];
                };
                const reasons = normalizeReasons(matchResult.reasons);
                return (
                  <div className={`glass-card p-4 border-l-4 ${
                    matchResult.score > 0.5 ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  }`}>
                    <h6 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Match Result</h6>
                    <p className="mb-3"><strong>Score:</strong> {(matchResult.score * 100).toFixed(0)}%</p>
                    <div>
                      <strong>Key Reasons:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {reasons.map((reason, index) => (
                          <li key={index} className="text-sm">{reason}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
              {job.analysis && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                  <h6 className="font-semibold mb-3">Analysis</h6>
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
              >
                {isPrepping ? 'Generating...' : 'Generate Interview Prep'}
              </button>
              {interviewPrep && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h6 className="font-semibold mb-2">Company Overview</h6>
                    <p className="text-sm">{interviewPrep.company_overview}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h6 className="font-semibold mb-2">Talking Points</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.talking_points?.map((point, i) => <li key={i} className="text-sm">{point}</li>)}
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h6 className="font-semibold mb-2">Technical Questions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.technical_questions?.map((q, i) => <li key={i} className="text-sm">{q}</li>)}
                    </ul>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
                    <h6 className="font-semibold mb-2">Behavioral Questions</h6>
                    <ul className="list-disc list-inside space-y-1">
                      {interviewPrep.behavioral_questions?.map((q, i) => <li key={i} className="text-sm">{q}</li>)}
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
              >
                {isGeneratingLetter ? 'Generating...' : 'Generate Cover Letter'}
              </button>
              {coverLetter && (
                <textarea
                  className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none font-mono text-sm"
                  value={coverLetter}
                  readOnly
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
