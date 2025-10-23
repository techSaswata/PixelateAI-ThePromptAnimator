#!/usr/bin/env python3
"""
Fix Supabase Storage RLS policies to allow public uploads
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

def fix_storage_policies():
    """Fix Supabase storage policies to allow uploads"""
    print("🔧 Fixing Supabase Storage Policies")
    print("=" * 40)
    
    env_vars = load_env()
    url = env_vars.get('SUPABASE_URL')
    key = env_vars.get('SUPABASE_KEY')
    
    if not url or not key:
        print("❌ Missing Supabase credentials")
        return False
    
    try:
        # Create Supabase client
        supabase: Client = create_client(url, key)
        print("✅ Supabase client created")
        
        # Try to create the bucket if it doesn't exist
        print("📁 Ensuring 'videos' bucket exists...")
        try:
            bucket_response = supabase.storage.create_bucket("videos", {"public": True})
            if bucket_response.data:
                print("✅ Videos bucket created successfully")
            else:
                print("ℹ️  Videos bucket already exists")
        except Exception as e:
            print(f"ℹ️  Bucket creation: {str(e)}")
        
        # Test upload with different approaches
        print("\n📤 Testing upload approaches...")
        
        # Approach 1: Try with upsert
        test_content = b"Test upload for policy fix"
        file_name = "test-policy-fix.txt"
        
        try:
            response = supabase.storage.from_("videos").upload(
                file_name,
                test_content,
                file_options={
                    "content-type": "text/plain",
                    "upsert": True
                }
            )
            
            if response.data:
                print("✅ Upload with upsert successful!")
                
                # Get public URL
                public_url = supabase.storage.from_("videos").get_public_url(file_name)
                print(f"📁 Public URL: {public_url}")
                
                # Cleanup
                supabase.storage.from_("videos").remove([file_name])
                print("✅ Cleanup successful!")
                return True
            else:
                print(f"❌ Upload failed: {response}")
                
        except Exception as e:
            print(f"❌ Upload error: {str(e)}")
        
        # Approach 2: Try with different file name pattern
        try:
            file_name2 = f"videos/{file_name}"
            response2 = supabase.storage.from_("videos").upload(
                file_name2,
                test_content,
                file_options={"content-type": "text/plain"}
            )
            
            if response2.data:
                print("✅ Upload with folder path successful!")
                supabase.storage.from_("videos").remove([file_name2])
                return True
                
        except Exception as e:
            print(f"❌ Folder path upload error: {str(e)}")
        
        return False
        
    except Exception as e:
        print(f"💥 Error: {str(e)}")
        return False

def create_storage_policy_sql():
    """Generate SQL commands to fix storage policies"""
    print("\n📝 SQL Commands to Fix Storage Policies")
    print("=" * 50)
    
    sql_commands = """
-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
DROP POLICY IF EXISTS "videos_policy" ON storage.objects;

-- Create policy to allow public uploads to videos bucket
CREATE POLICY "videos_upload_policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'videos');

-- Create policy to allow public access to videos bucket
CREATE POLICY "videos_select_policy" ON storage.objects
FOR SELECT USING (bucket_id = 'videos');

-- Create policy to allow public updates to videos bucket
CREATE POLICY "videos_update_policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'videos');

-- Create policy to allow public deletes from videos bucket
CREATE POLICY "videos_delete_policy" ON storage.objects
FOR DELETE USING (bucket_id = 'videos');

-- Ensure the videos bucket exists and is public
INSERT INTO storage.buckets (id, name, public) 
VALUES ('videos', 'videos', true) 
ON CONFLICT (id) DO UPDATE SET public = true;
"""
    
    print("Copy and run these SQL commands in your Supabase SQL Editor:")
    print(sql_commands)
    
    return sql_commands

if __name__ == "__main__":
    print("🚀 Supabase Storage Policy Fixer")
    print("=" * 50)
    
    # Try to fix programmatically
    success = fix_storage_policies()
    
    if not success:
        print("\n⚠️  Programmatic fix failed. Manual SQL approach needed.")
        create_storage_policy_sql()
        print("\n📋 Instructions:")
        print("1. Go to your Supabase Dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Run the SQL commands above")
        print("4. Test upload again")
    else:
        print("\n🎉 Storage policies fixed successfully!")
    
    print("=" * 50) 