// my-dms-client/src/components/Navbar.js
import React from 'react';
import { Navbar as BNavbar, Container, Nav, Button } from 'react-bootstrap';
import './Navbar.css'; 

function Navbar({ isAdmin, adminToken, onLogout }) {
  
  const publicLinks = (
    <>
        <Nav.Link href="#alerts">Live Alerts 🚨</Nav.Link>
        <Nav.Link href="#route">Route Planner 🗺️</Nav.Link>
        <Nav.Link href="#help">Need Help 🆘</Nav.Link>
        <Nav.Link href="#volunteer">Volunteer 🤝</Nav.Link>
    </>
  );

  const adminLinks = (
    <>
        <Nav.Link href="#alerts">Incident Feed 📌</Nav.Link>
        <Nav.Link href="#help">Review Submissions</Nav.Link>
        <Button onClick={onLogout} variant="outline-light" size="sm" className="ms-3">
            Logout ({adminToken ? adminToken.split('@')[0] : 'Admin'})
        </Button>
    </>
  );

  return (
    <BNavbar 
        bg={isAdmin ? 'danger' : 'primary'} 
        variant="dark" 
        expand="lg" 
        sticky="top"
        className="shadow-lg"
    >
        <Container>
            <BNavbar.Brand href="/">
                DM-Hub 
                {isAdmin ? <span className="portal-tag"> - ADMIN PORTAL</span> : '🛡️'}
            </BNavbar.Brand>
            <BNavbar.Toggle aria-controls="responsive-navbar-nav" />
            <BNavbar.Collapse id="responsive-navbar-nav" className="justify-content-end">
                <Nav className="ms-auto">
                    <Nav.Link href="#">Home</Nav.Link>
                    {isAdmin ? adminLinks : publicLinks}
                    {!isAdmin && <Nav.Link href="#admin">Admin Login</Nav.Link>}
                </Nav>
            </BNavbar.Collapse>
        </Container>
    </BNavbar>
  );
}

export default Navbar;