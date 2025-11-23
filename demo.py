import os
from src.ingestion.loader import DocumentLoader
from src.extraction.extractor import GraphExtractor
from src.graph.client import Neo4jClient
from src.validation.validator import GraphValidator

def main():
    # 1. Create a dummy file for testing
    sample_text = """
    Elon Musk is the CEO of SpaceX and Tesla. 
    SpaceX was founded in 2002 and is headquartered in Hawthorne, California.
    Tesla produces electric vehicles and clean energy generation systems.
    """
    with open("sample.txt", "w") as f:
        f.write(sample_text)

    print("--- Phase 1: Ingestion ---")
    docs = DocumentLoader.load("sample.txt")
    print(f"Loaded {len(docs)} document(s).")
    print(f"Content preview: {docs[0].page_content[:50]}...")

    print("\n--- Phase 2: Extraction ---")
    if not os.getenv("OPENAI_API_KEY"):
        print("Skipping extraction: OPENAI_API_KEY not set.")
        return

    extractor = GraphExtractor()
    kg = extractor.extract(docs[0].page_content)
    
    print(f"Extracted {len(kg.entities)} entities and {len(kg.relations)} relations.")
    
    print("\nEntities:")
    for e in kg.entities:
        print(f" - {e.name} ({e.type})")
        
    print("\nRelations:")
    for r in kg.relations:
        print(f" - {r.source} -> {r.type} -> {r.target}")

    print("\n--- Phase 2.5: Validation (SHACL) ---")
    try:
        validator = GraphValidator()
        conforms, _, report = validator.validate_graph(kg.entities, kg.relations)
        print(f"Graph conforms to schema: {conforms}")
        if not conforms:
            print("Validation Report:")
            print(report)
    except Exception as e:
        print(f"Validation failed: {e}")

    print("\n--- Phase 3: Storage (Neo4j) ---")
    try:
        client = Neo4jClient()
        # client.add_graph(kg.entities, kg.relations) # Uncomment to write to DB
        print("Neo4j client initialized (Write disabled for demo).")
        client.close()
    except Exception as e:
        print(f"Could not connect to Neo4j: {e}")

    # Cleanup
    os.remove("sample.txt")

if __name__ == "__main__":
    main()
