from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class Farmer(Base):
    __tablename__ = "farmers"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    phone_number = Column(String, unique=True, index=True)
    village = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    preferred_language = Column(String, default="English")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    fields = relationship("Field", back_populates="owner")

class Field(Base):
    __tablename__ = "fields"
    
    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id"))
    crop_type = Column(String)
    field_area = Column(Float) # in hectares
    growth_stage = Column(String)
    season = Column(String)
    irrigation_mode = Column(String, default="Pump") # Pump or Canal
    optimal_moisture_level = Column(Float, default=40.0)
    
    owner = relationship("Farmer", back_populates="fields")
    sensor_data = relationship("SensorData", back_populates="field")
    history = relationship("IrrigationHistory", back_populates="field")
    satellite_data = relationship("SatelliteData", back_populates="field")

class SensorData(Base):
    __tablename__ = "sensor_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"))
    soil_moisture = Column(Float)
    temperature = Column(Float)
    humidity = Column(Float)
    flow_rate = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    
    field = relationship("Field", back_populates="sensor_data")

class IrrigationHistory(Base):
    __tablename__ = "irrigation_history"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"))
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    water_used = Column(Float, default=0.0) # in liters
    status = Column(String) # Completed, Failed, Interrupted
    
    field = relationship("Field", back_populates="history")

class SatelliteData(Base):
    __tablename__ = "satellite_data"
    
    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"))
    ndvi_value = Column(Float) # Normalized Difference Vegetation Index (-1 to 1)
    health_status = Column(String) # Poor, Moderate, Healthy
    stress_alert = Column(Boolean, default=False)
    image_date = Column(DateTime) # Date when satellite image was captured
    timestamp = Column(DateTime, default=datetime.datetime.utcnow) # When data was fetched
    
    field = relationship("Field", back_populates="satellite_data")
