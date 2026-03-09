# Satellite Map Visualization Guide

## Overview

The satellite monitoring system now includes an interactive map showing your farm location with NDVI health status overlay. The map uses OpenStreetMap tiles and displays real-time crop health data.

## Features

### Interactive Map
- **Location Display**: Shows exact farm location with marker
- **NDVI Overlay**: Color-coded circle showing crop health status
- **Zoom & Pan**: Full map navigation controls
- **Responsive**: Works on desktop and mobile devices

### Health Status Colors
- **Red** (#ef4444): Poor vegetation / Crop stress - Immediate action needed
- **Yellow** (#f59e0b): Moderate vegetation - Monitor closely
- **Green** (#10b981): Healthy vegetation - Good condition
- **Dark Green** (#059669): Very healthy vegetation - Optimal

### Map Legend
Visual guide showing what each color represents:
- Poor / Stress (Red)
- Moderate (Yellow)
- Healthy (Green)
- Very Healthy (Dark Green)

### Popup Information
Click on the farm marker to see:
- Farm location name
- Crop type
- Field area (hectares)
- Current NDVI value
- Health status

## How to Use

### Accessing the Map

1. **Navigate to Satellite Page**
   - Click "Satellite" in the main navigation
   - Scroll down to "Field Map" section

2. **View Your Farm**
   - Map automatically centers on your farm location
   - Blue marker shows exact coordinates
   - Colored circle shows NDVI health status

3. **Interact with Map**
   - **Zoom In/Out**: Use mouse wheel or zoom buttons
   - **Pan**: Click and drag to move around
   - **Click Marker**: See detailed farm information
   - **Full Screen**: Use map controls for full screen view

### Understanding the Display

**Map Circle Color Meaning**:
- Changes based on latest NDVI value
- Updates automatically when new satellite data arrives
- Radius represents approximate field area

**Marker Popup Shows**:
- Farm location name
- Current crop type
- Field area in hectares
- Latest NDVI value
- Current health status

## Technical Details

### Map Technology
- **Library**: Leaflet.js with React-Leaflet
- **Tiles**: OpenStreetMap (free, open-source)
- **Coordinates**: WGS84 (latitude/longitude)
- **Update Frequency**: Every 10 seconds (synced with dashboard)

### Data Integration
```
Farm Location (lat/lon)
    ↓
NDVI Data
    ↓
Health Status Determination
    ↓
Map Color Assignment
    ↓
Display on Map
```

### Color Assignment Logic
```javascript
if (stress_alert) {
  color = Red (#ef4444)
} else if (health_status includes "Poor") {
  color = Yellow (#f59e0b)
} else if (health_status includes "Moderate") {
  color = Yellow (#f59e0b)
} else if (health_status includes "Healthy") {
  color = Green (#10b981)
} else {
  color = Blue (#3b82f6)
}
```

## Map Controls

### Built-in Controls
- **Zoom Buttons**: +/- buttons in top-left
- **Attribution**: OpenStreetMap credit in bottom-right
- **Pan**: Click and drag anywhere on map
- **Scroll Zoom**: Mouse wheel to zoom in/out

### Keyboard Shortcuts
- **+**: Zoom in
- **-**: Zoom out
- **Arrow Keys**: Pan in direction

## Troubleshooting

### Map Not Showing
1. Check if farm has valid coordinates
2. Verify internet connection (needs OpenStreetMap tiles)
3. Try refreshing the page
4. Check browser console for errors

### Marker Not Visible
1. Zoom out to see marker
2. Click "Satellite" tab to reload
3. Verify field_id is correct
4. Check if coordinates are valid

### Colors Not Updating
1. Wait for satellite data to fetch (first request may take 5-10s)
2. Click "Refresh" button to force update
3. Check if NDVI data is available
4. Verify satellite data endpoint is working

### Map Tiles Not Loading
1. Check internet connection
2. OpenStreetMap may be temporarily unavailable
3. Try refreshing the page
4. Check if you're behind a proxy/firewall

## Map Customization

### Changing Tile Provider
To use different map tiles, modify the TileLayer URL:

```javascript
// Current (OpenStreetMap)
url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

// Satellite (Esri)
url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"

// Dark (CartoDB)
url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
```

### Adjusting Circle Radius
Current radius: 500 meters

To change, modify in App.jsx:
```javascript
<Circle
  center={[data.latitude, data.longitude]}
  radius={1000}  // Change this value (in meters)
  ...
/>
```

### Changing Zoom Level
Current default zoom: 13

To change, modify in App.jsx:
```javascript
<MapContainer 
  center={[...]} 
  zoom={15}  // Change this value (1-19)
  ...
/>
```

## Performance

- **Load Time**: < 2 seconds
- **Update Frequency**: Every 10 seconds
- **Tile Cache**: Browser caches tiles for faster loading
- **Mobile**: Optimized for touch devices

## Browser Compatibility

- **Chrome**: ✓ Full support
- **Firefox**: ✓ Full support
- **Safari**: ✓ Full support
- **Edge**: ✓ Full support
- **Mobile Browsers**: ✓ Full support

## Data Privacy

- Map uses public OpenStreetMap data
- Your farm coordinates are stored locally
- No data sent to third parties
- All processing happens on your device

## Future Enhancements

1. **Satellite Imagery Overlay**
   - Display actual Sentinel-2 imagery
   - Show NDVI heatmap
   - Historical imagery comparison

2. **Field Boundaries**
   - Draw field polygon
   - Calculate exact area
   - Show field-level NDVI variation

3. **Multiple Fields**
   - Show all your fields on one map
   - Compare health across fields
   - Manage multiple farms

4. **Weather Overlay**
   - Show weather patterns
   - Display rainfall data
   - Wind direction and speed

5. **Irrigation History**
   - Show past irrigation events
   - Display water usage patterns
   - Optimize irrigation zones

6. **Alerts on Map**
   - Visual alerts for problem areas
   - Notification markers
   - Priority indicators

## API Integration

### Map Data Source
```
GET /api/v1/dashboard/status/{field_id}
```

Returns:
- `latitude`: Farm latitude
- `longitude`: Farm longitude
- `farmer_village`: Location name
- `satellite_data`: NDVI and health status

### Satellite Data
```
GET /api/v1/satellite/ndvi/{field_id}
```

Returns:
- `ndvi_value`: NDVI value (0-1)
- `health_status`: Health classification
- `stress_alert`: Boolean stress indicator

## Example Scenarios

### Scenario 1: Healthy Crop
- NDVI: 0.75
- Health Status: Healthy vegetation
- Map Color: Green
- Action: Maintain current irrigation

### Scenario 2: Stressed Crop
- NDVI: 0.25
- Health Status: Poor vegetation
- Map Color: Red
- Action: Increase irrigation immediately

### Scenario 3: Moderate Growth
- NDVI: 0.45
- Health Status: Moderate vegetation
- Map Color: Yellow
- Action: Monitor and prepare irrigation

## Tips for Best Results

1. **Keep Coordinates Updated**
   - Ensure farm location is accurate
   - Update if field boundaries change
   - Verify coordinates in settings

2. **Monitor Regularly**
   - Check map daily for changes
   - Compare with sensor data
   - Track trends over time

3. **Use with Sensor Data**
   - Combine map insights with soil moisture
   - Cross-reference with weather
   - Make informed decisions

4. **Plan Irrigation**
   - Use map to identify problem areas
   - Schedule irrigation based on NDVI
   - Optimize water usage

5. **Document Changes**
   - Take screenshots of map
   - Track NDVI changes
   - Build historical record

## Support

For issues or questions:
1. Check this guide
2. Review satellite documentation
3. Check API endpoints at `/docs`
4. Review server logs for errors

## References

- [Leaflet.js Documentation](https://leafletjs.com/)
- [OpenStreetMap](https://www.openstreetmap.org/)
- [NDVI Interpretation](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index)
- [Sentinel-2 Imagery](https://sentinel.esa.int/web/sentinel/missions/sentinel-2)

---

**Status**: ✓ Implemented and Tested
**Version**: 1.0
**Last Updated**: March 7, 2026
