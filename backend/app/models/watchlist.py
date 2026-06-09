import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class WatchlistItem(Base):
    __tablename__ = "watchlist_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    symbol: Mapped[str] = mapped_column(String(50), nullable=False)
    company_name: Mapped[str] = mapped_column(String(300), default="")

    # Alert thresholds
    alert_on_new_filing: Mapped[bool] = mapped_column(Boolean, default=True)
    alert_on_risk_change: Mapped[bool] = mapped_column(Boolean, default=True)
    risk_threshold: Mapped[float] = mapped_column(Float, default=10.0)
    sentiment_threshold: Mapped[float] = mapped_column(Float, default=15.0)

    # Last known state for delta comparison
    last_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    last_checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    agent_active: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)

    user = relationship("User", back_populates="watchlist_items")
