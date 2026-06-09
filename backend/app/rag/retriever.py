"""
ChromaDB vector store interface.
Per-document collection naming: {user_id}_{symbol}_{filing_type}_{doc_id}
"""
import asyncio
from typing import List, Optional, Dict, Any

import chromadb
from chromadb.config import Settings as ChromaSettings

from app.core.config import settings
from app.rag.chunker import Chunk
from app.rag.embedder import embed_texts, embed_query


_client: Optional[chromadb.ClientAPI] = None


def get_chroma_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(anonymized_telemetry=False),
        )
    return _client


def collection_name(user_id: str, symbol: str, filing_type: str, doc_id: str) -> str:
    # ChromaDB collection names: 3-63 chars, alphanumeric + underscores/hyphens
    raw = f"{user_id[:8]}_{symbol}_{filing_type}_{doc_id[:8]}"
    return raw.lower().replace(" ", "_").replace("-", "_")[:63]


async def store_chunks(
    chunks: List[Chunk],
    user_id: str,
    symbol: str,
    filing_type: str,
    doc_id: str,
) -> str:
    """Embed chunks and upsert into ChromaDB. Returns collection name."""
    client = get_chroma_client()
    coll_name = collection_name(user_id, symbol, filing_type, doc_id)
    collection = client.get_or_create_collection(
        name=coll_name,
        metadata={"hnsw:space": "cosine"},
    )

    texts = [c.text for c in chunks]
    ids = [f"{doc_id}_{c.chunk_index}" for c in chunks]
    metadatas = [c.to_chroma_metadata() for c in chunks]

    # Embed in thread pool (sentence-transformers is sync)
    embeddings = await embed_texts(texts)

    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=texts,
            metadatas=metadatas,
        ),
    )
    return coll_name


async def retrieve_chunks(
    query: str,
    collection_names: List[str],
    top_k: int = 8,
) -> List[Dict[str, Any]]:
    """
    Query one or more ChromaDB collections, merge results, return top-k by score.
    """
    client = get_chroma_client()
    query_embedding = await embed_query(query)

    all_results: List[Dict[str, Any]] = []

    loop = asyncio.get_event_loop()

    for coll_name in collection_names:
        try:
            collection = client.get_collection(name=coll_name)
        except Exception:
            continue

        results = await loop.run_in_executor(
            None,
            lambda c=collection: c.query(
                query_embeddings=[query_embedding],
                n_results=min(top_k, collection.count() or 1),
                include=["documents", "metadatas", "distances"],
            ),
        )

        docs = results["documents"][0]
        metas = results["metadatas"][0]
        distances = results["distances"][0]

        for doc, meta, dist in zip(docs, metas, distances):
            relevance = 1.0 - float(dist)  # cosine distance → similarity
            all_results.append(
                {
                    "text": doc,
                    "metadata": meta,
                    "relevance_score": relevance,
                    "source_file": meta.get("source_file", ""),
                    "page_number": meta.get("page_number", 0),
                    "section_title": meta.get("section_title", ""),
                    "excerpt": doc[:200],
                }
            )

    # Sort by relevance, return top-k
    all_results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return all_results[:top_k]


async def list_collections_for_symbol(user_id: str, symbol: str) -> List[str]:
    """Return all ChromaDB collection names for a user+symbol pair."""
    client = get_chroma_client()
    loop = asyncio.get_event_loop()
    all_colls = await loop.run_in_executor(None, client.list_collections)
    prefix = f"{user_id[:8]}_{symbol.lower()}"
    return [c.name for c in all_colls if c.name.startswith(prefix)]


async def delete_collection(coll_name: str):
    client = get_chroma_client()
    loop = asyncio.get_event_loop()
    try:
        await loop.run_in_executor(None, lambda: client.delete_collection(coll_name))
    except Exception:
        pass
