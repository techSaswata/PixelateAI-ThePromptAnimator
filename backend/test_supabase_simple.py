#!/usr/bin/env python3
"""
Simple Supabase test to debug upload issues
"""
from supabase import create_client, Client
from pathlib import Path

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

def test_simple_upload():
    """Simple upload test"""
    print("🔧 Simple Supabase Upload Test")
    print("=" * 40)
    
    env_vars = load_env()
    url = env_vars.get('SUPABASE_URL')
    key = env_vars.get('SUPABASE_KEY')
    
    if not url or not key:
        print("❌ Missing credentials")
        return False
    
    try:
        # Create client
        supabase: Client = create_client(url, key)
        print("✅ Client created")
        
        # Create a test file
        test_file = Path("test_upload.txt")
        test_file.write_text("Hello from PixelateAI!")
        print(f"✅ Created test file: {test_file}")
        
        # Test upload
        file_name = "test-upload.txt"
        
        print("📤 Testing file upload...")
        response = supabase.storage.from_("videos").upload(
            file_name,
            str(test_file),
            file_options={"content-type": "text/plain"}
        )
        
        print(f"Response type: {type(response)}")
        print(f"Response: {response}")
        
        # Check if upload was successful
        if hasattr(response, 'data') and response.data:
            print("✅ Upload successful!")
            
            # Get public URL
            public_url = supabase.storage.from_("videos").get_public_url(file_name)
            print(f"📁 Public URL: {public_url}")
            
            # Cleanup
            delete_response = supabase.storage.from_("videos").remove([file_name])
            print(f"Delete response: {delete_response}")
            print("✅ Cleanup done")
            
            # Remove local test file
            test_file.unlink()
            print("✅ Local file cleaned up")
            
            return True
        else:
            print(f"❌ Upload failed")
            print(f"Response details: {response}")
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup local file if it exists
        if test_file.exists():
            test_file.unlink()
        
    return False

if __name__ == "__main__":
    test_simple_upload() 