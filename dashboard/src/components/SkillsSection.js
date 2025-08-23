import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { WrenchScrewdriverIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SkillsSection = ({ skills, onSave }) => {
  // Get dynamic default category
  const getDefaultCategory = () => {
    const categories = [...new Set(skills.map(skill => skill.category))];
    return categories.length > 0 ? categories[0] : 'Professional Skills';
  };
  
  const [newSkill, setNewSkill] = useState({ name: '', category: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Update default category when skills change
  useEffect(() => {
    const defaultCat = getDefaultCategory();
    if (!newSkill.category || newSkill.category === '') {
      setNewSkill(prev => ({ ...prev, category: defaultCat }));
    }
  }, [skills]);

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.category) {
      toast.warn('Please enter a skill name and category.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await axios.post('/api/profile/skills', newSkill);
      onSave(res.data);
      setNewSkill({ name: '', category: getDefaultCategory() });
      toast.success('Skill added!');
    } catch (error) {
      toast.error('Failed to add skill.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSkill = async (id) => {
    if (window.confirm('Are you sure you want to delete this skill?')) {
      try {
        const res = await axios.delete(`/api/profile/skills/${id}`);
        onSave(res.data);
        toast.success('Skill deleted!');
      } catch (error) {
        toast.error('Failed to delete skill.');
      }
    }
  };

  const groupedSkills = skills.reduce((acc, skill) => {
    (acc[skill.category] = acc[skill.category] || []).push(skill);
    return acc;
  }, {});

  // Get unique categories from existing skills for the dropdown
  const existingCategories = [...new Set(skills.map(skill => skill.category))].sort();
  const availableCategories = existingCategories.length > 0 
    ? existingCategories 
    : ['Professional Skills']; // Fallback if no skills exist

  // Set default category for new skills
  const defaultCategory = availableCategories[0] || 'Professional Skills';

  return (
    <div className="glass-card animate-fade-in">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <WrenchScrewdriverIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Skills</h3>
        </div>
      </div>
      <div className="p-6">
        <div className="space-y-6">
          {/* Skills Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(groupedSkills).map(([category, categorySkills]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {categorySkills.map(skill => (
                    <div key={skill.id} className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 transition-all duration-200 hover:shadow-sm">
                      <span>{skill.name}</span>
                      <button 
                        onClick={() => handleDeleteSkill(skill.id)} 
                        className="ml-2 p-0.5 hover:bg-blue-200 hover:dark:bg-blue-800/50 rounded-full transition-colors duration-200 group"
                        title="Remove skill"
                      >
                        <XMarkIcon className="w-3 h-3 text-blue-600 dark:text-blue-400 group-hover:text-red-600 dark:group-hover:text-red-400" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Add New Skill Form */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Skill</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skill Name</label>
                <input 
                  type="text" 
                  value={newSkill.name} 
                  onChange={e => setNewSkill({...newSkill, name: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="e.g., React"
                  disabled={isLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select 
                  value={newSkill.category} 
                  onChange={e => setNewSkill({...newSkill, category: e.target.value})} 
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  disabled={isLoading}
                >
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                  {!availableCategories.includes('Professional Skills') && (
                    <option value="Professional Skills">Professional Skills</option>
                  )}
                  {!availableCategories.includes('Other') && (
                    <option value="Other">Other</option>
                  )}
                </select>
              </div>
              <div>
                <button 
                  onClick={handleAddSkill} 
                  disabled={isLoading || !newSkill.name.trim()}
                  className="btn-primary w-full px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="spinner"></div>
                      <span>Adding...</span>
                    </div>
                  ) : (
                    'Add Skill'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkillsSection;
