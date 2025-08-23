import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AcademicCapIcon, ClockIcon } from '@heroicons/react/24/outline';
import CodeEditor from '../components/CodeEditor';

// --- Sub-components ---

const frameworkDescriptions = {
  'behavioral_star': 'The STAR method is the industry standard for answering behavioral questions. It focuses on telling a concise, compelling story about a past experience. Use it to structure your answers clearly and effectively.',
  'behavioral_soar': 'The SOAR method is a powerful variation of STAR that is excellent for highlighting your problem-solving and resilience skills. Use it to explicitly call out a challenge you faced and how you overcame it.'
};

const TestConfiguration = ({ onStartTest, topSkills }) => {
  const [skill, setSkill] = useState(topSkills[0] || 'React');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [type, setType] = useState('short_answer');
  const [customSkill, setCustomSkill] = useState('');

  const isBehavioral = type.startsWith('behavioral_');

  const handleStart = () => {
    const finalSkill = isBehavioral ? 'Behavioral' : customSkill || skill;
    const isFromSuggested = !isBehavioral && !customSkill; // True if using suggested dropdown, false if custom
    
    onStartTest({
      skill: finalSkill,
      difficulty: isBehavioral ? 'N/A' : difficulty,
      type,
      isFromSuggested
    });
  };

  return (
    <div className="surface-card p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-gray-100 mb-2">Start a New Test</h2>
        <p className="text-neutral-600 dark:text-gray-300">Test your knowledge in any skill - from practical trades and leadership to technical expertise and creative arts.</p>
      </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-gray-200 mb-2">Test Type</label>
            <select 
              className="input-modern" 
              value={type} 
              onChange={e => setType(e.target.value)}
            >
              <option value="short_answer">Short Answer</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="code_challenge">Practical Challenge</option>
              <option value="behavioral_star">Behavioral (STAR)</option>
              <option value="behavioral_soar">Behavioral (SOAR)</option>
            </select>
          </div>

          {isBehavioral && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                {frameworkDescriptions[type]}
              </p>
            </div>
          )}

          {!isBehavioral && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-200 mb-2">Topic (Suggested from Market Fit)</label>
                <select 
                  className="input-modern" 
                  value={skill} 
                  onChange={e => setSkill(e.target.value)} 
                  disabled={!!customSkill}
                >
                  {topSkills.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-200 mb-2">Or Enter Any Custom Topic</label>
                <input 
                  type="text" 
                  className="input-modern" 
                  placeholder="e.g., Goat Herding, Leadership, Carpentry, Cooking, Photography..."
                  value={customSkill}
                  onChange={e => setCustomSkill(e.target.value)}
                />
                <p className="text-xs text-neutral-500 dark:text-gray-400 mt-1">
                  Test any skill from practical trades to executive leadership to creative arts!
                </p>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-neutral-700 dark:text-gray-200 mb-2">Difficulty</label>
                <select 
                  className="input-modern" 
                  value={difficulty} 
                  onChange={e => setDifficulty(e.target.value)}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          )}
        
          <button 
            className="btn-primary w-full" 
            onClick={handleStart}
          >
            Start Test
          </button>
        </div>
    </div>
  );
};

const ActiveTestSession = ({ session, question, onAnswerSubmit, questionNumber, totalQuestions }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = () => {
    onAnswerSubmit(question.id, answer);
    setAnswer('');
  };

  return (
    <div className="surface-card p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-gray-100">Topic: {session.skill}</span>
          {session.difficulty !== 'N/A' && (
            <span className="text-sm text-neutral-500 dark:text-gray-300">({session.difficulty})</span>
          )}
        </div>
        <span className="text-sm text-neutral-500 dark:text-gray-300">Question {questionNumber} of {totalQuestions}</span>
      </div>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-gray-100 mb-3">Question:</h3>
          <div className="surface-card-soft p-4">
            <p className="text-neutral-700 dark:text-gray-200 whitespace-pre-wrap">
              {question.question_text}
            </p>
          </div>
        </div>
        
        <div>
          <textarea 
            className="textarea-modern h-48 resize-none" 
            value={answer} 
            onChange={e => setAnswer(e.target.value)}
            placeholder="Your answer..."
          />
        </div>
        
        <button 
          className="btn-success w-full" 
          onClick={handleSubmit}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};

const MultipleChoiceTestSession = ({ session, question, onAnswerSubmit, questionNumber, totalQuestions }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const options = question.options ? JSON.parse(question.options) : [];

  const handleSubmit = () => {
    if (selectedOption) {
      onAnswerSubmit(question.id, selectedOption);
      setSelectedOption(null);
    } else {
      toast.warn('Please select an option.');
    }
  };

  return (
    <div className="surface-card p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-gray-100">Topic: {session.skill}</span>
          <span className="text-sm text-neutral-500 dark:text-gray-300">({session.difficulty})</span>
        </div>
        <span className="text-sm text-neutral-500 dark:text-gray-300">Question {questionNumber} of {totalQuestions}</span>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-gray-100 mb-3">Question:</h3>
          <div className="surface-card-soft p-4">
            <p className="text-neutral-700 dark:text-gray-200 whitespace-pre-wrap">
              {question.question_text}
            </p>
          </div>
        </div>
        
        <div className="space-y-3">
          {options.map((option, index) => (
            <label 
              key={index}
              className={`flex items-center p-4 rounded-lg border cursor-pointer transition-all ${
                selectedOption === option 
                  ? 'surface-card-soft border-violet-500 ring-2 ring-violet-200 dark:ring-violet-800' 
                  : 'surface-card-soft border-neutral-300 dark:border-slate-600 hover:border-violet-300 dark:hover:border-violet-700'
              }`}
            >
              <input 
                type="radio" 
                name="mcq-option" 
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                value={option}
                checked={selectedOption === option}
                onChange={() => setSelectedOption(option)}
              />
              <span className="ml-3 text-neutral-900 dark:text-gray-100">{option}</span>
            </label>
          ))}
        </div>
        
        <button 
          className="btn-success w-full" 
          onClick={handleSubmit}
          disabled={!selectedOption}
        >
          Submit Answer
        </button>
      </div>
    </div>
  );
};

const CodeChallengeTestSession = ({ session, question, onAnswerSubmit, questionNumber, totalQuestions }) => {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');

  // Extract initial code from question if it exists
  useEffect(() => {
    if (question?.initial_code) {
      setCode(question.initial_code);
    } else {
      // Set default starter code based on language
      const starterCode = {
        javascript: '// Write your solution here\nfunction solution() {\n    \n}\n\n// Test your solution\nconsole.log(solution());',
        python: '# Write your solution here\ndef solution():\n    pass\n\n# Test your solution\nprint(solution())',
        java: '// Write your solution here\npublic class Solution {\n    public static void main(String[] args) {\n        // Test your solution\n        System.out.println("Hello World");\n    }\n}',
        cpp: '#include <iostream>\nusing namespace std;\n\n// Write your solution here\nint main() {\n    // Test your solution\n    cout << "Hello World" << endl;\n    return 0;\n}'
      };
      setCode(starterCode[language] || starterCode.javascript);
    }
  }, [question, language]);

  const handleSubmit = () => {
    if (!code.trim()) {
      toast.warn('Please write some code before submitting.');
      return;
    }
    onAnswerSubmit(question.id, code);
  };

  return (
    <div className="surface-card p-6">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-neutral-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-neutral-900 dark:text-gray-100">Topic: {session.skill}</span>
          <span className="text-sm text-neutral-500 dark:text-gray-300">({session.difficulty})</span>
        </div>
        <span className="text-sm text-neutral-500 dark:text-gray-300">Question {questionNumber} of {totalQuestions}</span>
      </div>
      
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-gray-100 mb-3">Challenge:</h3>
          <div className="surface-card-soft p-4">
            <p className="text-neutral-700 dark:text-gray-200 whitespace-pre-wrap">
              {question.question_text}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 mb-4">
          <label className="text-sm font-medium text-neutral-700 dark:text-gray-200">Language:</label>
          <select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            className="input-modern w-auto"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        
        <CodeEditor
          language={language}
          initialValue={code}
          onChange={(value) => setCode(value || '')}
          onRun={(code) => console.log('Running code:', code)}
        />
        
        <button 
          className="btn-success w-full flex items-center justify-center space-x-2" 
          onClick={handleSubmit}
        >
          <span>Submit Solution</span>
        </button>
      </div>
    </div>
  );
};

const BehavioralResults = ({ session, results, onRestart, onRetake, incorrectCount }) => {
  const frameworkName = session.type.split('_')[1].toUpperCase();
  
  const parseFeedback = (feedbackString) => {
    try {
      return JSON.parse(feedbackString);
    } catch (e) {
      console.error("Failed to parse feedback JSON:", feedbackString);
      toast.error("Could not display AI feedback due to a formatting error.");
      return null;
    }
  };

  return (
    <div className="card">
      <div className="card-header"><h2>Behavioral Practice Complete! ({frameworkName})</h2></div>
      <div className="card-body">
        <h4 className="card-title">Final Score: <span className="text-primary">{session.score}%</span></h4>
        <hr />
        {results.map(result => {
          const feedback = parseFeedback(result.feedback);
          if (!feedback) return <div key={result.id}>Error displaying result.</div>;

          const components = Object.keys(feedback).filter(k => k.endsWith('_feedback'));

          return (
            <div key={result.id} className="mb-4">
              <h6>Question:</h6>
              <p>{result.question_text}</p>
              <h6>Your Answer:</h6>
              <pre className="p-2 rounded bg-light"><code>{result.user_answer}</code></pre>
              <h6>AI Feedback: <em>{feedback.final_summary}</em></h6>
              <div className="row">
                {components.map(key => {
                  const componentName = key.split('_')[0];
                  return (
                    <div className="col-md-3" key={key}>
                      <strong>{componentName.charAt(0).toUpperCase() + componentName.slice(1)}:</strong>
                      <span className="badge bg-info ms-2">{feedback[key].score}/100</span>
                      <p>{feedback[key].feedback}</p>
                    </div>
                  );
                })}
              </div>
              <hr />
            </div>
          );
        })}
        <button className="btn btn-primary" onClick={onRestart}>Take Another Test</button>
        {incorrectCount > 0 && (
          <button className="btn btn-outline-secondary ms-2" onClick={() => onRetake(session.id)}>
            Retake {incorrectCount} Incorrect Questions
          </button>
        )}
      </div>
    </div>
  );
};

const TestResults = ({ session, results, onRestart, onRetake }) => {
  const incorrectCount = results.filter(r => !r.is_correct).length;
  const unansweredCount = results.filter(r => r.user_answer === null).length;
  const totalIncorrect = incorrectCount + unansweredCount;

  if (session.type && session.type.startsWith('behavioral_')) {
    return <BehavioralResults session={session} results={results} onRestart={onRestart} onRetake={onRetake} incorrectCount={totalIncorrect} />;
  }
  return (
    <div className="glass-card p-6">
      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Test Complete!</h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-lg text-gray-700 dark:text-gray-200">Final Score:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{session.score}%</span>
          </div>
          <div className="text-gray-600 dark:text-gray-300">
            Topic: {session.skill} ({session.difficulty})
          </div>
        </div>
      </div>
      <div className="space-y-6">
        {results.map(result => (
          <div key={result.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Question:</h3>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-wrap">{result.question_text}</p>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Your Answer:</h3>
              <pre className={`p-4 rounded-lg text-sm overflow-x-auto ${
                result.is_correct 
                  ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800'
              }`}>
                <code className={result.is_correct ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                  {result.user_answer || 'No answer provided.'}
                </code>
              </pre>
            </div>
            
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Feedback:</h3>
              <p className="text-gray-700 dark:text-gray-200">{result.feedback}</p>
            </div>
            
            {!result.is_correct && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Correct Answer:</h3>
                <pre className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200 overflow-x-auto">
                  <code>{JSON.parse(result.correct_answer)}</code>
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
          onClick={onRestart}
        >
          Take Another Test
        </button>
        {totalIncorrect > 0 && (
          <button 
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-300 font-medium py-2 px-4 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500" 
            onClick={() => onRetake(session.id)}
          >
            Retake {totalIncorrect} Incorrect Questions
          </button>
        )}
      </div>
    </div>
  );
};

const TestHistory = ({ history, onRetake, onContinue, onDelete }) => (
  <div className="glass-card p-6">
    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">Test History</h2>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Skill</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Difficulty</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Score</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {history.map(session => (
            <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{session.skill}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{session.type}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{session.difficulty}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                {session.score !== null ? (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    session.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    session.score >= 60 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  }`}>
                    {session.score}%
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    In Progress
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                {new Date(session.completed_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                {session.score === null && (
                  <button 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
                    onClick={() => onContinue(session.id)}
                  >
                    Continue
                  </button>
                )}
                {session.score !== null && session.score < 100 && (
                  <button 
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50"
                    onClick={() => onRetake(session.id)}
                  >
                    Retake
                  </button>
                )}
                <button 
                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50"
                  onClick={() => onDelete(session.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const PromptMatrix = ({ prompts }) => (
  <div className="glass-card p-6">
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">AI Prompt Matrix</h2>
      <p className="text-gray-600 dark:text-gray-300">This is a read-only view of the prompts used to generate tests.</p>
    </div>
    <div className="space-y-6">
      {Object.entries(prompts).map(([type, prompt]) => (
        <div key={type}>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </h3>
          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm text-gray-800 dark:text-gray-100 overflow-x-auto">
            <code>{prompt}</code>
          </pre>
        </div>
      ))}
    </div>
  </div>
);

// Main component for the Test Hub
const TestHubPage = () => {
  const [view, setView] = useState('config'); // config, active, results, history, prompts
  const [topSkills, setTopSkills] = useState([]);
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionResults, setSessionResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [prompts, setPrompts] = useState({});
  const [questionCount, setQuestionCount] = useState({ current: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [skillsRes, historyRes, promptsRes] = await Promise.all([
          axios.get('/api/market-fit'),
          axios.get('/api/tests/history'),
          axios.get('/api/tests/prompts')
        ]);
        const skills = skillsRes.data.analysis.slice(0, 10).map(s => s.skill);
        setTopSkills(skills);
        setHistory(historyRes.data);
        setPrompts(promptsRes.data);
      } catch (error) {
        console.error("Could not fetch initial Test Hub data", error);
        toast.error("Failed to load Test Hub data.");
      }
    };
    fetchInitialData();
  }, []);

  const handleStartTest = async (config) => {
    setIsLoading(true);
    toast.info(`Starting ${config.skill} test...`);
    try {
      const res = await axios.post('/api/tests/start', config);
      setSession(res.data.session);
      setCurrentQuestion(res.data.question);
      setQuestionCount({ current: 1, total: 5 }); // Assuming 5 questions
      setView('active');
    } catch (error) {
      toast.error('Failed to start the test session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = async (resultId, answer) => {
    setIsLoading(true);
    try {
      const res = await axios.post('/api/tests/submit-answer', { result_id: resultId, answer });
      toast.success("Answer submitted!");
      
      if (res.data.nextQuestion) {
        setCurrentQuestion(res.data.nextQuestion);
        setQuestionCount(prev => ({ ...prev, current: prev.current + 1 }));
      } else {
        const resultsRes = await axios.get(`/api/tests/sessions/${session.id}`);
        setSession(resultsRes.data.session);
        setSessionResults(resultsRes.data.results);
        setView('results');
        const historyRes = await axios.get('/api/tests/history');
        setHistory(historyRes.data);
      }
    } catch (error) {
      toast.error('Failed to submit answer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetakeTest = async (sessionId) => {
    setIsLoading(true);
    toast.info('Resetting test...');
    try {
      const res = await axios.post(`/api/tests/sessions/${sessionId}/reset-incorrect`);
      setSession(res.data.session);
      setCurrentQuestion(res.data.question);
      setQuestionCount({ current: 1, total: res.data.totalQuestions });
      setView('active');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to start retake session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueTest = async (sessionId) => {
    setIsLoading(true);
    toast.info('Resuming test...');
    try {
      const res = await axios.get(`/api/tests/sessions/${sessionId}/continue`);
      setSession(res.data.session);
      setCurrentQuestion(res.data.question);
      setQuestionCount({ current: res.data.questionNumber, total: res.data.totalQuestions });
      setView('active');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to resume test session.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTest = async (sessionId) => {
    if (window.confirm('Are you sure you want to permanently delete this test session?')) {
      setIsLoading(true);
      try {
        await axios.delete(`/api/tests/sessions/${sessionId}`);
        toast.success('Test session deleted.');
        const historyRes = await axios.get('/api/tests/history');
        setHistory(historyRes.data);
      } catch (error) {
        toast.error('Failed to delete test session.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const renderView = () => {
    switch (view) {
      case 'active':
        if (!session || !currentQuestion) return null;
        
        if (session.type === 'multiple_choice') {
          return (
            <MultipleChoiceTestSession
              session={session}
              question={currentQuestion}
              onAnswerSubmit={handleAnswerSubmit}
              questionNumber={questionCount.current}
              totalQuestions={questionCount.total}
            />
          );
        }
        
        // Helper function to detect if a skill is programming-related
        const isProgrammingSkill = (skill) => {
          const programmingKeywords = [
            'javascript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift',
            'kotlin', 'typescript', 'react', 'vue', 'angular', 'node', 'express', 'django',
            'flask', 'spring', 'laravel', 'rails', 'programming', 'coding', 'development',
            'software', 'algorithm', 'data structure', 'frontend', 'backend', 'fullstack',
            'web development', 'mobile development', 'api', 'database', 'sql', 'nosql',
            'html', 'css', 'git', 'docker', 'kubernetes', 'aws', 'azure', 'devops'
          ];
          
          return programmingKeywords.some(keyword => 
            skill.toLowerCase().includes(keyword.toLowerCase())
          );
        };

        if (session.type === 'code_challenge') {
          // Show code editor only for programming skills, otherwise show regular text challenge
          if (isProgrammingSkill(session.skill)) {
            return (
              <CodeChallengeTestSession
                session={session}
                question={currentQuestion}
                onAnswerSubmit={handleAnswerSubmit}
                questionNumber={questionCount.current}
                totalQuestions={questionCount.total}
              />
            );
          } else {
            // For non-programming practical challenges, use regular text input
            return (
              <ActiveTestSession
                session={session}
                question={currentQuestion}
                onAnswerSubmit={handleAnswerSubmit}
                questionNumber={questionCount.current}
                totalQuestions={questionCount.total}
              />
            );
          }
        }
        
        return (
          <ActiveTestSession 
            session={session} 
            question={currentQuestion} 
            onAnswerSubmit={handleAnswerSubmit}
            questionNumber={questionCount.current}
            totalQuestions={questionCount.total}
          />
        );
      case 'results':
        return session && sessionResults.length > 0 && (
          <TestResults session={session} results={sessionResults} onRestart={() => setView('config')} onRetake={handleRetakeTest} />
        );
      case 'history':
        return <TestHistory history={history} onRetake={handleRetakeTest} onContinue={handleContinueTest} onDelete={handleDeleteTest} />;
      case 'prompts':
        return <PromptMatrix prompts={prompts} />;
      case 'config':
      default:
        return <TestConfiguration onStartTest={handleStartTest} topSkills={topSkills} />;
    }
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-modern p-4 animate-fade-in">
      <div className="max-w-screen-2xl mx-auto space-y-responsive">
        <div className="surface-card-elevated p-8 bg-gradient-to-r from-white via-white to-cyan-50/30 dark:from-slate-800 dark:via-slate-800 dark:to-cyan-900/10">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-6 lg:space-y-0">
            <div className="space-y-3">
              <h1 className="text-display-xl text-gradient-primary font-bold tracking-tight">Test Hub</h1>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                <p className="text-neutral-600 dark:text-gray-300 text-sm">
                  Practice and improve your technical skills with AI-generated questions
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                className={`btn-secondary ${view === 'config' ? 'bg-violet-100 dark:bg-violet-900/50' : ''}`.trim()} 
                onClick={() => setView('config')}
              >
                New Test
              </button>
              <button 
                className={`btn-secondary ${view === 'history' ? 'bg-violet-100 dark:bg-violet-900/50' : ''}`.trim()} 
                onClick={() => setView('history')}
              >
                History
              </button>
              <button 
                className={`btn-secondary ${view === 'prompts' ? 'bg-violet-100 dark:bg-violet-900/50' : ''}`.trim()} 
                onClick={() => setView('prompts')}
              >
                Prompt Matrix
              </button>
            </div>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="spinner-modern w-8 h-8"></div>
            <span className="ml-3 text-neutral-600 dark:text-gray-300">Loading...</span>
          </div>
        ) : (
          renderView()
        )}
      </div>
    </div>
  );
};

export default TestHubPage;