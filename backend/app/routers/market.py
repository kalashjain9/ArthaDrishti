"""
Market router — overview, macro events, event impact simulator.
"""
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import get_current_user
from app.models.user import User
from app.agents.macro_agent import MacroAgent, SECTOR_SENSITIVITY
from app.utils.market_data import get_macro_data
from pydantic import BaseModel

router = APIRouter(prefix="/market", tags=["market"])


class SimulateRequest(BaseModel):
    scenario: str
    symbols: list[str] = []


@router.get("/overview")
async def market_overview(
    current_user: User = Depends(get_current_user),
):
    """NIFTY, SENSEX, INR/USD, sector data."""
    macro = await get_macro_data()
    return {
        "indices": macro,
        "status": "live",
    }


@router.get("/macro")
async def get_macro_analysis(
    current_user: User = Depends(get_current_user),
):
    """Current macro conditions and sector impact."""
    agent = MacroAgent()
    result = await agent.run(query="Current macro conditions in Indian markets")
    return result


@router.post("/simulate")
async def simulate_macro_event(
    request: SimulateRequest,
    current_user: User = Depends(get_current_user),
):
    """Simulate macro event impact on sectors and portfolio."""
    if not request.scenario.strip():
        raise HTTPException(status_code=400, detail="Scenario description required")

    agent = MacroAgent()
    result = await agent.run(
        query=request.scenario,
        scenario=request.scenario,
        user_id=current_user.id,
    )

    # If symbols provided, compute per-company exposure
    company_impacts = []
    if request.symbols:
        sector_impacts = result.get("analysis", {}).get("sector_impacts", {})
        for sym in request.symbols:
            from app.utils.market_data import get_financials
            fin = await get_financials(sym)
            sector = fin.get("sector", "")
            impact = sector_impacts.get(sector, {})
            company_impacts.append({
                "symbol": sym,
                "sector": sector,
                "impact_score": impact.get("impact", 0.0),
                "direction": impact.get("direction", "neutral"),
                "rationale": impact.get("rationale", ""),
            })

    result["company_impacts"] = company_impacts
    return result


@router.get("/sector-heatmap")
async def sector_heatmap(
    current_user: User = Depends(get_current_user),
):
    """Sector sensitivity matrix for the heatmap widget."""
    return {"sectors": list(SECTOR_SENSITIVITY.keys()), "sensitivity": SECTOR_SENSITIVITY}
