import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const GuidanceDashboard = ({ summary, onSelectTopic }) => (
  <div className="glass-card p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Your Improvement Areas</h2>
    <p className="text-gray-600 dark:text-gray-400 mb-6">Here are the topics you have the lowest average scores in. Click one to get a personalized learning plan.</p>
    <div className="space-y-3">
      {summary.map(item => (
        <button 
          key={item.skill} 
          className="w-full text-left p-4 rounded-lg flex justify-between items-center transition-all duration-200 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => onSelectTopic(item.skill)}
        >
          <span className="font-medium text-gray-800 dark:text-gray-200">{item.skill}</span>
          <span className={`text-sm font-bold px-2 py-1 rounded-full ${
            item.average_score >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            item.average_score >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {Math.round(item.average_score)}%
          </span>
        </button>
      ))}
    </div>
  </div>
);

const LearningPlan = ({ topic, plan, incorrectResults, onBack }) => (
  <div className="glass-card p-6">
    <button 
      className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-6" 
      onClick={onBack}
    >
      <FontAwesomeIcon icon={faArrowLeft} />
      Back to Summary
    </button>
    
    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Learning Plan for: <span className="text-blue-600 dark:text-blue-400">{topic}</span></h2>
    
    <div className="mb-8 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-r-lg">
      <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Summary of Weaknesses</h3>
      <p className="text-blue-700 dark:text-blue-300">{plan.summary_of_weaknesses}</p>
    </div>

    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recommended Learning Plan</h3>
      <ul className="space-y-3 list-decimal list-inside text-gray-700 dark:text-gray-300">
        {plan.learning_plan.map((step, index) => (
          <li key={index} className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-md shadow-sm">{step}</li>
        ))}
      </ul>
    </div>

    <div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Questions You Missed</h3>
      <div className="space-y-6">
        {incorrectResults.map(result => (
          <div key={result.id} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
               <p className="font-semibold text-gray-800 dark:text-gray-200"><strong>Question:</strong> {result.question_text}</p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Your Answer:</p>
                <pre className="p-3 rounded bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-sm whitespace-pre-wrap font-mono">{result.user_answer || 'No answer provided.'}</pre>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Feedback:</p>
                <div className="p-3 rounded bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 text-sm">
                  {result.feedback}
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">Correct Answer:</p>
                <div className="p-3 rounded bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-sm">
                  {result.correct_answer}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    </div>
);

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
    setLearningPlan(null); // Clear previous plan
    setIncorrectResults([]);
    try {
      const res = await axios.get(`/api/guidance/${topic}`);
      setLearningPlan(res.data.guidance);
      setIncorrectResults(res.data.incorrectResults);
    } catch (error) {
      toast.error(`Failed to generate learning plan for ${topic}.`);
      setSelectedTopic(null); // Go back to summary on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedTopic(null);
    setLearningPlan(null);
    setIncorrectResults([]);
  };

  const renderContent = () => {
    if (isLoading) {
      return <LoadingSpinner />;
    }
    if (selectedTopic && learningPlan) {
      return <LearningPlan topic={selectedTopic} plan={learningPlan} incorrectResults={incorrectResults} onBack={handleBack} />;
    }
    if (summary.length > 0) {
        return <GuidanceDashboard summary={summary} onSelectTopic={handleSelectTopic} />;
    }
    return (
        <div className="text-center glass-card p-8">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">No Guidance Available</h3>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
                Complete some tests in the Test Hub to get personalized feedback and learning plans.
            </p>
        </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="glass-card p-6">
          <div>
            <h1 className="text-3xl font-bold text-gradient mb-2">Guidance Hub</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Personalized feedback and learning plans based on your test results.
            </p>
          </div>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default GuidancePage;