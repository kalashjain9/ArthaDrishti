"""
MacroAgent — tracks macro events and maps impact to sectors.
"""
from typing import Dict, Any, List
import json
from app.utils.market_data import get_macro_data
from app.utils.llm import llm_complete


# Indian sector sensitivity matrix to macro variables
SECTOR_SENSITIVITY = {
    "Banking": {
        "rbi_rate_hike": -0.7, "rbi_rate_cut": 0.8,
        "inr_depreciation": -0.3, "oil_rise": -0.2, "fii_outflow": -0.6,
    },
    "NBFC": {
        "rbi_rate_hike": -0.8, "rbi_rate_cut": 0.9,
        "inr_depreciation": -0.4, "oil_rise": -0.1, "fii_outflow": -0.5,
    },
    "IT": {
        "rbi_rate_hike": -0.1, "rbi_rate_cut": 0.2,
        "inr_depreciation": 0.7, "oil_rise": 0.0, "fii_outflow": -0.4,
        "us_recession": -0.8,
    },
    "Energy": {
        "rbi_rate_hike": -0.2, "rbi_rate_cut": 0.1,
        "inr_depreciation": -0.5, "oil_rise": 0.9, "fii_outflow": -0.3,
    },
    "Automobiles": {
        "rbi_rate_hike": -0.6, "rbi_rate_cut": 0.7,
        "inr_depreciation": -0.3, "oil_rise": -0.5, "fii_outflow": -0.4,
    },
    "FMCG": {
        "rbi_rate_hike": -0.2, "rbi_rate_cut": 0.3,
        "inr_depreciation": -0.4, "oil_rise": -0.3, "fii_outflow": -0.2,
    },
    "Pharma": {
        "rbi_rate_hike": -0.1, "rbi_rate_cut": 0.1,
        "inr_depreciation": 0.5, "oil_rise": -0.1, "fii_outflow": -0.2,
    },
    "Infrastructure": {
        "rbi_rate_hike": -0.7, "rbi_rate_cut": 0.8,
        "inr_depreciation": -0.3, "oil_rise": -0.4, "fii_outflow": -0.5,
    },
    "Real Estate": {
        "rbi_rate_hike": -0.9, "rbi_rate_cut": 0.9,
        "inr_depreciation": -0.2, "oil_rise": -0.2, "fii_outflow": -0.4,
    },
    "Metals": {
        "rbi_rate_hike": -0.3, "rbi_rate_cut": 0.2,
        "inr_depreciation": 0.4, "oil_rise": 0.2, "china_slowdown": -0.8,
    },
}


MACRO_ANALYSIS_PROMPT = """You are a macro economist specializing in Indian capital markets.

Analyze the provided macro event and determine its impact on Indian market sectors.
For each sector, provide an impact score (-1.0 to +1.0) and brief rationale.

Macro event: {event}

Consider:
- Direct vs. indirect effects
- Short-term (1-3 months) vs. structural impact
- Indian market-specific factors (RBI policy, FII flows, INR sensitivity)
- Supply chain and input cost effects

Respond in JSON:
{
  "event_summary": "...",
  "event_severity": "low|medium|high|critical",
  "sector_impacts": {
    "Banking": {"impact": 0.0, "direction": "positive|negative|neutral", "rationale": "..."},
    "IT": {...},
    "Energy": {...},
    "Automobiles": {...},
    "FMCG": {...},
    "Pharma": {...},
    "Infrastructure": {...},
    "Real Estate": {...},
    "Metals": {...},
    "NBFC": {...}
  },
  "key_risks": ["...", "..."],
  "key_opportunities": ["...", "..."],
  "time_horizon": "short-term|medium-term|long-term"
}
"""


class MacroAgent:
    name = "MacroAgent"

    async def run(
        self,
        symbol: str = "",
        query: str = "",
        user_id: str = "",
        scenario: str = "",
    ) -> Dict[str, Any]:
        # Fetch live macro data
        macro_data = await get_macro_data()

        # Build macro snapshot
        macro_snapshot = (
            f"NIFTY 50: {macro_data.get('nifty50', {}).get('value', 'N/A')} "
            f"({macro_data.get('nifty50', {}).get('change_pct', 0):.2f}%)\n"
            f"SENSEX: {macro_data.get('sensex', {}).get('value', 'N/A')}\n"
            f"INR/USD: {macro_data.get('inr_usd', {}).get('value', 'N/A')}\n"
            f"Crude Oil (WTI): ${macro_data.get('crude_oil', {}).get('value', 'N/A')}\n"
            f"US 10Y Treasury: {macro_data.get('us10y', {}).get('value', 'N/A')}%\n"
        )

        event = scenario or query or "Current macro conditions in Indian markets"

        user_prompt = f"Current Macro Snapshot:\n{macro_snapshot}\n\nAnalyze: {event}"

        try:
            response = await llm_complete(
                MACRO_ANALYSIS_PROMPT.format(event=event),
                user_prompt,
                temperature=0.1,
            )
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            analysis = json.loads(json_text)
        except Exception:
            analysis = {
                "event_summary": event,
                "event_severity": "medium",
                "sector_impacts": {
                    s: {"impact": 0.0, "direction": "neutral", "rationale": "Analysis unavailable."}
                    for s in SECTOR_SENSITIVITY
                },
                "key_risks": [],
                "key_opportunities": [],
                "time_horizon": "medium-term",
            }

        return {
            "agent": self.name,
            "status": "success",
            "macro_data": macro_data,
            "analysis": analysis,
            "sector_sensitivity_matrix": SECTOR_SENSITIVITY,
        }

    def get_company_exposure(self, sector: str, macro_events: List[str]) -> float:
        """Compute macro exposure score for a company in a given sector."""
        sensitivity = SECTOR_SENSITIVITY.get(sector, {})
        if not sensitivity or not macro_events:
            return 50.0  # neutral

        total_impact = 0.0
        count = 0
        for event in macro_events:
            event_key = event.lower().replace(" ", "_")
            if event_key in sensitivity:
                total_impact += sensitivity[event_key]
                count += 1

        if count == 0:
            return 50.0

        avg_impact = total_impact / count
        # Convert -1 to +1 scale to 0-100 risk score (negative impact = higher risk)
        return round(50 - avg_impact * 30, 1)
