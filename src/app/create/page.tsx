'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';

interface Scene {
  id: string;
  name: string;
  duration: number;
  description?: string;
}

interface Clip {
  id: string;
  name: string;
  duration: string;
  video_url?: string;
  thumbnail: string;
  code_preview?: string;
}

interface Animation {
  title: string;
  description: string;
  duration: string;
  quality: string;
  status: string;
}

interface Video {
  url: string | null;
  status: string;
  available: boolean;
  thumbnail?: string | null;
}

export default function CreatePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [clips, setClips] = useState<Clip[]>([]);
  const [animation, setAnimation] = useState<Animation | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          quality: 'medium'
        }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.data) {
        setScenes(data.data.scenes || []);
        setClips(data.data.clips || []);
        setAnimation(data.data.animation || null);
        setVideo(data.data.video || null);
        setGeneratedCode(data.data.code || '');
      } else {
        setError(data.error || 'Failed to generate animation');
      }
    } catch (err: any) {
      setError('Error connecting to backend: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-indigo-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#111] border border-[#222] rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-8">
            <h1 className="text-3xl font-bold text-white mb-8">Create New Animation</h1>
            
            <div className="mb-8">
              <label htmlFor="prompt" className="block text-sm font-medium text-white/90 mb-2">
                Describe what you want to visualize
              </label>
              <textarea
                id="prompt"
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Example: A visualization of the Pythagorean theorem with a right triangle and squares on each side..."
              />
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-6 py-3 rounded-md font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating Animation & Video...
                </>
              ) : (
                'Generate Animation'
              )}
            </button>
          </div>

          {/* Results Section */}
          {(animation || scenes.length > 0 || clips.length > 0 || generatedCode || video) && (
            <div className="border-t border-gray-200 px-6 py-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Generated Content</h2>
              
              {/* Video Player Section */}
              {video && (
                <div className="mb-8 bg-gray-900 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-white mb-4">🎬 Rendered Video</h3>
                  
                  {video.available && video.url ? (
                    <div className="space-y-4">
                      <div className="bg-black rounded-lg overflow-hidden">
                        <video 
                          controls 
                          className="w-full max-w-2xl mx-auto"
                          poster={video.thumbnail || undefined}
                        >
                          <source src={`http://localhost:5001${video.url}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      </div>
                      <div className="flex gap-2 justify-center">
                        <a
                          href={`http://localhost:5001${video.url}`}
                          download
                          className="bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
                        >
                          📥 Download Video
                        </a>
                        <button
                          onClick={() => {
                            const video = document.querySelector('video');
                            if (video) {
                              if (video.requestFullscreen) {
                                video.requestFullscreen();
                              }
                            }
                          }}
                          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                        >
                          🔍 Fullscreen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                      <p className="font-medium">Video Rendering Status:</p>
                      <p>{video.status}</p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Animation Overview */}
              {animation && (
                <div className="mb-8 bg-green-50 p-6 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">✅ Animation Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{animation.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{animation.description}</p>
                      <p className="text-sm text-gray-600">Duration: {animation.duration}</p>
                      <p className="text-sm text-gray-600">Quality: {animation.quality}</p>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        animation.status.includes('✅') 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {animation.status}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Generated Code */}
              {generatedCode && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🐍 Generated Manim Code</h3>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm whitespace-pre-wrap">
                      <code>{generatedCode}</code>
                    </pre>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedCode)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700"
                    >
                      📋 Copy Code
                    </button>
                    <button
                      onClick={() => {
                        const blob = new Blob([generatedCode], { type: 'text/python' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'animation.py';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700"
                    >
                      💾 Download .py File
                    </button>
                  </div>
                </div>
              )}
              
              {/* Scenes */}
              {scenes.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎬 Animation Scenes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scenes.map((scene) => (
                      <div key={scene.id} className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <h4 className="font-medium text-gray-900">{scene.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{scene.description}</p>
                        <p className="text-sm text-blue-600">Duration: {scene.duration}ms</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clips */}
              {clips.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎥 Animation Clips</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clips.map((clip) => (
                      <div key={clip.id} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <h4 className="font-medium text-gray-900">{clip.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">Duration: {clip.duration}</p>
                        {clip.code_preview && (
                          <div className="bg-gray-800 text-green-400 p-2 rounded text-xs font-mono mb-2">
                            {clip.code_preview}
                          </div>
                        )}
                        <div className="mt-2">
                          {clip.video_url ? (
                            <video 
                              controls 
                              className="w-full h-32 rounded-md object-cover"
                              poster={clip.thumbnail}
                            >
                              <source src={`http://localhost:5001${clip.video_url}`} type="video/mp4" />
                            </video>
                          ) : (
                            <div className="bg-gray-200 h-32 rounded-md flex items-center justify-center">
                              <span className="text-gray-500 text-sm">🎬 No Video Available</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Success Message */}
              {video?.available && (
                <div className="mt-8 bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🎉 Success!</h3>
                  <p className="text-sm text-gray-700">
                    Your animation has been generated and rendered! You can now watch it above, download the video file, 
                    or download the Python code to run locally with Manim.
                  </p>
                </div>
              )}

              {/* Local Rendering Instructions */}
              {generatedCode && !video?.available && (
                <div className="mt-8 bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">🚀 Local Rendering</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700 space-y-2">
                    <li>Copy the generated Python code and run it locally with Manim installed</li>
                    <li>Install Manim: <code className="bg-gray-200 px-2 py-1 rounded">pip install manim</code></li>
                    <li>Render animation: <code className="bg-gray-200 px-2 py-1 rounded">manim animation.py Scene -qm</code></li>
                    <li>The generated video will be saved in the media/videos directory</li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 