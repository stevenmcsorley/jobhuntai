import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { DocumentTextIcon, CloudArrowUpIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

const CVEditorPage = () => {
  const [cvContent, setCvContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState('text');
  const [showProfileUpdate, setShowProfileUpdate] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { isAuthenticated, token } = useAuth();

  useEffect(() => {
    const fetchCv = async () => {
      // Check if user is authenticated and token is set
      if (!isAuthenticated || !token) {
        console.log('Not authenticated or no token, skipping CV fetch');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Fetching CV with token:', token ? 'Present' : 'Missing');
        console.log('Axios headers:', axios.defaults.headers.common);
        const response = await axios.get('/api/cv', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCvContent(response.data.content || '');
      } catch (error) {
        if (error.response?.status === 404) {
          // CV not found is okay - user doesn't have a CV yet
          setCvContent('');
        } else {
          toast.error('Failed to load CV content.');
          console.error('Error fetching CV:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCv();
  }, [isAuthenticated, token]);

  const handleSave = async () => {
    if (!isAuthenticated || !token) {
      toast.error('Please log in to save your CV.');
      return;
    }

    try {
      setIsSaving(true);
      await axios.post('/api/cv', { content: cvContent }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      toast.success('CV saved successfully!');
      
      // Check if this is a significant update (for now, just show after save)
      // In the future, we could compare content length or detect major changes
      if (cvContent && cvContent.length > 100) {
        setShowProfileUpdate(true);
      }
    } catch (error) {
      toast.error('Failed to save CV.');
      console.error('Error saving CV:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const processFile = async (file) => {
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

      setCvContent(response.data.content);
      toast.success('CV uploaded and processed successfully!');
      setShowProfileUpdate(true);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setIsSaving(true);
      await axios.post('/api/profile/seed');
      toast.success('Master profile updated with your latest CV!');
      setShowProfileUpdate(false);
      
      // Ask if user wants to navigate to profile page
      if (window.confirm('Would you like to view your updated master profile?')) {
        navigate('/profile');
      }
    } catch (error) {
      toast.error('Failed to update master profile.');
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const dismissProfileUpdate = () => {
    setShowProfileUpdate(false);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-4">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-300">Loading CV...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-6">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-3">
            <DocumentTextIcon className="h-8 w-8" />
            <div>
              <h1 className="text-2xl font-bold" data-testid="cv-editor-title">CV Editor</h1>
              <p className="text-blue-100">Edit and manage your CV content</p>
            </div>
          </div>
        </div>

        {/* Upload Method Selector */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Upload Method</h2>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={() => setUploadMethod('text')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                uploadMethod === 'text'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              data-testid="text-method-button"
            >
              <DocumentTextIcon className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
              <div className="font-medium text-gray-900 dark:text-gray-100">Text Editor</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Type or paste CV content</div>
            </button>
            <button
              onClick={() => setUploadMethod('file')}
              className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 ${
                uploadMethod === 'file'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
              data-testid="file-method-button"
            >
              <CloudArrowUpIcon className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
              <div className="font-medium text-gray-900 dark:text-gray-100">File Upload</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Upload PDF, DOC, DOCX, or TXT</div>
            </button>
          </div>
        </div>

        {/* File Upload Section */}
        {uploadMethod === 'file' && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Upload CV File</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Upload your CV in PDF, DOC, DOCX, or TXT format (max 10MB)
                </p>
              </div>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              onDragOver={handleDragOver}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <CloudArrowUpIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <div className="mb-4">
                <label className="cursor-pointer">
                  <span className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    Click to upload a file
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                    data-testid="file-upload-input"
                  />
                </label>
                <span className="text-gray-600 dark:text-gray-400"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, DOC, DOCX, TXT up to 10MB
              </p>
              {isUploading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Processing file...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Text Editor Section */}
        {uploadMethod === 'text' && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CV Content</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Your CV is used by the AI to generate cover letters and match you to jobs.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                  isSaving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
                data-testid="save-cv-button"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save CV'
                )}
              </button>
            </div>

            <textarea
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={cvContent}
              onChange={(e) => setCvContent(e.target.value)}
              placeholder="Paste your CV content here..."
              data-testid="cv-content-textarea"
            />
          </div>
        )}

        {/* Profile Update Notification */}
        {showProfileUpdate && (
          <div className="glass-card p-6 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <SparklesIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Update Master Profile?
                </h3>
                <p className="text-blue-800 dark:text-blue-200 mb-4">
                  Your CV has been updated! Would you like to automatically re-populate your Master Profile with the new CV content? 
                  This will help ensure your job applications use the latest information.
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Update Profile
                      </>
                    )}
                  </button>
                  <button
                    onClick={dismissProfileUpdate}
                    className="inline-flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Both methods show content preview */}
        {cvContent && (
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">CV Preview</h2>
              {uploadMethod === 'file' && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white transition-colors ${
                    isSaving
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
                  data-testid="save-cv-preview-button"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    'Save CV'
                  )}
                </button>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                {cvContent}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CVEditorPage;
