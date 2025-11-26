// src/components/VolunteerForm.js
import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner, Row, Col } from 'react-bootstrap';
import './VolunteerForm.css'; 

const API_URL = 'http://localhost:5000/api/volunteer/register';

function VolunteerForm() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', skills: '', location: '',
  });
  const [submissionStatus, setSubmissionStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmissionStatus('');
    setErrorMessage('');

    try {
      await axios.post(API_URL, formData);
      
      setSubmissionStatus('success');
      setFormData({ name: '', email: '', phone: '', skills: '', location: '' });

    } catch (error) {
      setSubmissionStatus('error');
      const msg = error.response?.data?.message || 'Server error during registration.';
      setErrorMessage(msg);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg volunteer-form-card border-0">
        <Card.Header as="h3" className="text-center bg-success text-white py-3">
            Join Our Volunteer Response Team 🇮🇳
        </Card.Header>
        <Card.Body className="p-4">
            <p className="text-muted text-center mb-4 volunteer-intro">
                Your skills are vital. Register below to join our network and be notified immediately when a local disaster requires aid.
            </p>

            {submissionStatus === 'success' && (<Alert variant="success">✅ Registration successful! You will be notified when local aid is needed.</Alert>)}
            {submissionStatus === 'error' && (<Alert variant="danger">❌ Registration failed: {errorMessage}</Alert>)}

            <Form onSubmit={handleSubmit}>
                
                <Row className="mb-3 g-3">
                    <Col md={6}>
                        <Form.Group controlId="volunteerName">
                            <Form.Label className="fw-bold">Full Name *</Form.Label>
                            <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required/>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                         <Form.Group controlId="volunteerLocation">
                            <Form.Label className="fw-bold">Primary Location (City/Region) *</Form.Label>
                            <Form.Control type="text" name="location" value={formData.location} onChange={handleChange} required/>
                        </Form.Group>
                    </Col>
                </Row>

                <Row className="mb-4 g-3">
                    <Col md={6}>
                        <Form.Group controlId="volunteerEmail">
                            <Form.Label className="fw-bold">Email Address *</Form.Label>
                            <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required/>
                        </Form.Group>
                    </Col>
                    <Col md={6}>
                        <Form.Group controlId="volunteerPhone">
                            <Form.Label className="fw-bold">Phone Number * (For SMS Alerts)</Form.Label>
                            <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleChange} required/>
                        </Form.Group>
                    </Col>
                </Row>
                
                <Form.Group className="mb-4 p-3 border rounded shadow-sm" controlId="volunteerSkills">
                    <Form.Label className="fw-bold fs-6 text-success">
                        Relevant Skills (VITAL)
                    </Form.Label>
                    <Form.Control 
                        as="textarea" 
                        name="skills" 
                        value={formData.skills} 
                        onChange={handleChange} 
                        rows={3}
                        placeholder="e.g., First Aid Certified, Drone Pilot, Fluent in Telugu, Heavy Equipment Operator."
                    />
                    <Form.Text className="text-muted">
                        This helps us dispatch you to the right mission.
                    </Form.Text>
                </Form.Group>

                <Button variant="success" type="submit" disabled={isLoading} className="w-100 submit-btn mt-3">
                    {isLoading ? (<><Spinner animation="border" size="sm" className="me-2" /> Registering...</>) : 'Commit to Volunteer Network'}
                </Button>
            </Form>
        </Card.Body>
    </Card>
  );
}

export default VolunteerForm;