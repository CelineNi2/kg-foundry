import pytest
import os
from src.validation.validator import GraphValidator
from src.extraction.schema import Entity, Relation

def test_graph_validation():
    # Ensure the shapes file exists
    shapes_file = "data/shapes/schema.ttl"
    assert os.path.exists(shapes_file), f"Shapes file not found at {shapes_file}"

    # Setup
    validator = GraphValidator(shapes_file=shapes_file)
    
    # Create valid entities
    entities = [
        Entity(name="Alice", type="Person"),
        Entity(name="Google", type="Organization")
    ]
    
    # Create relations
    relations = [
        Relation(source="Alice", target="Google", type="WORKS_FOR")
    ]
    
    # Validate
    conforms, results_graph, report = validator.validate_graph(entities, relations)
    
    # Print report if validation fails
    if not conforms:
        print(report)
        
    assert conforms, "Graph validation failed"
