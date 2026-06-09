"""
FraudAgent — Beneish M-Score proxy + auditor red flags from filings.
"""
from typing import Dict, Any, List
import json
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.utils.llm import llm_complete
from app.utils.market_data import get_financials


FRAUD_DETECTION_PROMPT = """You are a forensic accountant analyzing company filings for fraud indicators.

Analyze the provided filing excerpts for:

BENEISH M-SCORE PROXY (compute from available data):
- DSRI: Days Sales Receivables Index - if receivables growing faster than revenue = flag
- GMI: Gross Margin Index - deteriorating gross margin = flag
- AQI: Asset Quality Index - non-current assets growing disproportionately = flag
- SGI: Sales Growth Index - abnormally high growth can indicate channel stuffing
- DEPI: Depreciation Index - declining depreciation rate = flag
- SGAI: SG&A Index - rising selling/admin expenses = flag
- TATA: Total Accruals to Total Assets - high accruals = flag
- LVGI: Leverage Index - rising leverage = flag

RED FLAGS TO LOOK FOR:
- Auditor qualification, emphasis of matter, change of auditor
- Related Party Transactions (RPT) that seem disproportionate
- Promoter pledge increase (risk of margin calls)
- Contingent liabilities that are large relative to net worth
- Revenue recognition changes
- Cash flow from operations significantly below reported profit
- Unusual spike in debtors/inventory without revenue justification
- Write-offs or provisions in the last quarter of the fiscal year

Respond ONLY in valid JSON:
{
  "fraud_probability": "Low|Medium|High",
  "m_score_estimate": -2.5,
  "m_score_interpretation": "Below -2.22 = unlikely manipulation; Above -2.22 = possible manipulation",
  "beneish_components": {
    "DSRI": {"value": 0.0, "flag": false, "note": "..."},
    "GMI": {"value": 0.0, "flag": false, "note": "..."},
    "AQI": {"value": 0.0, "flag": false, "note": "..."},
    "SGI": {"value": 0.0, "flag": false, "note": "..."},
    "DEPI": {"value": 0.0, "flag": false, "note": "..."},
    "SGAI": {"value": 0.0, "flag": false, "note": "..."},
    "TATA": {"value": 0.0, "flag": false, "note": "..."},
    "LVGI": {"value": 0.0, "flag": false, "note": "..."}
  },
  "red_flags": [
    {"flag": "...", "severity": "low|medium|high", "source": "[Source: X, Page: Y]", "evidence": "..."}
  ],
  "green_flags": ["..."],
  "auditor_status": "clean|qualified|emphasis_of_matter|adverse|not_found",
  "promoter_pledge_pct": 0.0,
  "rpt_concerns": "none|minor|material",
  "overall_assessment": "..."
}
"""


class FraudAgent:
    name = "FraudAgent"

    async def run(
        self,
        symbol: str,
        query: str = "",
        user_id: str = "",
    ) -> Dict[str, Any]:
        # Get filing chunks focused on fraud indicators
        collection_names = await list_collections_for_symbol(user_id, symbol)
        chunks = []
        if collection_names:
            chunks = await retrieve_chunks(
                "auditor qualification related party transactions promoter pledge "
                "contingent liabilities receivables inventory write-off provision "
                "going concern emphasis of matter",
                collection_names,
                top_k=10,
            )

        # Get financial data for ratio computation
        fin_data = await get_financials(symbol)

        # Build context
        filing_context = "\n".join([
            f"[Source: {c.get('metadata', {}).get('source_file', 'Filing')}, "
            f"Page: {c.get('metadata', {}).get('page_number', 0)}]\n{c['text'][:400]}"
            for c in chunks[:8]
        ]) or "No filing data available."

        fin_context = f"""
Financial Data for {symbol}:
- Revenue: {fin_data.get('revenue', 'N/A')}
- Net Income: {fin_data.get('net_income', 'N/A')}
- Debt/Equity: {fin_data.get('debt_equity', 'N/A')}
- Current Ratio: {fin_data.get('current_ratio', 'N/A')}
- ROE: {fin_data.get('roe', 'N/A')}
"""

        user_prompt = (
            f"Company: {symbol}\n\n"
            f"{fin_context}\n\n"
            f"FILING EXCERPTS:\n{filing_context}\n\n"
            f"Perform forensic analysis and compute fraud indicators."
        )

        try:
            response = await llm_complete(FRAUD_DETECTION_PROMPT, user_prompt, temperature=0.05)
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            result = json.loads(json_text)
        except Exception:
            result = {
                "fraud_probability": "Low",
                "m_score_estimate": -2.8,
                "m_score_interpretation": "Insufficient data for full M-Score computation.",
                "beneish_components": {},
                "red_flags": [],
                "green_flags": [],
                "auditor_status": "not_found",
                "promoter_pledge_pct": 0.0,
                "rpt_concerns": "none",
                "overall_assessment": "Insufficient filing data for comprehensive fraud analysis.",
            }

        result["agent"] = self.name
        result["status"] = "success"
        return result
