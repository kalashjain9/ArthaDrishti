"""
News aggregator — NewsAPI + GNews + RSS feeds.
"""
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import httpx
from app.core.config import settings


async def fetch_company_news(company_name: str, symbol: str, days: int = 7) -> List[Dict[str, Any]]:
    """Fetch news from multiple sources, deduplicate, return sorted list."""
    tasks = [
        _newsapi_fetch(company_name, symbol, days),
        _gnews_fetch(company_name, symbol),
        _rss_fetch(company_name),
    ]
    all_results = await asyncio.gather(*tasks, return_exceptions=True)

    articles: List[Dict[str, Any]] = []
    seen_titles = set()

    for result in all_results:
        if isinstance(result, Exception):
            continue
        for art in result:
            title = art.get("title", "").lower()[:80]
            if title and title not in seen_titles:
                seen_titles.add(title)
                articles.append(art)

    # Sort by published_at descending
    articles.sort(key=lambda x: x.get("published_at", ""), reverse=True)
    return articles[:50]


async def _newsapi_fetch(company: str, symbol: str, days: int) -> List[Dict[str, Any]]:
    if not settings.NEWS_API_KEY:
        return []
    from_date = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": f"{company} OR {symbol}",
        "from": from_date,
        "sortBy": "publishedAt",
        "language": "en",
        "pageSize": 30,
        "apiKey": settings.NEWS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        data = resp.json()
    articles = []
    for art in data.get("articles", []):
        articles.append({
            "title": art.get("title", ""),
            "url": art.get("url", ""),
            "source": art.get("source", {}).get("name", "NewsAPI"),
            "published_at": art.get("publishedAt", ""),
            "summary": art.get("description", ""),
            "content": art.get("content", ""),
        })
    return articles


async def _gnews_fetch(company: str, symbol: str) -> List[Dict[str, Any]]:
    if not settings.GNEWS_API_KEY:
        return []
    url = "https://gnews.io/api/v4/search"
    params = {
        "q": f"{company} {symbol}",
        "lang": "en",
        "country": "in",
        "max": 20,
        "token": settings.GNEWS_API_KEY,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(url, params=params)
            data = resp.json()
        articles = []
        for art in data.get("articles", []):
            articles.append({
                "title": art.get("title", ""),
                "url": art.get("url", ""),
                "source": art.get("source", {}).get("name", "GNews"),
                "published_at": art.get("publishedAt", ""),
                "summary": art.get("description", ""),
            })
        return articles
    except Exception:
        return []


# Indian financial RSS feeds
RSS_FEEDS = [
    "https://economictimes.indiatimes.com/markets/stocks/rss.cms",
    "https://www.moneycontrol.com/rss/latestnews.xml",
    "https://www.business-standard.com/rss/markets-106.rss",
]


async def _rss_fetch(company: str) -> List[Dict[str, Any]]:
    articles = []
    company_lower = company.lower()
    async with httpx.AsyncClient(timeout=10) as client:
        for feed_url in RSS_FEEDS:
            try:
                resp = await client.get(feed_url)
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(resp.text, "xml")
                items = soup.find_all("item")
                for item in items:
                    title = item.find("title")
                    title_text = title.get_text() if title else ""
                    if company_lower not in title_text.lower():
                        continue
                    link = item.find("link")
                    pub_date = item.find("pubDate")
                    desc = item.find("description")
                    articles.append({
                        "title": title_text,
                        "url": link.get_text() if link else "",
                        "source": feed_url.split("/")[2],
                        "published_at": pub_date.get_text() if pub_date else "",
                        "summary": BeautifulSoup(desc.get_text() if desc else "", "html.parser").get_text()[:300],
                    })
            except Exception:
                continue
    return articles
