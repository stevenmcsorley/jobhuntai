import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggler = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="flex items-center space-x-3">
      <button
        onClick={toggleTheme}
        data-cy="theme-toggle"
        className={`group relative flex items-center justify-center w-14 h-7 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
          theme === 'dark' 
            ? 'bg-gradient-to-r from-violet-600 to-purple-600 shadow-lg shadow-violet-500/25' 
            : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-lg shadow-amber-500/25'
        }`}
        aria-label="Toggle theme"
      >
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-black/20"></div>
        
        {/* Sliding toggle */}
        <div
          className={`absolute w-6 h-6 bg-white rounded-full shadow-xl transform transition-all duration-300 flex items-center justify-center group-hover:scale-110 ${
            theme === 'dark' ? 'translate-x-3.5' : '-translate-x-3.5'
          }`}
        >
          {theme === 'dark' ? (
            <MoonIcon className="w-3.5 h-3.5 text-slate-700" />
          ) : (
            <SunIcon className="w-3.5 h-3.5 text-amber-600" />
          )}
        </div>
        
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full transition-opacity duration-300 ${
          theme === 'dark' 
            ? 'bg-violet-400/20 group-hover:bg-violet-400/30' 
            : 'bg-amber-400/20 group-hover:bg-amber-400/30'
        }`}></div>
      </button>
      
      <div className="flex flex-col">
        <span className="text-xs text-slate-300 font-semibold tracking-wide">
          {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
        </span>
        <span className="text-xs text-slate-500 font-medium">
          {theme === 'dark' ? 'Enabled' : 'Disabled'}
        </span>
      </div>
    </div>
  );
};

export default ThemeToggler;
