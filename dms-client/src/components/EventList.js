// src/components/EventList.js
import React from 'react';
import { Table } from 'react-bootstrap';
import './EventList.css'; 

function EventList({ events }) {
  const validEvents = events.filter(e => e.properties.mag !== null);

  return (
    <div className="event-list-container">
      <Table striped bordered hover responsive size="sm" className="mb-0">
        <thead className="table-dark">
          <tr>
            <th>Type</th>
            <th>Severity</th>
            <th>Location</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {validEvents.map((event, index) => {
            const type = event.properties.type || 'N/A';
            const severity = event.properties.severity || (event.properties.mag ? `M${event.properties.mag.toFixed(1)}` : 'Low');
            const place = event.properties.place || 'Unknown';
            const time = new Date(event.properties.time).toLocaleTimeString('en-IN');

            const rowClass = (severity.toLowerCase().includes('extreme') || severity.toLowerCase().includes('severe')) 
                ? 'table-danger' 
                : (severity.toLowerCase().includes('moderate') || severity.includes('M4')) ? 'table-warning' : '';

            return (
              <tr key={event.id || index} className={rowClass}>
                <td>{type}</td>
                <td>{severity}</td>
                <td>{place}</td>
                <td>{time}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

export default EventList; // ✅ CHECK: Default Export