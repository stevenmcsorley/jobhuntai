import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SparklesIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import ProfileSection from '../components/ProfileSection';
import SkillsSection from '../components/SkillsSection';
import WorkExperienceSection from '../components/WorkExperienceSection';
import ProjectsSection from '../components/ProjectsSection';
import EducationSection from '../components/EducationSection';

const MasterProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleSeedProfile = async () => {
    if (window.confirm('Are you sure you want to automatically populate your profile from cv.txt? This will overwrite any existing data.')) {
      toast.info('Parsing your CV with AI... This may take a moment.');
      try {
        await axios.post('/api/profile/seed');
        toast.success('Profile successfully seeded from your CV!');
        fetchProfile(); // Refresh the data
      } catch (error) {
        toast.error('Failed to seed profile from CV.');
        console.error('Error seeding profile:', error);
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

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-thin p-6">
        <div className="flex items-center justify-center min-h-96">
          <div className="spinner"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  const isProfileEmpty = !profileData || !profileData.profile || !profileData.profile.id;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-card p-6">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gradient mb-2">Master Profile</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Your central repository of skills, experiences, and projects for the AI to use.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isProfileEmpty && (
                <button 
                  onClick={handleSeedProfile} 
                  className="btn-primary flex items-center space-x-2 bg-green-600 hover:bg-green-700"
                >
                  <SparklesIcon className="w-5 h-5" />
                  <span>Import from cv.txt</span>
                </button>
              )}
               <button 
                onClick={handleDownloadProfile} 
                className="btn-secondary flex items-center space-x-2"
                disabled={isProfileEmpty}
              >
                <ArrowDownTrayIcon className="w-5 h-5" />
                <span>Download Profile</span>
              </button>
            </div>
          </div>
        </div>

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
