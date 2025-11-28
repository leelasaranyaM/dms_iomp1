// src/components/LiveAlertsSection.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Spinner, Alert, Row, Col } from 'react-bootstrap';
import AlertCard from './AlertCard';

const API_BASE = 'http://localhost:5000';

function LiveAlertsSection({ isAdmin, adminToken, onAlertsFetched }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API_BASE}/api/help/alerts`);
      const data = res.data || [];
      setAlerts(data);

      if (onAlertsFetched) {
        onAlertsFetched(data);
      }
    } catch (err) {
      console.error('Error fetching live alerts:', err.response?.data || err.message);
      setError('Unable to load current help requests from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <Card className="shadow-sm">
      <Card.Header
        as="h5"
        className="bg-danger text-white d-flex justify-content-between"
      >
        <span>⚠️ Live Help Requests & Alerts</span>
        <span className="small">
          Mode: {isAdmin ? 'Admin (can update status)' : 'Public (read-only)'}
        </span>
      </Card.Header>
      <Card.Body>
        {loading && (
          <div className="text-center my-3">
            <Spinner animation="border" role="status" />
            <p className="text-muted mt-2 mb-0">Loading live alerts...</p>
          </div>
        )}

        {!loading && error && (
          <Alert variant="warning" className="text-center">
            {error}
          </Alert>
        )}

        {!loading && !error && alerts.length === 0 && (
          <p className="text-muted mb-0 text-center">
            No active help requests reported in the last 24 hours.
          </p>
        )}

        {!loading && !error && alerts.length > 0 && (
          <Row className="g-3">
            {alerts.map(request => (
              <Col md={6} lg={4} key={request._id}>
                <AlertCard
                  request={request}
                  isAdmin={isAdmin}
                  adminKey={adminToken}
                  onUpdate={fetchAlerts}
                />
              </Col>
            ))}
          </Row>
        )}
      </Card.Body>
    </Card>
  );
}

export default LiveAlertsSection;
