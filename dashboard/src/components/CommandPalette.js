import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faThLarge, 
  faStar, 
  faUserAstronaut, 
  faCalendarCheck, 
  faFileAlt, 
  faChartBar, 
  faBullseye, 
  faCog, 
  faUpload, 
  faVial, 
  faGraduationCap,
  faKeyboard,
  faArrowRight,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const commands = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard', description: 'Overview & Stats', icon: faThLarge, path: '/', category: 'Navigation' },
    { id: 'nav-opportunities', label: 'Opportunities', description: 'Job Matches', icon: faStar, path: '/opportunities', category: 'Navigation' },
    { id: 'nav-profile', label: 'Master Profile', description: 'Profile Management', icon: faUserAstronaut, path: '/profile', category: 'Navigation' },
    { id: 'nav-interviews', label: 'Interviews', description: 'Interview Schedule', icon: faCalendarCheck, path: '/interviews', category: 'Navigation' },
    { id: 'nav-cv-editor', label: 'CV Editor', description: 'Resume Builder', icon: faFileAlt, path: '/cv-editor', category: 'Navigation' },
    { id: 'nav-stats', label: 'Stats', description: 'Analytics Dashboard', icon: faChartBar, path: '/stats', category: 'Navigation' },
    { id: 'nav-market-fit', label: 'Market-Fit', description: 'Skills Analysis', icon: faBullseye, path: '/market-fit', category: 'Navigation' },
    { id: 'nav-preferences', label: 'Preferences', description: 'Settings & Config', icon: faCog, path: '/preferences', category: 'Navigation' },
    { id: 'nav-bulk-add', label: 'Bulk Add', description: 'Import Jobs', icon: faUpload, path: '/bulk-add', category: 'Navigation' },
    { id: 'nav-test', label: 'Test Hub', description: 'AI Assessment', icon: faVial, path: '/test', category: 'Navigation' },
    { id: 'nav-guidance', label: 'Guidance Hub', description: 'Learning Path', icon: faGraduationCap, path: '/guidance', category: 'Navigation' },
    
    // Quick Actions
    { id: 'action-scrape', label: 'Start Job Scraping', description: 'Find new opportunities', icon: faBolt, action: 'scrape', category: 'Actions' },
    { id: 'action-analyze', label: 'Analyze Current Jobs', description: 'Run AI analysis', icon: faSearch, action: 'analyze', category: 'Actions' },
    { id: 'action-generate-cv', label: 'Generate Tailored CV', description: 'Create job-specific resume', icon: faFileAlt, action: 'generate-cv', category: 'Actions' },
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description.toLowerCase().includes(query.toLowerCase()) ||
    command.category.toLowerCase().includes(query.toLowerCase())
  );

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((groups, command) => {
    const category = command.category;
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(command);
    return groups;
  }, {});

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        executeCommand(filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const executeCommand = (command) => {
    if (command.path) {
      navigate(command.path);
    } else if (command.action) {
      // Handle custom actions here
      console.log('Executing action:', command.action);
      // You can add specific action handlers here
    }
    onClose();
    setQuery('');
    setSelectedIndex(0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh] animate-fade-in">
      <div className="surface-card-elevated w-full max-w-2xl mx-4 animate-scale-in">
        {/* Search Input */}
        <div className="flex items-center p-4 border-b border-neutral-200 dark:border-slate-700">
          <FontAwesomeIcon icon={faSearch} className="text-neutral-400 w-5 h-5 mr-3" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-slate-400 text-lg"
          />
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-slate-400">
            <kbd className="px-2 py-1 bg-neutral-100 dark:bg-slate-700 rounded">↑↓</kbd>
            <span>navigate</span>
            <kbd className="px-2 py-1 bg-neutral-100 dark:bg-slate-700 rounded">↵</kbd>
            <span>select</span>
            <kbd className="px-2 py-1 bg-neutral-100 dark:bg-slate-700 rounded">esc</kbd>
            <span>close</span>
          </div>
        </div>

        {/* Commands List */}
        <div className="max-h-96 overflow-y-auto scrollbar-modern">
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="p-8 text-center text-neutral-500 dark:text-slate-400">
              <FontAwesomeIcon icon={faSearch} className="w-8 h-8 mb-3 opacity-50" />
              <p>No commands found for "{query}"</p>
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, commands]) => (
              <div key={category} className="p-2">
                <div className="px-3 py-2 text-xs font-semibold text-neutral-500 dark:text-slate-400 uppercase tracking-wide">
                  {category}
                </div>
                {commands.map((command, index) => {
                  const globalIndex = filteredCommands.indexOf(command);
                  const isSelected = globalIndex === selectedIndex;
                  
                  return (
                    <button
                      key={command.id}
                      onClick={() => executeCommand(command)}
                      className={`w-full flex items-center p-3 rounded-lg transition-all duration-150 ${
                        isSelected 
                          ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300' 
                          : 'hover:bg-neutral-50 dark:hover:bg-slate-800/50 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className={`p-2 rounded-lg mr-3 ${
                        isSelected 
                          ? 'bg-violet-500 text-white' 
                          : 'bg-neutral-100 dark:bg-slate-700 text-neutral-600 dark:text-slate-400'
                      }`}>
                        <FontAwesomeIcon icon={command.icon} className="w-4 h-4" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{command.label}</div>
                        <div className="text-sm opacity-75">{command.description}</div>
                      </div>
                      {isSelected && (
                        <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 opacity-50" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-neutral-200 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-slate-400">
            <FontAwesomeIcon icon={faKeyboard} className="w-4 h-4" />
            <span>Tip: Use keyboard shortcuts for faster navigation</span>
          </div>
          <div className="text-xs text-neutral-400 dark:text-slate-500">
            {filteredCommands.length} commands
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;