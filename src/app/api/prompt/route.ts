import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: Request) {
  try {
    const { prompt, quality } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5001/api/simple-generate';
    
    const response = await axios.post(pythonBackendUrl, {
      prompt,
      quality: quality || 'medium'
    });
    
    // Return the response from the Python backend with proper structure
    return NextResponse.json({
      success: true,
      data: response.data
    });
    
  } catch (error: any) {
    console.error('Error sending prompt to Python backend:', error);
    
    // More detailed error handling
    if (error.response) {
      return NextResponse.json(
        { 
          error: 'Backend processing failed',
          details: error.response.data?.error || error.message,
          status: error.response.status
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        { 
          error: 'Cannot connect to backend server',
          details: 'Make sure the Python backend is running on port 5001'
        },
        { status: 503 }
      );
    } else {
      return NextResponse.json(
        { 
          error: 'Failed to process prompt',
          details: error.message
        },
        { status: 500 }
      );
    }
  }
} 