from typing import List, Optional
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.documents import Document

class DocumentLoader:
    """
    Handles loading of documents from various file formats.
    Supported formats: .pdf, .txt, .md
    """
    
    @staticmethod
    def load(file_path: str) -> List[Document]:
        """
        Load a document from the given path.
        
        Args:
            file_path: Absolute path to the file.
            
        Returns:
            List of LangChain Documents.
        """
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")
            
        if path.suffix.lower() == '.pdf':
            loader = PyPDFLoader(file_path)
            return loader.load()
        elif path.suffix.lower() in ['.txt', '.md']:
            loader = TextLoader(file_path)
            return loader.load()
        else:
            raise ValueError(f"Unsupported file format: {path.suffix}")

    @staticmethod
    def load_dir(dir_path: str, glob: str = "**/*") -> List[Document]:
        """
        Load all supported documents from a directory.
        """
        path = Path(dir_path)
        docs = []
        for file in path.glob(glob):
            if file.is_file() and file.suffix.lower() in ['.pdf', '.txt', '.md']:
                try:
                    docs.extend(DocumentLoader.load(str(file)))
                except Exception as e:
                    print(f"Error loading {file}: {e}")
        return docs
