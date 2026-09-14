from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db.session import get_db
from ..services.schedule_updater import schedule_updater
from ..models.database import Field

router = APIRouter(prefix="/api/v1/schedule", tags=["Schedule"])

@router.get("/{field_id}")
async def get_schedule(field_id: int, db: Session = Depends(get_db)):
    """Get current active irrigation schedule for a field"""
    result = schedule_updater.get_current_schedule(db, field_id)
    if result.get("status") == "not_found":
        raise HTTPException(status_code=404, detail=result.get("message"))
    elif result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result

@router.post("/generate/{field_id}")
async def generate_schedule(field_id: int, db: Session = Depends(get_db)):
    """Generate or update irrigation schedule for a field"""
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Field not found")
        
    lat = field.owner.latitude if field.owner else None
    lon = field.owner.longitude if field.owner else None
    
    result = schedule_updater.generate_schedule_for_field(db, field_id, latitude=lat, longitude=lon)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to generate schedule (insufficient data)")
    elif result.get("status") == "error":
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result
