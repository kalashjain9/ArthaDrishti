"""
EarningsAgent — analyzes earnings call transcripts for management confidence, guidance, and risks.
"""
from typing import Dict, Any, List
import json
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.utils.llm import llm_complete


EARNINGS_ANALYSIS_PROMPT = """You are an expert earnings call analyst specializing in Indian companies.

Analyze the provided earnings call transcript excerpts for:

1. MANAGEMENT CONFIDENCE SCORE (0-100)
   - Tone of responses
   - Use of hedging language ("subject to", "may", "could")
   - Specificity of guidance
   - Response quality to analyst questions

2. FORWARD GUIDANCE TONE: "positive" | "neutral" | "cautious" | "negative"

3. KEY BUSINESS UPDATES:
   - New business wins / contracts
   - Expansion plans
   - Product launches
   - Strategic partnerships

4. RISKS EXPLICITLY MENTIONED BY MANAGEMENT

5. KEY METRICS GUIDANCE (if mentioned):
   - Revenue growth guidance
   - Margin guidance
   - Capex plans

6. LANGUAGE QUALITY FLAGS:
   - Evasive answers (high hedge language usage)
   - Contradiction with published financials
   - Vague forward guidance

Respond ONLY in valid JSON:
{
  "management_confidence_score": N,
  "confidence_level": "high|moderate|low",
  "forward_guidance_tone": "positive|neutral|cautious|negative",
  "guidance_summary": "...",
  "new_business_plans": ["..."],
  "risks_mentioned": ["..."],
  "key_metrics_guidance": {
    "revenue_growth": "...",
    "margin": "...",
    "capex": "..."
  },
  "language_flags": {
    "evasive_answers": false,
    "contradiction_flags": [],
    "hedge_language_count": N,
    "positive_signal_count": N
  },
  "key_quotes": [
    {"speaker": "...", "quote": "...", "significance": "positive|negative|neutral"}
  ],
  "overall_assessment": "...",
  "analyst_sentiment": "bullish|neutral|bearish"
}
"""


class EarningsAgent:
    name = "EarningsAgent"

    async def run(
        self,
        symbol: str,
        query: str = "",
        user_id: str = "",
    ) -> Dict[str, Any]:
        # Look for earnings call transcripts in ChromaDB
        collection_names = await list_collections_for_symbol(user_id, symbol)
        chunks = []
        if collection_names:
            chunks = await retrieve_chunks(
                "management commentary earnings guidance revenue growth margin outlook "
                "analyst question forward guidance Q&A",
                collection_names,
                top_k=10,
            )

        if not chunks:
            return {
                "agent": self.name,
                "status": "no_transcript",
                "message": f"No earnings transcript found for {symbol}. Upload an earnings call PDF.",
                "confidence_score": 0,
            }

        # Build transcript context
        transcript_context = "\n".join([
            f"[Source: {c.get('metadata', {}).get('source_file', 'Transcript')}, "
            f"Page: {c.get('metadata', {}).get('page_number', 0)}]\n{c['text'][:500]}"
            for c in chunks[:8]
        ])

        user_prompt = (
            f"Company: {symbol}\n\n"
            f"EARNINGS TRANSCRIPT EXCERPTS:\n{transcript_context}\n\n"
            f"Perform comprehensive earnings call analysis."
        )

        try:
            response = await llm_complete(EARNINGS_ANALYSIS_PROMPT, user_prompt, temperature=0.05)
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            result = json.loads(json_text)
        except Exception:
            result = {
                "management_confidence_score": 50,
                "confidence_level": "moderate",
                "forward_guidance_tone": "neutral",
                "guidance_summary": "Analysis unavailable.",
                "new_business_plans": [],
                "risks_mentioned": [],
                "key_metrics_guidance": {},
                "language_flags": {},
                "key_quotes": [],
                "overall_assessment": "Insufficient data for earnings analysis.",
                "analyst_sentiment": "neutral",
            }

        result["agent"] = self.name
        result["status"] = "success"
        return result
