import React, { useState, useEffect } from 'react';
import {
  Droplets, Thermometer, Wind, Activity, Gauge,
  MapPin, Calendar, Power, AlertTriangle,
  ChevronRight, TrendingUp, History, User, Phone, LogOut, Loader2,
  Sun, Sunrise, CloudRain, Settings, X, Home, Cloud, Sprout, CalendarDays, Satellite, Languages,
  FlaskConical, Sparkles, Play, Pause, Zap, Bot, RefreshCw
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
import ThemeToggle from './components/ThemeToggle';
import FieldPolygonDrawer from './components/FieldPolygonDrawer';
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

const languageLabels = {
  English: "English",
  Hindi: "हिंदी",
  Telugu: "తెలుగు",
  Tamil: "தமிழ்",
  Malayalam: "മലയാളം",
  Kannada: "ಕನ್ನಡ",
  Marathi: "मराठी",
  Bengali: "বাংলা",
  Gujarati: "ગુજરાતી"
};

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
    settings: "Settings",
    callOptions: "Call Options",
    moistureUpdate: "Moisture & Schedule",
    pumpControl: "Pump Control",
    cropHealth: "Crop Health",
    rainStatus: "Rain Status",
    solutions: "Solutions",
    features: "Features",
    howItWorks: "How It Works",
    dashboard: "Dashboard",
    login: "Log In",
    getStarted: "Get Started",
    heroTitle: "AI‑Powered Precision Irrigation for",
    heroHighlight: "Smarter Farming",
    heroDesc: "Monitor crop health, track soil moisture, and automate irrigation using IoT sensors, satellite data, and AI insights.",
    problem_tag: "The Problem",
    problem_title: "Farming Still Relies on Guesswork",
    problem_desc: "Traditional irrigation methods lead to water waste and reduced crop yield.",
    p1: "Over‑irrigation wastes water",
    p2: "Under‑irrigation stresses crops",
    p3: "Farmers lack real‑time data",
    p4: "Climate conditions change rapidly",
    sol_tag: "Our Solution",
    sol_title: "Smart Irrigation Powered by Data",
    sol_desc: "AgriMate combines IoT, satellite imagery, and AI to give farmers precise, real‑time irrigation guidance.",
    s1_t: "IoT Soil Monitoring",
    s1_d: "IoT sensors monitor soil moisture, temperature, and nutrient levels in real time.",
    s2_t: "Satellite Crop Health",
    s2_d: "Satellite imagery tracks crop health using NDVI analysis from Sentinel‑2.",
    s3_t: "AI Predictions",
    s3_d: "AI predicts irrigation needs based on weather, soil, and crop data.",
    s4_t: "Automated Alerts",
    s4_d: "Smart alerts guide farmers on when and how much to irrigate.",
    feat_tag: "Key Features",
    feat_title: "Everything you need to irrigate smarter",
    f1_t: "Soil Monitoring",
    f1_d: "Real‑time soil moisture tracking using IoT sensors.",
    f2_t: "Satellite Monitoring",
    f2_d: "NDVI analysis from Sentinel‑2 imagery.",
    f3_t: "AI Recommendations",
    f3_d: "AI suggests optimal watering schedules.",
    f4_t: "Water Analytics",
    f4_d: "Track how much water your farm uses.",
    f5_t: "Smart Alerts",
    f5_d: "SMS or dashboard alerts for irrigation needs.",
    how_tag: "How It Works",
    how_title: "From sensors to smart decisions",
    h1_t: "Sensors Collect Data",
    h1_d: "IoT sensors gather soil moisture, temperature, and environmental data from your fields.",
    h2_t: "Satellite Imagery Analyzes",
    h2_d: "Sentinel‑2 satellite imagery provides NDVI crop health analysis across your farm.",
    h3_t: "AI Processes the Data",
    h3_d: "Machine learning models analyze all inputs to predict optimal irrigation schedules.",
    h4_t: "Farmers Get Recommendations",
    h4_d: "Receive clear, actionable irrigation guidance via dashboard or SMS alerts.",
    step: "Step",
    who_tag: "Who It's For",
    who_title: "Built for every stakeholder in agriculture",
    w1_t: "Small & Medium Farmers",
    w1_d: "Affordable precision irrigation tools designed for farms of any scale.",
    w2_t: "Agri‑Tech Startups",
    w2_d: "Build on AgriMate's data platform to create innovative farming solutions.",
    w3_t: "Smart Farming Researchers",
    w3_d: "Access real‑time field data and satellite imagery for agricultural research.",
    w4_t: "Agricultural Organizations",
    w4_d: "Deploy scalable irrigation intelligence across large agricultural programs.",
    precision_ag: "Precision Agriculture",
    view_demo: "View Dashboard Demo",
    data_driven: "Data-Driven Insights",
    h_s2_t: "Turn field data into",
    h_s2_h: "Real‑World Results",
    h_s2_d: "From soil health to yield maps, get actionable insights delivered straight to your device in real time.",
    how_it_works_btn: "See How It Works",
    smart_hardware: "Smart Hardware",
    h_s3_t: "Connected sensors for",
    h_s3_h: "Every Acre",
    h_s3_d: "Our IoT-enabled hardware adapts to your fields — monitoring, measuring, and optimizing season after season.",
    view_hardware: "View Hardware",
    optimal: "Optimal",
    warm: "Warm",
    normal: "Normal",
    stopped: "Stopped",
    moisture_trend: "Moisture Trend (24h)",
    realtime_feed: "Real-time Feed",
    current_harvest: "Current Harvest",
    growthStage_label: "Growth Stage",
    vegetative: "Vegetative",
    modify_settings: "Modify settings",
    field_profile: "Field Profile",
    village_label: "Village",
    hectares: "Hectares",
    ai_recommendation: "AI RECOMMENDATION",
    water_needed_in: "Your field will need water in",
    hours: "hours",
    active: "SYSTEM ACTIVE",
    standby: "SYSTEM STANDBY",
    state: "State",
    partlyCloudy: "Partly Cloudy",
    humidity_label: "Humidity",
    wind: "Wind",
    rain_chance: "Rain Chance",
    sunrise_label: "Sunrise",
    current_conditions: "Current Conditions",
    local_conditions: "Local conditions and 7-day outlook for",
    days: "DAYS",
    waterFlow: "Water Flow",
    humidity: "Humidity",
    waterUsed: "Water Used",
    today: "Today",
    imp_tag: "Impact",
    imp_title: "Why AgriMate matters",
    imp_desc: "Reduce water usage, increase crop productivity, prevent crop stress, and enable data‑driven farming.",
    i1_v: "Up to 30%",
    i1_l: "Water Savings",
    i1_d: "Reduce water usage dramatically with precision irrigation scheduling.",
    i2_v: "Healthier",
    i2_l: "Crops",
    i2_d: "Prevent crop stress by irrigating at the right time with the right amount.",
    i3_v: "Real‑time",
    i3_l: "Farm Insights",
    i3_d: "Enable data‑driven farming with live dashboards and actionable analytics.",
    cta_title: "Start Smarter Irrigation Today",
    cta_desc: "Join farmers across India who are saving water, boosting yields, and farming with confidence.",
    cta_btn1: "Create Account",
    cta_btn2: "Try Dashboard",
    createAccount: "Create Account",
    dp_tag: "Dashboard Preview",
    dp_title: "Monitor your entire farm in one dashboard",
    dp_desc: "Soil moisture, temperature, water flow, crop health maps, and irrigation recommendations — all at a glance.",
    bar_title: "AgriMate Dashboard",
    stressed: "Stressed",
    moderate: "Moderate",
    healthy: "Healthy",
    irrigate_now: "Irrigate now",
    adequate: "Adequate moisture",
    schedule_tomorrow: "Schedule tomorrow",
    zone: "Zone",
    welcome_back: "Welcome Back",
    login_command_center: "Log in to your AgriMate command center",
    phone_or_email: "Phone or Email",
    password_label: "Password",
    forgot: "Forgot?",
    login_btn: "Log In",
    new_to_gl: "New to AgriMate?",
    create_free_acc: "Create a Free Account",
    farmer_enrollment: "Farmer Enrollment",
    join_network: "Join the AgriMate AI precision irrigation network",
    full_name: "Full Name",
    phone_number: "Phone Number",
    village_loc: "Village Location",
    account_verified_msg: "Account is verified via SMS. By registering, you agree to receive automated AI calls for farm health monitoring and irrigation advice.",
    complete_reg: "Complete Registration",
    already_have_acc: "Already have an account?",
    login_here: "Log in here",
    secure_msg: "256-bit Secure",
    free_for_farmers: "Free for Indian Farmers",
    v4_msg: "Precision Irrigation System v4.0",
    footer_l1: "About the Project",
    footer_l2: "Documentation",
    footer_l3: "Contact",
    footer_l4: "GitHub",
    footer_l5: "Privacy Policy",
    footer_rights: "© 2026 AgriMate. All rights reserved.",
    home_subtitle: "Monitoring your farm's vital signs in real-time",
    soil_subtitle: "Underground analytics for precision crop nutrition",
    crops_subtitle: "Manage and monitor crop development stages",
    weather_subtitle: "Local condition and 7 day forecast",
    optimize_btn: "Apply Optimization",
    connecting: "Connecting...",
    demo_moisture: "Healthy (Demo)",
    analyzing: "Analyzing",
    action_rec: "Action Recommended",
    no_action: "No Action",
    check_details: "Check Details",
    sys_stable: "System Stable",
    field_variance: "Field Variance",
    moisture_trend_24h: "Moisture Trend (24h)",
    realtime_feed: "Real-time Feed"
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
    settings: "सेटिंग्स",
    callOptions: "कॉल विकल्प",
    moistureUpdate: "नमी और शेड्यूल",
    pumpControl: "पंप नियंत्रण",
    cropHealth: "फसल स्वास्थ्य",
    rainStatus: "बारिश की स्थिति",
    solutions: "समाधान",
    features: "विशेषताएं",
    howItWorks: "यह कैसे काम करता है",
    dashboard: "डैशबोर्ड",
    login: "लॉग इन",
    getStarted: "शुरू करें",
    heroTitle: "एआई-संचालित सटीक सिंचाई",
    heroHighlight: "स्मार्ट खेती के लिए",
    heroDesc: "IoT सेंसर, सैटेलाइट डेटा और AI अंतर्दृष्टि का उपयोग करके फसल स्वास्थ्य की निगरानी करें और सिंचाई को स्वचालित करें।",
    problem_tag: "समस्या",
    problem_title: "खेती अभी भी अनुमान पर निर्भर है",
    problem_desc: "पारंपरिक सिंचाई के तरीकों से पानी की बर्बादी होती है और फसल की उपज कम होती है।",
    p1: "अत्यधिक सिंचाई से पानी बर्बाद होता है",
    p2: "कम सिंचाई से फसलों पर दबाव पड़ता है",
    p3: "किसानों के पास वास्तविक समय के डेटा की कमी है",
    p4: "जलवायु परिस्थितियां तेजी से बदलती हैं",
    sol_tag: "हमारा समाधान",
    sol_title: "डेटा द्वारा संचालित स्मार्ट सिंचाई",
    sol_desc: "एग्रीमेट किसानों को सटीक, वास्तविक समय में सिंचाई मार्गदर्शन देने के लिए IoT, सैटेलाइट इमेजरी और AI को जोड़ता है।",
    s1_t: "IoT मिट्टी की निगरानी",
    s1_d: "IoT सेंसर वास्तविक समय में मिट्टी की नमी, तापमान और पोषक तत्वों की निगरानी करते हैं।",
    s2_t: "सैटेलाइट फसल स्वास्थ्य",
    s2_d: "सैटेलाइट इमेजरी सेंटिनल-2 से NDVI विश्लेषण का उपयोग करके फसल स्वास्थ्य को ट्रैक करती है।",
    s3_t: "AI भविष्यवाणियां",
    s3_d: "AI मौसम, मिट्टी और फसल डेटा के आधार पर सिंचाई की जरूरतों की भविष्यवाणी करता है।",
    s4_t: "स्वचालित अलर्ट",
    s4_d: "स्मार्ट अलर्ट किसानों को मार्गदर्शन देते हैं कि कब और कितना सिंचाई करनी है।",
    feat_tag: "प्रमुख विशेषताएं",
    feat_title: "वह सब कुछ जो आपको होशियारी से सिंचाई करने के लिए चाहिए",
    f1_t: "मिट्टी की निगरानी",
    f1_d: "IoT सेंसर का उपयोग करके वास्तविक समय में मिट्टी की नमी की ट्रैकिंग।",
    f2_t: "सैटेलाइट मॉनिटरिंग",
    f2_d: "सेंटिनल-2 इमेजरी से NDVI विश्लेषण।",
    f3_t: "AI सिफारिशें",
    f3_d: "AI इष्टतम पानी देने के कार्यक्रम का सुझाव देता है।",
    f4_t: "जल विश्लेषण",
    f4_d: "ट्रैक करें कि आपका खेत कितना पानी उपयोग करता है।",
    f5_t: "स्मार्ट अलर्ट",
    f5_d: "सिंचाई की जरूरतों के लिए एसएमएस या डैशबोर्ड अलर्ट।",
    how_tag: "यह कैसे काम करता है",
    how_title: "सेंसर से स्मार्ट निर्णय तक",
    h1_t: "सेंसर डेटा एकत्र करते हैं",
    h1_d: "IoT सेंसर आपके खेतों से मिट्टी की नमी, तापमान और पर्यावरणीय डेटा एकत्र करते हैं।",
    h2_t: "सैटेलाइट इमेजरी विश्लेषण",
    h2_d: "सेंटिनल-2 सैटेलाइट इमेजरी आपके पूरे खेत में NDVI फसल स्वास्थ्य विश्लेषण प्रदान करती है।",
    h3_t: "AI डेटा को प्रोसेस करता है",
    h3_d: "मशीन लर्निंग मॉडल इष्टतम सिंचाई कार्यक्रम की भविष्यवाणी करने के लिए सभी इनपुट का विश्लेषण करते हैं।",
    h4_t: "किसानों को सिफारिशें मिलती हैं",
    h4_d: "डैशबोर्ड या एसएमएस अलर्ट के माध्यम से स्पष्ट, कार्रवाई योग्य सिंचाई मार्गदर्शन प्राप्त करें।",
    step: "चरण",
    who_tag: "यह किसके लिए है",
    who_title: "कृषि में हर हितधारक के लिए बनाया गया",
    w1_t: "छोटे और मध्यम किसान",
    w1_d: "किसी भी पैमाने के खेतों के लिए डिज़ाइन किए गए किफायती सटीक सिंचाई उपकरण।",
    w2_t: "एग्री-टेक स्टार्टअप",
    w2_d: "अभिनव कृषि समाधान बनाने के लिए एग्रीमेट के डेटा प्लेटफॉर्म पर निर्माण करें।",
    w3_t: "स्मार्ट फार्मिंग शोधकर्ता",
    w3_d: "कृषि अनुसंधान के लिए वास्तविक समय के फील्ड डेटा और सैटेलाइट इमेजरी तक पहुंचें।",
    w4_t: "कृषि संगठन",
    w4_d: "बड़े कृषि कार्यक्रमों में स्केलेबल सिंचाई बुद्धिमत्ता तैनात करें।",
    precision_ag: "सटीक कृषि",
    view_demo: "डैशबोर्ड डेमो देखें",
    data_driven: "डेटा-संचालित अंतर्दृष्टि",
    h_s2_t: "फील्ड डेटा को बदलें",
    h_s2_h: "वास्तविक दुनिया के परिणामों में",
    h_s2_d: "मिट्टी के स्वास्थ्य से लेकर उपज मानचित्रों तक, सीधे अपने डिवाइस पर वास्तविक समय में कार्रवाई योग्य अंतर्दृष्टि प्राप्त करें।",
    how_it_works_btn: "देखें कि यह कैसे काम करता है",
    smart_hardware: "स्मार्ट हार्डवेयर",
    h_s3_t: "संबद्ध सेंसर",
    h_s3_h: "हर एकड़ के लिए",
    h_s3_d: "हमारा IoT-सक्षम हार्डवेयर आपके खेतों के अनुसार ढल जाता है - मौसम दर मौसम निगरानी, माप और अनुकूलन करता है।",
    view_hardware: "हार्डवेयर देखें",
    optimal: "इष्टतम",
    warm: "गर्म",
    normal: "सामान्य",
    stopped: "रुका हुआ",
    moisture_trend: "नमी का रुझान (24 घंटे)",
    realtime_feed: "रीयल-टाइम फीड",
    current_harvest: "वर्तमान फसल",
    growthStage_label: "विकास चरण",
    vegetative: "वानस्पतिक",
    modify_settings: "सेटिंग्स बदलें",
    field_profile: "फील्ड प्रोफाइल",
    village_label: "गांव",
    hectares: "हेक्टेयर",
    ai_recommendation: "एआई सिफारिश",
    water_needed_in: "आपके खेत को पानी की आवश्यकता होगी",
    hours: "घंटे",
    active: "सिस्टम सक्रिय है",
    standby: "सिस्टम स्टैंडबाय पर है",
    state: "स्थिति",
    partlyCloudy: "आंशिक रूप से बादल",
    humidity_label: "नमी",
    wind: "हवा",
    rain_chance: "बारिश की संभावना",
    sunrise_label: "सूर्योदय",
    current_conditions: "वर्तमान स्थिति",
    local_conditions: "स्थानीय स्थिति और 7-दिन का पूर्वानुमान",
    days: "दिन",
    waterFlow: "पानी का बहाव",
    humidity: "नमी",
    waterUsed: "उपयोग किया गया पानी",
    today: "आज",
    imp_tag: "प्रभाव",
    imp_title: "एग्रीमेट क्यों महत्वपूर्ण है",
    imp_desc: "पानी का उपयोग कम करें, फसल उत्पादकता बढ़ाएँ, फसल तनाव रोकें और डेटा-संचालित खेती को सक्षम करें।",
    i1_v: "30% तक",
    i1_l: "पानी की बचत",
    i1_d: "सटीक सिंचाई समय-निर्धारण के साथ पानी के उपयोग को नाटकीय रूप से कम करें।",
    i2_v: "स्वस्थ",
    i2_l: "फसलें",
    i2_d: "सही समय पर सही मात्रा में सिंचाई करके फसल तनाव को रोकें।",
    i3_v: "वास्तविक समय",
    i3_l: "खेत की जानकारी",
    i3_d: "लाइव डैशबोर्ड और कार्रवाई योग्य विश्लेषण के साथ डेटा-संचालित खेती को सक्षम करें।",
    cta_title: "आज ही स्मार्ट सिंचाई शुरू करें",
    cta_desc: "पूरे भारत के उन किसानों से जुड़ें जो पानी बचा रहे हैं, उपज बढ़ा रहे हैं और आत्मविश्वास के साथ खेती कर रहे हैं।",
    cta_btn1: "खाता बनाएं",
    cta_btn2: "डैशबोर्ड आज़माएं",
    createAccount: "खाता बनाएं",
    dp_tag: "डैशबोर्ड पूर्वावलोकन",
    dp_title: "एक ही डैशबोर्ड में अपने पूरे खेत की निगरानी करें",
    dp_desc: "मिट्टी की नमी, तापमान, पानी का बहाव, फसल स्वास्थ्य मानचित्र और सिंचाई सिफारिशें - सब कुछ एक नज़र में।",
    bar_title: "एग्रीमेट डैशबोर्ड",
    stressed: "तनावग्रस्त",
    moderate: "मध्यम",
    healthy: "स्वस्थ",
    irrigate_now: "अभी सिंचाई करें",
    adequate: "पर्याप्त नमी",
    schedule_tomorrow: "कल के लिए शेड्यूल करें",
    zone: "क्षेत्र",
    welcome_back: "वापसी पर स्वागत है",
    login_command_center: "अपने एग्रीमेट कमांड सेंटर में लॉग इन करें",
    phone_or_email: "फोन या ईमेल",
    password_label: "पासवर्ड",
    forgot: "भूल गए?",
    login_btn: "लॉग इन करें",
    new_to_gl: "एग्रीमेट में नए हैं?",
    create_free_acc: "मुफ़्त खाता बनाएँ",
    farmer_enrollment: "किसान नामांकन",
    join_network: "एग्रीमेट एआई सटीक सिंचाई नेटवर्क से जुड़ें",
    full_name: "पूरा नाम",
    phone_number: "फ़ोन नंबर",
    village_loc: "गाँव का स्थान",
    account_verified_msg: "खाता एसएमएस के माध्यम से सत्यापित किया जाता है। पंजीकरण करके, आप खेत स्वास्थ्य निगरानी और सिंचाई सलाह के लिए स्वचालित एआई कॉल प्राप्त करने के लिए सहमत होते हैं।",
    complete_reg: "पंजीकरण पूरा करें",
    already_have_acc: "क्या पहले से ही एक खाता है?",
    login_here: "यहाँ लॉग इन करें",
    secure_msg: "256-बिट सुरक्षित",
    free_for_farmers: "भारतीय किसानों के लिए निःशुल्क",
    v4_msg: "सटीक सिंचाई प्रणाली v4.0",
    footer_l1: "परियोजना के बारे में",
    footer_l2: "दस्तावेज़ीकरण",
    footer_l3: "संपर्क",
    footer_l4: "गिटहब",
    footer_l5: "गोपनीयता नीति",
    footer_rights: "© 2026 एग्रीमेट। सर्वाधिकार सुरक्षित।",
    home_subtitle: "वास्तविक समय में अपने खेत के महत्वपूर्ण संकेतों की निगरानी करें",
    soil_subtitle: "सटीक फसल पोषण के लिए भूमिगत विश्लेषण",
    crops_subtitle: "फसल विकास चरणों का प्रबंधन और निगरानी करें",
    weather_subtitle: "स्थानीय स्थिति और 7 दिन का पूर्वानुमान",
    optimize_btn: "अनुकूलन लागू करें",
    connecting: "जुड़ रहा है...",
    demo_moisture: "स्वस्थ (डेमो)",
    analyzing: "विश्लेषण कर रहा है",
    action_rec: "कार्रवाई की सिफारिश की गई",
    no_action: "कोई कार्रवाई नहीं",
    check_details: "विवरण जांचें",
    sys_stable: "सिस्टम स्थिर है",
    field_variance: "खेत की भिन्नता",
    moisture_trend_24h: "नमी की प्रवृत्ति (24 घंटे)",
    realtime_feed: "रीयल-टाइम फीड"
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
    settings: "సెట్టింగ్‌లు",
    callOptions: "కాల్ ఎంపికలు",
    moistureUpdate: "తేమ మరియు షెడ్యూల్",
    pumpControl: "పంప్ నియంత్రణ",
    cropHealth: "పంట ఆరోగ్యం",
    rainStatus: "వర్షం పరిస్థితి",
    solutions: "పరిష్కారాలు",
    features: "ఫీచర్లు",
    howItWorks: "ఇది ఎలా పనిచేస్తుంది",
    dashboard: "డాష్‌బోర్డ్",
    login: "లాగిన్",
    getStarted: "ప్రారంభించండి",
    heroTitle: "AI-ఆధారిత ఖచ్చితమైన నీటి పారుదల",
    heroHighlight: "తెలివైన వ్యవసాయం కోసం",
    heroDesc: "IoT సెన్సార్లు, శాటిలైట్ డేటా మరియు AI అంతర్దృష్టులను ఉపయోగించి పంట ఆరోగ్యాన్ని పర్యవేక్షించండి మరియు నీటి పారుదలని ఆటోమేట్ చేయండి.",
    problem_tag: "సమస్య",
    problem_title: "వ్యవసాయం ఇంకా అంచనాలపైనే ఆధారపడి ఉంది",
    problem_desc: "సాంప్రదాయ నీటి పారుదల పద్ధతులు నీటి వృధాకు మరియు పంట దిగుబడి తగ్గడానికి దారితీస్తాయి.",
    p1: "అధిక నీటి పారుదల వల్ల నీరు వృధా అవుతుంది",
    p2: "తక్కువ నీటి పారుదల వల్ల పంటలు దెబ్బతింటాయి",
    p3: "రైతులకు రియల్ టైమ్ డేటా అందుబాటులో లేదు",
    p4: "వాతావరణ పరిస్థితులు వేగంగా మారుతున్నాయి",
    sol_tag: "మా పరిష్కారం",
    sol_title: "డేటాతో పనిచేసే స్మార్ట్ ఇరిగేషన్",
    sol_desc: "రైతులకు ఖచ్చితమైన, నిజ సమయ నీటి పారుదల మార్గదర్శకత్వాన్ని అందించడానికి గ్రామీణలింక్ IoT, శాటిలైట్ ఇమేజరీ మరియు AIని కలుపుతుంది.",
    s1_t: "IoT నేల పర్యవేక్షణ",
    s1_d: "IoT సెన్సార్లు నేల తేమ, ఉష్ణోగ్రత మరియు పోషకాల స్థాయిలను నిజ సమయంలో పర్యవేక్షిస్తాయి.",
    s2_t: "శాటిలైట్ పంట ఆరోగ్యం",
    s2_d: "శాటిలైట్ ఇమేజరీ సెంట్రల్-2 నుండి NDVI విశ్లేషణను ఉపయోగించి పంట ఆరోగ్యాన్ని ట్రాక్ చేస్తుంది.",
    s3_t: "AI అంచనాలు",
    s3_d: "వాతావరణం, మట్టి మరియు పంట డేటా ఆధారంగా AI నీటి పారుదల అవసరాలను అంచనా వేస్తుంది.",
    s4_t: "ఆటోమేటెడ్ అలర్ట్లు",
    s4_d: "ఎప్పుడు మరియు ఎంత నీరు పెట్టాలో రైతులకు స్మార్ట్ అలర్ట్లు వివరిస్తాయి.",
    feat_tag: "కీలక ఫీచర్లు",
    feat_title: "తెలివిగా నీటి పారుదల చేయడానికి మీకు కావలసినవన్నీ",
    f1_t: "నేల పర్యవేక్షణ",
    f1_d: "IoT సెన్సార్లను ఉపయోగించి నిజ సమయ నేల తేమ ట్రాకింగ్.",
    f2_t: "శాటిలైట్ పర్యవేక్షణ",
    f2_d: "సెంట్రల్-2 ఇమేజరీ నుండి NDVI విశ్లేషణ.",
    f3_t: "AI సిఫార్సులు",
    f3_d: "AI సరైన నీటి పారుదల షెడ్యూల్‌లను సూచిస్తుంది.",
    f4_t: "నీటి వినియోగ విశ్లేషణ",
    f4_d: "మీ పొలం ఎంత నీటిని ఉపయోగిస్తుందో ట్రాక్ చేయండి.",
    f5_t: "స్మార్ట్ అలర్ట్లు",
    f5_d: "నీటి పారుదల అవసరాల కోసం SMS లేదా డాష్‌బోర్డ్ అలర్ట్లు.",
    how_tag: "ఇది ఎలా పనిచేస్తుంది",
    how_title: "సెన్సార్ల నుండి స్మార్ట్ నిర్ణయాల వరకు",
    h1_t: "సెన్సార్లు డేటాను సేకరిస్తాయి",
    h1_d: "IoT సెన్సార్లు మీ పొలాల నుండి నేల తేమ, ఉష్ణోగ్రత మరియు వాతావరణ డేటాను సేకరిస్తాయి.",
    h2_t: "శాటిలైట్ ఇమేజరీ విశ్లేషణ",
    h2_d: "సెంట్రల్-2 శాటిలైట్ ఇమేజరీ మీ పొలంలో NDVI పంట ఆరోగ్య విశ్లేషణను అందిస్తుంది.",
    h3_t: "AI డేటాను ప్రాసెస్ చేస్తుంది",
    h3_d: "మెషిన్ లెర్నింగ్ మోడల్స్ సరైన నీటి పారుదల షెడ్యూల్‌లను అంచనా వేయడానికి అన్ని ఇన్పుట్లను విశ్లేషిస్తాయి.",
    h4_t: "రైతులకు సిఫార్సులు అందుతాయి",
    h4_d: "డాష్‌బోర్డ్ లేదా SMS అలర్ట్ల ద్వారా స్పష్టమైన, ఆచరణాత్మక నీటి పారుదల మార్గదర్శకత్వాన్ని పొందండి.",
    step: "దశ",
    who_tag: "ఇది ఎవరి కోసం",
    who_title: "వ్యవసాయ రంగంలోని ప్రతి ఒక్కరి కోసం నిర్మించబడింది",
    w1_t: "చిన్న మరియు మధ్యతరహా రైతులు",
    w1_d: "ఏ పరిమాణంలో ఉన్న పొలాలకైనా సరిపోయే సరసమైన ఖచ్చితమైన నీటి పారుదల సాధనాలు.",
    w2_t: "అగ్రి-టెక్ స్టార్టప్‌లు",
    w2_d: "వినూత్న వ్యవసాయ పరిష్కారాలను రూపొందించడానికి గ్రామీణలింక్ డేటా ప్లాట్‌ఫారమ్‌పై నిర్మించండి.",
    w3_t: "స్మార్ట్ ఫార్మింగ్ పరిశోధకులు",
    w3_d: "వ్యవసాయ పరిశోధన కోసం నిజ సమయ ఫీల్డ్ డేటా మరియు శాటిలైట్ ఇమేజరీని పొందండి.",
    w4_t: "వ్యవసాయ సంస్థలు",
    w4_d: "పెద్ద వ్యవసాయ కార్యక్రమాలలో స్కేలబుల్ ఇరిగేషన్ ఇంటెలిజెన్స్‌ను అమలు చేయండి.",
    precision_ag: "ఖచ్చితమైన వ్యవసాయం",
    view_demo: "డ్యాష్‌బోర్డ్ డెమో చూడండి",
    data_driven: "డేటా ఆధారిత అంతర్దృష్టులు",
    h_s2_t: "ఫీల్డ్ డేటాను ఇలా మార్చండి",
    h_s2_h: "నిజ ప్రపంచ ఫలితాలు",
    h_s2_d: "నేల ఆరోగ్యం నుండి దిగుబడి మ్యాప్‌ల వరకు, మీ పరికరానికి నేరుగా నిజ సమయంలో ఆచరణాత్మక అంతర్దృష్టులను పొందండి.",
    how_it_works_btn: "ఇది ఎలా పనిచేస్తుందో చూడండి",
    smart_hardware: "స్మార్ట్ హార్డ్‌వేర్",
    h_s3_t: "కనెక్ట్ చేయబడిన సెన్సార్లు",
    h_s3_h: "ప్రతి ఎకరానికి",
    h_s3_d: "మా IoT-ప్రారంభించబడిన హార్డ్‌వేర్ మీ పొలాలకు అనుగుణంగా మారుతుంది — ప్రతి సీజన్‌లో పర్యవేక్షిస్తుంది, కొలుస్తుంది మరియు ఆప్టిమైజ్ చేస్తుంది.",
    view_hardware: "హార్డ్‌వేర్ చూడండి",
    optimal: "సరైనది",
    warm: "వేడి",
    normal: "సాధారణం",
    stopped: "ఆగిపోయింది",
    moisture_trend: "తేమ ధోరణి (24 గంటలు)",
    realtime_feed: "రియల్ టైమ్ ఫీడ్",
    current_harvest: "ప్రస్తుత పంట",
    growthStage_label: "పెరుగుదల దశ",
    vegetative: "వృక్షసంబంధమైన",
    modify_settings: "సెట్టేంగ్‌లను మార్చండి",
    field_profile: "ఫీల్డ్ ప్రొఫైల్",
    village_label: "గ్రామం",
    hectares: "హెక్టార్లు",
    ai_recommendation: "AI సిఫార్సు",
    water_needed_in: "మీ పొలానికి నీరు అవసరం",
    hours: "గంటలు",
    active: "సిస్టమ్ యాక్టివ్",
    standby: "సిస్టమ్ స్టాండ్‌బై",
    state: "స్థితి",
    partlyCloudy: "పాక్షికంగా మేఘావృతం",
    humidity_label: "తేమ",
    wind: "గాలి",
    rain_chance: "వర్షం అవకాశం",
    sunrise_label: "సూర్యోదయం",
    current_conditions: "ప్రస్తుత పరిస్థితులు",
    local_conditions: "స్థానిక పరిస్థితులు మరియు 7-రోజుల దృక్పథం",
    days: "రోజులు",
    waterFlow: "నీటి ప్రవాహం",
    humidity: "తేమ",
    waterUsed: "వినియోగించిన నీరు",
    today: "నేడు",
    imp_tag: "ప్రభావం",
    imp_title: "గ్రామీణలింక్ ఎందుకు ముఖ్యం",
    imp_desc: "నీటి వినియోగాన్ని తగ్గించండి, పంట ఉత్పాదకతను పెంచండి, పంట నష్టాన్ని నివారించండి మరియు డేటాతో కూడిన వ్యవసాయాన్ని ప్రారంభించండి.",
    i1_v: "30% వరకు",
    i1_l: "నీటి ఆదా",
    i1_d: "ఖచ్చితమైన నీటి పారుదల షెడ్యూలింగ్ ద్వారా నీటి వినియోగాన్ని భారీగా తగ్గించండి.",
    i2_v: "ఆరోగ్యకరమైన",
    i2_l: "పంటలు",
    i2_d: "సరైన సమయంలో సరైన మొత్తంలో నీరు పెట్టడం ద్వారా పంట నష్టాన్ని నివారించండి.",
    i3_v: "రియల్ టైమ్",
    i3_l: "పొలం సమాచారం",
    i3_d: "లైవ్ డాష్‌బోర్డ్‌లు మరియు విశ్లేషణలతో డేటాతో కూడిన వ్యవసాయాన్ని సాధ్యం చేయండి.",
    cta_title: "ఈరోజే స్మార్ట్ ఇరిగేషన్ ప్రారంభించండి",
    cta_desc: "నీటిని ఆదా చేస్తూ, దిగుబడిని పెంచుతూ, ఆత్మవిశ్వాసంతో వ్యవసాయం చేస్తున్న భారతదేశం అంతటా ఉన్న రైతులతో చేరండి.",
    cta_btn1: "ఖాతా సృష్టించండి",
    cta_btn2: "డాష్‌బోర్డ్ ప్రయత్నించండి",
    createAccount: "ఖాతా సృష్టించండి",
    dp_tag: "డాష్‌బోర్డ్ ప్రివ్యూ",
    dp_title: "మీ మొత్తం పొలాన్ని ఒకే డాష్‌బోర్డ్‌లో పర్యవేక్షించండి",
    dp_desc: "నేల తేమ, ఉష్ణోగ్రత, నీటి ప్రవాహం, పంట ఆరోగ్య మ్యాప్‌లు మరియు నీటి పారుదల సిఫార్సులు — అన్నీ ఒకే చూపులో.",
    bar_title: "గ్రామీణలింక్ డాష్‌బోర్డ్",
    stressed: "ఒత్తిడికి గురైంది",
    moderate: "మితమైనది",
    healthy: "ఆరోగ్యకరమైనది",
    irrigate_now: "ఇప్పుడే నీరు పెట్టండి",
    adequate: "తగినంత తేమ",
    schedule_tomorrow: "రేపటికి షెడ్యూల్ చేయండి",
    zone: "జోన్",
    welcome_back: "తిరిగి స్వాగతం",
    login_command_center: "మీ గ్రామీణలింక్ కమాండ్ సెంటర్‌కు లాగిన్ చేయండి",
    phone_or_email: "ఫోన్ లేదా ఇమెయిల్",
    password_label: "పాస్‌వర్డ్",
    forgot: "మర్చిపోయారా?",
    login_btn: "లాగిన్",
    new_to_gl: "గ్రామీణలింక్‌కు కొత్తా?",
    create_free_acc: "ఉచిత ఖాతాను సృష్టించండి",
    farmer_enrollment: "రైతు నమోదు",
    join_network: "గ్రామీణలింక్ AI ఖచ్చితమైన నీటి పారుదల నెట్‌వర్క్‌లో చేరండి",
    full_name: "పూర్తి పేరు",
    phone_number: "ఫోన్ నంబర్",
    village_loc: "గ్రామ ప్రదేశం",
    account_verified_msg: "ఖాతా SMS ద్వారా ధృవీకరించబడుతుంది. నమోదు చేసుకోవడం ద్వారా, మీరు పొలం ఆరోగ్య పర్యవేక్షణ మరియు నీటి పారుదల సలహా కోసం ఆటోమేటెడ్ AI కాల్‌లను స్వీకరించడానికి అంగీకరిస్తున్నారు.",
    complete_reg: "నమోదు పూర్తి చేయండి",
    already_have_acc: "ఇప్పటికే ఖాతా ఉందా?",
    login_here: "ఇక్కడ లాగిన్ చేయండి",
    secure_msg: "256-బిట్ సురక్షితం",
    free_for_farmers: "భారతీయ రైతులకు ఉచితం",
    v4_msg: "ఖచ్చితమైన నీటి పారుదల వ్యవస్థ v4.0",
    footer_l1: "ప్రాజెక్ట్ గురించి",
    footer_l2: "డాక్యుమెంటేషన్",
    footer_l3: "సంప్రదించండి",
    footer_l4: "గిట్‌హబ్",
    footer_l5: "గోప్యతా విధానం",
    footer_rights: "© 2026 గ్రామీణలింక్. అన్ని హక్కులు ప్రత్యేకించబడ్డాయి.",
    home_subtitle: "నిజ సమయంలో మీ పొలం యొక్క ముఖ్య సూచికలను పర్యవేక్షిస్తోంది",
    soil_subtitle: "ఖచ్చితమైన పంట పోషణ కోసం భూగర్భ విశ్లేషణ",
    crops_subtitle: "పంట అభివృద్ధి దశలను నిర్వహించండి మరియు పర్యవేక్షించండి",
    weather_subtitle: "స్థానిక పరిస్థితి మరియు 7 రోజుల సూచన",
    optimize_btn: "ఆప్టిమైజేషన్‌ను వర్తింపజేయండి",
    connecting: "కనెక్ట్ అవుతోంది...",
    demo_moisture: "ఆరోగ్యకరమైనది (డెమో)",
    analyzing: "విశ్లేషిస్తోంది",
    action_rec: "చర్య సిఫార్సు చేయబడింది",
    no_action: "చర్య అవసరం లేదు",
    check_details: "వివరాలను తనిఖీ చేయండి",
    sys_stable: "సిస్టమ్ స్థిరంగా ఉంది",
    field_variance: "ఫీల్డ్ వ్యత్యాసం",
    moisture_trend_24h: "తేమ ధోరణి (24 గంటలు)",
    realtime_feed: "రియల్ టైమ్ ఫీడ్"
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
    call: "அழைப்பு",
    settings: "அமைப்புகள்",
    callOptions: "அழைப்பு விருப்பங்கள்",
    moistureUpdate: "ஈரப்பதம் மற்றும் அட்டவணை",
    pumpControl: "பம்ப் கட்டுப்பாடு",
    cropHealth: "பயிர் ஆரோக்கியம்",
    rainStatus: "மழை நிலை",
    solutions: "தீர்வுகள்",
    features: "அம்சங்கள்",
    howItWorks: "செயல்பாடு",
    dashboard: "டாஷ்போர்டு",
    login: "உள்நுழை",
    getStarted: "தொடங்குங்கள்",
    heroTitle: "AI-இயங்கும் துல்லியமான நீர்ப்பாசனம்",
    heroHighlight: "சிறந்த விவசாயத்திற்கு",
    heroDesc: "IoT சென்சார்கள், செயற்கைக்கோள் தரவு மற்றும் AI நுண்ணறிவுகளைப் பயன்படுத்தி பயிர் ஆரோக்கியத்தைக் கண்காணிக்கவும் மற்றும் நீர்ப்பாசனத்தைத் தானியக்கமாக்கவும்.",
    problem_tag: "சிக்கல்",
    problem_title: "விவசாயம் இன்னும் யூகங்களையே நம்பியுள்ளது",
    problem_desc: "பாரம்பரிய நீர்ப்பாசன முறைகள் தண்ணீர் வீணாவதற்கும் பயிர் விளைச்சல் குறைவதற்கும் வழிவகுக்கின்றன.",
    p1: "அதிகப்படியான நீர்ப்பாசனம் தண்ணீரை வீணாக்குகிறது",
    p2: "குறைவான நீர்ப்பாசனம் பயிர்களைப் பாதிக்கிறது",
    p3: "விவசாயிகளுக்கு நிகழ்நேர தரவு இல்லை",
    p4: "காலநிலை வேகமாக மாறுகிறது",
    sol_tag: "எங்கள் தீர்வு",
    sol_title: "தரவு மூலம் இயங்கும் ஸ்மார்ட் நீர்ப்பாசனம்",
    sol_desc: "கிராமீன்லிங்க் IoT, செயற்கைக்கோள் படங்கள் மற்றும் AI ஆகியவற்றை ஒருங்கிணைக்கிறது.",
    s1_t: "IoT மண் கண்காணிப்பு",
    s1_d: "மண்ணின் ஈரப்பதம், வெப்பநிலை ஆகியவற்றை நிகழ்நேரத்தில் கண்காணிக்கின்றன.",
    s2_t: "செயற்கைக்கோள் பயிர் ஆரோக்கியம்",
    s2_d: "செயற்கைக்கோள் படங்கள் பயிர் ஆரோக்கியத்தைக் கண்காணிக்கின்றன.",
    s3_t: "AI கணிப்புகள்",
    s3_d: "வானிலை அடிப்படையில் AI நீர்ப்பாசனத் தேவைகளைக் கணிக்கிறது.",
    s4_t: "தானியங்கி விழிப்பூட்டல்கள்",
    s4_d: "எப்போது நீர்ப்பாசனம் செய்ய வேண்டும் என்பதை விவசாயிகளுக்குத் தெரிவிக்கின்றன.",
    feat_tag: "முக்கிய அம்சங்கள்",
    feat_title: "சிறப்பாக நீர்ப்பாசனம் செய்ய உங்களுக்கு தேவையான அனைத்தும்",
    f1_t: "மண் கண்காணிப்பு",
    f1_d: "நிகழ்நேர மண் ஈரப்பதம் கண்காணிப்பு.",
    f2_t: "செயற்கைக்கோள் கண்காணிப்பு",
    f2_d: "NDVI பகுப்பாய்வு.",
    f3_t: "AI பரிந்துரைகள்",
    f3_d: "AI அட்டவணைகளை பரிந்துரைக்கிறது.",
    f4_t: "தண்ணீர் பயன்பாடு",
    f4_d: "தண்ணீர் பயன்பாட்டைக் கண்காணிக்கவும்.",
    f5_t: "ஸ்மார்ட் விழிப்பூட்டல்கள்",
    f5_d: "SMS விழிப்பூட்டல்கள்.",
    how_tag: "செயல்பாடு",
    how_title: "சென்சார்களிலிருந்து ஸ்மார்ட் முடிவுகள் வரை",
    h1_t: "தரவு சேகரிப்பு",
    h1_d: "IoT சென்சார்கள் தரவை சேகரிக்கின்றன.",
    h2_t: "பகுப்பாய்வு",
    h2_d: "செயற்கைக்கோள் படங்கள் பகுப்பாய்வு செய்கின்றன.",
    h3_t: "AI செயலாக்கம்",
    h3_d: "AI அட்டவணையை கணிக்கிறது.",
    h4_t: "பரிந்துரைகள்",
    h4_d: "விவசாயிகள் வழிகாட்டுதலைப் பெறுகிறார்கள்.",
    step: "படி",
    who_tag: "யாருக்காக",
    who_title: "விவசாயத்தில் உள்ள ஒவ்வொருவருக்கும்",
    w1_t: "சிறு விவசாயிகள்",
    w1_d: "மலிவு விலையில் கருவிகள்.",
    w2_t: "ஸ்டார்ட்அப்கள்",
    w2_d: "கிராமீன்லிங்க் தளத்தைப் பயன்படுத்தவும்.",
    w3_t: "ஆராய்ச்சியாளர்கள்",
    w3_d: "தரவை அணுகவும்.",
    w4_t: "அமைப்புகள்",
    w4_d: "நுண்ணறிவை பயன்படுத்தவும்.",
    precision_ag: "துல்லியமான விவசாயம்",
    view_demo: "டெமோவைப் பார்க்கவும்",
    data_driven: "தரவு சார்ந்த நுண்ணறிவு",
    h_s2_t: "வயல் தரவை மாற்றவும்",
    h_s2_h: "உண்மையான முடிவுகள்",
    h_s2_d: "நிகழ்நேரத்தில் உங்கள் சாதனத்திற்கு நேரடியாக ஆக்ஷன் தரக்கூடிய நுண்ணறிவுகளைப் பெறுங்கள்.",
    how_it_works_btn: "செயல்பாட்டைப் பார்க்கவும்",
    smart_hardware: "ஸ்மார்ட் ஹார்டுவேர்",
    h_s3_t: "இணைக்கப்பட்ட சென்சார்கள்",
    h_s3_h: "ஒவ்வொரு ஏக்கருக்கும்",
    h_s3_d: "எங்கள் IoT ஹார்டுவேர் உங்கள் வயல்களுக்கு ஏற்ப மாற்றியமைக்கிறது.",
    view_hardware: "ஹார்டுவேரைப் பார்க்கவும்",
    optimal: "உகந்தது",
    warm: "வெப்பம்",
    normal: "சாதாரணம்",
    stopped: "நிறுத்தப்பட்டது",
    moisture_trend: "ஈரப்பதம் போக்கு (24 மணி)",
    realtime_feed: "நிகழ்நேர ஊட்டம்",
    current_harvest: "தற்போதைய அறுவடை",
    growthStage_label: "வளர்ச்சி நிலை",
    vegetative: "வளர்ச்சி நிலை",
    modify_settings: "அமைப்புகளை மாற்றவும்",
    field_profile: "வயல் சுயவிவரம்",
    village_label: "கிராமம்",
    hectares: "ஹெக்டேர்",
    ai_recommendation: "AI பரிந்துரை",
    water_needed_in: "உங்கள் வயலுக்கு தண்ணீர் தேவைப்படும் நேரம்",
    hours: "மணிநேரம்",
    active: "சிஸ்டம் இயங்குகிறது",
    standby: "சிஸ்டம் காத்திருப்பில் உள்ளது",
    state: "நிலை",
    partlyCloudy: "ஓரளவு மேகமூட்டம்",
    humidity_label: "ஈரப்பதம்",
    wind: "காற்று",
    rain_chance: "மழை வாய்ப்பு",
    sunrise_label: "சூரிய உதயம்",
    current_conditions: "தற்போதைய நிலை",
    local_conditions: "உள்ளூர் நிலை மற்றும் 7 நாள் முன்னறிவிப்பு",
    days: "நாட்கள்",
    waterFlow: "நீர் ஓட்டம்",
    humidity: "ஈரப்பதம்",
    waterUsed: "பயன்படுத்தப்பட்ட நீர்",
    today: "இன்று",
    imp_tag: "தாக்கம்",
    imp_title: "ஏன் கிராமீன்லிங்க் முக்கியமானது",
    imp_desc: "தண்ணீரைச் சேமிக்கவும், விளைச்சலை உயர்த்தவும்.",
    i1_v: "30% வரை",
    i1_l: "சேமிப்பு",
    i1_d: "தண்ணீர் பயன்பாட்டைக் குறைக்கவும்.",
    i2_v: "ஆரோக்கியமான",
    i2_l: "பயிர்கள்",
    i2_d: "பயிர் அழுத்தத்தைத் தவிர்க்கவும்.",
    i3_v: "நிகழ்நேர",
    i3_l: "நுண்ணறிவு",
    i3_d: "தரவு சார்ந்த விவசாயம்.",
    cta_title: "இன்றே தொடங்குங்கள்",
    cta_desc: "இந்திய விவசாயிகளுடன் இணையுங்கள்.",
    cta_btn1: "கணக்கை உருவாக்கவும்",
    cta_btn2: "டாஷ்போர்டைப் பார்க்கவும்",
    createAccount: "கணக்கை உருவாக்கவும்",
    dp_tag: "முன்னோட்டம்",
    dp_title: "ஒரே இடத்திலிருந்து கண்காணிக்கவும்",
    dp_desc: "எல்லாவற்றையும் ஒரே இடத்தில் பார்க்கலாம்.",
    bar_title: "கிராமீன்லிங்க்",
    stressed: "பாதிக்கப்பட்டது",
    moderate: "சாதாரணமானது",
    healthy: "ஆரோக்கியமானது",
    irrigate_now: "இப்போது நீர்ப்பாசனம் செய்க",
    adequate: "போதுமானது",
    schedule_tomorrow: "நாளைக்கு",
    zone: "பகுதி",
    welcome_back: "மீண்டும் வருக",
    login_command_center: "உங்கள் கமாண்ட் சென்டருக்குள் நுழையுங்கள்",
    phone_or_email: "தொலைபேசி அல்லது மின்னஞ்சல்",
    password_label: "கடவுச்சொல்",
    forgot: "மறந்துவிட்டதா?",
    login_btn: "உள்நுழை",
    new_to_gl: "புதியவரா?",
    create_free_acc: "இலவச கணக்கை உருவாக்கவும்",
    farmer_enrollment: "விவசாயி பதிவு",
    join_network: "AI நீர்ப்பாசன நெட்வொர்க்கில் இணையுங்கள்",
    full_name: "முழு பெயர்",
    phone_number: "தொலைபேசி எண்",
    village_loc: "கிராமம்",
    account_verified_msg: "கணக்கு SMS மூலம் சரிபார்க்கப்படுகிறது.",
    complete_reg: "பதிவை முடிக்கவும்",
    already_have_acc: "ஏற்கனவே கணக்கு வைத்திருக்கிறீர்களா?",
    login_here: "இங்கே உள்நுழையவும்",
    secure_msg: "பாதுகாப்பானது",
    free_for_farmers: "இந்திய விவசாயிகளுக்கு இலவசம்",
    v4_msg: "பதிப்பு 4.0",
    footer_l1: "பற்றி",
    footer_l2: "ஆவணங்கள்",
    footer_l3: "தொடர்பு",
    footer_l4: "கிட்ஹப்",
    footer_l5: "கொள்கை",
    footer_rights: "© 2026 கிராமீன்லிங்க். அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.",
    home_subtitle: "உங்கள் வயலின் முக்கிய குறிகாட்டிகளை நிகழ்நேரத்தில் கண்காணித்தல்",
    soil_subtitle: "துல்லியமான பயிர் ஊட்டச்சத்திற்காக நிலத்தடி பகுப்பாய்வு",
    crops_subtitle: "பயிர் வளர்ச்சி நிலைகளை நிர்வகித்தல் மற்றும் கண்காணித்தல்",
    weather_subtitle: "உள்ளூர் நிலை மற்றும் 7 நாள் முன்னறிவிப்பு",
    optimize_btn: "மேம்படுத்தலைப் பயன்படுத்தவும்",
    connecting: "இணைக்கிறது...",
    demo_moisture: "ஆரோக்கியமானது (டெமோ)",
    analyzing: "பகுப்பாய்வு செய்கிறது",
    action_rec: "நடவடிக்கை பரிந்துரைக்கப்படுகிறது",
    no_action: "நடவடிக்கை தேவையில்லை",
    check_details: "விவரங்களைச் சரிபார்க்கவும்",
    sys_stable: "சிஸ்டம் சீராக உள்ளது",
    field_variance: "வயல் வேறுபாடு",
    moisture_trend_24h: "ஈரப்பதம் போக்கு (24 மணி)",
    realtime_feed: "நிகழ்நேர ஊட்டம்"
  },
  Malayalam: {
    home: "ഹോം",
    soilHealth: "മണ്ണ് ആരോഗ്യം",
    satellite: "സാറ്റലൈറ്റ്",
    weather: "കാലാവസ്ഥ",
    crops: "വിളകൾ",
    schedule: "ഷെഡ്യൂൾ",
    soilMoisture: "ഈർപ്പം",
    temperature: "താപനില",
    pumpStatus: "പമ്പ് നില",
    aiAdvice: "AI ഉപദേശം",
    irrigationControl: "ജലസേചന നിയന്ത്രണം",
    start: "തുടങ്ങുക",
    stop: "നിർത്തുക",
    weatherForecast: "കാലാവസ്ഥ പ്രവചനം",
    currentCrop: "നിലവിലെ വിള",
    growthStage: "വളർച്ചാ ഘട്ടം",
    fieldInfo: "വയൽ വിവരങ്ങൾ",
    village: "ഗ്രാമം",
    fieldArea: "വയൽ വിസ്തൃതി",
    editCropSettings: "മാറ്റങ്ങൾ വരുത്തുക",
    nextRecommended: "അടുത്ത ജലസേചനം",
    when: "എപ്പോൾ",
    duration: "സമയം",
    waterNeeded: "ആവശ്യമായ വെള്ളം",
    irrigationLogs: "ലോഗുകൾ",
    weeklyUsage: "പ്രതിവാര ഉപയോഗം",
    satelliteMonitoring: "സാറ്റലൈറ്റ് നിരീക്ഷണം",
    cropHealthNDVI: "വിള ആരോഗ്യം (NDVI)",
    aiInsights: "AI ഉൾക്കാഴ്ചകൾ",
    ndviInterpretation: "NDVI വിശദീകരണം",
    logout: "ലോഗൗട്ട്",
    call: "വിളിക്കുക",
    settings: "ക്രമീകരണം",
    callOptions: "കോൾ ഓപ്ഷനുകൾ",
    moistureUpdate: "ഈർപ്പവും ഷെഡ്യൂളും",
    pumpControl: "പമ്പ് നിയന്ത്രണം",
    cropHealth: "വിള ആരോഗ്യം",
    rainStatus: "മഴയുടെ വിവരം",
    solutions: "പരിഹാരങ്ങൾ",
    features: "ഫീച്ചറുകൾ",
    howItWorks: "പ്രവർത്തനം",
    dashboard: "ഡാഷ്ബോർഡ്",
    login: "ലോഗിൻ",
    getStarted: "തുടങ്ങുക",
    heroTitle: "AI-അധിഷ്ഠിത കൃത്യമായ ജലസേചനം",
    heroHighlight: "മികച്ച കൃഷിക്ക്",
    heroDesc: "IoT സെൻസറുകൾ, സാറ്റലൈറ്റ് ഡാറ്റ, AI ഉൾക്കാഴ്ചകൾ എന്നിവ ഉപയോഗിച്ച് വിളയുടെ ആരോഗ്യം നിരീക്ഷിക്കുകയും ജലസേചനം ഓട്ടോമേറ്റ് ചെയ്യുകയും ചെയ്യുക.",
    problem_tag: "പ്രശ്നം",
    problem_title: "കൃഷി ഇപ്പോഴും ഊഹക്കച്ചവടത്തെ ആശ്രയിക്കുന്നു",
    problem_desc: "പരമ്പരാഗത ജലസേചന രീതികൾ ജലനഷ്ടത്തിനും വിളവ് കുറയുന്നതിനും കാരണമാകുന്നു.",
    p1: "അമിത ജലസേചനം ജലം പാഴാക്കുന്നു",
    p2: "കുറഞ്ഞ ജലസേചനം വിളകളെ നശിപ്പിക്കുന്നു",
    p3: "കർഷകർക്ക് തത്സമയ വിവരങ്ങൾ ലഭ്യമല്ല",
    p4: "കാലാവസ്ഥാ സാഹചര്യങ്ങൾ വേഗത്തിൽ മാറുന്നു",
    sol_tag: "ഞങ്ങളുടെ പരിഹാരം",
    sol_title: "ഡാറ്റാധിഷ്ഠിത സ്മാർട്ട് ജലസേചനം",
    sol_desc: "കർഷകർക്ക് കൃത്യമായ, തത്സമയ ജലസേചന മാർഗ്ഗനിർദ്ദേശം നൽകുന്നതിന് ഗ്രാമിൻലിങ്ക് IoT, സാറ്റലൈറ്റ് ഇമേജറി, AI എന്നിവ സംയോജിപ്പിക്കുന്നു.",
    s1_t: "IoT മണ്ണ് നിരീക്ഷണം",
    s1_d: "IoT സെൻസറുകൾ മണ്ണിന്റെ ഈർപ്പം, താപനില, പോഷക നില എന്നിവ തത്സമയം നിരീക്ഷിക്കുന്നു.",
    s2_t: "സാറ്റലൈറ്റ് വിളാരോഗ്യം",
    s2_d: "സെന്റിനൽ-2-ൽ നിന്നുള്ള NDVI വിശകലനം ഉപയോഗിച്ച് സാറ്റലൈറ്റ് ഇമേജറി വിളാരോഗ്യം നിരീക്ഷിക്കുന്നു.",
    s3_t: "AI പ്രവചനങ്ങൾ",
    s3_d: "കാലാവസ്ഥ, മണ്ണ്, വിള വിവരങ്ങൾ എന്നിവ അടിസ്ഥാനമാക്കി AI ജലസേചന ആവശ്യകതകൾ പ്രവചിക്കുന്നു.",
    s4_t: "യാന്ത്രിക അലേർട്ടുകൾ",
    s4_d: "എപ്പോൾ, എത്രത്തോളം ജലസേചനം നടത്തണം എന്നതിനെക്കുറിച്ച് സ്മാർട്ട് അലേർട്ടുകൾ കർഷകർക്ക് മാർഗ്ഗനിർദ്ദേശം നൽകുന്നു.",
    feat_tag: "പ്രധാന സവിശേഷതകൾ",
    feat_title: "മികച്ച രീതിയിൽ ജലസേചനം നടത്താൻ നിങ്ങൾക്ക് ആവശ്യമുള്ളതെല്ലാം",
    f1_t: "മണ്ണ് നിരീക്ഷണം",
    f1_d: "IoT സെൻസറുകൾ ഉപയോഗിച്ചുള്ള തത്സമയ മണ്ണ് ഈർപ്പം നിരീക്ഷണം.",
    f2_t: "സാറ്റലൈറ്റ് നിരീക്ഷണം",
    f2_d: "സെന്റിനൽ-2 ഇമേജറിയിൽ നിന്നുള്ള NDVI വിശകലനം.",
    f3_t: "AI ശുപാർശകൾ",
    f3_d: "AI അനുയോജ്യമായ ജലസേചന ഷെഡ്യൂളുകൾ നിർദ്ദേശിക്കുന്നു.",
    f4_t: "ജല ഉപയോഗ വിശകലനം",
    f4_d: "നിങ്ങളുടെ ഫാമിൽ എത്രത്തോളം വെള്ളം ഉപയോഗിക്കുന്നു എന്ന് നിരീക്ഷിക്കുക.",
    f5_t: "സ്മാർട്ട് അലേർട്ടുകൾ",
    f5_d: "ജലസേചന ആവശ്യങ്ങൾക്കായി SMS അല്ലെങ്കിൽ ഡാഷ്ബോർഡ് അലേർട്ടുകൾ.",
    how_tag: "പ്രവർത്തനം",
    how_title: "സെൻസറുകളിൽ നിന്ന് സ്മാർട്ട് തീരുമാനങ്ങളിലേക്ക്",
    h1_t: "സെൻസറുകൾ വിവരങ്ങൾ ശേഖരിക്കുന്നു",
    h1_d: "IoT സെൻസറുകൾ നിങ്ങളുടെ വയലുകളിൽ നിന്ന് മണ്ണ് ഈർപ്പം, താപനില, പാരിസ്ഥിതിക വിവരങ്ങൾ എന്നിവ ശേഖരിക്കുന്നു.",
    h2_t: "സാറ്റലൈറ്റ് ഇമേജറി വിശകലനം",
    h2_d: "സെന്റിനൽ-2 സാറ്റലൈറ്റ് ഇമേജറി നിങ്ങളുടെ ഫാമിലുടനീളം NDVI വിള ആരോഗ്യ വിശകലനം നൽകുന്നു.",
    h3_t: "AI വിവരങ്ങൾ പ്രോസസ്സ് ചെയ്യുന്നു",
    h3_d: "മെഷീൻ ലേണിംഗ് മോഡലുകൾ അനുയോജ്യമായ ജലസേചന ഷെഡ്യൂളുകൾ പ്രവചിക്കാൻ എല്ലാ ഇൻപുട്ടുകളും വിശകലനം ചെയ്യുന്നു.",
    h4_t: "കർഷകർക്ക് ശുപാർശകൾ ലഭിക്കുന്നു",
    h4_d: "ഡാഷ്ബോർഡ് അല്ലെങ്കിൽ SMS അലേർട്ടുകൾ വഴി കൃത്യമായ ജലസേചന മാർഗ്ഗനിർദ്ദേശം സ്വീകരിക്കുക.",
    step: "ഘട്ടം",
    who_tag: "ആർക്കുവേണ്ടി",
    who_title: "കൃഷിയിലെ എല്ലാ പങ്കാളികൾക്കും വേണ്ടി നിർമ്മിച്ചത്",
    w1_t: "ചെറുകിട, ഇടത്തരം കർഷകർ",
    w1_d: "ഏത് അളവിലുള്ള ഫാമുകൾക്കും അനുയോജ്യമായ രീതിയിൽ രൂപകൽപ്പന ചെയ്ത കൃത്യമായ ജലസേചന ഉപകരണങ്ങൾ.",
    w2_t: "അഗ്രി-ടെക് സ്റ്റാർട്ടപ്പുകൾ",
    w2_d: "നൂതന കൃഷി പരിഹാരങ്ങൾ സൃഷ്ടിക്കുന്നതിന് ഗ്രാമിൻലിങ്കിന്റെ ഡാറ്റാ പ്ലാറ്റ്ഫോമിൽ നിർമ്മിക്കുക.",
    w3_t: "സ്മാർട്ട് ഫാമിംഗ് ഗവേഷകർ",
    w3_d: "കാർഷിക ഗവേഷണത്തിനായി തത്സമയ വിവരങ്ങളിലേക്കും സാറ്റലൈറ്റ് ഇമേജറിയിലേക്കും പ്രവേശനം നേടുക.",
    w4_t: "കാർഷിക സംഘടനകൾ",
    w4_d: "വലിയ കാർഷിക പ്രോഗ്രാമുകളിലുടനീളം ജലസേചന ഇന്റലിജൻസ് വിന്യസിക്കുക.",
    precision_ag: "കൃത്യമായ കൃഷി",
    view_demo: "ഡാഷ്ബോർഡ് ഡെമോ കാണുക",
    data_driven: "ഡാറ്റാധിഷ്ഠിത ഉൾക്കാഴ്ചകൾ",
    h_s2_t: "വയൽ വിവരങ്ങളെ മാറ്റുക",
    h_s2_h: "യഥാർത്ഥ ഫലങ്ങളിലേക്ക്",
    h_s2_d: "മണ്ണ് ആരോഗ്യം മുതൽ വിളവ് ഭൂപടങ്ങൾ വരെ, തത്സമയ ഉൾക്കാഴ്ചകൾ നിങ്ങളുടെ ഉപകരണത്തിൽ നേരിട്ട് നേടുക.",
    how_it_works_btn: "പ്രവർത്തനം കാണുക",
    smart_hardware: "സ്മാർട്ട് ഹാർഡ്‌വെയർ",
    h_s3_t: "ബന്ധിപ്പിച്ച സെൻസറുകൾ",
    h_s3_h: "ഓരോ ഏക്കറിനും",
    h_s3_d: "ഞങ്ങളുടെ IoT ഹാർഡ്‌വെയർ നിങ്ങളുടെ വയലുകൾക്ക് അനുയോജ്യമായ രീതിയിൽ മാറ്റങ്ങൾ വരുത്തുന്നു.",
    view_hardware: "ഹാർഡ്‌വെയർ കാണുക",
    optimal: "അനുയോജ്യം",
    warm: "ചൂട്",
    normal: "സാധാരണം",
    stopped: "നിർത്തി",
    moisture_trend: "ഈർപ്പത്തിന്റെ പ്രവണത (24 മണിക്കൂർ)",
    realtime_feed: "തത്സമയ ഫീഡ്",
    current_harvest: "നിലവിലെ വിളവെടുപ്പ്",
    growthStage_label: "വളർച്ചാ ഘട്ടം",
    vegetative: "വളർച്ചാ ഘട്ടം",
    modify_settings: "ക്രമീകരണങ്ങൾ മാറ്റുക",
    field_profile: "വയൽ പ്രൊഫൈൽ",
    village_label: "ഗ്രാമം",
    hectares: "ഹെക്ടർ",
    ai_recommendation: "AI ശുപാർശ",
    water_needed_in: "വയലിന് വെള്ളം ആവശ്യമായി വരുന്നത്",
    hours: "മണിക്കൂർ",
    active: "സിസ്റ്റം സജീവമാണ്",
    standby: "സിസ്റ്റം സ്റ്റാൻഡ്‌ബബയിലാണ്",
    state: "നില",
    partlyCloudy: "ഭാഗികമായി മേഘാവൃതം",
    humidity_label: "ആർദ്രത",
    wind: "കാറ്റ്",
    rain_chance: "മഴയ്ക്ക് സാധ്യത",
    sunrise_label: "സൂര്യോദയം",
    current_conditions: "നിലവിലെ സാഹചര്യം",
    local_conditions: "പ്രാദേശിക സാഹചര്യവും 7 ദിവസത്തെ പ്രവചനവും",
    days: "ദിവസങ്ങൾ",
    waterFlow: "ജലപ്രവാഹം",
    humidity: "ആർദ്രത",
    waterUsed: "ഉപയോഗിച്ച വെള്ളം",
    today: "ഇന്ന്",
    imp_tag: "സ്വാധീനം",
    imp_title: "ഗ്രാമിൻലിങ്ക് എന്തിന്",
    imp_desc: "ജല ഉപയോഗം കുറയ്ക്കാനും വിളവ് വർദ്ധിപ്പിക്കാനും സഹായിക്കുന്നു.",
    i1_v: "30% വരെ",
    i1_l: "ജല ലാഭം",
    i1_d: "കൃത്യമായ ജലസേചനം വഴി വെള്ളം ലാഭിക്കുക.",
    i2_v: "ആരോഗ്യമുള്ള",
    i2_l: "വിളകൾ",
    i2_d: "വിളകളുടെ ആരോഗ്യം മെച്ചപ്പെടുത്തുക.",
    i3_v: "തത്സമയ",
    i3_l: "ഉൾക്കാഴ്ചകൾ",
    i3_d: "ഡാറ്റാധിഷ്ഠിത കൃഷി.",
    cta_title: "ഇന്നുതന്നെ തുടങ്ങൂ",
    cta_desc: "ഇന്ത്യൻ കർഷകരോടൊപ്പം ചേരൂ.",
    cta_btn1: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    cta_btn2: "ഡാഷ്ബോർഡ് നോക്കുക",
    createAccount: "അക്കൗണ്ട് സൃഷ്ടിക്കുക",
    dp_tag: "ഡാഷ്ബോർഡ് പ്രിവ്യൂ",
    dp_title: "നിങ്ങളുടെ ഫാം നിരീക്ഷിക്കുക",
    dp_desc: "എല്ലാം ഒറ്റനോട്ടത്തിൽ.",
    bar_title: "ഗ്രാമിൻലിങ്ക്",
    stressed: "ക്ഷീണിച്ചത്",
    moderate: "സാധാരണം",
    healthy: "ആരോഗ്യമുള്ളത്",
    irrigate_now: "ഇപ്പോൾ നനയ്ക്കുക",
    adequate: "മതിയായ ഈർപ്പം",
    schedule_tomorrow: "നാളെ ഷെഡ്യൂൾ ചെയ്യുക",
    zone: "സോൺ",
    welcome_back: "വീണ്ടും സ്വാഗതം",
    login_command_center: "ലോഗിൻ ചെയ്യുക",
    phone_or_email: "ഫോൺ അല്ലെങ്കിൽ ഇമെയിൽ",
    password_label: "പാസ്‌വേഡ്",
    forgot: "മറന്നുപോയോ?",
    login_btn: "ലോഗിൻ",
    new_to_gl: "പുതിയതാണോ?",
    create_free_acc: "സൗജന്യ അക്കൗണ്ട് തുടങ്ങുക",
    farmer_enrollment: "കർഷക രജിസ്ട്രേഷൻ",
    join_network: "AI ശൃംഖലയിൽ ചേരുക",
    full_name: "പൂർണ്ണനാമം",
    phone_number: "ഫോൺ നമ്പർ",
    village_loc: "ഗ്രാമം",
    account_verified_msg: "SMS വഴി ശരിയാണെന്ന് ഉറപ്പുവരുത്തുന്നു.",
    complete_reg: "രജിസ്ട്രേഷൻ പൂർത്തിയാക്കുക",
    already_have_acc: "അക്കൗണ്ട് ഉണ്ടോ?",
    login_here: "ഇവിടെ ലോഗിൻ ചെയ്യുക",
    secure_msg: "സുരക്ഷിതം",
    free_for_farmers: "ഇന്ത്യൻ കർഷകർക്ക് സൗജന്യം",
    v4_msg: "വേർഷൻ 4.0",
    footer_l1: "ഞങ്ങളെക്കുറിച്ച്",
    footer_l2: "രേഖകൾ",
    footer_l3: "ബന്ധപ്പെടുക",
    footer_l4: "GitHub",
    footer_l5: "നയം",
    footer_rights: "© 2026 ഗ്രാമിൻലിങ്ക്. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.",
    home_subtitle: "നിങ്ങളുടെ വയലിന്റെ വിവരങ്ങൾ തത്സമയം നിരീക്ഷിക്കുക",
    soil_subtitle: "മണ്ണ് പോഷണത്തിനായി ഭൂഗർഭ വിശകലനം",
    crops_subtitle: "വിളകളുടെ വളർച്ച ഘട്ടങ്ങൾ നിയന്ത്രിക്കുക",
    weather_subtitle: "പ്രാദേശിക സാഹചര്യവും 7 ദിവസത്തെ പ്രവചനവും",
    optimize_btn: "അനുയോജ്യമാക്കുക",
    connecting: "ബന്ധിപ്പിക്കുന്നു...",
    demo_moisture: "ആരോഗ്യമുള്ളത് (ഡെമോ)",
    analyzing: "വിശകലനം ചെയ്യുന്നു",
    action_rec: "നടപടി ശുപാർശ ചെയ്യുന്നു",
    no_action: "നടപടി ആവശ്യമില്ല",
    check_details: "വിവരങ്ങൾ പരിശോധിക്കുക",
    sys_stable: "സിസ്റ്റം സുസ്ഥിരമാണ്",
    field_variance: "വയൽ വ്യതിയാനം",
    moisture_trend_24h: "ഈർപ്പത്തിന്റെ പ്രവണത (24 മണിക്കൂർ)",
    realtime_feed: "തത്സമയ ഫീഡ്"
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
    start: "ಪ್ರಾರಂಭಿಸಿ",
    stop: "ನಿಲ್ಲಿಸಿ",
    weatherForecast: "ಹವಾಮಾನ ಮುನ್ಸೂಚನೆ",
    currentCrop: "ಪ್ರಸ್ತುತ ಬೆಳೆ",
    growthStage: "ಬೆಳವಣಿಗೆಯ ಹಂತ",
    fieldInfo: "ಕ್ಷೇತ್ರ ಮಾಹಿತಿ",
    village: "ಗ್ರಾಮ",
    fieldArea: "ಕ್ಷೇತ್ರದ ವಿಸ್ತೀರ್ಣ",
    editCropSettings: "ಬೆಳೆ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ",
    nextRecommended: "ಮುಂದಿನ ಶಿಫಾರಸು ಮಾಡಿದ ನೀರಾವರಿ",
    when: "ಯಾವಾಗ",
    duration: "ಸಮಯದ ಅವಧಿ",
    waterNeeded: "ಅಗತ್ಯವಿರುವ ನೀರು",
    irrigationLogs: "ನೀರಾವರಿ ಲಾಗ್‌ಗಳು",
    weeklyUsage: "ವಾರದ ನೀರಿನ ಬಳಕೆ",
    satelliteMonitoring: "ಸ್ಯಾಟಲೈಟ್ ಮಾನಿಟರಿಂಗ್",
    cropHealthNDVI: "ಬೆಳೆ ಆರೋಗ್ಯ (NDVI)",
    aiInsights: "AI ಒಳನೋಟಗಳು",
    ndviInterpretation: "NDVI ವ್ಯಾಖ್ಯಾನ",
    logout: "ಲಾಗ್ ಔಟ್",
    call: "ಕರೆ ಮಾಡಿ",
    settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
    callOptions: "ಕರೆ ಆಯ್ಕೆಗಳು",
    moistureUpdate: "ತೇವಾಂಶ ಮತ್ತು ವೇಳಾಪಟ್ಟಿ",
    pumpControl: "ಪಂಪ್ ನಿಯಂತ್ರಣ",
    cropHealth: "ಬೆಳೆ ಆರೋಗ್ಯ",
    rainStatus: "ಮಳೆ ಸ್ಥಿತಿ",
    solutions: "ಪರಿಹಾರಗಳು",
    features: "ವೈಶಿಷ್ಟ್ಯಗಳು",
    howItWorks: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    login: "ಲಾಗಿನ್",
    getStarted: "ಪ್ರಾರಂಭಿಸಿ",
    heroTitle: "ಎಐ-ಚಾಲಿತ ನಿಖರ ನೀರಾವರಿ",
    heroHighlight: "ಸ್ಮಾರ್ಟ್ ಕೃಷಿಗಾಗಿ",
    heroDesc: "IoT ಸಂವೇದಕಗಳು, ಸ್ಯಾಟಲೈಟ್ ಡೇಟಾ ಮತ್ತು AI ಒಳನೋಟಗಳನ್ನು ಬಳಸಿಕೊಂಡು ಬೆಳೆ ಆರೋಗ್ಯವನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ ಮತ್ತು ನೀರಾವರಿಯನ್ನು ಸ್ವಯಂಚಾಲಿತಗೊಳಿಸಿ.",
    problem_tag: "ಸಮಸ್ಯೆ",
    problem_title: "ಕೃಷಿ ಇನ್ನೂ ಊಹೆಗಳ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿದೆ",
    problem_desc: "ಸಾಂಪ್ರದಾಯಿಕ ನೀರಾವರಿ ವಿಧಾನಗಳು ನೀರಿನ ವ್ಯರ್ಥ ಮತ್ತು ಬೆಳೆ ಇಳುವರಿ ಕಡಿಮೆಯಾಗಲು ಕಾರಣವಾಗುತ್ತವೆ.",
    p1: "ಅತಿಯಾದ ನೀರಾವರಿಯಿಂದ ನೀರು ವ್ಯರ್ಥವಾಗುತ್ತದೆ",
    p2: "ಕಡಿಮೆ ನೀರಾವರಿಯಿಂದ ಬೆಳೆಗಳಿಗೆ ಒತ್ತಡ ಉಂಟಾಗುತ್ತದೆ",
    p3: "ರೈತರಿಗೆ ನೈಜ-ಸಮಯದ ಡೇಟಾದ ಕೊರತೆಯಿದೆ",
    p4: "ಹವಾಮಾನ ಪರಿಸ್ಥಿತಿಗಳು ವೇಗವಾಗಿ ಬದಲಾಗುತ್ತವೆ",
    sol_tag: "ನಮ್ಮ ಪರಿಹಾರ",
    sol_title: "ಡೇಟಾದಿಂದ ಚಾಲಿತ ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ",
    sol_desc: "ರೈತರಿಗೆ ನಿಖರವಾದ, ನೈಜ-ಸಮಯದ ನೀರಾವರಿ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಗ್ರಾಮೀಣಲಿಂಕ್ IoT, ಸ್ಯಾಟಲೈಟ್ ಚಿತ್ರಣ ಮತ್ತು AI ಅನ್ನು ಸಂಯೋಜಿಸುತ್ತದೆ.",
    s1_t: "IoT ಮಣ್ಣಿನ ಮೇಲ್ವಿಚಾರಣೆ",
    s1_d: "IoT ಸಂವೇದಕಗಳು ಮಣ್ಣಿನ ತೇವಾಂಶ, ತಾಪಮಾನ ಮತ್ತು ಪೋಷಕಾಂಶಗಳ ಮಟ್ಟವನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡುತ್ತವೆ.",
    s2_t: "ಸ್ಯಾಟಲೈಟ್ ಬೆಳೆ ಆರೋಗ್ಯ",
    s2_d: "ಸ್ಯಾಟಲೈಟ್ ಚಿತ್ರಣವು ಸೆಂಟಿನೆಲ್-2 ರಿಂದ NDVI ವಿಶ್ಲೇಷಣೆಯನ್ನು ಬಳಸಿಕೊಂಡು ಬೆಳೆ ಆರೋಗ್ಯವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತದೆ.",
    s3_t: "AI ಮುನ್ಸೂಚನೆಗಳು",
    s3_d: "ಹವಾಮಾನ, ಮಣ್ಣು ಮತ್ತು ಬೆಳೆ ಡೇಟಾದ ಆಧಾರದ ಮೇಲೆ AI ನೀರಾವರಿ ಅಗತ್ಯಗಳನ್ನು ಮುನ್ಸೂಚಿಸುತ್ತದೆ.",
    s4_t: "ಸ್ವಯಂಚಾಲಿತ ಎಚ್ಚರಿಕೆಗಳು",
    s4_d: "ಯಾವಾಗ ಮತ್ತು ಎಷ್ಟು ನೀರಾವರಿ ಮಾಡಬೇಕೆಂದು ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳು ರೈತರಿಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತವೆ.",
    feat_tag: "ಪ್ರಮುಖ ವೈಶಿಷ್ಟ್ಯಗಳು",
    feat_title: "ನೀವು ಚುರುಕಾಗಿ ನೀರಾವರಿ ಮಾಡಲು ಅಗತ್ಯವಿರುವ ಪ್ರತಿಯೊಂದು ವಿಷಯ",
    f1_t: "ಮಣ್ಣಿನ ಮೇಲ್ವಿಚಾರಣೆ",
    f1_d: "IoT ಸಂವೇದಕಗಳನ್ನು ಬಳಸಿಕೊಂಡು ನೈಜ-ಸಮಯದ ಮಣ್ಣಿನ ತೇವಾಂಶ ಟ್ರ್ಯಾಕಿಂಗ್.",
    f2_t: "ಸ್ಯಾಟಲೈಟ್ ಮಾನಿಟರಿಂಗ್",
    f2_d: "ಸೆಂಟಿನೆಲ್-2 ಚಿತ್ರಣದಿಂದ NDVI ವಿಶ್ಲೇಷಣೆ.",
    f3_t: "AI ಶಿಫಾರಸುಗಳು",
    f3_d: "AI ಅತ್ಯುತ್ತಮ ನೀರುಣಿಸುವ ವೇಳಾಪಟ್ಟಿಗಳನ್ನು ಸೂಚಿಸುತ್ತದೆ.",
    f4_t: "ನೀರಿನ ವಿಶ್ಲೇಷಣೆ",
    f4_d: "ನಿಮ್ಮ ಫಾರ್ಮ್ ಎಷ್ಟು ನೀರನ್ನು ಬಳಸುತ್ತದೆ ಎಂಬುದನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ.",
    f5_t: "ಸ್ಮಾರ್ಟ್ ಎಚ್ಚರಿಕೆಗಳು",
    f5_d: "ನೀರಾವರಿ ಅಗತ್ಯಗಳಿಗಾಗಿ SMS ಅಥವಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಎಚ್ಚರಿಕೆಗಳು.",
    how_tag: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ",
    how_title: "ಸಂವೇದಕಗಳಿಂದ ಸ್ಮಾರ್ಟ್ ನಿರ್ಧಾರದವರೆಗೆ",
    h1_t: "ಸಂವೇದಕಗಳು ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸುತ್ತವೆ",
    h1_d: "IoT ಸಂವೇದಕಗಳು ನಿಮ್ಮ ಹೊಲಗಳಿಂದ ಮಣ್ಣಿನ ತೇವಾಂಶ, ತಾಪಮಾನ ಮತ್ತು ಪರಿಸರ ಡೇಟಾವನ್ನು ಸಂಗ್ರಹಿಸುತ್ತವೆ.",
    h2_t: "ಸ್ಯಾಟಲೈಟ್ ಚಿತ್ರಣ ವಿಶ್ಲೇಷಣೆ",
    h2_d: "ಸೆಂಟಿನೆಲ್-2 ಸ್ಯಾಟಲೈಟ್ ಚಿತ್ರಣವು ನಿಮ್ಮ ಫಾರ್ಮ್‌ನಾದ್ಯಂತ NDVI ಬೆಳೆ ಆರೋಗ್ಯ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಒದಗಿಸುತ್ತದೆ.",
    h3_t: "AI ಡೇಟಾವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸುತ್ತದೆ",
    h3_d: "ಅತ್ಯುತ್ತಮ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿಗಳನ್ನು ಮುನ್ಸೂಚಿಸಲು ಮೆಷಿನ್ ಲರ್ನಿಂಗ್ ಮಾದರಿಗಳು ಎಲ್ಲಾ ಇನ್‌ಪುಟ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತವೆ.",
    h4_t: "ರೈತರಿಗೆ ಶಿಫಾರಸುಗಳು ಸಿಗುತ್ತವೆ",
    h4_d: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಅಥವಾ SMS ಎಚ್ಚರಿಕೆಗಳ ಮೂಲಕ ಸ್ಪಷ್ಟವಾದ, ಕ್ರಿಯಾಶೀಲ ನೀರಾವರಿ ಮಾರ್ಗದರ್ಶನವನ್ನು ಪಡೆಯಿರಿ.",
    step: "ಹಂತ",
    who_tag: "ಇದು ಯಾರಿಗಾಗಿ",
    who_title: "ಕೃಷಿಯಲ್ಲಿನ ಪ್ರತಿಯೊಬ್ಬ ಪಾಲುದಾರರಿಗಾಗಿ ನಿರ್ಮಿಸಲಾಗಿದೆ",
    w1_t: "ಸಣ್ಣ ಮತ್ತು ಮಧ್ಯಮ ರೈತರು",
    w1_d: "ಯಾವುದೇ ಪ್ರಮಾಣದ ಫಾರ್ಮ್‌ಗಳಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾದ ಕೈಗೆಟುಕುವ ನಿಖರ ನೀರಾವರಿ ಉಪಕರಣಗಳು.",
    w2_t: "ಅಗ್ರಿ-ಟೆಕ್ ಸ್ಟಾರ್ಟ್‌ಅಪ್‌ಗಳು",
    w2_d: "ನವೀನ ಕೃಷಿ ಪರಿಹಾರಗಳನ್ನು ರಚಿಸಲು ಗ್ರಾಮೀಣಲಿಂಕ್‌ನ ಡೇಟಾ ಪ್ಲಾಟ್‌ಫಾರ್ಮ್‌ನಲ್ಲಿ ನಿರ್ಮಿಸಿ.",
    w3_t: "ಸ್ಮಾರ್ಟ್ ಫಾರ್ಮಿಂಗ್ ಸಂಶೋಧಕರು",
    w3_d: "ಕೃಷಿ ಸಂಶೋಧನೆಗಾಗಿ ನೈಜ-ಸಮಯದ ಕ್ಷೇತ್ರ ಡೇಟಾ ಮತ್ತು ಸ್ಯಾಟಲೈಟ್ ಚಿತ್ರಣವನ್ನು ಪ್ರವೇಶಿಸಿ.",
    w4_t: "ಕೃಷಿ ಸಂಸ್ಥೆಗಳು",
    w4_d: "ದೊಡ್ಡ ಕೃಷಿ ಕಾರ್ಯಕ್ರಮಗಳಲ್ಲಿ ಸ್ಕೇಲೆಬಲ್ ನೀರಾವರಿ ಬುದ್ಧಿವಂತಿಕೆಯನ್ನು ನಿಯೋಜಿಸಿ.",
    precision_ag: "ನಿಖರ ಕೃಷಿ",
    view_demo: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಡೆಮೊ ವೀಕ್ಷಿಸಿ",
    data_driven: "ಡೇಟಾ-ಚಾಲಿತ ಒಳನೋಟಗಳು",
    h_s2_t: "ಕ್ಷೇತ್ರ ಡೇಟಾವನ್ನು ಹೀಗೆ ಪರಿವರ್ತಿಸಿ",
    h_s2_h: "ನೈಜ-ಪ್ರಪಂಚದ ಫಲಿತಾಂಶಗಳು",
    h_s2_d: "ಮಣ್ಣಿನ ಆರೋಗ್ಯದಿಂದ ಇಳುವರಿ ನಕ್ಷೆಗಳವರೆಗೆ, ಕ್ರಿಯಾಶೀಲ ಒಳನೋಟಗಳನ್ನು ನೇರವಾಗಿ ನಿಮ್ಮ ಸಾಧನಕ್ಕೆ ನೈಜ ಸಮಯದಲ್ಲಿ ಪಡೆಯಿರಿ.",
    how_it_works_btn: "ಇದು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ನೋಡಿ",
    smart_hardware: "ಸ್ಮಾರ್ಟ್ ಹಾರ್ಡ್‌ವೇರ್",
    h_s3_t: "ಸಂಪರ್ಕಿತ ಸಂವೇದಕಗಳು",
    h_s3_h: "ಪ್ರತಿ ಎಕರೆಗೆ",
    h_s3_d: "ನಮ್ಮ IoT-ಸಕ್ರಿಯಗೊಳಿಸಿದ ಹಾರ್ಡ್‌ವೇರ್ ನಿಮ್ಮ ಹೊಲಗಳಿಗೆ ಹೊಂದಿಕೊಳ್ಳುತ್ತದೆ — ಪ್ರತಿ ಹಂಗಾಮಿನಲ್ಲೂ ಮೇಲ್ವಿಚಾರಣೆ, ಅಳತೆ ಮತ್ತು ಆಪ್ಟಿಮೈಸ್ ಮಾಡುತ್ತದೆ.",
    view_hardware: "ಹಾರ್ಡ್‌ವೇರ್ ವೀಕ್ಷಿಸಿ",
    optimal: "ಅತ್ಯುತ್ತಮ",
    warm: "ಬಿಸಿ",
    normal: "ಸಾಮಾನ್ಯ",
    stopped: "ನಿಲ್ಲಿಸಲಾಗಿದೆ",
    moisture_trend: "ತೇವಾಂಶ ಪ್ರವೃತ್ತಿ (24 ಗಂ)",
    realtime_feed: "ನೈಜ-ಸಮಯದ ಫೀಡ್",
    current_harvest: "ಪ್ರಸ್ತುತ ಸುಗ್ಗಿ",
    growthStage_label: "ಬೆಳವಣಿಗೆಯ ಹಂತ",
    vegetative: "ಸಸ್ಯಕ",
    modify_settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಬದಲಾಯಿಸಿ",
    field_profile: "ಕ್ಷೇತ್ರ ವಿವರ",
    village_label: "ಗ್ರಾಮ",
    hectares: "ಹೆಕ್ಟೇರ್",
    ai_recommendation: "AI ಶಿಫಾರಸು",
    water_needed_in: "ನಿಮ್ಮ ಕ್ಷೇತ್ರಕ್ಕೆ ನೀರಿನ ಅವಶ್ಯಕತೆಯಿದೆ",
    hours: "ಗಂಟೆಗಳು",
    active: "ಸಿಸ್ಟಮ್ ಸಕ್ರಿಯವಾಗಿದೆ",
    standby: "ಸಿಸ್ಟಮ್ ಸ್ಟ್ಯಾಂಡ್‌ಬೈನಲ್ಲಿದೆ",
    state: "ಸ್ಥಿತಿ",
    partlyCloudy: "ಭಾಗಶಃ ಮೋಡ",
    humidity_label: "ಆರ್ದ್ರತೆ",
    wind: "ಗಾಳಿ",
    rain_chance: "ಮಳೆಯ ಸಾಧ್ಯತೆ",
    sunrise_label: "ಸೂರ್ಯೋದಯ",
    current_conditions: "ಪ್ರಸ್ತುತ ಪರಿಸ್ಥಿತಿಗಳು",
    local_conditions: "ಸ್ಥಳೀಯ ಪರಿಸ್ಥಿತಿಗಳು ಮತ್ತು 7 ದಿನಗಳ ಮುನ್ಸೂಚನೆ",
    days: "ದಿನಗಳು",
    waterFlow: "ನೀರಿನ ಹರಿವು",
    humidity: "ಆರ್ದ್ರತೆ",
    waterUsed: "ಬಳಸಿದ ನೀರು",
    today: "ಇಂದು",
    imp_tag: "ಪರಿಣಾಮ",
    imp_title: "ಗ್ರಾಮೀಣಲಿಂಕ್ ಏಕೆ ಮುಖ್ಯ",
    imp_desc: "ನೀರಿನ ಬಳಕೆಯನ್ನು ಕಡಿಮೆ ಮಾಡಿ, ಬೆಳೆ ಉತ್ಪಾದಕತೆಯನ್ನು ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಡೇಟಾ-ಚಾಲಿತ ಕೃಷಿಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    i1_v: "30% ರವರೆಗೆ",
    i1_l: "ನೀರಿನ ಉಳಿತಾಯ",
    i1_d: "ನಿಖರವಾದ ನೀರಾವರಿ ವೇಳಾಪಟ್ಟಿಯೊಂದಿಗೆ ನೀರಿನ ಬಳಕೆಯನ್ನು ನಾಟಕೀಯವಾಗಿ ಕಡಿಮೆ ಮಾಡಿ.",
    i2_v: "ಆರೋಗ್ಯಕರ",
    i2_l: "ಬೆಳೆಗಳು",
    i2_d: "ಸರಿಯಾದ ಸಮಯದಲ್ಲಿ ಸರಿಯಾದ ಪ್ರಮಾಣದಲ್ಲಿ ನೀರಾವರಿ ಮಾಡುವ ಮೂಲಕ ಬೆಳೆ ಒತ್ತಡವನ್ನು ತಡೆಯಿರಿ.",
    i3_v: "ನೈಜ-ಸಮಯ",
    i3_l: "ಫಾರ್ಮ್ ಒಳನೋಟಗಳು",
    i3_d: "ಲೈವ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗಳು ಮತ್ತು ಕ್ರಿಯಾಶೀಲ ಅನಾಲಿಟಿಕ್ಸ್‌ನೊಂದಿಗೆ ಡೇಟಾ-ಚಾಲಿತ ಕೃಷಿಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ.",
    cta_title: "ಇಂದೇ ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ಪ್ರಾರಂಭಿಸಿ",
    cta_desc: "ನೀರು ಉಳಿಸುತ್ತಿರುವ ಮತ್ತು ವಿಶ್ವಾಸದಿಂದ ಕೃಷಿ ಮಾಡುತ್ತಿರುವ ಭಾರತದಾದ್ಯಂತದ ರೈತರನ್ನು ಸೇರಿಕೊಳ್ಳಿ.",
    cta_btn1: "ಖಾತೆ ರಚಿಸಿ",
    cta_btn2: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಪ್ರಯತ್ನಿಸಿ",
    createAccount: "ಖಾತೆ ರಚಿಸಿ",
    dp_tag: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮುನ್ನೋಟ",
    dp_title: "ಒಂದೇ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ನಿಮ್ಮ ಇಡೀ ಫಾರ್ಮ್ ಅನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ",
    dp_desc: "ಮಣ್ಣಿನ ತೇವಾಂಶ, ತಾಪಮಾನ, ನೀರಿನ ಹರಿವು, ಬೆಳೆ ಆರೋಗ್ಯ ನಕ್ಷೆಗಳು ಮತ್ತು ನೀರಾವರಿ ಶಿಫಾರಸುಗಳು — ಎಲ್ಲವೂ ಒಂದೇ ನೋಟದಲ್ಲಿ.",
    bar_title: "ಗ್ರಾಮೀಣಲಿಂಕ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    stressed: "ಒತ್ತಡಕ್ಕೊಳಗಾದ",
    moderate: "ಮಧ್ಯಮ",
    healthy: "ಆರೋಗ್ಯಕರ",
    irrigate_now: "ಈಗ ನೀರಾವರಿ ಮಾಡಿ",
    adequate: "ಪೂರಕ ತೇವಾಂಶ",
    schedule_tomorrow: "ನಾಳೆ ವೇಳಾಪಟ್ಟಿ ಮಾಡಿ",
    zone: "ವಲಯ",
    welcome_back: "ಮತ್ತೆ ಸುಸ್ವಾಗತ",
    login_command_center: "ನಿಮ್ಮ ಗ್ರಾಮೀಣಲಿಂಕ್ ಕಮಾಂಡ್ ಸೆಂಟರ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಿ",
    phone_or_email: "ಫೋನ್ ಅಥವಾ ಇಮೇಲ್",
    password_label: "ಪಾಸ್‌ವರ್ಡ್",
    forgot: "ಮರೆತಿದ್ದೀರಾ?",
    login_btn: "ಲಾಗಿನ್",
    new_to_gl: "ಗ್ರಾಮೀಣಲಿಂಕ್‌ಗೆ ಹೊಸಬರೇ?",
    create_free_acc: "ಉಚಿತ ಖಾತೆ ರಚಿಸಿ",
    farmer_enrollment: "ರೈತ ದಾಖಲಾತಿ",
    join_network: "ಗ್ರಾಮೀಣಲಿಂಕ್ AI ನಿಖರ ನೀರಾವರಿ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸೇರಿ",
    full_name: "ಪೂರ್ಣ ಹೆಸರು",
    phone_number: "ಫೋನ್ ಸಂಖ್ಯೆ",
    village_loc: "ಗ್ರಾಮದ ಸ್ಥಳ",
    account_verified_msg: "ಖಾತೆಯನ್ನು SMS ಮೂಲಕ ಪರಿಶೀಲಿಸಲಾಗುತ್ತದೆ. ನೋಂದಾಯಿಸುವ ಮೂಲಕ, ನೀವು ಸ್ವಯಂಚಾಲಿತ AI ಕರೆಗಳನ್ನು ಸ್ವೀಕರಿಸಲು ಒಪ್ಪುತ್ತೀರಿ.",
    complete_reg: "ನೋಂದಣಿ ಪೂರ್ಣಗೊಳಿಸಿ",
    already_have_acc: "ಈಗಾಗಲೇ ಖಾತೆ ಹೊಂದಿದ್ದೀರಾ?",
    login_here: "ಇಲ್ಲಿ ಲಾಗಿನ್ ಮಾಡಿ",
    secure_msg: "256-ಬಿಟ್ ಸುರಕ್ಷಿತ",
    free_for_farmers: "ಭಾರತೀಯ ರೈತರಿಗೆ ಉಚಿತ",
    v4_msg: "ನಿಖರ ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ v4.0",
    footer_l1: "ಯೋಜನೆಯ ಬಗ್ಗೆ",
    footer_l2: "ದಸ್ತಾವೇಜನ್ನು",
    footer_l3: "ಸಂಪರ್ಕ",
    footer_l4: "GitHub",
    footer_l5: "ಗೌಪ್ಯತಾ ನೀತಿ",
    footer_rights: "© 2026 ಗ್ರಾಮೀಣಲಿಂಕ್. ಎಲ್ಲ ಹಕ್ಕುಗಳನ್ನು ಕಾಯ್ದಿರಿಸಲಾಗಿದೆ.",
    home_subtitle: "ನೈಜ ಸಮಯದಲ್ಲಿ ನಿಮ್ಮ ಫಾರ್ಮ್‌ನ ಪ್ರಮುಖ ಸೂಚಕಗಳನ್ನು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಲಾಗುತ್ತಿದೆ",
    soil_subtitle: "ನಿಖರ ಬೆಳೆ ಪೋಷಣೆಗಾಗಿ ಭೂಗತ ಅನಾಲಿಟಿಕ್ಸ್",
    crops_subtitle: "ಬೆಳೆ ಅಭಿವೃದ್ಧಿ ಹಂತಗಳನ್ನು ನಿರ್ವಹಿಸಿ ಮತ್ತು ಮೇಲ್ವಿಚಾರಣೆ ಮಾಡಿ",
    weather_subtitle: "ಸ್ಥಳೀಯ ಪರಿಸ್ಥಿತಿ ಮತ್ತು 7 ದಿನಗಳ ಮುನ್ಸೂಚನೆ",
    optimize_btn: "ಆಪ್ಟಿಮೈಸೇಶನ್ ಅನ್ವಯಿಸಿ",
    connecting: "ಸಂಪರ್ಕಿಸಲಾಗುತ್ತಿದೆ...",
    demo_moisture: "ಆರೋಗ್ಯಕರ (ಡೆಮೊ)",
    analyzing: "ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ",
    action_rec: "ಕ್ರಮ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ",
    no_action: "ಯಾವುದೇ ಕ್ರಮವಿಲ್ಲ",
    check_details: "ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ",
    sys_stable: "ಸಿಸ್ಟಮ್ ಸ್ಥಿರವಾಗಿದೆ",
    field_variance: "ಕ್ಷೇತ್ರ ವ್ಯತ್ಯಾಸ",
    moisture_trend_24h: "ತೇವಾಂಶ ಪ್ರವೃತ್ತಿ (24 ಗಂ)",
    realtime_feed: "ನೈಜ-ಸಮಯದ ಫೀಡ್"
  },
  Marathi: {
    home: "होम",
    soilHealth: "जमिनीचे आरोग्य",
    satellite: "सॅटेलाईट",
    weather: "हवामान",
    crops: "पिके",
    schedule: "वेळापत्रक",
    soilMoisture: "जमिनीतील ओलावा",
    temperature: "तापमान",
    pumpStatus: "पंप स्थिती",
    aiAdvice: "AI सल्ला",
    irrigationControl: "सिंचन नियंत्रण",
    start: "सुरू करा",
    stop: "थांबवा",
    weatherForecast: "हवामान अंदाज",
    currentCrop: "सध्याचे पीक",
    growthStage: "वाढीचा टप्पा",
    fieldInfo: "शेताची माहिती",
    village: "गाव",
    fieldArea: "शेताचे क्षेत्रफळ",
    editCropSettings: "पीक सेटिंग्ज बदला",
    nextRecommended: "पुढील सुचवलेले सिंचन",
    when: "केव्हा",
    duration: "कालावधी",
    waterNeeded: "पाण्याची गरज",
    irrigationLogs: "सिंचन नोंद",
    weeklyUsage: "साप्ताहिक पाण्याचा वापर",
    satelliteMonitoring: "सॅटेराईट मॉनिटरिंग",
    cropHealthNDVI: "पीक आरोग्य (NDVI)",
    aiInsights: "AI अंतर्दृष्टी",
    ndviInterpretation: "NDVI स्पष्टीकरण",
    logout: "लॉगआउट",
    call: "कॉल करा",
    settings: "सेटिंग्ज",
    callOptions: "कॉल पर्याय",
    moistureUpdate: "ओलावा आणि वेळापत्रक",
    pumpControl: "पंप नियंत्रण",
    cropHealth: "पीक आरोग्य",
    rainStatus: "पाऊस स्थिती",
    solutions: "उपाय",
    features: "वैशिष्ट्ये",
    howItWorks: "हे कसे कार्य करते",
    dashboard: "डॅशबोर्ड",
    login: "लॉग इन",
    getStarted: "सुरू करा",
    heroTitle: "AI-आधारित अचूक सिंचन",
    heroHighlight: "स्मार्ट शेतीसाठी",
    heroDesc: "IoT सेन्सर, सॅटेलाईट डेटा आणि AI अंतर्दृष्टी वापरून पीक आरोग्याचे परीक्षण करा आणि सिंचन स्वयंचलित करा.",
    problem_tag: "समस्या",
    problem_title: "शेती अजूनही अंदाजावर अवलंबून आहे",
    problem_desc: "पारंपारिक सिंचन पद्धतींमुळे पाण्याची नासाडी होते आणि पीक उत्पादनात घट होते.",
    p1: "अति-सिंचनामुळे पाणी वाया जाते",
    p2: "कमी सिंचनामुळे पिकांवर ताण येतो",
    p3: "शेतकऱ्यांकडे रिअल-टाइम डेटाची कमतरता आहे",
    p4: "हवामान वेगाने बदलत आहे",
    sol_tag: "आमचा उपाय",
    sol_title: "डेटाद्वारे चालणारे स्मार्ट सिंचन",
    sol_desc: "एग्रीमेट शेतकऱ्यांना अचूक, रिअल-टाइम सिंचन मार्गदर्शन देण्यासाठी IoT, सॅटेलाईट इमेजिंग आणि AI एकत्र आणते.",
    s1_t: "IoT जमिनीचे निरीक्षण",
    s1_d: "IoT सेन्सर रिअल-टाइममध्ये जमिनीतील ओलावा, तापमान आणि पोषक तत्वांचे परीक्षण करतात.",
    s2_t: "सॅटेलाईट पीक आरोग्य",
    s2_d: "सॅटेलाईट इमेजिंग सेंटिनेल-२ वरून NDVI विश्लेषण वापरून पीक आरोग्याचा मागोवा घेते.",
    s3_t: "AI अंदाज",
    s3_d: "AI हवामान, जमीन आणि पीक डेटावर आधारित सिंचन गरजांचा अंदाज वर्तवते.",
    s4_t: "स्वयंचलित अलर्ट",
    s4_d: "स्मार्ट अलर्ट शेतकऱ्यांना केव्हा आणि किती सिंचन करायचे याचे मार्गदर्शन करतात.",
    feat_tag: "प्रमुख वैशिष्ट्ये",
    feat_title: "हुशारीने सिंचन करण्यासाठी तुम्हाला आवश्यक असलेले सर्व काही",
    f1_t: "जमिनीचे निरीक्षण",
    f1_d: "IoT सेन्सर वापरून रिअल-टाइम जमिनीतील ओलावा ट्रॅकिंग.",
    f2_t: "सॅटेलाईट मॉनिटरिंग",
    f2_d: "सेंटिनेल-२ इमेजिंगवरून NDVI विश्लेषण.",
    f3_t: "AI शिफारसी",
    f3_d: "AI चांगल्या सिंचन वेळापत्रकांचे सुचवते.",
    f4_t: "पाणी विश्लेषण",
    f4_d: "तुमचे शेत किती पाणी वापरते याचा मागोवा घ्या.",
    f5_t: "स्मार्ट अलर्ट",
    f5_d: "सिंचन गरजांसाठी SMS किंवा डॅशबोर्ड अलर्ट.",
    how_tag: "हे कसे कार्य करते",
    how_title: "सेन्सरपासून स्मार्ट निर्णयापर्यंत",
    h1_t: "सेन्सर डेटा गोळा करतात",
    h1_d: "IoT सेन्सर तुमच्या शेतातून जमिनीतील ओलावा, तापमान आणि पर्यावरणाचा डेटा गोळा करतात.",
    h2_t: "सॅटेलाईट इमेजिंग विश्लेषण",
    h2_d: "सेंटिनेल-२ सॅटेलाईट इमेजिंग तुमच्या संपूर्ण शेताचे NDVI पीक आरोग्य विश्लेषण प्रदान करते.",
    h3_t: "AI डेटावर प्रक्रिया करते",
    h3_d: "मशीन लर्निंग मॉडेल्स चांगल्या सिंचन वेळापत्रकांचा अंदाज लावण्यासाठी सर्व इनपुटचे विश्लेषण करतात.",
    h4_t: "शेतकऱ्यांना शिफारसी मिळतात",
    h4_d: "डॅशबोर्ड किंवा SMS अलर्टद्वारे स्पष्ट, कृतीयोग्य सिंचन मार्गदर्शन मिळवा.",
    step: "टप्पा",
    who_tag: "हे कोणासाठी आहे",
    who_title: "शेतीतील प्रत्येक भागधारकासाठी तयार केलेले",
    w1_t: "लहान आणि मध्यम शेतकरी",
    w1_d: "कोणत्याही आकाराच्या शेतांसाठी डिझाइन केलेले परवडणारे अचूक सिंचन साधने.",
    w2_t: "अॅग्री-टेक स्टार्टअप्स",
    w2_d: "नाविन्यपूर्ण शेती उपाय तयार करण्यासाठी एग्रीमेटच्या डेटा प्लॅटफॉर्मवर तयार करा.",
    w3_t: "स्मार्ट फार्मिंग संशोधक",
    w3_d: "कृषी संशोधनासाठी रिअल-टाइम फील्ड डेटा आणि सॅटेलाईट प्रतिमा मिळवा.",
    w4_t: "कृषी संस्था",
    w4_d: "मोठ्या कृषी कार्यक्रमांमध्ये स्केल करण्यायोग्य सिंचन बुद्धिमत्ता तैनात करा.",
    precision_ag: "अचूक शेती",
    view_demo: "डॅशबोर्ड डेमो पहा",
    data_driven: "डेटा-आधारित अंतर्दृष्टी",
    h_s2_t: "फील्ड डेटाचे रूपांतर करा",
    h_s2_h: "वास्तविक रिझल्टमध्ये",
    h_s2_d: "जमिनीच्या आरोग्यापासून उत्पादकता नकाशांपर्यंत, कृतीयोग्य अंतर्दृष्टी थेट तुमच्या डिव्हाइसवर मिळवा.",
    how_it_works_btn: "हे कसे कार्य करते ते पहा",
    smart_hardware: "स्मार्ट हार्डवेअर",
    h_s3_t: "कनेक्ट केलेले सेन्सर",
    h_s3_h: "प्रत्येक एकरासाठी",
    h_s3_d: "आमचे IoT-सक्षम हार्डवेअर तुमच्या शेतानुसार जुळवून घेते - परीक्षण, मोजमाप आणि अनुकूलन करते.",
    view_hardware: "हार्डवेअर पहा",
    optimal: "उत्तम",
    warm: "उबदार",
    normal: "सामान्य",
    stopped: "थांबले",
    moisture_trend: "ओलावा कल (२४ तास)",
    realtime_feed: "रिअल-टाइम फीड",
    current_harvest: "चालू हंगाम",
    growthStage_label: "वाढीचा टप्पा",
    vegetative: "वाढीचा टप्पा",
    modify_settings: "सेटिंग्ज बदला",
    field_profile: "शेताची माहिती",
    village_label: "गाव",
    hectares: "हेक्टर",
    ai_recommendation: "AI शिफारस",
    water_needed_in: "तुमच्या शेताला पाण्याची गरज लागेल",
    hours: "तास",
    active: "सिस्टम सक्रिय आहे",
    standby: "सिस्टम स्टँडबायवर आहे",
    state: "स्थिती",
    partlyCloudy: "अंशतः ढगाळ",
    humidity_label: "आद्रता",
    wind: "वारा",
    rain_chance: "पावसाची शक्यता",
    sunrise_label: "सूर्योदय",
    current_conditions: "सध्याची परिस्थिती",
    local_conditions: "स्थानिक परिस्थिती आणि ७ दिवसांचा अंदाज",
    days: "दिवस",
    waterFlow: "पाण्याचा प्रवाह",
    humidity: "आद्रता",
    waterUsed: "वापरलेले पाणी",
    today: "आज",
    imp_tag: "प्रभाव",
    imp_title: "एग्रीमेट का महत्त्वाचे आहे",
    imp_desc: "पाण्याचा वापर कमी करा, उत्पादकता वाढवा आणि डेटा-आधारित शेती सक्षम करा.",
    i1_v: "३०% पर्यंत",
    i1_l: "पाणी बचत",
    i1_d: "अचूक सिंचन वेळापत्रकासह पाण्याचा वापर लक्षणीयरीत्या कमी करा.",
    i2_v: "आरोग्यदायी",
    i2_l: "पिके",
    i2_d: "योग्य वेळी योग्य प्रमाणात सिंचन करून पिकांचा ताण टाळा.",
    i3_v: "रिअल-टाइम",
    i3_l: "शेतीची माहिती",
    i3_d: "लाईव्ह डॅशबोर्ड आणि कृतीयोग्य विश्लेषणासह डेटा-आधारित शेती सक्षम करा.",
    cta_title: "आजच स्मार्ट सिंचन सुरू करा",
    cta_desc: "पाणी वाचवणाऱ्या आणि विश्वासाने शेती करणाऱ्या भारतभरातील शेतकऱ्यांशी जोडा.",
    cta_btn1: "खाते तयार करा",
    cta_btn2: "डॅशबोर्ड पहा",
    createAccount: "खाते तयार करा",
    dp_tag: "डॅशबोर्ड प्रिव्ह्यू",
    dp_title: "एकाच डॅशबोर्डमध्ये तुमच्या संपूर्ण शेताचे परीक्षण करा",
    dp_desc: "जमिनीतील ओलावा, तापमान, पाण्याचा प्रवाह, पीक आरोग्य नकाशे आणि सिंचन शिफारसी - सर्व काही एका दृष्टीक्षेपात.",
    bar_title: "एग्रीमेट डॅशबोर्ड",
    stressed: "ताणलेले",
    moderate: "मध्यम",
    healthy: "निरोगी",
    irrigate_now: "आता सिंचन करा",
    adequate: "पुरेसा ओलावा",
    schedule_tomorrow: "उद्याचे नियोजन करा",
    zone: "झोन",
    welcome_back: "स्वागत आहे",
    login_command_center: "तुमच्या एग्रीमेट कमांड सेंटरमध्ये लॉग इन करा",
    phone_or_email: "फोन किंवा ईमेल",
    password_label: "पासवर्ड",
    forgot: "विसरलात?",
    login_btn: "लॉग इन",
    new_to_gl: "एग्रीमेटवर नवीन आहात?",
    create_free_acc: "विनामूल्य खाते तयार करा",
    farmer_enrollment: "शेतकरी नोंदणी",
    join_network: "एग्रीमेट AI नेटवर्कमध्ये सामील व्हा",
    full_name: "पूर्ण नाव",
    phone_number: "फोन नंबर",
    village_loc: "गाव",
    account_verified_msg: "खात्याची पडताळणी SMS द्वारे केली जाते.",
    complete_reg: "नावनोंदणी पूर्ण करा",
    already_have_acc: "आधीच खाते आहे का?",
    login_here: "येथे लॉग इन करा",
    secure_msg: "२५६-बिट सुरक्षित",
    free_for_farmers: "भारतीय शेतकऱ्यांसाठी मोफत",
    v4_msg: "सिस्टम आवृत्ती ४.०",
    footer_l1: "प्रकल्पाबद्दल",
    footer_l2: "दस्तऐवजीकरण",
    footer_l3: "संपर्क",
    footer_l4: "GitHub",
    footer_l5: "गोपनीयता धोरण",
    footer_rights: "© २०२६ एग्रीमेट. सर्व हक्क राखीव.",
    home_subtitle: "तुमच्या शेताच्या महत्त्वाच्या संकेतांचे निरीक्षण करा",
    soil_subtitle: "अचूक पीक पोषणासाठी जमिनीखालील विश्लेषण",
    crops_subtitle: "पीक वाढीच्या टप्प्यांचे व्यवस्थापन करा",
    weather_subtitle: "स्थानिक परिस्थिती आणि ७ दिवसांचा अंदाज",
    optimize_btn: "अनुकूलन लागू करा",
    connecting: "कनेक्ट होत आहे...",
    demo_moisture: "निरोगी (डेमो)",
    analyzing: "विश्लेषण करत आहे",
    action_rec: "कृती करण्याची शिफारस",
    no_action: "कोणतीही कृती नाही",
    check_details: "तपशील तपासा",
    sys_stable: "सिस्टम स्थिर आहे",
    field_variance: "क्षेत्र फरक",
    moisture_trend_24h: "ओलावा कल (२४ तास)",
    realtime_feed: "रिअल-टाइम फीड"
  },
  Bengali: {
    home: "হোম",
    soilHealth: "মাটির স্বাস্থ্য",
    satellite: "স্যাটেলাইট",
    weather: "আবহাওয়া",
    crops: "ফসল",
    schedule: "সময়সূচী",
    soilMoisture: "মাটির আর্দ্রতা",
    temperature: "তাপমাত্রা",
    pumpStatus: "পাম্পের অবস্থা",
    aiAdvice: "AI পরামর্শ",
    irrigationControl: "সেচ নিয়ন্ত্রণ",
    start: "শুরু করুন",
    stop: "বন্ধ করুন",
    weatherForecast: "আবহাওয়ার পূর্বাভাস",
    currentCrop: "বর্তমান ফসল",
    growthStage: "বৃদ্ধির ধাপ",
    fieldInfo: "জমির তথ্য",
    village: "গ্রাম",
    fieldArea: "জমির আয়তন",
    editCropSettings: "ফসল সেটিংস পরিবর্তন করুন",
    nextRecommended: "পরবর্তী প্রস্তাবিত সেচ",
    when: "কখন",
    duration: "সময়সীমা",
    waterNeeded: "প্রয়োজনীয় জল",
    irrigationLogs: "সেচের নথি",
    weeklyUsage: "সাপ্তাহিক জলের ব্যবহার",
    satelliteMonitoring: "স্যাটেলাইট পর্যবেক্ষণ",
    cropHealthNDVI: "ফসলের স্বাস্থ্য (NDVI)",
    aiInsights: "AI অন্তর্দৃষ্টি",
    ndviInterpretation: "NDVI ব্যাখ্যা",
    logout: "লগআউট",
    call: "কল করুন",
    settings: "সেটিংস",
    callOptions: "কল বিকল্প",
    moistureUpdate: "আর্দ্রতা ও সময়সূচী",
    pumpControl: "পাম্প নিয়ন্ত্রণ",
    cropHealth: "ফসলের স্বাস্থ্য",
    rainStatus: "বৃষ্টির অবস্থা",
    solutions: "সমাধান",
    features: "বৈশিষ্ট্য",
    howItWorks: "এটি কীভাবে কাজ করে",
    dashboard: "ড্যাশবোর্ড",
    login: "লগ ইন",
    getStarted: "শুরু করুন",
    heroTitle: "AI-চালিত সুনির্দিষ্ট সেচ",
    heroHighlight: "স্মার্ট চাষের জন্য",
    heroDesc: "IoT সেন্সর, স্যাটেলাইট ডেটা এবং AI অন্তর্দৃষ্টি ব্যবহার করে ফসলের স্বাস্থ্য পর্যবেক্ষণ করুন এবং সেচ স্বয়ংক্রিয় করুন।",
    problem_tag: "সমস্যা",
    problem_title: "চাষাবাদ এখনও অনুমানের ওপর নির্ভরশীল",
    problem_desc: "ঐতিহ্যবাহী সেচ পদ্ধতির ফলে জলের অপচয় হয় এবং ফসলের ফলন কমে যায়।",
    p1: "অতিরিক্ত সেচে জল অপচয় হয়",
    p2: "কম সেচে ফসলের ক্ষতি হয়",
    p3: "চাষীদের কাছে রিয়েল-টাইম ডেটা নেই",
    p4: "আবহাওয়া দ্রুত পরিবর্তিত হচ্ছে",
    sol_tag: "আমাদের সমাধান",
    sol_title: "ডেটা দ্বারা চালিত স্মার্ট সেচ",
    sol_desc: "গ্রামীণলিঙ্ক কৃষকদের সুনির্দিষ্ট, রিয়েল-টাইম সেচ নির্দেশনা দিতে IoT, স্যাটেলাইট ইমেজিং এবং AI কে একত্রিত করে।",
    s1_t: "IoT মাটি পর্যবেক্ষণ",
    s1_d: "IoT সেন্সর রিয়েল-টাইমে মাটির আর্দ্রতা, তাপমাত্রা এবং পুষ্টির মাত্রা পর্যবেক্ষণ করে।",
    s2_t: "স্যাটেলাইট ফসল স্বাস্থ্য",
    s2_d: "সেন্টিনেল-২ থেকে NDVI বিশ্লেষণ ব্যবহার করে স্যাটেলাইট ইমেজিং ফসলের স্বাস্থ্য ট্র্যাক করে।",
    s3_t: "AI পূর্বাভাস",
    s3_d: "AI আবহাওয়া, মাটি এবং ফসলের ডেটার ওপর ভিত্তি করে সেচের প্রয়োজনীয়তা পূর্বাভাস দেয়।",
    s4_t: "স্বয়ংক্রিয় সতর্কতা",
    s4_d: "স্মার্ট অ্যালার্ট কৃষকদের কখন এবং কতটা সেচ দিতে হবে তা নির্দেশ করে।",
    feat_tag: "মূল বৈশিষ্ট্য",
    feat_title: "স্মার্টভাবে সেচ দেওয়ার জন্য আপনার যা কিছু প্রয়োজন",
    f1_t: "মাটি পর্যবেক্ষণ",
    f1_d: "IoT সেন্সর ব্যবহার করে রিয়েল-টাইম মাটির আর্দ্রতা ট্র্যাকিং।",
    f2_t: "স্যাটেলাইট পর্যবেক্ষণ",
    f2_d: "সেন্টিনেল-২ ইমেজিং থেকে NDVI বিশ্লেষণ।",
    f3_t: "AI সুপারিশসমূহ",
    f3_d: "AI সেরা জল দেওয়ার সময়সূচী নির্দেশ করে।",
    f4_t: "জল বিশ্লেষণ",
    f4_d: "আপনার খামার কতটুকু জল ব্যবহার করে তা ট্র্যাক করুন।",
    f5_t: "স্মার্ট সতর্কতা",
    f5_d: "সেচের প্রয়োজনীয়তার জন্য SMS বা ড্যাশবোর্ড অ্যালার্ট।",
    how_tag: "এটি কীভাবে কাজ করে",
    how_title: "সেন্সর থেকে স্মার্ট সিদ্ধান্ত পর্যন্ত",
    h1_t: "সেন্সর ডেটা সংগ্রহ করে",
    h1_d: "IoT সেন্সর আপনার জমি থেকে মাটির আর্দ্রতা, তাপমাত্রা এবং পরিবেশের ডেটা সংগ্রহ করে।",
    h2_t: "স্যাটেলাইট ইমেজিং বিশ্লেষণ",
    h2_d: "সেন্টিনেল-২ স্যাটেলাইট ইমেজিং আপনার পুরো খামারের NDVI ফসল স্বাস্থ্য বিশ্লেষণ প্রদান করে।",
    h3_t: "AI ডেটা প্রসেস করে",
    h3_d: "মেশিন লার্নিং মডেলগুলি সেরা সেচ সময়সূচী পূর্বাভাস দিতে সমস্ত ইনপুট বিশ্লেষণ করে।",
    h4_t: "চাষীরা সুপারিশ পান",
    h4_d: "ড্যাশবোর্ড বা SMS অ্যালার্টের মাধ্যমে স্পষ্ট, কার্যকর সেচ নির্দেশনা পান।",
    step: "ধাপ",
    who_tag: "এটি কাদের জন্য",
    who_title: "কৃষি খাতের প্রতিটি অংশীদারের জন্য তৈরি",
    w1_t: "ক্ষুদ্র ও মাঝারি চাষী",
    w1_d: "যেকোনো আকারের খামারের জন্য ডিজাইন করা সাশ্রয়ী মূল্যের সুনির্দিষ্ট সেচ সরঞ্জাম।",
    w2_t: "অ্যাগ্ৰি-টেক স্টার্টআপ",
    w2_d: "উদ্ভাবনী কৃষি সমাধান তৈরি করতে গ্রামীণলিঙ্ক-এর ডেটা প্ল্যাটফর্ম ব্যবহার করুন।",
    w3_t: "স্মার্ট ফার্মিং গবেষক",
    w3_d: "কৃষি গবেষণার জন্য রিয়েল-টাইম ফিল্ড ডেটা এবং স্যাটেলাইট চিত্র পান।",
    w4_t: "কৃষি সংস্থা",
    w4_d: "বড় কৃষি কর্মসূচিতে স্কেলেবল সেচ বুদ্ধিমত্তা প্রয়োগ করুন।",
    precision_ag: "সুনির্দিষ্ট কৃষি",
    view_demo: "ড্যাশবোর্ড ডেমো দেখুন",
    data_driven: "ডেটা-চালিত অন্তর্দৃষ্টি",
    h_s2_t: "জমির ডেটাকে রূপান্তর করুন",
    h_s2_h: "প্রকৃত ফলাফলে",
    h_s2_d: "মাটির স্বাস্থ্য থেকে ফলন মানচিত্র পর্যন্ত, কার্যকর অন্তর্দৃষ্টি সরাসরি আপনার ডিভাইসে পান।",
    how_it_works_btn: "এটি কীভাবে কাজ করে দেখুন",
    smart_hardware: "স্মার্ট হার্ডওয়্যার",
    h_s3_t: "সংযুক্ত সেন্সর",
    h_s3_h: "প্রতি একরের জন্য",
    h_s3_d: "আমাদের IoT-চালিত হার্ডওয়্যার আপনার জমির সাথে খাপ খায় — পর্যবেক্ষণ, পরিমাপ এবং অপ্টিমাইজ করে।",
    view_hardware: "হার্ডওয়্যার দেখুন",
    optimal: "সেরা",
    warm: "উষ্ণ",
    normal: "স্বাভাবিক",
    stopped: "বন্ধ",
    moisture_trend: "আর্দ্রতার প্রবণতা (২৪ ঘণ্টা)",
    realtime_feed: "রিয়েল-টাইম ফিড",
    current_harvest: "বর্তমান ফসল",
    growthStage_label: "বৃদ্ধির ধাপ",
    vegetative: "বৃদ্ধির ধাপ",
    modify_settings: "সেটিংস পরিবর্তন করুন",
    field_profile: "জমির প্রোফাইল",
    village_label: "গ্রাম",
    hectares: "হেক্টর",
    ai_recommendation: "AI সুপারিশ",
    water_needed_in: "আপনার জমিতে জলের প্রয়োজন হবে",
    hours: "ঘণ্টা",
    active: "সিস্টেম সক্রিয়",
    standby: "সিস্টেম স্ট্যান্ডবাই",
    state: "অবস্থা",
    partlyCloudy: "আংশিক মেঘলা",
    humidity_label: "আর্দ্রতা",
    wind: "বাতাস",
    rain_chance: "বৃষ্টির সম্ভাবনা",
    sunrise_label: "সূর্যোদয়",
    current_conditions: "বর্তমান পরিস্থিতি",
    local_conditions: "স্থানীয় পরিস্থিতি এবং ৭ দিনের পূর্বাভাস",
    days: "দিন",
    waterFlow: "জলের প্রবাহ",
    humidity: "আর্দ্রতা",
    waterUsed: "ব্যবহৃত জল",
    today: "আজ",
    imp_tag: "প্রভাব",
    imp_title: "কেন গ্রামীণলিঙ্ক গুরুত্বপূর্ণ",
    imp_desc: "জলের ব্যবহার কমান, উৎপাদনশীলতা বাড়ান এবং ডেটা-চালিত চাষাবাদ সক্ষম করুন।",
    i1_v: "৩০% পর্যন্ত",
    i1_l: "জল সাশ্রয়",
    i1_d: "সুনির্দিষ্ট সেচ সময়সূচীর সাহায্যে জলের ব্যবহার উল্লেখযোগ্যভাবে কমান।",
    i2_v: "স্বাস্থ্যকর",
    i2_l: "ফসল",
    i2_d: "সঠিক সময়ে সঠিক পরিমাণে সেচ দিয়ে ফসলের ক্ষতি রোধ করুন।",
    i3_v: "রিয়েল-টাইম",
    i3_l: "খামারের অন্তর্দৃষ্টি",
    i3_d: "লাইভ ড্যাশবোর্ড এবং কার্যকর বিশ্লেষণের মাধ্যমে ডেটা-চালিত চাষাবাদ সক্ষম করুন।",
    cta_title: "আজই স্মার্ট সেচ শুরু করুন",
    cta_desc: "জল সাশ্রয়ী এবং আত্মবিশ্বাসী চাষীদের সাথে যোগ দিন।",
    cta_btn1: "অ্যাকাউন্ট তৈরি করুন",
    cta_btn2: "ড্যাশবোর্ড দেখুন",
    createAccount: "অ্যাকাউন্ট তৈরি করুন",
    dp_tag: "ড্যাশবোর্ড প্রিভিউ",
    dp_title: "একটি ড্যাশবোর্ডে আপনার পুরো খামার পর্যবেক্ষণ করুন",
    dp_desc: "মাটির আর্দ্রতা, তাপমাত্রা, জল প্রবাহ, ফসল স্বাস্থ্য মানচিত্র এবং সেচ সুপারিশ - সব এক নজরে।",
    bar_title: "গ্রামীণলিঙ্ক ড্যাশবোর্ড",
    stressed: "ক্ষতিগ্রস্ত",
    moderate: "মাঝারি",
    healthy: "সুস্থ",
    irrigate_now: "এখনই সেচ দিন",
    adequate: "পর্যাপ্ত আর্দ্রতা",
    schedule_tomorrow: "আগামীকালের পরিকল্পনা করুন",
    zone: "জোন",
    welcome_back: "স্বাগতম",
    login_command_center: "আপনার গ্রামীণলিঙ্ক অ্যাকাউন্টে লগ ইন করুন",
    phone_or_email: "ফোন বা ইমেল",
    password_label: "পাসওয়ার্ড",
    forgot: "ভুলে গেছেন?",
    login_btn: "লগ ইন",
    new_to_gl: "গ্রামীণলিঙ্কে নতুন?",
    create_free_acc: "বিনামূল্যে অ্যাকাউন্ট তৈরি করুন",
    farmer_enrollment: "চাষী নিবন্ধন",
    join_network: "গ্রামীণলিঙ্ক AI নেটওয়ার্কে যোগ দিন",
    full_name: "পুরো নাম",
    phone_number: "ফোন নম্বর",
    village_loc: "গ্রাম",
    account_verified_msg: "অ্যাকাউন্ট SMS এর মাধ্যমে যাচাই করা হয়।",
    complete_reg: "নিবন্ধন সম্পন্ন করুন",
    already_have_acc: "ইতিমধ্যেই অ্যাকাউন্ট আছে কি?",
    login_here: "এখানে লগ ইন করুন",
    secure_msg: "২৫৬-বিট সুরক্ষিত",
    free_for_farmers: "ভারতীয় চাষীদের জন্য বিনামূল্যে",
    v4_msg: "ভার্সন ৪.০",
    footer_l1: "প্রকল্প সম্পর্কে",
    footer_l2: "নথি",
    footer_l3: "যোগাযোগ",
    footer_l4: "GitHub",
    footer_l5: "গোপনীয়তা নীতি",
    footer_rights: "© ২০২৬ গ্রামীণলিঙ্ক। সমস্ত অধিকার সংরক্ষিত।",
    home_subtitle: "রিয়েল-টাইমে আপনার খামারের প্রধান লক্ষণগুলি পর্যবেক্ষণ করুন",
    soil_subtitle: "সুনির্দিষ্ট ফসল পুষ্টির জন্য মাটির নিচের বিশ্লেষণ",
    crops_subtitle: "ফসলের বৃদ্ধির ধাপগুলি পরিচালনা ও পর্যবেক্ষণ করুন",
    weather_subtitle: "স্থানীয় পরিস্থিতি এবং ৭ দিনের পূর্বাভাস",
    optimize_btn: "অপ্টিমাইজেশন প্রয়োগ করুন",
    connecting: "সংযোগ করা হচ্ছে...",
    demo_moisture: "সুস্থ (ডেমো)",
    analyzing: "বিশ্লেষণ করা হচ্ছে",
    action_rec: "পদক্ষেপ সুপারিশ করা হয়েছে",
    no_action: "কোনো পদক্ষেপ নেই",
    check_details: "বিস্তারিত দেখুন",
    sys_stable: "সিস্টেম স্থিতিশীল",
    field_variance: "জমির তারতম্য",
    moisture_trend_24h: "আর্দ্রতার প্রবণতা (২৪ ঘণ্টা)",
    realtime_feed: "রিয়েল-টাইম ফিড"
  },
  Gujarati: {
    home: "હોમ",
    soilHealth: "જમીનનું સ્વાસ્થ્ય",
    satellite: "સેટેલાઇટ",
    weather: "હવામાન",
    crops: "પાક",
    schedule: "સમયપત્રક",
    soilMoisture: "જમીનનો ભેજ",
    temperature: "તાપમાન",
    pumpStatus: "પંપની સ્થિતિ",
    aiAdvice: "AI સલાહ",
    irrigationControl: "સિંચાઈ નિયંત્રણ",
    start: "શરૂ કરો",
    stop: "બંધ કરો",
    weatherForecast: "હવામાનની આગાહી",
    currentCrop: "વર્તમાન પાક",
    growthStage: "વિકાસનો તબક્કો",
    fieldInfo: "ખેતરની માહિતી",
    village: "ગામ",
    fieldArea: "ખેતરનો વિસ્તાર",
    editCropSettings: "પાક સેટિંગ્સ બદલો",
    nextRecommended: "આગામી સૂચિત સિંચાઈ",
    when: "ક્યારે",
    duration: "સમયગાળો",
    waterNeeded: "જરૂરી પાણી",
    irrigationLogs: "સિંચાઈ નોંધ",
    weeklyUsage: "સાપ્તાહિક પાણીનો વપરાશ",
    satelliteMonitoring: "સેટેલાઇટ મોનિટરિંગ",
    cropHealthNDVI: "પાક સ્વાસ્થ્ય (NDVI)",
    aiInsights: "AI આંતરદૃષ્ટિ",
    ndviInterpretation: "NDVI સમજૂતી",
    logout: "લોગઆઉટ",
    call: "કોલ કરો",
    settings: "સેટિંગ્સ",
    callOptions: "કોલ વિકલ્પો",
    moistureUpdate: "ભેજ અને સમયપત્રક",
    pumpControl: "પંપ નિયંત્રણ",
    cropHealth: "પાક સ્વાસ્થ્ય",
    rainStatus: "વરસાદની સ્થિતિ",
    solutions: "ઉકેલો",
    features: "વિશેષતાઓ",
    howItWorks: "તે કેવી રીતે કામ કરે છે",
    dashboard: "ડેશબોર્ડ",
    login: "લોગ ઇન",
    getStarted: "શરૂ કરો",
    heroTitle: "AI-સંચાલિત સચોટ સિંચાઈ",
    heroHighlight: "સ્માર્ટ ખેતી માટે",
    heroDesc: "IoT સેન્સર, સેટેલાઇટ ડેટા અને AI આંતરદૃષ્ટિનો ઉપયોગ કરીને પાકના સ્વાસ્થ્યનું નિરીક્ષણ કરો અને સિંચાઈને સ્વચાલિત કરો.",
    problem_tag: "સમસ્યા",
    problem_title: "ખેતી હજુ પણ અંદાજ પર આધારિત છે",
    problem_desc: "પરંપરાગત સિંચાઈ પદ્ધતિઓ પાણીનો બગાડ કરે છે અને પાકની ઉપજ ઘટાડે છે.",
    p1: "વધારે સિંચાઈ પાણીનો બગાડ કરે છે",
    p2: "ઓછી સિંચાઈ પાકને નુકસાન કરે છે",
    p3: "ખેડૂતો પાસે રીયલ-ટાઇમ ડેટા નથી",
    p4: "હવામાન ઝડપથી બદલાય છે",
    sol_tag: "અમારો ઉકેલ",
    sol_title: "ડેટા સંચાલિત સ્માર્ટ સિંચાઈ",
    sol_desc: "ગ્રામીનલિંક ખેડૂતોને સચોટ, રીયલ-ટાઇમ સિંચાઈ માર્ગદર્શન આપવા માટે IoT, સેટેલાઇટ ઇમેજિંગ અને AI ને જોડે છે.",
    s1_t: "IoT જમીન નિરીક્ષણ",
    s1_d: "IoT સેન્સર રીયલ-ટાઇમમાં જમીનનો ભેજ, તાપમાન અને પોષક તત્વોનું નિરીક્ષણ કરે છે.",
    s2_t: "સેટેલાઇટ પાક સ્વાસ્થ્ય",
    s2_d: "સેટેલાઇટ ઇમેજિંગ સેન્ટિનેલ-2 પરથી NDVI વિશ્લેષણનો ઉપયોગ કરીને પાકના સ્વાસ્થ્યને ટ્રેક કરે છે.",
    s3_t: "AI અનુમાન",
    s3_d: "AI હવામાન, જમીન અને પાકના ડેટાના આધારે સિંચાઈની જરૂરિયાતોનું અનુમાન કરે છે.",
    s4_t: "સ્વચાલિત એલર્ટ",
    s4_d: "સ્માર્ટ એલર્ટ ખેડૂતોને ક્યારે અને કેટલું સિંચાઈ કરવું તે અંગે માર્ગદર્શન આપે છે.",
    feat_tag: "મુખ્ય વિશેષતાઓ",
    feat_title: "સ્માર્ટ રીતે સિંચાઈ કરવા માટે તમારે જરૂરી બધું જ",
    f1_t: "જમીન નિરીક્ષણ",
    f1_d: "IoT સેન્સરનો ઉપયોગ કરીને રીયલ-ટાઇમ જમીન ભેજ ટ્રેકિંગ.",
    f2_t: "સેટેલાઇટ મોનિટરિંગ",
    f2_d: "સેન્ટિનેલ-2 ઇમેજરીમાંથી NDVI વિશ્લેષણ.",
    f3_t: "AI ભલામણો",
    f3_d: "AI શ્રેષ્ઠ પાણી પીવડાવવાનું સમયપત્રક સૂચવે છે.",
    f4_t: "પાણીનું વિશ્લેષણ",
    f4_d: "તમારું ખેતર કેટલું પાણી વાપરે છે તે ટ્રેક કરો.",
    f5_t: "સ્માર્ટ એલર્ટ",
    f5_d: "સિંચાઈની જરૂરિયાતો માટે SMS અથવા ડેશબોર્ડ એલર્ટ.",
    how_tag: "તે કેવી રીતે કામ કરે છે",
    how_title: "સેન્સરથી સ્માર્ટ નિર્ણય સુધી",
    h1_t: "સેન્સર ડેટા એકત્રિત કરે છે",
    h1_d: "IoT સેન્સર તમારા ખેતરોમાંથી જમીનનો ભેજ, તાપમાન અને પર્યાવરણનો ડેટા એકત્રિત કરે છે.",
    h2_t: "સેટેલાઇટ ઇમેજિંગ વિશ્લેષણ",
    h2_d: "સેન્ટિનેલ-2 સેટેલાઇટ ઇમેજરી તમારા ખેતરનું NDVI પાક સ્વાસ્થ્ય વિશ્લેષણ પૂરું પાડે છે.",
    h3_t: "AI ડેટા પર પ્રક્રિયા કરે છે",
    h3_d: "શ્રેષ્ઠ સિંચાઈ સમયપત્રકનું અનુમાન કરવા માટે મશીન લર્નિંગ મોડલ્સ તમામ ઇનપુટ્સનું વિશ્લેષણ કરે છે.",
    h4_t: "ખેડૂતોને ભલામણો મળે છે",
    h4_d: "ડેશબોર્ડ કે SMS એલર્ટ દ્વારા સ્પષ્ટ, અમલી બનાવી શકાય તેવું માર્ગદર્શન મેળવો.",
    step: "પગલું",
    who_tag: "તે કોના માટે છે",
    who_title: "ખેતીના દરેક હિતધારક માટે બનાવેલ",
    w1_t: "નાના અને મધ્યમ ખેડૂતો",
    w1_d: "કોઈપણ કદના ખેતરો માટે રચાયેલ સસ્તું સચોટ સિંચાઈ સાધનો.",
    w2_t: "એગ્રી-ટેક સ્ટાર્ટઅપ્સ",
    w2_d: "નવીન ખેતી ઉકેલો બનાવવા માટે ગ્રામીનલિંકના ડેટા પ્લેટફોર્મ પર કામ કરો.",
    w3_t: "સ્માર્ટ ફાર્મિંગ સંશોધકો",
    w3_d: "ખેતી સંશોધન માટે રીયલ-ટાઇમ ફીલ્ડ ડેટા અને સેટેલાઇટ છબીઓ મેળવો.",
    w4_t: "ખેતી સંસ્થાઓ",
    w4_d: "મોટા ખેતી કાર્યક્રમમાં સ્કેલેબલ સિંચાઈ ઇન્ટેલિજન્સ લાગુ કરો.",
    precision_ag: "સચોટ ખેતી",
    view_demo: "ડેશબોર્ડ ડેમો જુઓ",
    data_driven: "ડેટા સંચાલિત આંતરદૃષ્ટિ",
    h_s2_t: "ફીલ્ડ ડેટાને બદલો",
    h_s2_h: "વાસ્તવિક પરિણામોમાં",
    h_s2_d: "જમીનના સ્વાસ્થ્યથી લઈને ઉપજ નકશા સુધી, આંતરદૃષ્ટિ સીધી તમારા ઉપકરણ પર મેળવો.",
    how_it_works_btn: "તે કેવી રીતે કાર્ય કરે છે તે જુઓ",
    smart_hardware: "સ્માર્ટ હાર્ડવેર",
    h_s3_t: "કનેક્ટેડ સેન્સર",
    h_s3_h: "દરેક એકર માટે",
    h_s3_d: "અમારું IoT-સક્ષમ હાર્ડવેર તમારા ખેતરો મુજબ અનુકૂલિત થાય છે - નિરીક્ષણ અને ઓપ્ટિમાઇઝ કરે છે.",
    view_hardware: "હાર્ડવેર જુઓ",
    optimal: "શ્રેષ્ઠ",
    warm: "હૂંફાળું",
    normal: "સામાન્ય",
    stopped: "બંધ",
    moisture_trend: "ભેજનું વલણ (24 કલાક)",
    realtime_feed: "રીયલ-ટાઇમ ફીડ",
    current_harvest: "વર્તમાન પાક",
    growthStage_label: "વિકાસનો તબક્કો",
    vegetative: "વિકાસનો તબક્કો",
    modify_settings: "સેટિંગ્સ બદલો",
    field_profile: "ખેતરની પ્રોફાઇલ",
    village_label: "ગામ",
    hectares: "હેક્ટર",
    ai_recommendation: "AI ભલામણ",
    water_needed_in: "તમારા ખેતરને પાણીની જરૂર પડશે",
    hours: "કલાક",
    active: "સિસ્ટમ સક્રિય",
    standby: "સિસ્ટમ સ્ટેન્ડબાય",
    state: "સ્થિતિ",
    partlyCloudy: "આંશિક વાદળછાયું",
    humidity_label: "ભેજ",
    wind: "પવન",
    rain_chance: "વરસાદની શક્યતા",
    sunrise_label: "સૂર્યોદય",
    current_conditions: "વર્તમાન સ્થિતિ",
    local_conditions: "સ્થાનિક સ્થિતિ અને 7 દિવસની આગાહી",
    days: "દિવસો",
    waterFlow: "પાણીનો પ્રવાહ",
    humidity: "ભેજ",
    waterUsed: "વપરાયેલું પાણી",
    today: "આજે",
    imp_tag: "અસર",
    imp_title: "ગ્રામીનલિંક કેમ મહત્વનું છે",
    imp_desc: "પાણીનો વપરાશ ઘટાડો, ઉત્પાદકતા વધારો અને ડેટા સંચાલિત ખેતી સક્રિય કરો.",
    i1_v: "30% સુધી",
    i1_l: "પાણીની બચત",
    i1_d: "સચોટ સિંચાઈ સમયપત્રક સાથે પાણીનો વપરાશ નોંધપાત્ર રીતે ઘટાડો.",
    i2_v: "સ્વસ્થ",
    i2_l: "પાક",
    i2_d: "યોગ્ય સમયે યોગ્ય માત્રામાં સિંચાઈ કરીને પાકને નુકસાનથી બચાવો.",
    i3_v: "રીયલ-ટાઇમ",
    i3_l: "ખેતરની આંતરદૃષ્ટિ",
    i3_d: "લાઇવ ડેશબોર્ડ અને વિશ્લેષણ દ્વારા ડેટા સંચાલિત ખેતી સક્ષમ કરો.",
    cta_title: "આજે જ સ્માર્ટ સિંચાઈ શરૂ કરો",
    cta_desc: "પાણી બચાવતા અને આત્મવિશ્વાસ સાથે ખેતી કરતા ભારતના ખેડૂતો સાથે જોડાઓ.",
    cta_btn1: "ખાતું બનાવો",
    cta_btn2: "ડેશબોર્ડ જુઓ",
    createAccount: "ખાતું બનાવો",
    dp_tag: "ડેશબોર્ડ પૂર્વાવલોકન",
    dp_title: "એક જ ડેશબોર્ડમાં તમારા ખેતરનું નિરીક્ષણ કરો",
    dp_desc: "જમીનનો ભેજ, તાપમાન, પાણીનો પ્રવાહ, પાક સ્વાસ્થ્યના નકશા અને સિંચાઈ ભલામણો - બધું એક નજરે.",
    bar_title: "ગ્રામીનલિંક ડેશબોર્ડ",
    stressed: "તણાવગ્રસ્ત",
    moderate: "મધ્યમ",
    healthy: "સ્વસ્થ",
    irrigate_now: "અત્યારે સિંચાઈ કરો",
    adequate: "પૂરતો ભેજ",
    schedule_tomorrow: "આવતીકાલ માટે આયોજન કરો",
    zone: "ઝોન",
    welcome_back: "સ્વાગત છે",
    login_command_center: "તમારા ગ્રામીનલિંક કમાન્ડ સેન્ટરમાં લોગ ઇન કરો",
    phone_or_email: "ફોન અથવા ઇમેઇલ",
    password_label: "પાસવર્ડ",
    forgot: "ભૂલી ગયા?",
    login_btn: "લોગ ઇન",
    new_to_gl: "ગ્રામીનલિંક પર નવા છો?",
    create_free_acc: "મફત ખાતું બનાવો",
    farmer_enrollment: "ખેડૂત નોંધણી",
    join_network: "ગ્રામીનલિંક AI નેટવર્કમાં જોડાઓ",
    full_name: "પૂરું નામ",
    phone_number: "ફોન નંબર",
    village_loc: "ગામ",
    account_verified_msg: "ખાતાની ચકાસણી SMS દ્વારા કરવામાં આવે છે.",
    complete_reg: "નોંધણી પૂર્ણ કરો",
    already_have_acc: "પહેલેથી ખાતું છે?",
    login_here: "અહીં લોગ ઇન કરો",
    secure_msg: "256-બીટ સુરક્ષિત",
    free_for_farmers: "ભારતીય ખેડૂતો માટે મફત",
    v4_msg: "સિસ્ટમ આવૃત્તિ 4.0",
    footer_l1: "પ્રોજેક્ટ વિશે",
    footer_l2: "દસ્તાવેજો",
    footer_l3: "સંપર્ક",
    footer_l4: "GitHub",
    footer_l5: "ગોપનીયતા નીતિ",
    footer_rights: "© 2026 ગ્રામીનલિંક. સર્વાધિકાર સુરક્ષિત.",
    home_subtitle: "રીયલ-ટાઇમમાં તમારા ખેતરના મહત્વના સંકેતોનું નિરીક્ષણ કરો",
    soil_subtitle: "સચોટ પાક પોષણ માટે જમીનનું વિશ્લેષણ",
    crops_subtitle: "પાક વિકાસના તબક્કાઓનું સંચાલન કરો",
    weather_subtitle: "સ્થાનિક સ્થિતિ અને 7 દિવસની આગાહી",
    optimize_btn: "ઓપ્ટિમાઇઝેશન લાગુ કરો",
    connecting: "કનેક્ટ થઈ રહ્યું છે...",
    demo_moisture: "સ્વસ્થ (ડેમો)",
    analyzing: "વિશ્લેષણ કરી રહ્યું છે",
    action_rec: "પગલાં ભલામણ કરેલ",
    no_action: "કોઈ પગલાં નહીં",
    check_details: "વિગતો તપાસો",
    sys_stable: "સિસ્ટમ સ્થિર છે",
    field_variance: "ક્ષેત્ર તફાવત",
    moisture_trend_24h: "ભેજનું વલણ (24 કલાક)",
    realtime_feed: "રીયલ-ટાઇમ ફીડ"
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
  const [showCallMenu, setShowCallMenu] = useState(false);
  // Phase 6/7/9 — Agentic AI + XAI
  const [agentDecision, setAgentDecision] = useState(null);
  const [xaiData, setXaiData] = useState(null);
  const [xaiLoading, setXaiLoading] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  // Phase 10 — Interactive Demo Mode
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [demoScenario, setDemoScenario] = useState('severe_drought');
  const [demoScenariosList, setDemoScenariosList] = useState([]);
  const [demoAutoSimulate, setDemoAutoSimulate] = useState(false);
  const [demoApplying, setDemoApplying] = useState(false);
  const [demoStepCount, setDemoStepCount] = useState(0);
  const [demoBannerInfo, setDemoBannerInfo] = useState(null);

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
          .then(res => {
            setData(res.data);
            if (res.data.pump_status) {
              setPumpOn(res.data.pump_status === 'ON');
            }
          })
          .catch(handleAuthError);

        axios.get(`${API_BASE}/dashboard/sensor-history/${userIdToUse}`, headers)
          .then(histRes => {
            if (Array.isArray(histRes.data)) {
              setHistory(histRes.data.map(h => {
                // Fix for space in timestamp "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
                const dateStr = h.timestamp ? h.timestamp.replace(' ', 'T') : null;
                const d = dateStr ? new Date(dateStr) : null;
                const isValid = d && !isNaN(d.getTime());
                
                return {
                  time: isValid ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--',
                  moisture: Number(h.soil_moisture) || 0,
                  temperature: Number(h.temperature) || 0,
                  date: isValid ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'
                };
              }));
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

  // Phase 10: Fetch demo scenarios on component mount
  useEffect(() => {
    axios.get(`${API_BASE}/demo/scenarios`)
      .then(res => {
        if (res.data?.scenarios) {
          setDemoScenariosList(res.data.scenarios);
        }
      })
      .catch(err => console.log('Demo scenarios fetch error:', err));
  }, []);

  // Phase 10: Apply a demo scenario through real ML & Agentic AI pipeline
  const applyDemoScenario = async (scenarioKey) => {
    const key = scenarioKey || demoScenario;
    setDemoScenario(key);
    setDemoApplying(true);
    try {
      const userIdToUse = profile?.farm?.id || getUserId() || 1;
      const res = await axios.post(`${API_BASE}/demo/apply`, {
        field_id: userIdToUse,
        scenario_key: key
      });

      if (res.data?.status === 'success') {
        const scenarioInfo = res.data.scenario;
        setDemoBannerInfo(scenarioInfo);

        // Fetch refreshed dashboard data, historical sensor records, and explainability
        const headers = { headers: { Authorization: `Bearer ${token}` } };
        const [dashRes, histRes, xaiRes] = await Promise.allSettled([
          axios.get(`${API_BASE}/dashboard/status/${userIdToUse}`, headers),
          axios.get(`${API_BASE}/dashboard/sensor-history/${userIdToUse}`, headers),
          axios.get(`${API_BASE}/agent/explain/${userIdToUse}`, headers),
        ]);

        if (dashRes.status === 'fulfilled' && dashRes.value.data) {
          const d = dashRes.value.data;
          setData(d);
          if (d.pump_status) setPumpOn(d.pump_status === 'ON');
        }

        if (histRes.status === 'fulfilled' && Array.isArray(histRes.value.data)) {
          setHistory(histRes.value.data.map(h => {
            const dateStr = h.timestamp ? h.timestamp.replace(' ', 'T') : null;
            const d = dateStr ? new Date(dateStr) : null;
            const isValid = d && !isNaN(d.getTime());
            return {
              time: isValid ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--',
              moisture: Number(h.soil_moisture) || 0,
              temperature: Number(h.temperature) || 0,
              date: isValid ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '---'
            };
          }));
        }

        if (xaiRes.status === 'fulfilled' && xaiRes.value.data) {
          setXaiData(xaiRes.value.data);
          setAgentDecision(xaiRes.value.data);
        }

        if (res.data.farm_state) {
          setSatelliteData({
            ndvi_value: res.data.farm_state.ndvi,
            health_status: res.data.farm_state.ndvi_status,
            status: res.data.farm_state.ndvi_status,
            image_date: new Date().toISOString().split('T')[0]
          });
        }
      }
    } catch (err) {
      console.error('Failed to apply demo scenario:', err);
    } finally {
      setDemoApplying(false);
    }
  };

  // Phase 10: Live simulation tick step
  const tickDemoSimulation = async () => {
    try {
      const userIdToUse = profile?.farm?.id || getUserId() || 1;
      const res = await axios.post(`${API_BASE}/demo/tick`, {
        field_id: userIdToUse,
        scenario_key: demoScenario,
        is_pump_on: pumpOn,
        step_count: demoStepCount + 1
      });

      setDemoStepCount(prev => prev + 1);

      if (res.data?.current_sensor) {
        const cs = res.data.current_sensor;
        setData(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            sensor_data: {
              ...prev.sensor_data,
              soil_moisture: cs.soil_moisture,
              temperature: cs.temperature,
              humidity: cs.humidity,
              flow_rate: cs.water_flow
            }
          };
        });

        const d = new Date();
        const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        setHistory(prev => {
          const updated = [...prev, { time: timeStr, moisture: cs.soil_moisture, temperature: cs.temperature, date: dateStr }];
          return updated.slice(-25);
        });

        if (res.data.agent_decision) {
          setAgentDecision(res.data.agent_decision);
        }

        if (res.data.xai) {
          setXaiData(prev => ({
            ...(prev || {}),
            xai: res.data.xai,
            agent_reasoning: res.data.agent_decision?.reasoning || prev?.agent_reasoning,
            human_summary: res.data.agent_decision?.human_summary || prev?.human_summary,
            metrics: {
              ...(prev?.metrics || {}),
              soil_moisture: cs.soil_moisture,
              temperature: cs.temperature,
            }
          }));
        }
      }
    } catch (err) {
      console.error('Error ticking demo simulation:', err);
    }
  };

  // Phase 10: Auto-simulation stream interval
  useEffect(() => {
    if (!isDemoMode || !demoAutoSimulate) return;
    const timer = setInterval(() => {
      tickDemoSimulation();
    }, 4000);
    return () => clearInterval(timer);
  }, [isDemoMode, demoAutoSimulate, pumpOn, demoScenario, demoStepCount]);

  // Phase 10: Toggle Demo Mode switch
  const handleToggleDemoMode = () => {
    const nextState = !isDemoMode;
    setIsDemoMode(nextState);
    if (nextState) {
      applyDemoScenario(demoScenario);
    } else {
      setDemoAutoSimulate(false);
      setDemoBannerInfo(null);
    }
  };

  const mockData = {
    farmer_name: "Raju Reddy",
    farmer_village: "Rampur",
    latitude: 17.3850,
    longitude: 78.4867,
    profile_photo: null,
    field_info: { id: 1, crop: "Rice", area: 2.5, stage: "Vegetative" },
    sensor_data: { soil_moisture: 0, temperature: 0, humidity: 0, flow_rate: 0 },
    ndvi: { ndvi_value: 0.0, interpretation: "Waiting for data...", stress_alert: false },
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

  const handleCall = async (requestType = 'updates') => {
    setCalling(true);
    setShowCallMenu(false);
    try {
      const userId = getUserId();
      await axios.post(`${API_BASE}/voice/trigger-request/${userId}?request_type=${requestType}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`Call for ${requestType.replace('_', ' ')} initiated!`);
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
              currentLang={currentLang}
              changeLanguage={changeLanguage}
              t={t}
            />
          )}
          {view === 'login' && (
            <Login key="login" onLogin={handleLogin} onSwitchToRegister={() => setView('register')} t={t} />
          )}
          {view === 'register' && (
            <Register key="register" onRegister={handleLogin} onSwitchToLogin={() => setView('login')} t={t} />
          )}
        </AnimatePresence>
      </TooltipProvider>
    );
  }

  const currentStatus = {
    ...mockData,
    ...(data || {}),
    sensor_data: data?.sensor_data || mockData.sensor_data, // Ensure real data takes priority
    farmer_name: profile?.profile?.name || data?.farmer_name || mockData.farmer_name,
    farmer_village: profile?.farm?.village || data?.farmer_village || mockData.farmer_village,
    latitude: profile?.farm?.latitude ?? data?.latitude ?? mockData.latitude ?? 17.515397,
    longitude: profile?.farm?.longitude ?? data?.longitude ?? mockData.longitude ?? 78.3817156,
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

  const togglePump = async () => {
    const newStatus = !pumpOn;
    setPumpOn(newStatus);
    
    try {
      const userId = getUserId();
      await axios.post(`${API_BASE}/sensors/control`, { 
        field_id: userId, 
        action: newStatus ? "START" : "STOP" 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to toggle pump:", err);
      setPumpOn(!newStatus);
      alert("Failed to control pump. Please try again.");
    }
  };

  const getSoilMoistureBadge = (sm) => {
    if (sm === null || sm === undefined) return { status: 'No Data', color: 'text-slate-400', bg: 'bg-slate-500/10', fill: 'bg-slate-500', pct: 0 };
    if (sm < 20) return { status: 'Critical Low', color: 'text-rose-500', bg: 'bg-rose-500/10', fill: 'bg-rose-500', pct: Math.min(100, Math.max(5, sm)) };
    if (sm < 35) return { status: 'Low / Dry', color: 'text-amber-500', bg: 'bg-amber-500/10', fill: 'bg-amber-500', pct: Math.min(100, sm) };
    if (sm <= 55) return { status: 'Optimal', color: 'text-emerald-500', bg: 'bg-emerald-500/10', fill: 'bg-emerald-500', pct: Math.min(100, sm) };
    return { status: 'High / Wet', color: 'text-blue-500', bg: 'bg-blue-500/10', fill: 'bg-blue-500', pct: Math.min(100, sm) };
  };

  const getTemperatureBadge = (temp) => {
    if (temp === null || temp === undefined) return { status: 'No Data', color: 'text-slate-400', bg: 'bg-slate-500/10', fill: 'bg-slate-500' };
    if (temp < 18) return { status: 'Cool', color: 'text-blue-400', bg: 'bg-blue-400/10', fill: 'bg-blue-400' };
    if (temp <= 32) return { status: 'Ideal', color: 'text-emerald-500', bg: 'bg-emerald-500/10', fill: 'bg-emerald-500' };
    if (temp <= 38) return { status: 'Warm', color: 'text-amber-500', bg: 'bg-amber-500/10', fill: 'bg-amber-500' };
    return { status: 'Heat Stress', color: 'text-rose-500', bg: 'bg-rose-500/10', fill: 'bg-rose-500' };
  };

  const getHumidityBadge = (hum) => {
    if (hum === null || hum === undefined) return { status: 'No Data', color: 'text-slate-400', bg: 'bg-slate-500/10', fill: 'bg-slate-500' };
    if (hum < 30) return { status: 'Dry', color: 'text-amber-500', bg: 'bg-amber-500/10', fill: 'bg-amber-500' };
    if (hum <= 70) return { status: 'Normal', color: 'text-cyan-500', bg: 'bg-cyan-500/10', fill: 'bg-cyan-500' };
    return { status: 'Humid', color: 'text-blue-500', bg: 'bg-blue-500/10', fill: 'bg-blue-500' };
  };

  const renderHome = () => {
    const sm = currentStatus.sensor_data?.soil_moisture;
    const smBadge = getSoilMoistureBadge(sm);
    const temp = currentStatus.sensor_data?.temperature;
    const tempBadge = getTemperatureBadge(temp);
    const hum = currentStatus.sensor_data?.humidity;
    const humBadge = getHumidityBadge(hum);

    const ndviVal = satelliteData?.ndvi_value ?? currentStatus.satellite_data?.ndvi_value;
    const ndviStatus = satelliteData?.health_status || currentStatus.satellite_data?.health_status || (ndviVal > 0.6 ? 'Healthy' : ndviVal > 0.3 ? 'Moderate' : 'Crop stress');
    const ndviColor = ndviVal > 0.6 ? 'text-emerald-500' : ndviVal > 0.3 ? 'text-yellow-500' : 'text-rose-500';
    const ndviBg = ndviVal > 0.6 ? 'bg-emerald-500/10' : ndviVal > 0.3 ? 'bg-yellow-500/10' : 'bg-rose-500/10';

    const aiAction = agentDecision?.decision || (currentStatus.ai_insights ? 'Action Recommended' : 'System Stable');
    const aiStatus = agentDecision ? `${agentDecision.decision.toUpperCase()} • ${agentDecision.alert_level}` : (currentStatus.ai_insights ? 'Check Details' : 'Optimal');
    const aiColor = agentDecision?.decision === 'irrigate' ? 'text-amber-500' : agentDecision?.decision === 'delay' ? 'text-blue-500' : 'text-purple-500';
    const aiBg = agentDecision?.decision === 'irrigate' ? 'bg-amber-500/10' : agentDecision?.decision === 'delay' ? 'bg-blue-500/10' : 'bg-purple-500/10';

    return (
    <div className="space-y-10">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-8"
      >
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('home')}</h2>
        <p className="text-muted-foreground font-medium">{t('home_subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {[
          { icon: Droplets, label: t('soilMoisture'), value: sm != null ? `${sm}%` : '--%', status: smBadge.status, color: smBadge.color, bg: smBadge.bg, delay: 0.1 },
          { icon: Thermometer, label: t('temperature'), value: temp != null ? `${temp}°C` : '--°C', status: tempBadge.status, color: tempBadge.color, bg: tempBadge.bg, delay: 0.2 },
          { icon: Wind, label: t('humidity_label') || "Humidity", value: hum != null ? `${hum}%` : '--%', status: humBadge.status, color: humBadge.color, bg: humBadge.bg, delay: 0.25 },
          { icon: Power, label: t('pumpStatus'), value: pumpOn ? 'ON' : 'OFF', status: pumpOn ? 'Active' : 'Standby', color: pumpOn ? 'text-emerald-500' : 'text-slate-400', bg: pumpOn ? 'bg-emerald-500/10' : 'bg-slate-500/10', delay: 0.3 },
          { icon: Satellite, label: 'Sat NDVI', value: ndviVal != null ? (typeof ndviVal === 'number' ? ndviVal.toFixed(3) : ndviVal) : "0.00", status: ndviStatus, color: ndviColor, bg: ndviBg, delay: 0.4 },
          { icon: Activity, label: t('aiAdvice'), value: aiAction, status: aiStatus, color: aiColor, bg: aiBg, delay: 0.5 },
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
            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${item.bg} ${item.color} border-current/20`}>
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
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{t('state')}</div>
              <div className={`text-2xl font-black ${pumpOn ? 'text-green-500' : 'text-red-500'}`}>
                {pumpOn ? t('active') : t('standby')}
              </div>
            </div>
            <button
              className={`w-full sm:w-auto px-10 py-4 rounded-2xl font-bold transition-all active:scale-95 shadow-xl ${pumpOn ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-green-500 text-white shadow-green-500/20'}`}
              onClick={togglePump}
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
              <div className="text-muted-foreground font-medium">{t('partlyCloudy')} • {currentStatus.farmer_village}</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
    );
  };

  const renderWeather = () => (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('weatherForecast')}</h2>
          <p className="text-muted-foreground font-medium">{t('local_conditions')} {currentStatus.farmer_village}</p>
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
            <div className="text-sm font-bold text-primary uppercase tracking-[0.3em] mb-4">{t('current_conditions')}</div>
            <div className="text-7xl md:text-8xl font-black tracking-tighter mb-4">{currentStatus.weather?.temperature || 32}°C</div>
            <div className="text-2xl font-bold text-muted-foreground">{t('partlyCloudy')}</div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {[
                { icon: Droplets, label: t('humidity_label'), value: `${currentStatus.sensor_data?.humidity ?? 55}%`, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                { icon: Wind, label: t('wind'), value: '12 km/h', color: 'text-slate-400', bg: 'bg-slate-400/10' },
                { icon: CloudRain, label: t('rain_chance'), value: '0%', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
                { icon: Sunrise, label: t('sunrise_label'), value: currentStatus.weather?.sunrise || '06:30', color: 'text-orange-400', bg: 'bg-orange-400/10' },
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
        <h3 className="text-lg font-bold tracking-tight uppercase text-muted-foreground tracking-[0.2em]">{t('nextRecommended')} 7 {t('days')}</h3>
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

  const renderSoilHealth = () => {
    const sm = currentStatus.sensor_data?.soil_moisture;
    const smBadge = getSoilMoistureBadge(sm);
    const temp = currentStatus.sensor_data?.temperature;
    const tempBadge = getTemperatureBadge(temp);
    const hum = currentStatus.sensor_data?.humidity;
    const humBadge = getHumidityBadge(hum);

    return (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('soilHealth')}</h2>
        <p className="text-muted-foreground font-medium">{t('soil_subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {[
          { icon: Droplets, label: t('soilMoisture'), value: sm != null ? `${sm}%` : '--%', status: smBadge.status, color: smBadge.color, fill: smBadge.fill, pct: smBadge.pct },
          { icon: Thermometer, label: t('temperature'), value: temp != null ? `${temp}°C` : '--°C', status: tempBadge.status, color: tempBadge.color, fill: tempBadge.fill, pct: Math.min(100, (temp || 0) * 2) },
          { icon: Wind, label: t('humidity_label'), value: hum != null ? `${hum}%` : '--%', status: humBadge.status, color: humBadge.color, fill: humBadge.fill, pct: Math.min(100, hum || 0) },
          { icon: Activity, label: t('waterFlow') || 'Water Flow', value: `${currentStatus.sensor_data?.flow_rate ?? 0.0} L/min`, status: pumpOn ? 'Flowing' : t('stopped'), color: pumpOn ? 'text-emerald-500' : 'text-slate-400', fill: pumpOn ? 'bg-emerald-500' : 'bg-slate-500', pct: pumpOn ? 75 : 0 },
          { icon: Gauge, label: t('waterUsed') || 'Water Used', value: `0.00 L`, status: t('today') || 'Today', color: 'text-indigo-500', fill: 'bg-indigo-500', pct: 20 },
          { icon: Power, label: t('pumpStatus'), value: pumpOn ? 'ON' : 'OFF', status: pumpOn ? 'Active' : 'Standby', color: pumpOn ? 'text-emerald-500' : 'text-slate-400', fill: pumpOn ? 'bg-emerald-500' : 'bg-slate-500', pct: pumpOn ? 100 : 0 },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card border border-border p-6 rounded-3xl"
          >
            <div className="flex items-center gap-3 mb-6">
              <item.icon size={20} className={item.color} />
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</span>
            </div>
            <div className={`text-3xl font-black mb-4 ${item.color}`}>{item.value}</div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden mb-4">
              <div className={`h-full ${item.fill}`} style={{ width: `${item.pct}%` }}></div>
            </div>
            <div className={`text-[11px] font-bold uppercase tracking-widest ${item.color}`}>{item.status}</div>
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
            <Activity className="text-primary" /> {t('moisture_trend_24h')}
          </h3>
          <div className="text-xs font-bold text-muted-foreground bg-secondary px-4 py-1.5 rounded-full border border-border">{t('realtime_feed')}</div>
        </div>

        <div className="h-[350px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history || []} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#eab308" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.2} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold"
                tickMargin={10}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontWeight="bold" 
                domain={[0, 100]}
                width={30}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '1rem', padding: '12px' }}
                itemStyle={{ color: '#eab308', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="moisture" 
                stroke="#eab308" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorMoisture)"
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
    );
  };

  const renderCrops = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('crops')}</h2>
        <p className="text-muted-foreground font-medium">{t('crops_subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border p-8 rounded-[2rem] flex flex-col items-center text-center col-span-1"
        >
          <div className="text-6xl mb-6">🌾</div>
          <div className="text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-2">{t('current_harvest')}</div>
          <div className="text-3xl font-black mb-2">{currentStatus.field_info?.crop || "Rice"}</div>
          <div className="text-muted-foreground font-medium mb-8">{t('growthStage_label')}: {currentStatus.field_info?.stage || t('vegetative')}</div>

          <button
            onClick={openSettings}
            className="w-full py-4 bg-secondary/50 hover:bg-secondary rounded-2xl border border-border transition-all font-bold flex items-center justify-center gap-2 group"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform" />
            {t('modify_settings')}
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
            <h3 className="text-lg font-bold">{t('field_profile')}</h3>
          </div>

          <div className="grid grid-cols-2 gap-8">
            {[
              { label: 'Village', value: currentStatus.farmer_village || "Nizampet" },
              { label: 'Field Area', value: `${currentStatus.field_info?.area || 2.5} Acres` },
              { label: 'Crop Variety', value: currentStatus.field_info?.crop || 'Wheat' },
              { label: 'Soil Type', value: 'Loamy Soil' },
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

  // ── XAI fetch — runs when the schedule tab becomes active ──────────────────
  const fetchAgentExplanation = async () => {
    const fieldId = currentStatus?.field_id || data?.field_id || 1;
    if (!fieldId || !token) return;
    setXaiLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/agent/explain/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setXaiData(res.data);
      setAgentDecision(res.data);
      setFeedbackSent(false);
    } catch (err) {
      console.warn('XAI fetch failed:', err?.response?.data || err.message);
    } finally {
      setXaiLoading(false);
    }
  };

  const submitFeedback = async (response) => {
    if (!xaiData || feedbackSent || feedbackSubmitting) return;
    const fieldId = currentStatus?.field_id || data?.field_id || 1;
    setFeedbackSubmitting(true);
    try {
      await axios.post(`${API_BASE}/agent/feedback`, {
        field_id: fieldId,
        ai_decision: xaiData?.agent_reasoning ? 'irrigate' : 'monitor',
        recommended_water_mm: xaiData?.ml_prediction?.water_requirement_mm || 0,
        ai_confidence: xaiData?.ml_prediction?.confidence || 0,
        agent_reasoning: xaiData?.agent_reasoning || [],
        farmer_response: response,
      }, { headers: { Authorization: `Bearer ${token}` } });
      setFeedbackSent(true);
    } catch (err) {
      console.warn('Feedback submit failed:', err?.response?.data || err.message);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  const alertColors = {
    none:     { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' },
    low:      { bg: 'bg-blue-500/10',    border: 'border-blue-500/30',    text: 'text-blue-400',    dot: 'bg-blue-400'    },
    medium:   { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400',  dot: 'bg-yellow-400'  },
    high:     { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400',  dot: 'bg-orange-400'  },
    critical: { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',     dot: 'bg-red-400'     },
  };

  const renderSchedule = () => (
    <div className="space-y-10">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{t('schedule')}</h2>
        <p className="text-muted-foreground font-medium">AI-driven irrigation planning and historical logs</p>
      </motion.div>

      {/* ── Phase 6/7: Agentic AI Decision + XAI Card ─────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <Activity className="text-violet-400" size={18} />
              </div>
              <div>
                <h3 className="font-bold text-base">Why this recommendation?</h3>
                <p className="text-[11px] text-muted-foreground">Explainable AI — reasoning over sensor + satellite + weather data</p>
              </div>
            </div>
            <button
              onClick={fetchAgentExplanation}
              disabled={xaiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl text-xs font-bold border border-violet-500/20 transition-all disabled:opacity-50"
            >
              {xaiLoading ? <Loader2 size={13} className="animate-spin" /> : <TrendingUp size={13} />}
              {xaiLoading ? 'Analyzing…' : 'Refresh Analysis'}
            </button>
          </div>

          {xaiLoading && (
            <div className="p-12 flex flex-col items-center gap-4 text-muted-foreground">
              <Loader2 size={32} className="animate-spin text-violet-400" />
              <p className="text-sm font-medium">Fusing IoT + Satellite + Weather + ML data…</p>
            </div>
          )}

          {!xaiLoading && !xaiData && (
            <div className="p-12 flex flex-col items-center gap-4 text-muted-foreground">
              <Activity size={36} className="opacity-20" />
              <p className="text-sm font-medium">Click <strong>Refresh Analysis</strong> to get an AI explanation</p>
            </div>
          )}

          {!xaiLoading && xaiData && (() => {
            const alert = xaiData.alert_level || 'none';
            const colors = alertColors[alert] || alertColors.none;
            const contributions = xaiData.xai?.contributions || [];
            const maxImp = Math.max(...contributions.map(c => c.importance), 0.001);
            const metrics = xaiData.metrics || {};
            return (
              <div className="p-6 space-y-6">
                {/* Decision banner */}
                <div className={`flex items-center gap-4 p-4 rounded-2xl border ${colors.bg} ${colors.border}`}>
                  <span className={`w-3 h-3 rounded-full animate-pulse ${colors.dot}`} />
                  <div className="flex-1">
                    <div className={`text-xs font-bold uppercase tracking-widest ${colors.text} mb-0.5`}>
                      Alert level: {alert}
                    </div>
                    <div className="font-semibold text-sm text-foreground">
                      {xaiData.human_summary || 'Analysis complete'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Confidence</div>
                    <div className="text-xl font-black text-foreground">{metrics.confidence ?? '--'}%</div>
                  </div>
                </div>

                {/* Key metrics row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Soil Moisture', value: `${metrics.soil_moisture?.toFixed(1) ?? '--'}%`, sub: `Optimal ${metrics.optimal_moisture?.toFixed(0) ?? '--'}%` },
                    { label: 'NDVI', value: metrics.ndvi?.toFixed(3) ?? '--', sub: metrics.ndvi_status ?? '' },
                    { label: 'Rain Prob.', value: `${metrics.rain_probability?.toFixed(0) ?? '--'}%`, sub: 'Next 24h' },
                    { label: 'Water Stress', value: metrics.water_stress_index?.toFixed(2) ?? '--', sub: '/1.0 index' },
                  ].map((m, i) => (
                    <div key={i} className="bg-secondary/40 rounded-2xl p-4 border border-border/50">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{m.label}</div>
                      <div className="text-2xl font-black text-foreground">{m.value}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{m.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Feature importance bars (XAI) */}
                {contributions.length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Feature Importance (XAI)</div>
                    <div className="space-y-2.5">
                      {contributions.slice(0, 6).map((c, i) => {
                        const pct = Math.round((c.importance / maxImp) * 100);
                        const isPos = c.direction === 'increases_need';
                        return (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-28 text-[11px] font-semibold text-muted-foreground truncate text-right">
                              {c.feature?.replace(/_/g, ' ')}
                            </div>
                            <div className="flex-1 h-5 bg-secondary/50 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${isPos ? 'bg-orange-400' : 'bg-emerald-400'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <div className="text-[11px] font-bold w-12 text-right">{(c.importance * 100).toFixed(1)}%</div>
                            <div className={`text-[9px] w-12 font-bold uppercase tracking-wider ${isPos ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {isPos ? '▲ need' : '▼ no'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      Orange = increases irrigation need &nbsp;·&nbsp; Green = reduces need
                    </p>
                  </div>
                )}

                {/* Agent reasoning steps */}
                {(xaiData.agent_reasoning || []).length > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">AI Reasoning Steps</div>
                    <ol className="space-y-2">
                      {xaiData.agent_reasoning.map((step, i) => (
                        <li key={i} className="flex gap-3 items-start">
                          <span className="w-6 h-6 rounded-lg bg-violet-500/10 text-violet-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                          <span className="text-sm text-muted-foreground leading-snug">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Data sources */}
                {(xaiData.data_sources || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-widest mr-1">Sources:</span>
                    {xaiData.data_sources.map((s, i) => (
                      <span key={i} className="px-2 py-0.5 bg-secondary/50 border border-border/50 rounded-full text-[10px] font-semibold text-muted-foreground">{s}</span>
                    ))}
                  </div>
                )}

                {/* Phase 9: Farmer Feedback */}
                <div className="border-t border-border pt-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Did this recommendation help?</div>
                  {feedbackSent ? (
                    <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                      <span className="w-5 h-5 rounded-full bg-emerald-400/10 flex items-center justify-center text-xs">✓</span>
                      Feedback recorded — thank you!
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {[['accepted','✓ Yes, I followed it','bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'],
                        ['modified','~ I modified it','bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'],
                        ['rejected','✗ I ignored it','bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20']
                      ].map(([val, label, cls]) => (
                        <button
                          key={val}
                          disabled={feedbackSubmitting}
                          onClick={() => submitFeedback(val)}
                          className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all disabled:opacity-50 ${cls}`}
                        >
                          {feedbackSubmitting ? '…' : label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary p-8 md:p-10 rounded-[2.5rem] text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest leading-none">{t('ai_recommendation')}</div>
          </div>
          <h3 className="text-3xl md:text-4xl font-black mb-8 leading-tight">{t('water_needed_in')} <span className="underline decoration-white/30">{nextIrrigation.hours} {t('hours')}</span>.</h3>

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
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Satellite Intelligence & Orders</h2>
        <p className="text-muted-foreground font-medium">Planet Labs Orders API (3m HD) + Sentinel-2 Analytics for {currentStatus.farmer_village}</p>
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

      {/* 1. Interactive Field Polygon Drawer with Planet Orders API execution */}
      <FieldPolygonDrawer
        token={token}
        API_BASE={API_BASE}
        userLat={currentStatus.latitude || 17.515397}
        userLon={currentStatus.longitude || 78.3817156}
        cropType={currentStatus.field_info?.crop || 'Rice'}
        onOrderProcessed={(res) => {
          if (res?.metrics) {
            setSatelliteData({
              ndvi_value: res.metrics.mean_ndvi,
              health_status: res.metrics.health_status,
              status: res.metrics.health_status,
              image_date: res.scene?.acquired ? res.scene.acquired.split('T')[0] : new Date().toISOString().split('T')[0],
              source: 'Planet Labs Orders API v2 (3m HD)'
            });
          }
        }}
      />

      {/* 2. Historical NDVI Growth Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border p-8 rounded-[2.5rem] shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Longitudinal Health</div>
            <h3 className="text-lg font-bold text-foreground">Multi-Week Field NDVI Growth Trajectory</h3>
          </div>
          <span className="text-xs font-mono text-primary bg-primary/10 px-3 py-1 rounded-full font-bold border border-primary/20">
            Sentinel-2 + PlanetScope Fused
          </span>
        </div>
        <div className="h-[220px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={ndviTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.25} />
              <XAxis dataKey="week" stroke="#64748b" fontSize={11} fontWeight="bold" />
              <YAxis domain={[0, 1]} stroke="#64748b" fontSize={11} fontWeight="bold" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '1rem', padding: '10px 14px' }}
                itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
              />
              <Line type="monotone" dataKey="ndvi" stroke="#10b981" strokeWidth={4} dot={{ r: 5, fill: '#10b981' }} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
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
        <div 
          className="flex items-center gap-3 cursor-pointer select-none active:scale-95 transition-transform"
          onClick={() => setActiveTab('home')}
        >
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
            <Droplets size={24} color="white" />
          </div>
          <div>
            <h1 className="text-xl font-display font-extrabold tracking-tight text-foreground leading-none">AgriMate</h1>
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

          <div className="relative group">
            <div className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-xl border border-border">
              <Languages size={14} className="text-muted-foreground" />
              <select
                value={currentLang}
                onChange={(e) => changeLanguage(e.target.value)}
                className="bg-transparent text-[11px] font-bold uppercase tracking-wider outline-none cursor-pointer appearance-none pr-4"
              >
                {Object.keys(translations).map((lang) => (
                  <option key={lang} value={lang} className="bg-card text-foreground">
                    {languageLabels[lang] || lang}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <ChevronRight size={10} className="rotate-90 text-muted-foreground" />
              </div>
            </div>
          </div>

          <ThemeToggle variant="button" />

          <div className="h-6 w-px bg-border hidden sm:block mx-1" />

          {/* Phase 10: Demo Mode Switch */}
          <button
            onClick={handleToggleDemoMode}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition-all font-extrabold text-[11px] uppercase tracking-wider border shadow-md active:scale-95 ${
              isDemoMode
                ? 'bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 border-amber-500/50 text-amber-400 shadow-amber-500/10 ring-2 ring-amber-500/20'
                : 'bg-secondary/60 hover:bg-secondary border-border text-muted-foreground hover:text-foreground'
            }`}
            title="Toggle realistic mock telemetry for demonstrations without physical sensors"
          >
            <FlaskConical size={14} className={isDemoMode ? 'text-amber-400 animate-bounce' : 'text-muted-foreground'} />
            <span className="hidden xs:inline">Demo Mode</span>
            <div className={`w-2 h-2 rounded-full ${isDemoMode ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-muted-foreground/40'}`} />
          </button>

          <div className="h-6 w-px bg-border hidden sm:block mx-1" />

          <button
            onClick={() => setShowCallMenu(true)}
            disabled={calling}
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-all font-bold text-[12px] group active:scale-95"
          >
            <Phone size={14} className="group-hover:rotate-12 transition-transform" />
            <span className="hidden xs:inline">{calling ? t('connecting') : t('call')}</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive transition-all active:scale-95 border border-destructive/10"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* ── Phase 10: Interactive Demo Mode Command Bar ──────────────────────── */}
      <AnimatePresence>
        {isDemoMode && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-gradient-to-r from-amber-950/40 via-purple-950/40 to-slate-900/60 border-b border-amber-500/30 px-6 py-3 sticky top-[73px] z-45 backdrop-blur-lg overflow-hidden"
          >
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Zap size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">Live Demo Controller</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                      Full ML + Agentic AI + XAI
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                    Select a scenario or stream live ticks to demonstrate data fusion & AI reasoning.
                  </p>
                </div>
              </div>

              {/* Scenario Selector Buttons */}
              <div className="flex items-center flex-wrap gap-2">
                {[
                  { key: 'severe_drought', label: '🚨 Severe Drought', desc: '18.2% moisture, 37°C, 0.28 NDVI → Triggers IRRIGATE_NOW' },
                  { key: 'incoming_rain', label: '🌧️ Rain Forecasted', desc: '26.5% moisture + 85% rain chance → Triggers DELAY' },
                  { key: 'optimal_post_irrigation', label: '🌿 Optimal Field', desc: '44.5% moisture, 0.74 NDVI → Triggers MONITOR' },
                ].map((s) => (
                  <button
                    key={s.key}
                    onClick={() => applyDemoScenario(s.key)}
                    disabled={demoApplying}
                    title={s.desc}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                      demoScenario === s.key
                        ? 'bg-amber-500 text-black font-black border-amber-400 shadow-lg shadow-amber-500/20'
                        : 'bg-secondary/60 hover:bg-secondary text-foreground border-border/80'
                    }`}
                  >
                    {demoApplying && demoScenario === s.key ? <Loader2 size={12} className="animate-spin" /> : null}
                    {s.label}
                  </button>
                ))}

                <div className="h-5 w-px bg-border/80 hidden sm:block mx-1" />

                {/* Auto-Simulate Toggle */}
                <button
                  onClick={() => setDemoAutoSimulate(!demoAutoSimulate)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border active:scale-95 ${
                    demoAutoSimulate
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                      : 'bg-secondary/60 hover:bg-secondary text-muted-foreground border-border/80'
                  }`}
                  title="Automatically tick the sensor clock every 4s to simulate live changing field dynamics"
                >
                  {demoAutoSimulate ? <Pause size={12} /> : <Play size={12} />}
                  <span>{demoAutoSimulate ? 'Streaming Live' : 'Auto Stream'}</span>
                </button>

                {/* Manual Step Tick Button */}
                <button
                  onClick={tickDemoSimulation}
                  disabled={demoAutoSimulate}
                  className="px-3 py-1.5 bg-secondary/60 hover:bg-secondary border border-border/80 rounded-xl text-xs font-bold text-foreground transition-all flex items-center gap-1.5 disabled:opacity-40 active:scale-95"
                  title="Advance 1 simulation tick"
                >
                  <RefreshCw size={12} />
                  <span>Tick Step</span>
                </button>
              </div>
            </div>

            {/* Scenario explanation banner */}
            {demoBannerInfo && (
              <div className="max-w-7xl mx-auto mt-2.5 pt-2 border-t border-amber-500/10 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="font-medium text-amber-200/90">
                  <strong className="text-amber-400">{demoBannerInfo.title}:</strong> {demoBannerInfo.description}
                </span>
                <span className="hidden md:inline font-mono text-[10px] text-amber-400/80 bg-black/40 px-2 py-0.5 rounded border border-amber-500/20">
                  Expected AI Decision: {demoBannerInfo.expected_action}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
                    {t('field_profile')}
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('village_loc')}</label>
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
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{t('growthStage_label')}</label>
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
                    {savingStatus ? <Loader2 className="animate-spin" size={20} /> : t('optimize_btn')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        {showCallMenu && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCallMenu(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black">{t('callOptions')}</h3>
                  <button onClick={() => setShowCallMenu(false)} className="w-8 h-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>

                <div className="grid gap-3">
                  {[
                    { id: 'updates', label: t('moistureUpdate'), icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                    { id: 'pump_control', label: t('pumpControl'), icon: Power, color: 'text-green-500', bg: 'bg-green-500/10' },
                    { id: 'crop_health', label: t('cropHealth'), icon: Sprout, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { id: 'rain_status', label: t('rainStatus'), icon: CloudRain, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleCall(option.id)}
                      className="flex items-center gap-4 p-4 bg-secondary/40 hover:bg-secondary border border-border rounded-2xl transition-all group active:scale-95"
                    >
                      <div className={`w-10 h-10 rounded-xl ${option.bg} flex items-center justify-center transition-transform group-hover:scale-110`}>
                        <option.icon className={`w-5 h-5 ${option.color}`} />
                      </div>
                      <span className="font-bold text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}

      <main className="container max-w-7xl mx-auto px-6 py-10 overflow-hidden">
        {renderContent()}
      </main>
      <Toaster position="bottom-right" richColors />
    </motion.div>
  );
};

export default App;
