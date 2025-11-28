// src/components/AlertCard.js
import React from 'react';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap';
import './AlertCard.css';

const UPDATE_API = 'http://localhost:5000/api/help/alerts';

const getIcon = (type = '') => {
  const t = type.toLowerCase();
  if (t.includes('medical')) return '🏥';
  if (t.includes('fire')) return '🔥';
  if (t.includes('collapse')) return '⚠️';
  if (t.includes('flood') || t.includes('water')) return '🌊';
  if (t.includes('missing')) return '🔍';
  return '🚨';
};

const statusLabelClass = status => {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'status-pending';
  if (s === 'dispatched') return 'status-dispatched';
  if (s === 'completed') return 'status-completed';
  return 'status-default';
};

function AlertCard({ request, isAdmin, adminKey, onUpdate }) {
  const timestamp = new Date(request.timestamp).toLocaleString();
  const locationText =
    request.manualAddress ||
    (request.geolocation
      ? `GPS: ${request.geolocation.lat?.toFixed(2)}, ${request.geolocation.lon?.toFixed(2)}`
      : 'Location Unknown');

  // Debug helper: you can keep this while testing
  console.log('AlertCard props:', { isAdmin, adminKey });

  const updateStatus = async newStatus => {
    if (!isAdmin || !adminKey) {
      alert('Authentication failed. Please log in as an Admin.');
      return;
    }

    try {
      await axios.put(
        `${UPDATE_API}/${request._id}/status?token=${encodeURIComponent(adminKey)}`,
        { newStatus }
      );

      if (onUpdate) onUpdate();
    } catch (error) {
      console.error(
        'Failed to update status:',
        error.response?.data?.message || error.message
      );
      alert(
        `Failed to update status: ${
          error.response?.data?.message || 'Server error.'
        }`
      );
    }
  };

  return (
    <Card className="alert-card shadow-sm border-0 h-100">
      <Card.Body>
        {/* Header */}
        <div className="alert-header d-flex justify-content-between align-items-center mb-2">
          <div className="d-flex align-items-center">
            <span className="alert-icon me-2 fs-4">
              {getIcon(request.disasterType || '')}
            </span>
            <Card.Title as="h5" className="mb-0">
              {request.disasterType}
            </Card.Title>
          </div>
          <span className={`alert-status-badge ${statusLabelClass(request.status)}`}>
            {request.status}
          </span>
        </div>

        {/* Description */}
        <Card.Text className="alert-description mb-3">
          {request.description}
        </Card.Text>

        {/* Meta */}
        <div className="alert-meta border-top pt-2 mt-2 small">
          <p className="mb-1">
            <strong>📍 Location:</strong> {locationText}
          </p>
          <p className="mb-1">
            <strong>📞 Contact:</strong> {request.reporterContact}
          </p>
          <p className="mb-1">
            <strong>⏱️ Reported:</strong> {timestamp}
          </p>
          <p className="mb-0">
            <strong>🚨 Severity:</strong> {request.severity || 'Moderate'}
          </p>
        </div>

        {/* Admin Controls */}
        {isAdmin && request.status !== 'Completed' && (
          <div className="admin-controls mt-3 d-flex gap-2">
            <Button
              size="sm"
              variant="success"
              onClick={() => updateStatus('Completed')}
            >
              Mark Completed
            </Button>

            {request.status === 'Pending' && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => updateStatus('Dispatched')}
              >
                Mark Dispatched
              </Button>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}

export default AlertCard;
