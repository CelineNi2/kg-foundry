# kg-foundry

**kg-foundry** is a modern, end-to-end pipeline for transforming unstructured textual documents (PDF, Markdown, Text) into a high-quality, validated, and visualizable **Knowledge Graph (KG)**. It leverages Large Language Models (LLMs) for extraction and Retrieval-Augmented Generation (RAG) for interactive querying.

## 🚀 Features

-   **Ingestion**: Support for `.txt`, `.md`, and `.pdf` documents.
-   **Extraction**: LLM-based extraction of Entities and Relations using **Instructor** (structured output).
-   **Validation**: Graph quality assurance using **SHACL** (Shapes Constraint Language) and `pyshacl`.
-   **Storage**: Persistent graph storage using **Neo4j**.
-   **Visualization**: Interactive graph exploration with **Cytoscape.js**.
-   **RAG (Chat)**: "Ask the Graph" feature to answer questions based on the knowledge graph context.
-   **Containerization**: Full deployment support with **Podman** / **Docker**.

## 🛠️ Technology Stack

-   **Backend**: Python 3.11, FastAPI, LangChain, Instructor, Pydantic.
-   **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Cytoscape.js.
-   **Database**: Neo4j (Graph DB).
-   **AI/LLM**: OpenAI GPT-4o (configurable).

## 📂 Project Structure

```
kg-foundry/
├── src/
│   ├── api/          # FastAPI routes and entry point
│   ├── extraction/   # LLM extraction logic (Instructor)
│   ├── graph/        # Neo4j client wrapper
│   ├── ingestion/    # Document loaders
│   ├── rag/          # Retrieval-Augmented Generation logic
│   └── validation/   # SHACL validation logic
├── data/
│   └── shapes/       # SHACL shape definitions (.ttl)
├── frontend/         # Next.js web application
├── docker-compose.yml # Podman/Docker orchestration
└── requirements.txt  # Python dependencies
```

## ⚡ Getting Started

### Prerequisites

-   **OpenAI API Key**: Required for extraction and RAG.
-   **Neo4j**: Required for storage (provided via Docker).
-   **Python 3.11+** & **Node.js 18+** (for local dev).
-   **Podman** or **Docker** (for containerized run).

### Option A: Run with Podman (Recommended)

1.  Create a `.env` file at the root (see `.env.example`):
    ```bash
    OPENAI_API_KEY=sk-your-key-here
    ```
2.  Build and start the services:
    ```bash
    podman-compose up --build
    ```
3.  Access the application:
    -   **Frontend**: [http://localhost:3000](http://localhost:3000)
    -   **API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
    -   **Neo4j Browser**: [http://localhost:7474](http://localhost:7474) (User: `neo4j`, Pass: `password`)

### Option B: Run Locally

#### 1. Backend

```bash
# Create virtual env
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set env vars
export OPENAI_API_KEY=sk-...
export NEO4J_URI=bolt://localhost:7687
export NEO4J_USER=neo4j
export NEO4J_PASSWORD=password

# Run server
uvicorn src.api.main:app --reload
```

#### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage

1.  Open the web interface at `http://localhost:3000`.
2.  Click **"Choose File"** and select a text or PDF document.
3.  Click **"Process"**. The system will:
    -   Extract entities and relations.
    -   Validate them against the SHACL schema.
    -   Display the resulting Knowledge Graph interactively.
4.  Use the **"Ask the Graph"** chat box below the visualization to ask questions about the ingested content.

## 🛡️ Validation

The graph structure is validated against SHACL shapes defined in `data/shapes/schema.ttl`. This ensures that every Entity has a name and type, and relations are properly formed.
