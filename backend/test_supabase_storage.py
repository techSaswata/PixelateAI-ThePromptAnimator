#!/usr/bin/env python3
"""
Test script to verify Supabase Storage functionality
"""
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.video_storage import upload_video_to_supabase

# Load environment variables manually
def load_env():
    env_file = Path(__file__).parent / ".env"
    env_vars = {}
    
    if env_file.exists():
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key.strip()] = value.strip()
    
    return env_vars

def test_supabase_storage():
    """Test Supabase storage upload functionality"""
    print("🔧 Supabase Storage Test")
    print("=" * 40)
    
    # Load environment variables
    env_vars = load_env()
    
    # Get Supabase configuration
    supabase_url = env_vars.get('SUPABASE_URL')
    supabase_key = env_vars.get('SUPABASE_KEY')
    supabase_bucket = env_vars.get('SUPABASE_BUCKET')
    
    print(f"Supabase URL: {supabase_url}")
    print(f"Supabase Key: {supabase_key[:20]}..." if supabase_key else "None")
    print(f"Bucket: {supabase_bucket}")
    print()
    
    if not all([supabase_url, supabase_key, supabase_bucket]):
        print("❌ Missing Supabase configuration")
        return False
    
    # Create a test file
    test_content = "Hello from PixelateAI Supabase test!"
    test_file_path = Path("test_supabase_upload.txt")
    
    try:
        # Write test content
        test_file_path.write_text(test_content)
        print(f"✅ Created test file: {test_file_path}")
        
        # Test upload using existing function
        print("📤 Testing Supabase upload...")
        result = upload_video_to_supabase(str(test_file_path), "test-supabase-upload")
        
        if result:
            print(f"✅ Upload successful!")
            print(f"📁 File URL: {result}")
            return True
        else:
            print("❌ Upload failed")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        return False
    finally:
        # Cleanup
        if test_file_path.exists():
            test_file_path.unlink()
            print(f"🗑️  Cleaned up test file")

def test_supabase_direct():
    """Test Supabase storage using direct API calls"""
    print("\n🔧 Direct Supabase API Test")
    print("=" * 40)
    
    try:
        from supabase import create_client, Client
        
        # Load environment variables
        env_vars = load_env()
        
        url = env_vars.get('SUPABASE_URL')
        key = env_vars.get('SUPABASE_KEY')
        bucket = env_vars.get('SUPABASE_BUCKET', 'videos')
        
        if not url or not key:
            print("❌ Missing Supabase credentials")
            return False
        
        # Create Supabase client
        supabase: Client = create_client(url, key)
        print("✅ Supabase client created")
        
        # Test file upload
        test_content = b"Direct API test from PixelateAI!"
        file_name = "test-direct-upload.txt"
        
        print(f"📤 Uploading to bucket '{bucket}'...")
        
        # Upload file
        response = supabase.storage.from_(bucket).upload(
            file_name,
            test_content,
            file_options={"content-type": "text/plain"}
        )
        
        if response.data:
            print("✅ Direct upload successful!")
            
            # Get public URL
            public_url = supabase.storage.from_(bucket).get_public_url(file_name)
            print(f"📁 Public URL: {public_url}")
            
            # Cleanup - delete the test file
            delete_response = supabase.storage.from_(bucket).remove([file_name])
            if delete_response.data:
                print("✅ Cleanup successful!")
            
            return True
        else:
            print(f"❌ Upload failed: {response}")
            return False
            
    except Exception as e:
        print(f"❌ Error during direct test: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 PixelateAI Supabase Storage Test")
    print("=" * 50)
    
    # Test 1: Using existing upload function
    success1 = test_supabase_storage()
    
    # Test 2: Direct API test
    success2 = test_supabase_direct()
    
    if success1 or success2:
        print("\n🎉 Supabase storage is working!")
    else:
        print("\n💥 Supabase storage needs attention")
    
    print("=" * 50) 