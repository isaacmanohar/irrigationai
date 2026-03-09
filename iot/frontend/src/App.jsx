import React, { useState, useEffect } from 'react';
import {
  Droplets, Thermometer, Wind, Activity,
  MapPin, Calendar, Power, AlertTriangle,
  ChevronRight, TrendingUp, History, User, Phone, LogOut,
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

// Fix Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const API_BASE = 'http://127.0.0.1:8000/api/v1';
window.API_BASE = API_BASE;

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
    call: "Call"
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
    call: "कॉल करें"
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
    call: "కాల్ చేయండి"
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
  const [view, setView] = useState('login');
  const [activeTab, setActiveTab] = useState('home');
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [pumpOn, setPumpOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [editForm, setEditForm] = useState({ village: '', crop_type: '' });
  const [savingStatus, setSavingStatus] = useState(false);
  const [satelliteData, setSatelliteData] = useState(null);
  const [satelliteInsights, setSatelliteInsights] = useState(null);
  const [currentLang, setCurrentLang] = useState(localStorage.getItem('lang') || 'English');

  const t = (key) => {
    return translations[currentLang][key] || key;
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
    setView('login');
  };

  useEffect(() => {
    if (!token) return;

    const getUserId = () => {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.sub || 1;
      } catch (e) {
        return 1;
      }
    };

    const userId = getUserId();

    const fetchData = async () => {
      try {
        const res = await axios.get(`${API_BASE}/dashboard/status/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setData(res.data);
        const histRes = await axios.get(`${API_BASE}/dashboard/history/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHistory(histRes.data.map(h => ({
          time: new Date(h.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          moisture: 40,
          water: h.water_used,
          date: new Date(h.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        })));

        // Fetch satellite data
        try {
          const satRes = await axios.get(`${API_BASE}/satellite/ndvi/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSatelliteData(satRes.data);
        } catch (err) {
          console.log('Satellite data not available');
        }

        // Fetch satellite insights
        try {
          const insRes = await axios.get(`${API_BASE}/dashboard/satellite-insights/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setSatelliteInsights(insRes.data);
        } catch (err) {
          console.log('Satellite insights not available');
        }
      } catch (err) {
        setData(mockData);
        setHistory(mockHistory);
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
      <AnimatePresence mode='wait'>
        {view === 'login' ? (
          <Login key="login" onLogin={handleLogin} onSwitchToRegister={() => setView('register')} />
        ) : (
          <Register key="register" onRegister={handleLogin} onSwitchToLogin={() => setView('login')} />
        )}
      </AnimatePresence>
    );
  }

  const currentStatus = data || mockData;

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
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        {t('home')}
      </motion.h2>
      <p className="page-subtitle">Monitor your farm at a glance</p>

      <div className="stats-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="stat-card-large"
        >
          <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
            <Droplets size={24} color="#3b82f6" />
          </div>
          <div className="stat-label">{t('soilMoisture')}</div>
          <div className="stat-value-large">
            {currentStatus.sensor_data?.soil_moisture || 42}<span className="stat-unit">%</span>
          </div>
          <div className="badge badge-success">Good</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="stat-card-large"
        >
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}>
            <Thermometer size={24} color="#f59e0b" />
          </div>
          <div className="stat-label">{t('temperature')}</div>
          <div className="stat-value-large">
            {currentStatus.sensor_data?.temperature || currentStatus.weather?.temperature || 31}<span className="stat-unit">°C</span>
          </div>
          <div className="badge badge-warning">Warm</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="stat-card-large"
        >
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
            <Power size={24} color="#10b981" />
          </div>
          <div className="stat-label">{t('pumpStatus')}</div>
          <div className="stat-value-large" style={{ color: pumpOn ? '#10b981' : '#ef4444' }}>
            {pumpOn ? 'ON' : 'OFF'}
          </div>
          <div className="badge" style={{ background: pumpOn ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: pumpOn ? '#10b981' : '#ef4444', border: `1px solid ${pumpOn ? '#10b981' : '#ef4444'}` }}>
            {pumpOn ? 'Active' : 'Standby'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="stat-card-large"
        >
          <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
            <Activity size={24} color="#8b5cf6" />
          </div>
          <div className="stat-label">{t('aiAdvice')}</div>
          <div className="stat-value-large" style={{ fontSize: '1.75rem' }}>Medium</div>
          <div className="badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #f59e0b' }}>Plan soon</div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="section-card"
      >
        <h3 className="section-title">
          <Power size={20} color="#10b981" /> {t('irrigationControl')}
        </h3>
        <div className="irrigation-control">
          <div className="pump-status-display">
            <div className="pump-label">Pump Status</div>
            <div className="pump-status-value" style={{ color: pumpOn ? '#10b981' : '#ef4444' }}>
              {pumpOn ? 'ON' : 'OFF'}
            </div>
          </div>
          <button className={`pump-button ${pumpOn ? 'pump-on' : 'pump-off'}`} onClick={() => setPumpOn(!pumpOn)}>
            {pumpOn ? t('stop') : t('start')}
          </button>
        </div>
      </motion.div>

      <div className="two-column-grid">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="section-card"
        >
          <h3 className="section-title">
            <Droplets size={20} color="#10b981" /> Soil Health
          </h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <div className="metric-header">
                <Droplets size={18} color="#3b82f6" />
                <span className="metric-name">Soil Moisture</span>
              </div>
              <div className="metric-value-display">{currentStatus.sensor_data?.soil_moisture || 42.0}<span className="metric-unit">%</span></div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${currentStatus.sensor_data?.soil_moisture || 42}%`, background: '#10b981' }}></div>
              </div>
              <div className="metric-status" style={{ color: '#10b981' }}>Optimal</div>
            </div>
            <div className="metric-card">
              <div className="metric-header">
                <Thermometer size={18} color="#f59e0b" />
                <span className="metric-name">Air Temperature</span>
              </div>
              <div className="metric-value-display">{currentStatus.sensor_data?.temperature || 31.0}<span className="metric-unit">°C</span></div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '75%', background: '#f59e0b' }}></div>
              </div>
              <div className="metric-status" style={{ color: '#f59e0b' }}>Warm</div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="section-card"
        >
          <h3 className="section-title">
            <Sun size={20} color="#f59e0b" /> Weather Forecast
          </h3>
          <div className="weather-today-compact">
            <div className="weather-icon-compact">☁️</div>
            <div className="weather-info-compact">
              <div className="weather-label-compact">Today</div>
              <div className="weather-temp-compact">{currentStatus.weather?.temperature || 32}°C</div>
              <div className="weather-desc-compact">Partly Cloudy</div>
            </div>
            <div className="weather-stats-compact">
              <div className="weather-stat-item">
                <Droplets size={16} color="#3b82f6" />
                <span>Humidity: 55%</span>
              </div>
              <div className="weather-stat-item">
                <Wind size={16} color="#6b7280" />
                <span>Wind: 12 km/h</span>
              </div>
              <div className="weather-stat-item">
                <CloudRain size={16} color="#3b82f6" />
                <span>Rain chance: %</span>
              </div>
            </div>
          </div>
          <div className="next-days-label">NEXT 3 DAYS</div>
          <div className="forecast-mini-grid">
            {(currentStatus.weather?.forecast || mockData.weather.forecast).slice(0, 3).map((day, idx) => (
              <div key={idx} className="forecast-mini-card">
                <div className="forecast-mini-date">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div className="forecast-mini-temps">
                  <span className="temp-high">{Math.round(day.max_temp)}°</span>
                  <span className="temp-low">{Math.round(day.min_temp)}°</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );

  const renderWeather = () => (
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Weather Forecast
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <div className="weather-today-large">
          <div className="weather-icon-large">☁️</div>
          <div className="weather-info-large">
            <div className="weather-label">Today</div>
            <div className="weather-temp-large">{currentStatus.weather?.temperature || 32}°C</div>
            <div className="weather-desc-large">Partly Cloudy</div>
          </div>
        </div>
        <div className="weather-details-grid">
          <div className="weather-detail-card">
            <Droplets size={28} color="#3b82f6" />
            <div className="detail-label">Humidity</div>
            <div className="detail-value">55%</div>
          </div>
          <div className="weather-detail-card">
            <Wind size={28} color="#6b7280" />
            <div className="detail-label">Wind</div>
            <div className="detail-value">12 km/h</div>
          </div>
          <div className="weather-detail-card">
            <CloudRain size={28} color="#3b82f6" />
            <div className="detail-label">Rain Chance</div>
            <div className="detail-value">%</div>
          </div>
          <div className="weather-detail-card">
            <Sunrise size={28} color="#f59e0b" />
            <div className="detail-label">Sunrise</div>
            <div className="detail-value">{currentStatus.weather?.sunrise || "06:30"}</div>
          </div>
        </div>
      </motion.div>

      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="section-subtitle"
      >
        NEXT 7 DAYS
      </motion.h3>
      <div className="forecast-grid-large">
        {(currentStatus.weather?.forecast || mockData.weather.forecast).map((day, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            className="forecast-card"
          >
            <div className="forecast-date-large">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
            <div className="forecast-icon">🌤️</div>
            <div className="forecast-temps-large">
              <span className="temp-high-large">{Math.round(day.max_temp)}°</span>
              <span className="temp-low-large">{Math.round(day.min_temp)}°</span>
            </div>
          </motion.div>
        ))}
      </div>
    </>
  );

  const renderSoilHealth = () => (
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Soil Health
      </motion.h2>
      <p className="page-subtitle">Check soil moisture and health metrics</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <h3 className="section-title">
          <Droplets size={20} color="#10b981" /> Soil Health
        </h3>
        <div className="metrics-grid-large">
          <div className="metric-card-large">
            <div className="metric-header">
              <Droplets size={20} color="#3b82f6" />
              <span className="metric-name">Soil Moisture</span>
            </div>
            <div className="metric-value-display-large">{currentStatus.sensor_data?.soil_moisture || 42.0}<span className="metric-unit">%</span></div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: `${currentStatus.sensor_data?.soil_moisture || 42}%`, background: '#10b981' }}></div>
            </div>
            <div className="metric-description">Water content in soil</div>
            <div className="metric-status-large" style={{ color: '#10b981' }}>Optimal</div>
          </div>

          <div className="metric-card-large">
            <div className="metric-header">
              <Thermometer size={20} color="#f59e0b" />
              <span className="metric-name">Air Temperature</span>
            </div>
            <div className="metric-value-display-large">{currentStatus.sensor_data?.temperature || 31.0}<span className="metric-unit">°C</span></div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: '75%', background: '#f59e0b' }}></div>
            </div>
            <div className="metric-description">Ambient temperature</div>
            <div className="metric-status-large" style={{ color: '#f59e0b' }}>Warm</div>
          </div>

          <div className="metric-card-large">
            <div className="metric-header">
              <Wind size={20} color="#3b82f6" />
              <span className="metric-name">Humidity</span>
            </div>
            <div className="metric-value-display-large">58.0<span className="metric-unit">%</span></div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: '58%', background: '#3b82f6' }}></div>
            </div>
            <div className="metric-description">Air moisture level</div>
            <div className="metric-status-large" style={{ color: '#10b981' }}>Normal</div>
          </div>

          <div className="metric-card-large">
            <div className="metric-header">
              <Activity size={20} color="#6b7280" />
              <span className="metric-name">Water Flow</span>
            </div>
            <div className="metric-value-display-large">0.0<span className="metric-unit">L/min</span></div>
            <div className="progress-bar-large">
              <div className="progress-fill" style={{ width: '0%', background: '#6b7280' }}></div>
            </div>
            <div className="metric-description">Current water output</div>
            <div className="metric-status-large" style={{ color: '#6b7280' }}>Stopped</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="section-card"
      >
        <h3 className="section-title">
          <Activity size={20} color="#10b981" /> Moisture Trend
        </h3>
        <div style={{ width: '100%', height: '300px' }}>
          <ResponsiveContainer>
            <AreaChart data={history}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="time" stroke="#6b7280" fontSize={14} />
              <YAxis stroke="#6b7280" fontSize={14} />
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
              <Area type="monotone" dataKey="moisture" stroke="#10b981" fillOpacity={1} fill="url(#colorMoisture)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </>
  );

  const renderCrops = () => (
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Crops
      </motion.h2>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <div className="crop-info">
          <div className="crop-icon">🌾</div>
          <div>
            <div className="crop-label">Current Crop</div>
            <div className="crop-name">{currentStatus.field_info?.crop || "Rice"}</div>
            <div className="crop-stage">Growth Stage: {currentStatus.field_info?.stage || "Vegetative"}</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="section-card"
      >
        <h3 className="section-title">
          <MapPin size={20} color="#3b82f6" /> Field Information
        </h3>
        <div className="field-info-grid">
          <div className="field-info-item">
            <div className="field-label">Village</div>
            <div className="field-value">{currentStatus.farmer_village || "Rampur"}</div>
          </div>
          <div className="field-info-item">
            <div className="field-label">Field Area</div>
            <div className="field-value">{currentStatus.field_info?.area || 2.5} hectares</div>
          </div>
          <div className="field-info-item">
            <div className="field-label">Crop Type</div>
            <div className="field-value">{currentStatus.field_info?.crop || "Rice"}</div>
          </div>
          <div className="field-info-item">
            <div className="field-label">Growth Stage</div>
            <div className="field-value">{currentStatus.field_info?.stage || "Vegetative"}</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="section-card"
      >
        <button onClick={openSettings} className="settings-button">
          <Settings size={20} />
          <span>Edit Crop Settings</span>
        </button>
      </motion.div>
    </>
  );

  const renderSchedule = () => (
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Schedule
      </motion.h2>
      <p className="page-subtitle">View irrigation history and schedules</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="recommendation-card"
      >
        <h3 className="recommendation-title">
          <AlertTriangle size={20} color="#10b981" /> Next Recommended Irrigation
        </h3>
        <div className="recommendation-grid">
          <div className="recommendation-item">
            <Calendar size={24} color="#10b981" />
            <div>
              <div className="recommendation-label">When</div>
              <div className="recommendation-value">
                {nextIrrigation.hours > 0 ? `In ${nextIrrigation.hours} hour${nextIrrigation.hours > 1 ? 's' : ''}` : `In ${nextIrrigation.minutes} minutes`}
              </div>
            </div>
          </div>
          <div className="recommendation-item">
            <Activity size={24} color="#f59e0b" />
            <div>
              <div className="recommendation-label">Duration</div>
              <div className="recommendation-value">{nextIrrigation.duration} minutes</div>
            </div>
          </div>
          <div className="recommendation-item">
            <Droplets size={24} color="#3b82f6" />
            <div>
              <div className="recommendation-label">Water Needed</div>
              <div className="recommendation-value">{nextIrrigation.water} liters</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="section-card"
      >
        <h3 className="section-title">
          <History size={20} color="#10b981" /> Irrigation Logs
        </h3>
        <div className="irrigation-logs">
          {history.map((log, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.1 }}
              className="log-item"
            >
              <div className="log-icon">💧</div>
              <div className="log-info">
                <div className="log-date">{log.date || 'Today'} at {log.time}</div>
                <div className="log-action">Pump turned ON</div>
              </div>
              <div className="log-water">{log.water}L used</div>
            </motion.div>
          ))}
          {history.length === 0 && (
            <div className="no-logs">No recent irrigation logs</div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="section-card"
      >
        <h3 className="section-title">
          <TrendingUp size={20} color="#3b82f6" /> Weekly Water Usage
        </h3>
        <div className="water-usage">
          <div className="usage-value">1,240<span className="usage-unit">Liters</span></div>
          <div className="usage-comparison" style={{ color: '#10b981' }}>
            <TrendingUp size={18} /> 12% less than last week
          </div>
        </div>
      </motion.div>
    </>
  );

  const renderSatellite = () => (
    <>
      <motion.h2
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="page-title"
      >
        Satellite Monitoring
      </motion.h2>
      <p className="page-subtitle">Monitor crop health using satellite imagery</p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="section-card"
      >
        <h3 className="section-title">
          <Satellite size={20} color="#10b981" /> Crop Health (NDVI)
        </h3>
        {satelliteData ? (
          <div className="satellite-health-display">
            <div className="ndvi-value-large">
              <div className="ndvi-number">{satelliteData.ndvi_value}</div>
              <div className="ndvi-label">NDVI Index</div>
            </div>
            <div className="ndvi-status">
              <div className={`ndvi-badge ${satelliteData.health_status.toLowerCase().replace(' ', '-')}`}>
                {satelliteData.health_status}
              </div>
              {satelliteData.stress_alert && (
                <div className="stress-alert">
                  <AlertTriangle size={20} color="#ef4444" />
                  <span>Crop stress detected</span>
                </div>
              )}
            </div>
            <div className="ndvi-info">
              <div className="info-item">
                <span className="info-label">Image Date:</span>
                <span className="info-value">{new Date(satelliteData.image_date).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Source:</span>
                <span className="info-value">{satelliteData.source}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-data">Satellite data not available</div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="section-card"
      >
        <h3 className="section-title">
          <Activity size={20} color="#3b82f6" /> AI Insights
        </h3>
        {satelliteInsights && satelliteInsights.insights.length > 0 ? (
          <div className="insights-list">
            {satelliteInsights.insights.map((insight, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className={`insight-item insight-${insight.type}`}
              >
                <div className="insight-icon">
                  {insight.type === 'critical' && <AlertTriangle size={20} color="#ef4444" />}
                  {insight.type === 'warning' && <AlertTriangle size={20} color="#f59e0b" />}
                  {insight.type === 'positive' && <Activity size={20} color="#10b981" />}
                </div>
                <div className="insight-content">
                  <div className="insight-message">{insight.message}</div>
                  <div className="insight-action">Action: {insight.action}</div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="no-data">No insights available</div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="section-card"
      >
        <h3 className="section-title">
          <TrendingUp size={20} color="#10b981" /> NDVI Interpretation
        </h3>
        <div className="ndvi-scale">
          <div className="scale-item">
            <div className="scale-color" style={{ background: '#ef4444' }}></div>
            <div className="scale-label">
              <div className="scale-range">0.0 - 0.3</div>
              <div className="scale-desc">Poor vegetation / Crop stress</div>
            </div>
          </div>
          <div className="scale-item">
            <div className="scale-color" style={{ background: '#f59e0b' }}></div>
            <div className="scale-label">
              <div className="scale-range">0.3 - 0.5</div>
              <div className="scale-desc">Moderate vegetation</div>
            </div>
          </div>
          <div className="scale-item">
            <div className="scale-color" style={{ background: '#10b981' }}></div>
            <div className="scale-label">
              <div className="scale-range">0.5 - 0.8</div>
              <div className="scale-desc">Healthy vegetation</div>
            </div>
          </div>
          <div className="scale-item">
            <div className="scale-color" style={{ background: '#059669' }}></div>
            <div className="scale-label">
              <div className="scale-range">0.8 - 1.0</div>
              <div className="scale-desc">Very healthy vegetation</div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="section-card"
      >
        <h3 className="section-title">
          <MapPin size={20} color="#3b82f6" /> Field Map
        </h3>
        {data?.field_info?.id && (
          <div className="field-map-container">
            <MapContainer
              center={[data?.latitude || 17.3850, data?.longitude || 78.4867]}
              zoom={13}
              style={{ height: '400px', width: '100%', borderRadius: '0.75rem' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {data?.latitude && data?.longitude && (
                <>
                  <Marker position={[data.latitude, data.longitude]}>
                    <Popup>
                      <div className="map-popup">
                        <div className="popup-title">{currentStatus.farmer_village}</div>
                        <div className="popup-info">
                          <div>Crop: {currentStatus.field_info?.crop}</div>
                          <div>Area: {currentStatus.field_info?.area} hectares</div>
                          <div>NDVI: {satelliteData?.ndvi_value || 'N/A'}</div>
                          <div>Health: {satelliteData?.health_status || 'N/A'}</div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                  <Circle
                    center={[data.latitude, data.longitude]}
                    radius={500}
                    pathOptions={{
                      color: satelliteData?.stress_alert ? '#ef4444' :
                        satelliteData?.health_status?.includes('Poor') ? '#f59e0b' :
                          satelliteData?.health_status?.includes('Moderate') ? '#f59e0b' :
                            satelliteData?.health_status?.includes('Healthy') ? '#10b981' : '#3b82f6',
                      fillColor: satelliteData?.stress_alert ? '#ef4444' :
                        satelliteData?.health_status?.includes('Poor') ? '#f59e0b' :
                          satelliteData?.health_status?.includes('Moderate') ? '#f59e0b' :
                            satelliteData?.health_status?.includes('Healthy') ? '#10b981' : '#3b82f6',
                      fillOpacity: 0.3,
                      weight: 2
                    }}
                  />
                </>
              )}
            </MapContainer>
            <div className="map-legend">
              <div className="legend-title">NDVI Health Status</div>
              <div className="legend-items">
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#ef4444' }}></div>
                  <span>Poor / Stress</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#f59e0b' }}></div>
                  <span>Moderate</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#10b981' }}></div>
                  <span>Healthy</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color" style={{ background: '#059669' }}></div>
                  <span>Very Healthy</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </>
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
      default:
        return renderHome();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="dashboard-container">
      <header className="header">
        <div className="logo">
          <Droplets size={36} color="white" />
          <div>
            <h1>IrrigateAI</h1>
            <p className="logo-subtitle">Smart Farming Assistant</p>
          </div>
        </div>
        <div className="farmer-profile">
          <div className="language-selector">
            <Languages size={20} color="white" />
            <select
              value={currentLang}
              onChange={(e) => changeLanguage(e.target.value)}
              className="lang-select"
            >
              <option value="English">ENG</option>
              <option value="Hindi">HIN</option>
              <option value="Telugu">TEL</option>
              <option value="Tamil">TAM</option>
              <option value="Kannada">KAN</option>
            </select>
          </div>
          <div className="profile-badge">
            <User size={20} color="white" />
            <span>{currentStatus.farmer_name}</span>
          </div>
          <button onClick={handleCall} disabled={calling} className="call-button">
            <Phone size={20} /> {calling ? 'Calling...' : t('call')}
          </button>
          <button onClick={handleLogout} className="logout-button">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <nav className="nav-tabs">
        <button className={`nav-tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={24} />
          <span>{t('home')}</span>
        </button>
        <button className={`nav-tab ${activeTab === 'soil' ? 'active' : ''}`} onClick={() => setActiveTab('soil')}>
          <Droplets size={24} />
          <span>{t('soilHealth')}</span>
        </button>
        <button className={`nav-tab ${activeTab === 'satellite' ? 'active' : ''}`} onClick={() => setActiveTab('satellite')}>
          <Satellite size={24} />
          <span>{t('satellite')}</span>
        </button>
        <button className={`nav-tab ${activeTab === 'weather' ? 'active' : ''}`} onClick={() => setActiveTab('weather')}>
          <Cloud size={24} />
          <span>{t('weather')}</span>
        </button>
        <button className={`nav-tab ${activeTab === 'crops' ? 'active' : ''}`} onClick={() => setActiveTab('crops')}>
          <Sprout size={24} />
          <span>{t('crops')}</span>
        </button>
        <button className={`nav-tab ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <CalendarDays size={24} />
          <span>{t('schedule')}</span>
        </button>
      </nav>

      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="modal-content"
            >
              <button onClick={() => setShowSettingsModal(false)} className="modal-close">
                <X size={24} />
              </button>

              <h2 className="modal-title">
                <Settings size={28} color="#10b981" /> Edit Profile
              </h2>

              <div className="form-group">
                <label>Village Location</label>
                <div className="input-wrapper">
                  <MapPin size={20} />
                  <input
                    value={editForm.village}
                    onChange={(e) => setEditForm({ ...editForm, village: e.target.value })}
                    placeholder="Enter village name"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Crop Type</label>
                <select
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

              <button onClick={saveSettings} disabled={savingStatus} className="save-button">
                {savingStatus ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="content">
        {renderContent()}
      </main>
    </motion.div>
  );
};

export default App;
