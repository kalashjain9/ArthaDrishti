"""
Research Orchestrator — classifies intent, fans out to specialist agents,
merges evidence, and streams a grounded research report.
"""
import asyncio
import json
from typing import AsyncIterator, Dict, Any, List
from app.agents.filing_agent import FilingAgent
from app.agents.risk_agent import RiskAgent
from app.agents.news_agent import NewsAgent
from app.agents.sentiment_agent import SentimentAgent
from app.agents.macro_agent import MacroAgent
from app.agents.competitor_agent import CompetitorAgent
from app.agents.fraud_agent import FraudAgent
from app.agents.earnings_agent import EarningsAgent
from app.rag.retriever import retrieve_chunks, list_collections_for_symbol
from app.rag.citation_engine import build_rag_prompt, extract_citations
from app.utils.llm import llm_complete, llm_stream
from app.schemas.research import ResearchChunk


AGENT_REGISTRY = {
    "filing": FilingAgent,
    "risk": RiskAgent,
    "news": NewsAgent,
    "sentiment": SentimentAgent,
    "macro": MacroAgent,
    "competitor": CompetitorAgent,
    "fraud": FraudAgent,
    "earnings": EarningsAgent,
}

INTENT_CLASSIFICATION_PROMPT = """You are an intent classifier for a financial research platform.

Given a user query about a company, classify which analysis agents are needed.
Available agents: filing, risk, news, sentiment, macro, competitor, fraud, earnings

Rules:
- "risk" queries → risk, filing
- "news" or "sentiment" queries → news, sentiment
- "fraud" queries → fraud, filing
- "earnings" or "management" queries → earnings, sentiment
- "competitor" or "peer" queries → competitor
- "macro" or "economic" queries → macro
- General research → filing, risk, news (all primary agents)
- "deep dive" or comprehensive → all agents

Respond ONLY in JSON:
{"primary_agents": ["agent1", "agent2"], "query_type": "risk|news|fraud|earnings|competitor|macro|general"}
"""


async def classify_intent(query: str) -> Dict[str, Any]:
    """Classify query intent to determine which agents to run."""
    query_lower = query.lower()

    # Rule-based fast classification
    if any(w in query_lower for w in ["fraud", "manipulation", "beneish", "auditor"]):
        return {"primary_agents": ["fraud", "filing"], "query_type": "fraud"}
    if any(w in query_lower for w in ["earnings", "call", "transcript", "management said"]):
        return {"primary_agents": ["earnings", "sentiment"], "query_type": "earnings"}
    if any(w in query_lower for w in ["competitor", "peer", "compare", "vs", "versus"]):
        return {"primary_agents": ["competitor"], "query_type": "competitor"}
    if any(w in query_lower for w in ["macro", "rbi", "interest rate", "inflation", "oil", "gdp"]):
        return {"primary_agents": ["macro"], "query_type": "macro"}
    if any(w in query_lower for w in ["news", "latest", "recent", "sentiment"]):
        return {"primary_agents": ["news", "sentiment"], "query_type": "news"}
    if any(w in query_lower for w in ["risk", "debt", "leverage", "litigation", "esg"]):
        return {"primary_agents": ["risk", "filing"], "query_type": "risk"}

    # Default: comprehensive research
    return {"primary_agents": ["filing", "risk", "news"], "query_type": "general"}


async def orchestrate(
    query: str,
    symbol: str,
    user_id: str,
) -> Dict[str, Any]:
    """Non-streaming orchestration — returns full merged result."""
    intent = await classify_intent(query)
    agent_names = intent["primary_agents"]

    # Run agents in parallel
    agent_tasks = {}
    for name in agent_names:
        if name in AGENT_REGISTRY:
            agent = AGENT_REGISTRY[name]()
            agent_tasks[name] = agent.run(
                symbol=symbol,
                query=query,
                user_id=user_id,
            )

    results = {}
    if agent_tasks:
        gathered = await asyncio.gather(*agent_tasks.values(), return_exceptions=True)
        for name, result in zip(agent_tasks.keys(), gathered):
            if isinstance(result, Exception):
                results[name] = {"error": str(result)}
            else:
                results[name] = result

    # Get filing chunks for RAG answer
    collection_names = await list_collections_for_symbol(user_id, symbol)
    chunks = []
    if collection_names:
        chunks = await retrieve_chunks(query, collection_names, top_k=8)

    # Build final answer with RAG
    system_prompt, user_prompt = build_rag_prompt(
        query=query,
        chunks=chunks,
        system_context=f"""You are ArthaDrishti AI analyzing {symbol}.
Agent results available:
{json.dumps({k: v.get('status', 'unknown') for k, v in results.items()}, indent=2)}
""",
    )

    answer = await llm_complete(system_prompt, user_prompt)
    citations = extract_citations(answer, chunks)

    return {
        "answer": answer,
        "citations": [c.to_dict() for c in citations],
        "agents_used": list(results.keys()),
        "agent_results": results,
        "query_type": intent["query_type"],
    }


async def stream_orchestrate(
    query: str,
    symbol: str,
    user_id: str,
) -> AsyncIterator[ResearchChunk]:
    """
    Streaming orchestration — yields ResearchChunk events for SSE.
    """
    intent = await classify_intent(query)
    agent_names = intent["primary_agents"]

    # Signal query classification
    yield ResearchChunk(
        type="thinking",
        content=f"Classified as {intent['query_type']} query. Running: {', '.join(agent_names)}",
        metadata={"intent": intent},
    )

    # Run non-RAG agents in background while streaming
    agent_results = {}
    for name in agent_names:
        if name in AGENT_REGISTRY and name not in ("filing",):
            yield ResearchChunk(type="agent_start", content=f"Running {name} agent...", agent=name)
            try:
                agent = AGENT_REGISTRY[name]()
                result = await agent.run(symbol=symbol, query=query, user_id=user_id)
                agent_results[name] = result
                yield ResearchChunk(
                    type="agent_end",
                    content=f"{name} agent complete",
                    agent=name,
                    metadata={"status": result.get("status", "unknown")},
                )
            except Exception as e:
                yield ResearchChunk(type="agent_end", content=f"{name} agent error: {str(e)}", agent=name)

    # RAG retrieval
    yield ResearchChunk(type="thinking", content="Retrieving relevant filing excerpts...")

    collection_names = await list_collections_for_symbol(user_id, symbol)
    chunks = []
    if collection_names:
        chunks = await retrieve_chunks(query, collection_names, top_k=8)
        yield ResearchChunk(
            type="thinking",
            content=f"Found {len(chunks)} relevant excerpts across {len(collection_names)} documents.",
        )
    else:
        yield ResearchChunk(
            type="thinking",
            content=f"No ingested documents for {symbol}. Answering from market data only.",
        )

    # Build context with agent results
    agent_context_parts = []
    for name, result in agent_results.items():
        if name == "risk" and "risk_index" in result:
            ri = result["risk_index"]
            agent_context_parts.append(
                f"Risk Analysis: Overall Score={ri.get('overall_score', 'N/A')}/100. {ri.get('summary', '')}"
            )
        elif name == "news" and "articles" in result:
            agent_context_parts.append(
                f"News Sentiment: {result.get('aggregate_sentiment', 0):.2f} ({result.get('trend', 'stable')}). "
                f"{len(result.get('articles', []))} articles analyzed."
            )
        elif name == "fraud" and "fraud_probability" in result:
            agent_context_parts.append(
                f"Fraud Risk: {result.get('fraud_probability', 'N/A')}. "
                f"M-Score estimate: {result.get('m_score_estimate', 'N/A')}"
            )

    system_prompt, user_prompt = build_rag_prompt(
        query=query,
        chunks=chunks,
        system_context=(
            f"Analyzing {symbol}.\n" + "\n".join(agent_context_parts)
        ),
    )

    # Stream the LLM answer
    yield ResearchChunk(type="thinking", content="Generating grounded analysis...")

    full_answer = ""
    async for text_chunk in llm_stream(system_prompt, user_prompt):
        full_answer += text_chunk
        yield ResearchChunk(type="answer", content=text_chunk)

    # Extract and emit citations
    citations = extract_citations(full_answer, chunks)
    if citations:
        from app.schemas.research import Citation as CitationSchema
        citation_dicts = [c.to_dict() for c in citations]
        yield ResearchChunk(
            type="citation",
            content=f"Found {len(citations)} citations",
            citations=[CitationSchema(**c) for c in citation_dicts],
        )

    # Final done signal
    yield ResearchChunk(
        type="agent_end",
        content="[DONE]",
        metadata={
            "agents_used": agent_names,
            "chunks_retrieved": len(chunks),
            "citations": len(citations),
        },
    )
