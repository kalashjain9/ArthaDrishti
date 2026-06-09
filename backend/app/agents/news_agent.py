"""
NewsAgent — fetches, summarizes, and sentiment-scores news articles.
"""
from typing import Dict, Any, List
from app.utils.news import fetch_company_news
from app.utils.llm import llm_complete


NEWS_SENTIMENT_PROMPT = """You are a financial news analyst. For each news article provided, output:
1. A 2-3 sentence AI summary
2. Sentiment score: a float from -1.0 (very negative) to +1.0 (very positive)
3. Sentiment label: "positive" | "neutral" | "negative"

Respond in JSON array format:
[{"index": 0, "summary": "...", "sentiment_score": 0.0, "sentiment_label": "neutral"}, ...]

Focus on material business impact. Ignore opinion pieces and rumors.
"""


class NewsAgent:
    name = "NewsAgent"

    async def run(
        self,
        symbol: str,
        query: str = "",
        user_id: str = "",
        company_name: str = "",
        days: int = 30,
    ) -> Dict[str, Any]:
        company = company_name or symbol
        articles = await fetch_company_news(company, symbol, days=days)

        if not articles:
            return {
                "agent": self.name,
                "status": "no_news",
                "articles": [],
                "aggregate_sentiment": 0.0,
                "trend": "stable",
            }

        # Limit to 20 articles for LLM processing
        articles_to_analyze = articles[:20]

        # Build article list for LLM
        articles_text = ""
        for i, art in enumerate(articles_to_analyze):
            articles_text += f"\n[{i}] Title: {art['title']}\nSource: {art['source']}\nSummary: {art.get('summary', '')}\n"

        user_prompt = f"Company: {symbol}\n\nArticles:\n{articles_text}\n\nAnalyze sentiment for each article."

        try:
            response = await llm_complete(NEWS_SENTIMENT_PROMPT, user_prompt, temperature=0.05)
            import json
            json_text = response
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0]
            elif "```" in json_text:
                json_text = json_text.split("```")[1].split("```")[0]
            sentiments = json.loads(json_text)
        except Exception:
            sentiments = [{"index": i, "summary": art.get("summary", ""), "sentiment_score": 0.0, "sentiment_label": "neutral"}
                         for i, art in enumerate(articles_to_analyze)]

        # Merge sentiment back into articles
        enriched = []
        scores = []
        for s in sentiments:
            idx = s.get("index", 0)
            if idx < len(articles_to_analyze):
                art = dict(articles_to_analyze[idx])
                art["ai_summary"] = s.get("summary", art.get("summary", ""))
                art["sentiment_score"] = s.get("sentiment_score", 0.0)
                art["sentiment_label"] = s.get("sentiment_label", "neutral")
                enriched.append(art)
                scores.append(art["sentiment_score"])

        aggregate = sum(scores) / len(scores) if scores else 0.0

        # Determine trend by comparing recent vs older sentiment
        if len(scores) >= 4:
            recent_avg = sum(scores[:len(scores)//2]) / (len(scores)//2)
            older_avg = sum(scores[len(scores)//2:]) / (len(scores)//2)
            if recent_avg - older_avg > 0.2:
                trend = "improving"
            elif older_avg - recent_avg > 0.2:
                trend = "deteriorating"
            else:
                trend = "stable"
        else:
            trend = "stable"

        return {
            "agent": self.name,
            "status": "success",
            "articles": enriched,
            "aggregate_sentiment": round(aggregate, 3),
            "trend": trend,
            "article_count": len(enriched),
        }
