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

    def extract(self, text: str) -> KnowledgeGraphExtraction:
        """
        Extract entities and relations from the given text chunk.
        """
        return self.client.chat.completions.create(
            model=self.model_name,
            response_model=KnowledgeGraphExtraction,
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert Knowledge Graph extractor. Your task is to identify entities and relationships in the provided text. Be precise and avoid duplicates."
                },
                {
                    "role": "user", 
                    "content": f"Extract the knowledge graph from the following text:\n\n{text}"
                }
            ]
        )
