import React, { useState } from 'react';
import { Droplets, Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

const Login = ({ onLogin, onSwitchToRegister }) => {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiBase = window.API_BASE || 'http://127.0.0.1:8000/api/v1';
            const cleanPhone = phone.replace(/\D/g, '');
            const defaultEmailFormat = cleanPhone + '@farmer.com'; // Our backend uses email format
            const response = await axios.post(`${apiBase}/farmers/login`, {
                username: defaultEmailFormat,
                password: password
            });
            onLogin(response.data.access_token);
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', padding: '1rem' }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
            >
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '64px', height: '64px', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                        <Droplets size={32} color="#10b981" />
                    </div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Welcome Back</h2>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>Login to your irrigation assistant</p>
                </div>

                {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Phone Number</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="text"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91..."
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 3rem', background: '#1e293b', border: '1px solid #334155', borderRadius: '0.75rem', color: 'white', outline: 'none' }}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        style={{ width: '100%', background: '#10b981', color: 'white', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                    >
                        {loading ? 'Logging in...' : <><LogIn size={18} /> Login Now</>}
                    </button>
                </form>

                <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                    <span style={{ color: '#94a3b8' }}>Don't have an account? </span>
                    <button
                        onClick={onSwitchToRegister}
                        style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    >
                        Register here
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
