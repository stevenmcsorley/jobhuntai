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
      className="hover:bg-violet-50/50 dark:hover:bg-violet-900/10 cursor-pointer transition-all duration-200 hover:shadow-sm group"
    >
      {columns.map(col => (
        <td 
          key={col.key} 
          className={`
            px-6 py-4 text-sm text-neutral-900 dark:text-neutral-100 border-b border-neutral-100 dark:border-slate-800 transition-all duration-200
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
      <div className="flex items-center justify-center py-16">
        <div className="spinner-modern w-8 h-8"></div>
        <span className="ml-3 text-neutral-600 dark:text-neutral-400 font-medium">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {searchable && (
        <div className="flex justify-between items-center">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search jobs, companies, locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-modern pl-12"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="text-sm text-neutral-500 dark:text-slate-400 font-medium">
            {sortedData.length} {sortedData.length === 1 ? 'item' : 'items'}
          </div>
        </div>
      )}

      <div className="surface-card overflow-hidden">
        <div className="overflow-x-auto scrollbar-modern">
          <table className="table-modern min-w-full table-fixed">
            <thead>
              <tr>
                {columns.map(col => (
                  <th 
                    key={col.key}
                    onClick={() => col.sortable !== false && handleSort(col.key)}
                    className={`
                      px-6 py-4 text-left text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider 
                      bg-neutral-50/80 dark:bg-slate-800/50 backdrop-blur-sm first:rounded-tl-xl last:rounded-tr-xl 
                      border-b border-neutral-200 dark:border-slate-700
                      ${col.sortable !== false ? 'cursor-pointer hover:bg-neutral-100 dark:hover:bg-slate-700/50 transition-colors duration-150' : ''}
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
            <tbody className="divide-y divide-neutral-100 dark:divide-slate-800">
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
                  <td colSpan={columns.length} className="px-6 py-16 text-center text-neutral-500 dark:text-slate-400">
                    <div className="flex flex-col items-center space-y-4 animate-fade-in">
                      <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-2xl flex items-center justify-center">
                        <div className="text-2xl">📋</div>
                      </div>
                      <div className="space-y-2">
                        <div className="font-medium">No items to display</div>
                        <div className="text-sm text-neutral-400 dark:text-slate-500">
                          {searchTerm ? `No results found for "${searchTerm}"` : 'Start by adding some data'}
                        </div>
                      </div>
                      {searchTerm && (
                        <button 
                          onClick={() => setSearchTerm('')}
                          className="btn-secondary text-sm"
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
          <div className="px-6 py-4 bg-neutral-50/50 dark:bg-slate-800/50 border-t border-neutral-200 dark:border-slate-700 flex items-center justify-between">
            <div className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">
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
                        <span className="px-2 text-gray-400 dark:text-gray-500">...</span>
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

