"""
SentimentAgent — detects Narrative Divergence between management filings and news.
"""
from typing import Dict, Any, List
import json
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.utils.llm import llm_complete


DIVERGENCE_PROMPT = """You are a financial analyst specializing in detecting narrative divergence.

You will be given:
1. Management tone (from company filings/management commentary)
2. News tone (from recent news coverage)

Your job:
1. Analyze the MANAGEMENT tone from filing excerpts
2. Compare with NEWS tone from news summaries
3. Identify specific CONTRADICTIONS — where management says X but news reports Y
4. Compute a Divergence Score (0-100):
   - 0-30: Low divergence (management and news agree)
   - 31-60: Moderate divergence (some differences but not alarming)
   - 61-80: High divergence (significant discrepancies, warrants attention)
   - 81-100: Critical divergence (management narrative vs reality gap — red flag)

Respond ONLY in valid JSON:
{
  "divergence_score": N,
  "divergence_level": "low|moderate|high|critical",
  "management_tone": "positive|neutral|negative",
  "management_tone_summary": "...",
  "news_tone": "positive|neutral|negative",
  "news_tone_summary": "...",
  "contradictions": [
    {
      "topic": "...",
      "management_claim": "...",
      "news_report": "...",
      "severity": "low|medium|high"
    }
  ],
  "overall_assessment": "..."
}
"""


class SentimentAgent:
    name = "SentimentAgent"

    async def run(
        self,
        symbol: str,
        query: str = "",
        user_id: str = "",
        news_data: Dict[str, Any] = None,
    ) -> Dict[str, Any]:
        # Get management language from filings
        collection_names = await list_collections_for_symbol(user_id, symbol)
        mgmt_chunks = []
        if collection_names:
            mgmt_chunks = await retrieve_chunks(
                "management outlook growth strategy guidance demand supply chain performance",
                collection_names,
                top_k=6,
            )

        # Get news sentiment
        if not news_data:
            from app.agents.news_agent import NewsAgent
            news_data = await NewsAgent().run(symbol=symbol, user_id=user_id)

        # Build filing context
        filing_context = "\n".join([
            f"[Filing excerpt] {c['text'][:400]}"
            for c in mgmt_chunks[:5]
        ]) or "No filing data available."

        # Build news context
        news_articles = news_data.get("articles", [])[:10]
        news_context = "\n".join([
            f"[News: {art.get('source', 'Unknown')}] {art.get('ai_summary', art.get('title', ''))}"
            f" (Sentiment: {art.get('sentiment_label', 'neutral')})"
            for art in news_articles
        ]) or "No news data available."

        user_prompt = (
            f"Company: {symbol}\n\n"
            f"MANAGEMENT LANGUAGE (from filings):\n{filing_context}\n\n"
            f"NEWS COVERAGE:\n{news_context}\n\n"
            f"Analyze narrative divergence."
        )

        try:
            response = await llm_complete(DIVERGENCE_PROMPT, user_prompt, temperature=0.05)
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            result = json.loads(json_text)
        except Exception:
            result = {
                "divergence_score": 30,
                "divergence_level": "low",
                "management_tone": "neutral",
                "management_tone_summary": "Analysis unavailable.",
                "news_tone": "neutral",
                "news_tone_summary": "Analysis unavailable.",
                "contradictions": [],
                "overall_assessment": "Insufficient data for divergence analysis.",
            }

        result["agent"] = self.name
        result["status"] = "success"
        result["news_aggregate_sentiment"] = news_data.get("aggregate_sentiment", 0.0)
        return result
