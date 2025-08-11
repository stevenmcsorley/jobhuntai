import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import JobsTable from '../components/JobsTable';
import ViewCvModal from '../components/ViewCvModal';
import AddInterviewModal from '../components/AddInterviewModal';

import { faCheckCircle, faBriefcase, faFileSignature, faComments, faUserCheck } from '@fortawesome/free-solid-svg-icons';

// --- Helper Functions ---
function timeAgo(dateString) {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - d) / 1000);
  if (seconds < 60) return `${seconds}s ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  const months = Math.floor(days / 30.44);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(days / 365.25);
  return `${years}y ago`;
}

const OpportunitiesPage = ({ applications, fetchData, onJobUpdate, onMatchComplete }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewCvContent, setViewCvContent] = useState(null);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const handleViewCv = (job) => {
    setViewCvContent(job);
  };

  const handleCloseCvModal = () => {
    setViewCvContent(null);
  };

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application);
    setIsInterviewModalOpen(true);
  };

  const handleInterviewAdded = () => {
    // Refresh data to show the new interview and status update
    fetchData();
  };

  const opportunities = useMemo(() => {
    const baseOpportunities = applications.filter(app => app.status === 'opportunity');
    if (!searchQuery) {
      return baseOpportunities;
    }
    return baseOpportunities.filter(app => {
      const query = searchQuery.toLowerCase();
      const { title, company, location } = app;
      return (
        title?.toLowerCase().includes(query) ||
        company?.toLowerCase().includes(query) ||
        location?.toLowerCase().includes(query)
      );
    });
  }, [applications, searchQuery]);

  const handleApply = async (applicationId) => {
    toast.info('Submitting application...');
    try {
      await axios.post(`/api/applications/${applicationId}/apply`);
      toast.success('Application submitted successfully!');
      await fetchData();
    } catch (error) {
      toast.error('Failed to submit application.');
      console.error('Error applying:', error);
    }
  };

  const handleDismiss = async (applicationId) => {
    toast.info('Dismissing opportunity...');
    try {
      await axios.patch(`/api/applications/${applicationId}`, { status: 'rejected' });
      toast.warn('Opportunity dismissed.');
      await fetchData();
    } catch (error) {
      toast.error('Failed to dismiss opportunity.');
      console.error('Error dismissing:', error);
    }
  };

  const handleDelete = async (applicationId) => {
    toast.info('Deleting job...');
    try {
      await axios.delete(`/api/applications/${applicationId}`);
      toast.success('Job deleted successfully!');
      await fetchData();
    } catch (error) {
      toast.error('Failed to delete job.');
      console.error('Error deleting job:', error);
    }
  };

  const handleAnalyze = async (jobId) => {
    toast.info('Analyzing job description...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/analyze`);
      onJobUpdate(response.data); // Update the job in the main state
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze job.');
      console.error('Error analyzing job:', error);
    }
  };

  const handleMatch = async (jobId) => {
    toast.info('Matching CV to job...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/match`);
      onMatchComplete(response.data); // Update the match in the main state
      toast.success('CV matching complete!');
      await fetchData(); // Refetch to ensure all data is consistent
    } catch (error) {
      toast.error('Failed to match CV.');
      console.error('Error matching CV:', error);
    }
  };

  const handlePrepInterview = async (jobId) => {
    toast.info('Generating interview prep...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/interview-prep`);
      onJobUpdate(response.data); // Update the job in the main state
      toast.success('Interview prep generated!');
    } catch (error) {
      toast.error('Failed to generate interview prep.');
      console.error('Error generating interview prep:', error);
    }
  };

  const handleGenerateCoverLetter = async (jobId) => {
    toast.info('Generating cover letter...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/generate-cover-letter`);
      onJobUpdate(response.data); // Update the job in the main state
      toast.success('Cover letter generated!');
    } catch (error) {
      toast.error('Failed to generate cover letter.');
      console.error('Error generating cover letter:', error);
    }
  };

  const handleTailorCv = async (jobId) => {
    toast.info('Tailoring CV...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/tailor-cv`);
      onJobUpdate(response.data); // Update the job in the main state
      toast.success('CV tailored successfully!');
    } catch (error) {
      toast.error('Failed to tailor CV.');
      console.error('Error tailoring CV:', error);
    }
  };

  const handleAutoApply = async (jobId) => {
    toast.info('Attempting auto-apply...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/auto-apply`);
      const { status, url, error } = response.data;

      if (status === 'applied') {
        toast.success('Successfully auto-applied!');
      } else if (status === 'external') {
        toast.warn('External application required. Opening page...');
        window.open(url, '_blank');
      } else if (status === 'followup') {
        toast.error(<div>Non-standard application. Opening page for manual review. <br /> <small>{error}</small></div>);
        window.open(url, '_blank');
      }
      fetchData(); // Refresh data to reflect the new application status
    } catch (error) {
      toast.error('Auto-apply failed.');
      console.error('Error during auto-apply:', error);
    }
  };

  const opportunityColumns = [
    { key: 'title', label: 'Job Title', className: 'job-title font-medium', width: '25%', truncate: true },
    { key: 'company', label: 'Company', className: 'company-name', width: '20%', truncate: true },
    { key: 'location', label: 'Location', width: '15%', truncate: true },
    { key: 'scraped_at', label: 'Found', width: '12%', render: job => 
      <span title={new Date(job.scraped_at).toLocaleString()} className="text-gray-600 dark:text-gray-400">
        {timeAgo(job.scraped_at)}
      </span> 
    },
    { key: 'score', label: 'Score', width: '10%', render: job => 
      job.score ? (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          job.score >= 0.9 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' :
          job.score >= 0.8 ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' :
          job.score >= 0.7 ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300' :
          job.score >= 0.6 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' :
          job.score >= 0.5 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300' :
          'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
        }`}>
          {(job.score * 10).toFixed(1)}
        </span>
      ) : '—'
    },
    { key: 'reasons', label: 'Key Reasons', width: '26%', truncate: true, render: job =>
        job.reasons && job.reasons.length > 0 ? (
          <div className="space-y-1">
            {job.reasons.slice(0, 2).map((r, i) => (
              <div key={i} className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                {r}
              </div>
            ))}
            {job.reasons.length > 2 && (
              <div className="text-xs text-gray-500 dark:text-gray-400">+{job.reasons.length - 2} more</div>
            )}
          </div>
        ) : <span className="text-gray-400">—</span>
    },
  ];

  const statsConfig = [
    {
      icon: faBriefcase,
      label: 'Total Jobs',
      calculator: (data) => data.length
    },
    {
      icon: faCheckCircle,
      label: 'Descriptions Fetched',
      calculator: (data) => {
        const analyzedCount = data.filter(d => d.description && d.description.trim() !== '').length;
        return `${analyzedCount} / ${data.length}`;
      }
    },
    {
      icon: faUserCheck,
      label: 'CV Matches',
      calculator: (data) => {
        const count = data.filter(d => d.score !== null && d.score !== undefined).length;
        return `${count} / ${data.length}`;
      }
    },
    {
      icon: faComments,
      label: 'Interview Preps',
      calculator: (data) => {
        const count = data.filter(d => d.interview_prep).length;
        return `${count} / ${data.length}`;
      }
    },
    {
      icon: faFileSignature,
      label: 'Cover Letters',
      calculator: (data) => {
        const count = data.filter(d => d.cover_letter).length;
        return `${count} / ${data.length}`;
      }
    }
  ];

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">Opportunities</h1>
              <p className="text-gray-600 dark:text-gray-400">
                A curated list of high-match jobs found by the Proactive Job Hunter agent.
              </p>
            </div>
            <div className="flex-shrink-0 lg:w-80">
              <input
                type="text"
                className="search-input"
                placeholder="Search by title, company, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <JobsTable
          title="New Opportunities"
          icon="fa-star"
          jobs={opportunities}
          columns={opportunityColumns}
          statsConfig={statsConfig}
          onAnalyze={handleAnalyze}
          onMatch={handleMatch}
          onPrepInterview={handlePrepInterview}
          onGenerateCoverLetter={handleGenerateCoverLetter}
          onScheduleInterview={handleScheduleInterview}
          onTailorCv={handleTailorCv}
          onViewCv={handleViewCv}
          onAutoApply={handleAutoApply}
          onApply={handleApply}
          onDismiss={handleDismiss}
          onDelete={handleDelete}
          onJobUpdate={onJobUpdate}
          onMatchComplete={onMatchComplete}
        />
      </div>

      {viewCvContent && (
        <ViewCvModal
          show={!!viewCvContent}
          onHide={handleCloseCvModal}
          title={`Tailored CV for ${viewCvContent.title}`}
          content={viewCvContent.tailored_cv}
        />
      )}

      {isInterviewModalOpen && (
        <AddInterviewModal
          application={selectedApplication}
          onClose={() => setIsInterviewModalOpen(false)}
          onInterviewAdded={handleInterviewAdded}
        />
      )}
    </div>
  );
};

export default OpportunitiesPage;
