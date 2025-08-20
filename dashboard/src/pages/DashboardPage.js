import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../App.css';

import Header from '../components/Header';
import Stats from '../components/Stats';
import JobsTable from '../components/JobsTable';
import DashboardChart from '../components/DashboardChart';
import AddJobModal from '../components/AddJobModal';
import AddInterviewModal from '../components/AddInterviewModal';
import SkeletonLoader from '../components/SkeletonLoader';

import { faCalendarAlt, faExclamationCircle, faBriefcase } from '@fortawesome/free-solid-svg-icons';

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

function DashboardPage({ applications, allJobs, fetchData, onJobUpdate, onMatchComplete }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progressMessage, setProgressMessage] = useState('Running...');
  const [showArchived, setShowArchived] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [isAddJobModalOpen, setIsAddJobModalOpen] = useState(false);
  const [isInterviewModalOpen, setIsInterviewModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [stats, setStats] = useState({ appliedToday: 0, appliedThisWeek: 0, applicationsByDay: [] });
  const [isInitialLoading, setIsInitialLoading] = useState(true);


  useEffect(() => {
    const getStats = async () => {
        try {
            const statsRes = await axios.get('/api/stats');
            setStats(statsRes.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setIsInitialLoading(false);
        }
    };
    getStats();
  }, [applications]);


  const handleRunScrape = async (source) => {
    setIsLoading(true);
    setProgressMessage('Scraping...');
    toast.info(`Starting scrape for ${source}...`);
    try {
      const url = source === 'all' ? '/api/run' : `/api/jobs/scrape?source=${source}`;
      const response = await axios.post(url);
      toast.success(response.data.message);
      setProgressMessage('Refreshing data...');
      await fetchData();
    } catch (error) {
      console.error(`Error running scrape for ${source}:`, error);
      toast.error('An error occurred during the scrape.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunHunt = async () => {
    setIsLoading(true);
    setProgressMessage('Finding Jobs...');
    toast.info('Starting proactive job hunt...');
    try {
      const response = await axios.post('/api/hunt');
      toast.success(response.data.message);
      // No need to call fetchData here, as the hunt runs in the background
    } catch (error) {
      console.error('Error running hunt:', error);
      toast.error('An error occurred during the hunt.');
    } finally {
      // We can set loading to false sooner, as the process is async
      setIsLoading(false);
    }
  };

  const handleScheduleInterview = (application) => {
    setSelectedApplication(application);
    setIsInterviewModalOpen(true);
  };

  const handleInterviewAdded = () => {
    // Refresh data to show the new interview and status update
    fetchData();
  };

  const handleAnalyze = async (jobId) => {
    setAnalyzingId(jobId);
    toast.info('Analyzing job description...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/analyze`);
      onJobUpdate(response.data); // Use the handler from App.js
      toast.success('Analysis complete!');
    } catch (error) {
      console.error(`Error analyzing job ${jobId}:`, error);
      toast.error('Failed to analyze job.');
    } finally {
      setAnalyzingId(null);
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

  const handleTailorCv = async (jobId) => {
    toast.info('Tailoring CV...');
    try {
      const response = await axios.post(`/api/jobs/${jobId}/tailor-cv`);
      if (onJobUpdate) {
        onJobUpdate(response.data);
      }
      toast.success('CV tailored successfully!');
      fetchData(); // Refresh data
    } catch (error) {
      toast.error('Failed to tailor CV.');
      console.error('Error tailoring CV:', error);
    }
  };

  const handleViewCv = (job) => {
    // Open CV in a new window or modal
    if (job.tailored_cv) {
      const newWindow = window.open('', '_blank');
      newWindow.document.write(`
        <html>
          <head><title>Tailored CV - ${job.title}</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
            <h1>Tailored CV for ${job.title}</h1>
            <h2>Company: ${job.company}</h2>
            <hr>
            <pre style="white-space: pre-wrap; font-family: inherit;">${job.tailored_cv}</pre>
          </body>
        </html>
      `);
    } else {
      toast.warn('No tailored CV available for this job.');
    }
  };

  const filteredApplications = applications.filter(app =>
    (!['archived', 'rejected'].includes(app.status) || showArchived) &&
    Object.values(app).some(val =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const appliedJobs = filteredApplications.filter(app => app.status === 'applied');
  const followupJobs = filteredApplications.filter(app => !['applied', 'opportunity'].includes(app.status));

  const lastRun = applications.length > 0 ? timeAgo(applications.reduce((latest, job) =>
    new Date(job.scraped_at) > new Date(latest.scraped_at) ? job : latest
  ).scraped_at) : 'N/A';

  const appliedColumns = [
    { key: 'title', label: 'Job Title', className: 'job-title font-medium', width: '25%', truncate: true },
    { key: 'company', label: 'Company', className: 'company-name', width: '20%', truncate: true },
    { key: 'location', label: 'Location', width: '15%', truncate: true },
    { key: 'applied_at', label: 'Applied', width: '12%', render: job => 
      <span title={new Date(job.applied_at).toLocaleString()} className="text-gray-600 dark:text-gray-400">
        {timeAgo(job.applied_at)}
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
    { key: 'reasons', label: 'Key Reasons', width: '28%', truncate: true, render: job =>
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

  const followupColumns = [
    { key: 'title', label: 'Job Title', className: 'job-title font-medium', width: '22%', truncate: true },
    { key: 'company', label: 'Company', className: 'company-name', width: '18%', truncate: true },
    { key: 'location', label: 'Location', width: '15%', truncate: true },
    { key: 'applied_at', label: 'Added', width: '12%', render: job => 
      <span title={new Date(job.applied_at).toLocaleString()} className="text-gray-600 dark:text-gray-400">
        {timeAgo(job.applied_at)}
      </span> 
    },
    { key: 'status', label: 'Status', width: '12%', render: job => 
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        job.status === 'followup' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
        job.status === 'interview' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      }`}>
        {job.status}
      </span>
    },
    { key: 'score', label: 'Score', width: '8%', render: job => 
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
    { key: 'reasons', label: 'Key Reasons', width: '21%', truncate: true, render: job =>
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

  const followupStatsConfig = [
    {
      icon: faBriefcase,
      label: 'Total Jobs',
      calculator: (data) => data.length
    },
    {
      icon: faExclamationCircle,
      label: 'Needs Action',
      calculator: (data) => data.filter(d => d.status === 'followup').length
    },
    {
      icon: faCalendarAlt,
      label: 'Oldest',
      calculator: (data) => {
        if (data.length === 0) return 'N/A';
        const oldest = data.reduce((oldest, current) => 
          new Date(current.applied_at) < new Date(oldest.applied_at) ? current : oldest
        );
        return timeAgo(oldest.applied_at);
      }
    }
  ];

  const appliedStatsConfig = [
    {
      icon: faBriefcase,
      label: 'Total Jobs',
      calculator: (data) => data.length
    },
    {
      icon: faCalendarAlt,
      label: 'Last Applied',
      calculator: (data) => {
        if (data.length === 0) return 'N/A';
        const latest = data.reduce((latest, current) => 
          new Date(current.applied_at) > new Date(latest.applied_at) ? current : latest
        );
        return timeAgo(latest.applied_at);
      }
    }
  ];

  if (isInitialLoading && (!applications || applications.length === 0)) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
        <div className="max-w-screen-2xl mx-auto space-y-responsive">
          <SkeletonLoader type="header" />
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <SkeletonLoader type="statsCard" count={5} />
          </div>
          
          <SkeletonLoader type="chart" />
          
          <div className="space-y-8">
            <div className="surface-card p-6 space-y-4">
              <SkeletonLoader type="line-medium" />
              <SkeletonLoader type="jobCard" count={3} />
            </div>
            <div className="surface-card p-6 space-y-4">
              <SkeletonLoader type="line-medium" />
              <SkeletonLoader type="jobCard" count={5} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} />
      
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        <Header
          lastRun={lastRun}
          onRunScrape={handleRunScrape}
          onAddJob={() => setIsAddJobModalOpen(true)}
          onRunHunt={handleRunHunt}
          isLoading={isLoading}
          progressMessage={progressMessage}
        />
        
        <Stats
          jobsFound={allJobs.length}
          appliedCount={appliedJobs.length}
          followupCount={followupJobs.length}
          appliedToday={stats.appliedToday}
          appliedThisWeek={stats.appliedThisWeek}
        />
        
        <div className="surface-card p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Application Trends</h3>
            <div style={{ height: '350px' }}>
              <DashboardChart data={stats.applicationsByDay} />
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <input
            type="text"
            className="search-input flex-1 max-w-md"
            placeholder="Search for jobs by title, company, or location…"
            onChange={e => setSearchTerm(e.target.value)}
            data-testid="dashboard-search-input"
          />
          <div className="flex items-center space-x-3">
            <input
              className="w-4 h-4 text-blue-600 dark:text-blue-400 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
              type="checkbox"
              id="showArchived"
              checked={showArchived}
              onChange={() => setShowArchived(!showArchived)}
            />
            <label htmlFor="showArchived" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
              Show Archived/Rejected
            </label>
          </div>
        </div>

        <div className="space-y-8">
          <JobsTable 
            title="Follow-up" 
            icon="fa-bell" 
            jobs={followupJobs} 
            columns={followupColumns} 
            statsConfig={followupStatsConfig} 
            onAnalyze={handleAnalyze} 
            analyzingId={analyzingId} 
            onScheduleInterview={handleScheduleInterview} 
            onDelete={handleDelete} 
            onAutoApply={handleAutoApply}
            onTailorCv={handleTailorCv}
            onViewCv={handleViewCv} 
          />
          
          <JobsTable 
            title="Applied Jobs" 
            icon="fa-list-check" 
            jobs={appliedJobs} 
            columns={appliedColumns} 
            statsConfig={appliedStatsConfig} 
            onAnalyze={handleAnalyze} 
            analyzingId={analyzingId} 
            onScheduleInterview={handleScheduleInterview} 
            onDelete={handleDelete} 
            onAutoApply={handleAutoApply}
            onTailorCv={handleTailorCv}
            onViewCv={handleViewCv} 
          />
        </div>
      </div>

      {isAddJobModalOpen && <AddJobModal onClose={() => setIsAddJobModalOpen(false)} onJobAdded={fetchData} />}
      {isInterviewModalOpen && <AddInterviewModal application={selectedApplication} onClose={() => setIsInterviewModalOpen(false)} onInterviewAdded={handleInterviewAdded} />}
    </div>
  );
}

export default DashboardPage;
