import os
from neo4j import GraphDatabase
from typing import List
from dotenv import load_dotenv
from ..extraction.schema import Entity, Relation

load_dotenv()

class Neo4jClient:
    """
    Wrapper for Neo4j database operations.
    """
    
    def __init__(self):
        uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        user = os.getenv("NEO4J_USER", "neo4j")
        password = os.getenv("NEO4J_PASSWORD", "password")
        
        self.driver = GraphDatabase.driver(uri, auth=(user, password))

    def close(self):
        self.driver.close()

    def add_entity(self, entity: Entity):
        """Add a single entity to the graph."""
        with self.driver.session() as session:
            session.run(
                """
                MERGE (e:Entity {name: $name})
                SET e.type = $type, e.description = $description
                """,
                name=entity.name, type=entity.type, description=entity.description
            )

    def add_relation(self, relation: Relation):
        """Add a relationship between two entities."""
        with self.driver.session() as session:
            session.run(
                """
                MATCH (s:Entity {name: $source})
                MATCH (t:Entity {name: $target})
                MERGE (s)-[r:RELATION {type: $type}]->(t)
                SET r.description = $description
                """,
                source=relation.source, target=relation.target, 
                type=relation.type, description=relation.description
            )

    def add_graph(self, entities: List[Entity], relations: List[Relation]):
        """Batch add entities and relations."""
        # Note: In production, use batch transactions for better performance
        for entity in entities:
            self.add_entity(entity)
        for relation in relations:
            self.add_relation(relation)
    
    def get_all_graph(self):
        """Get all entities and relations from the graph."""
        with self.driver.session() as session:
            # Get all entities
            entities_result = session.run(
                "MATCH (e:Entity) RETURN e.name AS name, e.type AS type, e.description AS description"
            )
            entities = [
                {"name": r["name"], "type": r["type"], "description": r["description"]} 
                for r in entities_result
            ]
            
            # Get all relations
            relations_result = session.run(
                "MATCH (s:Entity)-[r:RELATION]->(t:Entity) RETURN s.name AS source, t.name AS target, r.type AS type, r.description AS description"
            )
            relations = [
                {"source": r["source"], "target": r["target"], "type": r["type"], "description": r["description"]} 
                for r in relations_result
            ]
            
            return entities, relations
            
    def query(self, cypher: str, **parameters):
        """Run a raw Cypher query."""
        with self.driver.session() as session:
            result = session.run(cypher, **parameters)
            return [record.data() for record in result]
