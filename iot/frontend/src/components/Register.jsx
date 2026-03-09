import React, { useState } from 'react';
import { Droplets, User, Mail, Lock, Phone, MapPin, Sprout, Clipboard, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Register = ({ onRegister, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone_number: '',
        village: 'Unknown',
        preferred_language: 'English'
        // Note: crop_type, field_area, growth_stage, and season are NOT collected here
        // They will be collected during the AI voice call
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiBase = window.API_BASE || 'http://127.0.0.1:8000/api/v1';

            // Auto-generate email based on phone number for backend compatibility
            // Auto-generate email based on phone number for backend compatibility, stripping + and making standard
            // Normalize phone number to E.164 format (+91XXXXXXXXXX)
            const rawPhone = formData.phone_number.trim().replace(/\s+/g, '');
            let normalizedPhone = rawPhone;
            if (!normalizedPhone.startsWith('+')) {
                // Strip leading zeros or 91 prefix if present, then add +91
                normalizedPhone = normalizedPhone.replace(/^0+/, '').replace(/^91/, '');
                normalizedPhone = '+91' + normalizedPhone;
            }

            const cleanPhone = normalizedPhone.replace(/\D/g, '');
            const dataToSubmit = {
                ...formData,
                phone_number: normalizedPhone,
                email: cleanPhone + '@farmer.com',
                // These fields will be collected during AI voice call, but we need to provide defaults
                crop_type: 'Unknown',
                field_area: 1.0,
                growth_stage: 'Initial',
                season: 'Kharif'
            };

            await axios.post(`${apiBase}/farmers/register`, dataToSubmit);

            // Automatically log them in after registration
            const loginRes = await axios.post(`${apiBase}/farmers/login`, {
                username: dataToSubmit.email,
                password: formData.password
            });

            onRegister(loginRes.data.access_token);
        } catch (err) {
            if (err.response?.data?.detail) {
                const detail = err.response.data.detail;
                if (Array.isArray(detail)) {
                    setError(detail.map(d => d.msg).join(', '));
                } else {
                    setError(detail);
                }
            } else {
                setError('Registration failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="login-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '2rem' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{ width: '100%', maxWidth: '600px', padding: '2.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Farmer Registration</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Join the AI Precision Irrigation network</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    {/* Basic Info */}
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Full Name</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} placeholder="John Doe" />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Phone Number (for AI calls)</label>
                        <div style={{ position: 'relative' }}>
                            <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input name="phone_number" value={formData.phone_number} onChange={handleChange} required style={inputStyle} placeholder="+91..." />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input type="password" name="password" value={formData.password} onChange={handleChange} required style={inputStyle} placeholder="••••••••" />
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', background: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '1rem' }}
                        >
                            {loading ? 'Creating Account...' : <><UserPlus size={18} /> Register Account</>}
                        </button>
                    </div>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#94a3b8' }}>Already have an account? </span>
                    <button
                        onClick={onSwitchToLogin}
                        style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                        Login here
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const inputStyle = {
    width: '100%',
    padding: '0.75rem 1rem 0.75rem 3rem',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    color: 'white',
    outline: 'none',
    fontSize: '0.875rem'
};

const selectStyle = {
    ...inputStyle,
    padding: '0.75rem 1rem 0.75rem 1rem',
    appearance: 'none',
    cursor: 'pointer'
};

export default Register;
