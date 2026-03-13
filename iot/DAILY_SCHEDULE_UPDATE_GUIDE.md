# Daily Schedule Update System

## Overview

The system automatically updates irrigation schedules daily based on real-time sensor readings. Schedules are regenerated whenever sensor data changes, ensuring farmers always have the most current irrigation recommendations.

## Architecture

### Components

1. **Schedule Updater Service** (`app/services/schedule_updater.py`)
   - Retrieves latest sensor data from database
   - Generates new schedules using ML models and Groq AI
   - Stores schedules in database for persistence
   - Tracks schedule validity and updates

2. **Background Scheduler** (`app/services/scheduler.py`)
   - Runs daily at 6 AM (configurable)
   - Automatically updates all field schedules
   - Can be manually triggered via API

3. **Database Model** (`app/models/database.py`)
   - `IrrigationSchedule` table stores generated schedules
   - Tracks sensor readings used for schedule generation
   - Records risk assessments and next irrigation dates

4. **API Endpoints** (`app/api/schedule.py`)
   - `/api/v1/schedule/weekly-plan` - Generate schedule for a field
   - `/api/v1/schedule/current/{field_id}` - Get current active schedule
   - `/api/v1/schedule/daily-recommendation/{field_id}` - Get today's recommendation
   - `/api/v1/schedule/update-all` - Manually trigger all updates
   - `/api/v1/schedule/trigger-update` - Trigger update job

## How It Works

### Daily Update Flow

```
1. Sensor Data Received
   ↓
2. Latest Sensor Reading Retrieved from DB
   ↓
3. Latest Satellite Data Retrieved (NDVI)
   ↓
4. Schedule Generated Using:
   - ML Models (irrigation need + water requirement)
   - Groq AI (intelligent scheduling)
   - Real-time Weather API (7-day forecast)
   ↓
5. Schedule Stored in Database
   ↓
6. Next Irrigation Date Identified
   ↓
7. Risk Assessment Calculated
   ↓
8. Schedule Active for 7 Days (or until next update)
```

### Sensor Data Integration

The system uses the latest sensor readings for each field:

```python
# Sensor data used for schedule generation
- soil_moisture: Current soil moisture percentage
- temperature: Current temperature
- humidity: Current humidity
- flow_rate: Current irrigation flow (if active)
- timestamp: When reading was taken
```

### Schedule Storage

Each schedule record contains:

```python
{
    "field_id": 1,
    "generated_at": "2026-03-13T08:00:00",
    "valid_from": "2026-03-13T08:00:00",
    "valid_until": "2026-03-20T08:00:00",
    "soil_moisture": 35.0,
    "temperature": 28.0,
    "humidity": 65.0,
    "ndvi_value": 0.65,
    "schedule_data": {
        "daily_schedule": [
            {
                "date": "2026-03-13",
                "irrigate": false,
                "water_mm": 0,
                "reason": "..."
            },
            ...
        ],
        "risk_assessment": {
            "drought_risk": "low",
            "waterlogging_risk": "low"
        }
    },
    "next_irrigation_date": "2026-03-20",
    "next_irrigation_water_mm": 4,
    "drought_risk": "low",
    "waterlogging_risk": "low"
}
```

## API Usage

### 1. Generate Schedule for a Field

```bash
POST /api/v1/schedule/weekly-plan?field_id=1
```

**Response:**
```json
{
    "status": "success",
    "field_id": 1,
    "generated_at": "2026-03-13T08:00:00",
    "next_irrigation_date": "2026-03-20T08:00:00",
    "next_irrigation_water_mm": 4,
    "soil_moisture": 35.0,
    "temperature": 28.0,
    "humidity": 65.0
}
```

### 2. Get Current Schedule

```bash
GET /api/v1/schedule/current/1
```

**Response:**
```json
{
    "status": "success",
    "field_id": 1,
    "generated_at": "2026-03-13T08:00:00",
    "valid_from": "2026-03-13T08:00:00",
    "valid_until": "2026-03-20T08:00:00",
    "soil_moisture": 35.0,
    "temperature": 28.0,
    "humidity": 65.0,
    "ndvi_value": 0.65,
    "next_irrigation_date": "2026-03-20T08:00:00",
    "next_irrigation_water_mm": 4,
    "drought_risk": "low",
    "waterlogging_risk": "low",
    "schedule": {
        "daily_schedule": [...],
        "risk_assessment": {...}
    }
}
```

### 3. Get Today's Recommendation

```bash
GET /api/v1/schedule/daily-recommendation/1
```

**Response:**
```json
{
    "status": "success",
    "field_id": 1,
    "date": "2026-03-13",
    "irrigate": false,
    "water_mm": 0,
    "reason": "Soil moisture is adequate...",
    "confidence": "high",
    "soil_moisture": 35.0,
    "temperature": 28.0,
    "humidity": 65.0,
    "next_irrigation_date": "2026-03-20T08:00:00",
    "next_irrigation_water_mm": 4
}
```

### 4. Manually Trigger Update

```bash
POST /api/v1/schedule/update-all
```

**Response:**
```json
{
    "status": "success",
    "fields_updated": 5,
    "results": [...]
}
```

## Automatic Daily Updates

### Configuration

The background scheduler runs daily at **6:00 AM** (configurable in `app/services/scheduler.py`):

```python
# In scheduler.py
scheduler.add_job(
    update_schedules_job,
    CronTrigger(hour=6, minute=0),  # 6 AM daily
    id='daily_schedule_update'
)
```

### Lifecycle

1. **Startup**: Scheduler starts when FastAPI app starts
2. **Daily**: At 6 AM, all field schedules are updated
3. **On-Demand**: Can be triggered manually via API
4. **Shutdown**: Scheduler stops when app shuts down

## Data Flow Example

### Scenario: Farmer's Field with Dry Conditions

**Day 1 - 8:00 AM:**
- Sensor reading: Soil moisture = 35%, Temp = 28°C
- Schedule generated: No irrigation needed today
- Next irrigation: March 20 (7 days later)

**Day 3 - 8:00 AM:**
- New sensor reading: Soil moisture = 20%, Temp = 32°C (dry conditions)
- Schedule regenerated: Irrigation needed in 2 days
- Next irrigation: March 15 (moved up)
- Water needed: 4mm

**Day 5 - 8:00 AM:**
- New sensor reading: Soil moisture = 15%, Temp = 35°C (critical)
- Schedule regenerated: Urgent irrigation needed
- Next irrigation: Today (March 15)
- Water needed: 6mm

## Features

✅ **Real-Time Updates**: Schedules update whenever sensor data changes
✅ **Automatic Daily Updates**: Background job runs at 6 AM
✅ **Weather Integration**: Uses real-time weather API for forecasts
✅ **ML Models**: Leverages trained models for predictions
✅ **AI Explanations**: Groq AI provides reasoning for decisions
✅ **Risk Assessment**: Calculates drought and waterlogging risks
✅ **Database Persistence**: Schedules stored for historical tracking
✅ **Manual Triggers**: Can be triggered on-demand via API

## Testing

Run the test script to verify the system:

```bash
python test_daily_schedule_update.py
```

This tests:
- Schedule generation based on sensor readings
- Schedule storage in database
- Schedule retrieval
- Dynamic updates when sensor data changes
- Real-time weather integration
- Risk assessment calculations

## Integration with Frontend

The frontend can:

1. **Display Current Schedule**
   ```javascript
   GET /api/v1/schedule/current/{fieldId}
   ```

2. **Show Today's Recommendation**
   ```javascript
   GET /api/v1/schedule/daily-recommendation/{fieldId}
   ```

3. **Trigger Manual Update**
   ```javascript
   POST /api/v1/schedule/update-all
   ```

4. **Monitor Next Irrigation**
   - Display next irrigation date
   - Show water amount needed
   - Display confidence level
   - Show risk assessment

## Future Enhancements

- [ ] Webhook notifications when schedule changes
- [ ] SMS/Email alerts for irrigation days
- [ ] Historical schedule tracking and analytics
- [ ] Schedule comparison (predicted vs actual)
- [ ] User-defined update frequency
- [ ] Multi-field batch updates
- [ ] Schedule optimization based on water availability
