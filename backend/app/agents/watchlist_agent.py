"""
WatchlistAgent — background monitoring engine (called by Celery tasks).
"""
from typing import Dict, Any, List
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.agents.filing_agent import FilingAgent
from app.agents.risk_agent import RiskAgent
from app.agents.news_agent import NewsAgent
from app.agents.sentiment_agent import SentimentAgent


class WatchlistAgent:
    name = "WatchlistAgent"

    async def monitor_company(
        self,
        user_id: str,
        symbol: str,
        db: AsyncSession,
        watchlist_item: WatchlistItem = None,
    ) -> Dict[str, Any]:
        """
        Full monitoring cycle for one watchlisted company.
        Returns list of alerts generated.
        """
        alerts_created = []

        # Get previous state
        prev_risk_score = watchlist_item.last_risk_score if watchlist_item else 0.0
        prev_sentiment = watchlist_item.last_sentiment_score if watchlist_item else 0.0

        # Run news analysis
        news_result = await NewsAgent().run(symbol=symbol, user_id=user_id)

        # Run risk analysis
        risk_result = await RiskAgent().run(symbol=symbol, user_id=user_id)
        risk_index = risk_result.get("risk_index", {})
        new_risk_score = float(risk_index.get("overall_score", 50))

        # Run sentiment analysis
        sentiment_result = await SentimentAgent().run(
            symbol=symbol, user_id=user_id, news_data=news_result
        )
        divergence_score = float(sentiment_result.get("divergence_score", 0))
        new_sentiment_score = divergence_score

        # Check for risk score spike
        risk_delta = new_risk_score - prev_risk_score
        threshold = watchlist_item.risk_threshold if watchlist_item else 10.0

        if abs(risk_delta) >= threshold:
            severity = "high" if risk_delta > 20 else "medium"
            alert = Alert(
                user_id=user_id,
                symbol=symbol,
                company_name=watchlist_item.company_name if watchlist_item else symbol,
                alert_type="risk_spike" if risk_delta > 0 else "risk_improvement",
                severity=severity,
                title=f"{symbol}: Risk Score {'increased' if risk_delta > 0 else 'decreased'} by {abs(risk_delta):.0f} points",
                body=risk_index.get("summary", "Risk score changed significantly."),
                evidence={"risk_breakdown": risk_index},
                risk_delta=risk_delta,
            )
            db.add(alert)
            alerts_created.append({"type": "risk_spike", "delta": risk_delta})

        # Check for high narrative divergence
        sent_delta = abs(new_sentiment_score - prev_sentiment)
        sent_threshold = watchlist_item.sentiment_threshold if watchlist_item else 15.0
        if sent_delta >= sent_threshold or divergence_score > 70:
            alert = Alert(
                user_id=user_id,
                symbol=symbol,
                company_name=watchlist_item.company_name if watchlist_item else symbol,
                alert_type="sentiment_shift",
                severity="high" if divergence_score > 70 else "medium",
                title=f"{symbol}: Narrative Divergence Score = {divergence_score:.0f}%",
                body=sentiment_result.get("overall_assessment", "Management narrative diverges from news coverage."),
                evidence={"sentiment": sentiment_result},
                risk_delta=sent_delta,
            )
            db.add(alert)
            alerts_created.append({"type": "sentiment_shift", "score": divergence_score})

        # Update watchlist item state
        if watchlist_item:
            watchlist_item.last_risk_score = new_risk_score
            watchlist_item.last_sentiment_score = new_sentiment_score
            watchlist_item.last_checked_at = datetime.now(timezone.utc)
            watchlist_item.agent_active = False

        await db.flush()
        return {
            "agent": self.name,
            "symbol": symbol,
            "alerts_created": alerts_created,
            "risk_score": new_risk_score,
            "sentiment_score": new_sentiment_score,
        }
