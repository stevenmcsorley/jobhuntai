import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  AcademicCapIcon, 
  CalendarDaysIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  PlayCircleIcon,
  PauseCircleIcon,
  ChartBarIcon,
  PlusIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  XMarkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const ReEducationPage = () => {
  const [currentProgram, setCurrentProgram] = useState(null);
  const [timetable, setTimetable] = useState(null);
  const [progress, setProgress] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateProgram, setShowCreateProgram] = useState(false);
  const [showSkillManager, setShowSkillManager] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    fetchCurrentProgram();
    fetchWeeklyTimetable();
  }, [weekOffset]);

  const fetchCurrentProgram = async () => {
    try {
      const response = await axios.get('/api/development/programs/current');
      setCurrentProgram(response.data.data);
      
      if (response.data.data) {
        fetchProgress();
      } else {
        setShowCreateProgram(true);
      }
    } catch (error) {
      console.error('Error fetching current program:', error);
      toast.error('Failed to load development program');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchWeeklyTimetable = async () => {
    try {
      const response = await axios.get(`/api/development/timetable?week=${weekOffset}`);
      setTimetable(response.data.data);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    }
  };

  const fetchProgress = async () => {
    try {
      const response = await axios.get('/api/development/programs/current/progress');
      setProgress(response.data.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  const createProgram = async (programData) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/api/development/programs', programData);
      toast.success(response.data.message);
      setShowCreateProgram(false);
      fetchCurrentProgram();
    } catch (error) {
      console.error('Error creating program:', error);
      toast.error('Failed to create development program');
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (taskId, completionData) => {
    try {
      await axios.post(`/api/development/tasks/${taskId}/complete`, completionData);
      toast.success('Task completed!');
      fetchWeeklyTimetable();
      fetchProgress();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Failed to complete task');
    }
  };

  const updateTaskStatus = async (taskId, status) => {
    try {
      await axios.patch(`/api/development/tasks/${taskId}`, { status });
      fetchWeeklyTimetable();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const generateWeeklyTasks = async (weekNumber) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/development/programs/current/weeks/${weekNumber}/generate-tasks`);
      toast.success(response.data.message);
      fetchWeeklyTimetable();
    } catch (error) {
      console.error('Error generating weekly tasks:', error);
      toast.error('Failed to generate weekly tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const addSkillToProgram = async (skillName) => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/development/programs/current/skills`, { 
        skillName: skillName.trim() 
      });
      toast.success(`Added ${skillName} to program`);
      setNewSkill('');
      fetchProgress();
    } catch (error) {
      console.error('Error adding skill:', error);
      toast.error(error.response?.data?.message || 'Failed to add skill');
    } finally {
      setIsLoading(false);
    }
  };

  const removeSkillFromProgram = async (skillName) => {
    try {
      setIsLoading(true);
      const response = await axios.delete(`/api/development/programs/current/skills/${encodeURIComponent(skillName)}`);
      toast.success(`Removed ${skillName} from program`);
      fetchProgress();
    } catch (error) {
      console.error('Error removing skill:', error);
      toast.error(error.response?.data?.message || 'Failed to remove skill');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateAllTasks = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`/api/development/programs/current/regenerate-all-tasks`);
      toast.success('All tasks have been regenerated with updated skills');
      fetchWeeklyTimetable();
      fetchProgress();
    } catch (error) {
      console.error('Error regenerating tasks:', error);
      toast.error('Failed to regenerate tasks');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="spinner mx-auto mb-4"></div>
          <p className="text-neutral-600 dark:text-neutral-400">Loading your development program...</p>
        </div>
      </div>
    );
  }

  if (showCreateProgram) {
    return <CreateProgramForm onSubmit={createProgram} onCancel={() => setShowCreateProgram(false)} />;
  }

  if (!currentProgram) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AcademicCapIcon className="w-16 h-16 mx-auto text-neutral-400 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">No Development Program</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mb-6">
            Create a personalized learning program based on your CV skills and market demands.
          </p>
          <button 
            onClick={() => setShowCreateProgram(true)}
            className="btn-primary"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Learning Program
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        
        {/* Header */}
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-indigo-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-indigo-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Re-Education Program</h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Structured skills development based on your CV and market demands
              </p>
              <div className="flex items-center space-x-4 text-sm text-neutral-500 dark:text-neutral-400">
                <span className="flex items-center">
                  <AcademicCapIcon className="w-4 h-4 mr-1" />
                  {currentProgram.program.title}
                </span>
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  Week {Math.floor((Date.now() - new Date(currentProgram.program.start_date)) / (7 * 24 * 60 * 60 * 1000)) + 1} of {currentProgram.program.weeks_duration}
                </span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowCreateProgram(true)}
                className="btn-secondary"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Create New Program
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {progress && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="surface-card p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {Math.round((progress.overallStats.completed_tasks / progress.overallStats.total_tasks) * 100)}%
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">Overall Progress</div>
            </div>
            <div className="surface-card p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {progress.overallStats.completed_tasks}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Tasks Completed</div>
            </div>
            <div className="surface-card p-6 text-center">
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {Math.round((progress.overallStats.total_actual_minutes || 0) / 60)}h
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">Study Hours</div>
            </div>
            <div className="surface-card p-6 text-center">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {progress.skillProgress.length}
              </div>
              <div className="text-sm text-orange-700 dark:text-orange-300">Skills in Focus</div>
            </div>
          </div>
        )}

        {/* Weekly Timetable */}
        {timetable && (
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <CalendarDaysIcon className="w-6 h-6 mr-2 text-indigo-600" />
                Weekly Timetable
              </h3>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => setWeekOffset(weekOffset - 1)}
                  className="btn-secondary p-2"
                  title="Previous week"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                </button>
                <span className="text-sm text-neutral-600 dark:text-neutral-400">
                  Week of {new Date(timetable.weekOf).toLocaleDateString()}
                </span>
                <button 
                  onClick={() => setWeekOffset(weekOffset + 1)}
                  className="btn-secondary p-2"
                  title="Next week"
                >
                  <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Check if week has any tasks */}
            {timetable && Object.values(timetable.timetable).some(dayTasks => dayTasks.length > 0) ? (
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
                {Object.entries(timetable.timetable).map(([day, tasks]) => (
                  <div key={day} className="space-y-3">
                    <div className="text-sm font-medium text-neutral-700 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700 pb-2">
                      {day}
                    </div>
                    <div className="space-y-2 min-h-[200px]">
                      {tasks.map(task => (
                        <TaskCard 
                          key={task.id}
                          task={task}
                          onComplete={completeTask}
                          onStatusChange={updateTaskStatus}
                        />
                      ))}
                      {tasks.length === 0 && (
                        <div className="text-xs text-neutral-400 dark:text-neutral-500 italic text-center py-8">
                          No tasks scheduled
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-sm mx-auto">
                  <CalendarDaysIcon className="w-12 h-12 mx-auto text-neutral-400 mb-4" />
                  <h4 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                    No Tasks Generated Yet
                  </h4>
                  <p className="text-neutral-600 dark:text-neutral-400 mb-6 text-sm">
                    Click the button below to generate personalized daily tasks for this week based on your learning program.
                  </p>
                  <button
                    onClick={() => generateWeeklyTasks(timetable.weekNumber)}
                    disabled={isLoading}
                    className="btn-primary"
                  >
                    <PlusIcon className="w-5 h-5 mr-2" />
                    {isLoading ? 'Generating...' : 'Generate This Week\'s Tasks'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Skills Progress */}
        {progress && progress.skillProgress.length > 0 && (
          <div className="surface-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-green-600" />
                Skills Progress
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowSkillManager(!showSkillManager)}
                  className="btn-secondary text-sm"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Manage Skills
                </button>
                <button
                  onClick={regenerateAllTasks}
                  disabled={isLoading}
                  className="btn-primary text-sm"
                  title="Regenerate all tasks with current skills"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  {isLoading ? 'Regenerating...' : 'Regenerate Tasks'}
                </button>
              </div>
            </div>

            {/* Skill Management Panel */}
            {showSkillManager && (
              <div className="bg-neutral-50 dark:bg-neutral-700/30 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-3 mb-4">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Enter new skill name..."
                    className="flex-1 px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && newSkill.trim()) {
                        addSkillToProgram(newSkill);
                      }
                    }}
                  />
                  <button
                    onClick={() => newSkill.trim() && addSkillToProgram(newSkill)}
                    disabled={!newSkill.trim() || isLoading}
                    className="btn-primary text-sm px-4"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Skill
                  </button>
                </div>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  Add skills from your CV or new ones you want to focus on. After changes, click "Regenerate Tasks" to update your weekly schedule.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {progress.skillProgress.map(skill => (
                <div key={skill.skill_name} className="bg-neutral-50 dark:bg-neutral-700/50 rounded-lg p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-neutral-900 dark:text-white">{skill.skill_name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-neutral-600 dark:text-neutral-400">
                        {Math.round(skill.completion_percentage)}%
                      </span>
                      <button
                        onClick={() => removeSkillFromProgram(skill.skill_name)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-all"
                        title={`Remove ${skill.skill_name}`}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-600 rounded-full h-2 mb-3">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${skill.completion_percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600 dark:text-neutral-400">
                    <span>{skill.completed_tasks}/{skill.total_tasks} tasks</span>
                    <span>{Math.round((skill.actual_study_minutes || 0) / 60)}h studied</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ task, onComplete, onStatusChange }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);
  const [completionData, setCompletionData] = useState({
    actualMinutes: task.estimated_minutes,
    satisfactionRating: 5,
    notes: ''
  });

  const getStatusColor = (task) => {
    if (task.task_type === 'test') {
      // For tests, show status based on actual test completion/scores
      if (task.test_completed && task.test_score >= 70) {
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      } else if (task.test_completed && task.test_score < 70) {
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      } else {
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
      }
    }
    
    // For non-test tasks, use regular status
    const colors = {
      pending: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      skipped: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[task.status] || colors.pending;
  };

  const getStatusText = (task) => {
    if (task.task_type === 'test') {
      if (task.test_completed && task.test_score >= 70) {
        return `passed (${task.test_score}%)`;
      } else if (task.test_completed && task.test_score < 70) {
        return `failed (${task.test_score}%)`;
      } else {
        return 'not taken';
      }
    }
    return task.status.replace('_', ' ');
  };

  const getTypeIcon = (type) => {
    const icons = {
      study: '📚',
      practice: '💻',
      test: '✅',
      project: '🚀',
      review: '📝'
    };
    return icons[type] || '📚';
  };

  const handleComplete = () => {
    onComplete(task.id, completionData);
    setShowDetails(false);
  };

  const handleTakeTest = () => {
    // Navigate to test hub with the skill in custom topic field
    navigate('/test', { 
      state: { 
        customSkill: task.skill_name,
        taskId: task.id 
      }
    });
  };

  return (
    <div className={`border rounded-lg p-3 transition-all duration-200 ${
      task.status === 'completed' ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' :
      task.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' :
      'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 hover:shadow-sm'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{getTypeIcon(task.task_type)}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task)}`}>
              {getStatusText(task)}
            </span>
          </div>
          <h5 className="text-sm font-medium text-neutral-900 dark:text-white mb-1 line-clamp-2">
            {task.title}
          </h5>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-2">
            {task.skill_name} • {task.estimated_minutes}min
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-2">
        {task.task_type === 'test' && (
          <button
            onClick={handleTakeTest}
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-2 py-1 rounded-md transition-colors flex items-center"
          >
            <BeakerIcon className="w-3 h-3 mr-1" />
            Test
          </button>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-600 space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Time spent (minutes)
            </label>
            <input
              type="number"
              value={completionData.actualMinutes}
              onChange={(e) => setCompletionData({...completionData, actualMinutes: parseInt(e.target.value)})}
              className="w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Satisfaction (1-5)
            </label>
            <select
              value={completionData.satisfactionRating}
              onChange={(e) => setCompletionData({...completionData, satisfactionRating: parseInt(e.target.value)})}
              className="w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800"
            >
              {[1,2,3,4,5].map(rating => (
                <option key={rating} value={rating}>{rating} {'⭐'.repeat(rating)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Notes (optional)
            </label>
            <textarea
              value={completionData.notes}
              onChange={(e) => setCompletionData({...completionData, notes: e.target.value})}
              className="w-full px-2 py-1 text-xs border border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-800 resize-none"
              rows={2}
              placeholder="What did you learn?"
            />
          </div>
          <div className="flex space-x-2">
            <button onClick={handleComplete} className="btn-primary text-xs px-3 py-1">
              Mark Complete
            </button>
            <button onClick={() => setShowDetails(false)} className="btn-secondary text-xs px-3 py-1">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Create Program Form Component
const CreateProgramForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    duration: 12,
    intensity: 'medium',
    focusAreas: [],
    targetRole: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="h-full flex items-center justify-center p-4">
      <div className="surface-card max-w-2xl w-full p-8">
        <div className="text-center mb-8">
          <AcademicCapIcon className="w-12 h-12 mx-auto text-indigo-600 mb-4" />
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
            Create Your Development Program
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            We'll create a personalized learning plan based on your CV skills and market demands.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Program Duration
            </label>
            <select
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
            >
              <option value={4}>4 weeks (Intensive)</option>
              <option value={8}>8 weeks (Focused)</option>
              <option value={12}>12 weeks (Comprehensive)</option>
              <option value={16}>16 weeks (Deep Dive)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Learning Intensity
            </label>
            <select
              value={formData.intensity}
              onChange={(e) => setFormData({...formData, intensity: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
            >
              <option value="low">Low (5 hours/week)</option>
              <option value="medium">Medium (10 hours/week)</option>
              <option value="high">High (15+ hours/week)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Target Role (Optional)
            </label>
            <input
              type="text"
              value={formData.targetRole}
              onChange={(e) => setFormData({...formData, targetRole: e.target.value})}
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800"
              placeholder="e.g., Senior React Developer, Full Stack Engineer"
            />
          </div>

          <div className="flex space-x-4">
            <button type="submit" className="btn-primary flex-1">
              Create Program
            </button>
            <button type="button" onClick={onCancel} className="btn-secondary flex-1">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReEducationPage;