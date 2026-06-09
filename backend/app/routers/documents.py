"""
Documents router — upload and ingest filings.
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.document import Document
from app.schemas.document import DocumentOut, DocumentStatus, UploadResponse

UPLOAD_DIR = Path("./uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

router = APIRouter(prefix="/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    symbol: str = Form(...),
    filing_type: str = Form(default="annual_report"),
    fiscal_year: str = Form(default=""),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Validate file
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large (max 50MB)")

    # Save file
    doc_id = str(uuid.uuid4())
    save_filename = f"{doc_id}_{file.filename}"
    save_path = UPLOAD_DIR / save_filename

    with open(save_path, "wb") as f:
        f.write(content)

    # Create DB record
    doc = Document(
        id=doc_id,
        user_id=current_user.id,
        symbol=symbol.upper(),
        filename=file.filename or "document",
        file_path=str(save_path),
        filing_type=filing_type,
        fiscal_year=fiscal_year,
        file_size=len(content),
        status="pending",
    )
    db.add(doc)
    await db.flush()

    # Trigger background ingestion via FastAPI BackgroundTasks
    background_tasks.add_task(
        _ingest_document_background,
        doc_id=doc_id,
        file_path=str(save_path),
        filename=file.filename or "document",
        user_id=current_user.id,
        symbol=symbol.upper(),
        filing_type=filing_type,
        fiscal_year=fiscal_year,
    )

    return UploadResponse(
        document_id=doc_id,
        filename=file.filename or "document",
        status="pending",
        message="Document uploaded. Ingestion started in background.",
    )


async def _ingest_document_background(
    doc_id: str,
    file_path: str,
    filename: str,
    user_id: str,
    symbol: str,
    filing_type: str,
    fiscal_year: str,
):
    """Background task to ingest the uploaded document."""
    from app.core.database import AsyncSessionLocal
    from app.rag.ingestion import ingest_document

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Document).where(Document.id == doc_id))
            doc = result.scalar_one_or_none()
            if doc:
                doc.status = "processing"
                await db.commit()

            chunks, coll_name = await ingest_document(
                file_path=file_path,
                filename=filename,
                user_id=user_id,
                symbol=symbol,
                doc_id=doc_id,
                filing_type=filing_type,
                fiscal_year=fiscal_year,
            )

            async with AsyncSessionLocal() as db2:
                result2 = await db2.execute(select(Document).where(Document.id == doc_id))
                doc2 = result2.scalar_one_or_none()
                if doc2:
                    doc2.status = "complete"
                    doc2.chunk_count = len(chunks)
                    doc2.chroma_collection = coll_name
                    await db2.commit()

        except Exception as e:
            async with AsyncSessionLocal() as db3:
                result3 = await db3.execute(select(Document).where(Document.id == doc_id))
                doc3 = result3.scalar_one_or_none()
                if doc3:
                    doc3.status = "error"
                    doc3.error_message = str(e)[:500]
                    await db3.commit()


@router.get("/{doc_id}/status", response_model=DocumentStatus)
async def get_document_status(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    progress = {"pending": 0, "processing": 50, "complete": 100, "error": 0}.get(doc.status, 0)
    return DocumentStatus(
        id=doc.id,
        status=doc.status,
        progress=progress,
        chunk_count=doc.chunk_count,
        error_message=doc.error_message,
    )


@router.delete("/{doc_id}", status_code=204)
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Document).where(Document.id == doc_id, Document.user_id == current_user.id)
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Delete ChromaDB collection
    if doc.chroma_collection:
        from app.rag.retriever import delete_collection
        await delete_collection(doc.chroma_collection)

    # Delete file
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)
