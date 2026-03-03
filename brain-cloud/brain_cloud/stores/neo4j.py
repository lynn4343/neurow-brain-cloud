import logging

import neo4j

from brain_cloud.config import Settings

logger = logging.getLogger(__name__)

# 7 from Schema_Spec + 2 additional (CoachingSession, CalendarEvent)
CONSTRAINTS = [
    "CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE",
    "CREATE CONSTRAINT session_id_unique IF NOT EXISTS FOR (s:ClaritySession) REQUIRE s.session_id IS UNIQUE",
    "CREATE CONSTRAINT goal_id_unique IF NOT EXISTS FOR (g:Goal) REQUIRE g.id IS UNIQUE",
    "CREATE CONSTRAINT pattern_id_unique IF NOT EXISTS FOR (p:Pattern) REQUIRE p.id IS UNIQUE",
    "CREATE CONSTRAINT insight_id_unique IF NOT EXISTS FOR (i:Insight) REQUIRE i.id IS UNIQUE",
    "CREATE CONSTRAINT delta_id_unique IF NOT EXISTS FOR (d:BehavioralDelta) REQUIRE d.id IS UNIQUE",
    "CREATE CONSTRAINT memory_id_unique IF NOT EXISTS FOR (m:Memory) REQUIRE m.memory_id IS UNIQUE",
    "CREATE CONSTRAINT coaching_session_id_unique IF NOT EXISTS FOR (cs:CoachingSession) REQUIRE cs.id IS UNIQUE",
    "CREATE CONSTRAINT calendar_memory_id_unique IF NOT EXISTS FOR (ce:CalendarEvent) REQUIRE ce.memory_id IS UNIQUE",
]

INDEXES = [
    "CREATE INDEX user_lookup IF NOT EXISTS FOR (u:User) ON (u.user_id)",
    "CREATE INDEX session_user IF NOT EXISTS FOR (s:ClaritySession) ON (s.user_id)",
    "CREATE INDEX goal_user IF NOT EXISTS FOR (g:Goal) ON (g.user_id)",
    "CREATE INDEX goal_timeframe IF NOT EXISTS FOR (g:Goal) ON (g.timeframe)",
    "CREATE INDEX pattern_user IF NOT EXISTS FOR (p:Pattern) ON (p.user_id)",
    "CREATE INDEX pattern_type IF NOT EXISTS FOR (p:Pattern) ON (p.type)",
    "CREATE INDEX pattern_status IF NOT EXISTS FOR (p:Pattern) ON (p.status)",
    "CREATE INDEX insight_user IF NOT EXISTS FOR (i:Insight) ON (i.user_id)",
    "CREATE INDEX delta_user IF NOT EXISTS FOR (d:BehavioralDelta) ON (d.user_id)",
    "CREATE INDEX memory_user IF NOT EXISTS FOR (m:Memory) ON (m.user_id)",
    "CREATE INDEX memory_category IF NOT EXISTS FOR (m:Memory) ON (m.category)",
    "CREATE INDEX calendar_user IF NOT EXISTS FOR (c:CalendarEvent) ON (c.user_id)",
    "CREATE INDEX calendar_time IF NOT EXISTS FOR (c:CalendarEvent) ON (c.start_time)",
]


class Neo4jStore:
    def __init__(self, settings: Settings):
        self.driver = neo4j.AsyncGraphDatabase.driver(
            settings.neo4j_uri,
            auth=(settings.neo4j_username, settings.neo4j_password),
        )

    async def verify_connection(self):
        async with self.driver.session(database="neo4j") as session:
            result = await session.run("RETURN 1 AS n")
            record = await result.single()
            assert record["n"] == 1
            logger.info("Neo4j connection verified")

    async def apply_schema(self):
        async with self.driver.session(database="neo4j") as session:
            for stmt in CONSTRAINTS:
                try:
                    await session.run(stmt)
                except Exception as e:
                    if "equivalent" in str(e).lower() or "already exists" in str(e).lower():
                        logger.info(f"Constraint already exists, skipping: {stmt[:60]}...")
                    else:
                        raise
            for stmt in INDEXES:
                try:
                    await session.run(stmt)
                except Exception as e:
                    if "equivalent" in str(e).lower() or "already exists" in str(e).lower():
                        logger.info(f"Index already exists, skipping: {stmt[:60]}...")
                    else:
                        raise
            logger.info(f"Neo4j schema applied: {len(CONSTRAINTS)} constraints, {len(INDEXES)} indexes")

    async def create_user_node(self, user_id: str, display_name: str):
        async with self.driver.session(database="neo4j") as session:
            await session.run(
                "MERGE (u:User {user_id: $user_id}) "
                "SET u.display_name = $display_name, u.created_at = datetime()",
                user_id=user_id,
                display_name=display_name,
            )

    async def create_memory_node(self, data: dict):
        async with self.driver.session(database="neo4j") as session:
            await session.run(
                "MERGE (m:Memory {memory_id: $memory_id}) "
                "SET m.user_id = $user_id, m.content = $content, "
                "m.category = $category, m.source = $source, "
                "m.original_ts = $original_ts",
                memory_id=data["memory_id"],
                user_id=data["user_id"],
                content=data.get("content", "")[:500],  # truncate for graph
                category=data.get("category", ""),
                source=data.get("source", ""),
                original_ts=data.get("original_ts"),
            )

    async def create_entity_and_relationships(
        self, entities: list, relationships: list, memory_id: str, user_id: str
    ):
        async with self.driver.session(database="neo4j") as session:
            # Create entity nodes
            for entity in entities:
                label = entity["type"].capitalize()
                # Use Pattern for behavioral/cognitive/emotional/identity types
                if label in ("Behavior", "Belief", "Pattern"):
                    label = "Pattern"
                await session.run(
                    f"MERGE (e:{label} {{user_id: $user_id, name: $name}}) "
                    f"ON CREATE SET e.id = randomUUID(), e.type = $type",
                    user_id=user_id,
                    name=entity["name"],
                    type=entity["type"],
                )

            # Create relationships between entities and memory
            for rel in relationships:
                await session.run(
                    "MATCH (s {name: $subject, user_id: $user_id}) "
                    "MATCH (o {name: $object, user_id: $user_id}) "
                    f"CREATE (s)-[:{rel['predicate']}]->(o)",
                    subject=rel["subject"],
                    object=rel["object"],
                    user_id=user_id,
                )

    async def query_related(self, query_terms: list[str], user_id: str) -> list[dict]:
        if not query_terms:
            return await self._fallback_graph_context(user_id)

        async with self.driver.session(database="neo4j") as session:
            result = await session.run(
                """
                UNWIND $terms AS term
                MATCH (m:Memory {user_id: $user_id})
                WHERE toLower(m.content) CONTAINS toLower(term)
                WITH COLLECT(DISTINCT m) AS memories

                UNWIND memories AS m
                OPTIONAL MATCH (m)-[r1]-(connected)
                WHERE connected.user_id = $user_id
                  AND (connected:Goal OR connected:Pattern OR connected:Insight
                       OR connected:BehavioralDelta OR connected:CoachingSession)
                OPTIONAL MATCH (connected)-[r2]-(second_hop)
                WHERE second_hop.user_id = $user_id
                  AND (second_hop:Goal OR second_hop:Pattern OR second_hop:Insight)

                RETURN DISTINCT m AS memory,
                       COLLECT(DISTINCT {node: connected, rel: type(r1)}) AS first_hop,
                       COLLECT(DISTINCT {node: second_hop, rel: type(r2)}) AS second_hop
                LIMIT 20
                """,
                terms=query_terms,
                user_id=user_id,
            )
            records = [record.data() async for record in result]
            if not records:
                return await self._fallback_graph_context(user_id)
            return records

    async def _fallback_graph_context(self, user_id: str) -> list[dict]:
        async with self.driver.session(database="neo4j") as session:
            result = await session.run(
                """
                MATCH (n {user_id: $user_id})
                WHERE n:Goal OR n:Pattern OR n:Insight
                RETURN labels(n) AS labels, properties(n) AS props
                LIMIT 20
                """,
                user_id=user_id,
            )
            return [record.data() async for record in result]

    async def get_user_graph(self, user_id: str) -> dict:
        nodes = []
        edges = []
        async with self.driver.session(database="neo4j") as session:
            # Get all nodes for this user
            result = await session.run(
                "MATCH (n {user_id: $user_id}) RETURN labels(n) AS labels, properties(n) AS props",
                user_id=user_id,
            )
            async for record in result:
                nodes.append({
                    "labels": record["labels"],
                    "properties": record["props"],
                })

            # Get all relationships between this user's nodes
            result = await session.run(
                """
                MATCH (a {user_id: $user_id})-[r]->(b {user_id: $user_id})
                RETURN type(r) AS type, properties(a) AS from_props, properties(b) AS to_props
                """,
                user_id=user_id,
            )
            async for record in result:
                edges.append({
                    "type": record["type"],
                    "from": record["from_props"],
                    "to": record["to_props"],
                })

        return {"nodes": nodes, "edges": edges}

    async def close(self):
        await self.driver.close()
