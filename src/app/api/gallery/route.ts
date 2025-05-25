import { NextResponse } from 'next/server';
import { getVideosFromSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    console.log('Gallery API: Fetching videos directly from Supabase...');
    
    // Fetch videos directly from Supabase storage
    const videos = await getVideosFromSupabase();
    
    console.log(`Gallery API: Found ${videos.length} videos in Supabase`);

    return NextResponse.json({
      success: true,
      videos: videos,
      total: videos.length,
      source: 'supabase-direct'
    });

  } catch (error) {
    console.error('Gallery API: Error fetching videos from Supabase:', error);
    
    // Fallback: Try to fetch from backend as backup
    try {
      console.log('Gallery API: Trying backend fallback...');
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${backendUrl}/api/gallery/videos`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Gallery API: Backend fallback successful');
        return NextResponse.json({
          success: true,
          videos: data.videos || [],
          total: data.total || 0,
          source: 'backend-fallback'
        });
      }
    } catch (backendError) {
      console.error('Gallery API: Backend fallback also failed:', backendError);
    }
    
    // Return empty array with error info
    return NextResponse.json({
      success: true,
      videos: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      source: 'error'
    });
  }
} 