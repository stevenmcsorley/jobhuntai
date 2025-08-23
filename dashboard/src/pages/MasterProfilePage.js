import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SparklesIcon, ArrowDownTrayIcon, CloudArrowUpIcon, ChartBarIcon, DocumentTextIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import ProfileSection from '../components/ProfileSection';
import SkillsSection from '../components/SkillsSection';
import WorkExperienceSection from '../components/WorkExperienceSection';
import ProjectsSection from '../components/ProjectsSection';
import EducationSection from '../components/EducationSection';

const MasterProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showUploadOptions, setShowUploadOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegeneratingCV, setIsRegeneratingCV] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('/api/profile'); 
      setProfileData(res.data);
    } catch (error) {
      setProfileData({ profile: {}, skills: [], work_experiences: [], projects: [], education: [] });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = (updatedData) => {
    fetchProfile();
  };


  const handleRegenerateCV = async () => {
    if (window.confirm('Are you sure you want to regenerate your CV from the current master profile data? This will create a new CV version with the latest profile information.')) {
      setIsRegeneratingCV(true);
      try {
        toast.info('Regenerating CV from master profile data...');
        const response = await axios.post('/api/profile/regenerate-cv');
        toast.success(`CV successfully regenerated! Version ${response.data.cv.version} created with ${response.data.profileAnalyzed.skills_count} skills, ${response.data.profileAnalyzed.experience_count} work experiences, and ${response.data.profileAnalyzed.education_count} education entries.`);
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to regenerate CV from profile.');
        console.error('Error regenerating CV:', error);
      } finally {
        setIsRegeneratingCV(false);
      }
    }
  };

  const handleDownloadProfile = async () => {
    try {
      const response = await axios.get('/api/profile/download', {
        responseType: 'blob', // Important to handle the file download
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'master_profile.txt');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Profile downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download profile.');
      console.error('Error downloading profile:', error);
    }
  };

  const handleExportProfile = async (format, template = 'professional') => {
    if (isProfileEmpty) {
      toast.error('Please add profile information before exporting.');
      return;
    }

    try {
      setIsExporting(true);
      const response = await axios.post(`/api/profile/export/${format}`, 
        { template }, 
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const blob = new Blob([response.data], { 
        type: format === 'pdf' ? 'application/pdf' : 
              format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' :
              'text/html'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const profileName = profileData?.profile?.full_name || 'Profile';
      link.download = `${profileName}_MasterProfile.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Profile exported as ${format.toUpperCase()} successfully!`);
    } catch (error) {
      toast.error(`Failed to export profile as ${format.toUpperCase()}.`);
      console.error('Error exporting profile:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileUpload = async (file) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB.');
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('cv', file);

      const response = await axios.post('/api/cv/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('CV uploaded successfully! The content has been saved to your CV database.');
      
      // Automatically populate profile from uploaded CV
      if (window.confirm('Would you like to automatically populate your Master Profile with the uploaded CV content?')) {
        try {
          toast.info('Parsing your CV with AI... This may take a moment.');
          await axios.post('/api/profile/seed');
          toast.success('Profile successfully updated from your CV!');
          fetchProfile(); // Refresh the data
        } catch (error) {
          toast.error('Failed to update profile from CV.');
          console.error('Error seeding profile:', error);
        }
      }
    } catch (error) {
      toast.error('Failed to upload and process CV.');
      console.error('Error uploading CV:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileInputChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await handleFileUpload(file);
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleAnalyzeProfile = async () => {
    if (isProfileEmpty) {
      toast.error('Please add profile information before analyzing.');
      return;
    }

    try {
      setIsAnalyzing(true);
      const response = await axios.post('/api/cv/analyze', {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAnalysisData(response.data);
      setShowAnalysisModal(true);
    } catch (error) {
      toast.error('Failed to analyze profile.');
      console.error('Error analyzing profile:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner-modern w-8 h-8"></div>
          <span className="ml-3 text-neutral-600 dark:text-neutral-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  const isProfileEmpty = !profileData || !profileData.profile || !profileData.profile.id;

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-indigo-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight" data-testid="master-profile-title">Master Profile</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Your central repository of skills, experiences, and projects for the AI to use
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setShowUploadOptions(!showUploadOptions)}
                className="btn-primary flex items-center space-x-2"
              >
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>Upload CV</span>
              </button>
              <button
                onClick={handleRegenerateCV}
                disabled={isProfileEmpty || isRegeneratingCV}
                className={`flex items-center space-x-2 ${
                  isProfileEmpty || isRegeneratingCV
                    ? 'btn-secondary opacity-50 cursor-not-allowed' 
                    : 'btn-primary bg-green-600 hover:bg-green-700'
                }`}
                data-testid="regenerate-cv-button"
                title="Generate new CV from current master profile data"
              >
                {isRegeneratingCV ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Regenerating...</span>
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="w-5 h-5" />
                    <span>Regenerate CV</span>
                  </>
                )}
              </button>
              <button
                onClick={handleAnalyzeProfile}
                disabled={isProfileEmpty || isAnalyzing}
                className={`flex items-center space-x-2 ${
                  isProfileEmpty || isAnalyzing 
                    ? 'btn-secondary opacity-50 cursor-not-allowed' 
                    : 'btn-primary bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <ChartBarIcon className="w-5 h-5" />
                    <span>Analyze CV</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowExportOptions(!showExportOptions)}
                disabled={isProfileEmpty}
                className="btn-secondary flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Export CV</span>
              </button>
               <button 
                onClick={handleDownloadProfile} 
                className="btn-secondary flex items-center space-x-2"
                disabled={isProfileEmpty}
                data-testid="download-profile-button"
              >
                <DocumentTextIcon className="w-5 h-5" />
                <span>Download as Text</span>
              </button>
            </div>
          </div>
        </div>

        {/* CV Upload Options */}
        {showUploadOptions && (
          <div className="surface-card-elevated p-6 border-l-4 border-blue-500">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Upload CV File</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              Upload your CV to automatically extract and populate your profile data. Supports PDF, DOC, DOCX, and TXT files (max 10MB).
            </p>
            
            <div 
              className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-neutral-400" />
              <div className="mb-4">
                <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  Click to upload a file
                </span>
                <span className="text-neutral-600 dark:text-neutral-400"> or drag and drop</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                PDF, DOC, DOCX, TXT up to 10MB
              </p>
              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="spinner-modern w-6 h-6 mr-2"></div>
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Processing file...</span>
                </div>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />
          </div>
        )}

        {/* Export Options */}
        {showExportOptions && !isProfileEmpty && (
          <div className="surface-card-elevated p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Export Master Profile as CV</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => handleExportProfile('pdf')}
                disabled={isExporting}
                className="flex flex-col items-center p-4 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-red-400 dark:hover:border-red-500 transition-colors group"
              >
                <div className="text-red-600 group-hover:text-red-700 mb-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 18h12V6h-4V2H4v16zm8-14v4h4l-4-4z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">PDF</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">Professional format</span>
              </button>
              
              <button
                onClick={() => handleExportProfile('docx')}
                disabled={isExporting}
                className="flex flex-col items-center p-4 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition-colors group"
              >
                <div className="text-blue-600 group-hover:text-blue-700 mb-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 18h12V6h-4V2H4v16zm8-14v4h4l-4-4z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">DOCX</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">Editable format</span>
              </button>
              
              <button
                onClick={() => handleExportProfile('html')}
                disabled={isExporting}
                className="flex flex-col items-center p-4 border-2 border-neutral-300 dark:border-neutral-600 rounded-lg hover:border-green-400 dark:hover:border-green-500 transition-colors group"
              >
                <div className="text-green-600 group-hover:text-green-700 mb-2">
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 18h12V6h-4V2H4v16zm8-14v4h4l-4-4z"/>
                  </svg>
                </div>
                <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">HTML</span>
                <span className="text-xs text-neutral-600 dark:text-neutral-400">Web format</span>
              </button>
            </div>
            {isExporting && (
              <div className="mt-4 flex items-center justify-center">
                <div className="spinner-modern w-6 h-6 mr-2"></div>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">Exporting profile...</span>
              </div>
            )}
          </div>
        )}

        {/* CV Analysis Modal */}
        {showAnalysisModal && analysisData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">CV Analysis</h2>
                  <button
                    onClick={() => setShowAnalysisModal(false)}
                    className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Overall Score */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">Overall Score</h3>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysisData?.overall_score || 0}/100</p>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-purple-900 dark:text-purple-100">Structure</h3>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{analysisData?.structure_feedback?.score || 0}/100</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-green-900 dark:text-green-100">ATS Score</h3>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{analysisData?.ats_score || 0}/100</p>
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-green-900 dark:text-green-100 mb-3">Strengths</h3>
                    <ul className="space-y-2">
                      {(analysisData?.strengths || []).map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-3">Areas for Improvement</h3>
                    <ul className="space-y-2">
                      {(analysisData?.weaknesses || []).map((weakness, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-neutral-700 dark:text-neutral-300">{weakness}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action Items */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-3">Action Items</h3>
                  <div className="space-y-3">
                    {(analysisData?.action_items || []).map((item, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                        }`}>
                          {item.priority}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{item.task}</p>
                          <p className="text-xs text-neutral-600 dark:text-neutral-400">Estimated time: {item.estimated_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <ProfileSection profile={profileData.profile} onSave={handleSave} />
          <SkillsSection skills={profileData.skills} onSave={handleSave} />
          <WorkExperienceSection experiences={profileData.work_experiences} onSave={handleSave} />
          <ProjectsSection projects={profileData.projects} onSave={handleSave} />
          <EducationSection education={profileData.education} onSave={handleSave} />
        </div>
      </div>
    </div>
  );
};

export default MasterProfilePage;
