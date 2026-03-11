#!/usr/bin/env python3
"""Database keep-alive script for GitHub Actions.

Pings all configured databases with WRITE operations to prevent
free-tier auto-pause. Designed to run without app dependencies.

IMPORTANT: Each service check performs WRITE operations (not just reads)
to ensure the activity actually resets the inactivity timer.

Free-tier pause thresholds:
- Neo4j Aura: 3 days inactive (strictest)
- Qdrant Cloud: 7 days inactive
- Supabase: 7 days inactive

Services checked:
- REQUIRED: Supabase (Brain Cloud Prototype)
- OPTIONAL: Neo4j, Qdrant (shared with production — also pinged by neurow-hq)

Exit codes:
  0: All required services are healthy
  1: One or more required services failed
"""

from __future__ import annotations

import asyncio
import os
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
RESET = "\033[0m"
BOLD = "\033[1m"

CHECK = "\u2713"
CROSS = "\u2717"
WARNING = "\u26a0"


@dataclass
class HealthCheckResult:
    name: str
    success: bool
    duration_ms: int
    message: str = ""
    skipped: bool = False


def format_result(result: HealthCheckResult) -> str:
    if result.skipped:
        symbol, color = WARNING, YELLOW
        status = f"Skipped ({result.message})"
    elif result.success:
        symbol, color = CHECK, GREEN
        detail = f" \u2014 {result.message}" if result.message else ""
        status = f"Pinged ({result.duration_ms}ms){detail}"
    else:
        symbol, color = CROSS, RED
        status = f"Failed ({result.message})"
    return f"{color}{symbol}{RESET} {result.name:<15} {status}"


async def check_supabase() -> HealthCheckResult:
    """Check Supabase via DIRECT Postgres connection with a WRITE operation.

    Uses psycopg2 to connect directly through the Session Pooler,
    bypassing PostgREST. PostgREST API writes do NOT reliably reset
    Supabase's inactivity timer.
    """
    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        return HealthCheckResult(
            "Supabase", False, 0, "DATABASE_URL not configured", skipped=True
        )

    start = time.perf_counter()
    try:
        import psycopg2

        now = datetime.now(timezone.utc).isoformat()
        conn = psycopg2.connect(database_url, connect_timeout=10)
        conn.autocommit = True
        cur = conn.cursor()
        cur.execute(
            """INSERT INTO _keepalive (id, pinged_at, source)
               VALUES (1, %s, 'github-actions-direct')
               ON CONFLICT (id) DO UPDATE
               SET pinged_at = %s, source = 'github-actions-direct'""",
            (now, now),
        )
        cur.close()
        conn.close()
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult(
            "Supabase", True, duration_ms, f"direct write {now[:19]}"
        )
    except Exception as e:
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult("Supabase", False, duration_ms, str(e)[:80])


async def check_neo4j() -> HealthCheckResult:
    """Check Neo4j connectivity with a write operation."""
    uri = os.getenv("NEO4J_URI") or os.getenv("NEO4J_URL")
    user = os.getenv("NEO4J_USERNAME") or os.getenv("NEO4J_USER")
    password = os.getenv("NEO4J_PASSWORD")

    if not all([uri, user, password]):
        return HealthCheckResult(
            "Neo4j", False, 0, "not configured", skipped=True
        )

    start = time.perf_counter()
    try:
        from neo4j import AsyncGraphDatabase

        now = datetime.now(timezone.utc).isoformat()
        driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        async with driver.session() as session:
            result = await session.run(
                "MERGE (k:_Keepalive {id: 1}) "
                "SET k.pinged_at = $now, k.source = 'github-actions' "
                "RETURN k.pinged_at as pinged_at",
                now=now,
            )
            await result.consume()
        await driver.close()
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult("Neo4j", True, duration_ms)
    except Exception as e:
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult("Neo4j", False, duration_ms, str(e)[:80])


async def check_qdrant() -> HealthCheckResult:
    """Check Qdrant connectivity with a write operation."""
    url = os.getenv("QDRANT_URL") or os.getenv("QDRANT_HOST")
    api_key = os.getenv("QDRANT_API_KEY")

    if not url:
        return HealthCheckResult(
            "Qdrant", False, 0, "not configured", skipped=True
        )

    start = time.perf_counter()
    client = None
    try:
        from qdrant_client import AsyncQdrantClient
        from qdrant_client.models import Distance, PointStruct, VectorParams

        client = AsyncQdrantClient(url=url, api_key=api_key)
        collection_name = "_keepalive"

        collections = await client.get_collections()
        collection_names = [c.name for c in collections.collections]
        if collection_name not in collection_names:
            await client.create_collection(
                collection_name=collection_name,
                vectors_config=VectorParams(size=2, distance=Distance.COSINE),
            )

        await client.upsert(
            collection_name=collection_name,
            points=[
                PointStruct(
                    id=1,
                    vector=[0.0, 1.0],
                    payload={
                        "source": "github-actions",
                        "pinged_at": datetime.now(timezone.utc).isoformat(),
                    },
                )
            ],
        )
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult("Qdrant", True, duration_ms)
    except Exception as e:
        duration_ms = int((time.perf_counter() - start) * 1000)
        return HealthCheckResult("Qdrant", False, duration_ms, str(e)[:80])
    finally:
        if client:
            await client.close()


async def run_all_checks() -> list[HealthCheckResult]:
    """Run all health checks concurrently."""
    results = await asyncio.gather(
        check_supabase(),
        check_neo4j(),
        check_qdrant(),
        return_exceptions=True,
    )

    service_names = ["Supabase", "Neo4j", "Qdrant"]
    processed = []
    for i, result in enumerate(results):
        if isinstance(result, Exception):
            processed.append(
                HealthCheckResult(service_names[i], False, 0, str(result)[:50])
            )
        else:
            processed.append(result)
    return processed


def main() -> int:
    print(f"{BOLD}Database Keep-Alive Check (Brain Cloud){RESET}")
    print("\u2501" * 40)

    results = asyncio.run(run_all_checks())

    for result in results:
        print(format_result(result))

    print("\u2501" * 40)

    required = ["Supabase"]
    required_results = [r for r in results if r.name in required]
    required_passed = sum(1 for r in required_results if r.success)

    optional_results = [r for r in results if r.name not in required]
    optional_passed = sum(
        1 for r in optional_results if r.success and not r.skipped
    )
    optional_total = len([r for r in optional_results if not r.skipped])

    if required_passed == len(required):
        status_color, status_text, exit_code = GREEN, "READY", 0
    else:
        status_color, status_text, exit_code = RED, "FAILED", 1

    msg = (
        f"{status_color}{BOLD}Status: {status_text}{RESET} "
        f"({required_passed}/{len(required)} required"
    )
    if optional_total > 0:
        msg += f", {optional_passed}/{optional_total} optional"
    msg += ")"
    print(msg)

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
