import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';

const ThemeToggler = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={toggleTheme}
        className="relative flex items-center justify-center w-12 h-6 bg-gray-600 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
        aria-label="Toggle theme"
      >
        <div
          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 flex items-center justify-center ${
            theme === 'dark' ? 'translate-x-3' : '-translate-x-3'
          }`}
        >
          {theme === 'dark' ? (
            <MoonIcon className="w-3 h-3 text-gray-800" />
          ) : (
            <SunIcon className="w-3 h-3 text-yellow-500" />
          )}
        </div>
      </button>
      <span className="text-xs text-gray-300 font-medium min-w-max">
        {theme === 'dark' ? 'Dark' : 'Light'}
      </span>
    </div>
  );
};

export default ThemeToggler;
