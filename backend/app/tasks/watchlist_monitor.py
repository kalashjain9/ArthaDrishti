"""
Celery tasks — watchlist monitoring background jobs.
"""
import asyncio
from app.tasks.celery_app import celery_app


@celery_app.task(bind=True, max_retries=3, default_retry_delay=300)
def monitor_watchlist_company(self, user_id: str, symbol: str):
    """
    Monitor a single watchlisted company.
    Runs full agent suite and creates alerts if thresholds exceeded.
    """
    async def _run():
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.watchlist import WatchlistItem
        from app.agents.watchlist_agent import WatchlistAgent

        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(WatchlistItem).where(
                    WatchlistItem.user_id == user_id,
                    WatchlistItem.symbol == symbol,
                )
            )
            item = result.scalar_one_or_none()
            if not item:
                return {"status": "not_found"}

            # Mark as active
            item.agent_active = True
            await db.commit()

            agent = WatchlistAgent()
            try:
                result_data = await agent.monitor_company(
                    user_id=user_id,
                    symbol=symbol,
                    db=db,
                    watchlist_item=item,
                )
                await db.commit()
                return result_data
            except Exception as e:
                item.agent_active = False
                await db.commit()
                raise e

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(_run())
        loop.close()
        return result
    except Exception as exc:
        raise self.retry(exc=exc)


@celery_app.task
def monitor_all_watchlists():
    """
    Fan out monitoring tasks for ALL watchlisted companies across all users.
    Called by Celery Beat every 6 hours.
    """
    async def _get_all_watchlist_items():
        from app.core.database import AsyncSessionLocal
        from sqlalchemy import select
        from app.models.watchlist import WatchlistItem

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(WatchlistItem))
            items = result.scalars().all()
            return [(item.user_id, item.symbol) for item in items]

    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    items = loop.run_until_complete(_get_all_watchlist_items())
    loop.close()

    dispatched = 0
    for user_id, symbol in items:
        monitor_watchlist_company.delay(user_id, symbol)
        dispatched += 1

    return {"dispatched": dispatched}
