#!/usr/bin/env python3
"""
Simple script to run the PixelateAI backend server.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Verify that the OpenAI API key is set
if not os.getenv("OPENAI_API_KEY"):
    print("ERROR: OPENAI_API_KEY environment variable is not set!")
    print("Please create a .env file in the backend directory with your OpenAI API key:")
    print("OPENAI_API_KEY=your_api_key_here")
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