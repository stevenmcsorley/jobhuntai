import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggler from './ThemeToggler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, faStar, faThLarge, faCalendarCheck, faFileAlt, 
  faChartBar, faBullseye, faCog, faVial, faAngleDoubleLeft, faAngleDoubleRight, faUpload, faGraduationCap, faUserAstronaut
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { to: '/', icon: faThLarge, label: 'Dashboard', color: 'blue' },
    { to: '/opportunities', icon: faStar, label: 'Opportunities', color: 'yellow' },
    { to: '/profile', icon: faUserAstronaut, label: 'Master Profile', color: 'purple' },
    { to: '/interviews', icon: faCalendarCheck, label: 'Interviews', color: 'green' },
    { to: '/cv-editor', icon: faFileAlt, label: 'CV Editor', color: 'indigo' },
    { to: '/stats', icon: faChartBar, label: 'Stats', color: 'pink' },
    { to: '/market-fit', icon: faBullseye, label: 'Market-Fit', color: 'red' },
    { to: '/preferences', icon: faCog, label: 'Preferences', color: 'gray' },
    { to: '/bulk-add', icon: faUpload, label: 'Bulk Add', color: 'orange' },
    { to: '/test', icon: faVial, label: 'Test Hub', color: 'cyan' },
    { to: '/guidance', icon: faGraduationCap, label: 'Guidance Hub', color: 'emerald' }
  ];

  return (
    <div className={`sidebar-modern flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} min-h-screen relative`}>
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <FontAwesomeIcon icon={faBriefcase} className="text-white w-6 h-6" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-white">Job Hunt AI</h1>
              <p className="text-gray-400 text-xs">Intelligence Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item group relative ${isActive ? 'active bg-blue-600 text-white shadow-lg' : 'text-gray-300 hover:text-white hover:bg-white/10'} ${
                isCollapsed ? 'justify-center' : ''
              }`
            }
            title={isCollapsed ? item.label : ''}
          >
            <div className="flex items-center space-x-3">
              <FontAwesomeIcon 
                icon={item.icon} 
                className={`w-5 h-5 transition-colors duration-200`}
              />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            
            {/* Active indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-4">
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <ThemeToggler />
        </div>
        
        <button 
          onClick={toggleSidebar}
          className="w-full p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center justify-center"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FontAwesomeIcon 
            icon={isCollapsed ? faAngleDoubleRight : faAngleDoubleLeft} 
            className="w-4 h-4" 
          />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

