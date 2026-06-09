"""
Celery application configuration.
"""
from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "arthadrishti",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.tasks.watchlist_monitor"],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Kolkata",
    enable_utc=True,
    task_track_started=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    result_expires=3600,
)

# Beat schedule
celery_app.conf.beat_schedule = {
    "monitor-all-watchlists-every-6h": {
        "task": "app.tasks.watchlist_monitor.monitor_all_watchlists",
        "schedule": 6 * 60 * 60,  # 6 hours in seconds
    },
}
