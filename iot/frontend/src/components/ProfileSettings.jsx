import React, { useState, useEffect, useRef } from 'react';
import {
    User, Mail, Phone, Globe, Camera, MapPin, Ruler,
    Navigation, Lock, LogOut, Trash2, Save, Map as MapIcon,
    Check, AlertCircle, Loader2, ChevronRight, Languages, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// shadcn-like components (assuming they are available in the project)
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";

const ProfileSettings = ({ token, onLogout, API_BASE: propApiBase, onProfileUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [showMap, setShowMap] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });
    const fileInputRef = useRef(null);

    const API_BASE = propApiBase || window.API_BASE || `http://${window.location.hostname}:8000/api/v1`;
    const SERVER_URL = API_BASE.replace('/api/v1', '');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API_BASE}/farmers/full-profile`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileData(res.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching profile:", err);
            toast.error("Failed to load profile settings");
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const updatePayload = {
                name: profileData.profile.name,
                email: profileData.profile.email,
                phone_number: profileData.profile.phone_number,
                preferred_language: profileData.profile.preferred_language,
            };

            await axios.put(`${API_BASE}/farmers/full-profile/update`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onProfileUpdate) onProfileUpdate(profileData);
            toast.success("Personal information updated!");
        } catch (err) {
            toast.error("Failed to save changes");
        } finally {
            setSaving(false);
        }
    };

    const handleSaveFarm = async () => {
        setSaving(true);
        try {
            const updatePayload = {
                farm_name: profileData.farm.farm_name,
                village: profileData.farm.village,
                farm_size: profileData.farm.farm_size,
                latitude: profileData.farm.latitude,
                longitude: profileData.farm.longitude,
            };

            await axios.put(`${API_BASE}/farmers/full-profile/update`, updatePayload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (onProfileUpdate) onProfileUpdate(profileData);
            toast.success("Farm details updated!");
        } catch (err) {
            toast.error("Failed to save farm details");
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setSaving(true);
        try {
            const res = await axios.post(`${API_BASE}/farmers/upload-photo`, formData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            const newProfileData = {
                ...profileData,
                profile: { ...profileData.profile, profile_photo: res.data.photo_url }
            };
            setProfileData(newProfileData);
            if (onProfileUpdate) onProfileUpdate(newProfileData);
            toast.success("Profile photo updated!");
        } catch (err) {
            console.error("Upload error:", err.response?.data || err.message);
            toast.error(`Failed to upload photo: ${err.response?.data?.detail || "Check server logs"}`);
        } finally {
            setSaving(false);
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            click(e) {
                setProfileData({
                    ...profileData,
                    farm: { ...profileData.farm, latitude: e.latlng.lat, longitude: e.latlng.lng }
                });
            },
        });
        return profileData.farm.latitude ? (
            <Marker position={[profileData.farm.latitude, profileData.farm.longitude]} />
        ) : null;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-muted-foreground font-medium">Loading your profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                        <User className="text-emerald-500" size={24} />
                    </div>
                    Profile Settings
                </h1>
                <p className="text-muted-foreground">Manage your account preferences and farm configuration</p>
            </header>

            {/* Section 1: Personal Information */}
            <Card className="rounded-[2rem] border-emerald-500/10 shadow-xl shadow-emerald-500/5 bg-card/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <User className="text-emerald-500" size={20} />
                        </div>
                        <div>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details and how we contact you</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
                        <div className="relative group">
                            <Avatar className="w-24 h-24 border-4 border-emerald-500/10 shadow-inner">
                                <AvatarImage src={profileData.profile.profile_photo ? (profileData.profile.profile_photo.startsWith('http') ? profileData.profile.profile_photo : `${SERVER_URL}${profileData.profile.profile_photo}`) : ''} />
                                <AvatarFallback className="bg-emerald-500/10 text-emerald-500 text-2xl font-black">
                                    {profileData.profile.name[0]}
                                </AvatarFallback>
                            </Avatar>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                            />
                            <button
                                className="absolute bottom-0 right-0 p-2 bg-emerald-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                                onClick={() => fileInputRef.current.click()}
                                disabled={saving}
                            >
                                <Camera size={16} />
                            </button>
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="text-lg font-bold">{profileData.profile.name}</h3>
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <Check size={14} className="text-emerald-500" /> Member since {new Date().getFullYear()}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Full Name</Label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                    value={profileData.profile.name}
                                    onChange={(e) => setProfileData({ ...profileData, profile: { ...profileData.profile, name: e.target.value } })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 rounded-xl font-bold opacity-70 cursor-not-allowed"
                                    value={profileData.profile.phone_number}
                                    disabled
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Email Address</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                    value={profileData.profile.email || ''}
                                    onChange={(e) => setProfileData({ ...profileData, profile: { ...profileData.profile, email: e.target.value } })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Preferred Language</Label>
                            <div className="relative">
                                <Languages className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 z-10" />
                                <Select
                                    value={profileData.profile.preferred_language}
                                    onValueChange={(val) => setProfileData({ ...profileData, profile: { ...profileData.profile, preferred_language: val } })}
                                >
                                    <SelectTrigger className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold">
                                        <SelectValue placeholder="Select language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="English">English</SelectItem>
                                        <SelectItem value="Telugu">Telugu</SelectItem>
                                        <SelectItem value="Hindi">Hindi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-8 pt-0 border-t border-emerald-500/5 bg-emerald-500/[0.02] flex justify-end gap-3 mt-4">
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="rounded-xl px-8 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-bold gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            {/* Section 2: Farm Information */}
            <Card className="rounded-[2rem] border-emerald-500/10 shadow-xl shadow-emerald-500/5 bg-card/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                            <MapPin className="text-emerald-500" size={20} />
                        </div>
                        <div>
                            <CardTitle>Farm Information</CardTitle>
                            <CardDescription>Configure your field boundaries and location for AI analysis</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Farm Name</Label>
                            <Input
                                className="h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                value={profileData.farm.farm_name || ''}
                                onChange={(e) => setProfileData({ ...profileData, farm: { ...profileData.farm, farm_name: e.target.value } })}
                                placeholder="E.g. Green Valley Farm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Village / District</Label>
                            <Input
                                className="h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                value={profileData.farm.village}
                                onChange={(e) => setProfileData({ ...profileData, farm: { ...profileData.farm, village: e.target.value } })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Farm Size (Acres / Ha)</Label>
                            <div className="relative">
                                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    type="number"
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                    value={profileData.farm.farm_size}
                                    onChange={(e) => setProfileData({ ...profileData, farm: { ...profileData.farm, farm_size: parseFloat(e.target.value) } })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Latitude</Label>
                                <Input
                                    className="h-12 bg-secondary/30 border-emerald-500/10 rounded-xl font-bold opacity-70"
                                    value={profileData.farm.latitude?.toFixed(6) || ''}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Longitude</Label>
                                <Input
                                    className="h-12 bg-secondary/30 border-emerald-500/10 rounded-xl font-bold opacity-70"
                                    value={profileData.farm.longitude?.toFixed(6) || ''}
                                    readOnly
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Farm Location Map</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                className="rounded-lg h-8 px-3 text-[11px] font-bold border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5"
                                onClick={() => setShowMap(!showMap)}
                            >
                                <MapIcon size={14} className="mr-1" />
                                {showMap ? 'Hide Map' : 'Select Location on Map'}
                            </Button>
                        </div>

                        <AnimatePresence>
                            {showMap && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 300, opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden rounded-2xl border border-emerald-500/10"
                                >
                                    <MapContainer
                                        center={[profileData.farm.latitude || 17.385, profileData.farm.longitude || 78.486]}
                                        zoom={15}
                                        style={{ height: '300px', width: '100%' }}
                                    >
                                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                        <LocationMarker />
                                    </MapContainer>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-emerald-500/[0.03] border border-emerald-500/5 p-4 rounded-xl flex gap-3">
                            <AlertCircle className="text-emerald-500 shrink-0" size={18} />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground">Why we need your location?</p>
                                <ul className="text-[11px] text-muted-foreground space-y-1 list-disc ml-3">
                                    <li>Precision local weather forecasting</li>
                                    <li>Sentinel satellite crop health monitoring</li>
                                    <li>Site-specific farm analytics and AI advice</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="p-8 pt-0 border-t border-emerald-500/5 bg-emerald-500/[0.02] flex justify-end gap-3 mt-4">
                    <Button
                        onClick={handleSaveFarm}
                        disabled={saving}
                        className="rounded-xl px-8 h-12 bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 font-bold gap-2"
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Farm Details
                    </Button>
                </CardFooter>
            </Card>

            {/* Section 3: Security */}
            <Card className="rounded-[2rem] border-red-500/10 shadow-xl shadow-red-500/5 bg-card/50 backdrop-blur-xl overflow-hidden">
                <CardHeader className="p-8 pb-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                            <Shield size={20} className="text-red-500" />
                        </div>
                        <div>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Secure your account and manage your access sessions</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Current Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    type="password"
                                    className="pl-12 h-12 bg-secondary/30 border-red-500/10 focus:border-red-500/40 rounded-xl font-bold"
                                    placeholder="••••••••"
                                    value={passwordData.current}
                                    onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    type="password"
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                    placeholder="••••••••"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground ml-1">Confirm New Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <Input
                                    type="password"
                                    className="pl-12 h-12 bg-secondary/30 border-emerald-500/10 focus:border-emerald-500/40 rounded-xl font-bold"
                                    placeholder="••••••••"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                        <Button className="rounded-xl h-12 px-6 bg-emerald-500 hover:bg-emerald-600 font-bold gap-2">
                            <Lock size={18} />
                            Update Password
                        </Button>
                        <Button
                            variant="secondary"
                            className="rounded-xl h-12 px-6 font-bold gap-2 bg-secondary hover:bg-secondary/80 border border-border"
                            onClick={onLogout}
                        >
                            <LogOut size={18} />
                            Logout
                        </Button>
                    </div>

                    <div className="pt-6 border-t border-red-500/10">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <h4 className="text-sm font-bold text-red-500">Danger Zone</h4>
                                <p className="text-xs text-muted-foreground">Permanently delete your profile and all associated sensor data.</p>
                            </div>
                            <Button variant="destructive" className="rounded-xl h-12 px-6 font-bold gap-2 shadow-lg shadow-red-500/10 transition-all hover:scale-105">
                                <Trash2 size={18} />
                                Delete Account
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ProfileSettings;
