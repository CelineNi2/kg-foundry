from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import shutil
import os
from ..ingestion.loader import DocumentLoader
from ..extraction.extractor import GraphExtractor
from ..graph.client import Neo4jClient
from ..validation.validator import GraphValidator
from ..rag.retriever import GraphRetriever

router = APIRouter()

class QueryRequest(BaseModel):
    query: str

class GraphResponse(BaseModel):
    entities: List[dict]
    relations: List[dict]

@router.post("/ingest", response_model=GraphResponse)
async def ingest_document(file: UploadFile = File(...)):
    """
    Upload a document, extract the graph, validate it, and store it.
    """
    temp_file = f"temp_{file.filename}"
    try:
        with open(temp_file, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # 1. Load
        docs = DocumentLoader.load(temp_file)
        text = "\n".join([d.page_content for d in docs])
        
        # 2. Extract
        extractor = GraphExtractor()
        kg = extractor.extract(text)
        
        # 3. Validate
        validator = GraphValidator()
        conforms, _, report = validator.validate_graph(kg.entities, kg.relations)
        
        if not conforms:
            # In a real app, we might reject or flag it. For now, we just warn.
            print(f"Validation Warning: {report}")

        # 3.5 Ensure Consistency: Add missing nodes from relations
        existing_entity_names = {e.name for e in kg.entities}
        for relation in kg.relations:
            if relation.source not in existing_entity_names:
                # Create implicit entity
                from ..extraction.schema import Entity
                new_entity = Entity(name=relation.source, type="UNKNOWN", description="Inferred from relation")
                kg.entities.append(new_entity)
                existing_entity_names.add(relation.source)
            
            if relation.target not in existing_entity_names:
                # Create implicit entity
                from ..extraction.schema import Entity
                new_entity = Entity(name=relation.target, type="UNKNOWN", description="Inferred from relation")
                kg.entities.append(new_entity)
                existing_entity_names.add(relation.target)
            
        # 4. Store (Optional, if Neo4j is configured)
        try:
            client = Neo4jClient()
            client.add_graph(kg.entities, kg.relations)
            client.close()
        except Exception as e:
            print(f"Storage skipped or failed: {e}")

        return {
            "entities": [e.model_dump() for e in kg.entities],
            "relations": [r.model_dump() for r in kg.relations]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

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
