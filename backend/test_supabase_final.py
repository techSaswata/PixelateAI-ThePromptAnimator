#!/usr/bin/env python3
"""
Final Supabase test with unique filenames
"""
import os
import sys
import time
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.video_storage import upload_video_to_supabase

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

def test_final_upload():
    """Final upload test with unique filename"""
    print("🚀 Final Supabase Upload Test")
    print("=" * 40)
    
    # Create unique test file
    timestamp = int(time.time())
    test_content = f"Hello from PixelateAI! Timestamp: {timestamp}"
    test_file_path = Path(f"test_final_{timestamp}.txt")
    
    try:
        # Write test content
        test_file_path.write_text(test_content)
        print(f"✅ Created test file: {test_file_path}")
        
        # Test upload using our function
        print("📤 Testing Supabase upload...")
        job_id = f"test-final-{timestamp}"
        result = upload_video_to_supabase(str(test_file_path), job_id)
        
        if result:
            print(f"✅ Upload successful!")
            print(f"📁 File URL: {result}")
            return True
        else:
            print("❌ Upload failed")
            return False
            
    except Exception as e:
        print(f"❌ Error during test: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        # Cleanup
        if test_file_path.exists():
            test_file_path.unlink()
            print(f"🗑️  Cleaned up test file")

if __name__ == "__main__":
    success = test_final_upload()
    
    if success:
        print("\n🎉 Supabase storage is working perfectly!")
    else:
        print("\n💥 Supabase storage still needs attention")
    
    print("=" * 40) 