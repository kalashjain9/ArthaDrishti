"""
Unified LLM client — routes to OpenAI or Groq based on config.
Supports both streaming and non-streaming modes.
"""
from typing import AsyncIterator, List, Optional
from app.core.config import settings


async def llm_complete(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> str:
    """Single-shot completion."""
    if settings.use_openai:
        return await _openai_complete(system_prompt, user_prompt, temperature, max_tokens)
    return await _groq_complete(system_prompt, user_prompt, temperature, max_tokens)


async def llm_stream(
    system_prompt: str,
    user_prompt: str,
    temperature: float = 0.1,
    max_tokens: int = 4096,
) -> AsyncIterator[str]:
    """Streaming completion — yields text chunks."""
    if settings.use_openai:
        async for chunk in _openai_stream(system_prompt, user_prompt, temperature, max_tokens):
            yield chunk
    else:
        async for chunk in _groq_stream(system_prompt, user_prompt, temperature, max_tokens):
            yield chunk


# ── OpenAI ──────────────────────────────────────────────────────────────────

async def _openai_complete(sys: str, user: str, temp: float, max_tok: int) -> str:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    resp = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
        temperature=temp,
        max_tokens=max_tok,
    )
    return resp.choices[0].message.content or ""


async def _openai_stream(sys: str, user: str, temp: float, max_tok: int) -> AsyncIterator[str]:
    from openai import AsyncOpenAI
    client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
    stream = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
        temperature=temp,
        max_tokens=max_tok,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta


# ── Groq ────────────────────────────────────────────────────────────────────

async def _groq_complete(sys: str, user: str, temp: float, max_tok: int) -> str:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    resp = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
        temperature=temp,
        max_tokens=max_tok,
    )
    return resp.choices[0].message.content or ""


async def _groq_stream(sys: str, user: str, temp: float, max_tok: int) -> AsyncIterator[str]:
    from groq import AsyncGroq
    client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    stream = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[{"role": "system", "content": sys}, {"role": "user", "content": user}],
        temperature=temp,
        max_tokens=max_tok,
        stream=True,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield delta
