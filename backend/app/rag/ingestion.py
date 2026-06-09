"""
Document ingestion pipeline.
Supports: PDF (PyMuPDF), DOCX (python-docx), TXT, URLs.
"""
import asyncio
import os
import tempfile
from pathlib import Path
from typing import List, Optional, Tuple
import httpx

from app.rag.chunker import chunk_document, Chunk
from app.rag.retriever import store_chunks


async def parse_pdf(file_path: str) -> List[dict]:
    """Parse PDF using PyMuPDF. Returns [{page_number, text}]."""
    loop = asyncio.get_event_loop()

    def _parse():
        import fitz  # PyMuPDF
        pages = []
        doc = fitz.open(file_path)
        for i, page in enumerate(doc):
            text = page.get_text("text")
            pages.append({"page_number": i + 1, "text": text})
        doc.close()
        return pages

    return await loop.run_in_executor(None, _parse)


async def parse_docx(file_path: str) -> List[dict]:
    """Parse DOCX using python-docx."""
    loop = asyncio.get_event_loop()

    def _parse():
        import docx  # python-docx
        doc = docx.Document(file_path)
        full_text = "\n".join(p.text for p in doc.paragraphs)
        # Treat entire document as single "page" — split on form-feed if present
        pages = []
        for i, section in enumerate(full_text.split("\x0c") or [full_text]):
            pages.append({"page_number": i + 1, "text": section})
        return pages

    return await loop.run_in_executor(None, _parse)


async def parse_text(file_path: str) -> List[dict]:
    with open(file_path, "r", encoding="utf-8", errors="replace") as f:
        text = f.read()
    # Split on page breaks or treat as one page
    sections = text.split("\x0c") or [text]
    return [{"page_number": i + 1, "text": s} for i, s in enumerate(sections)]


async def download_pdf(url: str) -> Tuple[str, str]:
    """Download PDF from URL to temp file. Returns (tmp_path, filename)."""
    filename = url.split("/")[-1].split("?")[0] or "document.pdf"
    async with httpx.AsyncClient(follow_redirects=True, timeout=60) as client:
        resp = await client.get(url)
        resp.raise_for_status()
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as f:
        f.write(resp.content)
        return f.name, filename


async def ingest_document(
    file_path: str,
    filename: str,
    user_id: str,
    symbol: str,
    doc_id: str,
    filing_type: str = "annual_report",
    fiscal_year: str = "",
) -> Tuple[List[Chunk], str]:
    """
    Full ingestion pipeline.
    Returns (chunks, chroma_collection_name).
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        pages = await parse_pdf(file_path)
    elif ext in (".docx", ".doc"):
        pages = await parse_docx(file_path)
    else:
        pages = await parse_text(file_path)

    chunks = chunk_document(
        pages=pages,
        company=symbol,
        filing_type=filing_type,
        fiscal_year=fiscal_year,
        source_file=filename,
    )

    if not chunks:
        return [], ""

    coll_name = await store_chunks(
        chunks=chunks,
        user_id=user_id,
        symbol=symbol,
        filing_type=filing_type,
        doc_id=doc_id,
    )

    return chunks, coll_name


async def ingest_from_url(
    url: str,
    user_id: str,
    symbol: str,
    doc_id: str,
    filing_type: str = "filing",
    fiscal_year: str = "",
) -> Tuple[List[Chunk], str, str]:
    """
    Download and ingest a document from URL.
    Returns (chunks, collection_name, filename).
    """
    tmp_path, filename = await download_pdf(url)
    try:
        chunks, coll_name = await ingest_document(
            file_path=tmp_path,
            filename=filename,
            user_id=user_id,
            symbol=symbol,
            doc_id=doc_id,
            filing_type=filing_type,
            fiscal_year=fiscal_year,
        )
        return chunks, coll_name, filename
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
