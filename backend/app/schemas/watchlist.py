from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class WatchlistItemOut(BaseModel):
    id: str
    symbol: str
    company_name: str
    alert_on_new_filing: bool
    alert_on_risk_change: bool
    risk_threshold: float
    last_risk_score: float
    last_sentiment_score: float
    last_checked_at: Optional[datetime]
    agent_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class WatchlistAddRequest(BaseModel):
    alert_on_new_filing: bool = True
    alert_on_risk_change: bool = True
    risk_threshold: float = 10.0


class AlertOut(BaseModel):
    id: str
    symbol: str
    company_name: str
    alert_type: str
    severity: str
    title: str
    body: str
    evidence: Dict[str, Any] = {}
    is_read: bool
    risk_delta: float
    created_at: datetime

    model_config = {"from_attributes": True}


class AlertUpdate(BaseModel):
    is_read: bool
