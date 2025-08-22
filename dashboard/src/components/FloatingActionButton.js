import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faBolt, 
  faSearch, 
  faFileAlt, 
  faTimes,
  faKeyboard
} from '@fortawesome/free-solid-svg-icons';

const FloatingActionButton = ({ onCommandPalette }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const actions = [
    {
      id: 'command-palette',
      label: 'Command Palette',
      icon: faKeyboard,
      onClick: () => {
        onCommandPalette();
        setIsExpanded(false);
      },
      color: 'from-violet-500 to-purple-500',
      shortcut: '⌘K'
    },
    {
      id: 'quick-scrape',
      label: 'Quick Scrape',
      icon: faBolt,
      onClick: () => {
        // Handle quick scrape
        console.log('Quick scrape triggered');
        setIsExpanded(false);
      },
      color: 'from-emerald-500 to-green-500'
    },
    {
      id: 'add-job',
      label: 'Add Job',
      icon: faFileAlt,
      onClick: () => {
        // Handle add job
        console.log('Add job triggered');
        setIsExpanded(false);
      },
      color: 'from-cyan-500 to-blue-500'
    },
    {
      id: 'analyze-jobs',
      label: 'Analyze Jobs',
      icon: faSearch,
      onClick: () => {
        // Handle analyze jobs
        console.log('Analyze jobs triggered');
        setIsExpanded(false);
      },
      color: 'from-amber-500 to-orange-500'
    }
  ];

  return (
    <div className="fixed bottom-6 right-6 lg:bottom-8 lg:right-8 xl:bottom-20 xl:right-8 z-30 hidden">
      {/* Action Items */}
      {isExpanded && (
        <div className="absolute bottom-16 right-0 space-y-3 animate-slide-up">
          {actions.map((action, index) => (
            <div
              key={action.id}
              className="flex items-center space-x-3 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="bg-white dark:bg-slate-800 px-3 py-2 rounded-lg shadow-lg ring-1 ring-black/5 dark:ring-white/10 text-sm font-medium text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                {action.label}
                {action.shortcut && (
                  <span className="ml-2 text-xs text-neutral-500 dark:text-slate-400 bg-neutral-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {action.shortcut}
                  </span>
                )}
              </div>
              <button
                onClick={action.onClick}
                className={`group w-10 h-10 rounded-full bg-gradient-to-r ${action.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ring-2 ring-white/20`}
              >
                <FontAwesomeIcon 
                  icon={action.icon} 
                  className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" 
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main FAB */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`group w-12 h-12 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-2xl hover:shadow-violet-500/25 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center ring-2 ring-violet-500/20 ${
          isExpanded ? 'rotate-45' : 'rotate-0'
        }`}
      >
        <FontAwesomeIcon 
          icon={isExpanded ? faTimes : faPlus} 
          className="w-4 h-4 transition-all duration-300 group-hover:scale-110" 
        />
        
        {/* Pulsing ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 animate-ping opacity-20"></div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 opacity-50 blur-xl"></div>
      </button>

      {/* Backdrop */}
      {isExpanded && (
        <div 
          className="fixed inset-0 -z-10 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </div>
  );
};

export default FloatingActionButton;