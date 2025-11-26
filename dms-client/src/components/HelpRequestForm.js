// src/components/HelpRequestForm.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import './HelpRequestForm.css'; 

const API_URL = 'http://localhost:5000/api/help/request';

const DISASTER_TYPES = [
  'Medical Emergency', 'Fire', 'Structural Collapse / Trapped', 
  'Flood / Water Rescue', 'Missing Person', 'Other / Unsure',
];

function HelpRequestForm({ onSuccessfulSubmit }) { 
  const [formData, setFormData] = useState({ reporterContact: '', disasterType: DISASTER_TYPES[0], description: '', manualAddress: '' });
  const [location, setLocation] = useState(null); 
  const [locationStatus, setLocationStatus] = useState('pending');
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(''); 

  // --- Geolocation Effect ---
  useEffect(() => {
    if (navigator.geolocation) {
      let timeoutId;
      timeoutId = setTimeout(() => { if (locationStatus === 'pending') { setLocationStatus('failed'); } }, 5000); 
      
      navigator.geolocation.getCurrentPosition(
        (pos) => { clearTimeout(timeoutId); setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocationStatus('success'); },
        (err) => { clearTimeout(timeoutId); setLocationStatus('failed'); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
      return () => clearTimeout(timeoutId);
    } else { setLocationStatus('failed'); }
  }, [locationStatus]); 

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStatus('');
    setErrorMessage('');

    if (locationStatus !== 'success' && !formData.manualAddress.trim()) {
        setErrorMessage('We need either your GPS location or a manual address to send help.');
        setIsLoading(false);
        return;
    }

    try {
      const payload = {
        ...formData,
        manualAddress: (locationStatus !== 'success' && formData.manualAddress) ? formData.manualAddress : undefined,
        lat: location ? location.lat : undefined,
        lon: location ? location.lon : undefined,
      };

      await axios.post(API_URL, payload);
      
      setSubmissionStatus('success');
      setFormData({ reporterContact: '', disasterType: DISASTER_TYPES[0], description: '', manualAddress: '' });

      if (onSuccessfulSubmit) { onSuccessfulSubmit(); }

    } catch (error) {
      setSubmissionStatus('error');
      const msg = error.response?.data?.message || 'Server error. Please try calling emergency services.';
      setErrorMessage(msg);
      
    } finally {
      setIsLoading(false);
    }
  };

  const isLocationRequired = locationStatus !== 'success';

  const getLocationStatusBadge = () => {
    switch (locationStatus) {
        case 'pending': return <Alert variant="warning" className="p-2 mb-2">🟡 Attempting to get precise GPS location...</Alert>;
        case 'success': return <Alert variant="success" className="p-2 mb-2">🟢 **GPS Location Confirmed**</Alert>;
        case 'failed': return <Alert variant="danger" className="p-2 mb-2">🔴 GPS failed or denied. **Please enter the address manually below.**</Alert>;
        default: return null;
    }
  };

  return (
    <Card className="shadow-lg help-form-card">
      <Card.Header as="h3" className="text-center text-white bg-danger py-3">Need Immediate Help? 🆘</Card.Header>
      <Card.Body className="p-4"> 
        <p className="form-intro text-muted text-center mb-4">
          Use this form to quickly report a critical situation. Provide accurate details to dispatch help faster.
        </p>

        {submissionStatus === 'success' && (<Alert variant="success">✅ Request Sent! Stay safe. Responders are being notified.</Alert>)}
        {submissionStatus === 'error' && (<Alert variant="danger">❌ Request Failed: {errorMessage}</Alert>)}

        <Form onSubmit={handleSubmit}>
          
          <Form.Group className="mb-3" controlId="contact">
            <Form.Label className="fw-bold">Your Contact Number *</Form.Label>
            <Form.Control type="tel" name="reporterContact" value={formData.reporterContact} onChange={handleChange} required />
          </Form.Group>

          <Form.Group className="mb-3" controlId="disasterType">
            <Form.Label className="fw-bold">Type of Emergency *</Form.Label>
            <Form.Select name="disasterType" value={formData.disasterType} onChange={handleChange} required>
              {DISASTER_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-4" controlId="description">
            <Form.Label className="fw-bold">Details of the Situation *</Form.Label>
            <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} required rows={3} placeholder="e.g., 'Three people trapped on the second floor, visible smoke.'"/>
          </Form.Group>

          <Card className="location-fieldset mb-4 border-warning">
            <Card.Header as="legend" className="bg-warning text-dark p-2 fw-bold fs-6">
                📍 Location Details *
            </Card.Header>
            <Card.Body className="p-3">
                {getLocationStatusBadge()}
                
                <Form.Group controlId="manualAddress">
                    <Form.Label className={isLocationRequired ? 'text-danger fw-bold' : 'fw-bold'}>
                        Manual Address
                    </Form.Label>
                    <Form.Control type="text" name="manualAddress" value={formData.manualAddress} onChange={handleChange} 
                                placeholder="Street, City, Landmark (Required if GPS fails)" required={isLocationRequired} />
                </Form.Group>
            </Card.Body>
          </Card>

          <Button variant="danger" type="submit" disabled={isLoading} className="w-100 submit-btn mt-3">
            {isLoading ? (<><Spinner animation="border" size="sm" className="me-2" /> Sending Request...</>) : 'Send Help Request'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default HelpRequestForm; // ✅ CHECK: Default Export