"""
Background Scheduler Service
Handles scheduled tasks like daily schedule updates
"""

import logging
import asyncio
from datetime import datetime, time
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from app.db.session import SessionLocal
from app.services.schedule_updater import schedule_updater

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def update_schedules_job():
    """Job to update all field schedules daily"""
    try:
        db = SessionLocal()
        logger.info(f"Starting daily schedule update at {datetime.now()}")
        
        result = schedule_updater.update_all_field_schedules(db)
        
        logger.info(f"Daily schedule update completed: {result}")
        db.close()
    except Exception as e:
        logger.error(f"Error in schedule update job: {str(e)}")

def start_scheduler():
    """Start the background scheduler"""
    try:
        if not scheduler.running:
            # Schedule daily update at 6 AM
            scheduler.add_job(
                update_schedules_job,
                CronTrigger(hour=6, minute=0),
                id='daily_schedule_update',
                name='Daily Schedule Update',
                replace_existing=True
            )
            
            scheduler.start()
            logger.info("Background scheduler started")
    except Exception as e:
        logger.error(f"Error starting scheduler: {str(e)}")

def stop_scheduler():
    """Stop the background scheduler"""
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("Background scheduler stopped")
    except Exception as e:
        logger.error(f"Error stopping scheduler: {str(e)}")

def trigger_schedule_update():
    """Manually trigger schedule update (useful for testing)"""
    try:
        logger.info("Manually triggering schedule update")
        update_schedules_job()
        return {
            'status': 'success',
            'message': 'Schedule update triggered'
        }
    except Exception as e:
        logger.error(f"Error triggering schedule update: {str(e)}")
        return {
            'status': 'error',
            'error': str(e)
        }
