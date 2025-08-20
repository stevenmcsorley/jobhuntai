import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faArrowTrendUp, faArrowTrendDown, faMinus, faClock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

const GuidancePage = () => {
  const [summary, setSummary] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [learningPlan, setLearningPlan] = useState(null);
  const [incorrectResults, setIncorrectResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get('/api/guidance/summary');
        setSummary(res.data);
      } catch (error) {
        toast.error("Failed to load guidance summary.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const handleSelectTopic = async (topic) => {
    setIsLoading(true);
    setSelectedTopic(topic);
    setLearningPlan(null);
    setIncorrectResults([]);
    try {
      const res = await axios.get(`/api/guidance/${topic}`);
      setLearningPlan({ plan: res.data.guidance, analytics: res.data.analytics });
      setIncorrectResults(res.data.incorrectResults);
    } catch (error) {
      toast.error(`Failed to generate learning plan for ${topic}.`);
      setSelectedTopic(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setLearningPlan(null);
    setIncorrectResults([]);
  };

  if (isLoading) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6">
        <div className="max-w-7xl mx-auto space-y-responsive">
          <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-emerald-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-900/10">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Guidance Hub</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">Loading personalized guidance...</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center items-center h-64">
            <div className="spinner-modern w-16 h-16"></div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedTopic && learningPlan) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-responsive">
          <div className="surface-card-elevated p-8">
            <button 
              className="btn-secondary inline-flex items-center gap-2 mb-6" 
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Back to Summary
            </button>
            
            <h2 className="text-display-lg text-neutral-900 dark:text-white font-bold mb-6">
              Learning Plan for: <span className="text-gradient-primary">{selectedTopic}</span>
            </h2>
            
            <div className="mb-8 surface-card-soft p-6 border-l-4 border-violet-500">
              <h3 className="text-lg font-semibold text-violet-800 dark:text-violet-200 mb-3">Summary of Weaknesses</h3>
              <p className="text-violet-700 dark:text-violet-300">{learningPlan.plan.summary_of_weaknesses}</p>
            </div>

            {learningPlan.plan.learning_plan && (
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4 flex items-center space-x-2">
                  <span>📚</span><span>Learning Plan</span>
                </h3>
                <div className="space-y-3">
                  {learningPlan.plan.learning_plan.map((step, index) => (
                    <div key={index} className="surface-card-soft p-4 hover:scale-[1.01] transition-all duration-200">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-violet-600 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {index + 1}
                        </div>
                        <div className="text-neutral-700 dark:text-neutral-300">
                          {typeof step === 'string' ? step : step.step || step}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">Questions You Missed</h3>
              <div className="space-y-6">
                {incorrectResults.map(result => (
                  <div key={result.id} className="surface-card overflow-hidden">
                    <div className="p-4 surface-card-soft">
                       <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                         <strong>Question:</strong> {result.question_text}
                       </p>
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Your Answer:</p>
                        <pre className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm whitespace-pre-wrap font-mono">
                          {result.user_answer || 'No answer provided.'}
                        </pre>
                      </div>
                      
                      <div>
                        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Feedback:</p>
                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm">
                          {result.feedback}
                        </div>
                      </div>

                      <div>
                        <p className="font-medium text-neutral-700 dark:text-neutral-300 mb-2">Correct Answer:</p>
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-sm">
                          {result.correct_answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (summary.length > 0) {
    return (
      <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
        <div className="max-w-7xl mx-auto space-y-responsive">
          <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-emerald-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-900/10">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Guidance Hub</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                  Personalized feedback and learning plans based on your test results
                </p>
              </div>
            </div>
          </div>
          <div className="surface-card p-6">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">Your Improvement Areas</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              Here are the topics you have the lowest average scores in. Click one to get a personalized learning plan.
            </p>
            <div className="space-y-3">
              {summary.map(item => (
                <button 
                  key={item.skill} 
                  className="w-full text-left p-4 surface-card-soft hover:scale-[1.02] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                  onClick={() => handleSelectTopic(item.skill)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <span className="font-medium text-neutral-800 dark:text-neutral-200">{item.skill}</span>
                      {item.progress && (
                        <div className="text-xs text-neutral-500 mt-1">
                          <FontAwesomeIcon 
                            icon={item.progress.trend === 'improving' ? faArrowTrendUp : 
                                  item.progress.trend === 'declining' ? faArrowTrendDown : faMinus} 
                            className={`mr-1 ${
                              item.progress.trend === 'improving' ? 'text-emerald-600' :
                              item.progress.trend === 'declining' ? 'text-red-600' : 'text-neutral-500'
                            }`}
                          />
                          {item.progress.trend}
                        </div>
                      )}
                    </div>
                    <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                      item.average_score >= 70 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      item.average_score >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {Math.round(item.average_score)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-emerald-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-emerald-900/10">
          <div className="space-y-3">
            <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Guidance Hub</h1>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                Personalized feedback and learning plans based on your test results
              </p>
            </div>
          </div>
        </div>
        <div className="text-center surface-card p-8">
          <div className="mx-auto w-16 h-16 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">No Guidance Available</h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Complete some tests in the Test Hub to get personalized feedback and learning plans.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuidancePage;