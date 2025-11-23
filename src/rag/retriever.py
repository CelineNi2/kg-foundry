import os
from typing import List
from openai import OpenAI
from ..graph.client import Neo4jClient
from ..extraction.extractor import GraphExtractor

class GraphRetriever:
    """
    Performs Retrieval-Augmented Generation using the Knowledge Graph.
    """
    
    def __init__(self):
        self.client = OpenAI() # Standard client for generation
        self.extractor = GraphExtractor() # To extract entities from query
        self.neo4j = Neo4jClient()

    def _get_context(self, query: str) -> str:
        """
        Retrieve relevant context from the graph based on the query.
        Strategy: Extract entities from query -> Find them in Graph -> Get 1-hop neighbors.
        """
        # 1. Extract potential entities from the query itself
        # We use a relaxed extraction or just keywords. 
        # For simplicity, let's use the same extractor but we might only care about entities.
        try:
            extraction = self.extractor.extract(query)
            query_entities = [e.name for e in extraction.entities]
        except Exception:
            # Fallback: simple keyword splitting if extraction fails or is too strict
            query_entities = query.split()

        context_lines = []
        
        for entity_name in query_entities:
            # Cypher query to get the entity and its immediate relationships
            cypher = """
            MATCH (e:Entity {name: $name})-[r]-(neighbor)
            RETURN e.name, type(r) as rel, neighbor.name, neighbor.description
            LIMIT 10
            """
            results = self.neo4j.query(cypher, name=entity_name)
            
            for row in results:
                line = f"{row['e.name']} {row['rel']} {row['neighbor.name']}"
                if row['neighbor.description']:
                     line += f" ({row['neighbor.description']})"
                context_lines.append(line)
                
        if not context_lines:
            return "No relevant graph data found."
            
        return "\n".join(list(set(context_lines))) # Remove duplicates

    def answer(self, query: str) -> str:
        """
        Answer a question using the Knowledge Graph context.
        """
        context = self._get_context(query)
        
        system_prompt = f"""You are a helpful assistant backed by a Knowledge Graph. 
Use the following context to answer the user's question. 
If the answer is not in the context, say you don't know.

Context:
{context}
"""
        
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": query}
            ]
        )
        
        return response.choices[0].message.content
