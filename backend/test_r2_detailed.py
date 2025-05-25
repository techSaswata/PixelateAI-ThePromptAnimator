#!/usr/bin/env python3
"""
Detailed R2 test to diagnose connection issues
"""
import boto3
from botocore.exceptions import ClientError
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from app.config import settings

def test_r2_detailed():
    """Detailed R2 connection and permissions test"""
    print("🔧 Detailed R2 Diagnostics")
    print("=" * 50)
    
    # Check environment variables
    print("📋 Environment Variables:")
    print(f"  R2_ACCOUNT_ID: {settings.R2_ACCOUNT_ID}")
    print(f"  R2_ACCESS_KEY_ID: {settings.R2_ACCESS_KEY_ID[:10]}...")
    print(f"  R2_SECRET_ACCESS_KEY: {'*' * 20}")
    print(f"  R2_BUCKET_NAME: {settings.R2_BUCKET_NAME}")
    print(f"  R2_PUBLIC_URL: {settings.R2_PUBLIC_URL}")
    print()
    
    try:
        # Initialize R2 client
        print("🔌 Initializing R2 client...")
        r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            aws_access_key_id=settings.R2_ACCESS_KEY_ID,
            aws_secret_access_key=settings.R2_SECRET_ACCESS_KEY,
            region_name='auto'
        )
        print("✅ R2 client initialized")
        
        # Test 1: List buckets
        print("\n📁 Testing bucket listing...")
        try:
            response = r2_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            print(f"✅ Available buckets: {buckets}")
            
            if settings.R2_BUCKET_NAME in buckets:
                print(f"✅ Target bucket '{settings.R2_BUCKET_NAME}' exists")
            else:
                print(f"❌ Target bucket '{settings.R2_BUCKET_NAME}' not found!")
                print("   Available buckets:", buckets)
                return False
                
        except ClientError as e:
            print(f"❌ Cannot list buckets: {e}")
            return False
        
        # Test 2: Check bucket permissions
        print(f"\n🔐 Testing bucket '{settings.R2_BUCKET_NAME}' permissions...")
        try:
            # Try to list objects
            response = r2_client.list_objects_v2(Bucket=settings.R2_BUCKET_NAME, MaxKeys=1)
            print("✅ Can list objects in bucket")
        except ClientError as e:
            print(f"❌ Cannot list objects: {e}")
            
        # Test 3: Try minimal upload
        print("\n📤 Testing minimal upload...")
        test_key = "test-connection.txt"
        test_content = b"Test from PixelateAI"
        
        try:
            r2_client.put_object(
                Bucket=settings.R2_BUCKET_NAME,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            print("✅ Upload successful!")
            
            # Try to delete the test file
            r2_client.delete_object(Bucket=settings.R2_BUCKET_NAME, Key=test_key)
            print("✅ Cleanup successful!")
            return True
            
        except ClientError as e:
            print(f"❌ Upload failed: {e}")
            return False
            
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_r2_detailed()
    
    if success:
        print("\n🎉 All R2 tests passed!")
    else:
        print("\n💥 R2 setup needs attention")
        print("\nPossible solutions:")
        print("1. Check if bucket 'pixelateai-videos' exists in Cloudflare R2")
        print("2. Verify API token has correct permissions for the bucket")
        print("3. Ensure bucket name matches exactly (case-sensitive)") 