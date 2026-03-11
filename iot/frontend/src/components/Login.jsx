import React, { useState } from 'react';
import { Droplets, Mail, Lock, LogIn, ArrowRight, Loader2, UserPlus, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Login = ({ onLogin, onSwitchToRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiBase = window.API_BASE || 'http://127.0.0.1:8000/api/v1';

            // Send username as typed. The backend handles phone (+91...), email, 
            // and auto-generated @farmer.com formats automatically.
            const response = await axios.post(`${apiBase}/farmers/login`, {
                username: username.trim(),
                password: password
            });
            onLogin(response.data.access_token);
        } catch (err) {
            setError(err.response?.data?.detail || 'Invalid login details. Please check your phone/email and password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6 bg-background overflow-hidden font-sans">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[10%] w-[20%] h-[20%] bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 md:p-10 backdrop-blur-sm bg-card/95">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                            <Droplets className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="font-display text-3xl font-extrabold mb-2 tracking-tight text-foreground">Welcome Back</h2>
                        <p className="text-muted-foreground text-sm font-medium">Log in to your GraminLink command center</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold p-4 rounded-xl mb-6 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Phone or Email</label>
                            </div>
                            <div className="relative">
                                <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="your phone number or email"
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl text-foreground placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Password</label>
                                <button type="button" className="text-[10px] font-bold text-primary hover:underline">Forgot?</button>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-2xl text-foreground placeholder:text-muted-foreground/50"
                                    required
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-14 rounded-2xl text-base font-bold gap-3 transition-all hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] mt-4"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Log In <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center relative">
                        <div className="absolute inset-0 flex items-center pointer-events-none">
                            <div className="w-full border-t border-border"></div>
                        </div>
                        <span className="relative bg-card px-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">New to GraminLink?</span>
                    </div>

                    <div className="mt-8 text-center">
                        <button
                            onClick={onSwitchToRegister}
                            className="group flex items-center justify-center gap-2 mx-auto text-foreground font-bold hover:text-primary transition-colors py-2 px-4 rounded-xl border border-border hover:border-primary/30 bg-secondary/10"
                        >
                            Create a Free Account
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.3em]">Precision Irrigation System v4.0</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
