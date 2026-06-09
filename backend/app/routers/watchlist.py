"""
Watchlist router — manage watchlist + SSE alerts stream.
"""
import asyncio
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.core.database import get_db
from app.core.security import get_current_user, get_current_user_sse
from app.models.user import User
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.schemas.watchlist import WatchlistItemOut, WatchlistAddRequest, AlertOut
from typing import List

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.get("", response_model=List[WatchlistItemOut])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem)
        .where(WatchlistItem.user_id == current_user.id)
        .order_by(WatchlistItem.created_at.desc())
    )
    return result.scalars().all()


@router.post("/{symbol}", response_model=WatchlistItemOut, status_code=201)
async def add_to_watchlist(
    symbol: str,
    payload: WatchlistAddRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    # Check if already exists
    existing = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == symbol,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"{symbol} already on watchlist")

    # Get company name
    from app.utils.market_data import get_financials
    fin = await get_financials(symbol)

    item = WatchlistItem(
        user_id=current_user.id,
        symbol=symbol,
        company_name=fin.get("name", symbol),
        alert_on_new_filing=payload.alert_on_new_filing,
        alert_on_risk_change=payload.alert_on_risk_change,
        risk_threshold=payload.risk_threshold,
    )
    db.add(item)
    await db.flush()
    return item


@router.delete("/{symbol}", status_code=204)
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    symbol = symbol.upper()
    result = await db.execute(
        select(WatchlistItem).where(
            WatchlistItem.user_id == current_user.id,
            WatchlistItem.symbol == symbol,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Symbol not on watchlist")
    await db.delete(item)


@router.get("/alerts", response_model=List[AlertOut])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    unread_only: bool = False,
    limit: int = 50,
):
    query = select(Alert).where(Alert.user_id == current_user.id)
    if unread_only:
        query = query.where(Alert.is_read == False)
    query = query.order_by(Alert.created_at.desc()).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.patch("/alerts/{alert_id}/read", status_code=200)
async def mark_alert_read(
    alert_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Alert).where(Alert.id == alert_id, Alert.user_id == current_user.id)
    )
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    alert.is_read = True
    return {"status": "ok"}


@router.get("/alerts/stream")
async def alerts_stream(
    current_user: User = Depends(get_current_user_sse),
    db: AsyncSession = Depends(get_db),
):
    """SSE stream for real-time alerts."""
    user_id = current_user.id

    async def event_generator():
        # Send current unread alerts on connect
        result = await db.execute(
            select(Alert)
            .where(Alert.user_id == user_id, Alert.is_read == False)
            .order_by(Alert.created_at.desc())
            .limit(20)
        )
        alerts = result.scalars().all()
        for alert in alerts:
            data = AlertOut.model_validate(alert).model_dump_json()
            yield f"data: {data}\n\n"

        # Keep-alive ping every 30 seconds
        while True:
            await asyncio.sleep(30)
            yield f"data: {json.dumps({'type': 'ping', 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
