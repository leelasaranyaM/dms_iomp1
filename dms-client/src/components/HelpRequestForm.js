// src/components/HelpRequestForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, Form, Button, Alert, Spinner, Row, Col } from 'react-bootstrap';
import './HelpRequestForm.css';

const API_URL = 'http://localhost:5000/api/help/request';

function HelpRequestForm({ onSuccessfulSubmit }) {
  const [formData, setFormData] = useState({
    reporterContact: '',
    disasterType: '',
    description: '',
    severity: 'Moderate',
    manualAddress: '',
    lat: '',
    lon: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // GPS-related state
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  // Function to detect GPS location
  const detectLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationError('Browser does not support GPS. Please type address manually.');
      return;
    }

    setIsLocating(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        setFormData(prev => ({
          ...prev,
          lat: prev.lat || latitude.toFixed(6),
          lon: prev.lon || longitude.toFixed(6),
        }));

        setIsLocating(false);
      },
      err => {
        console.error('HelpRequestForm GPS error:', err);
        setLocationError('Could not auto-detect GPS. Please type address or try again.');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  // Try auto-detect GPS on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmissionStatus('');
    setErrorMessage('');

    // Backend requires: manualAddress OR (lat & lon)
    if (!formData.manualAddress && (!formData.lat || !formData.lon)) {
      setIsSubmitting(false);
      setSubmissionStatus('error');
      setErrorMessage(
        'Please provide either a GPS location (allow location) or a manual address.'
      );
      return;
    }

    try {
      const payload = {
        reporterContact: formData.reporterContact,
        disasterType: formData.disasterType,
        description: formData.description,
        severity: formData.severity,
        manualAddress: formData.manualAddress || undefined,
        lat: formData.lat ? parseFloat(formData.lat) : undefined,
        lon: formData.lon ? parseFloat(formData.lon) : undefined,
      };

      await axios.post(API_URL, payload);

      setSubmissionStatus('success');
      setFormData({
        reporterContact: '',
        disasterType: '',
        description: '',
        severity: 'Moderate',
        manualAddress: '',
        lat: '',
        lon: '',
      });

      // Try to detect GPS again for next submission
      detectLocation();

      if (onSuccessfulSubmit) {
        onSuccessfulSubmit();
      }
    } catch (error) {
      console.error('Help request submission error:', error);
      setSubmissionStatus('error');
      const msg =
        error.response?.data?.message || 'Server error during help request submission.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm help-request-card border-0">
      <Card.Header as="h3" className="bg-danger text-white text-center py-3">
        Request Immediate Help 🚨
      </Card.Header>
      <Card.Body className="p-4">
        <p className="text-muted text-center mb-4">
          Use this form to report an emergency in your area. Your report will be sent to
          admins and local volunteers.
        </p>

        {submissionStatus === 'success' && (
          <Alert variant="success">
            ✅ Help request submitted! Responders are being notified.
          </Alert>
        )}

        {submissionStatus === 'error' && (
          <Alert variant="danger">
            ❌ Could not submit request: {errorMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3 g-3">
            <Col md={6}>
              <Form.Group controlId="helpReporterContact">
                <Form.Label className="fw-bold">Your Contact (Phone / WhatsApp) *</Form.Label>
                <Form.Control
                  type="text"
                  name="reporterContact"
                  value={formData.reporterContact}
                  onChange={handleChange}
                  required
                  placeholder="e.g., +91-9876543210"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="helpDisasterType">
                <Form.Label className="fw-bold">Disaster Type *</Form.Label>
                <Form.Select
                  name="disasterType"
                  value={formData.disasterType}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select type...</option>
                  <option>Flood</option>
                  <option>Fire</option>
                  <option>Building Collapse</option>
                  <option>Medical Emergency</option>
                  <option>Earthquake Damage</option>
                  <option>Missing Person</option>
                  <option>Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3" controlId="helpDescription">
            <Form.Label className="fw-bold">Describe the Situation *</Form.Label>
            <Form.Control
              as="textarea"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              required
              placeholder="Describe what is happening, how many people are affected, injuries, and any immediate dangers."
            />
          </Form.Group>

          <Row className="mb-3 g-3">
            <Col md={6}>
              <Form.Group controlId="helpSeverity">
                <Form.Label className="fw-bold">Severity</Form.Label>
                <Form.Select
                  name="severity"
                  value={formData.severity}
                  onChange={handleChange}
                >
                  <option>Minor</option>
                  <option>Moderate</option>
                  <option>Severe</option>
                  <option>Critical</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="mb-3 g-3">
            <Col md={7}>
              <Form.Group controlId="helpManualAddress">
                <Form.Label className="fw-bold">
                  Manual Address / Landmark (Optional if GPS works)
                </Form.Label>
                <Form.Control
                  type="text"
                  name="manualAddress"
                  value={formData.manualAddress}
                  onChange={handleChange}
                  placeholder="e.g., Near XYZ School, Kukatpally, Hyderabad"
                />
                <Form.Text className="text-muted">
                  Give clear landmarks if GPS is not accurate.
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={5}>
              <Form.Group controlId="helpGps">
                <Form.Label className="fw-bold">GPS Location</Form.Label>
                <Row className="g-2">
                  <Col xs={6}>
                    <Form.Control
                      type="text"
                      name="lat"
                      value={formData.lat}
                      onChange={handleChange}
                      placeholder="Lat"
                    />
                  </Col>
                  <Col xs={6}>
                    <Form.Control
                      type="text"
                      name="lon"
                      value={formData.lon}
                      onChange={handleChange}
                      placeholder="Lon"
                    />
                  </Col>
                </Row>
                <Form.Text className="text-muted d-block mt-1">
                  {isLocating && 'Detecting your GPS location...'}
                  {!isLocating && !locationError && formData.lat && formData.lon && (
                    <>GPS detected. You can adjust if needed.</>
                  )}
                  {locationError && (
                    <span className="text-danger ms-1">{locationError}</span>
                  )}
                </Form.Text>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2"
                  type="button"
                  onClick={detectLocation}
                  disabled={isLocating}
                >
                  {isLocating ? 'Locating...' : 'Retry GPS'}
                </Button>
              </Form.Group>
            </Col>
          </Row>

          <Button
            variant="danger"
            type="submit"
            disabled={isSubmitting}
            className="w-100 mt-3"
          >
            {isSubmitting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Submitting Request...
              </>
            ) : (
              'Submit Help Request'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default HelpRequestForm;
