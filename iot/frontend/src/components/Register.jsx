import React, { useState } from 'react';
import { Droplets, User, Lock, Phone, ArrowRight, Loader2, UserPlus, ShieldPlus, CheckCircle2, MapPin, Languages } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Register = ({ onRegister, onSwitchToLogin }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone_number: '',
        password: '',
        village: '',
        preferred_language: 'English'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const apiBase = window.API_BASE || 'http://127.0.0.1:8000/api/v1';

            // Phone normalization
            const rawPhone = formData.phone_number.trim().replace(/\s+/g, '');
            let normalizedPhone = rawPhone;
            if (!normalizedPhone.startsWith('+')) {
                normalizedPhone = normalizedPhone.replace(/^0+/, '').replace(/^91/, '');
                normalizedPhone = '+91' + normalizedPhone;
            }

            // Backend compatibility (auto-generating email)
            const cleanPhone = normalizedPhone.replace(/\D/g, '').slice(-10);
            const dataToSubmit = {
                ...formData,
                phone_number: normalizedPhone,
                email: cleanPhone + '@farmer.com',
                crop_type: 'Unknown',
                field_area: 1.0,
                growth_stage: 'Initial',
                season: 'Kharif'
            };

            await axios.post(`${apiBase}/farmers/register`, dataToSubmit);

            // Log them in
            const loginRes = await axios.post(`${apiBase}/farmers/login`, {
                username: dataToSubmit.email,
                password: formData.password
            });

            onRegister(loginRes.data.access_token);
        } catch (err) {
            setError(err.response?.data?.detail || 'Account with this phone number might already exist.');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6 bg-background overflow-hidden font-sans">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-xl"
            >
                <div className="bg-card border border-border rounded-3xl shadow-2xl p-8 md:p-10 backdrop-blur-sm bg-card/95">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
                            <UserPlus className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="font-display text-3xl font-extrabold mb-2 tracking-tight">Farmer Enrollment</h2>
                        <p className="text-muted-foreground text-sm font-medium">Join the GraminLink AI precision irrigation network</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold p-4 rounded-xl mb-8 text-center"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="your name"
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 transition-all rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    required
                                    placeholder="+91..."
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 transition-all rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Village Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    name="village"
                                    value={formData.village}
                                    onChange={handleChange}
                                    required
                                    placeholder="e.g. Rampur"
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 transition-all rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                <Input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    placeholder="••••••••"
                                    className="pl-12 h-14 bg-secondary/30 border-border focus:border-primary/50 transition-all rounded-2xl"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 p-4 bg-primary/5 rounded-2xl flex items-start gap-4 border border-primary/10">
                            <ShieldPlus className="w-5 h-5 text-primary mt-1 shrink-0" />
                            <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                Account is verified via SMS. By registering, you agree to receive automated AI calls for farm health monitoring and irrigation advice.
                            </p>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="md:col-span-2 h-14 rounded-2xl text-base font-bold gap-3 transition-transform active:scale-[0.98] mt-2 group shadow-lg shadow-primary/20"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Registration <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-10 text-center">
                        <p className="text-sm text-muted-foreground font-medium">
                            Already have an account?{" "}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-primary font-bold hover:underline underline-offset-4 ml-1"
                            >
                                Log in here
                            </button>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                    <span className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded-lg"><CheckCircle2 className="w-3 h-3 text-primary" /> 256-bit Secure</span>
                    <span className="flex items-center gap-2 px-3 py-1 bg-secondary/20 rounded-lg"><CheckCircle2 className="w-3 h-3 text-primary" /> Free for Indian Farmers</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Register;
