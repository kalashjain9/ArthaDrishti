"""
Companies router — search, profile, risk, filings, news, sentiment, fraud, earnings, competitors.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.company import Company
from app.models.document import Document
from app.agents.risk_agent import RiskAgent
from app.agents.news_agent import NewsAgent
from app.agents.sentiment_agent import SentimentAgent
from app.agents.fraud_agent import FraudAgent
from app.agents.earnings_agent import EarningsAgent
from app.agents.competitor_agent import CompetitorAgent
from app.schemas.company import CompanyProfile, CompanySearch
from app.utils.market_data import get_quote, get_financials, get_historical_prices
from typing import List

router = APIRouter(prefix="/companies", tags=["companies"])

# NSE 50 + Nifty Next 50 company list for search
NSE_COMPANIES = [
    {"symbol": "RELIANCE", "name": "Reliance Industries Ltd", "sector": "Energy"},
    {"symbol": "TCS", "name": "Tata Consultancy Services Ltd", "sector": "IT"},
    {"symbol": "HDFCBANK", "name": "HDFC Bank Ltd", "sector": "Banking"},
    {"symbol": "INFY", "name": "Infosys Ltd", "sector": "IT"},
    {"symbol": "ICICIBANK", "name": "ICICI Bank Ltd", "sector": "Banking"},
    {"symbol": "HINDUNILVR", "name": "Hindustan Unilever Ltd", "sector": "FMCG"},
    {"symbol": "BHARTIARTL", "name": "Bharti Airtel Ltd", "sector": "Telecom"},
    {"symbol": "ITC", "name": "ITC Ltd", "sector": "FMCG"},
    {"symbol": "KOTAKBANK", "name": "Kotak Mahindra Bank Ltd", "sector": "Banking"},
    {"symbol": "SBIN", "name": "State Bank of India", "sector": "Banking"},
    {"symbol": "LT", "name": "Larsen & Toubro Ltd", "sector": "Infrastructure"},
    {"symbol": "WIPRO", "name": "Wipro Ltd", "sector": "IT"},
    {"symbol": "AXISBANK", "name": "Axis Bank Ltd", "sector": "Banking"},
    {"symbol": "MARUTI", "name": "Maruti Suzuki India Ltd", "sector": "Automobiles"},
    {"symbol": "TATAMOTORS", "name": "Tata Motors Ltd", "sector": "Automobiles"},
    {"symbol": "BAJFINANCE", "name": "Bajaj Finance Ltd", "sector": "NBFC"},
    {"symbol": "SUNPHARMA", "name": "Sun Pharmaceutical Industries", "sector": "Pharma"},
    {"symbol": "HCLTECH", "name": "HCL Technologies Ltd", "sector": "IT"},
    {"symbol": "ASIANPAINT", "name": "Asian Paints Ltd", "sector": "Consumer"},
    {"symbol": "NESTLEIND", "name": "Nestle India Ltd", "sector": "FMCG"},
    {"symbol": "TECHM", "name": "Tech Mahindra Ltd", "sector": "IT"},
    {"symbol": "ULTRACEMCO", "name": "UltraTech Cement Ltd", "sector": "Materials"},
    {"symbol": "ADANIENT", "name": "Adani Enterprises Ltd", "sector": "Conglomerate"},
    {"symbol": "ONGC", "name": "Oil & Natural Gas Corporation", "sector": "Energy"},
    {"symbol": "NTPC", "name": "NTPC Ltd", "sector": "Power"},
    {"symbol": "POWERGRID", "name": "Power Grid Corporation of India", "sector": "Power"},
    {"symbol": "DRREDDY", "name": "Dr. Reddy's Laboratories Ltd", "sector": "Pharma"},
    {"symbol": "CIPLA", "name": "Cipla Ltd", "sector": "Pharma"},
    {"symbol": "DIVISLAB", "name": "Divi's Laboratories Ltd", "sector": "Pharma"},
    {"symbol": "PERSISTENT", "name": "Persistent Systems Ltd", "sector": "IT"},
    {"symbol": "DIXON", "name": "Dixon Technologies Ltd", "sector": "Electronics"},
    {"symbol": "BAJAJ-AUTO", "name": "Bajaj Auto Ltd", "sector": "Automobiles"},
    {"symbol": "M&M", "name": "Mahindra & Mahindra Ltd", "sector": "Automobiles"},
    {"symbol": "HEROMOTOCO", "name": "Hero MotoCorp Ltd", "sector": "Automobiles"},
    {"symbol": "EICHERMOT", "name": "Eicher Motors Ltd", "sector": "Automobiles"},
    {"symbol": "INDUSINDBK", "name": "IndusInd Bank Ltd", "sector": "Banking"},
    {"symbol": "GRASIM", "name": "Grasim Industries Ltd", "sector": "Conglomerate"},
    {"symbol": "TITAN", "name": "Titan Company Ltd", "sector": "Consumer"},
    {"symbol": "TATACONSUM", "name": "Tata Consumer Products Ltd", "sector": "FMCG"},
    {"symbol": "JSWSTEEL", "name": "JSW Steel Ltd", "sector": "Metals"},
    {"symbol": "TATASTEEL", "name": "Tata Steel Ltd", "sector": "Metals"},
    {"symbol": "VEDL", "name": "Vedanta Ltd", "sector": "Metals"},
    {"symbol": "COALINDIA", "name": "Coal India Ltd", "sector": "Mining"},
    {"symbol": "BPCL", "name": "Bharat Petroleum Corporation Ltd", "sector": "Energy"},
    {"symbol": "IOC", "name": "Indian Oil Corporation Ltd", "sector": "Energy"},
    {"symbol": "ZOMATO", "name": "Zomato Ltd", "sector": "Technology"},
    {"symbol": "PAYTM", "name": "One 97 Communications Ltd", "sector": "Fintech"},
    {"symbol": "NYKAA", "name": "FSN E-Commerce Ventures Ltd", "sector": "E-commerce"},
    {"symbol": "DMART", "name": "Avenue Supermarts Ltd", "sector": "Retail"},
    {"symbol": "PIDILITIND", "name": "Pidilite Industries Ltd", "sector": "Chemicals"},
]


@router.get("/search", response_model=List[CompanySearch])
async def search_companies(
    q: str = Query(..., min_length=1),
    limit: int = 10,
    current_user: User = Depends(get_current_user),
):
    """Search NSE/BSE listed companies by name or symbol."""
    q_lower = q.lower()
    matches = [
        CompanySearch(
            symbol=c["symbol"],
            name=c["name"],
            sector=c["sector"],
            market_cap=0.0,
        )
        for c in NSE_COMPANIES
        if q_lower in c["symbol"].lower() or q_lower in c["name"].lower()
    ]
    return matches[:limit]


@router.get("/{symbol}", response_model=CompanyProfile)
async def get_company(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    result = await db.execute(select(Company).where(Company.symbol == symbol))
    company = result.scalar_one_or_none()

    if not company:
        # Auto-create from yfinance
        fin = await get_financials(symbol)
        company = Company(
            symbol=symbol,
            name=fin.get("name", symbol),
            sector=fin.get("sector", ""),
            industry=fin.get("industry", ""),
            market_cap=fin.get("market_cap", 0),
            description=fin.get("description", ""),
            risk_score=50.0,
        )
        db.add(company)
        await db.flush()

    return CompanyProfile.model_validate(company)


@router.get("/{symbol}/quote")
async def get_company_quote(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    return await get_quote(symbol.upper())


@router.get("/{symbol}/history")
async def get_price_history(
    symbol: str,
    period: str = "1y",
    current_user: User = Depends(get_current_user),
):
    return await get_historical_prices(symbol.upper(), period)


@router.get("/{symbol}/risk")
async def get_company_risk(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    agent = RiskAgent()
    result = await agent.run(symbol=symbol, user_id=current_user.id)

    # Cache to DB
    db_result = await db.execute(select(Company).where(Company.symbol == symbol))
    company = db_result.scalar_one_or_none()
    if company and result.get("risk_index"):
        ri = result["risk_index"]
        company.risk_score = ri.get("overall_score", company.risk_score)
        company.risk_breakdown = ri

    return result


@router.get("/{symbol}/filings")
async def get_company_filings(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    result = await db.execute(
        select(Document)
        .where(Document.user_id == current_user.id, Document.symbol == symbol)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    from app.schemas.document import DocumentOut
    return [DocumentOut.model_validate(d) for d in docs]


@router.get("/{symbol}/news")
async def get_company_news(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()
    agent = NewsAgent()
    return await agent.run(symbol=symbol, user_id=current_user.id)


@router.get("/{symbol}/sentiment")
async def get_company_sentiment(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()
    agent = SentimentAgent()
    return await agent.run(symbol=symbol, user_id=current_user.id)


@router.get("/{symbol}/fraud")
async def get_company_fraud(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()
    agent = FraudAgent()
    return await agent.run(symbol=symbol, user_id=current_user.id)


@router.get("/{symbol}/earnings")
async def get_company_earnings(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()
    agent = EarningsAgent()
    return await agent.run(symbol=symbol, user_id=current_user.id)


@router.get("/{symbol}/competitors")
async def get_company_competitors(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    symbol = symbol.upper()
    agent = CompetitorAgent()
    return await agent.run(symbol=symbol, user_id=current_user.id)


@router.get("/{symbol}/financials")
async def get_company_financials(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    return await get_financials(symbol.upper())
