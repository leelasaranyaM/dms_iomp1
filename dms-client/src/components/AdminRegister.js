// src/components/AdminRegister.js
import React, { useState } from 'react';
import axios from 'axios';
import { Form, Button, Card, Alert } from 'react-bootstrap';
import './AdminAuth.css'; 

const API_SEND_OTP_URL = 'http://localhost:5000/api/admin/register/send-otp';
const API_VERIFY_OTP_URL = 'http://localhost:5000/api/admin/register/verify-otp';

function AdminRegister({ onRegistrationComplete }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phone, setPhone] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [stage, setStage] = useState(1); 
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (password !== confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }

        try {
            await axios.post(API_SEND_OTP_URL, { email, password, phone });
            setMessage('✅ OTP sent! Please check your mobile phone for the code.');
            setStage(2); 
        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed. Check if phone/email is valid.';
            setError('❌ ' + msg);
        } finally {
            setLoading(false);
        }
    };
    
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            await axios.post(API_VERIFY_OTP_URL, { phone, otpCode });
            
            setMessage('✅ Verification successful! Account created. Switching to Login...');
            setTimeout(() => onRegistrationComplete(), 2000); 

        } catch (err) {
            const msg = err.response?.data?.message || 'Verification failed. Code may be expired.';
            setError('❌ ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const renderStage1 = () => (
        <Form onSubmit={handleSendOtp}>
            <Form.Group className="mb-3" controlId="registerEmail"><Form.Label>Email</Form.Label><Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" required/></Form.Group>
            <Form.Group className="mb-3" controlId="registerPhone"><Form.Label>Phone Number (For SMS Alerts) *</Form.Label><Form.Control type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +919876543210" required/></Form.Group>
            <Form.Group className="mb-3" controlId="registerPassword"><Form.Label>Password</Form.Label><Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Master Password" required/></Form.Group>
            <Form.Group className="mb-3" controlId="registerConfirmPassword"><Form.Label>Confirm Password</Form.Label><Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" required/></Form.Group>
            
            <Button variant="primary" type="submit" disabled={loading} className="w-100 mt-3">{loading ? 'Sending OTP...' : 'Send Verification Code'}</Button>
        </Form>
    );
    
    const renderStage2 = () => (
        <Form onSubmit={handleVerifyOtp}>
            <Alert variant="info" className="text-start">We sent a 6-digit code to **{phone}**. Enter it below to complete registration.</Alert>
            <Form.Group className="mb-3" controlId="otpCode">
                <Form.Label>Verification Code (OTP)</Form.Label>
                <Form.Control type="text" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 6-digit code" required maxLength={6}/>
            </Form.Group>
            
            <Button variant="success" type="submit" disabled={loading} className="w-100 mt-3">{loading ? 'Verifying...' : 'Verify & Register'}</Button>
            <Button variant="link" size="sm" onClick={() => setStage(1)} className="mt-2">Back to Details</Button>
        </Form>
    );

    return (
        <Card className="admin-auth-container shadow">
            <Card.Body>
                <Card.Title as="h3" className="text-center text-primary mb-3">
                    {stage === 1 ? '🛡️ Admin Account Registration' : '📱 Verify Phone Number'}
                </Card.Title>
                
                {error && <Alert variant="danger">{error}</Alert>}
                {message && <Alert variant="success">{message}</Alert>}

                {stage === 1 ? renderStage1() : renderStage2()}
            </Card.Body>
        </Card>
    );
}

export default AdminRegister;