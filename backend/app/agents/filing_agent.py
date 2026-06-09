"""
FilingAgent — fetches, ingests, and semantically searches company filings.
"""
from typing import List, Dict, Any, Optional
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.rag.ingestion import ingest_from_url
from app.utils.llm import llm_complete
from app.rag.citation_engine import build_rag_prompt, extract_citations
import httpx
from app.core.config import settings


# Known filing URLs for demo companies (BSE public PDFs)
DEMO_FILING_URLS: Dict[str, List[Dict[str, str]]] = {
    "RELIANCE": [
        {
            "url": "https://www.bseindia.com/xml-data/corpfiling/AttachLive/3c1e5b14-e2b5-4e5e-8e1e-3c1e5b14e2b5.pdf",
            "filing_type": "annual_report",
            "fiscal_year": "FY2024",
        }
    ],
    "TCS": [],
    "INFY": [],
    "HDFCBANK": [],
    "TATAMOTORS": [],
}


class FilingAgent:
    name = "FilingAgent"

    async def run(
        self,
        symbol: str,
        query: str,
        user_id: str,
        top_k: int = 8,
    ) -> Dict[str, Any]:
        """
        1. Get available ChromaDB collections for this user+symbol.
        2. Run semantic search.
        3. Return chunks with citations.
        """
        collection_names = await list_collections_for_symbol(user_id, symbol)

        if not collection_names:
            return {
                "agent": self.name,
                "status": "no_documents",
                "message": f"No ingested filings found for {symbol}. Please upload a filing PDF.",
                "chunks": [],
            }

        chunks = await retrieve_chunks(query, collection_names, top_k=top_k)

        return {
            "agent": self.name,
            "status": "success",
            "chunks": chunks,
            "collection_count": len(collection_names),
        }

    async def get_answer(
        self,
        symbol: str,
        query: str,
        user_id: str,
    ) -> Dict[str, Any]:
        """Full RAG answer with citations."""
        result = await self.run(symbol=symbol, query=query, user_id=user_id)
        if result["status"] != "success":
            return result

        chunks = result["chunks"]
        system_prompt, user_prompt = build_rag_prompt(
            query=query,
            chunks=chunks,
            system_context=f"You are analyzing {symbol} filings.",
        )
        answer = await llm_complete(system_prompt, user_prompt)
        citations = extract_citations(answer, chunks)

        return {
            "agent": self.name,
            "status": "success",
            "answer": answer,
            "citations": [c.to_dict() for c in citations],
            "chunks": chunks,
        }

    async def fetch_bse_filings(self, symbol: str) -> List[Dict[str, str]]:
        """Attempt to fetch latest filing URLs from Finnhub."""
        if not settings.FINNHUB_API_KEY:
            return []
        url = f"https://finnhub.io/api/v1/stock/filing"
        params = {
            "symbol": f"NSE:{symbol}",
            "token": settings.FINNHUB_API_KEY,
        }
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                data = resp.json()
            filings = []
            for item in data[:5]:
                if item.get("reportUrl"):
                    filings.append({
                        "url": item["reportUrl"],
                        "filing_type": item.get("form", "filing"),
                        "fiscal_year": item.get("period", ""),
                    })
            return filings
        except Exception:
            return []
