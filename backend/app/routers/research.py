"""
Research router — main agent query (SSE streaming) + report generation.
"""
import json
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.research import ResearchQuery
from app.agents.orchestrator import stream_orchestrate, orchestrate
from app.schemas.research import QueryRequest, ResearchHistoryItem
from app.utils.pdf_export import generate_research_report

router = APIRouter(prefix="/research", tags=["research"])


@router.post("/query")
async def research_query(
    request: QueryRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Main research endpoint — SSE streaming response."""
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not request.symbol.strip():
        raise HTTPException(status_code=400, detail="Symbol cannot be empty")

    # Create a pending research query record
    research_query_obj = ResearchQuery(
        user_id=current_user.id,
        symbol=request.symbol.upper(),
        query=request.query,
        status="running",
    )
    db.add(research_query_obj)
    await db.flush()
    query_id = research_query_obj.id

    async def event_generator():
        full_response = ""
        all_citations = []
        try:
            async for chunk in stream_orchestrate(
                query=request.query,
                symbol=request.symbol.upper(),
                user_id=current_user.id,
            ):
                if chunk.type == "answer":
                    full_response += chunk.content
                if chunk.type == "citation" and chunk.citations:
                    all_citations = [c.model_dump() for c in chunk.citations]
                yield f"data: {chunk.model_dump_json()}\n\n"

            # Mark complete
            async with db.begin_nested():
                result = await db.execute(
                    select(ResearchQuery).where(ResearchQuery.id == query_id)
                )
                rq = result.scalar_one_or_none()
                if rq:
                    rq.response = full_response
                    rq.citations = all_citations
                    rq.status = "complete"

        except Exception as e:
            from app.schemas.research import ResearchChunk
            error_chunk = ResearchChunk(type="error", content=str(e))
            yield f"data: {error_chunk.model_dump_json()}\n\n"

        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


@router.post("/report/{symbol}")
async def generate_report(
    symbol: str,
    current_user: User = Depends(get_current_user),
):
    """Generate a full PDF research report for a symbol."""
    try:
        pdf_bytes = await generate_research_report(
            symbol=symbol.upper(),
            user_id=current_user.id,
        )
        return StreamingResponse(
            iter([pdf_bytes]),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="ArthaDrishti_{symbol}_Report.pdf"'
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/history", response_model=list[ResearchHistoryItem])
async def get_history(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
):
    result = await db.execute(
        select(ResearchQuery)
        .where(ResearchQuery.user_id == current_user.id)
        .order_by(ResearchQuery.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
