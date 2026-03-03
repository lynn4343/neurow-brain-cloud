import asyncio
import logging

logger = logging.getLogger(__name__)


async def openai_with_retry(coro_fn, max_retries=3):
    """Call an async OpenAI function with exponential backoff on rate limit."""
    for attempt in range(max_retries):
        try:
            return await coro_fn()
        except Exception as e:
            if "429" in str(e) or "rate_limit" in str(e).lower():
                wait = 2 ** attempt  # 1s, 2s, 4s
                logger.warning(f"OpenAI rate limited, retrying in {wait}s (attempt {attempt + 1})")
                await asyncio.sleep(wait)
            else:
                raise
    return await coro_fn()  # Final attempt, let it raise
