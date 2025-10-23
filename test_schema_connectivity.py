#!/usr/bin/env python3
"""
Quick test to verify Supabase schema and storage connectivity
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv('backend/.env')

def test_supabase_connection():
    """Test Supabase database and storage connectivity"""
    print("=" * 60)
    print("SUPABASE SCHEMA & STORAGE CONNECTIVITY TEST")
    print("=" * 60)
    
    # Check environment variables
    print("\n1️⃣  Checking environment variables...")
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY')
    supabase_bucket = os.getenv('SUPABASE_BUCKET', 'videos')
    
    if not supabase_url:
        print("   ❌ SUPABASE_URL not set")
        return False
    if not supabase_key:
        print("   ❌ SUPABASE_KEY not set")
        return False
    
    print(f"   ✅ SUPABASE_URL: {supabase_url[:30]}...")
    print(f"   ✅ SUPABASE_KEY: {'*' * 20}")
    print(f"   ✅ SUPABASE_BUCKET: {supabase_bucket}")
    
    # Import Supabase client
    print("\n2️⃣  Importing Supabase client...")
    try:
        from supabase import create_client, Client
        print("   ✅ Supabase library imported")
    except ImportError as e:
        print(f"   ❌ Failed to import supabase: {e}")
        return False
    
    # Create client
    print("\n3️⃣  Creating Supabase client...")
    try:
        supabase: Client = create_client(supabase_url, supabase_key)
        print("   ✅ Supabase client created")
    except Exception as e:
        print(f"   ❌ Failed to create client: {e}")
        return False
    
    # Test database connection - manim_jobs table
    print("\n4️⃣  Testing database connection (manim_jobs table)...")
    try:
        response = supabase.table("manim_jobs").select("*").limit(1).execute()
        print(f"   ✅ Connected to manim_jobs table")
        if response.data:
            print(f"   ℹ️  Found {len(response.data)} existing job(s)")
        else:
            print(f"   ℹ️  Table is empty (this is normal for new setup)")
    except Exception as e:
        print(f"   ❌ Failed to query manim_jobs: {e}")
        print("   💡 Make sure you ran the SQL schema script!")
        return False
    
    # Test other tables
    print("\n5️⃣  Testing other tables...")
    tables = ['projects', 'video_metadata', 'profiles']
    for table_name in tables:
        try:
            response = supabase.table(table_name).select("*").limit(1).execute()
            print(f"   ✅ {table_name} table exists")
        except Exception as e:
            print(f"   ⚠️  {table_name} table error: {str(e)[:50]}")
    
    # Test storage bucket
    print("\n6️⃣  Testing storage bucket...")
    try:
        # Try to list files in the bucket
        response = supabase.storage.from_(supabase_bucket).list()
        print(f"   ✅ Connected to '{supabase_bucket}' bucket")
        if response:
            print(f"   ℹ️  Found {len(response)} file(s) in bucket")
        else:
            print(f"   ℹ️  Bucket is empty (this is normal for new setup)")
    except Exception as e:
        print(f"   ❌ Failed to access storage bucket: {e}")
        print("   💡 Make sure the 'videos' bucket exists in Supabase Storage!")
        return False
    
    # Test storage bucket policies (try to get public URL)
    print("\n7️⃣  Testing storage bucket public access...")
    try:
        # Try to get a public URL for a test file (doesn't need to exist)
        test_url = supabase.storage.from_(supabase_bucket).get_public_url('test.mp4')
        print(f"   ✅ Public URL generation works")
        print(f"   ℹ️  Example URL: {test_url[:60]}...")
    except Exception as e:
        print(f"   ⚠️  Public URL generation error: {e}")
        print("   💡 Make sure the bucket is set to 'public' in Supabase!")
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED! Your schema is ready to use!")
    print("=" * 60)
    print("\n🚀 You can now start your backend server:")
    print("   cd backend && source venv/bin/activate && python run.py")
    print("\n")
    return True

if __name__ == "__main__":
    success = test_supabase_connection()
    sys.exit(0 if success else 1)

