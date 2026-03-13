"""
Schedule Updater Service
Handles daily schedule updates based on latest sensor readings
"""

import json
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.database import IrrigationSchedule, SensorData, SatelliteData, Field
from app.services.schedule_advisor import ScheduleAdvisor

logger = logging.getLogger(__name__)

class ScheduleUpdater:
    def __init__(self):
        self.schedule_advisor = ScheduleAdvisor()
    
    def get_latest_sensor_data(self, db: Session, field_id: int):
        """Get the most recent sensor readings for a field"""
        sensor_data = db.query(SensorData).filter(
            SensorData.field_id == field_id
        ).order_by(SensorData.timestamp.desc()).first()
        
        return sensor_data
    
    def get_latest_satellite_data(self, db: Session, field_id: int):
        """Get the most recent satellite data for a field"""
        satellite_data = db.query(SatelliteData).filter(
            SatelliteData.field_id == field_id
        ).order_by(SatelliteData.timestamp.desc()).first()
        
        return satellite_data
    
    def generate_schedule_for_field(self, db: Session, field_id: int, latitude: float = None, longitude: float = None):
        """Generate a new schedule based on current sensor readings"""
        try:
            # Get field info
            field = db.query(Field).filter(Field.id == field_id).first()
            if not field:
                logger.error(f"Field {field_id} not found")
                return None
            
            # Get latest sensor data
            sensor_data = self.get_latest_sensor_data(db, field_id)
            if not sensor_data:
                logger.warning(f"No sensor data found for field {field_id}")
                return None
            
            # Get latest satellite data
            satellite_data = self.get_latest_satellite_data(db, field_id)
            ndvi_value = satellite_data.ndvi_value if satellite_data else 0.5
            
            # Generate schedule using the correct method signature
            schedule_result = self.schedule_advisor.generate_weekly_schedule(
                crop_type=field.crop_type or 'Wheat',
                growth_stage=field.growth_stage or 'Development',
                current_moisture=sensor_data.soil_moisture,
                ndvi_index=ndvi_value,
                latitude=latitude,
                longitude=longitude,
                soil_type='loamy',
                field_area_hectare=field.field_area or 2.5
            )
            
            if schedule_result.get('status') != 'success':
                logger.error(f"Failed to generate schedule: {schedule_result.get('message')}")
                return None
            
            # Extract schedule data
            schedule_data = schedule_result.get('schedule', {})
            daily_schedule = schedule_data.get('daily_schedule', [])
            
            # Find next irrigation date
            next_irrigation_date = None
            next_irrigation_water = 0
            
            for day_schedule in daily_schedule:
                if day_schedule.get('irrigate'):
                    next_irrigation_date = day_schedule.get('date')
                    next_irrigation_water = day_schedule.get('water_mm', 0)
                    break
            
            # Parse next irrigation date
            if next_irrigation_date:
                try:
                    next_irrigation_dt = datetime.fromisoformat(next_irrigation_date)
                except:
                    next_irrigation_dt = datetime.now() + timedelta(days=1)
            else:
                next_irrigation_dt = datetime.now() + timedelta(days=7)
            
            # Get risk assessment
            risk_assessment = schedule_data.get('risk_assessment', {})
            
            # Create or update schedule record
            existing_schedule = db.query(IrrigationSchedule).filter(
                IrrigationSchedule.field_id == field_id,
                IrrigationSchedule.is_active == True
            ).first()
            
            if existing_schedule:
                # Update existing schedule
                existing_schedule.generated_at = datetime.utcnow()
                existing_schedule.valid_from = datetime.utcnow()
                existing_schedule.valid_until = datetime.utcnow() + timedelta(days=7)
                existing_schedule.soil_moisture = sensor_data.soil_moisture
                existing_schedule.temperature = sensor_data.temperature
                existing_schedule.humidity = sensor_data.humidity
                existing_schedule.ndvi_value = ndvi_value
                existing_schedule.schedule_data = json.dumps(schedule_data)
                existing_schedule.next_irrigation_date = next_irrigation_dt
                existing_schedule.next_irrigation_water_mm = next_irrigation_water
                existing_schedule.drought_risk = risk_assessment.get('drought_risk', 'low')
                existing_schedule.waterlogging_risk = risk_assessment.get('waterlogging_risk', 'low')
                existing_schedule.updated_at = datetime.utcnow()
                
                db.add(existing_schedule)
            else:
                # Create new schedule
                new_schedule = IrrigationSchedule(
                    field_id=field_id,
                    generated_at=datetime.utcnow(),
                    valid_from=datetime.utcnow(),
                    valid_until=datetime.utcnow() + timedelta(days=7),
                    soil_moisture=sensor_data.soil_moisture,
                    temperature=sensor_data.temperature,
                    humidity=sensor_data.humidity,
                    ndvi_value=ndvi_value,
                    rainfall_forecast=0,
                    schedule_data=json.dumps(schedule_data),
                    next_irrigation_date=next_irrigation_dt,
                    next_irrigation_water_mm=next_irrigation_water,
                    drought_risk=risk_assessment.get('drought_risk', 'low'),
                    waterlogging_risk=risk_assessment.get('waterlogging_risk', 'low'),
                    is_active=True
                )
                db.add(new_schedule)
            
            db.commit()
            logger.info(f"Schedule generated/updated for field {field_id}")
            
            return {
                'status': 'success',
                'field_id': field_id,
                'generated_at': datetime.utcnow().isoformat(),
                'next_irrigation_date': next_irrigation_dt.isoformat(),
                'next_irrigation_water_mm': next_irrigation_water,
                'soil_moisture': sensor_data.soil_moisture,
                'temperature': sensor_data.temperature,
                'humidity': sensor_data.humidity
            }
        
        except Exception as e:
            logger.error(f"Error generating schedule for field {field_id}: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def update_all_field_schedules(self, db: Session):
        """Update schedules for all active fields"""
        try:
            # Get all fields with active schedules
            fields = db.query(Field).all()
            
            results = []
            for field in fields:
                result = self.generate_schedule_for_field(
                    db, 
                    field.id,
                    latitude=field.owner.latitude if field.owner else None,
                    longitude=field.owner.longitude if field.owner else None
                )
                results.append(result)
            
            logger.info(f"Updated schedules for {len(results)} fields")
            return {
                'status': 'success',
                'fields_updated': len(results),
                'results': results
            }
        
        except Exception as e:
            logger.error(f"Error updating all schedules: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }
    
    def get_current_schedule(self, db: Session, field_id: int):
        """Get the current active schedule for a field"""
        try:
            schedule = db.query(IrrigationSchedule).filter(
                IrrigationSchedule.field_id == field_id,
                IrrigationSchedule.is_active == True
            ).order_by(IrrigationSchedule.generated_at.desc()).first()
            
            if not schedule:
                return {
                    'status': 'not_found',
                    'message': 'No active schedule found for this field'
                }
            
            schedule_data = json.loads(schedule.schedule_data)
            
            return {
                'status': 'success',
                'field_id': field_id,
                'generated_at': schedule.generated_at.isoformat(),
                'valid_from': schedule.valid_from.isoformat(),
                'valid_until': schedule.valid_until.isoformat(),
                'soil_moisture': schedule.soil_moisture,
                'temperature': schedule.temperature,
                'humidity': schedule.humidity,
                'ndvi_value': schedule.ndvi_value,
                'next_irrigation_date': schedule.next_irrigation_date.isoformat(),
                'next_irrigation_water_mm': schedule.next_irrigation_water_mm,
                'drought_risk': schedule.drought_risk,
                'waterlogging_risk': schedule.waterlogging_risk,
                'schedule': schedule_data
            }
        
        except Exception as e:
            logger.error(f"Error retrieving schedule for field {field_id}: {str(e)}")
            return {
                'status': 'error',
                'error': str(e)
            }

schedule_updater = ScheduleUpdater()
