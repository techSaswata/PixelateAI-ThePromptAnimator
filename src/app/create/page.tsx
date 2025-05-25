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

  // Backend URL with fallback
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  
  console.log('Create page initialized with backend URL:', backendUrl);

  // Helper function to get the correct video URL
  const getVideoUrl = (url: string | null) => {
    if (!url) return '';
    // If URL already starts with http, use it as-is (Supabase direct URL)
    if (url.startsWith('http')) return url;
    // Otherwise, prepend backend URL
    return `${backendUrl}${url}`;
  };

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
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-600/5 to-blue-600/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header Section */}
        <div className="text-center pt-16 pb-8">
          <div className="max-w-4xl mx-auto px-4">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Create Magic
            </h1>
            <p className="text-xl text-white/70 mb-2">
              Transform your ideas into stunning animations
            </p>
            <p className="text-white/50">
              Describe what you want to visualize and watch AI bring it to life
            </p>
          </div>
        </div>

        {/* Prompt Section - Centered */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-4xl">
            <div className="bg-[#111]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-600 to-blue-500 rounded-full flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-white mb-2">Describe Your Vision</h2>
                <p className="text-white/60">Tell us what you want to animate and we'll create it for you</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label htmlFor="prompt" className="block text-sm font-medium text-white/90 mb-3">
                    What would you like to visualize?
                  </label>
                  <textarea
                    id="prompt"
                    rows={6}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-4 bg-[#0a0a0a] border border-[#333] rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200"
                    placeholder="Example: A visualization of the Pythagorean theorem with a right triangle and squares on each side, showing how a² + b² = c²..."
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-white/40">
                      Be specific about what you want to see
                    </span>
                    <span className="text-xs text-white/40">
                      {prompt.length}/500
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <button
                    onClick={handleGenerate}
                    disabled={generating || !prompt.trim()}
                    className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3 shadow-lg"
                  >
                    {generating ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Creating Your Animation...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Generate Animation</span>
                      </>
                    )}
                  </button>
                  
                  {!generating && (
                    <button
                      onClick={() => router.push('/gallery')}
                      className="w-full sm:w-auto px-6 py-4 bg-[#222] border border-[#333] text-white/70 rounded-xl font-medium hover:bg-[#333] hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Browse Gallery
                    </button>
                  )}
                </div>

                {/* Quick Examples */}
                <div className="border-t border-[#333] pt-6">
                  <p className="text-sm text-white/60 mb-3 text-center">Need inspiration? Try these examples:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      "Explain Level Order Traversal in Binary Tree",
                      "Explain Dijkstra's Algorithm step by step",
                      "Explain bubble sort algorithm step by step",
                      "Explain traversal in linkedlist",
                      "Show merge sort using divide and conquer",
                      "Prove the Pythagorean theorem with visual demonstration",
                    ].map((example, index) => (
                      <button
                        key={index}
                        onClick={() => setPrompt(example)}
                        className="text-left p-3 bg-[#0a0a0a]/50 border border-[#333] rounded-lg text-sm text-white/70 hover:text-white hover:border-purple-500/50 transition-all duration-200"
                      >
                        "{example}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {(animation || scenes.length > 0 || clips.length > 0 || generatedCode || video) && (
          <div className="px-4 pb-16">
            <div className="max-w-7xl mx-auto">
              <div className="bg-[#111]/80 backdrop-blur-xl border border-[#222] rounded-2xl p-8 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Your Animation is Ready! 🎉</h2>
                  <p className="text-white/60">Here's what we created for you</p>
                </div>
                
                {/* Video Player Section */}
                {video && (
                  <div className="mb-8 bg-[#0a0a0a]/50 p-6 rounded-xl border border-[#333]">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🎬 <span>Rendered Video</span>
                    </h3>
                    
                    {video.available && video.url ? (
                      <div className="space-y-4">
                        <div className="bg-black rounded-xl overflow-hidden border border-[#333]">
                          <video 
                            controls 
                            className="w-full max-w-4xl mx-auto"
                            poster={video.thumbnail || undefined}
                          >
                            <source src={getVideoUrl(video.url)} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                        <div className="flex gap-3 justify-center flex-wrap">
                          {getVideoUrl(video.url) && (
                            <a
                              href={getVideoUrl(video.url)}
                              download
                              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download Video
                            </a>
                          )}
                          <button
                            onClick={() => {
                              const video = document.querySelector('video');
                              if (video) {
                                if (video.requestFullscreen) {
                                  video.requestFullscreen();
                                }
                              }
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                            </svg>
                            Fullscreen
                          </button>
                          <button
                            onClick={() => {
                              // Store the generated content for the editor
                              const projectData = {
                                prompt,
                                scenes,
                                clips: clips.map(clip => ({
                                  id: clip.id,
                                  name: clip.name,
                                  duration: clip.duration,
                                  thumbnail: clip.thumbnail,
                                  type: 'video',
                                  url: getVideoUrl(clip.video_url || null),
                                  startTime: 0,
                                  endTime: parseFloat(clip.duration) || 10
                                }))
                              };
                              sessionStorage.setItem('newProjectData', JSON.stringify(projectData));
                              router.push('/editor');
                            }}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit in Studio
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-600/20 border border-red-600/30 text-red-400 px-4 py-3 rounded-xl">
                        <p className="font-medium">Video Rendering Status:</p>
                        <p>{video.status}</p>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Animation Overview */}
                {animation && (
                  <div className="mb-8 bg-green-600/20 border border-green-600/30 p-6 rounded-xl">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      ✅ <span>Animation Status</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-white">{animation.title}</h4>
                        <p className="text-sm text-white/70 mb-2">{animation.description}</p>
                        <p className="text-sm text-white/70">Duration: {animation.duration}</p>
                        <p className="text-sm text-white/70">Quality: {animation.quality}</p>
                      </div>
                      <div>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          animation.status.includes('✅') 
                            ? 'bg-green-600/20 text-green-400 border border-green-600/30' 
                            : 'bg-red-600/20 text-red-400 border border-red-600/30'
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
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🐍 <span>Generated Manim Code</span>
                    </h3>
                    <div className="bg-[#0a0a0a] border border-[#333] rounded-xl overflow-hidden">
                      <div className="bg-[#111] px-4 py-2 border-b border-[#333] flex items-center justify-between">
                        <span className="text-sm text-white/70">animation.py</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(generatedCode)}
                            className="text-white/70 hover:text-white text-sm flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="p-4 overflow-x-auto">
                        <pre className="text-sm text-green-400 whitespace-pre-wrap">
                          <code>{generatedCode}</code>
                        </pre>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3 flex-wrap">
                      <button
                        onClick={() => navigator.clipboard.writeText(generatedCode)}
                        className="bg-[#333] hover:bg-[#444] text-white px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy Code
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
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm transition-colors flex items-center gap-2"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download .py File
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Scenes */}
                {scenes.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🎬 <span>Animation Scenes</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {scenes.map((scene) => (
                        <div key={scene.id} className="bg-blue-600/20 border border-blue-600/30 p-4 rounded-xl">
                          <h4 className="font-medium text-white">{scene.name}</h4>
                          <p className="text-sm text-white/70 mb-2">{scene.description}</p>
                          <p className="text-sm text-blue-400">Duration: {scene.duration}ms</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clips */}
                {clips.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🎥 <span>Animation Clips</span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {clips.map((clip) => (
                        <div key={clip.id} className="bg-purple-600/20 border border-purple-600/30 p-4 rounded-xl">
                          <h4 className="font-medium text-white">{clip.name}</h4>
                          <p className="text-sm text-white/70 mb-2">Duration: {clip.duration}</p>
                          {clip.code_preview && (
                            <div className="bg-[#0a0a0a] border border-[#333] p-2 rounded-lg text-xs font-mono mb-2 text-green-400">
                              {clip.code_preview}
                            </div>
                          )}
                          <div className="mt-2">
                            {clip.video_url && getVideoUrl(clip.video_url) ? (
                              <video 
                                controls 
                                className="w-full h-32 rounded-lg object-cover border border-[#333]"
                                poster={clip.thumbnail}
                              >
                                <source src={getVideoUrl(clip.video_url)} type="video/mp4" />
                              </video>
                            ) : (
                              <div className="bg-[#0a0a0a] border border-[#333] h-32 rounded-lg flex items-center justify-center">
                                <span className="text-white/50 text-sm">🎬 No Video Available</span>
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
                  <div className="bg-green-600/20 border border-green-600/30 p-6 rounded-xl">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🎉 <span>Success!</span>
                    </h3>
                    <p className="text-white/70">
                      Your animation has been generated and rendered! You can now watch it above, download the video file, 
                      edit it in our studio, or download the Python code to run locally with Manim.
                    </p>
                  </div>
                )}

                {/* Local Rendering Instructions */}
                {generatedCode && !video?.available && (
                  <div className="bg-yellow-600/20 border border-yellow-600/30 p-6 rounded-xl">
                    <h3 className="text-xl font-medium text-white mb-4 flex items-center gap-2">
                      🚀 <span>Local Rendering</span>
                    </h3>
                    <ul className="list-disc list-inside text-sm text-white/70 space-y-2">
                      <li>Copy the generated Python code and run it locally with Manim installed</li>
                      <li>Install Manim: <code className="bg-[#0a0a0a] border border-[#333] px-2 py-1 rounded text-green-400">pip install manim</code></li>
                      <li>Render animation: <code className="bg-[#0a0a0a] border border-[#333] px-2 py-1 rounded text-green-400">manim animation.py Scene -qm</code></li>
                      <li>The generated video will be saved in the media/videos directory</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 