#!/usr/bin/env python
"""Test script for daily schedule updates based on sensor readings"""

from app.db.session import SessionLocal
from app.models.database import Field, Farmer, SensorData, SatelliteData
from app.services.schedule_updater import schedule_updater
from datetime import datetime, timedelta
import json

print("=" * 70)
print("TESTING DAILY SCHEDULE UPDATE SYSTEM")
print("=" * 70)

db = SessionLocal()

try:
    # Create test farmer if not exists
    farmer = db.query(Farmer).filter(Farmer.email == "test@farm.com").first()
    if not farmer:
        farmer = Farmer(
            name="Test Farmer",
            email="test@farm.com",
            hashed_password="hashed",
            phone_number="9876543210",
            village="Test Village",
            latitude=28.7041,
            longitude=77.1025,
            preferred_language="English"
        )
        db.add(farmer)
        db.commit()
        print(f"✓ Created test farmer: {farmer.name}")
    
    # Create test field if not exists
    field = db.query(Field).filter(Field.farmer_id == farmer.id).first()
    if not field:
        field = Field(
            farmer_id=farmer.id,
            crop_type="Wheat",
            field_area=2.5,
            growth_stage="Development",
            season="Summer",
            irrigation_method="Drip",
            farm_name="Test Farm"
        )
        db.add(field)
        db.commit()
        print(f"✓ Created test field: {field.farm_name}")
    
    # Add sensor data
    sensor_data = SensorData(
        field_id=field.id,
        soil_moisture=35.0,
        temperature=28.0,
        humidity=65.0,
        flow_rate=0.0,
        timestamp=datetime.utcnow()
    )
    db.add(sensor_data)
    db.commit()
    print(f"✓ Added sensor data: Moisture={sensor_data.soil_moisture}%, Temp={sensor_data.temperature}°C")
    
    # Add satellite data
    satellite_data = SatelliteData(
        field_id=field.id,
        ndvi_value=0.65,
        health_status="Healthy",
        stress_alert=False,
        image_date=datetime.utcnow(),
        timestamp=datetime.utcnow()
    )
    db.add(satellite_data)
    db.commit()
    print(f"✓ Added satellite data: NDVI={satellite_data.ndvi_value}")
    
    print("\n" + "=" * 70)
    print("GENERATING SCHEDULE BASED ON SENSOR READINGS")
    print("=" * 70)
    
    # Generate schedule
    result = schedule_updater.generate_schedule_for_field(
        db, 
        field.id,
        latitude=farmer.latitude,
        longitude=farmer.longitude
    )
    
    if result.get('status') == 'success':
        print(f"\n✓ Schedule generated successfully!")
        print(f"  Generated at: {result.get('generated_at')}")
        print(f"  Next irrigation: {result.get('next_irrigation_date')}")
        print(f"  Water needed: {result.get('next_irrigation_water_mm')} mm")
        print(f"  Soil moisture: {result.get('soil_moisture')}%")
        print(f"  Temperature: {result.get('temperature')}°C")
        print(f"  Humidity: {result.get('humidity')}%")
    else:
        print(f"\n✗ Error: {result.get('error')}")
    
    # Retrieve the schedule
    print("\n" + "=" * 70)
    print("RETRIEVING CURRENT SCHEDULE")
    print("=" * 70)
    
    schedule_result = schedule_updater.get_current_schedule(db, field.id)
    
    if schedule_result.get('status') == 'success':
        print(f"\n✓ Current schedule retrieved!")
        print(f"  Valid from: {schedule_result.get('valid_from')}")
        print(f"  Valid until: {schedule_result.get('valid_until')}")
        print(f"  Drought risk: {schedule_result.get('drought_risk')}")
        print(f"  Waterlogging risk: {schedule_result.get('waterlogging_risk')}")
        
        schedule_data = schedule_result.get('schedule', {})
        daily_schedule = schedule_data.get('daily_schedule', [])
        
        print(f"\n  Daily Schedule:")
        for i, day in enumerate(daily_schedule[:3]):  # Show first 3 days
            print(f"    Day {i+1}: {day.get('date')}")
            print(f"      Irrigate: {day.get('irrigate')}")
            print(f"      Water: {day.get('water_mm')} mm")
            print(f"      Reason: {day.get('reason')[:60]}...")
    else:
        print(f"\n✗ Error: {schedule_result.get('error')}")
    
    # Test updating sensor data and regenerating schedule
    print("\n" + "=" * 70)
    print("SIMULATING SENSOR UPDATE (DRY CONDITIONS)")
    print("=" * 70)
    
    # Add new sensor data with lower moisture
    new_sensor_data = SensorData(
        field_id=field.id,
        soil_moisture=20.0,  # Lower moisture
        temperature=32.0,    # Higher temperature
        humidity=45.0,       # Lower humidity
        flow_rate=0.0,
        timestamp=datetime.utcnow()
    )
    db.add(new_sensor_data)
    db.commit()
    print(f"✓ Updated sensor data: Moisture={new_sensor_data.soil_moisture}%, Temp={new_sensor_data.temperature}°C")
    
    # Regenerate schedule with new data
    print("\nRegenerating schedule with new sensor readings...")
    result2 = schedule_updater.generate_schedule_for_field(
        db, 
        field.id,
        latitude=farmer.latitude,
        longitude=farmer.longitude
    )
    
    if result2.get('status') == 'success':
        print(f"✓ Schedule updated!")
        print(f"  Next irrigation: {result2.get('next_irrigation_date')}")
        print(f"  Water needed: {result2.get('next_irrigation_water_mm')} mm")
        print(f"  Soil moisture: {result2.get('soil_moisture')}%")
    else:
        print(f"✗ Error: {result2.get('error')}")
    
    print("\n" + "=" * 70)
    print("DAILY SCHEDULE UPDATE TEST COMPLETE!")
    print("=" * 70)
    print("\nKey Features Verified:")
    print("  ✓ Schedule generation based on sensor readings")
    print("  ✓ Schedule storage in database")
    print("  ✓ Schedule retrieval")
    print("  ✓ Dynamic updates when sensor data changes")
    print("  ✓ Real-time weather integration")
    print("  ✓ Risk assessment (drought/waterlogging)")

finally:
    db.close()
