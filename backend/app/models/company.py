import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, JSON, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    symbol: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    bse_code: Mapped[str] = mapped_column(String(20), default="")
    nse_symbol: Mapped[str] = mapped_column(String(50), default="")
    sector: Mapped[str] = mapped_column(String(100), default="")
    industry: Mapped[str] = mapped_column(String(100), default="")
    market_cap: Mapped[float] = mapped_column(Float, default=0.0)
    description: Mapped[str] = mapped_column(Text, default="")

    # Cached risk scores (updated by agents)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_score: Mapped[float] = mapped_column(Float, default=0.0)
    sentiment_score: Mapped[float] = mapped_column(Float, default=0.0)
    esg_score: Mapped[float] = mapped_column(Float, default=0.0)

    # Full risk breakdown JSON
    risk_breakdown: Mapped[dict] = mapped_column(JSON, default=dict)

    # Peer list
    peers: Mapped[list] = mapped_column(JSON, default=list)

    last_analyzed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
