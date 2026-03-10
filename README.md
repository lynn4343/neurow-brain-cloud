# Neurow + Brain Cloud

> Your AI should know you. Your data should be yours.

Neurow is a **life operating system and AI executive coach**, powered by **Brain Cloud** — a personal knowledge graph that stores your memories, goals, behavioral patterns, and coaching history across four specialized cognitive stores. Connected via [MCP](https://modelcontextprotocol.io/) (Model Context Protocol), an open standard that works with any AI model.

Import your data from any AI provider. Get coached by an AI that actually knows you. Export everything, anytime — in a single portable file.

**Track 2: AI Companions with Purpose** | Data Portability Hackathon (UT Austin, March 2026)

## Demo Video

[Link to demo video]

## Architecture

```
                    +---------------------+
                    |   Neurow Desktop    |
                    |  Electron + Next.js |
                    +----------+----------+
                               |
                 +-------------+-------------+
                 |                           |
           Anthropic SDK               MCP Protocol
           (AI model calls)          (tool calls via stdio)
                 |                           |
          +------+------+        +----------+----------+
          |  Claude API |        |    Brain Cloud      |
          |  (or BYOK)  |        |    MCP Server       |
          +-------------+        +----------+----------+
                                            |
                          +------+------+---+---+------+
                          |      |      |       |      |
                       +--+--+ +-+--+ +-+----+ ++-----+
                       |Neo4j| |Supa| |Qdrant| |Mem0  |
                       |Graph| |base| |Vector| |Seman |
                       +-----+ +---+ +------+ +------+
```

Brain Cloud's four stores mirror how human memory actually works:

| Store | Cognitive Role | What It Stores |
|-------|---------------|----------------|
| **Neo4j** | Association cortex | Knowledge graph — goals linked to patterns, behaviors linked to coaching sessions, connections between domains |
| **Supabase** | Hippocampal episodic storage | Structured records — user profiles, coaching sessions, memories with timestamps and metadata |
| **Qdrant** | Pattern-completion retrieval | Vector embeddings — similarity search across all memories, finding related patterns |
| **Mem0** | Neocortical semantic consolidation | Semantic memory — natural language understanding, contextual retrieval |

Every query fans out to all four stores simultaneously, fuses results, and ranks by recency-weighted relevance.

## Try It Yourself

The app launches with **Theo Nakamura** — a freelance designer who's been using Neurow for a month. His Brain Cloud contains 193 memories across goals, habits, coaching sessions, calendar events, and personal insights.

**Explore Theo's world:**
- **DayMap** — priorities, calendar, tasks at a glance
- **Coaching** — start a morning brief or ask anything
- **Knowledge Graph** — visualize the connections Brain Cloud has built
- **Export** — download Theo's complete Brain Cloud as portable JSON

**Create your own profile:** Click the user dropdown (top right) and select "New Profile." A 2-minute onboarding flow (the Clarity Session) establishes your goals and coaching relationship. Your first coaching session will reference what you shared.

**Import your data:** During onboarding, you can:
- **AI Memory Import** — paste your ChatGPT, Gemini, or Claude memories. Brain Cloud transforms flat text into connected knowledge.
- **File Import** — drop a JSONL/JSON export file. Brain Cloud maps each record into the four-store architecture.

**Switch profiles:** Use the same dropdown to switch between users. Compare Theo's month of coaching history with a fresh profile to see the difference Brain Cloud makes over time.

## Data Portability

Brain Cloud implements all five [DTI Transfer Principles](https://dtinit.org/):

| Principle | Implementation |
|-----------|---------------|
| **1. Download** | `brain_export` — complete portable JSON of all user data |
| **2. Interoperability** | MCP protocol — any AI model connects to Brain Cloud |
| **3. Delegation** | User controls what data enters and leaves |
| **4. Privacy** | Instance data (yours) vs. schema data (ours) — clean separation |
| **5. Portability** | Export, import, delete — full lifecycle |

**BD-001:** *"Everything about you is yours. How we help you is ours."* Exports include all user memories, relationships, goals, coaching sessions, and metadata. Exports never include coaching prompts, methodology, or system intelligence.

## Brain Cloud: Connect Any AI

Brain Cloud is an MCP server — an open protocol. The Neurow desktop app is one client. Any MCP-compatible AI can connect to the same knowledge graph.

### Connect Claude Code CLI to Brain Cloud

1. Configure Brain Cloud credentials (see [Setup](#setup))
2. Add to your Claude Code MCP config (`~/.claude.json`):

```json
{
  "mcpServers": {
    "brain-cloud": {
      "command": "uv",
      "args": ["run", "brain-cloud"],
      "cwd": "/path/to/neurow-brain-cloud/brain-cloud"
    }
  }
}
```

3. Open Claude Code and query your knowledge graph:

```
claude
> What are Theo's goals? (use brain_recall with user_id "theo")
```

Same memories, same graph, same coaching history. Different AI, same knowledge.

### Available Brain Cloud Tools

| Tool | What It Does |
|------|-------------|
| `brain_recall` | Search memories across all 4 stores with fusion ranking |
| `brain_remember` | Store a memory across all 4 stores with entity extraction |
| `brain_export` | Full portable JSON export (BD-001 compliant) |
| `brain_create_profile` | Create a new user profile |
| `brain_update_profile` | Update profile with onboarding data |
| `coaching_get_prompt` | Get coaching instruction for a Clarity Session turn |
| `coaching_store_turn` | Store coaching turn data and advance session |
| `coaching_get_session_prompt` | Get prompt for morning brief, weekly review, ongoing coaching |

## Setup

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **[uv](https://docs.astral.sh/uv/)** (Python package manager)

### 1. Clone and install

```bash
git clone https://github.com/lynn4343/neurow-brain-cloud.git
cd neurow-brain-cloud

# Desktop app
cd desktop && npm install && cd ..

# Brain Cloud MCP server
cd brain-cloud && uv sync && cd ..
```

### 2. Configure environment

Two `.env` files are needed (`.env.example` templates provided in each directory):

**`desktop/.env`** — AI model access:
```env
# Anthropic API key for coaching
ANTHROPIC_API_KEY=sk-ant-...

# Neo4j Aura (knowledge graph visualization)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
```

Or skip the Anthropic key — you can enter it in-app during onboarding (BYOK).

**`brain-cloud/.env`** — Four-store credentials:
```env
# Supabase (structured storage)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Neo4j Aura (knowledge graph)
NEO4J_URI=neo4j+s://your-instance.databases.neo4j.io
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password

# Qdrant Cloud (vector search)
QDRANT_URL=https://your-cluster.cloud.qdrant.io
QDRANT_API_KEY=your-api-key

# Mem0 (semantic memory)
MEM0_API_KEY=your-api-key

# OpenAI (embeddings + entity extraction)
OPENAI_API_KEY=sk-your-key

# Anthropic (optional — goal headline generation)
ANTHROPIC_API_KEY=sk-ant-your-key
```

### 3. Launch

```bash
cd desktop
npm run electron:dev
```

Neurow launches and connects to the Brain Cloud MCP server on your first coaching interaction — spawned automatically as a subprocess. No separate process needed.

## Hackathon Scope vs. Production Roadmap

We made deliberate decisions about what to build for a 2-week hackathon vs. what belongs in production. Here's what we chose and why.

| Decision | Hackathon Approach | Production Path | Rationale |
|----------|-------------------|-----------------|-----------|
| **Authentication** | No Supabase Auth. Profiles created directly, user switching via app UI. | Supabase Auth (email/OAuth), JWT sessions, auth-gated access. | Demo friction: judges see Theo's world instantly. Auth adds a login screen before any value is shown. |
| **Row-Level Security** | Application-level user scoping — every query filters by `user_id` in code. | Full RLS with `auth.uid()` policies on all tables. Database-level enforcement. | RLS requires Supabase Auth to be meaningful. Without `auth.uid()`, policies can't scope to the requesting user. The application-level scoping is functionally equivalent for a single-user desktop app. |
| **Prompt templates** | Accessible in Supabase (no RLS restriction). Coaching methodology visible to judges reviewing the system. | RLS-protected. Service role key for MCP server access only. | Intentional for hackathon — methodology is a differentiator worth showing. Production protects IP at database level. |
| **API key management** | Supabase anon key in Electron main process (publishable by design). Brain Cloud credentials in `.env` (gitignored). BYOK for AI providers in-app. | All keys via environment variables or secure vault. | Anon key is designed to be client-side (standard Supabase pattern). The app is a local desktop prototype, not a public web service. |

Brain Cloud is architected for production-grade data isolation — RLS, authenticated sessions, per-user encryption scoping. For this hackathon, we focused on the coaching experience and data portability. The security infrastructure is designed and ready to activate.

## Tech Stack

- **Desktop:** Electron 33, Next.js 16, React 19, Tailwind v4, Radix UI
- **Brain Cloud:** Python 3.11, MCP SDK, Neo4j, Supabase, Qdrant, Mem0
- **AI:** Claude (Anthropic) via Anthropic SDK — model-agnostic architecture (BYOK for Anthropic, OpenAI, NVIDIA, custom endpoints)
- **Fonts:** Albra Display (brand), Geist (system)
- **License:** Apache 2.0

## Repository Structure

```
neurow-brain-cloud/
├── brain-cloud/          # MCP server (Python) — four-store cognitive architecture
│   ├── brain_cloud/      # Server code, store connectors, pipelines, coaching engine
│   └── pyproject.toml    # Python dependencies (uv)
├── desktop/              # Electron + Next.js coaching app
│   ├── electron/         # Main process, preload, IPC bridge
│   ├── src/              # React components, contexts, views
│   └── package.json      # Node dependencies
├── data/                 # Demo data (Theo Nakamura — 193 records)
└── scripts/              # Data pipeline utilities
```

## Team

**Lynn Hayden** — Solo founder, [Neurow](https://neurow.io)
