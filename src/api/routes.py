from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import shutil
import os
import uuid
import asyncio
from ..ingestion.loader import DocumentLoader
from ..extraction.extractor import GraphExtractor
from ..graph.client import Neo4jClient
from ..validation.validator import GraphValidator
from ..rag.retriever import GraphRetriever

router = APIRouter()

# In-memory job storage
# Format: {job_id: {"status": "pending"|"processing"|"completed"|"failed", "progress": 0, "result": None, "error": None}}
jobs: Dict[str, Dict[str, Any]] = {}

class QueryRequest(BaseModel):
    query: str

class GraphResponse(BaseModel):
    entities: List[dict]
    relations: List[dict]

class JobResponse(BaseModel):
    job_id: str

class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: float
    result: Optional[GraphResponse] = None
    error: Optional[str] = None

def process_document(job_id: str, temp_file: str):
    """
    Background task to process the document.
    """
    try:
        jobs[job_id]["status"] = "processing"
        jobs[job_id]["progress"] = 0.0
        
        # 1. Load
        docs = DocumentLoader.load(temp_file)
        text = "\n".join([d.page_content for d in docs])
        
        # 2. Extract with progress
        extractor = GraphExtractor()
        
        def update_progress(current, total):
            # Map extraction progress to 10-90% range
            progress = 10 + (current / total) * 80
            jobs[job_id]["progress"] = round(progress, 1)
            
        kg = extractor.extract(text, progress_callback=update_progress)
        
        # 3. Validate
        jobs[job_id]["progress"] = 90.0
        validator = GraphValidator()
        conforms, _, report = validator.validate_graph(kg.entities, kg.relations)
        
        if not conforms:
            print(f"Validation Warning: {report}")

        # 3.5 Ensure Consistency
        existing_entity_names = {e.name for e in kg.entities}
        for relation in kg.relations:
            if relation.source not in existing_entity_names:
                from ..extraction.schema import Entity
                new_entity = Entity(name=relation.source, type="UNKNOWN", description="Inferred from relation")
                kg.entities.append(new_entity)
                existing_entity_names.add(relation.source)
            
            if relation.target not in existing_entity_names:
                from ..extraction.schema import Entity
                new_entity = Entity(name=relation.target, type="UNKNOWN", description="Inferred from relation")
                kg.entities.append(new_entity)
                existing_entity_names.add(relation.target)
            
        # 4. Store
        jobs[job_id]["progress"] = 95.0
        try:
            client = Neo4jClient()
            client.add_graph(kg.entities, kg.relations)
            client.close()
        except Exception as e:
            print(f"Storage skipped or failed: {e}")

        # Complete
        jobs[job_id]["result"] = {
            "entities": [e.model_dump() for e in kg.entities],
            "relations": [r.model_dump() for r in kg.relations]
        }
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = 100.0
        
    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

@router.post("/ingest", response_model=JobResponse)
async def ingest_document(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Upload a document and start background processing.
    """
    job_id = str(uuid.uuid4())
    temp_file = f"temp_{job_id}_{file.filename}"
    
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        jobs[job_id] = {
            "status": "pending",
            "progress": 0.0,
            "result": None,
            "error": None
        }
        
        background_tasks.add_task(process_document, job_id, temp_file)
        
        return {"job_id": job_id}
        
    except Exception as e:
        if os.path.exists(temp_file):
            os.remove(temp_file)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/jobs/{job_id}", response_model=JobStatus)
async def get_job_status(job_id: str):
    """
    Get the status of a processing job.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = jobs[job_id]
    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job["progress"],
        "result": job["result"],
        "error": job["error"]
    }

@router.get("/graph", response_model=GraphResponse)
async def get_graph():
    """
    Retrieve the entire graph from Neo4j.
    """
    try:
        client = Neo4jClient()
        entities, relations = client.get_all_graph()
        client.close()
        
        return {
            "entities": entities,
            "relations": relations
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clear")
async def clear_graph():
    """
    Clear the entire graph from Neo4j.
    """
    try:
        client = Neo4jClient()
        client.clear_database()
        client.close()
        return {"message": "Graph cleared successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/query")
async def query_graph(request: QueryRequest):
    """
    Execute a raw Cypher query against Neo4j.
    """
    try:
        client = Neo4jClient()
        results = client.query(request.query)
        client.close()
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat_rag(request: ChatRequest):
    """
    Answer a question using Graph RAG.
    """
    try:
        retriever = GraphRetriever()
        answer = retriever.answer(request.message)
        # retriever.neo4j.close() # Should probably close the connection inside retriever
        return {"response": answer}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
