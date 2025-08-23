import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import ThemeToggler from './ThemeToggler';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBriefcase, faStar, faThLarge, faCalendarCheck, faFileAlt, 
  faChartBar, faBullseye, faCog, faVial, faAngleDoubleLeft, faAngleDoubleRight, faUpload, faGraduationCap, faUserAstronaut, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

const Sidebar = ({ opportunitiesCount = 0, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const navItems = [
    { to: '/', icon: faThLarge, label: 'Dashboard', color: 'blue' },
    { to: '/opportunities', icon: faStar, label: 'Opportunities', color: 'yellow' },
    { to: '/profile', icon: faUserAstronaut, label: 'Master Profile', color: 'purple' },
    { to: '/interviews', icon: faCalendarCheck, label: 'Interviews', color: 'green' },
    { to: '/stats', icon: faChartBar, label: 'Analytics', color: 'purple' },
    { to: '/market-fit', icon: faBullseye, label: 'Market-Fit', color: 'red' },
    { to: '/preferences', icon: faCog, label: 'Preferences', color: 'gray' },
    { to: '/bulk-add', icon: faUpload, label: 'Bulk Add', color: 'orange' },
    { to: '/test', icon: faVial, label: 'Test Hub', color: 'cyan' },
    { to: '/guidance', icon: faGraduationCap, label: 'Guidance Hub', color: 'emerald' }
  ];

  return (
    <div className={`sidebar-modern flex flex-col transition-all duration-500 ease-in-out ${isCollapsed ? 'w-16' : 'w-64'} min-h-screen relative overflow-hidden`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Header */}
      <div className="relative z-10 p-4 border-b border-slate-700/50">
        <div className="flex items-center space-x-4">
          <div className="relative p-3 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl ring-2 ring-violet-500/30">
            <FontAwesomeIcon icon={faBriefcase} className="text-white w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full animate-pulse"></div>
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in">
              <h1 className="text-display-sm text-white font-bold tracking-tight">Job Hunt AI</h1>
              <p className="text-slate-400 text-xs font-medium tracking-wide">Intelligence Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex-1 p-4 space-y-3 mt-2">
        {navItems.map((item, index) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item group relative ${isActive ? 'active' : 'text-slate-300 hover:text-white hover:bg-white/10'} ${
                isCollapsed ? 'justify-center' : ''
              }`
            }
            title={isCollapsed ? item.label : ''}
            style={{ animationDelay: `${index * 50}ms` }}
            data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center space-x-4 relative z-10">
              <div className={`relative p-2 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                isCollapsed ? 'p-3' : ''
              }`}>
                <FontAwesomeIcon 
                  icon={item.icon} 
                  className="sidebar-nav-icon"
                />
                {/* Icon background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              {!isCollapsed && (
                <div className="animate-fade-in">
                  <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                  {item.label === 'Dashboard' && (
                    <div className="text-xs text-slate-500 mt-0.5">Overview & Stats</div>
                  )}
                  {item.label === 'Opportunities' && (
                    <div className="text-xs text-slate-500 mt-0.5">Job Matches</div>
                  )}
                  {item.label === 'Test Hub' && (
                    <div className="text-xs text-slate-500 mt-0.5">AI Assessment</div>
                  )}
                  {item.label === 'Guidance Hub' && (
                    <div className="text-xs text-slate-500 mt-0.5">Learning Path</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Enhanced active indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-violet-400 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg shadow-violet-500/50"></div>
            
            {/* Notification badges */}
            {item.label === 'Opportunities' && !isCollapsed && (
              <div 
                className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg"
                data-testid="opportunities-badge"
              >
                {opportunitiesCount || 0}
              </div>
            )}
            
            {/* Background gradient on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-purple-600/5 to-indigo-600/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="relative z-10 p-4 border-t border-slate-700/50 space-y-4 bg-slate-900/30 backdrop-blur-sm">
        {!isCollapsed && (
          <div className="mb-4 animate-fade-in">
            <div className="text-xs text-slate-500 font-medium mb-2">SYSTEM STATUS</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-slate-400">All Systems Operational</span>
            </div>
          </div>
        )}
        
        <div className={`flex ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
          <ThemeToggler />
        </div>
        
        {onLogout && (
          <button 
            onClick={onLogout}
            className="group w-full p-3 text-slate-400 hover:text-red-400 hover:bg-gradient-to-r hover:from-red-600/20 hover:to-red-500/20 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden"
            title="Logout"
          >
            <FontAwesomeIcon 
              icon={faSignOutAlt} 
              className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" 
            />
            {!isCollapsed && (
              <span className="ml-2 text-xs font-medium">Logout</span>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 via-red-600/10 to-red-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        )}
        
        <button 
          onClick={toggleSidebar}
          className="group w-full p-3 text-slate-400 hover:text-white hover:bg-gradient-to-r hover:from-violet-600/20 hover:to-purple-600/20 rounded-xl transition-all duration-300 flex items-center justify-center relative overflow-hidden"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <FontAwesomeIcon 
            icon={isCollapsed ? faAngleDoubleRight : faAngleDoubleLeft} 
            className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" 
          />
          {!isCollapsed && (
            <span className="ml-2 text-xs font-medium">Collapse</span>
          )}
          {/* Button background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 via-purple-600/10 to-violet-600/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

