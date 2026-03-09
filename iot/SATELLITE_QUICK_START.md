# Satellite Monitoring - Quick Start Guide

## What's New?

Your AI Precision Irrigation System now includes satellite-based crop monitoring with:
- ✓ Real-time NDVI (crop health) monitoring
- ✓ Interactive satellite map with health overlay
- ✓ AI-powered irrigation recommendations
- ✓ Crop stress detection and alerts
- ✓ Historical trend analysis

## Getting Started (5 Minutes)

### 1. Access Satellite Monitoring
```
Dashboard → Click "Satellite" tab
```

### 2. View Your Farm Map
- Interactive map shows your farm location
- Color circle indicates crop health
- Click marker for detailed information

### 3. Check Crop Health
- **NDVI Value**: 0.0 - 1.0 scale
- **Health Status**: Poor → Moderate → Healthy → Very Healthy
- **Stress Alert**: Red warning if crop is stressed

### 4. Read AI Insights
- Automated analysis of satellite data
- Actionable recommendations
- Irrigation suggestions

### 5. Make Decisions
- Use insights to plan irrigation
- Combine with soil moisture data
- Optimize water usage

## Color Guide

| Color | NDVI Range | Meaning | Action |
|-------|-----------|---------|--------|
| 🔴 Red | 0.0-0.3 | Poor/Stressed | Irrigate now |
| 🟡 Yellow | 0.3-0.5 | Moderate | Monitor |
| 🟢 Green | 0.5-0.8 | Healthy | Good |
| 🟢 Dark Green | 0.8-1.0 | Very Healthy | Optimal |

## Key Features

### Satellite Map
- Shows farm location
- NDVI health overlay
- Zoom and pan controls
- Detailed popup information

### NDVI Interpretation
- Visual scale showing all ranges
- Health status descriptions
- Reference guide

### AI Insights
- Critical alerts (red)
- Warnings (yellow)
- Positive observations (green)
- Specific actions to take

### Irrigation Recommendations
- Based on NDVI + soil moisture
- Critical → High → Low priority
- Specific reasons provided

## Common Tasks

### Check Current Crop Health
1. Go to Satellite page
2. Look at NDVI value
3. Check health status badge
4. Read AI insights

### View Farm on Map
1. Go to Satellite page
2. Scroll to Field Map
3. Zoom in/out as needed
4. Click marker for details

### Get Irrigation Advice
1. Check NDVI value
2. Check soil moisture (Soil Health page)
3. Read AI insights
4. Follow recommendations

### Track Health Trends
1. Go to Satellite page
2. Check "Health Trend" indicator
3. View NDVI history
4. Compare over time

### Refresh Satellite Data
1. Go to Satellite page
2. Click "Refresh" button
3. Wait for new data
4. Check updated values

## Data Updates

- **Satellite Data**: Updates every 7 days (when new imagery available)
- **Dashboard**: Updates every 10 seconds
- **Manual Refresh**: Available anytime
- **Caching**: Recent data cached for performance

## Understanding NDVI

**NDVI = (NIR - Red) / (NIR + Red)**

- **NIR**: Near Infrared light (invisible to humans)
- **Red**: Red light (visible)
- **Result**: 0.0 (no vegetation) to 1.0 (dense vegetation)

**What It Means**:
- Higher NDVI = Healthier crop
- Lower NDVI = Stressed crop
- Declining NDVI = Problem developing
- Stable NDVI = Consistent growth

## Irrigation Decision Logic

```
IF NDVI < 0.3 AND Soil Moisture < 30%
  → CRITICAL: Irrigate immediately

IF NDVI < 0.5 AND Soil Moisture < 40%
  → HIGH: Schedule irrigation soon

IF NDVI >= 0.7 AND Soil Moisture >= 50%
  → LOW: No irrigation needed now
```

## Tips for Success

1. **Check Daily**
   - Monitor crop health trends
   - Catch problems early
   - Plan ahead

2. **Combine Data**
   - Use satellite + soil moisture
   - Check weather forecast
   - Make informed decisions

3. **Act on Alerts**
   - Red alerts need immediate action
   - Yellow alerts need monitoring
   - Green is good, maintain

4. **Track History**
   - Note NDVI changes
   - Compare week to week
   - Identify patterns

5. **Optimize Irrigation**
   - Use NDVI to reduce water waste
   - Improve crop yield
   - Save money

## Troubleshooting

### Map Not Showing
- Check internet connection
- Refresh the page
- Verify farm coordinates

### No Satellite Data
- Wait for first fetch (5-10 seconds)
- Click Refresh button
- Check if field has valid location

### Colors Not Updating
- Satellite data updates every 7 days
- Click Refresh for manual update
- Check if NDVI data is available

### Marker Not Visible
- Zoom out on map
- Check if coordinates are valid
- Reload Satellite page

## API Endpoints

### Get NDVI Data
```
GET /api/v1/satellite/ndvi/{field_id}
```

### Get Crop Health
```
GET /api/v1/satellite/crop-health/{field_id}
```

### Get Satellite History
```
GET /api/v1/satellite/history/{field_id}
```

### Get AI Insights
```
GET /api/v1/dashboard/satellite-insights/{field_id}
```

### Refresh Data
```
POST /api/v1/satellite/refresh/{field_id}
```

## Example Workflow

### Morning Check
1. Open Satellite page
2. Check NDVI value
3. Read AI insights
4. Check soil moisture
5. Plan irrigation if needed

### Weekly Review
1. Check NDVI trend
2. Compare with previous week
3. Identify any changes
4. Adjust management if needed

### Before Irrigation
1. Check NDVI value
2. Check soil moisture
3. Read recommendations
4. Execute irrigation
5. Log the action

### After Irrigation
1. Monitor NDVI trend
2. Check soil moisture recovery
3. Verify crop response
4. Adjust next irrigation

## Performance

- **Map Load**: < 2 seconds
- **Data Fetch**: < 1 second (cached)
- **Updates**: Every 10 seconds
- **Mobile**: Fully optimized

## Browser Support

- Chrome ✓
- Firefox ✓
- Safari ✓
- Edge ✓
- Mobile browsers ✓

## Data Privacy

- Farm coordinates stored locally
- No data sent to third parties
- All processing on your device
- Uses public OpenStreetMap data

## Next Steps

1. **Explore the Map**
   - Zoom in/out
   - Click marker
   - Check legend

2. **Read Insights**
   - Understand recommendations
   - Check action items
   - Plan accordingly

3. **Monitor Trends**
   - Check daily
   - Track changes
   - Build history

4. **Optimize Irrigation**
   - Use NDVI for scheduling
   - Reduce water waste
   - Improve yield

## Support Resources

- **Documentation**: See SATELLITE_MONITORING.md
- **Setup Guide**: See SATELLITE_SETUP.md
- **Map Guide**: See SATELLITE_MAP_GUIDE.md
- **API Docs**: http://localhost:8000/docs

## Key Takeaways

✓ Satellite monitoring is now active
✓ Check Satellite page for crop health
✓ Use map to visualize farm status
✓ Read AI insights for recommendations
✓ Combine with sensor data for best results
✓ Monitor trends over time
✓ Optimize irrigation decisions

---

**Ready to use!** Start by clicking the "Satellite" tab in your dashboard.

**Questions?** Check the documentation files or review the API endpoints.

**Version**: 1.0
**Date**: March 7, 2026
