// src/components/AdminLogin.js
import React, { useState } from 'react';
import axios from 'axios';
import { Card, Button, Form, Spinner } from 'react-bootstrap';

const API_BASE = 'http://localhost:5000';

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await axios.post(`${API_BASE}/api/admin/login`, {
        email,
        password,
      });

      // Backend returns: { isAdmin: true, token: user.email }
      const token = res.data.token;

      if (onLoginSuccess) {
        onLoginSuccess(token);
      }
    } catch (err) {
      console.error('Admin login error:', err.response?.data || err.message);
      alert(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-sm mx-auto" style={{ maxWidth: 420 }}>
      <Card.Body>
        <Card.Title className="mb-3 text-center">Admin Login</Card.Title>
        <Card.Text className="text-muted small text-center mb-4">
          Use your verified Admin email and password to access the incident dashboard.
        </Card.Text>

        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="adminLoginEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </Form.Group>

          <Form.Group className="mb-3" controlId="adminLoginPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Logging in...
              </>
            ) : (
              'Log In'
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
}

export default AdminLogin;
