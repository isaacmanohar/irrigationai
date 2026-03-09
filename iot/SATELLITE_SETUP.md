# Satellite Monitoring Setup Guide

## Quick Start

The satellite monitoring system is now fully integrated into the AI Precision Irrigation System. It works out-of-the-box with simulated satellite data for testing and development.

## Features Implemented

### ✓ Backend
- [x] SatelliteData database model
- [x] Satellite API endpoints
- [x] NDVI calculation and interpretation
- [x] Crop health classification
- [x] AI insights generation
- [x] Dashboard integration
- [x] Historical data tracking
- [x] Stress detection

### ✓ Frontend
- [x] Satellite monitoring page
- [x] NDVI visualization
- [x] Health status display
- [x] AI insights panel
- [x] NDVI interpretation scale
- [x] Field map placeholder
- [x] Dashboard integration

## API Endpoints

All endpoints are available at `http://localhost:8000/api/v1/`

### Satellite Endpoints

1. **Get NDVI Data**
   ```
   GET /satellite/ndvi/{field_id}
   ```
   Returns latest NDVI value and crop health status

2. **Get Crop Health**
   ```
   GET /satellite/crop-health/{field_id}
   ```
   Returns health trend and irrigation recommendation

3. **Get Satellite History**
   ```
   GET /satellite/history/{field_id}?limit=30
   ```
   Returns historical NDVI data

4. **Refresh Satellite Data**
   ```
   POST /satellite/refresh/{field_id}
   ```
   Forces refresh of satellite data

### Dashboard Endpoints

5. **Get Satellite Insights**
   ```
   GET /dashboard/satellite-insights/{field_id}
   ```
   Returns AI-generated insights based on satellite data

6. **Get Dashboard Status**
   ```
   GET /dashboard/status/{field_id}
   ```
   Returns complete dashboard data including satellite info

## Testing

Run the test suite to verify all functionality:

```bash
cd iot/backend
python test_satellite_system.py
```

Expected output:
```
✓ NDVI Data Retrieved
✓ Crop Health Retrieved
✓ Satellite History Retrieved
✓ Satellite Insights Retrieved
✓ Satellite Data Refreshed
✓ Dashboard Status Retrieved
✓ NDVI Interpretation Logic
```

## Using Simulated Data (Default)

The system uses simulated satellite data by default. This is perfect for:
- Development and testing
- Demonstrations
- Learning the system
- Testing without Google Earth Engine credentials

Simulated data:
- Generates realistic NDVI values (0.3 - 0.85)
- Consistent for same location
- Updates on demand
- No API calls required

## Enabling Real Satellite Data (Google Earth Engine)

### Prerequisites

1. **Google Cloud Project**
   - Create a project at https://console.cloud.google.com
   - Enable Earth Engine API
   - Create a service account

2. **Install earthengine-api**
   ```bash
   pip install earthengine-api
   ```

3. **Set Up Credentials**

   Option A: Default credentials (development)
   ```bash
   gcloud auth application-default login
   ```

   Option B: Service account (production)
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
   ```

### Configuration

The system automatically detects and uses Google Earth Engine if available. No code changes needed!

### Verification

Check the server logs:
```
✓ Google Earth Engine initialized successfully
```

Or if using simulated data:
```
earthengine-api not installed. Using simulated satellite data.
```

## Data Flow

```
User Request
    ↓
Check if recent data exists (< 7 days)
    ↓
If no recent data:
    ├─ Fetch from Google Earth Engine (if available)
    │  ├─ Get Sentinel-2 imagery
    │  ├─ Calculate NDVI
    │  └─ Store in database
    │
    └─ Or use simulated data
       ├─ Generate realistic NDVI
       └─ Store in database
    ↓
Return data to frontend
    ↓
Display on dashboard
```

## NDVI Interpretation

| NDVI Range | Status | Color | Action |
|-----------|--------|-------|--------|
| 0.0 - 0.3 | Poor vegetation | Red | Immediate irrigation |
| 0.3 - 0.5 | Moderate vegetation | Yellow | Schedule irrigation |
| 0.5 - 0.8 | Healthy vegetation | Green | Monitor |
| 0.8 - 1.0 | Very healthy vegetation | Dark Green | No action needed |

## Irrigation Recommendations

The system combines satellite data with sensor data:

```
IF NDVI < 0.3 AND Soil Moisture < 30%
  → "Critical - Immediate irrigation needed"

IF NDVI < 0.5 AND Soil Moisture < 40%
  → "High - Irrigation recommended"

IF NDVI >= 0.7 AND Soil Moisture >= 50%
  → "Low - No irrigation needed"
```

## Frontend Usage

### Accessing Satellite Data

1. **Dashboard Home Page**
   - Shows satellite health summary
   - Displays latest NDVI value
   - Shows stress alerts

2. **Satellite Page**
   - Full satellite monitoring interface
   - NDVI visualization
   - AI insights
   - Health trend analysis
   - NDVI interpretation guide

3. **Navigation**
   - Click "Satellite" tab in navigation
   - View crop health from satellite imagery
   - Read AI-generated insights
   - Check irrigation recommendations

## Database Schema

### SatelliteData Table

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

## Performance

- **Caching**: Data cached for 7 days
- **Update Frequency**: Every 7 days (Sentinel-2 revisit time)
- **Response Time**: < 100ms (cached) or 2-5s (fresh fetch)
- **Storage**: ~1KB per record

## Troubleshooting

### No Satellite Data Showing

1. Check server logs for errors
2. Verify field has valid coordinates
3. Wait for data to be fetched (first request may take 5-10s)
4. Try refreshing data: `POST /satellite/refresh/{field_id}`

### NDVI Values Seem Wrong

1. Verify field location is correct
2. Check if crop is in growing season
3. Compare with known NDVI ranges for crop type
4. Check image date (should be recent)

### Google Earth Engine Not Working

1. Verify credentials are set up
2. Check API is enabled in Google Cloud
3. Verify quota is available
4. Check network connectivity
5. System will fall back to simulated data

## Example Responses

### Get NDVI Data
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

### Get Crop Health
```json
{
  "field_id": 1,
  "crop_type": "Rice",
  "growth_stage": "Vegetative",
  "health_trend": "Improving",
  "latest_ndvi": 0.72,
  "latest_health_status": "Healthy vegetation",
  "irrigation_recommendation": "Not needed",
  "recommendation_reason": "Healthy NDVI (0.72) and sufficient soil moisture (50%)"
}
```

### Get Satellite Insights
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
  ]
}
```

## Next Steps

1. **Test with Real Data**
   - Set up Google Earth Engine credentials
   - Monitor real satellite imagery
   - Compare with sensor data

2. **Optimize Irrigation**
   - Use satellite insights for scheduling
   - Reduce water usage
   - Improve crop yield

3. **Monitor Trends**
   - Track NDVI over growing season
   - Identify problem areas
   - Plan interventions

4. **Integrate with Alerts**
   - Set up notifications for stress
   - Automate irrigation decisions
   - Generate reports

## Support

For issues or questions:
1. Check the logs: `docker logs <container_id>`
2. Review the documentation: `SATELLITE_MONITORING.md`
3. Run tests: `python test_satellite_system.py`
4. Check API endpoints: `http://localhost:8000/docs`

## References

- [NDVI Calculation](https://en.wikipedia.org/wiki/Normalized_difference_vegetation_index)
- [Sentinel-2 Bands](https://sentinel.esa.int/web/sentinel/user-guides/sentinel-2-msi/resolutions/radiometric)
- [Google Earth Engine](https://developers.google.com/earth-engine)
- [Crop Health Monitoring](https://www.usgs.gov/faqs/what-ndvi-and-how-it-calculated)
