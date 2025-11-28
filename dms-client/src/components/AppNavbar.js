// src/components/AppNavbar.js
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

function AppNavbar({ isAdmin, onLogout }) {

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 60,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Navbar bg="dark" variant="dark" expand="md" className="shadow-sm fixed-top">
      <Container>
        <Navbar.Brand
          style={{ cursor: "pointer" }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          DM-Hub
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="dmhub-navbar" />
        <Navbar.Collapse id="dmhub-navbar">
          <Nav className="me-auto">
            <Nav.Link onClick={() => scrollToSection("alerts")}>
              Live Alerts
            </Nav.Link>
            <Nav.Link onClick={() => scrollToSection("help")}>
              Request Help
            </Nav.Link>
            <Nav.Link onClick={() => scrollToSection("volunteer")}>
              Volunteer
            </Nav.Link>
          </Nav>

          <Nav>
            {!isAdmin ? (
              <Nav.Link onClick={() => scrollToSection("admin")}>
                Admin Login
              </Nav.Link>
            ) : (
              <Nav.Link onClick={onLogout}>
                Logout Admin
              </Nav.Link>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;
