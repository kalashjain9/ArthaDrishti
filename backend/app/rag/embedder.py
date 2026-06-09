"""
Embedding module — uses OpenAI text-embedding-3-small.
Requires OPENAI_API_KEY to be set in .env.
"""
from typing import List
from fastapi import HTTPException

from app.core.config import settings


async def embed_texts(texts: List[str]) -> List[List[float]]:
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured. Set it in backend/.env to enable document ingestion and RAG."
        )
    return await _openai_embed(texts)


async def embed_query(query: str) -> List[float]:
    results = await embed_texts([query])
    return results[0]


async def _openai_embed(texts: List[str]) -> List[List[float]]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

    all_embeddings = []
    batch_size = 100
    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        response = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=batch,
        )
        all_embeddings.extend([r.embedding for r in response.data])
    return all_embeddings
