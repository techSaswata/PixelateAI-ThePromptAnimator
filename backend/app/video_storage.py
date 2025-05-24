import logging
import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional
from .config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize embeddings only when needed and if API key is available
_embedding = None


def get_embedding():
    """Lazy initialization of OpenAI embeddings."""
    global _embedding
    if _embedding is None:
        if not settings.OPENAI_API_KEY:
            logger.warning("OPENAI_API_KEY not found. Pinecone video storage will be disabled.")
            return None
            
        try:
            from langchain_openai import OpenAIEmbeddings
            _embedding = OpenAIEmbeddings(
                model="text-embedding-3-small",
                openai_api_key=settings.OPENAI_API_KEY,
            )
            logger.info("✅ OpenAI embeddings initialized for Pinecone storage")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI embeddings: {str(e)}")
            return None
    return _embedding


def save_video_to_pinecone(
    job_id: str,
    prompt: str,
    manim_code: str,
    video_path: str,
    video_url: str = None,
    metadata: Dict[str, Any] = None
) -> bool:
    """
    Save video metadata and code to Pinecone vector store for semantic search.
    
    Args:
        job_id: Unique identifier for the video
        prompt: Original user prompt that generated the video
        manim_code: Generated Manim code
        video_path: Local path to the video file
        video_url: Public URL to the video (if uploaded to cloud)
        metadata: Additional metadata
        
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Check if Pinecone is configured
        if not settings.PINECONE_API_KEY or not settings.PINECONE_INDEX_NAME:
            logger.warning("Pinecone not configured (missing API key or index name). Skipping video storage.")
            return False
            
        # Get embeddings
        embedding = get_embedding()
        if embedding is None:
            logger.warning("Embeddings not available. Skipping Pinecone storage.")
            return False
        
        # Import here to avoid initialization issues
        from langchain_pinecone import PineconeVectorStore
        from langchain.schema import Document
        
        # Get video file information
        video_file = Path(video_path)
        if not video_file.exists():
            logger.error(f"Video file not found: {video_path}")
            return False
        
        # Get video metadata
        file_size = video_file.stat().st_size
        creation_time = datetime.fromtimestamp(video_file.stat().st_ctime)
        
        # Prepare document content for embedding
        content = f"""
        Prompt: {prompt}
        
        Generated Manim Code:
        {manim_code}
        
        Video Type: Mathematical Animation
        Generated at: {creation_time.isoformat()}
        """
        
        # Prepare metadata
        doc_metadata = {
            "job_id": job_id,
            "prompt": prompt,
            "video_type": "manim_animation",
            "file_size": file_size,
            "creation_time": creation_time.isoformat(),
            "video_path": str(video_path),
            "video_url": video_url or f"/api/videos/{job_id}.mp4",
            "code_length": len(manim_code),
            "source": "pixelate_ai_generator",
            **(metadata or {})
        }
        
        # Create document for vector store
        document = Document(
            page_content=content,
            metadata=doc_metadata
        )
        
        # Save to Pinecone
        logger.info(f"Saving video {job_id} to Pinecone...")
        
        PineconeVectorStore.from_documents(
            [document],
            embedding,
            index_name=settings.PINECONE_INDEX_NAME,
        )
        
        logger.info(f"✅ Successfully saved video {job_id} to Pinecone")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error saving video {job_id} to Pinecone: {str(e)}")
        return False


def search_videos_in_pinecone(query: str, limit: int = 5) -> list:
    """
    Search for videos in Pinecone based on semantic similarity.
    
    Args:
        query: Search query
        limit: Maximum number of results to return
        
    Returns:
        List of matching video metadata
    """
    try:
        # Check if Pinecone is configured
        if not settings.PINECONE_API_KEY or not settings.PINECONE_INDEX_NAME:
            logger.warning("Pinecone not configured. Cannot search videos.")
            return []
            
        # Get embeddings
        embedding = get_embedding()
        if embedding is None:
            logger.warning("Embeddings not available. Cannot search videos.")
            return []
        
        # Import here to avoid initialization issues
        from langchain_pinecone import PineconeVectorStore
        
        # Initialize vector store
        vectorstore = PineconeVectorStore(
            index_name=settings.PINECONE_INDEX_NAME,
            embedding=embedding
        )
        
        # Search for similar documents
        docs = vectorstore.similarity_search(
            query,
            k=limit,
            filter={"source": "pixelate_ai_generator"}
        )
        
        # Extract video metadata
        results = []
        for doc in docs:
            metadata = doc.metadata
            results.append({
                "job_id": metadata.get("job_id"),
                "prompt": metadata.get("prompt"),
                "video_url": metadata.get("video_url"),
                "creation_time": metadata.get("creation_time"),
                "similarity_score": getattr(doc, 'score', None)
            })
        
        logger.info(f"Found {len(results)} videos matching query: {query}")
        return results
        
    except Exception as e:
        logger.error(f"Error searching videos in Pinecone: {str(e)}")
        return []


def get_video_stats_from_pinecone() -> Dict[str, Any]:
    """
    Get statistics about stored videos from Pinecone.
    
    Returns:
        Dictionary with video statistics
    """
    try:
        # Check if Pinecone is configured
        if not settings.PINECONE_API_KEY or not settings.PINECONE_INDEX_NAME:
            return {
                "error": "Pinecone not configured",
                "storage_status": "disabled"
            }
            
        # Get embeddings
        embedding = get_embedding()
        if embedding is None:
            return {
                "error": "Embeddings not available",
                "storage_status": "error"
            }
        
        from langchain_pinecone import PineconeVectorStore
        
        vectorstore = PineconeVectorStore(
            index_name=settings.PINECONE_INDEX_NAME,
            embedding=embedding
        )
        
        # This is a simplified version - in practice you'd query the index stats
        # For now, return basic info
        return {
            "total_videos": "Available via Pinecone index stats",
            "storage_status": "connected",
            "index_name": settings.PINECONE_INDEX_NAME
        }
        
    except Exception as e:
        logger.error(f"Error getting video stats from Pinecone: {str(e)}")
        return {
            "error": str(e),
            "storage_status": "error"
        }


def get_all_videos_from_pinecone(limit: int = 50) -> list:
    """
    Get all videos from Pinecone for gallery display.
    
    Args:
        limit: Maximum number of videos to return
        
    Returns:
        List of all video metadata
    """
    try:
        # Check if Pinecone is configured
        if not settings.PINECONE_API_KEY or not settings.PINECONE_INDEX_NAME:
            logger.warning("Pinecone not configured. Cannot fetch videos.")
            return []
            
        # Get embeddings
        embedding = get_embedding()
        if embedding is None:
            logger.warning("Embeddings not available. Cannot fetch videos.")
            return []
        
        # Import here to avoid initialization issues
        from langchain_pinecone import PineconeVectorStore
        import pinecone
        from pinecone import Pinecone
        
        # Initialize Pinecone client directly for querying
        pc = Pinecone(api_key=settings.PINECONE_API_KEY)
        index = pc.Index(settings.PINECONE_INDEX_NAME)
        
        # Query all vectors with filter
        query_response = index.query(
            vector=[0.0] * 1536,  # Dummy vector for text-embedding-3-small dimensions
            top_k=limit,
            include_metadata=True,
            filter={"source": "pixelate_ai_generator"}
        )
        
        # Extract video metadata
        results = []
        for match in query_response.matches:
            metadata = match.metadata
            results.append({
                "job_id": metadata.get("job_id"),
                "prompt": metadata.get("prompt"),
                "video_url": metadata.get("video_url"),
                "creation_time": metadata.get("creation_time"),
                "file_size": metadata.get("file_size"),
                "video_type": metadata.get("video_type"),
            })
        
        logger.info(f"Retrieved {len(results)} videos from Pinecone")
        return results
        
    except Exception as e:
        logger.error(f"Error fetching all videos from Pinecone: {str(e)}")
        # Fallback to similarity search with broad query
        return search_videos_in_pinecone("video animation", limit=limit) 