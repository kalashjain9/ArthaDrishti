"""
RiskAgent — computes RashtriyaRiskIndex across 8 dimensions.
"""
from typing import Dict, Any, List
import json
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.utils.llm import llm_complete
from app.utils.market_data import get_financials
from app.rag.citation_engine import EXPLAINABILITY_SUFFIX


RISK_DIMENSIONS = [
    "financial", "operational", "geopolitical", "legal",
    "market", "esg", "fraud", "macro"
]

RISK_EXTRACTION_PROMPT = """
You are a financial risk analyst specializing in Indian equity markets.
Analyze the provided filing excerpts and financial data to compute a risk score (0-100) for each dimension.

Risk Dimensions to score (0=lowest risk, 100=highest risk):
1. Financial Risk: debt/equity trend, interest coverage ratio, cash flow health, liquidity
2. Operational Risk: margin compression, supply chain mentions, capacity utilization  
3. Geopolitical Risk: export dependency, INR/USD sensitivity, regulatory risks
4. Legal Risk: litigation mentions, regulatory orders, show-cause notices
5. Market Risk: beta, volatility, price momentum risk
6. ESG Risk: environmental violations, governance red flags, board independence issues
7. Fraud Risk: auditor qualifications, related party transactions, accounting anomalies
8. Macro Risk: sector sensitivity to interest rates, inflation, global commodity prices

For each dimension, provide:
- score: 0-100 integer
- level: "low" (0-30), "medium" (31-60), "high" (61-80), "critical" (81-100)
- evidence: list of specific text evidence with source citations
- key_finding: one-sentence summary

Respond ONLY in valid JSON format:
{
  "financial": {"score": N, "level": "...", "key_finding": "...", "evidence": ["[Source: X, Page: Y] text..."]},
  "operational": {...},
  "geopolitical": {...},
  "legal": {...},
  "market": {...},
  "esg": {...},
  "fraud": {...},
  "macro": {...},
  "overall_score": N,
  "summary": "..."
}
""" + EXPLAINABILITY_SUFFIX


class RiskAgent:
    name = "RiskAgent"

    async def run(
        self,
        symbol: str,
        query: str = "What are the key risks facing this company?",
        user_id: str = "",
        financial_data: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        """Compute full RashtriyaRiskIndex."""
        # Get filing chunks
        collection_names = await list_collections_for_symbol(user_id, symbol)
        chunks = []
        if collection_names:
            chunks = await retrieve_chunks(
                "risk factors debt obligations legal litigation ESG governance fraud auditor",
                collection_names,
                top_k=12,
            )

        # Get financial ratios from yfinance
        fin_data = financial_data or await get_financials(symbol)

        # Build context
        context_parts = []
        for chunk in chunks:
            meta = chunk.get("metadata", {})
            context_parts.append(
                f"[Source: {meta.get('source_file', 'Filing')}, Page: {meta.get('page_number', 0)}]\n"
                f"{chunk['text'][:500]}"
            )

        fin_context = f"""
Financial Metrics for {symbol}:
- P/E Ratio: {fin_data.get('pe_ratio', 'N/A')}
- Debt/Equity: {fin_data.get('debt_equity', 'N/A')}
- ROE: {fin_data.get('roe', 'N/A')}
- Current Ratio: {fin_data.get('current_ratio', 'N/A')}
- Beta: {fin_data.get('beta', 'N/A')}
- Market Cap: {fin_data.get('market_cap', 'N/A')}
"""

        user_prompt = (
            f"Company: {symbol}\n\n"
            f"{fin_context}\n\n"
            f"FILING EXCERPTS:\n" + "\n---\n".join(context_parts[:8]) + "\n\n"
            f"Compute the RashtriyaRiskIndex for all 8 dimensions."
        )

        response = await llm_complete(RISK_EXTRACTION_PROMPT, user_prompt, temperature=0.05)

        # Parse JSON response
        try:
            # Extract JSON from response (may have markdown fences)
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            risk_data = json.loads(json_text)
        except Exception:
            # Fallback risk data
            risk_data = _default_risk_scores()

        # Normalize and add metadata
        risk_data["symbol"] = symbol
        risk_data["filing_chunks_used"] = len(chunks)

        return {
            "agent": self.name,
            "status": "success",
            "risk_index": risk_data,
        }


def _default_risk_scores() -> Dict[str, Any]:
    """Return neutral risk scores when parsing fails."""
    dims = {}
    for dim in RISK_DIMENSIONS:
        dims[dim] = {
            "score": 50,
            "level": "medium",
            "key_finding": "Insufficient data for detailed analysis.",
            "evidence": [],
        }
    return {**dims, "overall_score": 50, "summary": "Risk analysis based on limited data."}


def score_to_level(score: float) -> str:
    if score <= 30:
        return "low"
    elif score <= 60:
        return "medium"
    elif score <= 80:
        return "high"
    return "critical"
