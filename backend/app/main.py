from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import logging
import os
from pathlib import Path

from .router import router as manim_router
from .config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


class VideoStaticFiles(StaticFiles):
    """Custom StaticFiles class that adds CORS headers for video files"""
    
    async def get_response(self, path: str, scope) -> Response:
        response = await super().get_response(path, scope)
        
        # Add CORS headers for video files
        if isinstance(response, FileResponse):
            response.headers.update({
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
                "Access-Control-Allow-Headers": "Range, Content-Range, Content-Type",
                "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges",
                "Cache-Control": "public, max-age=3600"
            })
        
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting application")
    
    # Create videos directory
    videos_dir = Path("videos")
    videos_dir.mkdir(exist_ok=True)
    logger.info(f"Videos directory ready: {videos_dir}")
    
    logger.info("Application startup complete")

    yield  # Control passes to the app
    logger.info("Shutting down application")
    logger.info("Application shutdown complete")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="API for generating visualizations using Manim with server-side rendering",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(manim_router, prefix="/api", tags=["manim"])

# Mount static files
if os.path.exists(settings.RENDER_DIR):
    app.mount("/renders", StaticFiles(directory=settings.RENDER_DIR), name="renders")
    logger.info(f"Mounted render directory: {settings.RENDER_DIR}")

# Mount videos directory for serving rendered videos
videos_path = Path("videos")
if videos_path.exists():
    app.mount("/api/videos", VideoStaticFiles(directory="videos"), name="videos")
    logger.info(f"Mounted videos directory: {videos_path}")


@app.get("/")
async def root():
    """Root endpoint for health check."""
    return {
        "status": "ok",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "features": {
            "code_generation": "✅ OpenAI GPT-4",
            "video_rendering": "✅ Manim server-side",
            "video_serving": "✅ Static file serving"
        }
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=5001, reload=True)
