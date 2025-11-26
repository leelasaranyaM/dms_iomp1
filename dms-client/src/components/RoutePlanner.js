// src/components/RoutePlanner.js
import React, { useState } from 'react';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';
import './RoutePlanner.css';

function RoutePlanner({ onPlanRoute, activeAlerts }) {
    const [source, setSource] = useState('');
    const [destination, setDestination] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (source && destination) {
            onPlanRoute(source, destination, activeAlerts);
        }
    };

    return (
        <Card className="shadow border-info">
            <Card.Body>
                <Card.Title as="h3" className="text-center text-info mb-4">🗺️ Plan Your Route & Avoid Danger Zones</Card.Title>
                <p className="text-center text-muted">
                    Enter your start and end points to visualize your route along with all currently active alerts.
                </p>
                
                <Form onSubmit={handleSubmit}>
                    <Row className="mb-3 g-3">
                        <Col md={6}>
                            <Form.Group controlId="routeSource">
                                <Form.Label>Source Address/Location</Form.Label>
                                <Form.Control type="text" value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g., Your Home Address" required/>
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group controlId="routeDestination">
                                <Form.Label>Destination Address/Location</Form.Label>
                                <Form.Control type="text" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="e.g., Relief Center Name" required/>
                            </Form.Group>
                        </Col>
                    </Row>
                    
                    <Button variant="info" type="submit" className="w-100 plan-route-btn">
                        Visualize Route & Alerts ({activeAlerts.length} Active Alerts)
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default RoutePlanner;