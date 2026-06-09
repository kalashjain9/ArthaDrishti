"""
Hierarchical document chunker.
Respects section boundaries → 2800-char chunks with 200-char overlap.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class Chunk:
    text: str
    chunk_index: int
    page_number: int
    section_title: str
    company: str = ""
    filing_type: str = ""
    fiscal_year: str = ""
    source_file: str = ""
    metadata: dict = field(default_factory=dict)

    def to_chroma_metadata(self) -> dict:
        return {
            "company": self.company,
            "filing_type": self.filing_type,
            "fiscal_year": self.fiscal_year,
            "source_file": self.source_file,
            "page_number": self.page_number,
            "section_title": self.section_title,
            "chunk_index": self.chunk_index,
        }


# Regex patterns for section headers (ALL CAPS lines or numbered headings)
SECTION_HEADER_RE = re.compile(
    r"^(?:"
    r"(?:[A-Z][A-Z\s\-\&\/]{4,}[A-Z])"          # ALL CAPS words
    r"|(?:\d+[\.\d]*\s+[A-Z][A-Za-z\s]{5,})"    # Numbered headings
    r"|(?:PART\s+[IVX]+[\s:—]+\w+)"              # PART I/II/III etc.
    r")$",
    re.MULTILINE,
)

CHUNK_SIZE = 2800
OVERLAP = 200


def _split_into_sentences(text: str) -> List[str]:
    """Rough sentence splitter that respects common abbreviations."""
    parts = re.split(r"(?<=[.!?])\s+(?=[A-Z])", text)
    return [p.strip() for p in parts if p.strip()]


def chunk_document(
    pages: List[dict],  # [{text: str, page_number: int}]
    company: str,
    filing_type: str,
    fiscal_year: str,
    source_file: str,
) -> List[Chunk]:
    """
    Two-pass hierarchical chunker.
    Pass 1: Detect section boundaries per page.
    Pass 2: Build CHUNK_SIZE chunks with OVERLAP, respecting section and sentence boundaries.
    """
    chunks: List[Chunk] = []
    chunk_index = 0
    current_section = "Introduction"
    buffer = ""
    buffer_page = 1

    def flush_buffer(buf: str, page: int, section: str) -> List[Chunk]:
        nonlocal chunk_index
        result = []
        # Split buffer into CHUNK_SIZE pieces with OVERLAP
        start = 0
        while start < len(buf):
            end = start + CHUNK_SIZE
            piece = buf[start:end]
            # Try to end on sentence boundary
            if end < len(buf):
                last_period = max(piece.rfind(". "), piece.rfind(".\n"))
                if last_period > CHUNK_SIZE // 2:
                    piece = piece[: last_period + 1]
                    end = start + last_period + 1
            result.append(
                Chunk(
                    text=piece.strip(),
                    chunk_index=chunk_index,
                    page_number=page,
                    section_title=section,
                    company=company,
                    filing_type=filing_type,
                    fiscal_year=fiscal_year,
                    source_file=source_file,
                )
            )
            chunk_index += 1
            start = end - OVERLAP  # overlap
        return result

    for page_obj in pages:
        text: str = page_obj["text"]
        page_num: int = page_obj["page_number"]
        lines = text.split("\n")

        for line in lines:
            stripped = line.strip()
            if not stripped:
                buffer += "\n"
                continue

            # Check if this line is a section header
            if SECTION_HEADER_RE.match(stripped) and len(stripped) < 120:
                # Flush current buffer
                if buffer.strip():
                    chunks.extend(flush_buffer(buffer, buffer_page, current_section))
                current_section = stripped[:200]
                buffer = ""
                buffer_page = page_num
            else:
                buffer += stripped + " "
                if buffer_page == 1 and page_num > 1:
                    buffer_page = page_num

            # Flush if buffer is getting large
            if len(buffer) >= CHUNK_SIZE * 2:
                chunks.extend(flush_buffer(buffer, buffer_page, current_section))
                buffer = buffer[-OVERLAP:] if len(buffer) > OVERLAP else ""

    # Flush remaining
    if buffer.strip():
        chunks.extend(flush_buffer(buffer, buffer_page, current_section))

    return chunks
