#!/usr/bin/env python3
"""
Test script to verify Cloudflare R2 connection and upload functionality
"""
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.config import settings
from app.video_storage import upload_video_to_r2

def test_r2_connection():
    """Test R2 connection and basic functionality"""
    print("🔍 Testing Cloudflare R2 Configuration...")
    print(f"Account ID: {settings.R2_ACCOUNT_ID}")
    print(f"Access Key ID: {settings.R2_ACCESS_KEY_ID[:10]}...")
    print(f"Secret Key: {'*' * 20}")
    print(f"Bucket: {settings.R2_BUCKET_NAME}")
    print(f"Public URL: {settings.R2_PUBLIC_URL}")
    print()

    # Create a test file
    test_content = "Hello from PixelateAI! This is a test upload."
    test_file_path = Path("test_upload.txt")
    
    try:
        # Write test content
        test_file_path.write_text(test_content)
        print(f"✅ Created test file: {test_file_path}")
        
        # Test upload
        print("📤 Testing R2 upload...")
        result = upload_video_to_r2(str(test_file_path), "test-upload.txt")
        
        if result:
            print(f"✅ Upload successful!")
            print(f"📁 File URL: {result}")
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
    
    return True

if __name__ == "__main__":
    print("🚀 PixelateAI R2 Connection Test")
    print("=" * 40)
    
    success = test_r2_connection()
    
    if success:
        print("\n🎉 R2 integration is working perfectly!")
    else:
        print("\n💥 R2 integration needs attention")
    
    print("=" * 40) 