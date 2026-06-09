from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class DocumentOut(BaseModel):
    id: str
    symbol: str
    filename: str
    filing_type: str
    fiscal_year: str
    file_size: int
    page_count: int
    chunk_count: int
    status: str
    error_message: str
    is_auto_fetched: bool
    source_url: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DocumentStatus(BaseModel):
    id: str
    status: str
    progress: int  # 0-100
    chunk_count: int
    error_message: str


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    status: str
    message: str
