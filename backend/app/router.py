from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, Response
from .schemas import GenerateRequest
from .generator import generate_manim_code, generate_manim_code_with_shots, generate_manim_code_smart
from .config import settings
from .video_storage import save_video_to_pinecone, search_videos_in_pinecone, get_all_videos_from_pinecone, upload_video_to_supabase, get_all_videos_combined
import uuid
import logging
import os
import subprocess
import tempfile
import shutil
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# Create videos directory if it doesn't exist
VIDEOS_DIR = Path("videos")
VIDEOS_DIR.mkdir(exist_ok=True)

def render_manim_video(code: str, job_id: str) -> str:
    """Render Manim code to video and return video file path."""
    try:
        # Create temporary directory for rendering
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            
            # Write code to temporary Python file
            code_file = temp_path / "animation.py"
            with open(code_file, 'w') as f:
                f.write(code)
            
            # Run manim to render the video
            logger.info(f"Rendering video for job {job_id}...")
            
            # Use manim command to render
            cmd = [
                "python3", "-m", "manim",
                str(code_file),
                "Scene",  # Class name
                "-ql",    # Low quality for faster rendering on servers
                "--format", "mp4",
                "--output_file", f"{job_id}.mp4"
            ]
            
            # Ensure TinyTeX is in PATH for LaTeX/MathTex support
            env = os.environ.copy()
            # Try to find TinyTeX in common locations
            possible_tinytex_paths = [
                os.path.expanduser("~/Library/TinyTeX/bin/universal-darwin"),  # macOS
                os.path.expanduser("~/bin"),  # Linux
                "/usr/local/bin",
            ]
            for tinytex_path in possible_tinytex_paths:
                if os.path.exists(tinytex_path) and tinytex_path not in env.get("PATH", ""):
                    env["PATH"] = tinytex_path + ":" + env.get("PATH", "")
                    logger.info(f"Added TinyTeX to PATH: {tinytex_path}")
                    break
            
            result = subprocess.run(
                cmd,
                cwd=temp_dir,
                capture_output=True,
                text=True,
                timeout=300,  # 5 minute timeout for better compatibility with Render
                env=env
            )
            
            if result.returncode != 0:
                logger.error(f"Manim rendering failed: {result.stderr}")
                raise Exception(f"Video rendering failed: {result.stderr}")
            
            # Find the generated video file
            media_dir = temp_path / "media" / "videos" / "animation" / "480p15"
            video_files = list(media_dir.glob("*.mp4"))
            
            if not video_files:
                raise Exception("No video file generated")
            
            source_video = video_files[0]
            
            # Copy video to permanent storage
            destination = VIDEOS_DIR / f"{job_id}.mp4"
            shutil.copy2(source_video, destination)
            
            logger.info(f"Video rendered successfully: {destination}")
            return str(destination)
            
    except subprocess.TimeoutExpired:
        raise Exception("Video rendering timed out")
    except Exception as e:
        logger.error(f"Error rendering video: {str(e)}")
        raise Exception(f"Video rendering failed: {str(e)}")


@router.post("/simple-generate")
def simple_generate(req: GenerateRequest):
    """Generate Manim code and render video."""
    logger.info(f"Received prompt: {req.prompt}")
    
    try:
        # Generate Manim code using OpenAI
        logger.info("Generating Manim code with OpenAI...")
        manim_code = generate_manim_code_smart(req.prompt)
        
        # Create unique job ID
        job_id = str(uuid.uuid4())
        
        logger.info(f"Generated code for job {job_id}")
        logger.info(f"Generated code:\n{manim_code}")
        
        # Render video server-side
        try:
            logger.info(f"Starting video rendering for job {job_id}...")
            video_path = render_manim_video(manim_code, job_id)
            logger.info(f"Video rendering completed for job {job_id}: {video_path}")
            
            # Try to upload to Supabase Storage for deployment access
            logger.info(f"Starting Supabase upload for job {job_id}...")
            cloud_video_url = upload_video_to_supabase(video_path, job_id)
            
            if cloud_video_url:
                video_url = cloud_video_url  # Use cloud URL
                logger.info(f"✅ Video {job_id} uploaded to cloud storage: {cloud_video_url}")
            else:
                video_url = f"/api/videos/{job_id}.mp4"  # Fallback to local URL
                logger.warning(f"⚠️ Using local video URL for {job_id} (cloud upload failed)")
            
            video_status = "✅ Video rendered successfully"
            video_available = True
            
            # Save video metadata to Pinecone
            try:
                logger.info(f"Starting Pinecone save for job {job_id}...")
                pinecone_success = save_video_to_pinecone(
                    job_id=job_id,
                    prompt=req.prompt,
                    manim_code=manim_code,
                    video_path=video_path,
                    video_url=video_url,
                    metadata={
                        "quality": req.quality,
                        "generation_timestamp": str(uuid.uuid4())
                    }
                )
                
                if pinecone_success:
                    logger.info(f"✅ Video {job_id} successfully saved to Pinecone")
                else:
                    logger.warning(f"⚠️ Failed to save video {job_id} to Pinecone")
                    
            except Exception as pinecone_error:
                logger.error(f"❌ Error saving to Pinecone for job {job_id}: {str(pinecone_error)}")
                # Don't fail the entire request if Pinecone fails
                
        except Exception as video_error:
            logger.error(f"❌ Video rendering failed for job {job_id}: {str(video_error)}")
            logger.error(f"❌ Video error details: {type(video_error).__name__}: {str(video_error)}")
            video_url = None
            video_status = f"❌ Video rendering failed: {str(video_error)}"
            video_available = False
        
        # Create structured response with generated code and video
        return {
            "success": True,
            "job_id": job_id,
            "message": f"Animation generated for: {req.prompt[:50]}...",
            "code": manim_code,
            "video": {
                "url": video_url,
                "status": video_status,
                "available": video_available,
                "thumbnail": f"/api/videos/{job_id}/thumbnail.jpg" if video_available else None
            },
            "animation": {
                "title": f"Animation for: {req.prompt[:30]}...",
                "description": "Mathematical visualization generated with AI",
                "duration": "5-10 seconds",
                "quality": "Medium (720p)",
                "status": video_status
            },
            "scenes": [
                {
                    "id": f"scene-{uuid.uuid4()}", 
                    "name": "Setup", 
                    "duration": 2000,
                    "description": "Initialize mathematical elements"
                },
                {
                    "id": f"scene-{uuid.uuid4()}", 
                    "name": "Main Animation", 
                    "duration": 6000,
                    "description": "Core mathematical concept visualization"
                },
                {
                    "id": f"scene-{uuid.uuid4()}", 
                    "name": "Conclusion", 
                    "duration": 2000,
                    "description": "Final state and summary"
                }
            ],
            "clips": [
                {
                    "id": f"clip-{uuid.uuid4()}", 
                    "name": "Generated Animation", 
                    "duration": "00:00:10.000", 
                    "video_url": video_url,
                    "thumbnail": f"/api/videos/{job_id}/thumbnail.jpg" if video_available else "/api/placeholder-thumbnail.jpg",
                    "code_preview": manim_code[:200] + "..." if len(manim_code) > 200 else manim_code
                }
            ]
        }
    
    except Exception as e:
        logger.error(f"Error in simple_generate: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to generate animation: {str(e)}"
        }


@router.get("/search-videos")
def search_videos(query: str, limit: int = 5):
    """Search for videos in Pinecone based on semantic similarity."""
    try:
        results = search_videos_in_pinecone(query, limit)
        return {
            "success": True,
            "query": query,
            "results": results,
            "total": len(results)
        }
    except Exception as e:
        logger.error(f"Error searching videos: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to search videos: {str(e)}"
        }


@router.get("/videos/{video_id}")
def serve_video(video_id: str):
    """Serve rendered video files."""
    video_path = VIDEOS_DIR / video_id
    
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="Video not found")
    
    return FileResponse(
        path=video_path,
        media_type="video/mp4",
        filename=video_id
    )


@router.get("/videos/{job_id}/thumbnail.jpg")
def get_video_thumbnail(job_id: str):
    """Generate and serve video thumbnail."""
    video_path = VIDEOS_DIR / f"{job_id}.mp4"
    
    if not video_path.exists():
        # Return placeholder thumbnail
        return get_placeholder_thumbnail()
    
    try:
        # Generate thumbnail using ffmpeg
        thumbnail_path = VIDEOS_DIR / f"{job_id}_thumb.jpg"
        
        if not thumbnail_path.exists():
            # Improved ffmpeg command with better options
            cmd = [
                "ffmpeg", "-i", str(video_path),
                "-ss", "00:00:01",  # Take frame at 1 second (safer than 2)
                "-vframes", "1",    # Only one frame
                "-vf", "scale=320:240",  # Scale to thumbnail size
                "-q:v", "2",        # High quality
                "-loglevel", "error",  # Reduce logging
                str(thumbnail_path),
                "-y"  # Overwrite if exists
            ]
            
            # Run with timeout to prevent hanging
            result = subprocess.run(
                cmd, 
                capture_output=True, 
                text=True, 
                timeout=10  # 10 second timeout
            )
            
            if result.returncode != 0:
                logger.error(f"Thumbnail generation failed for {job_id}: {result.stderr}")
                
                # Fallback: try taking the very first frame
                fallback_cmd = [
                    "ffmpeg", "-i", str(video_path),
                    "-vframes", "1",    # First frame
                    "-vf", "scale=320:240",
                    "-q:v", "2",
                    "-loglevel", "error",
                    str(thumbnail_path),
                    "-y"
                ]
                
                fallback_result = subprocess.run(
                    fallback_cmd, 
                    capture_output=True, 
                    text=True, 
                    timeout=5
                )
                
                if fallback_result.returncode != 0:
                    logger.error(f"Fallback thumbnail generation also failed for {job_id}")
                    return get_placeholder_thumbnail()
        
        # Check if thumbnail was actually created
        if not thumbnail_path.exists():
            logger.error(f"Thumbnail file was not created for {job_id}")
            return get_placeholder_thumbnail()
            
        return FileResponse(
            path=thumbnail_path,
            media_type="image/jpeg",
            filename=f"{job_id}_thumbnail.jpg"
        )
        
    except subprocess.TimeoutExpired:
        logger.error(f"Thumbnail generation timed out for {job_id}")
        return get_placeholder_thumbnail()
    except Exception as e:
        logger.error(f"Error generating thumbnail for {job_id}: {str(e)}")
        return get_placeholder_thumbnail()


@router.get("/debug/supabase")
def debug_supabase():
    """Debug endpoint to check Supabase configuration."""
    return {
        "supabase_url": settings.SUPABASE_URL,
        "supabase_key_configured": bool(settings.SUPABASE_KEY),
        "supabase_bucket": settings.SUPABASE_BUCKET,
        "all_configured": bool(settings.SUPABASE_URL and settings.SUPABASE_KEY)
    }


@router.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok", "message": "Backend is running!"}


@router.get("/placeholder-thumbnail.jpg")
def get_placeholder_thumbnail():
    """Return a placeholder thumbnail for generated animations."""
    
    # Simple 1x1 pixel placeholder image (base64 encoded)
    placeholder_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc\xf8\x0f\x00\x00\x00\x00\xff\xff\x03\x00\x00\x06\x00\x05H\xe0\x9b\x00\x00\x00\x00IEND\xaeB`\x82'
    
    return Response(content=placeholder_data, media_type="image/png")


@router.get("/gallery/videos")
async def get_gallery_videos():
    """Get all videos from Supabase Storage and Pinecone for gallery display"""
    try:
        # Get all videos from both Supabase Storage (primary) and Pinecone (metadata enrichment)
        videos = get_all_videos_combined(limit=50)
        
        # Format videos for gallery display
        formatted_videos = []
        for video in videos:
            # Prioritize Supabase URLs for remote access compatibility
            video_url = video.get("video_url", "")
            
            # Skip videos without proper URLs for remote access
            if not video_url or not video_url.startswith("http"):
                # For remote access (ngrok), skip videos that only have local URLs
                # Only include videos with full Supabase URLs
                logger.debug(f"Skipping video {video.get('job_id')} - no cloud URL available")
                continue
            
            formatted_video = {
                "id": video.get("job_id", "unknown"),
                "title": extract_title_from_prompt(video.get("prompt", "Untitled Video")),
                "description": video.get("prompt", "No description available"),
                "video_url": video_url,  # Use full Supabase URL
                "creation_time": video.get("creation_time", ""),
                "category": "mathematics",  # Default category, could be enhanced with AI classification
                "duration": "Unknown",  # Could be enhanced by reading video metadata
                "thumbnail": f"/api/videos/{video.get('job_id', 'unknown')}/thumbnail.jpg",
                "source": video.get("source", "unknown")
            }
            formatted_videos.append(formatted_video)
        
        logger.info(f"Retrieved {len(formatted_videos)} videos for gallery (cloud URLs only)")
        
        return {
            "success": True,
            "videos": formatted_videos,
            "total": len(formatted_videos)
        }
        
    except Exception as e:
        logger.error(f"Error fetching gallery videos: {str(e)}")
        return {
            "success": False,
            "error": str(e),
            "videos": []
        }


def extract_title_from_prompt(prompt: str) -> str:
    """Extract a meaningful title from the prompt"""
    if not prompt:
        return "Untitled Video"
    
    # Take first 50 chars and clean up
    title = prompt[:50].strip()
    if len(prompt) > 50:
        title += "..."
    
    # Capitalize first letter
    return title[0].upper() + title[1:] if title else "Untitled Video"
