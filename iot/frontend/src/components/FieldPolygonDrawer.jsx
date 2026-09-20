import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Marker,
  Popup,
  ImageOverlay,
  useMapEvents,
  useMap
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Satellite,
  Layers,
  Sparkles,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Sliders,
  Maximize2,
  Eye,
  ShieldCheck,
  Compass,
  FileCode,
  Loader2,
  Calendar,
  CloudSun,
  Activity,
  Grid
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import CropHealthPixelGrid from './CropHealthPixelGrid';

// Custom vertex marker icon
const createVertexIcon = (index, isFirst = false) => {
  return L.divIcon({
    className: 'custom-vertex-marker',
    html: `
      <div style="
        width: ${isFirst ? '18px' : '14px'};
        height: ${isFirst ? '18px' : '14px'};
        background: ${isFirst ? '#10b981' : '#f59e0b'};
        border: 2.5px solid white;
        border-radius: 50%;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
        cursor: move;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 8px;
        font-weight: bold;
      ">
        ${isFirst ? '★' : ''}
      </div>
    `,
    iconSize: isFirst ? [18, 18] : [14, 14],
    iconAnchor: isFirst ? [9, 9] : [7, 7]
  });
};

// Map click handler helper for adding vertices
function MapInteractionHandler({ isDrawing, onAddVertex }) {
  useMapEvents({
    click(e) {
      if (isDrawing) {
        onAddVertex([e.latlng.lat, e.latlng.lng]);
      }
    }
  });
  return null;
}

// Map center adjuster when bounds change
function MapBoundsUpdater({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2 && bounds[0] && bounds[1]) {
      try {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      } catch (err) {
        console.warn('Map fitBounds error:', err);
      }
    }
  }, [bounds, map]);
  return null;
}

// Map center flying updater when user location coordinates change
function MapCenterUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      try {
        map.flyTo(center, 16, { animate: true, duration: 1.2 });
      } catch (err) {
        console.warn('Map flyTo center error:', err);
      }
    }
  }, [center, map]);
  return null;
}

// Preset test farm geometries across key agricultural zones
const PRESET_FARMS = [
  {
    name: 'Telangana Rice Paddy (2.4 ha)',
    center: [17.515397, 78.381715],
    coords: [
      [17.5142, 78.3805],
      [17.5168, 78.3808],
      [17.5171, 78.3832],
      [17.5146, 78.3835]
    ],
    crop: 'Rice'
  },
  {
    name: 'Punjab Wheat Estate (3.8 ha)',
    center: [30.9009, 75.8572],
    coords: [
      [30.8995, 75.8550],
      [30.9025, 75.8552],
      [30.9028, 75.8595],
      [30.8998, 75.8592]
    ],
    crop: 'Wheat'
  },
  {
    name: 'Gujarat Cotton Farm (1.9 ha)',
    center: [22.3038, 70.8021],
    coords: [
      [22.3025, 70.8005],
      [22.3052, 70.8010],
      [22.3050, 70.8040],
      [22.3022, 70.8035]
    ],
    crop: 'Cotton'
  }
];

export default function FieldPolygonDrawer({
  token,
  API_BASE,
  userLat = 17.515397,
  userLon = 78.3817156,
  onOrderProcessed,
  cropType = 'Mixed Crop'
}) {
  // Initial default polygon centered on user coordinates
  const delta = 0.0025;
  const [vertices, setVertices] = useState([
    [userLat - delta, userLon - delta],
    [userLat + delta, userLon - delta],
    [userLat + delta, userLon + delta],
    [userLat - delta, userLon + delta]
  ]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [activeOrbitalMode, setActiveOrbitalMode] = useState('ndvi'); // 'ndvi' (b5), 'planet' (3m RGB), 'rgb' (Sentinel)
  const [viewMode, setViewMode] = useState('dual'); // 'gis', 'grid', 'dual'
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [loading, setLoading] = useState(false);
  const [processingStep, setProcessingStep] = useState(null);
  const [orderResult, setOrderResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [mapCenter, setMapCenter] = useState([userLat, userLon]);
  const [showGeoJsonModal, setShowGeoJsonModal] = useState(false);

  // Sync map center & recalculate field boundary whenever user location changes
  useEffect(() => {
    if (userLat && userLon) {
      const latNum = parseFloat(userLat);
      const lonNum = parseFloat(userLon);
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        const d = 0.0025;
        const newCenter = [latNum, lonNum];
        setMapCenter(newCenter);
        setVertices([
          [latNum - d, lonNum - d],
          [latNum + d, lonNum - d],
          [latNum + d, lonNum + d],
          [latNum - d, lonNum + d]
        ]);
        setOrderResult(null); // Reset satellite order result so user can fetch new imagery for this location
      }
    }
  }, [userLat, userLon]);

  // Calculate live area (acres and hectares) using spherical polygon area
  const calculateArea = (coords) => {
    if (!coords || coords.length < 3) return { sqMeters: 0, ha: 0, acres: 0 };
    const R = 6378137.0; // Earth radius in meters
    let area = 0.0;
    const len = coords.length;
    for (let i = 0; i < len; i++) {
      const p1 = coords[i];
      const p2 = coords[(i + 1) % len];
      const lat1 = (p1[0] * Math.PI) / 180;
      const lat2 = (p2[0] * Math.PI) / 180;
      const lon1 = (p1[1] * Math.PI) / 180;
      const lon2 = (p2[1] * Math.PI) / 180;
      area += (lon2 - lon1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs((area * R * R) / 2.0);
    const ha = area / 10000.0;
    const acres = ha * 2.47105;
    return {
      sqMeters: Math.round(area),
      ha: ha.toFixed(2),
      acres: acres.toFixed(2)
    };
  };

  const farmArea = calculateArea(vertices);

  // Export current vertices as standard GeoJSON Polygon format: [[lon, lat], ...]
  const getGeoJsonPolygon = () => {
    if (!vertices || vertices.length < 3) return null;
    const closed = [...vertices];
    // GeoJSON coordinate order is [longitude, latitude]
    const coords = closed.map((v) => [v[1], v[0]]);
    // Ensure ring is closed
    if (coords[0][0] !== coords[coords.length - 1][0] || coords[0][1] !== coords[coords.length - 1][1]) {
      coords.push(coords[0]);
    }
    return {
      type: 'Polygon',
      coordinates: [coords]
    };
  };

  // Submit GeoJSON to Planet Orders API
  const handleProcessOrdersApi = async () => {
    const geojson = getGeoJsonPolygon();
    if (!geojson) {
      setErrorMsg('Please draw at least 3 points to complete your field boundary.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setProcessingStep('1. Querying Planet Data API (cloud_cover <= 0.05, last 60 days)...');

    try {
      // Step 1: Update step indicator
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep('2. Submitting Orders API v2 (Bundle: analytic_sr_udm2 + Clip Tool + Bandmath)...');

      const response = await axios.post(
        `${API_BASE}/satellite/orders/process-polygon`,
        {
          geometry: geojson,
          crop_type: cropType,
          cloud_cover_limit: 0.05
        },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );

      setProcessingStep('3. Executing Bandmath b5=(b4-b3)/(b4+b3) & 3m Surface Reflectance Compositing...');
      await new Promise((r) => setTimeout(r, 800));

      const data = response.data;
      setOrderResult(data);
      if (onOrderProcessed) {
        onOrderProcessed(data);
      }

      // Automatically switch to NDVI Health Map mode
      setActiveOrbitalMode('ndvi');
      setProcessingStep(null);
    } catch (err) {
      console.error('Planet Orders processing failed:', err);
      const detail = err.response?.data?.detail || err.message || 'Failed to process Planet order.';
      setErrorMsg(detail);
      setProcessingStep(null);
    } finally {
      setLoading(false);
    }
  };

  // Dragging vertex updates coordinates
  const handleVertexDrag = (index, newLatLng) => {
    const updated = [...vertices];
    updated[index] = [newLatLng.lat, newLatLng.lng];
    setVertices(updated);
  };

  // Add new vertex in draw mode
  const handleAddVertex = (latlng) => {
    setVertices((prev) => [...prev, latlng]);
  };

  // Clear polygon
  const handleClear = () => {
    setVertices([]);
    setOrderResult(null);
    setErrorMsg(null);
    setIsDrawing(true);
  };

  // Load preset farm
  const handleLoadPreset = (preset) => {
    setVertices(preset.coords);
    setMapCenter(preset.center);
    setOrderResult(null);
    setIsDrawing(false);
  };

  // Compute map bounding box
  const getBounds = () => {
    if (orderResult?.layers?.bounds) {
      return orderResult.layers.bounds;
    }
    if (vertices.length >= 2) {
      const lats = vertices.map((v) => v[0]);
      const lngs = vertices.map((v) => v[1]);
      return [
        [Math.min(...lats), Math.min(...lngs)],
        [Math.max(...lats), Math.max(...lngs)]
      ];
    }
    return [
      [userLat - delta, userLon - delta],
      [userLat + delta, userLon + delta]
    ];
  };

  // Determine active raster overlay URL based on 3-way toggle
  const getActiveOverlayUrl = () => {
    if (!orderResult?.layers) return null;
    if (activeOrbitalMode === 'ndvi') {
      return orderResult.layers.ndvi_heatmap_url;
    }
    if (activeOrbitalMode === 'planet') {
      return orderResult.layers.true_color_url;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Top Control Bar ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border p-6 rounded-[2rem] shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">
                Planet Labs Orders API v2 · SuperDove PSB.SD 3m HD
              </span>
            </div>
            <h3 className="text-2xl font-black text-foreground">Interactive Field Boundary & Spectral Orders</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Draw your exact field polygon. Server clips acreage and executes <strong>Bandmath b5 = (b4-b3)/(b4+b3)</strong> for Float32 NDVI.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsDrawing(!isDrawing)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 border active:scale-95 ${
                isDrawing
                  ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/20'
                  : 'bg-secondary/60 hover:bg-secondary text-foreground border-border'
              }`}
            >
              <Scissors size={14} />
              <span>{isDrawing ? 'Finish Drawing' : 'Draw Boundary'}</span>
            </button>

            <button
              onClick={handleClear}
              className="px-3.5 py-2.5 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>

            <button
              onClick={() => setShowGeoJsonModal(true)}
              className="px-3.5 py-2.5 bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border rounded-xl font-bold text-xs transition-all active:scale-95 flex items-center gap-1.5"
              title="Inspect GeoJSON Payload"
            >
              <FileCode size={13} />
              <span>GeoJSON</span>
            </button>

            <button
              onClick={handleProcessOrdersApi}
              disabled={loading || vertices.length < 3}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Processing Order…</span>
                </>
              ) : (
                <>
                  <Zap size={15} className="text-amber-300 fill-amber-300" />
                  <span>Execute Planet Order</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Presets & Area Stats */}
        <div className="mt-5 pt-4 border-t border-border flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Quick Presets:</span>
            {PRESET_FARMS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleLoadPreset(preset)}
                className="px-3 py-1 bg-secondary/40 hover:bg-secondary border border-border/80 rounded-lg text-[11px] font-semibold text-foreground transition-all hover:border-primary/40"
              >
                {preset.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 bg-secondary/30 px-4 py-1.5 rounded-xl border border-border/60">
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Vertices:</span>
              <span className="font-mono font-bold text-foreground">{vertices.length}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground font-medium">Field Area:</span>
              <span className="font-mono font-black text-emerald-400">
                {farmArea.acres} Acres ({farmArea.ha} ha)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Processing Step Banner ───────────────────────────────────────── */}
      <AnimatePresence>
        {processingStep && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-gradient-to-r from-emerald-950/50 via-teal-950/40 to-slate-900 border border-emerald-500/40 rounded-2xl flex items-center justify-between gap-4 shadow-lg backdrop-blur-md"
          >
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-emerald-400" />
              <span className="text-xs font-bold text-emerald-200">{processingStep}</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400/80 bg-black/40 px-2.5 py-1 rounded border border-emerald-500/20">
              Orders API Pipeline Active
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* ── Main Map Canvas & Controls ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          {/* Main Container Card */}
          <div className="bg-card border border-border rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            {/* Map Top Bar with Layout Mode & Orbital Mode Switchers */}
            <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-secondary/20">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Satellite className="text-primary" size={18} />
                  <span className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    Orbital Viewport
                  </span>
                </div>

                {/* View Layout Switcher (GIS Map, 8x6 Sub-Plot Grid, Dual Split) */}
                <div className="flex bg-secondary/80 p-1 rounded-xl border border-border text-[10px] font-bold">
                  <button
                    onClick={() => setViewMode('gis')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      viewMode === 'gis'
                        ? 'bg-primary text-primary-foreground font-black shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Satellite size={12} />
                    <span>GIS Map</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      viewMode === 'grid'
                        ? 'bg-emerald-500 text-black font-black shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Grid size={12} />
                    <span>8x6 Pixel Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode('dual')}
                    className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                      viewMode === 'dual'
                        ? 'bg-amber-500 text-black font-black shadow'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers size={12} />
                    <span>Dual View</span>
                  </button>
                </div>
              </div>

              {/* 3-Way Orbital Spectral Layer Switcher */}
              <div className="flex items-center gap-2">
                <div className="flex bg-secondary/70 p-1 rounded-xl border border-border">
                  <button
                    onClick={() => setActiveOrbitalMode('ndvi')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeOrbitalMode === 'ndvi'
                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Activity size={12} />
                    <span>Health Map (NDVI)</span>
                  </button>

                  <button
                    onClick={() => setActiveOrbitalMode('planet')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeOrbitalMode === 'planet'
                        ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Sparkles size={12} />
                    <span>Planet (3m HD)</span>
                  </button>

                  <button
                    onClick={() => setActiveOrbitalMode('rgb')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      activeOrbitalMode === 'rgb'
                        ? 'bg-primary text-primary-foreground shadow-lg'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers size={12} />
                    <span>Natural Photo</span>
                  </button>
                </div>

                {/* Opacity Slider */}
                {orderResult && activeOrbitalMode !== 'rgb' && (
                  <div className="hidden sm:flex items-center gap-2 bg-secondary/50 px-3 py-1 rounded-xl border border-border text-[10px] font-bold text-muted-foreground">
                    <Sliders size={12} />
                    <span>Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={overlayOpacity}
                      onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
                      className="w-16 accent-emerald-500 cursor-pointer"
                    />
                    <span className="font-mono text-foreground">{Math.round(overlayOpacity * 100)}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Leaflet GIS Map Canvas (shown in 'gis' or 'dual' viewMode) */}
            {(viewMode === 'gis' || viewMode === 'dual') && (
              <div className="relative h-[520px] w-full bg-slate-950">
                <MapContainer
                  center={mapCenter}
                  zoom={16}
                  scrollWheelZoom={true}
                  style={{ height: '100%', width: '100%' }}
                >
                  <MapInteractionHandler isDrawing={isDrawing} onAddVertex={handleAddVertex} />
                  <MapCenterUpdater center={mapCenter} />
                  <MapBoundsUpdater bounds={getBounds()} />

                  {/* High-Resolution Satellite Base Layer (Esri World Imagery) */}
                  <TileLayer
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    maxZoom={19}
                  />

                  {/* Interactive Farmer Polygon */}
                  {vertices.length >= 3 && (
                    <Polygon
                      positions={vertices}
                      pathOptions={{
                        color: activeOrbitalMode === 'ndvi' ? '#10b981' : '#f59e0b',
                        weight: 2.5,
                        dashArray: isDrawing ? '6, 6' : undefined,
                        fillOpacity: orderResult && activeOrbitalMode !== 'rgb' ? 0.05 : 0.25,
                        fillColor: activeOrbitalMode === 'ndvi' ? '#10b981' : '#f59e0b'
                      }}
                    />
                  )}

                  {/* Draggable Vertex Markers */}
                  {vertices.map((vertex, index) => (
                    <Marker
                      key={`vertex-${index}`}
                      position={vertex}
                      draggable={!loading}
                      icon={createVertexIcon(index, index === 0)}
                      eventHandlers={{
                        dragend: (e) => handleVertexDrag(index, e.target.getLatLng())
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1">
                          <strong className="text-primary font-bold">Vertex {index + 1}</strong>
                          <br />
                          Lat: {vertex[0].toFixed(6)}
                          <br />
                          Lon: {vertex[1].toFixed(6)}
                          <br />
                          <span className="text-muted-foreground text-[10px]">Drag to adjust boundary</span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Processed Planet Orders High-Res Raster Overlay */}
                  {orderResult?.layers && getActiveOverlayUrl() && (
                    <ImageOverlay
                      url={getActiveOverlayUrl()}
                      bounds={orderResult.layers.bounds}
                      opacity={overlayOpacity}
                    />
                  )}
                </MapContainer>

                {/* Drawing Mode Guide Badge */}
                {isDrawing && (
                  <div className="absolute top-4 left-4 z-[1000] bg-black/85 text-amber-300 backdrop-blur-md px-3.5 py-2 rounded-xl border border-amber-500/40 text-xs font-bold flex items-center gap-2 shadow-xl">
                    <Scissors size={14} className="animate-spin" />
                    <span>Click map to place field perimeter points</span>
                  </div>
                )}

                {/* Active Layer Watermark Badge */}
                <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono text-slate-200 flex items-center gap-2 shadow-xl">
                  <span className={`w-2 h-2 rounded-full ${orderResult ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
                  <span>
                    {activeOrbitalMode === 'ndvi'
                      ? 'Layer: Float32 NDVI Heatmap (b5 = (b4-b3)/(b4+b3))'
                      : activeOrbitalMode === 'planet'
                      ? 'Layer: PlanetScope 3m True Color RGB (Clipped AOI)'
                      : 'Layer: Regional Sentinel-2 Satellite Base'}
                  </span>
                </div>

                {/* NDVI Color Scale Legend */}
                {activeOrbitalMode === 'ndvi' && (
                  <div className="absolute bottom-4 right-4 z-[1000] bg-black/85 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl flex flex-col gap-1 text-[10px] font-bold">
                    <div className="text-slate-300 uppercase tracking-widest text-[9px] mb-1">NDVI Scale</div>
                    <div className="h-2 w-36 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-emerald-500 shadow-inner" />
                    <div className="flex justify-between text-slate-400 font-mono mt-0.5">
                      <span>0.1 (Stress)</span>
                      <span>0.5</span>
                      <span>0.9 (Vigorous)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 8x6 Rounded Micro-Plot Crop Health Matrix Grid Map (shown in 'grid' or 'dual' viewMode) */}
          {(viewMode === 'grid' || viewMode === 'dual') && (
            <CropHealthPixelGrid
              meanNdvi={orderResult?.metrics?.mean_ndvi || 0.582}
              healthyPct={orderResult?.metrics?.healthy_area_pct || 78.4}
              stressedPct={orderResult?.metrics?.stressed_area_pct || 8.6}
              cropType={cropType}
            />
          )}
        </div>

        {/* ── Order Specs & Crop Health Telemetry Sidebar ─────────────────── */}
        <div className="space-y-6 flex flex-col">
          {/* 1. Zonal Crop Health Metrics */}
          <div className="bg-card border border-border p-6 rounded-[2.5rem] shadow-xl flex-1 flex flex-col justify-between">
            <div>
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-2">
                Zonal Crop Health Analysis
              </div>
              <div className="flex items-baseline gap-3 mb-3">
                <div className="text-5xl font-black text-emerald-400 font-display">
                  {orderResult?.metrics?.mean_ndvi?.toFixed(3) || '0.582'}
                </div>
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Mean NDVI
                </div>
              </div>

              <div
                className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-5 ${
                  (orderResult?.metrics?.mean_ndvi || 0.58) >= 0.55
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : (orderResult?.metrics?.mean_ndvi || 0.58) >= 0.35
                    ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}
              >
                <CheckCircle2 size={12} />
                <span>{orderResult?.metrics?.health_status || 'Optimal Photosynthesis'}</span>
              </div>

              {/* Zonal Breakdown Bars */}
              <div className="space-y-3 pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-emerald-400">Healthy Canopy (NDVI &ge; 0.55)</span>
                    <span className="text-foreground">{orderResult?.metrics?.healthy_area_pct || 78.4}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${orderResult?.metrics?.healthy_area_pct || 78.4}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-rose-400">Vegetation Stress / Dry (NDVI &lt; 0.35)</span>
                    <span className="text-foreground">{orderResult?.metrics?.stressed_area_pct || 8.6}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${orderResult?.metrics?.stressed_area_pct || 8.6}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Planet Scene Metadata */}
            <div className="mt-6 pt-4 border-t border-border space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Planet Scene ID:</span>
                <span className="font-mono text-foreground font-bold">
                  {orderResult?.scene?.id ? orderResult.scene.id.slice(0, 18) + '…' : '20260918_045210_PSB'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Acquisition Date:</span>
                <span className="text-foreground font-semibold">
                  {orderResult?.scene?.acquired ? orderResult.scene.acquired.split('T')[0] : '2026-09-18'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Cloud Cover Filter:</span>
                <span className="text-emerald-400 font-bold">&le; 0.05 (&le; 5%)</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Spatial Resolution:</span>
                <span className="text-amber-400 font-bold">3.0m (PSScene SuperDove)</span>
              </div>
            </div>
          </div>

          {/* 2. Orders API Tool Spec Card */}
          <div className="bg-card border border-border p-6 rounded-[2.5rem] shadow-xl space-y-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-primary" size={18} />
              <h4 className="font-extrabold text-sm text-foreground">Planet Orders API Pipeline</h4>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-secondary/40 rounded-xl border border-border/60">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Product Bundle</div>
                <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">analytic_sr_udm2</div>
                <p className="text-[10px] text-muted-foreground mt-0.5">Surface Reflectance + Usable Data Mask 2.0</p>
              </div>

              <div className="p-3 bg-secondary/40 rounded-xl border border-border/60">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Server Tool 1: Clip AOI</div>
                <p className="text-[11px] text-foreground mt-0.5">
                  GeoJSON boundary clipped server-side; consumes quota for exact acreage only.
                </p>
              </div>

              <div className="p-3 bg-secondary/40 rounded-xl border border-border/60">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Server Tool 2: Bandmath</div>
                <div className="font-mono text-[11px] text-amber-400 font-bold mt-0.5">
                  b5 = (b4-b3)/(b4+b3)
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">pixel_type="32R" Float32 NDVI computation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── GeoJSON Modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showGeoJsonModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowGeoJsonModal(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-2xl bg-card border border-border rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <FileCode className="text-primary" size={20} />
                  <h3 className="text-lg font-black">GeoJSON Polygon AOI Payload</h3>
                </div>
                <button
                  onClick={() => setShowGeoJsonModal(false)}
                  className="px-3 py-1 bg-secondary rounded-lg text-xs font-bold hover:bg-secondary/80"
                >
                  Close
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                This GeoJSON payload is passed directly into Planet Orders API v2 under the <code>clip.aoi</code> tool and saved in the field database.
              </p>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-border text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-80">
                {JSON.stringify(getGeoJsonPolygon(), null, 2)}
              </pre>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
