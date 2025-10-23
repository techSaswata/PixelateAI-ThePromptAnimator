#!/usr/bin/env python3
"""
Simple test script to debug Supabase Storage upload issues.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
backend_dir = Path(__file__).parent
env_path = backend_dir / ".env"
load_dotenv(dotenv_path=env_path)

def test_supabase_upload():
    """Test Supabase Storage upload with detailed debugging."""
    
    print("🔍 Testing Supabase Storage Upload...")
    print(f"📂 Using .env file: {env_path}")
    
    # Check environment variables
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase_bucket = os.getenv("SUPABASE_BUCKET", "videos")
    
    print(f"\n📋 Configuration:")
    print(f"   SUPABASE_URL: {supabase_url}")
    print(f"   SUPABASE_KEY: {'[CONFIGURED]' if supabase_key else '[MISSING]'}")
    print(f"   SUPABASE_BUCKET: {supabase_bucket}")
    
    if supabase_key:
        key_length = len(supabase_key)
        key_prefix = supabase_key[:20] + "..." if len(supabase_key) > 20 else supabase_key
        print(f"   Key Length: {key_length} chars")
        print(f"   Key Preview: {key_prefix}")
        
        # Check if it looks like service role key (should be long JWT)
        if key_length > 100 and supabase_key.startswith("eyJ"):
            print(f"   ✅ Looks like SERVICE ROLE key (JWT format)")
        elif key_length < 100:
            print(f"   ⚠️  WARNING: Might be ANON key (too short for service role)")
        else:
            print(f"   ❓ Unknown key format")
    
    if not supabase_url or not supabase_key:
        print(f"\n❌ Missing required environment variables!")
        return False
    
    try:
        print(f"\n🔌 Testing Supabase client connection...")
        from supabase import create_client
        
        supabase = create_client(supabase_url, supabase_key)
        print(f"   ✅ Supabase client created successfully")
        
        # Create a small test file
        test_content = b"Hello, Supabase! This is a test file."
        test_filename = "test-upload.txt"
        
        print(f"\n☁️ Testing upload to bucket '{supabase_bucket}'...")
        
        # Try to upload
        response = supabase.storage.from_(supabase_bucket).upload(
            test_filename, 
            test_content
        )
        
        print(f"   ✅ Upload successful!")
        print(f"   Response: {response}")
        
        # Try to get public URL
        public_url = supabase.storage.from_(supabase_bucket).get_public_url(test_filename)
        print(f"   🌐 Public URL: {public_url}")
        
        # Clean up - delete test file
        print(f"\n🧹 Cleaning up test file...")
        delete_response = supabase.storage.from_(supabase_bucket).remove([test_filename])
        print(f"   ✅ Test file deleted: {delete_response}")
        
        return True
        
    except Exception as e:
        print(f"\n💥 Upload failed with error:")
        print(f"   Error Type: {type(e).__name__}")
        print(f"   Error Message: {str(e)}")
        
        # Try to parse the error for common issues
        error_str = str(e).lower()
        if "row-level security" in error_str or "unauthorized" in error_str:
            print(f"\n🚨 DIAGNOSIS: RLS Policy Issue")
            print(f"   ➡️  Your service role key might be wrong, OR")
            print(f"   ➡️  The storage policies aren't set up correctly")
        elif "bucket" in error_str or "not found" in error_str:
            print(f"\n🚨 DIAGNOSIS: Bucket Issue")
            print(f"   ➡️  The '{supabase_bucket}' bucket doesn't exist")
        elif "authentication" in error_str or "forbidden" in error_str:
            print(f"\n🚨 DIAGNOSIS: Authentication Issue")
            print(f"   ➡️  Wrong API key or insufficient permissions")
        
        return False

if __name__ == "__main__":
    success = test_supabase_upload()
    if success:
        print(f"\n🎉 All tests passed! Supabase Storage is working correctly.")
    else:
        print(f"\n❌ Tests failed. Please fix the issues above.") 