"""
Portfolio router — holdings, risk overview.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.portfolio import PortfolioHolding
from app.schemas.portfolio import HoldingCreate, HoldingOut, PortfolioRisk
from app.utils.market_data import get_quote, get_financials
from typing import List

router = APIRouter(prefix="/portfolio", tags=["portfolio"])


@router.get("", response_model=List[HoldingOut])
async def get_portfolio(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PortfolioHolding)
        .where(PortfolioHolding.user_id == current_user.id)
        .order_by(PortfolioHolding.created_at.desc())
    )
    holdings = result.scalars().all()

    # Enrich with live prices
    out = []
    for h in holdings:
        quote = await get_quote(h.symbol)
        current_price = quote.get("price", h.avg_buy_price)
        invested = h.quantity * h.avg_buy_price
        current_val = h.quantity * current_price
        pnl = current_val - invested
        pnl_pct = (pnl / invested * 100) if invested else 0

        holding_out = HoldingOut(
            id=h.id,
            symbol=h.symbol,
            company_name=h.company_name,
            quantity=h.quantity,
            avg_buy_price=h.avg_buy_price,
            current_price=current_price,
            risk_score=h.risk_score,
            sector=h.sector,
            unrealized_pnl=round(pnl, 2),
            unrealized_pnl_pct=round(pnl_pct, 2),
            created_at=h.created_at,
        )
        out.append(holding_out)
    return out


@router.post("/holdings", response_model=HoldingOut, status_code=201)
async def add_holding(
    payload: HoldingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.quantity <= 0 or payload.avg_buy_price <= 0:
        raise HTTPException(status_code=400, detail="Quantity and price must be positive")

    fin = await get_financials(payload.symbol.upper())
    quote = await get_quote(payload.symbol.upper())

    holding = PortfolioHolding(
        user_id=current_user.id,
        symbol=payload.symbol.upper(),
        company_name=fin.get("name", payload.symbol.upper()),
        quantity=payload.quantity,
        avg_buy_price=payload.avg_buy_price,
        current_price=quote.get("price", payload.avg_buy_price),
        sector=fin.get("sector", ""),
    )
    db.add(holding)
    await db.flush()

    invested = holding.quantity * holding.avg_buy_price
    current_val = holding.quantity * holding.current_price
    pnl = current_val - invested

    return HoldingOut(
        id=holding.id,
        symbol=holding.symbol,
        company_name=holding.company_name,
        quantity=holding.quantity,
        avg_buy_price=holding.avg_buy_price,
        current_price=holding.current_price,
        risk_score=holding.risk_score,
        sector=holding.sector,
        unrealized_pnl=round(pnl, 2),
        unrealized_pnl_pct=round((pnl / invested * 100) if invested else 0, 2),
        created_at=holding.created_at,
    )


@router.delete("/holdings/{holding_id}", status_code=204)
async def delete_holding(
    holding_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PortfolioHolding).where(
            PortfolioHolding.id == holding_id,
            PortfolioHolding.user_id == current_user.id,
        )
    )
    holding = result.scalar_one_or_none()
    if not holding:
        raise HTTPException(status_code=404, detail="Holding not found")
    await db.delete(holding)


@router.get("/risk-overview", response_model=PortfolioRisk)
async def get_portfolio_risk(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PortfolioHolding).where(PortfolioHolding.user_id == current_user.id)
    )
    holdings = result.scalars().all()
    if not holdings:
        return PortfolioRisk(
            overall_risk_score=0.0,
            total_value=0.0,
            total_invested=0.0,
            total_unrealized_pnl=0.0,
        )

    total_invested = sum(h.quantity * h.avg_buy_price for h in holdings)
    total_value = sum(h.quantity * h.current_price for h in holdings)
    pnl = total_value - total_invested

    # Weighted risk score
    risk_scores = [(h.risk_score, h.quantity * h.current_price) for h in holdings if h.current_price > 0]
    if risk_scores and total_value > 0:
        weighted_risk = sum(r * v for r, v in risk_scores) / total_value
    else:
        weighted_risk = 50.0

    # Sector breakdown
    sector_value: dict = {}
    for h in holdings:
        sector_value[h.sector or "Unknown"] = sector_value.get(h.sector or "Unknown", 0) + (
            h.quantity * h.current_price
        )
    sector_pct = {s: round(v / total_value * 100, 1) for s, v in sector_value.items()} if total_value else {}

    # Concentration alerts
    alerts = []
    for s, pct in sector_pct.items():
        if pct > 30:
            alerts.append({"type": "concentration", "sector": s, "pct": pct,
                          "message": f"Portfolio overweight in {s} ({pct:.1f}%)"})

    for h in holdings:
        holding_pct = (h.quantity * h.current_price / total_value * 100) if total_value else 0
        if holding_pct > 30:
            alerts.append({"type": "single_stock", "symbol": h.symbol, "pct": holding_pct,
                          "message": f"Single stock concentration: {h.symbol} ({holding_pct:.1f}%)"})

    return PortfolioRisk(
        overall_risk_score=round(weighted_risk, 1),
        total_value=round(total_value, 2),
        total_invested=round(total_invested, 2),
        total_unrealized_pnl=round(pnl, 2),
        concentration_alerts=alerts,
        sector_breakdown=sector_pct,
    )
