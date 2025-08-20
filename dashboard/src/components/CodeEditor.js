import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { PlayIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

const CodeEditor = ({ language = 'javascript', initialValue = '', onChange, onRun }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      lineNumbers: 'on',
      glyphMargin: false,
      folding: false,
      renderLineHighlight: 'none',
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: true,
    });

    // Set theme based on current theme
    const isDark = document.documentElement.classList.contains('dark');
    monaco.editor.setTheme(isDark ? 'vs-dark' : 'vs-light');
  };

  const handleRunCode = async () => {
    if (!editorRef.current) return;
    
    setIsRunning(true);
    setError('');
    setOutput('');
    
    const code = editorRef.current.getValue();
    
    try {
      // For JavaScript, we can run it in a safe environment
      if (language === 'javascript') {
        // Create a safe execution context
        const originalLog = console.log;
        const originalError = console.error;
        let logs = [];
        let errors = [];

        // Override console methods to capture output
        console.log = (...args) => logs.push(args.join(' '));
        console.error = (...args) => errors.push(args.join(' '));

        try {
          // Use Function constructor for safer evaluation
          const func = new Function(code);
          const result = func();
          
          if (result !== undefined) {
            logs.push(`Result: ${result}`);
          }
          
          setOutput(logs.join('\n'));
          if (errors.length > 0) {
            setError(errors.join('\n'));
          }
        } catch (err) {
          setError(err.message);
        } finally {
          // Restore console methods
          console.log = originalLog;
          console.error = originalError;
        }
      } else {
        // For other languages, just show a placeholder
        setOutput('Code execution is not available for this language in the browser environment.');
      }
      
      if (onRun) {
        onRun(code);
      }
    } catch (err) {
      setError(`Execution Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    if (editorRef.current) {
      editorRef.current.setValue(initialValue);
      setOutput('');
      setError('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-neutral-900 dark:text-white">Code Editor</h4>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleRunCode}
            disabled={isRunning}
            className="btn-success flex items-center space-x-2"
          >
            {isRunning ? (
              <div className="spinner-modern w-4 h-4"></div>
            ) : (
              <PlayIcon className="w-4 h-4" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>
        </div>
      </div>
      
      <div className="border border-neutral-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <Editor
          height="300px"
          language={language}
          value={initialValue}
          onChange={onChange}
          onMount={handleEditorDidMount}
          options={{
            fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
          }}
        />
      </div>
      
      {(output || error) && (
        <div className="space-y-2">
          {output && (
            <div className="surface-card-soft p-4">
              <h5 className="text-sm font-medium text-neutral-900 dark:text-white mb-2">Output:</h5>
              <pre className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
          )}
          {error && (
            <div className="surface-card-soft p-4 border-l-4 border-red-500">
              <h5 className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">Error:</h5>
              <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap font-mono">
                {error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;