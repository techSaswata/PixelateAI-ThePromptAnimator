from pydantic_settings import BaseSettings
from typing import Optional
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    APP_NAME: str = "Manim Visualization API"
    APP_VERSION: str = "1.0.0"
    RENDER_DIR: str = os.path.join(os.getcwd(), "renders")
    SUPABASE_URL: Optional[str] = os.getenv("SUPABASE_URL")
    SUPABASE_KEY: Optional[str] = os.getenv("SUPABASE_KEY")
    SUPABASE_BUCKET: Optional[str] = os.getenv("SUPABASE_BUCKET")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    MANIM_QUALITY: Optional[str] = "m"
    PINECONE_API_KEY: Optional[str] = os.getenv("PINECONE_API_KEY")
    PINECONE_INDEX_NAME: Optional[str] = os.getenv("PINECONE_INDEX_NAME")
    LANGCHAIN_API_KEY: Optional[str] = os.getenv("LANGCHAIN_API_KEY")
    LANGCHAIN_TRACING_V2: Optional[str] = os.getenv("LANGCHAIN_TRACING_V2")
    LANGCHAIN_PROJECT: Optional[str] = os.getenv("LANGCHAIN_PROJECT")

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
