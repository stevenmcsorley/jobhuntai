import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StatusUpdater = ({ application, onUpdate, onClose }) => {
  // Keep normalized lowercase statuses used across the app
  const statuses = ["opportunity", "applied", "followup", "interviewing", "offer", "rejected", "archived"];

  const handleChange = async (e) => {
    const raw = e.target.value || '';
    const newStatus = String(raw).toLowerCase().trim(); // normalize
    try {
      const res = await axios.patch(`/api/applications/${application.id}`, { status: newStatus });
      // Some backends may not immediately return applied_at; ensure it's set for UI filters/renderers
      const patched = {
        ...application,
        ...res.data,
      };
      if (newStatus === 'applied' && !patched.applied_at) {
        patched.applied_at = new Date().toISOString();
      }
      // Immediately propagate the update so Dashboard filters move the row between tables
      onUpdate(patched);
      toast.success(`Status updated to ${newStatus}`);
      if (onClose) onClose();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error(`Failed to update status for ${application.title}.`);
    }
  };

  return (
    <select className="form-select form-select-sm" value={application.status} onChange={handleChange}>
      {statuses.map(status => (
        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
      ))}
    </select>
  );
};

export default StatusUpdater;
