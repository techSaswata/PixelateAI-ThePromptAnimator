from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend directory specifically
backend_dir = Path(__file__).parent.parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    APP_NAME: str = "Manim Visualization API"
    APP_VERSION: str = "1.0.0"
    RENDER_DIR: str = os.path.join(os.getcwd(), "renders")
    SUPABASE_URL: Optional[str] = None
    SUPABASE_KEY: Optional[str] = None
    SUPABASE_BUCKET: Optional[str] = "videos"
    OPENAI_API_KEY: Optional[str] = None  # Optional: for embeddings only
    GEMINI_API_KEY: Optional[str] = None  # Primary: for code generation
    MANIM_QUALITY: Optional[str] = "m"
    
    # Hardcoded Pinecone credentials
    PINECONE_API_KEY: str = "pcsk_5JcGmi_JegaLBqQJb5jkCksXSC7v5hsoej9V5dsND2oqwKizFgz5jgTxyxmDeGD2EoxCEN"
    PINECONE_INDEX_NAME: str = "manim-docs"
    
    # Cohere API Key for embeddings (optional)
    COHERE_API_KEY: Optional[str] = None
    
    LANGCHAIN_API_KEY: Optional[str] = os.getenv("LANGCHAIN_API_KEY")
    LANGCHAIN_TRACING_V2: Optional[str] = os.getenv("LANGCHAIN_TRACING_V2")
    LANGCHAIN_PROJECT: Optional[str] = os.getenv("LANGCHAIN_PROJECT")
    R2_ACCOUNT_ID: Optional[str] = None
    R2_ACCESS_KEY_ID: Optional[str] = None
    R2_SECRET_ACCESS_KEY: Optional[str] = None
    R2_BUCKET_NAME: Optional[str] = "pixelateai-videos"
    R2_PUBLIC_URL: Optional[str] = None

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
