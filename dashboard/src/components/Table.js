import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const TableRow = ({ item, columns, isExpanded, onToggleExpand, onRowClick }) => {
  const handleRowClick = (e) => {
    // Don't trigger row click if clicking on action buttons
    if (e.target.closest('.dropdown-item') || e.target.closest('[data-no-row-click]')) {
      return;
    }
    if (onRowClick) {
      onRowClick(item);
    } else {
      onToggleExpand();
    }
  };

  return (
    <tr 
      onClick={handleRowClick} 
      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer transition-all duration-200 hover:shadow-sm group"
    >
      {columns.map(col => (
        <td 
          key={col.key} 
          className={`
            px-3 py-4 text-sm text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 transition-all duration-200
            ${col.className || ''} 
            ${!isExpanded && col.truncate ? 'truncate' : ''}
          `}
          style={{ width: col.width }}
        >
          <div className={col.truncate && !isExpanded ? 'truncate' : ''}>
            {col.render ? col.render(item) : item[col.key]}
          </div>
        </td>
      ))}
    </tr>
  );
};

const SortIcon = ({ direction }) => {
  if (direction === 'asc') {
    return <ChevronUpIcon className="w-4 h-4" />;
  } else if (direction === 'desc') {
    return <ChevronDownIcon className="w-4 h-4" />;
  }
  return (
    <div className="flex flex-col">
      <ChevronUpIcon className="w-3 h-3 -mb-1 opacity-30" />
      <ChevronDownIcon className="w-3 h-3 opacity-30" />
    </div>
  );
};

const Table = ({ columns, data, pageSize = 8, searchable = false, onRowClick }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: null });
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const searchableData = useMemo(() => {
    if (!searchable || !searchTerm) return data || [];
    
    return (data || []).filter(item =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig.key) return searchableData;

    return [...searchableData].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [searchableData, sortConfig]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const toggleRowExpand = (itemId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedRows(newExpanded);
  };

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex justify-between items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input max-w-md"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="modern-table min-w-full table-fixed">
            <thead>
              <tr>
                {columns.map(col => (
                  <th 
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`
                      px-3 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider 
                      bg-gray-50/80 dark:bg-gray-700/50 backdrop-blur-sm first:rounded-tl-lg last:rounded-tr-lg 
                      border-b border-gray-200 dark:border-gray-700
                      ${col.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50 transition-colors duration-150' : ''}
                      ${col.width || ''}
                    `}
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate">{col.label}</span>
                      {col.sortable !== false && (
                        <SortIcon 
                          direction={sortConfig.key === col.key ? sortConfig.direction : null} 
                        />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedData.length > 0 ? paginatedData.map(item => (
                <TableRow 
                  key={item.id} 
                  item={item} 
                  columns={columns}
                  isExpanded={expandedRows.has(item.id)}
                  onToggleExpand={() => toggleRowExpand(item.id)}
                  onRowClick={onRowClick}
                />
              )) : (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="text-4xl">📋</div>
                      <div>No items to display</div>
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
            </div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handlePrevPage} 
                disabled={currentPage === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Previous</span>
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => 
                    page === 1 || 
                    page === totalPages || 
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`
                          px-3 py-1 rounded-md text-sm font-medium transition-colors duration-150
                          ${currentPage === page 
                            ? 'bg-blue-600 text-white' 
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }
                        `}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;

