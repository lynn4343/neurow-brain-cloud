// ---------------------------------------------------------------------------
// Neo4j Direct API — Pure Functions
//
// Knowledge graph visualization — fetches per-user graph data from Neo4j Aura.
// Same pattern as supabase.ts: config passed in, no Electron dependencies.
// Uses the official neo4j-driver (bolt protocol) for reliable Aura connectivity.
//
// The IPC handler in main.ts is a thin wrapper that calls getGraphDataDirect().
// The MCP server (brain-cloud/) uses the same Cypher queries via Python driver.
// ---------------------------------------------------------------------------

import neo4j, { type Driver } from 'neo4j-driver';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Neo4jConfig {
  uri: string;
  username: string;
  password: string;
}

export interface GraphNode {
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  type: string;
  from: Record<string, unknown>;
  to: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ---------------------------------------------------------------------------
// Driver singleton (lazy-initialized, reused for connection pooling)
// ---------------------------------------------------------------------------

let driver: Driver | null = null;
let driverConfigKey: string | null = null;

function ensureDriver(config: Neo4jConfig): Driver {
  const key = `${config.uri}|${config.username}`;
  if (driver && driverConfigKey !== key) {
    driver.close().catch((err) => console.warn('[neo4j] Error closing stale driver:', err));
    driver = null;
  }
  if (!driver) {
    driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.username, config.password),
      { connectionTimeout: 10_000 },
    );
    driverConfigKey = key;
  }
  return driver;
}

// ---------------------------------------------------------------------------
// Neo4j type sanitization (IPC requires plain JS objects)
//
// Neo4j driver returns custom types (Integer, DateTime, etc.) that fail
// structured clone serialization across Electron IPC. Convert recursively.
// Mirrors _sanitize_props() in brain-cloud/brain_cloud/stores/neo4j.py.
// ---------------------------------------------------------------------------

function sanitizeNeo4jValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  // Neo4j Integer → JS number (use toString for values exceeding safe integer range)
  if (neo4j.isInt(value)) {
    const intVal = value as { toNumber(): number; inSafeRange(): boolean; toString(): string };
    return intVal.inSafeRange() ? intVal.toNumber() : intVal.toString();
  }

  // Neo4j temporal types → ISO string
  if (
    neo4j.isDateTime(value) ||
    neo4j.isDate(value) ||
    neo4j.isTime(value) ||
    neo4j.isLocalDateTime(value) ||
    neo4j.isLocalTime(value) ||
    neo4j.isDuration(value)
  ) {
    return (value as { toString(): string }).toString();
  }

  // Recurse into arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeNeo4jValue);
  }

  // Recurse into plain objects
  if (typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      sanitized[k] = sanitizeNeo4jValue(v);
    }
    return sanitized;
  }

  return value;
}

function sanitizeProps(props: Record<string, unknown>): Record<string, unknown> {
  return sanitizeNeo4jValue(props) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// getGraphDataDirect — same queries as Neo4jStore.get_user_graph() in Python
// ---------------------------------------------------------------------------

export async function getGraphDataDirect(
  config: Neo4jConfig,
  userId: string,
): Promise<GraphData> {
  // Config validation — return empty graph if Neo4j not fully configured
  if (!config.uri || !config.username || !config.password) {
    console.warn('[neo4j] Neo4j credentials not fully configured — returning empty graph');
    return { nodes: [], edges: [] };
  }

  const d = ensureDriver(config);
  const session = d.session({ database: 'neo4j' });

  try {
    // Query 1: All nodes for this user
    const nodeResult = await session.run(
      'MATCH (n {user_id: $user_id}) RETURN labels(n) AS labels, properties(n) AS props',
      { user_id: userId },
    );

    const nodes: GraphNode[] = nodeResult.records.map((record) => ({
      labels: record.get('labels') as string[],
      properties: sanitizeProps(record.get('props')),
    }));

    // Query 2: All relationships between this user's nodes (DISTINCT to prevent dupes)
    const edgeResult = await session.run(
      `MATCH (a {user_id: $user_id})-[r]->(b {user_id: $user_id})
       RETURN DISTINCT type(r) AS type, properties(a) AS from_props, properties(b) AS to_props`,
      { user_id: userId },
    );

    const edges: GraphEdge[] = edgeResult.records.map((record) => ({
      type: record.get('type') as string,
      from: sanitizeProps(record.get('from_props')),
      to: sanitizeProps(record.get('to_props')),
    }));

    return { nodes, edges };
  } catch (error) {
    console.error('[neo4j] Failed to fetch graph data:', error);
    return { nodes: [], edges: [] };
  } finally {
    await session.close();
  }
}

// ---------------------------------------------------------------------------
// Cleanup — called on app quit
// ---------------------------------------------------------------------------

export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
