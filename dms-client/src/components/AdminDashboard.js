// src/components/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AlertCard from './AlertCard';

const API_BASE = 'http://localhost:5000';

function AdminDashboard() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = localStorage.getItem('isAdmin') === 'true';
  const adminKey = localStorage.getItem('adminToken') || '';

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/help/alerts`);
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      alert('Failed to load alerts from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="mb-0">Active Help Requests</h2>
        {isAdmin ? (
          <span className="badge bg-success">Admin Mode</span>
        ) : (
          <span className="badge bg-secondary">Read-only</span>
        )}
      </div>

      {loading && <p>Loading alerts...</p>}

      {!loading && alerts.length === 0 && (
        <p className="text-muted">No active incidents in the last 24 hours.</p>
      )}

      <div className="row">
        {alerts.map(request => (
          <div className="col-md-6 col-lg-4 mb-3" key={request._id}>
            <AlertCard
              request={request}
              isAdmin={isAdmin}
              adminKey={adminKey}
              onUpdate={fetchAlerts}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminDashboard;
