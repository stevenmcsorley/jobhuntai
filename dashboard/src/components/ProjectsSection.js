import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { CodeBracketIcon, PlusIcon, TrashIcon, PencilIcon, XMarkIcon, LinkIcon } from '@heroicons/react/24/outline';

const ProjectsSection = ({ projects, onSave }) => {
  const [showModal, setShowModal] = useState(false);
  const [currentProject, setCurrentProject] = useState(null);
  const [formData, setFormData] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleShowModal = (proj = null) => {
    setCurrentProject(proj);
    setFormData(proj ? { ...proj, highlights: proj.highlights || [] } : { highlights: [] });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentProject(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleHighlightChange = (index, value) => {
    const highlights = [...formData.highlights];
    highlights[index] = { ...highlights[index], highlight_text: value };
    setFormData(prev => ({ ...prev, highlights }));
  };

  const addHighlight = () => {
    setFormData(prev => ({ ...prev, highlights: [...prev.highlights, { highlight_text: '' }] }));
  };

  const removeHighlight = (index) => {
    const highlights = formData.highlights.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, highlights }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = currentProject ? `/api/profile/projects/${currentProject.id}` : '/api/profile/projects';
    const method = currentProject ? 'put' : 'post';

    setIsLoading(true);
    try {
      const res = await axios[method](url, formData);
      onSave(res.data);
      toast.success(`Project ${currentProject ? 'updated' : 'added'} successfully!`);
      handleCloseModal();
    } catch (error) {
      toast.error('Failed to save project.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (id) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await axios.delete(`/api/profile/projects/${id}`);
        onSave(res.data);
        toast.success('Project deleted!');
      } catch (error) {
        toast.error('Failed to delete project.');
      }
    }
  };

  return (
    <>
      <div className="glass-card animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <CodeBracketIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Projects</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {projects.map(proj => (
              <div key={proj.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {proj.name}
                      </h4>
                      {proj.url && (
                        <a
                          href={proj.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                          title="Visit project"
                        >
                          <LinkIcon className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    {proj.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                        {proj.description}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button 
                      onClick={() => handleShowModal(proj)} 
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                      title="Edit project"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProject(proj.id)} 
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200"
                      title="Delete project"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                    {proj.highlights.map(h => (
                      <li key={h.id} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        <span>{h.highlight_text}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <button 
              onClick={() => handleShowModal()} 
              className="btn-primary inline-flex items-center space-x-2 px-4 py-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Add Project</span>
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={handleCloseModal}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white" id="modal-title">
                    {currentProject ? 'Edit' : 'Add'} Project
                  </h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Project Name"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <textarea
                      name="description"
                      value={formData.description || ''}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                      placeholder="Project Description"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project URL</label>
                    <input
                      type="text"
                      name="url"
                      value={formData.url || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      placeholder="Project URL (optional)"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">Highlights</h4>
                    <div className="space-y-3">
                      {formData.highlights && formData.highlights.map((h, i) => (
                        <div key={i} className="flex gap-2">
                          <textarea
                            rows={2}
                            value={h.highlight_text}
                            onChange={(e) => handleHighlightChange(i, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                            placeholder="Describe a key feature or technology used"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => removeHighlight(i)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 self-start"
                            disabled={isLoading}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={addHighlight}
                      className="mt-3 btn-secondary inline-flex items-center space-x-2 px-3 py-2"
                      disabled={isLoading}
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Add Highlight</span>
                    </button>
                  </div>
                </form>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="btn-primary w-full sm:w-auto sm:ml-3 px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="spinner"></div>
                      <span>Saving...</span>
                    </div>
                  ) : (
                    'Save Changes'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isLoading}
                  className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0 px-4 py-2"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProjectsSection;