#!/usr/bin/env python3
"""
Test Pinecone configuration in server environment
"""
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.config import settings
from app.video_storage import get_embedding

def test_pinecone_config():
    """Test Pinecone configuration"""
    print("🔍 Testing Pinecone Configuration")
    print("=" * 40)
    
    # Test 1: Check environment variables
    print("\n📋 Environment Variables:")
    print(f"PINECONE_API_KEY: {'✅ Set' if settings.PINECONE_API_KEY else '❌ Not set'}")
    if settings.PINECONE_API_KEY:
        print(f"  Length: {len(settings.PINECONE_API_KEY)} characters")
        print(f"  Starts with: {settings.PINECONE_API_KEY[:10]}...")
    
    print(f"PINECONE_INDEX_NAME: {settings.PINECONE_INDEX_NAME or '❌ Not set'}")
    print(f"OPENAI_API_KEY: {'✅ Set' if settings.OPENAI_API_KEY else '❌ Not set'}")
    
    # Test 2: Check embeddings initialization
    print("\n🧠 Embeddings Test:")
    try:
        embedding = get_embedding()
        if embedding:
            print("✅ Embeddings initialized successfully")
            print(f"   Type: {type(embedding)}")
        else:
            print("❌ Embeddings failed to initialize")
    except Exception as e:
        print(f"❌ Embeddings error: {str(e)}")
    
    # Test 3: Try Pinecone connection
    print("\n🌲 Pinecone Connection Test:")
    try:
        if settings.PINECONE_API_KEY and settings.PINECONE_INDEX_NAME:
            from pinecone import Pinecone
            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            index = pc.Index(settings.PINECONE_INDEX_NAME)
            
            # Try to get index stats
            stats = index.describe_index_stats()
            print("✅ Pinecone connection successful")
            print(f"   Index stats: {stats}")
        else:
            print("❌ Pinecone credentials missing")
    except Exception as e:
        print(f"❌ Pinecone connection error: {str(e)}")
    
    print("\n" + "=" * 40)
    print("🎯 Pinecone configuration test completed!")

if __name__ == "__main__":
    test_pinecone_config() 