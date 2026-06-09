from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class Citation(BaseModel):
    source_file: str
    page_number: int
    section: str
    excerpt: str
    relevance_score: float = 0.0


class ResearchChunk(BaseModel):
    type: str  # "thinking" | "answer" | "citation" | "agent_start" | "agent_end" | "error"
    content: str
    agent: Optional[str] = None
    citations: Optional[List[Citation]] = None
    metadata: Optional[Dict[str, Any]] = None


class QueryRequest(BaseModel):
    query: str
    symbol: str
    filing_ids: Optional[List[str]] = None  # specific docs to search


class ResearchReportRequest(BaseModel):
    symbol: str


class ResearchHistoryItem(BaseModel):
    id: str
    symbol: str
    query: str
    response: str
    citations: List[Citation] = []
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
