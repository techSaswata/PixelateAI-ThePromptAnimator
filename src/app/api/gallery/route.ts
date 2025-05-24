import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch videos from the backend Pinecone API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${backendUrl}/api/gallery/videos`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to ensure fresh data
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`Backend API responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch videos from backend');
    }

    return NextResponse.json({
      success: true,
      videos: data.videos || [],
      total: data.total || 0
    });

  } catch (error) {
    console.error('Error fetching gallery videos:', error);
    
    // Return empty array instead of error to gracefully handle failures
    return NextResponse.json({
      success: true,
      videos: [],
      total: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 