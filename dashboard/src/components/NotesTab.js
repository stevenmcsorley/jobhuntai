import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const NotesTab = ({ application }) => {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axios.get(`/api/applications/${application.id}/notes`);
        setNotes(response.data);
      } catch (error) {
        toast.error('Failed to fetch notes.');
        console.error('Error fetching notes:', error);
      }
      setIsLoading(false);
    };

    if (application && application.id) {
      fetchNotes();
    }
  }, [application]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    try {
      const response = await axios.post(`/api/applications/${application.id}/notes`, { note: newNote });
      setNotes([response.data, ...notes]);
      setNewNote('');
      toast.success('Note added successfully!');
    } catch (error) {
      toast.error('Failed to add note.');
      console.error('Error adding note:', error);
    }
  };

  if (isLoading) {
    return <div>Loading notes...</div>;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAddNote} className="space-y-2">
        <textarea
          className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700"
          rows="3"
          placeholder="Add a new note..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Add Note
        </button>
      </form>
      <div className="space-y-4">
        {notes.map(note => (
          <div key={note.id} className="p-4 bg-gray-100 rounded dark:bg-gray-800">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(note.created_at).toLocaleString()}
            </p>
            <p>{note.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotesTab;
