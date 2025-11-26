/* global maps_local */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Button, Card, Spinner, Alert } from 'react-bootstrap'; 

import Navbar from './components/Navbar.js'; 
import StatusCard from './components/StatusCard.js';
import MapComponent from './components/MapComponent.js';
import EventList from './components/EventList.js';
import HelpRequestForm from './components/HelpRequestForm.js';
import VolunteerForm from './components/VolunteerForm.js';     
import LiveAlertsSection from './components/LiveAlertsSection.js'; 
import AdminLogin from './components/AdminLogin.js'; 
import AdminRegister from './components/AdminRegister.js'; 
import RoutePlanner from './components/RoutePlanner.js'; 

import './App.css'; 
import 'leaflet/dist/leaflet.css'; 

const DISASTER_API_URL = 'http://localhost:5000/api/disasters/india/active';

function App() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminToken, setAdminToken] = useState(null); 
  const [showAdminRegister, setShowAdminRegister] = useState(false); 
  
  const [activeHelpRequests, setActiveHelpRequests] = useState([]); 
  const [alertsRefreshKey, setAlertsRefreshKey] = useState(0); 

  const incrementRefreshKey = () => { setAlertsRefreshKey(prevKey => prevKey + 1); };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(DISASTER_API_URL);
        setEvents(response.data.features || response.data); 
        setLoading(false);
      } catch (err) {
        console.error("Disaster API failed:", err); 
        setError("Failed to fetch live disaster data for India.");
        setEvents([]);
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // --- Dashboard Metrics Calculation ---
  const activeAlerts = events.filter(e => e.properties.severity === 'Severe' || e.properties.severity === 'Extreme').length;
  const criticalEvents = events.filter(e => e.properties.severity === 'Extreme').length;
  const totalEvents = events.length;
  const safetyGuidesCount = 12; 
  const openAidRequests = activeHelpRequests.length; 

  const handleAdminLoginSuccess = (token) => {
    setAdminToken(token);
    setIsAdminLoggedIn(true);
    window.scrollTo({ top: document.getElementById('alerts')?.offsetTop || 0, behavior: 'smooth' });
  };
  
  const handleRegistrationComplete = () => { setShowAdminRegister(false); };
  
  // --- ROUTE PLANNER LOGIC ---
  const handlePlanRoute = (source, destination, alerts) => {
      if (typeof maps_local === 'undefined' || !maps_local.show_on_map) {
          alert("Map service not available. Ensure the external map script is loaded.");
          console.error("The maps_local tool is not defined or accessible.");
          return;
      }
      
      const placesToPlot = [];
      placesToPlot.push(`Start: ${source}`);
      placesToPlot.push(`Destination: ${destination}`);
      
      alerts.forEach(alert => {
          const location = alert.manualAddress || (alert.geolocation ? `${alert.disasterType} at ${alert.geolocation.lat}, ${alert.geolocation.lon}` : alert.disasterType);
          placesToPlot.push(location);
      });
      
      const query = `Route from ${source} to ${destination} with active disaster alerts.`;
      maps_local.show_on_map({ places: placesToPlot, query: query });
  };
  // ------------------------------------

  const renderDashboardContent = () => (
    <Container className="my-5">
      <h2 className="section-title text-center mb-4">Current Situational Overview</h2>

      {loading ? (
        <div className="text-center my-5"><Spinner animation="border" variant="primary" /><p className="text-info mt-2">Loading real-time data...</p></div>
      ) : (
        <>
          {error && <Alert variant="warning" className="text-center">⚠️ {error}</Alert>} 
        
          <Row xs={1} md={2} lg={4} className="g-4 mb-5">
            <Col><StatusCard title="Active Alerts" value={activeAlerts} theme="alert" description="High-priority events needing attention."/></Col>
            <Col><StatusCard title="Critical Events (Extreme)" value={criticalEvents} theme="critical" description="Events with highest potential impact."/></Col>
            <Col><StatusCard title="Safety Guides" value={safetyGuidesCount} theme="success" description="Educational guides available for download."/></Col>
            <Col><StatusCard title="Open Aid Requests" value={openAidRequests} theme="info" description="Requests for food, water, or medical help."/></Col>
          </Row>

          <Row className="g-4">
            <Col lg={7} className="p-0"> 
              <Card className="shadow-sm h-100">
                  <Card.Header as="h5" className="bg-primary text-white">Live Map Visualization (India Hazards)</Card.Header>
                  <Card.Body className="p-0" style={{ height: '50vh' }}>
                      <MapComponent events={events} />
                  </Card.Body>
              </Card>
            </Col>
            <Col lg={5} className="p-0"> 
               <Card className="shadow-sm h-100">
                  <Card.Header as="h5" className="bg-secondary text-white">Latest Event Details ({totalEvents} Found)</Card.Header>
                  <Card.Body className="p-0">
                      <EventList events={events} />
                  </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );


  const renderPublicView = () => (
    <>
      <div className="hero-section text-center py-5 mb-5 bg-light shadow-sm">
        <Container>
          <h1 className="display-4 text-primary">Your Local Disaster Safety & Alert Hub 🇮🇳</h1>
          <p className="lead text-muted">We provide <strong>real-time alerts</strong> for all hazards in India, <strong>safety guidance</strong>, and <strong>coordinate aid</strong> during emergencies.</p>
          <Button variant="danger" size="lg" onClick={() => window.scrollTo({ top: document.getElementById('alerts')?.offsetTop || 0, behavior: 'smooth' })}>
            VIEW LIVE ALERTS
          </Button>
        </Container>
      </div>

      {renderDashboardContent()}

      <Container>
        <section id="route" className="my-5 py-3 border-top">
            <RoutePlanner onPlanRoute={handlePlanRoute} activeAlerts={activeHelpRequests} />
        </section>

        <section id="alerts" className="my-5 py-3">
            <LiveAlertsSection key={alertsRefreshKey} isAdmin={isAdminLoggedIn} adminToken={adminToken} onAlertsFetched={setActiveHelpRequests} />
        </section>

        <section id="help" className="my-5 py-3 border-top">
            <HelpRequestForm onSuccessfulSubmit={incrementRefreshKey} /> 
        </section>
        
        <section id="volunteer" className="my-5 py-3">
            <VolunteerForm /> 
        </section>
      </Container>
    </>
  );

  const renderAdminPortal = () => (
    <Container className="my-5 admin-portal-wrapper">
        <h1 className="text-danger text-center mb-1">Admin Portal</h1>
        <p className="lead text-center text-muted mb-5">Incident Management for {adminToken}</p>

        <section id="alerts" className="mb-5">
            <LiveAlertsSection key={alertsRefreshKey} isAdmin={isAdminLoggedIn} adminToken={adminToken} onAlertsFetched={setActiveHelpRequests} />
        </section>

        <section id="help" className="mb-5">
            <HelpRequestForm onSuccessfulSubmit={incrementRefreshKey} /> 
        </section>
    </Container>
  );

  return (
    <div className="app-container">
      
      <Navbar isAdmin={isAdminLoggedIn} adminToken={adminToken} onLogout={() => { setIsAdminLoggedIn(false); setAdminToken(null); }} />

      <div className="content-wrapper">
        
        {isAdminLoggedIn ? renderAdminPortal() : renderPublicView()}

        <section id="admin" className="admin-auth-section py-5 bg-light border-top">
          <Container>
            <div className="admin-toggle text-center mb-4">
                {isAdminLoggedIn ? (
                    <Button variant="outline-danger" size="sm" onClick={() => { setIsAdminLoggedIn(false); setAdminToken(null); }}>
                        Logout Admin ({adminToken})
                    </Button>
                ) : (
                    <>
                        <p className="mb-2">Access Admin Tools: </p>
                        <Button variant="link" onClick={() => setShowAdminRegister(!showAdminRegister)}>
                            {showAdminRegister ? 'Switch to Login' : 'Admin Login/Register'}
                        </Button>
                    </>
                )}
            </div>
            
            {!isAdminLoggedIn && (
                showAdminRegister ? (
                    <AdminRegister onRegistrationComplete={handleRegistrationComplete} />
                ) : (
                    <AdminLogin onLoginSuccess={handleAdminLoginSuccess} />
                )
            )}
          </Container>
        </section>

      </div>
    </div>
  );
}

export default App;