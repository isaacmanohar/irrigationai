import asyncio
import os
import sys
from datetime import datetime
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.services.schedule_updater import schedule_updater

async def run_test():
    print("=" * 70)
    print("TESTING DAILY SCHEDULE UPDATE SYSTEM")
    print("=" * 70)

    db = SessionLocal()
    try:
        # Use existing farmer ID 7 (Suresh)
        field_id = 7 # Based on previous research, Suresh has field 7
        
        # Check if farmer exists
        from app.models.database import Field, Farmer
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            print(f"Field {field_id} not found. Searching for any field...")
            field = db.query(Field).first()
            if not field:
                print("No fields found in database.")
                return
            field_id = field.id

        farmer = field.owner
        print(f"Testing for Farmer: {farmer.name}, Field ID: {field_id}")
        
        # Generate schedule (now async)
        print("\nGenerating schedule...")
        result = await schedule_updater.generate_schedule_for_field(
            db, 
            field_id,
            latitude=farmer.latitude,
            longitude=farmer.longitude
        )
        
        if result.get('status') == 'success':
            print(f"✓ Schedule generated successfully!")
            print(f"  Next irrigation: {result.get('next_irrigation_date')}")
            print(f"  Water needed: {result.get('next_irrigation_water_mm')} mm")
        else:
            print(f"✗ Error: {result.get('error')}")

        # Retrieve current schedule
        print("\nRetrieving current schedule...")
        sched = schedule_updater.get_current_schedule(db, field_id)
        if sched.get('status') == 'success':
            print(f"✓ Current schedule retrieved!")
            print(f"  Summary: {sched.get('schedule', {}).get('summary', 'N/A')}")
        else:
            print(f"✗ Retrieval error: {sched.get('error')}")
            
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(run_test())
