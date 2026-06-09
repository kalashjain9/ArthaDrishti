"""
Demo seed script — pre-loads demo user, companies, watchlist, and alerts.
Run: python backend/scripts/seed_demo.py
"""
import asyncio
import sys
import os

# Windows: force UTF-8 output
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.database import create_tables, AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from app.models.company import Company
from app.models.watchlist import WatchlistItem
from app.models.alert import Alert
from app.models.portfolio import PortfolioHolding
from sqlalchemy import select


DEMO_COMPANIES = [
    {
        "symbol": "RELIANCE",
        "name": "Reliance Industries Ltd",
        "sector": "Energy",
        "industry": "Oil, Gas & Consumable Fuels",
        "description": "Reliance Industries Limited is an Indian multinational conglomerate company, engaged in energy, petrochemicals, natural gas, retail, and telecommunications.",
        "market_cap": 19000000000000,
        "risk_score": 32.0,
        "fraud_score": 8.0,
        "sentiment_score": 42.0,
        "esg_score": 58.0,
    },
    {
        "symbol": "TCS",
        "name": "Tata Consultancy Services Ltd",
        "sector": "IT",
        "industry": "IT Services",
        "description": "Tata Consultancy Services is an Indian multinational information technology services and consulting company.",
        "market_cap": 13500000000000,
        "risk_score": 21.0,
        "fraud_score": 5.0,
        "sentiment_score": 18.0,
        "esg_score": 72.0,
    },
    {
        "symbol": "INFY",
        "name": "Infosys Ltd",
        "sector": "IT",
        "industry": "IT Services",
        "description": "Infosys Limited is an Indian multinational information technology company that provides business consulting, information technology and outsourcing services.",
        "market_cap": 7200000000000,
        "risk_score": 25.0,
        "fraud_score": 6.0,
        "sentiment_score": 22.0,
        "esg_score": 78.0,
    },
    {
        "symbol": "HDFCBANK",
        "name": "HDFC Bank Ltd",
        "sector": "Banking",
        "industry": "Private Sector Banking",
        "description": "HDFC Bank Limited is an Indian banking and financial services company headquartered in Mumbai.",
        "market_cap": 12000000000000,
        "risk_score": 38.0,
        "fraud_score": 9.0,
        "sentiment_score": 35.0,
        "esg_score": 65.0,
    },
    {
        "symbol": "TATAMOTORS",
        "name": "Tata Motors Ltd",
        "sector": "Automobiles",
        "industry": "Automobiles & Auto Components",
        "description": "Tata Motors Limited is an Indian multinational automotive manufacturing company. It manufactures cars, utility vehicles, buses, trucks and defence vehicles.",
        "market_cap": 3200000000000,
        "risk_score": 62.0,
        "fraud_score": 15.0,
        "sentiment_score": 55.0,
        "esg_score": 51.0,
    },
]

DEMO_USER = {
    "email": "demo@arthadrishti.ai",
    "username": "demo_analyst",
    "password": "Demo@2024#",
    "full_name": "Demo Analyst",
}

DEMO_ALERTS = [
    {
        "symbol": "TATAMOTORS",
        "alert_type": "risk_spike",
        "severity": "high",
        "title": "TATAMOTORS: Gross Debt increased ₹4,200 Cr QoQ — Source: Q3 FY25 Filing, Page 34",
        "body": "Tata Motors reported a significant increase in gross debt in Q3 FY25. "
                "Total automotive debt rose from ₹18,400 Cr to ₹22,600 Cr. "
                "Management cited JLR production ramp-up investment as primary driver. "
                "Free cash flow turned negative at -₹800 Cr for the quarter.",
        "evidence": {
            "source_file": "TATAMOTORS_Q3FY25_Results.pdf",
            "page": 34,
            "section": "Debt & Borrowings",
            "excerpt": "Total automotive borrowings as at December 31, 2024 stood at ₹22,600 Crore...",
        },
        "risk_delta": 14.2,
        "company_name": "Tata Motors Ltd",
    },
    {
        "symbol": "HDFCBANK",
        "alert_type": "sentiment_shift",
        "severity": "medium",
        "title": "HDFCBANK: Narrative Divergence Score = 67% — Management vs. News",
        "body": "Management commentary in Q2 FY26 earnings call emphasized 'robust deposit growth' "
                "and 'healthy asset quality'. However, recent news coverage highlights concerns over "
                "CASA ratio declining to 38.2% (from 44% a year ago) and rising credit costs.",
        "evidence": {
            "divergence_score": 67,
            "management_claim": "Deposit franchise remains strong with healthy growth momentum",
            "news_report": "HDFC Bank CASA ratio at multi-year low of 38.2%",
        },
        "risk_delta": 8.5,
        "company_name": "HDFC Bank Ltd",
    },
]

DEMO_PORTFOLIO = [
    {"symbol": "RELIANCE", "company_name": "Reliance Industries Ltd", "quantity": 50, "avg_buy_price": 2650.0, "sector": "Energy"},
    {"symbol": "TCS", "company_name": "Tata Consultancy Services Ltd", "quantity": 20, "avg_buy_price": 3800.0, "sector": "IT"},
    {"symbol": "HDFCBANK", "company_name": "HDFC Bank Ltd", "quantity": 100, "avg_buy_price": 1580.0, "sector": "Banking"},
]


async def seed():
    print("🌱 ArthaDrishti AI — Seeding demo data...")
    await create_tables()

    async with AsyncSessionLocal() as db:
        # ── Demo User ──────────────────────────────────────────────────────
        existing = await db.execute(select(User).where(User.email == DEMO_USER["email"]))
        user = existing.scalar_one_or_none()
        if not user:
            user = User(
                email=DEMO_USER["email"],
                username=DEMO_USER["username"],
                hashed_password=hash_password(DEMO_USER["password"]),
                full_name=DEMO_USER["full_name"],
                is_demo=True,
            )
            db.add(user)
            await db.flush()
            print(f"  ✓ Created demo user: {DEMO_USER['email']}")
        else:
            print(f"  → Demo user already exists: {DEMO_USER['email']}")

        # ── Companies ──────────────────────────────────────────────────────
        for cd in DEMO_COMPANIES:
            existing_co = await db.execute(select(Company).where(Company.symbol == cd["symbol"]))
            co = existing_co.scalar_one_or_none()
            if not co:
                co = Company(**{k: v for k, v in cd.items()})
                db.add(co)
                print(f"  ✓ Created company: {cd['symbol']}")

        # ── Watchlist ──────────────────────────────────────────────────────
        for cd in DEMO_COMPANIES:
            existing_wl = await db.execute(
                select(WatchlistItem).where(
                    WatchlistItem.user_id == user.id,
                    WatchlistItem.symbol == cd["symbol"],
                )
            )
            if not existing_wl.scalar_one_or_none():
                wl = WatchlistItem(
                    user_id=user.id,
                    symbol=cd["symbol"],
                    company_name=cd["name"],
                    last_risk_score=cd["risk_score"],
                )
                db.add(wl)
                print(f"  ✓ Added {cd['symbol']} to watchlist")

        # ── Alerts ────────────────────────────────────────────────────────
        for ad in DEMO_ALERTS:
            alert = Alert(
                user_id=user.id,
                symbol=ad["symbol"],
                company_name=ad.get("company_name", ad["symbol"]),
                alert_type=ad["alert_type"],
                severity=ad["severity"],
                title=ad["title"],
                body=ad["body"],
                evidence=ad["evidence"],
                risk_delta=ad.get("risk_delta", 0),
            )
            db.add(alert)
            print(f"  ✓ Created alert: {ad['title'][:60]}...")

        # ── Portfolio ─────────────────────────────────────────────────────
        for ph in DEMO_PORTFOLIO:
            existing_ph = await db.execute(
                select(PortfolioHolding).where(
                    PortfolioHolding.user_id == user.id,
                    PortfolioHolding.symbol == ph["symbol"],
                )
            )
            if not existing_ph.scalar_one_or_none():
                holding = PortfolioHolding(
                    user_id=user.id,
                    **ph,
                    current_price=ph["avg_buy_price"],
                )
                db.add(holding)
                print(f"  ✓ Added portfolio holding: {ph['symbol']}")

        await db.commit()

    print("\n✅ Seed complete!")
    print(f"\n   Demo Login:")
    print(f"   Email:    {DEMO_USER['email']}")
    print(f"   Password: {DEMO_USER['password']}")
    print(f"\n   Watchlisted: RELIANCE, TCS, INFY, HDFCBANK, TATAMOTORS")
    print(f"   Pre-loaded alerts: TATAMOTORS risk spike, HDFCBANK narrative divergence\n")


if __name__ == "__main__":
    asyncio.run(seed())
