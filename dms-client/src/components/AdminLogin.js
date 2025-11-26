// src/components/AdminLogin.js (FINAL CODE)

import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import './AdminAuth.css'; 

const API_LOGIN_URL = 'http://localhost:5000/api/admin/login';
const API_RESET_SEND_OTP = 'http://localhost:5000/api/admin/reset/send-otp';
const API_RESET_CHANGE_PASS = 'http://localhost:5000/api/admin/reset/change-password';

// Helper function to ensure E.164 format for the backend (Crucial Fix)
const normalizePhone = (num) => {
    if (!num) return num;
    
    // Remove all non-digit characters
    const digits = num.replace(/\D/g, '');
    
    // Check if the number already starts with a country code (usually 11 or 12 digits total)
    if (num.startsWith('+')) {
        return num; // Assume it's correctly formatted
    }
    
    // If it's a 10-digit number (common in India), prepend the country code +91
    if (digits.length === 10) {
        return `+91${digits}`;
    }
    
    // If the number is long (like 919876543210), assume + is missing
    if (digits.length > 10) {
        return `+${digits}`; 
    }
    
    return num; // Return original if format is too strange
};


function AdminLogin({ onLoginSuccess }) {
    // Shared state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Reset/OTP State
    const [phone, setPhone] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [flowState, setFlowState] = useState('login'); // login | reset_phone | reset_otp | reset_pass

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post(API_LOGIN_URL, { email, password });
            onLoginSuccess(response.data.token); 
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check server status.');
        } finally {
            setLoading(false);
        }
    };

    const handleSendResetOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const normalizedPhone = normalizePhone(phone); // ⬅️ CRUCIAL: Normalize the phone number

        try {
            // Use the normalized number for the API request
            await axios.post(API_RESET_SEND_OTP, { phone: normalizedPhone }); 
            setPhone(normalizedPhone); // Save the normalized number in state for verification
            setFlowState('reset_otp');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Check phone number and retry.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (newPassword !== confirmNewPassword) {
            setError('New passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            // Use the normalized phone number (already in state) for the API request
            await axios.post(API_RESET_CHANGE_PASS, { phone, otpCode, newPassword }); 
            
            alert('Password successfully changed. Please log in.');
            setFlowState('login');
            setEmail('');
            setPassword('');
        } catch (err) {
            setError(err.response?.data?.message || 'Password change failed. Invalid OTP or server error.');
        } finally {
            setLoading(false);
        }
    };


    const renderLogin = () => (
        <>
            <Form onSubmit={handleLogin}>
                <Form.Group className="mb-3" controlId="loginEmail">
                    <Form.Label>Email</Form.Label>
                    <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required/>
                </Form.Group>
                <Form.Group className="mb-3" controlId="loginPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required/>
                </Form.Group>
                
                <Button variant="primary" type="submit" disabled={loading} className="w-100 mt-3">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Log In'}
                </Button>
            </Form>
            <Button variant="link" size="sm" onClick={() => { setFlowState('reset_phone'); setError('');}} className="mt-2">
                Forgot Password?
            </Button>
        </>
    );
    
    const renderResetPhone = () => (
        <>
            <h5 className="text-center text-muted">Reset Password</h5>
            <p className="small text-center mb-4">Enter your registered phone number to receive a verification code.</p>
            <Form onSubmit={handleSendResetOtp}>
                <Form.Group className="mb-3" controlId="resetPhone">
                    <Form.Label>Phone Number (e.g., +91987...)</Form.Label>
                    <Form.Control type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Registered Phone Number" required/>
                </Form.Group>
                <Button variant="warning" type="submit" disabled={loading} className="w-100 mt-3">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Send Reset Code'}
                </Button>
            </Form>
            <Button variant="link" size="sm" onClick={() => { setFlowState('login'); setError(''); setPhone(''); }} className="mt-2">
                Back to Login
            </Button>
        </>
    );
    
    const renderResetOtp = () => (
        <>
            <h5 className="text-center text-muted">Verify Code</h5>
            <p className="small text-center mb-3">Code sent to **{phone}**. Enter code and new password.</p>
            <Form onSubmit={handleChangePassword}>
                <Form.Group className="mb-3" controlId="resetOtp">
                    <Form.Label>Verification Code (OTP)</Form.Label>
                    <Form.Control type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-digit code" required maxLength={6}/>
                </Form.Group>

                <Form.Group className="mb-3" controlId="newPassword">
                    <Form.Label>New Password</Form.Label>
                    <Form.Control type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required/>
                </Form.Group>
                
                <Form.Group className="mb-3" controlId="confirmNewPassword">
                    <Form.Label>Confirm New Password</Form.Label>
                    <Form.Control type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required/>
                </Form.Group>
                
                <Button variant="success" type="submit" disabled={loading} className="w-100 mt-3">
                    {loading ? <Spinner animation="border" size="sm" /> : 'Change Password'}
                </Button>
            </Form>
            <Button variant="link" size="sm" onClick={() => setFlowState('reset_phone')} className="mt-2">
                Resend Code
            </Button>
        </>
    );

    return (
        <Card className="admin-auth-container shadow">
            <Card.Body>
                <Card.Title as="h3" className="text-center text-primary mb-3">
                    {flowState === 'login' ? '🔒 Admin Login' : '🔑 Password Reset'}
                </Card.Title>
                
                {error && <Alert variant="danger">{error}</Alert>}
                
                {flowState === 'login' && renderLogin()}
                {flowState === 'reset_phone' && renderResetPhone()}
                {flowState === 'reset_otp' && renderResetOtp()}
            </Card.Body>
        </Card>
    );
}

export default AdminLogin;