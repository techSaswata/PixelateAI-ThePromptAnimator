#!/usr/bin/env python3
"""
Simple script to run the PixelateAI backend server.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend directory
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

# Check if OpenAI API key is set as environment variable
if not os.getenv("OPENAI_API_KEY"):
    print("ERROR: OPENAI_API_KEY environment variable is not set!")
    print("Please set it before running the server:")
    print("export OPENAI_API_KEY='your-api-key-here'")
    print(f"Or add it to the .env file at: {env_path}")
    sys.exit(1)

# Add the app directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    import uvicorn
    
    print("Starting PixelateAI Backend Server...")
    print("Server will be available at: http://localhost:5001")
    
    uvicorn.run(
        "app.main:app", 
        host="0.0.0.0", 
        port=5001, 
        reload=True,
        log_level="info"
    ) 