import React, { useState, useEffect } from 'react';
import {
  Droplets, Thermometer, Wind, Activity,
  MapPin, Calendar, Power, AlertTriangle,
  ChevronRight, TrendingUp, History, User, Phone, LogOut, Loader2,
  Sun, Sunrise, CloudRain, Settings, X, Home, Cloud, Sprout, CalendarDays, Satellite, Languages
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './components/LandingPage';
import ProfileSettings from './components/ProfileSettings';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from 'sonner';

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = window.location.hostname.includes('ngrok') || window.location.port !== '5173'
  ? `${window.location.protocol}//${window.location.host}/api/v1`
  : `http://${window.location.hostname}:8000/api/v1`;
window.API_BASE = API_BASE;
console.log("Using API_BASE:", API_BASE);

const translations = {
  English: {
    home: "Home",
    soilHealth: "Soil Health",
    satellite: "Satellite",
    weather: "Weather",
    crops: "Crops",
    schedule: "Schedule",
    soilMoisture: "SOIL MOISTURE",
    temperature: "TEMPERATURE",
    pumpStatus: "PUMP STATUS",
    aiAdvice: "AI ADVICE",
    irrigationControl: "Irrigation Control",
    start: "Start",
    stop: "Stop",
    weatherForecast: "Weather Forecast",
    currentCrop: "Current Crop",
    growthStage: "Growth Stage",
    fieldInfo: "Field Information",
    village: "Village",
    fieldArea: "Field Area",
    editCropSettings: "Edit Crop Settings",
    nextRecommended: "Next Recommended Irrigation",
    when: "When",
    duration: "Duration",
    waterNeeded: "Water Needed",
    irrigationLogs: "Irrigation Logs",
    weeklyUsage: "Weekly Water Usage",
    satelliteMonitoring: "Satellite Monitoring",
    cropHealthNDVI: "Crop Health (NDVI)",
    aiInsights: "AI Insights",
    ndviInterpretation: "NDVI Interpretation",
    logout: "Logout",
    call: "Call",
    settings: "Settings"
  },
  Hindi: {
    home: "होम",
    soilHealth: "मिट्टी का स्वास्थ्य",
    satellite: "सैटेलाइट",
    weather: "मौसम",
    crops: "फसलें",
    schedule: "शेड्यूल",
    soilMoisture: "मिट्टी की नमी",
    temperature: "तापमान",
    pumpStatus: "पंप की स्थिति",
    aiAdvice: "AI सलाह",
    irrigationControl: "सिंचाई नियंत्रण",
    start: "शुरू करें",
    stop: "रोकें",
    weatherForecast: "मौसम का पूर्वानुमान",
    currentCrop: "वर्तमान फसल",
    growthStage: "विकास का चरण",
    fieldInfo: "खेत की जानकारी",
    village: "गांव",
    fieldArea: "क्षेत्रफल",
    editCropSettings: "फसल सेटिंग बदलें",
    nextRecommended: "अगली अनुशंसित सिंचाई",
    when: "कब",
    duration: "अवधि",
    waterNeeded: "पानी की आवश्यकता",
    irrigationLogs: "सिंचाई लॉग",
    weeklyUsage: "साप्ताहिक उपयोग",
    satelliteMonitoring: "सैटेलाइट मॉनिटरिंग",
    cropHealthNDVI: "फसल स्वास्थ्य (NDVI)",
    aiInsights: "AI अंतर्दृष्टि",
    ndviInterpretation: "NDVI व्याख्या",
    logout: "लॉगआउट",
    call: "कॉल करें",
    settings: "सेटिंग्स"
  },
  Telugu: {
    home: "హోమ్",
    soilHealth: "నేల ఆరోగ్యం",
    satellite: "శాటిలైట్",
    weather: "వాతావరణం",
    crops: "పంటలు",
    schedule: "షెడ్యూల్",
    soilMoisture: "నేల తేమ",
    temperature: "ఉష్ణోగ్రత",
    pumpStatus: "పంప్ స్థితి",
    aiAdvice: "AI సలహా",
    irrigationControl: "నీటి పారుదల నియంత్రణ",
    start: "ప్రారంభించు",
    stop: "నిలిపివేయి",
    weatherForecast: "వాతావరణ సూచన",
    currentCrop: "ప్రస్తుత పంట",
    growthStage: "పెరుగుదల దశ",
    fieldInfo: "క్షేత్ర సమాచారం",
    village: "గ్రామం",
    fieldArea: "వైశాల్యం",
    editCropSettings: "సెట్టింగ్‌లను సవరించండి",
    nextRecommended: "తదుపరి సిఫార్సు చేసిన నీటి పారుదల",
    when: "ఎప్పుడు",
    duration: "సమయం",
    waterNeeded: "కావాల్సిన నీరు",
    irrigationLogs: "నీటి పారుదల లాగ్‌లు",
    weeklyUsage: "వారపు వినియోగం",
    satelliteMonitoring: "శాటిలైట్ పర్యవేక్షణ",
    cropHealthNDVI: "పంట ఆరోగ్యం (NDVI)",
    aiInsights: "AI అంతర్దృష్టులు",
    ndviInterpretation: "NDVI వివరణ",
    logout: "లాగ్ అవుట్",
    call: "కాల్ చేయండి",
    settings: "సెట్టింగ్‌లు"
  },
  Tamil: {
    home: "முகப்பு",
    soilHealth: "மண் ஆரோக்கியம்",
    satellite: "சாட்டிலைட்",
    weather: "வானிலை",
    crops: "பயிர்கள்",
    schedule: "அட்டவணை",
    soilMoisture: "மண் ஈரப்பதம்",
    temperature: "வெப்பநிலை",
    pumpStatus: "பம்ப் நிலை",
    aiAdvice: "AI ஆலோசனை",
    irrigationControl: "நீர்ப்பாசனக் கட்டுப்பாடு",
    start: "தொடங்கு",
    stop: "நிறுத்து",
    weatherForecast: "வானிலை முன்னறிவிப்பு",
    currentCrop: "தற்போதைய பயிர்",
    growthStage: "வளர்ச்சி நிலை",
    fieldInfo: "வயல் தகவல்",
    village: "கிராமம்",
    fieldArea: "வயல் பரப்பு",
    editCropSettings: "அமைப்புகளைத் திருத்து",
    nextRecommended: "அடுத்த பரிந்துரை",
    when: "எப்போது",
    duration: "கால அளவு",
    waterNeeded: "தேவையான தண்ணீர்",
    irrigationLogs: "பதிவுகள்",
    weeklyUsage: "வாராந்திர பயன்பாடு",
    satelliteMonitoring: "சாட்டிலைட் கண்காணிப்பு",
    cropHealthNDVI: "பயிர் ஆரோக்கியம் (NDVI)",
    aiInsights: "AI நுண்ணறிவு",
    ndviInterpretation: "NDVI விளக்கம்",
    logout: "வெளியேறு",
    call: "அழைப்பு"
  },
  Kannada: {
    home: "ಮುಖಪುಟ",
    soilHealth: "ಮಣ್ಣಿನ ಆರೋಗ್ಯ",
    satellite: "ಸ್ಯಾಟಲೈಟ್",
    weather: "ಹವಾಮಾನ",
    crops: "ಬೆಳೆಗಳು",
    schedule: "ವೇಳಾಪಟ್ಟಿ",
    soilMoisture: "ಮಣ್ಣಿನ ತೇವಾಂಶ",
    temperature: "ತಾಪಮಾನ",
    pumpStatus: "ಪಂಪ್ ಸ್ಥಿತಿ",
    aiAdvice: "AI ಸಲಹೆ",
    irrigationControl: "ನೀರಾವರಿ ನಿಯಂತ್ರಣ",
    start: "ಪ್ರಾರಂಬಿಸಿ",
    stop: "ನಿಲ್ಲಿಸಿ",
    weatherForecast: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    currentCrop: "ಪ್ರಸ್ತುತ ಬೆಳೆ",
    growthStage: "ಬೆಳವಣಿಗೆಯ ಹಂತ",
    fieldInfo: "ಕ್ಷೇತ್ರ ಮಾಹಿತಿ",
    village: "ಗ್ರಾಮ",
    fieldArea: "ಕ್ಷೇತ್ರದ ವಿಸ್ತೀರ್ಣ",
    editCropSettings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ",
    nextRecommended: "ಮುಂದಿನ ಶಿಫಾರಸು",
    when: "ಯಾವಾಗ",
    duration: "ಸಮಯ",
    waterNeeded: "ಅಗತ್ಯವಿರುವ ನೀರು",
    irrigationLogs: "ಲಾಗ್‌ಗಳು",
    weeklyUsage: "ವಾರದ ಬಳಕೆ",
    satelliteMonitoring: "ಸ್ಯಾಟಲೈಟ್ ಮಾನಿಟರಿಂಗ್",
    cropHealthNDVI: "ಬೆಳೆ ಆರೋಗ್ಯ (NDVI)",
    aiInsights: "AI ಒಳನೋಟಗಳು",
    ndviInterpretation: "NDVI ವ್ಯಾಖ್ಯಾನ",
    logout: "ಲಾಗ್ ಔಟ್",
    call: "ಕರೆ ಮಾಡಿ"
  }
};

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [view, setView] = useState('landing');
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [pumpOn, setPumpOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [profile, setProfile] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editForm, setEditForm] = useState({ village: '', crop_type: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [satelliteInsights, setSatelliteInsights] = useState(null);
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('lang') || 'English');
  const [ndviTrend, setNdviTrend] = useState([]);
  const [healthMapUrls, setHealthMapUrls] = useState(null);
  const [satelliteAlert, setSatelliteAlert] = useState(null);
  const [satMode, setSatMode] = useState('ndvi'); // 'ndvi' or 'rgb'

  const t = (key) => {
    const lang = translations[currentLang] || translations['English'];
    return lang[key] || key;
  };

  const changeLanguage = (lang) => {
    setCurrentLang(lang);
    localStorage.setItem('lang', lang);
  };

  const handleLogin = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setView('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setView('landing');
  };

  const getUserId = () => {
    try {
      if (!token || typeof token !== 'string') return 1;
      const parts = token.split('.');
      if (parts.length < 2) return 1;
      const payload = JSON.parse(atob(parts[1]));
      return payload.sub || 1;
    } catch (e) {
      console.error("Token parsing error:", e);
      return 1;
    }
  };

  useEffect(() => {
    if (!token) return;

    const userId = getUserId();

    const fetchData = async () => {
      try {
        const headers = { headers: { Authorization: `Bearer ${token}` } };

        const handleAuthError = (err) => {
          if (err.response?.status === 401) {
            console.error("Session expired. Logging out...");
            handleLogout();
          }
          return err;
        };

        let userIdToUse = userId;
        try {
          const profRes = await axios.get(`${API_BASE}/farmers/full-profile`, headers);
          setProfile(profRes.data);
          userIdToUse = profRes.data.farm?.id || userId;
        } catch (err) {
          handleAuthError(err);
        }

        axios.get(`${API_BASE}/dashboard/status/${userIdToUse}`, headers)
          .then(res => setData(res.data))
          .catch(handleAuthError);

        axios.get(`${API_BASE}/dashboard/history/${userIdToUse}`, headers)
          .then(histRes => {
            if (Array.isArray(histRes.data)) {
              setHistory(histRes.data.map(h => ({
                time: h.start_time ? new Date(h.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--',
                moisture: 40,
                water: h.water_used || 0,
                date: h.start_time ? new Date(h.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'
              })));
            }
          }).catch(handleAuthError);

        axios.get(`${API_BASE}/satellite/ndvi`, headers)
          .then(res => setSatelliteData(res.data))
          .catch(handleAuthError);

        axios.get(`${API_BASE}/satellite/health-map`, headers)
          .then(res => setHealthMapUrls(res.data))
          .catch(err => {
            if (err.response?.status !== 401) setHealthMapUrls('error');
            handleAuthError(err);
          });

        axios.get(`${API_BASE}/satellite/ndvi-trend`, headers)
          .then(res => {
            setNdviTrend(res.data.trend || []);
            setSatelliteAlert(res.data.alert);
          })
          .catch(handleAuthError);

      } catch (err) {
        console.error("Global Fetch Error:", err);
        if (!data) setData(mockData);
        if (!history.length) setHistory(mockHistory);
        // Provide mock satellite data if fetch fails
        if (!satelliteData) setSatelliteData({
          ndvi_value: 0.65,
          status: "Healthy (Demo)",
          image_date: new Date().toISOString().split('T')[0]
        });
        if (!healthMapUrls) setHealthMapUrls({
          ndvi_viz_url: "https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&w=800&q=80",
          true_color_url: "https://images.unsplash.com/photo-1500382017468-9049fee74a62?auto=format&fit=crop&w=800&q=80"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [token]);

  const mockData = {
    farmer_name: "Raju Reddy",
    farmer_village: "Rampur",
    latitude: 17.3850,
    longitude: 78.4867,
    profile_photo: null,
    field_info: { id: 1, crop: "Rice", area: 2.5, stage: "Vegetative" },
    sensor_data: { soil_moisture: 42, temperature: 31, humidity: 65, flow_rate: 12.5 },
    ndvi: { ndvi_value: 0.72, interpretation: "Healthy crops", stress_alert: false },
    pump_status: "OFF",
    weather: {
      temperature: 32,
      sunrise: "06:30",
      sunset: "18:24",
      forecast: [
        { date: "2026-03-07", max_temp: 37, min_temp: 20 },
        { date: "2026-03-08", max_temp: 36, min_temp: 19 },
        { date: "2026-03-09", max_temp: 35, min_temp: 20 },
        { date: "2026-03-10", max_temp: 35, min_temp: 21 },
        { date: "2026-03-11", max_temp: 36, min_temp: 20 },
        { date: "2026-03-12", max_temp: 34, min_temp: 19 },
        { date: "2026-03-13", max_temp: 35, min_temp: 20 }
      ]
    }
  };

  const mockHistory = [
    { time: '06:00', moisture: 35, water: 50, date: 'Mar 06' },
    { time: '09:00', moisture: 32, water: 45, date: 'Mar 06' },
    { time: '12:00', moisture: 30, water: 50, date: 'Mar 06' },
    { time: '15:00', moisture: 45, water: 0, date: 'Mar 06' },
    { time: '18:00', moisture: 42, water: 0, date: 'Mar 06' },
  ];

  const handleCall = async () => {
    setCalling(true);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || 1;
      await axios.post(`${API_BASE}/voice/call-advisory/${userId}`);
      alert("Call initiated successfully!");
    } catch (err) {
      alert("Failed to initiate call. Check Twilio credentials in .env");
    } finally {
      setCalling(false);
    }
  };

  if (!token) {
    return (
      <TooltipProvider>
        <AnimatePresence mode='wait'>
          {view === 'landing' && (
            <LandingPage
              key="landing"
              onLogin={() => setView('login')}
              onGetStarted={() => setView('register')}
            />
          )}
          {view === 'login' && (
            <Login key="login" onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />
          )}
          {view === 'register' && (
            <Register key="register" onRegister={handleLogin} onSwitchToLogin={() => setView('login')} />
          )}
        </AnimatePresence>
      </TooltipProvider>
    );
  }

  const currentStatus = {
    ...mockData,
    ...(data || {}),
    farmer_name: profile?.profile?.name || data?.farmer_name || mockData.farmer_name,
    farmer_village: profile?.farm?.village || data?.farmer_village || mockData.farmer_village,
    profile_photo: profile?.profile?.profile_photo || null,
  };

  const SERVER_URL = API_BASE.replace('/api/v1', '');
  const getProfilePhotoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `${SERVER_URL}${path}`;
  };

  // Calculate next irrigation time dynamically
  const getNextIrrigation = () => {
    const moisture = currentStatus?.sensor_data?.soil_moisture || 42;
    const optimalMoisture = 40;

    if (moisture < 30) {
      return { hours: 0, minutes: 30, duration: 60, water: 150 };
    } else if (moisture < optimalMoisture) {
      return { hours: 2, minutes: 0, duration: 45, water: 120 };
    } else {
      return { hours: 7, minutes: 0, duration: 45, water: 120 };
    }
  };

  const nextIrrigation = getNextIrrigation();

  const openSettings = () => {
    setEditForm({
      village: currentStatus?.farmer_village || '',
      crop_type: currentStatus?.field_info?.crop || 'Rice'
    });
    setShowSettingsModal(true);
  };

  const saveSettings = async () => {
    setSavingStatus(true);
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub || 1;

      await axios.put(`${API_BASE}/farmers/${userId}/profile`, {
        village: editForm.village,
        crop_type: editForm.crop_type
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data) {
        setData({
          ...data,
          farmer_village: editForm.village,
          field_info: { ...data.field_info, crop: editForm.crop_type }
        });
      }

      setShowSettingsModal(false);
      alert('Profile updated successfully!');
    } catch (err) {
      alert('Failed to update profile: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSavingStatus(false);
    }
  };

  const renderHome = () => (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('home')}</h2>
        <p className="text-muted-foreground font-medium">Monitoring your farm's vital signs in real-time</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { icon: Droplets, label: t('soilMoisture'), value: `${currentStatus.sensor_data?.soil_moisture || 42}%`, status: 'Optimal', color: 'text-primary', bg: 'bg-primary/10', delay: 0.1 },
          { icon: Thermometer, label: t('temperature'), value: `${currentStatus.sensor_data?.temperature || 31}°C`, status: 'Warm', color: 'text-orange-500', bg: 'bg-orange-500/10', delay: 0.2 },
          { icon: Power, label: t('pumpStatus'), value: pumpOn ? 'ON' : 'OFF', status: pumpOn ? 'Active' : 'Standby', color: pumpOn ? 'text-green-500' : 'text-red-500', bg: pumpOn ? 'bg-green-500/10' : 'bg-red-500/10', delay: 0.3 },
          { icon: Satellite, label: 'Sat NDVI', value: satelliteData?.ndvi_value || "0.00", status: satelliteData?.status || "Analyzing", color: satelliteData?.ndvi_value > 0.6 ? 'text-green-500' : 'text-yellow-500', bg: 'bg-indigo-500/10', delay: 0.4 },
          { icon: Activity, label: t('aiAdvice'), value: currentStatus.ai_insights ? 'Action Recommended' : 'No Action', status: currentStatus.ai_insights ? 'Check Details' : 'System Stable', color: 'text-purple-500', bg: 'bg-purple-500/10', delay: 0.5 },
        ].map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: item.delay }}
            className="bg-card border border-border p-5 rounded-3xl relative overflow-hidden group hover:border-primary/20 transition-all hover:shadow-xl hover:shadow-primary/5"
          >
            <div className={`w-12 h-12 rounded-2xl ${item.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
              <item.icon className={`w-6 h-6 ${item.color}`} />
            </div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</div>
            <div className={`text-2xl font-extrabold mb-3 ${item.color}`}>{item.value}</div>
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.bg} ${item.color} border-${item.color}/10`}>
              {item.status}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Irrigation Control */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border p-8 rounded-[2rem]"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Power className="w-5 h-5 text-green-500" />
            </div>
            <h3 className="text-lg font-bold">{t('irrigationControl')}</h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-secondary/30 rounded-3xl">
            <div className="text-center sm:text-left">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">State</div>
              <div className={`text-2xl font-black ${pumpOn ? 'text-green-500' : 'text-red-500'}`}>
                {pumpOn ? 'SYSTEM ACTIVE' : 'SYSTEM STANDBY'}
              </div>
            </div>
            <button
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl ${pumpOn ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-green-500 text-white shadow-green-500/20'}`}
              onClick={() => setPumpOn(!pumpOn)}
            >
              {pumpOn ? t('stop') : t('start')}
            </button>
          </div>
        </motion.div>

        {/* Quick Weather */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border p-8 rounded-[2rem]"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <Sun className="w-5 h-5 text-orange-500" />
            </div>
            <h3 className="text-lg font-bold">{t('weatherForecast')}</h3>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-5xl">☁️</div>
            <div className="flex-1">
              <div className="text-3xl font-black">{currentStatus.weather?.temperature || 32}°C</div>
              <div className="text-muted-foreground font-medium">Partly Cloudy • {currentStatus.farmer_village}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderWeather = () => (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('weatherForecast')}</h2>
          <p className="text-muted-foreground font-medium">Local conditions and 7-day outlook for {currentStatus.farmer_village}</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border p-10 rounded-[2.5rem] relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="text-[120px] leading-none animate-float">☁️</div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-4">Current Conditions</div>
            <div className="text-7xl md:text-8xl font-black tracking-tighter mb-4">{currentStatus.weather?.temperature || 32}°C</div>
            <div className="text-2xl font-bold text-muted-foreground">Partly Cloudy</div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            {[
              { icon: Droplets, label: 'Humidity', value: '55%', color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { icon: Wind, label: 'Wind', value: '12 km/h', color: 'text-slate-400', bg: 'bg-slate-400/10' },
              { icon: CloudRain, label: 'Rain Chance', value: '0%', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
              { icon: Sunrise, label: 'Sunrise', value: currentStatus.weather?.sunrise || '06:30', color: 'text-orange-400', bg: 'bg-orange-400/10' },
            ].map((stat, i) => (
              <div key={i} className="bg-secondary/30 p-4 rounded-2xl flex flex-col items-center justify-center text-center gap-1 border border-border/50">
                <stat.icon size={18} className={stat.color} />
                <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mt-1">{stat.label}</div>
                <div className="text-base font-bold">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="space-y-6">
        <h3 className="text-lg font-bold tracking-tight uppercase text-muted-foreground tracking-[0.2em]">{t('nextRecommended')} 7 DAYS</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {(currentStatus.weather?.forecast || mockData.weather.forecast).map((day, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border p-6 rounded-3xl flex flex-col items-center text-center group hover:border-primary/30 transition-all hover:translate-y-[-4px]"
            >
              <div className="text-[11px] font-bold text-muted-foreground mb-4 uppercase">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                <br />
                <span className="text-foreground">{new Date(day.date).toLocaleDateString('en-US', { day: 'numeric' })}</span>
              </div>
              <div className="text-3xl mb-4 group-hover:scale-110 transition-transform">🌤️</div>
              <div className="space-y-1">
                <div className="text-lg font-black">{Math.round(day.max_temp)}°</div>
                <div className="text-xs font-bold text-muted-foreground">{Math.round(day.min_temp)}°</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSoilHealth = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('soilHealth')}</h2>
        <p className="text-muted-foreground font-medium">Underground analytics for precision crop nutrition</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Droplets, label: 'Soil Moisture', value: `${currentStatus.sensor_data?.soil_moisture || 42.0}%`, status: 'Optimal', color: '#3b82f6', fill: 'bg-blue-500' },
          { icon: Thermometer, label: 'Temperature', value: `${currentStatus.sensor_data?.temperature || 31.0}°C`, status: 'Warm', color: '#f59e0b', fill: 'bg-orange-500' },
          { icon: Wind, label: 'Humidity', value: '58.0%', status: 'Normal', color: '#10b981', fill: 'bg-green-500' },
          { icon: Activity, label: 'Water Flow', value: '0.0 L/min', status: 'Stopped', color: '#6b7280', fill: 'bg-slate-500' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border p-6 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <item.icon size={20} color={item.color} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
            </div>
            <div className="text-3xl font-black mb-4">{item.value}</div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className={`h-full ${item.fill}`} style={{ width: '60%' }}></div>
            </div>
            <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: item.color }}>{item.status}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border p-8 rounded-[2.5rem]"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Activity className="text-primary" /> Moisture Trend (24h)
          </h3>
          <div className="text-xs font-bold text-muted-foreground bg-secondary px-4 py-1.5 rounded-full border border-border">Real-time Feed</div>
        </div>

        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} fontWeight="bold" />
              <YAxis stroke="#64748b" fontSize={11} fontWeight="bold" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '12px' }}
                itemStyle={{ color: '#eab308', fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="moisture" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );

  const renderCrops = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('crops')}</h2>
        <p className="text-muted-foreground font-medium">Manage and monitor crop development stages</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border p-8 rounded-[2rem] flex flex-col items-center text-center col-span-1"
        >
          <div className="text-6xl mb-6">🌾</div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-2">Current Harvest</div>
          <div className="text-3xl font-black mb-2">{currentStatus.field_info?.crop || "Rice"}</div>
          <div className="text-muted-foreground font-medium mb-8">Growth Stage: {currentStatus.field_info?.stage || "Vegetative"}</div>

          <button
            onClick={openSettings}
            className="w-full py-4 bg-secondary/50 hover:bg-secondary rounded-2xl border border-border transition-all font-bold flex items-center justify-center gap-2 group"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform" />
            Modify settings
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border p-8 rounded-[2rem] col-span-1 md:col-span-2"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <MapPin size={20} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold">Field Profile</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {[
              { label: 'Village', value: currentStatus.farmer_village || "Rampur" },
              { label: 'Field Area', value: `${currentStatus.field_info?.area || 2.5} Hectares` },
              { label: 'Crop Variety', value: 'Traditional Long Grain' },
              { label: 'Soil Type', value: 'Alluvial Loam' },
            ].map((field, i) => (
              <div key={i} className="space-y-1">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{field.label}</div>
                <div className="text-lg font-bold">{field.value}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  const renderSchedule = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('schedule')}</h2>
        <p className="text-muted-foreground font-medium">AI-driven irrigation planning and historical logs</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary p-8 md:p-10 rounded-[2.5rem] text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">AI RECOMMENDATION</div>
          </div>
          <h3 className="text-3xl md:text-4xl font-black mb-8 leading-tight">Your field will need water in <span className="underline decoration-white/30">{nextIrrigation.hours} hours</span>.</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 pt-8 border-t border-white/10">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Duration</div>
              <div className="text-2xl font-black">{nextIrrigation.duration} Minutes</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Est. Consumption</div>
              <div className="text-2xl font-black">{nextIrrigation.water} Liters</div>
            </div>
            <div className="flex items-end">
              <button className="w-full py-4 bg-white text-primary rounded-2xl font-black transition-all hover:scale-105 active:scale-95 shadow-xl shadow-black/10">
                Queue System
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="bg-card border border-border p-8 rounded-[2rem]">
        <div className="flex items-center gap-3 mb-8">
          <History className="text-muted-foreground" size={20} />
          <h3 className="text-lg font-bold">Activity Log</h3>
        </div>

        <div className="space-y-4">
          {history.length > 0 ? history.map((log, i) => (
            <div key={i} className="flex items-center justify-between p-5 bg-secondary/30 rounded-2xl border border-border/50 group hover:border-primary/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 font-bold group-hover:scale-110 transition-transform">
                  <Droplets size={18} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Irrigation Cycle Complete</div>
                  <div className="text-[10px] font-medium text-muted-foreground">{log.date || 'Today'} at {log.time}</div>
                </div>
              </div>
              <div className="text-lg font-black text-primary">+{log.water}L</div>
            </div>
          )) : (
            <div className="py-12 text-center text-muted-foreground font-medium italic">No activity recorded in the last 24 hours</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSatellite = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Satellite Intelligence</h2>
        <p className="text-muted-foreground font-medium">Sentinel-2 Orbital Analytics for {currentStatus.farmer_village}</p>
      </motion.div>

      {satelliteAlert && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-red-500/10 border border-red-500/50 p-6 rounded-[2rem] flex items-center gap-4 text-red-500"
        >
          <AlertTriangle className="animate-pulse" size={24} />
          <div className="font-bold">{satelliteAlert}</div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-xl"
        >
          <div className="p-8 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Satellite className="text-primary" /> {satMode === 'ndvi' ? 'Crop Health Heatmap' : 'Natural Field View'}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex bg-secondary/50 p-1 rounded-xl border border-border">
                <button
                  onClick={() => setSatMode('ndvi')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${satMode === 'ndvi' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Health Map
                </button>
                <button
                  onClick={() => setSatMode('rgb')}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${satMode === 'rgb' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Natural Photo
                </button>
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-[10px] font-bold border border-green-500/10 uppercase tracking-widest">
                Last Pass: {satelliteData?.image_date || "--"}
              </div>
            </div>
          </div>

          <div className="relative h-[500px] w-full bg-secondary/20">
            {healthMapUrls === 'error' ? (
              <div className="h-full w-full flex items-center justify-center flex-col gap-4 p-8 text-center">
                <AlertTriangle className="text-yellow-500" size={40} />
                <p className="text-muted-foreground font-bold">Cloud Cover Interference</p>
                <p className="text-xs text-muted-foreground max-w-xs">
                  We couldn't get a clear orbital view of your farm from Sentinel-2 right now. This usually happens during heavy cloud cover.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-6 py-2 bg-secondary rounded-xl text-xs font-bold hover:bg-secondary/80"
                >
                  Retry Orbital Pass
                </button>
              </div>
            ) : healthMapUrls && healthMapUrls !== 'error' ? (
              <div className="h-full w-full relative group">
                <img
                  src={satMode === 'ndvi' ? healthMapUrls.ndvi_viz_url : healthMapUrls.true_color_url}
                  className="w-full h-full object-cover transition-opacity duration-500"
                  alt="Satellite View"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  <div className="p-4 bg-card/90 backdrop-blur rounded-2xl border border-white/10 text-xs font-bold">
                    {satMode === 'ndvi' ? 'Spectral Analysis (Sentinel-2)' : 'True Color RGB (Sentinel-2)'}
                  </div>
                </div>

                {/* Map Legend - Only show in NDVI mode */}
                {satMode === 'ndvi' && (
                  <div className="absolute bottom-6 left-6 bg-black/60 backdrop-blur-md p-4 rounded-xl border border-white/10 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                      <div className="w-3 h-3 rounded-full bg-[#00ff00]" /> Healthy
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                      <div className="w-3 h-3 rounded-full bg-[#ffff00]" /> Moderate
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white uppercase tracking-wider">
                      <div className="w-3 h-3 rounded-full bg-[#ff0000]" /> Stressed
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full w-full flex items-center justify-center flex-col gap-4">
                <Loader2 className="animate-spin text-primary" size={40} />
                <p className="text-muted-foreground font-medium text-center">
                  Requesting spectral data from <br />Google Earth Engine...
                </p>
              </div>
            )}
          </div>
        </motion.div>

        <div className="space-y-8 flex flex-col">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-card border border-border p-8 rounded-[2.5rem] flex-1"
          >
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">NDVI Index</div>
            <div className="text-6xl font-black text-primary mb-4">
              {satelliteData?.ndvi_value || "0.00"}
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-extrabold mb-6 uppercase tracking-wider ${satelliteData?.ndvi_value > 0.6 ? 'bg-green-500/10 text-green-500' :
              satelliteData?.ndvi_value > 0.3 ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500'
              }`}>
              {satelliteData?.status || "Analyzing..."}
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed font-medium">
              {satelliteData?.ndvi_value > 0.6
                ? "Highly active photosynthesis detected. Vegetation is robust and healthy."
                : satelliteData?.ndvi_value > 0.3
                  ? "Moderate vegetation detected. Normal growth patterns for this season."
                  : "LOW VEGETATION. Potential crop stress or water deficit detected via spectral signature."}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border p-8 rounded-[2.5rem] h-[300px]"
          >
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-6">Growth Trend</div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ndviTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <YAxis domain={[0, 1]} stroke="#64748b" fontSize={10} fontWeight="bold" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem' }}
                    itemStyle={{ color: '#eab308' }}
                  />
                  <Line type="monotone" dataKey="ndvi" stroke="#eab308" strokeWidth={4} dot={{ r: 4, fill: '#eab308' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return renderHome();
      case 'weather':
        return renderWeather();
      case 'soil':
        return renderSoilHealth();
      case 'satellite':
        return renderSatellite();
      case 'crops':
        return renderCrops();
      case 'schedule':
        return renderSchedule();
      case 'settings':
        return (
          <ProfileSettings
            token={token}
            onLogout={handleLogout}
            API_BASE={API_BASE}
            onProfileUpdate={(newProfile) => setProfile(newProfile)}
          />
        );
      default:
        return renderHome();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-container bg-background min-h-screen">
      <header className="header bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Droplets size={24} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold tracking-tight text-foreground leading-none">GraminLink</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-0.5">Precision AI</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <div className="text-sm font-black text-foreground">{currentStatus.farmer_name || 'Test User'}</div>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest">{currentStatus.farmer_village || 'Lead Farmer'}</div>
          </div>

          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary/30 text-primary font-black shadow-lg shadow-primary/5 overflow-hidden">
            {currentStatus.profile_photo ? (
              <img
                src={getProfilePhotoUrl(currentStatus.profile_photo)}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              currentStatus.farmer_name ? currentStatus.farmer_name[0].toUpperCase() : 'T'
            )}
          </div>

          <div className="h-6 w-px bg-border hidden sm:block mx-1" />

          <button
            onClick={handleCall}
            disabled={calling}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-bold text-[12px] group active:scale-95"
          >
            <Phone size={14} className="group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">{calling ? 'Connecting...' : t('call')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all active:scale-95 border border-destructive/10"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <nav className="flex items-center justify-center gap-1 p-2 bg-card/50 border-b border-border sticky top-[73px] z-40 backdrop-blur-md">
        {[
          { id: 'home', icon: Home, label: t('home') },
          { id: 'soil', icon: Droplets, label: t('soilHealth') },
          { id: 'satellite', icon: Satellite, label: t('satellite') },
          { id: 'weather', icon: Cloud, label: t('weather') },
          { id: 'crops', icon: Sprout, label: t('crops') },
          { id: 'schedule', icon: CalendarDays, label: t('schedule') },
          { id: 'settings', icon: Settings, label: t('settings') },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${activeTab === tab.id ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={20} />
            <span className="hidden md:inline">{tab.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettingsModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-lg bg-card border border-border rounded-[2.5rem] shadow-2xl p-10 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Settings className="text-primary" size={20} />
                    </div>
                    Field Settings
                  </h2>
                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="w-10 h-10 rounded-full hover:bg-secondary flex items-center justify-center transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Village Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                      <input
                        className="w-full h-14 bg-secondary/40 border border-border focus:border-primary/50 rounded-2xl pl-12 pr-4 font-bold text-sm transition-all"
                        value={editForm.village}
                        onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                        placeholder="Village name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Crop Type</label>
                    <select
                      className="w-full h-14 bg-secondary/40 border border-border focus:border-primary/50 rounded-2xl px-4 font-bold text-sm transition-all appearance-none cursor-pointer"
                      value={editForm.crop_type}
                      onChange={(e) => setEditForm({ ...editForm, crop_type: e.target.value })}
                    >
                      <option>Rice</option>
                      <option>Wheat</option>
                      <option>Maize</option>
                      <option>Cotton</option>
                      <option>Sugarcane</option>
                    </select>
                  </div>

                  <button
                    onClick={saveSettings}
                    disabled={savingStatus}
                    className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {savingStatus ? <Loader2 className="animate-spin" size={20} /> : 'Apply Optimization'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <main className="container max-w-7xl mx-auto px-6 py-10 overflow-hidden">
        {renderContent()}
      </main>
      <Toaster position="bottom-right" richColors />
    </motion.div>
  );
};

export default App;
