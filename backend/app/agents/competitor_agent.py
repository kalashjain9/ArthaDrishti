"""
CompetitorAgent — peer comparison across key financial metrics.
"""
from typing import Dict, Any, List
import json
from app.utils.market_data import get_peer_financials, get_financials
from app.utils.llm import llm_complete


# Default peer groups for major Indian sectors
SECTOR_PEERS = {
    "RELIANCE": ["TCS", "HINDUNILVR", "HDFCBANK", "ICICIBANK", "BHARTIARTL"],
    "TCS": ["INFY", "WIPRO", "HCLTECH", "TECHM", "LTIM"],
    "INFY": ["TCS", "WIPRO", "HCLTECH", "TECHM", "LTIM"],
    "HDFCBANK": ["ICICIBANK", "KOTAKBANK", "SBIN", "AXISBANK", "INDUSINDBK"],
    "ICICIBANK": ["HDFCBANK", "KOTAKBANK", "SBIN", "AXISBANK", "INDUSINDBK"],
    "TATAMOTORS": ["MARUTI", "M&M", "HEROMOTOCO", "BAJAJ-AUTO", "EICHERMOT"],
    "MARUTI": ["TATAMOTORS", "M&M", "HEROMOTOCO", "BAJAJ-AUTO", "EICHERMOT"],
    "WIPRO": ["TCS", "INFY", "HCLTECH", "TECHM", "LTIM"],
    "SUNPHARMA": ["DRREDDY", "CIPLA", "DIVISLAB", "BIOCON", "LUPIN"],
    "ADANIENT": ["RELIANCE", "L&T", "POWERGRID", "NTPC", "ONGC"],
}


class CompetitorAgent:
    name = "CompetitorAgent"

    async def run(
        self,
        symbol: str,
        query: str = "",
        user_id: str = "",
        peers: List[str] = None,
    ) -> Dict[str, Any]:
        # Auto-detect peers if not provided
        if not peers:
            peers = SECTOR_PEERS.get(symbol.upper(), [])

        if not peers:
            return {
                "agent": self.name,
                "status": "no_peers",
                "message": f"No peer group found for {symbol}.",
                "peer_comparison": [],
            }

        # Fetch financials for company + all peers
        all_symbols = [symbol] + peers[:5]
        financials = await get_peer_financials(all_symbols)

        # Build comparison matrix
        metrics = ["market_cap", "pe_ratio", "pb_ratio", "debt_equity", "roe", "roce",
                   "current_ratio", "revenue", "net_income", "ebitda", "beta"]

        comparison = []
        for fin in financials:
            entry = {"symbol": fin.get("symbol", ""), "name": fin.get("name", "")}
            for m in metrics:
                entry[m] = fin.get(m, 0)
            comparison.append(entry)

        # Compute rankings
        ranked_comparison = _rank_metrics(comparison, symbol)

        # Get LLM analysis
        comparison_text = "\n".join([
            f"{c['symbol']}: P/E={c.get('pe_ratio', 'N/A')}, D/E={c.get('debt_equity', 'N/A')}, "
            f"ROE={c.get('roe', 'N/A'):.2%}" if isinstance(c.get('roe', 0), float) and c.get('roe', 0) else
            f"{c['symbol']}: P/E={c.get('pe_ratio', 'N/A')}, D/E={c.get('debt_equity', 'N/A')}"
            for c in comparison
        ])

        system_prompt = (
            "You are a buy-side equity analyst. Provide a concise competitive positioning analysis "
            "for the target company vs. its peers. Be specific about relative strengths and weaknesses."
        )
        user_prompt = (
            f"Target Company: {symbol}\n\nPeer Comparison Data:\n{comparison_text}\n\n"
            f"In 3-4 sentences, describe {symbol}'s competitive position, relative valuation, "
            f"and key differentiators vs. peers."
        )

        try:
            analysis = await llm_complete(system_prompt, user_prompt, temperature=0.1)
        except Exception:
            analysis = f"Competitive analysis for {symbol} vs peers based on key financial metrics."

        # Determine relative position
        target_data = next((c for c in comparison if c["symbol"] == symbol), {})
        peer_data = [c for c in comparison if c["symbol"] != symbol]
        relative_position = _determine_position(target_data, peer_data)

        return {
            "agent": self.name,
            "status": "success",
            "peer_comparison": ranked_comparison,
            "relative_position": relative_position,
            "analysis": analysis,
            "peer_count": len(peers),
        }


def _rank_metrics(comparison: List[Dict], target_symbol: str) -> List[Dict]:
    """Add rank/percentile for key metrics."""
    rank_metrics = ["pe_ratio", "roe", "debt_equity"]

    for metric in rank_metrics:
        values = [(c["symbol"], c.get(metric, 0)) for c in comparison if c.get(metric, 0) > 0]
        if not values:
            continue
        # Sort: for debt_equity, lower is better; for roe, higher is better
        reverse = metric in ["roe", "roce"]
        sorted_vals = sorted(values, key=lambda x: x[1], reverse=reverse)
        ranks = {sym: i + 1 for i, (sym, _) in enumerate(sorted_vals)}
        for c in comparison:
            c[f"{metric}_rank"] = ranks.get(c["symbol"], 0)
            c[f"{metric}_total"] = len(values)

    return comparison


def _determine_position(target: Dict, peers: List[Dict]) -> str:
    """top_quartile | median | bottom_quartile."""
    if not peers:
        return "median"

    score = 0
    # ROE comparison
    target_roe = target.get("roe", 0)
    peer_roes = [p.get("roe", 0) for p in peers if p.get("roe", 0) > 0]
    if peer_roes:
        percentile = sum(1 for r in peer_roes if r < target_roe) / len(peer_roes)
        score += percentile

    # P/E comparison (lower can be value, but very low might mean poor growth)
    # Simplified: rank by ROE as primary indicator
    if score > 0.75:
        return "top_quartile"
    elif score < 0.25:
        return "bottom_quartile"
    return "median"
