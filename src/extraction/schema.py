from typing import List, Optional
from pydantic import BaseModel, Field

class Entity(BaseModel):
    """Represents a node in the Knowledge Graph."""
    name: str = Field(..., description="The unique name or identifier of the entity.")
    type: str = Field(..., description="The type or category of the entity (e.g., PERSON, ORGANIZATION, LOCATION, CONCEPT).")
    description: Optional[str] = Field(None, description="A brief description or context of the entity from the text.")

class Relation(BaseModel):
    """Represents a directed edge between two entities."""
    source: str = Field(..., description="The name of the source entity.")
    target: str = Field(..., description="The name of the target entity.")
    type: str = Field(..., description="The type of relationship (e.g., WORKS_FOR, LOCATED_IN, PART_OF).")
    description: Optional[str] = Field(None, description="Context or details about the relationship.")

class KnowledgeGraphExtraction(BaseModel):
    """Container for extracted entities and relations."""
    entities: List[Entity] = Field(default_factory=list, description="List of unique entities extracted from the text.")
    relations: List[Relation] = Field(default_factory=list, description="List of relationships between the entities.")
