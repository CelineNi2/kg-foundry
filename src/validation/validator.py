import rdflib
from pyshacl import validate
from typing import List, Tuple
from ..extraction.schema import Entity, Relation

class GraphValidator:
    """
    Validates the Knowledge Graph against SHACL shapes.
    """
    
    def __init__(self, shapes_file: str = "data/shapes/schema.ttl"):
        self.shapes_graph = rdflib.Graph()
        self.shapes_graph.parse(shapes_file, format="turtle")
        
    def _to_rdf(self, entities: List[Entity], relations: List[Relation]) -> rdflib.Graph:
        """Convert internal schema to RDF for validation."""
        g = rdflib.Graph()
        kg_ns = rdflib.Namespace("http://kg-foundry.com/schema/")
        g.bind("kg", kg_ns)
        
        for entity in entities:
            # Create a URI for the entity based on its name (simplified)
            node_uri = kg_ns[entity.name.replace(" ", "_")]
            g.add((node_uri, rdflib.RDF.type, kg_ns.Entity))
            g.add((node_uri, kg_ns.name, rdflib.Literal(entity.name)))
            g.add((node_uri, kg_ns.type, rdflib.Literal(entity.type)))
            
        for relation in relations:
            source_uri = kg_ns[relation.source.replace(" ", "_")]
            target_uri = kg_ns[relation.target.replace(" ", "_")]
            # Reify the relation or just add it as a direct property? 
            # For SHACL validation of the structure, we might model it simply first.
            # Here we just check if nodes exist, but for complex relation validation we might need more.
            g.add((source_uri, kg_ns[relation.type], target_uri))
            
        return g

    def validate_graph(self, entities: List[Entity], relations: List[Relation]) -> Tuple[bool, str, str]:
        """
        Validate the graph data against SHACL shapes.
        
        Returns:
            Tuple containing (conforms, results_graph, results_text)
        """
        data_graph = self._to_rdf(entities, relations)
        conforms, results_graph, results_text = validate(
            data_graph,
            shacl_graph=self.shapes_graph,
            inference='rdfs',
            abort_on_first=False,
            meta_shacl=False,
            debug=False
        )
        return conforms, results_graph, results_text
