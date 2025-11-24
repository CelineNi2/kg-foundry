import os
import instructor
from openai import OpenAI
from typing import List
from dotenv import load_dotenv
from .schema import KnowledgeGraphExtraction

load_dotenv()

class GraphExtractor:
    """
    Extracts Knowledge Graph components (Entities and Relations) from text using an LLM.
    """
    
    def __init__(self, model_name: str = "gpt-4o"):
        """
        Initialize the extractor with an OpenAI client patched by Instructor.
        """
        # Ensure OPENAI_API_KEY is set in environment
        if not os.getenv("OPENAI_API_KEY"):
            print("Warning: OPENAI_API_KEY not found in environment variables.")
            
        self.client = instructor.from_openai(OpenAI())
        self.model_name = model_name

    def extract(self, text: str, progress_callback=None) -> KnowledgeGraphExtraction:
        """
        Extract entities and relations from the given text, handling large texts by chunking.
        
        Args:
            text: The text to extract from.
            progress_callback: Optional callback function(current_chunk, total_chunks)
        """
        from langchain_text_splitters import RecursiveCharacterTextSplitter
        
        # Split text into chunks to avoid token limits
        # 12000 chars is roughly 3000-4000 tokens, well within the 30k TPM limit
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=12000,
            chunk_overlap=1000,
            length_function=len,
        )
        chunks = text_splitter.split_text(text)
        
        all_entities = {}
        all_relations = []
        seen_relations = set()
        
        print(f"Processing {len(chunks)} chunks...")
        
        for i, chunk in enumerate(chunks):
            print(f"Extracting from chunk {i+1}/{len(chunks)}...")
            if progress_callback:
                progress_callback(i, len(chunks))
                
            try:
                extraction = self.client.chat.completions.create(
                    model=self.model_name,
                    response_model=KnowledgeGraphExtraction,
                    messages=[
                        {
                            "role": "system", 
                            "content": "You are an expert Knowledge Graph extractor. Your task is to identify entities and relationships in the provided text. Be precise and avoid duplicates."
                        },
                        {
                            "role": "user", 
                            "content": f"Extract the knowledge graph from the following text:\n\n{chunk}"
                        }
                    ]
                )
                
                # Merge entities (deduplicate by name)
                for entity in extraction.entities:
                    if entity.name not in all_entities:
                        all_entities[entity.name] = entity
                
                # Merge relations (deduplicate by source-target-type)
                for relation in extraction.relations:
                    rel_key = (relation.source, relation.target, relation.type)
                    if rel_key not in seen_relations:
                        seen_relations.add(rel_key)
                        all_relations.append(relation)
                        
            except Exception as e:
                print(f"Error extracting from chunk {i+1}: {e}")
                # Continue to next chunk instead of failing completely
                continue
                
        return KnowledgeGraphExtraction(
            entities=list(all_entities.values()),
            relations=all_relations
        )
