"""
Citation engine — extracts structured citations from LLM responses.
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class Citation:
    source_file: str
    page_number: int
    section: str
    excerpt: str
    relevance_score: float = 0.0

    def to_dict(self) -> dict:
        return {
            "source_file": self.source_file,
            "page_number": self.page_number,
            "section": self.section,
            "excerpt": self.excerpt,
            "relevance_score": self.relevance_score,
        }


# Pattern: [Source: filename.pdf, Page: 42] or [Source: filename.pdf, Page: 42, Section: Debt]
CITATION_RE = re.compile(
    r"\[Source:\s*([^,\]]+?)(?:,\s*Page:\s*(\d+))?(?:,\s*Section:\s*([^\]]+?))?\]",
    re.IGNORECASE,
)


def extract_citations(
    response_text: str,
    retrieved_chunks: List[Dict[str, Any]],
) -> List[Citation]:
    """
    Parse [Source: X, Page: Y] markers from LLM response,
    match to retrieved chunks to add excerpts.
    Returns list of structured Citations.
    """
    citations: List[Citation] = []
    seen = set()

    for match in CITATION_RE.finditer(response_text):
        source_file = match.group(1).strip()
        page_num = int(match.group(2)) if match.group(2) else 0
        section = (match.group(3) or "").strip()

        key = (source_file, page_num)
        if key in seen:
            continue
        seen.add(key)

        # Try to find matching chunk
        excerpt = ""
        relevance = 0.0
        for chunk in retrieved_chunks:
            meta = chunk.get("metadata", {})
            if (
                source_file.lower() in chunk.get("source_file", "").lower()
                and (page_num == 0 or meta.get("page_number", 0) == page_num)
            ):
                excerpt = chunk.get("text", "")[:300]
                relevance = chunk.get("relevance_score", 0.0)
                if not section:
                    section = meta.get("section_title", "")
                break

        citations.append(
            Citation(
                source_file=source_file,
                page_number=page_num,
                section=section,
                excerpt=excerpt,
                relevance_score=relevance,
            )
        )

    return citations


EXPLAINABILITY_SUFFIX = """

CRITICAL RULES:
1. Answer ONLY using the provided context. Do not use prior knowledge.
2. For every factual claim, append a citation in this EXACT format: [Source: {filename}, Page: {page_number}]
3. If the context does not contain enough information to answer, say EXACTLY: "Insufficient data in provided filings."
4. Do not speculate. Do not hallucinate numbers.
5. This analysis is for informational purposes only and does NOT constitute financial advice.

DISCLAIMER: This analysis is generated from publicly available documents and market data for informational purposes only. It does not constitute financial advice, investment recommendation, or trading signal. ArthaDrishti AI is not a SEBI-registered investment advisor. Past performance and AI-generated risk scores are not indicative of future results. Please consult a qualified financial advisor before making investment decisions.
"""


def build_rag_prompt(query: str, chunks: List[Dict[str, Any]], system_context: str = "") -> tuple[str, str]:
    """
    Build (system_prompt, user_prompt) for RAG query.
    """
    context_parts = []
    for i, chunk in enumerate(chunks):
        meta = chunk.get("metadata", {})
        context_parts.append(
            f"[Context {i+1}]\n"
            f"Source: {meta.get('source_file', 'Unknown')}, "
            f"Page: {meta.get('page_number', 0)}, "
            f"Section: {meta.get('section_title', '')}\n"
            f"{chunk.get('text', '')}\n"
        )

    context_str = "\n---\n".join(context_parts)

    system_prompt = (
        f"You are ArthaDrishti AI, an autonomous financial intelligence analyst specializing "
        f"in Indian equity markets.\n"
        f"{system_context}\n"
        f"{EXPLAINABILITY_SUFFIX}"
    )

    user_prompt = (
        f"CONTEXT FROM FILINGS:\n{context_str}\n\n"
        f"USER QUERY: {query}\n\n"
        f"Please answer based strictly on the context above."
    )

    return system_prompt, user_prompt
