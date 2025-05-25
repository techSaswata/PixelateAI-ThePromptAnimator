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
        
        # Save to Pinecone with explicit API key
        logger.info(f"Saving video {job_id} to Pinecone...")
        
        # Initialize Pinecone with explicit credentials
        import os
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
        
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
        
        # Set Pinecone API key in environment
        import os
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
        
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
        
        # Set Pinecone API key in environment
        import os
        os.environ["PINECONE_API_KEY"] = settings.PINECONE_API_KEY
        
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


def upload_video_to_r2(video_path: str, job_id: str) -> Optional[str]:
    """
    Upload video file to Cloudflare R2 Storage.
    
    Args:
        video_path: Local path to the video file
        job_id: Unique identifier for the video
        
    Returns:
        Public URL to the uploaded video, or None if failed
    """
    logger.info(f"🔄 Starting R2 upload for video {job_id}")
    
    try:
        if not settings.R2_ACCOUNT_ID or not settings.R2_ACCESS_KEY_ID or not settings.R2_SECRET_ACCESS_KEY:
            logger.warning("⚠️ Cloudflare R2 not configured. Cannot upload video to cloud storage.")
            return None
            
        logger.info(f"📁 R2 config: Account={settings.R2_ACCOUNT_ID}, Bucket={settings.R2_BUCKET_NAME}")
        
        import boto3
        from botocore.exceptions import ClientError
        
        # Configure R2 client (S3-compatible)
        r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'  # R2 uses 'auto' as region
        )
        
        logger.info(f"🔌 R2 client initialized successfully")
        
        # Read video file
        video_file = Path(video_path)
        if not video_file.exists():
            logger.error(f"❌ Video file not found: {video_path}")
            return None
            
        logger.info(f"📹 Reading video file: {video_path} (size: {video_file.stat().st_size} bytes)")
        
        # Upload to R2
        bucket_name = settings.R2_BUCKET_NAME
        file_key = f"videos/{job_id}.mp4"
        
        logger.info(f"☁️ Uploading video {job_id} to R2 bucket '{bucket_name}' as '{file_key}'...")
        
        with open(video_file, 'rb') as f:
            r2_client.upload_fileobj(
                f,
                bucket_name,
                file_key,
                ExtraArgs={
                    'ContentType': 'video/mp4',
                    'CacheControl': 'max-age=31536000',  # 1 year cache
                }
            )
        
        # Generate public URL
        if settings.R2_PUBLIC_URL:
            public_url = f"{settings.R2_PUBLIC_URL}/{file_key}"
        else:
            # Fallback to R2 public URL format
            public_url = f"https://pub-{settings.R2_ACCOUNT_ID}.r2.dev/{file_key}"
            
        logger.info(f"✅ Video {job_id} uploaded to R2: {public_url}")
        return public_url
        
    except ClientError as e:
        logger.error(f"💥 R2 ClientError uploading video {job_id}: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"💥 Error uploading video {job_id} to R2: {str(e)}")
        return None


def upload_video_to_supabase(video_path: str, job_id: str) -> Optional[str]:
    """
    Upload video file to Supabase Storage.
    
    Args:
        video_path: Local path to the video file
        job_id: Unique identifier for the video
        
    Returns:
        Public URL to the uploaded video, or None if failed
    """
    logger.info(f"🔄 Starting Supabase upload for video {job_id}")
    
    try:
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("⚠️ Supabase not configured. Cannot upload video to cloud storage.")
            return None
            
        logger.info(f"📁 Supabase config: URL={settings.SUPABASE_URL}, Bucket={settings.SUPABASE_BUCKET}")
        
        from supabase import create_client, Client
        
        # Create Supabase client
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        logger.info(f"🔌 Supabase client initialized successfully")
        
        # Read video file
        video_file = Path(video_path)
        if not video_file.exists():
            logger.error(f"❌ Video file not found: {video_path}")
            return None
            
        logger.info(f"📹 Reading video file: {video_path} (size: {video_file.stat().st_size} bytes)")
        
        # Upload to Supabase Storage
        bucket_name = settings.SUPABASE_BUCKET or "videos"
        file_key = f"{job_id}.mp4"
        
        logger.info(f"☁️ Uploading video {job_id} to Supabase bucket '{bucket_name}' as '{file_key}'...")
        
        response = supabase.storage.from_(bucket_name).upload(
            file_key,
            str(video_file),  # Pass file path as string
            file_options={
                "content-type": "video/mp4"
            }
        )
        
        # Check if upload was successful (newer Supabase client returns httpx.Response)
        if hasattr(response, 'status_code') and response.status_code == 200:
            # Generate public URL
            public_url = supabase.storage.from_(bucket_name).get_public_url(file_key)
            logger.info(f"✅ Video {job_id} uploaded to Supabase: {public_url}")
            return public_url
        elif hasattr(response, 'data') and response.data:
            # Fallback for older client versions
            public_url = supabase.storage.from_(bucket_name).get_public_url(file_key)
            logger.info(f"✅ Video {job_id} uploaded to Supabase: {public_url}")
            return public_url
        else:
            logger.error(f"💥 Supabase upload failed for video {job_id}: {response}")
            return None
        
    except Exception as e:
        logger.error(f"💥 Error uploading video {job_id} to Supabase: {str(e)}")
        return None


def get_all_videos_from_supabase(limit: int = 50) -> list:
    """
    Get all videos from Supabase Storage for gallery display.
    
    Args:
        limit: Maximum number of videos to return
        
    Returns:
        List of all video metadata with Supabase URLs
    """
    try:
        # Check if Supabase is configured
        if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
            logger.warning("Supabase not configured. Cannot fetch videos.")
            return []
            
        logger.info("Fetching videos from Supabase Storage...")
        
        from supabase import create_client, Client
        
        # Create Supabase client
        supabase: Client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        
        # List all files in the videos bucket
        bucket_name = settings.SUPABASE_BUCKET or "videos"
        
        try:
            # List files in the bucket
            response = supabase.storage.from_(bucket_name).list()
            
            if not response:
                logger.info("No files found in Supabase videos bucket")
                return []
            
            # Filter for video files and create metadata
            videos = []
            for file_obj in response:
                if isinstance(file_obj, dict) and file_obj.get('name', '').endswith('.mp4'):
                    file_name = file_obj['name']
                    # Extract job_id from filename (remove .mp4 extension)
                    job_id = file_name.replace('.mp4', '')
                    
                    # Generate public URL
                    public_url = supabase.storage.from_(bucket_name).get_public_url(file_name)
                    
                    # Get file metadata
                    created_at = file_obj.get('created_at', '')
                    updated_at = file_obj.get('updated_at', '')
                    file_size = file_obj.get('metadata', {}).get('size', 0)
                    
                    video_metadata = {
                        "job_id": job_id,
                        "prompt": f"Generated video {job_id}",  # Default prompt, could be enhanced
                        "video_url": public_url,
                        "creation_time": created_at or updated_at,
                        "file_size": file_size,
                        "video_type": "manim_animation",
                        "source": "supabase_storage"
                    }
                    
                    videos.append(video_metadata)
                    
                    if len(videos) >= limit:
                        break
            
            # Sort by creation time (newest first)
            videos.sort(key=lambda x: x.get('creation_time', ''), reverse=True)
            
            logger.info(f"Retrieved {len(videos)} videos from Supabase Storage")
            return videos
            
        except Exception as storage_error:
            logger.error(f"Error listing files from Supabase Storage: {str(storage_error)}")
            return []
        
    except Exception as e:
        logger.error(f"Error fetching videos from Supabase: {str(e)}")
        return []


def get_all_videos_combined(limit: int = 50) -> list:
    """
    Get all videos from both Supabase Storage and Pinecone, with Supabase as primary source.
    
    Args:
        limit: Maximum number of videos to return
        
    Returns:
        List of all video metadata from both sources, deduplicated by job_id
    """
    try:
        # First, get videos from Supabase Storage (primary source)
        supabase_videos = get_all_videos_from_supabase(limit)
        
        # Then, get videos from Pinecone (for metadata enrichment)
        pinecone_videos = get_all_videos_from_pinecone(limit)
        
        # Create a map of Pinecone videos by job_id for enrichment
        pinecone_map = {video.get("job_id"): video for video in pinecone_videos if video.get("job_id")}
        
        # Enrich Supabase videos with Pinecone metadata
        enriched_videos = []
        seen_job_ids = set()
        
        for video in supabase_videos:
            job_id = video.get("job_id")
            if job_id and job_id not in seen_job_ids:
                seen_job_ids.add(job_id)
                
                # Enrich with Pinecone data if available
                pinecone_data = pinecone_map.get(job_id, {})
                enriched_video = {
                    **video,
                    "prompt": pinecone_data.get("prompt", video.get("prompt", f"Generated video {job_id}")),
                    "video_type": pinecone_data.get("video_type", video.get("video_type", "manim_animation")),
                }
                enriched_videos.append(enriched_video)
        
        # Add any Pinecone videos that aren't in Supabase (fallback for older videos)
        for video in pinecone_videos:
            job_id = video.get("job_id")
            if job_id and job_id not in seen_job_ids:
                seen_job_ids.add(job_id)
                enriched_videos.append(video)
        
        # Sort by creation time (newest first)
        enriched_videos.sort(key=lambda x: x.get('creation_time', ''), reverse=True)
        
        # Limit results
        final_videos = enriched_videos[:limit]
        
        logger.info(f"Retrieved {len(final_videos)} videos total (Supabase: {len(supabase_videos)}, Pinecone: {len(pinecone_videos)})")
        return final_videos
        
    except Exception as e:
        logger.error(f"Error fetching combined videos: {str(e)}")
        # Fallback to Pinecone only
        return get_all_videos_from_pinecone(limit) 