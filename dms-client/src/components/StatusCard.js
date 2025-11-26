// src/components/StatusCard.js
import React from 'react';
import { Card } from 'react-bootstrap';
import './StatusCard.css'; 

function StatusCard({ title, value, description, theme }) {
  const variantMap = {
    alert: 'warning',    
    critical: 'danger',  
    info: 'info',        
    success: 'success'   
  };
  
  const iconMap = {
    alert: '🔔',
    critical: '🔥',
    info: '📋',
    success: '✅'
  };

  return (
    <Card 
        bg={variantMap[theme]} 
        text="white" 
        className="mb-3 h-100 shadow-sm" 
    >
      <Card.Body>
        <Card.Title as="h3" className="d-flex justify-content-between align-items-center">
            {title}
            <span style={{fontSize: '1.2rem'}}>{iconMap[theme]}</span>
        </Card.Title>
        <Card.Text className="card-value-display mt-3">
            {value}
        </Card.Text>
        <Card.Text className="card-description-text border-top pt-2">
            {description}
        </Card.Text>
      </Card.Body>
    </Card>
  );
}

export default StatusCard; // ✅ CHECK: Default Export