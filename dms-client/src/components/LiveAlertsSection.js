// src/components/LiveAlertsSection.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Spinner, Alert, Row, Col } from 'react-bootstrap';
import AlertCard from './AlertCard.js';
import './LiveAlertsSection.css';

const API_URL = 'http://localhost:5000/api/help/alerts';

function LiveAlertsSection({ isAdmin, adminKey, onAlertsFetched }) { 
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAlerts = async () => {
        try {
            const response = await axios.get(API_URL);
            setAlerts(response.data);
            setLoading(false);
            setError(null);
            
            if (onAlertsFetched) {
                onAlertsFetched(response.data.filter(a => a.status !== 'Completed')); 
            }
            
        } catch (err) {
            console.error("Alerts Fetch Error:", err);
            setError("Could not load real-time alerts from the server.");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts(); 

        const intervalId = setInterval(fetchAlerts, 15000); 

        return () => clearInterval(intervalId);
    }, [onAlertsFetched]); 

    return (
        <div className="live-alerts-container">
            <h3 className="text-center text-danger mb-4">Active Help Requests ({alerts.length} Incidents)</h3>
            
            {loading && <div className="text-center"><Spinner animation="border" variant="danger" /></div>}
            {error && <Alert variant="danger" className="text-center">⚠️ {error}</Alert>}
            
            {!loading && alerts.length === 0 && !error && (
                <Alert variant="success" className="text-center">
                    ✅ No critical help requests are currently pending. All clear!
                </Alert>
            )}

            <div className="alerts-grid">
                <Row xs={1} md={2} lg={3} className="g-4">
                    {alerts.map((request) => (
                        <Col key={request._id}>
                            <AlertCard 
                                request={request} 
                                isAdmin={isAdmin} 
                                adminKey={adminKey} 
                                onUpdate={fetchAlerts} 
                            />
                        </Col>
                    ))}
                </Row>
            </div>
        </div>
    );
}

export default LiveAlertsSection; // ✅ CHECK: Default Export