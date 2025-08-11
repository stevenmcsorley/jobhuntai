import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ChevronDownIcon, UserIcon } from '@heroicons/react/24/outline';

const UserSelector = ({ activeUserId, setActiveUserId }) => {
  const [users, setUsers] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get('/api/admin/users');
        setUsers(response.data);
        // If no active user is set, default to the first user
        if (!activeUserId && response.data.length > 0) {
          setActiveUserId(response.data[0].id);
        }
      } catch (error) {
        console.error('Error fetching users for selector:', error);
      }
    };
    fetchUsers();
  }, [activeUserId, setActiveUserId]);

  const handleSelectUser = (userId) => {
    setActiveUserId(userId);
    setIsOpen(false);
  };

  const activeUser = users.find(user => user.id === activeUserId);

  return (
    <div className="relative inline-block text-left z-50">
      <div>
        <button
          type="button"
          className="inline-flex justify-center w-full rounded-md border border-gray-300 dark:border-gray-700 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          id="menu-button"
          aria-expanded="true"
          aria-haspopup="true"
          onClick={() => setIsOpen(!isOpen)}
        >
          <UserIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          {activeUser ? activeUser.username : 'Select User'}
          <ChevronDownIcon className="-mr-1 ml-2 h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {isOpen && (
        <div
          className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex="-1"
        >
          <div className="py-1" role="none">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => handleSelectUser(user.id)}
                className={
                  `block w-full text-left px-4 py-2 text-sm ${activeUser && activeUser.id === user.id
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`
                }
                role="menuitem"
                tabIndex="-1"
                id={`menu-item-${user.id}`}
              >
                {user.username}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserSelector;
