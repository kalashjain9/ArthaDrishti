from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class HoldingCreate(BaseModel):
    symbol: str
    quantity: float
    avg_buy_price: float


class HoldingOut(BaseModel):
    id: str
    symbol: str
    company_name: str
    quantity: float
    avg_buy_price: float
    current_price: float
    risk_score: float
    sector: str
    unrealized_pnl: float = 0.0
    unrealized_pnl_pct: float = 0.0
    created_at: datetime

    model_config = {"from_attributes": True}


class PortfolioRisk(BaseModel):
    overall_risk_score: float
    total_value: float
    total_invested: float
    total_unrealized_pnl: float
    concentration_alerts: List[Dict[str, Any]] = []
    sector_breakdown: Dict[str, float] = {}
    risk_breakdown: Dict[str, Any] = {}
