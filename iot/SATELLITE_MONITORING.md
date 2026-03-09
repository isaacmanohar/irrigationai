# Satellite-Based Crop Monitoring System

## Overview

The AI Precision Irrigation System now includes satellite-based crop monitoring using NDVI (Normalized Difference Vegetation Index) analysis. This feature integrates satellite imagery with sensor data and AI predictions to provide comprehensive crop health monitoring and irrigation recommendations.

## Features

### 1. NDVI Calculation
- **Formula**: NDVI = (NIR - Red) / (NIR + Red)
  - NIR: Near Infrared band
  - Red: Red band
- **Data Source**: Sentinel-2 satellite imagery via Google Earth Engine API
- **Update Frequency**: Every 7 days (when new cloud-free imagery is available)

### 2. Crop Health Classification
Based on NDVI values:
- **0.0 - 0.3**: Poor vegetation / Crop stress (Red)
- **0.3 - 0.5**: Moderate vegetation (Yellow)
- **0.5 - 0.8**: Healthy vegetation (Green)
- **0.8 - 1.0**: Very healthy vegetation (Dark Green)

### 3. Irrigation Decision Support
The system combines satellite data with sensor data:
- **Critical**: NDVI < 0.3 AND Soil Moisture < 30% → Immediate irrigation needed
- **High**: NDVI < 0.5 AND Soil Moisture < 40% → Irrigation recommended
- **Low**: NDVI >= 0.7 AND Soil Moisture >= 50% → No irrigation needed

### 4. AI Insights
Automated analysis provides:
- Crop health trend analysis (Improving/Declining/Stable)
- Stress detection and alerts
- Actionable recommendations
- Temperature and humidity considerations

## Backend Implementation

### Database Schema

#### SatelliteData Table
```sql
CREATE TABLE satellite_data (
    id INTEGER PRIMARY KEY,
    field_id INTEGER FOREIGN KEY,
    ndvi_value FLOAT,
    health_status VARCHAR,
    stress_alert BOOLEAN,
    image_date DATETIME,
    timestamp DATETIME
);
```

### API Endpoints

#### 1. Get Latest NDVI Data
```
GET /api/v1/satellite/ndvi/{field_id}
```
**Response**:
```json
{
  "field_id": 1,
  "ndvi_value": 0.72,
  "health_status": "Healthy vegetation",
  "stress_alert": false,
  "image_date": "2026-03-05",
  "fetched_at": "2026-03-07T10:30:00",
  "source": "Sentinel-2"
}
```

#### 2. Get Crop Health Status
```
GET /api/v1/satellite/crop-health/{field_id}
```
**Response**:
```json
{
  "field_id": 1,
  "crop_type": "Rice",
  "growth_stage": "Vegetative",
  "health_trend": "Improving",
  "latest_ndvi": 0.72,
  "latest_health_status": "Healthy vegetation",
  "irrigation_recommendation": "Not needed",
  "recommendation_reason": "Healthy NDVI (0.72) and sufficient soil moisture (50%)",
  "ndvi_history": [...]
}
```

#### 3. Get Satellite History
```
GET /api/v1/satellite/history/{field_id}?limit=30
```
**Response**:
```json
{
  "field_id": 1,
  "total_records": 10,
  "history": [
    {
      "id": 1,
      "ndvi_value": 0.72,
      "health_status": "Healthy vegetation",
      "stress_alert": false,
      "image_date": "2026-03-05",
      "fetched_at": "2026-03-07T10:30:00"
    }
  ]
}
```

#### 4. Refresh Satellite Data
```
POST /api/v1/satellite/refresh/{field_id}
```
**Response**:
```json
{
  "status": "success",
  "message": "Satellite data refreshed",
  "ndvi_value": 0.72,
  "health_status": "Healthy vegetation",
  "stress_alert": false,
  "image_date": "2026-03-05",
  "fetched_at": "2026-03-07T10:30:00"
}
```

#### 5. Get Satellite Insights
```
GET /api/v1/dashboard/satellite-insights/{field_id}
```
**Response**:
```json
{
  "field_id": 1,
  "crop_type": "Rice",
  "latest_ndvi": 0.72,
  "health_trend": "Improving",
  "insights": [
    {
      "type": "positive",
      "message": "Excellent crop health with NDVI of 0.72.",
      "action": "Maintain current irrigation schedule"
    }
  ],
  "last_updated": "2026-03-07T10:30:00"
}
```

### Service Implementation

#### SatelliteService (`app/services/satellite.py`)

**Key Methods**:

1. **`get_ndvi(lat, lon, days_back=30)`**
   - Fetches NDVI from Google Earth Engine or returns simulated data
   - Filters for cloud-free Sentinel-2 imagery
   - Calculates NDVI using NIR and Red bands
   - Returns NDVI value, health status, and stress alert

2. **`get_crop_health_trend(field_id, db_session)`**
   - Analyzes NDVI trend over time
   - Determines if crop health is improving, declining, or stable
   - Returns historical NDVI records

3. **`_interpret_ndvi(ndvi_value)`**
   - Converts NDVI value to health status
   - Determines stress alert status

### Enhanced Prediction Service

The prediction service now includes satellite data:

```python
predictor.predict_with_satellite(
    sensor_features={'soil_moisture': 40, 'temperature': 31, 'humidity': 65},
    ndvi_value=0.72,
    health_status='Healthy vegetation'
)
```

**Returns**:
```json
{
  "recommendation": "Low - No irrigation needed",
  "base_prediction": "Low",
  "ndvi_factor": "Considered",
  "confidence": "High"
}
```

## Frontend Implementation

### Satellite Monitoring Page

Located in the dashboard navigation, the Satellite page displays:

1. **Crop Health (NDVI) Card**
   - Large NDVI value display
   - Health status badge with color coding
   - Stress alert indicator
   - Image date and data source

2. **AI Insights Panel**
   - Critical alerts (red)
   - Warnings (yellow)
   - Positive observations (green)
   - Actionable recommendations

3. **NDVI Interpretation Scale**
   - Visual color scale showing NDVI ranges
   - Health status descriptions
   - Reference guide for farmers

4. **Field Map**
   - Farm location display
   - NDVI overlay visualization
   - Satellite imagery reference

### Dashboard Integration

The home page includes a satellite health summary showing:
- Latest NDVI value
- Health status
- Stress alerts
- Integration with irrigation recommendations

## Google Earth Engine Setup

### Prerequisites
1. Google Cloud Project with Earth Engine API enabled
2. Service account credentials (for production)
3. `earthengine-api` Python package

### Installation
```bash
pip install earthengine-api
```

### Authentication
```python
import ee
ee.Initialize()  # Uses default credentials
```

### For Production
Use service account credentials:
```python
import ee
credentials = ee.ServiceAccountCredentials(
    email='your-service-account@project.iam.gserviceaccount.com',
    key_file='path/to/key.json'
)
ee.Initialize(credentials)
```

## Data Flow

```
1. Farmer registers field with location (lat/lon)
   ↓
2. System fetches Sentinel-2 imagery from Google Earth Engine
   ↓
3. NDVI calculated from NIR and Red bands
   ↓
4. NDVI value stored in database with timestamp
   ↓
5. Health status determined based on NDVI range
   ↓
6. Combined with sensor data (soil moisture, temperature)
   ↓
7. AI generates insights and irrigation recommendations
   ↓
8. Dashboard displays satellite monitoring and insights
   ↓
9. Farmer receives AI-powered irrigation advice
```

## Fallback Behavior

If Google Earth Engine is unavailable:
- System uses simulated NDVI data based on location
- Maintains consistent data for testing and development
- Seamlessly switches to real data when GEE becomes available

## Performance Considerations

1. **Caching**: Satellite data cached for 7 days to reduce API calls
2. **Batch Processing**: Can process multiple fields in parallel
3. **Cloud Filtering**: Automatically filters cloud-covered imagery
4. **Async Operations**: Non-blocking satellite data fetching

## Future Enhancements

1. **Multi-Spectral Analysis**: Use additional bands for disease detection
2. **Temporal Analysis**: Track vegetation changes over growing season
3. **Precision Mapping**: Field-level NDVI variation mapping
4. **Predictive Modeling**: Forecast crop health based on trends
5. **Integration with Weather**: Combine satellite data with weather patterns
6. **Mobile Alerts**: Push notifications for critical NDVI changes

## Troubleshooting

### No Satellite Data Available
- Check if field location (lat/lon) is valid
- Verify Google Earth Engine API is enabled
- Check for cloud cover in the region
- Wait for next satellite pass (typically 5-10 days)

### NDVI Values Seem Incorrect
- Verify field coordinates are accurate
- Check if image date is recent
- Ensure crop is in growing season
- Compare with known NDVI ranges for crop type

### API Errors
- Verify authentication credentials
- Check API rate limits
- Ensure sufficient quota in Google Cloud Project
- Review error logs for specific issues

## References

- [NDVI Calculation](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index)
- [Sentinel-2 Bands](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi/resolutions/radiometric)
- [Google Earth Engine API](https://developers.google.com/earth-engine)
- [Crop Health Monitoring](https://www.usgs.gov/faqs/what-ndvi-and-how-it-calculated)
