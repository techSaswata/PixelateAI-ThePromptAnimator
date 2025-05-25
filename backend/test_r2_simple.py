#!/usr/bin/env python3
"""
Simple R2 test without OpenAI dependencies
"""
import boto3
from botocore.exceptions import ClientError
import os
from pathlib import Path

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

def test_r2_simple():
    """Simple R2 connection test"""
    print("🔧 Simple R2 Test")
    print("=" * 40)
    
    # Load environment variables
    env_vars = load_env()
    
    # Get R2 configuration
    account_id = env_vars.get('R2_ACCOUNT_ID')
    access_key_id = env_vars.get('R2_ACCESS_KEY_ID')
    secret_access_key = env_vars.get('R2_SECRET_ACCESS_KEY')
    bucket_name = env_vars.get('R2_BUCKET_NAME')
    public_url = env_vars.get('R2_PUBLIC_URL')
    
    print(f"Account ID: {account_id}")
    print(f"Access Key: {access_key_id[:10]}..." if access_key_id else "None")
    print(f"Secret Key: {'*' * 20}" if secret_access_key else "None")
    print(f"Bucket: {bucket_name}")
    print(f"Public URL: {public_url}")
    print()
    
    if not all([account_id, access_key_id, secret_access_key, bucket_name]):
        print("❌ Missing R2 configuration")
        return False
    
    try:
        # Initialize R2 client
        print("🔌 Initializing R2 client...")
        r2_client = boto3.client(
            's3',
            endpoint_url=f'https://{account_id}.r2.cloudflarestorage.com',
            aws_access_key_id=access_key_id,
            aws_secret_access_key=secret_access_key,
            region_name='auto'
        )
        print("✅ R2 client initialized")
        
        # Test bucket listing
        print("\n📁 Testing bucket listing...")
        try:
            response = r2_client.list_buckets()
            buckets = [bucket['Name'] for bucket in response['Buckets']]
            print(f"✅ Available buckets: {buckets}")
            
            if bucket_name in buckets:
                print(f"✅ Target bucket '{bucket_name}' exists")
            else:
                print(f"❌ Target bucket '{bucket_name}' not found!")
                return False
                
        except ClientError as e:
            print(f"❌ Cannot list buckets: {e}")
            return False
        
        # Test upload
        print(f"\n📤 Testing upload to '{bucket_name}'...")
        test_key = "test-connection.txt"
        test_content = b"Hello from PixelateAI R2 test!"
        
        try:
            r2_client.put_object(
                Bucket=bucket_name,
                Key=test_key,
                Body=test_content,
                ContentType='text/plain'
            )
            print("✅ Upload successful!")
            
            # Generate public URL
            if public_url:
                file_url = f"{public_url}/{test_key}"
                print(f"📁 File URL: {file_url}")
            
            # Cleanup
            r2_client.delete_object(Bucket=bucket_name, Key=test_key)
            print("✅ Cleanup successful!")
            return True
            
        except ClientError as e:
            print(f"❌ Upload failed: {e}")
            return False
            
    except Exception as e:
        print(f"💥 Unexpected error: {e}")
        return False

if __name__ == "__main__":
    success = test_r2_simple()
    
    if success:
        print("\n🎉 R2 integration is working perfectly!")
    else:
        print("\n💥 R2 setup needs attention") 