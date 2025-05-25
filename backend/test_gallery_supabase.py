#!/usr/bin/env python3
"""
Test script to verify gallery functionality with Supabase Storage
"""
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.video_storage import get_all_videos_from_supabase, get_all_videos_combined
from app.config import settings

def test_gallery_functionality():
    """Test the new gallery functionality"""
    print("🎬 Testing Gallery Functionality with Supabase")
    print("=" * 50)
    
    # Test 1: Fetch videos from Supabase Storage only
    print("\n📁 Test 1: Fetching videos from Supabase Storage...")
    try:
        supabase_videos = get_all_videos_from_supabase(limit=10)
        print(f"✅ Found {len(supabase_videos)} videos in Supabase Storage")
        
        for i, video in enumerate(supabase_videos[:3], 1):  # Show first 3
            print(f"  {i}. Job ID: {video.get('job_id', 'N/A')}")
            print(f"     URL: {video.get('video_url', 'N/A')}")
            print(f"     Created: {video.get('creation_time', 'N/A')}")
            print(f"     Source: {video.get('source', 'N/A')}")
            print()
            
    except Exception as e:
        print(f"❌ Error fetching from Supabase: {str(e)}")
    
    # Test 2: Fetch videos using combined function (Supabase + Pinecone)
    print("\n🔗 Test 2: Fetching videos using combined function...")
    try:
        combined_videos = get_all_videos_combined(limit=10)
        print(f"✅ Found {len(combined_videos)} videos total (Supabase + Pinecone)")
        
        for i, video in enumerate(combined_videos[:3], 1):  # Show first 3
            print(f"  {i}. Job ID: {video.get('job_id', 'N/A')}")
            print(f"     Prompt: {video.get('prompt', 'N/A')[:50]}...")
            print(f"     URL: {video.get('video_url', 'N/A')}")
            print(f"     Created: {video.get('creation_time', 'N/A')}")
            print(f"     Source: {video.get('source', 'N/A')}")
            print()
            
    except Exception as e:
        print(f"❌ Error fetching combined videos: {str(e)}")
    
    # Test 3: Check configuration
    print("\n⚙️  Test 3: Configuration check...")
    print(f"Supabase URL: {settings.SUPABASE_URL[:30]}..." if settings.SUPABASE_URL else "❌ Not set")
    print(f"Supabase Key: {'✅ Set' if settings.SUPABASE_KEY else '❌ Not set'}")
    print(f"Supabase Bucket: {settings.SUPABASE_BUCKET}")
    print(f"Pinecone API Key: {'✅ Set' if settings.PINECONE_API_KEY else '❌ Not set'}")
    print(f"Pinecone Index: {settings.PINECONE_INDEX_NAME}")
    
    print("\n" + "=" * 50)
    print("🎉 Gallery functionality test completed!")

if __name__ == "__main__":
    test_gallery_functionality() 