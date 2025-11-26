// src/components/AlertCard.js
import React from 'react';
import axios from 'axios';
import { Card, Button } from 'react-bootstrap';
import './AlertCard.css';

const UPDATE_API = 'http://localhost:5000/api/help/alerts';

const getIcon = (type) => {
    if (type.includes('Medical')) return '🏥';
    if (type.includes('Fire')) return '🔥';
    if (type.includes('Collapse')) return '⚠️';
    if (type.includes('Flood') || type.includes('Water')) return '🌊';
    if (type.includes('Missing')) return '🔍';
    return '🚨';
};

function AlertCard({ request, isAdmin, adminKey, onUpdate }) {
    const timestamp = new Date(request.timestamp).toLocaleString();
    const locationText = request.manualAddress || (request.geolocation ? `GPS: ${request.geolocation.lat.toFixed(2)}, ${request.geolocation.lon.toFixed(2)}` : 'Location Unknown');
    const statusClass = request.status.toLowerCase();

    const updateStatus = async (newStatus) => {
        if (!isAdmin || !adminKey) return;

        try {
            await axios.put(`${UPDATE_API}/${request._id}/status`, 
                { newStatus, adminKey }, 
                { headers: { 'X-Admin-Token': adminKey } }
            );
            
            onUpdate(); 
            
        } catch (error) {
            console.error('Failed to update status:', error.response?.data?.message || error.message);
            alert(`Failed to update status: ${error.response?.data?.message || 'Server error.'}`);
        }
    };

    return (
        <Card className={`alert-card shadow-sm ${statusClass}`}>
            <Card.Body>
                <div className="alert-header d-flex justify-content-between align-items-center mb-2">
                    <span className="alert-icon me-2 fs-5">{getIcon(request.disasterType)}</span>
                    <Card.Title as="h5" className="mb-0 me-auto">{request.disasterType}</Card.Title>
                    <span className={`alert-status-badge status-${statusClass}`}>{request.status}</span>
                </div>
                
                <Card.Text className="alert-description mb-3">{request.description}</Card.Text>
                
                <div className="alert-meta border-top pt-2 mt-2">
                    <p className="mb-0">📍 **Location:** {locationText}</p>
                    <p className="mb-0">📞 **Contact:** {request.reporterContact}</p>
                    <p className="mb-0">⏱️ **Reported:** {timestamp}</p>
                </div>

                {/* --- ADMIN CONTROLS --- */}
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

export default AlertCard; // ✅ CHECK: Default Export