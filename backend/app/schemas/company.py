from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class RiskDimension(BaseModel):
    score: float  # 0-100
    level: str  # low | medium | high | critical
    evidence: List[Dict[str, Any]] = []
    trend: str = "stable"  # improving | stable | deteriorating


class RashtriyaRiskIndex(BaseModel):
    overall: float
    financial: RiskDimension
    operational: RiskDimension
    geopolitical: RiskDimension
    legal: RiskDimension
    market: RiskDimension
    esg: RiskDimension
    fraud: RiskDimension
    macro: RiskDimension
    computed_at: datetime


class CompanyProfile(BaseModel):
    id: str
    symbol: str
    name: str
    bse_code: str
    nse_symbol: str
    sector: str
    industry: str
    market_cap: float
    description: str
    risk_score: float
    fraud_score: float
    sentiment_score: float
    esg_score: float
    last_analyzed_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class CompanySearch(BaseModel):
    symbol: str
    name: str
    sector: str
    market_cap: float


class CompanyFinancials(BaseModel):
    symbol: str
    revenue: List[Dict[str, Any]] = []
    pat: List[Dict[str, Any]] = []
    ebitda: List[Dict[str, Any]] = []
    debt: List[Dict[str, Any]] = []
    cash_flow: List[Dict[str, Any]] = []
    ratios: Dict[str, Any] = {}
