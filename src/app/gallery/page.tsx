'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

// Interface for video data from Pinecone
interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  creation_time: string;
  category: string;
  duration: string;
  thumbnail?: string;
  source?: string;
}

// Categories for filtering
const CATEGORIES = ['all', 'mathematics', 'algorithms', 'web development'];

export default function GalleryPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [videoErrors, setVideoErrors] = useState<Set<string>>(new Set());

  // Backend URL with fallback
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  
  console.log('Gallery initialized with backend URL:', backendUrl);

  // Fetch videos from API
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        console.log('🔄 Fetching videos from gallery API...');
        
        const response = await fetch('/api/gallery');
        const data = await response.json();
        
        console.log('📊 Gallery API response:', {
          success: data.success,
          total: data.total,
          source: data.source,
          videosCount: data.videos?.length || 0,
          error: data.error
        });
        
        if (data.success) {
          console.log('✅ Videos fetched successfully:', data.videos?.length || 0);
          if (data.videos?.length > 0) {
            console.log('📹 First video sample:', {
              id: data.videos[0].id,
              title: data.videos[0].title,
              video_url: data.videos[0].video_url,
              source: data.videos[0].source
            });
          }
          setVideos(data.videos || []);
          setError(null);
        } else {
          console.error('❌ API returned error:', data.error);
          setError(data.error || 'Failed to fetch videos');
        }
      } catch (err) {
        console.error('💥 Network error fetching videos:', err);
        setError('Failed to connect to API');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Test video accessibility when videos are loaded
  useEffect(() => {
    if (videos.length > 0) {
      console.log('🧪 Testing video accessibility for', videos.length, 'videos...');
      videos.forEach(video => {
        // For Supabase direct URLs, use the video_url as-is
        const testUrl = video.video_url.startsWith('http') 
          ? video.video_url 
          : `${backendUrl}${video.video_url}`;
          
        console.log(`🎬 Testing video: ${video.title}`);
        console.log(`   📍 URL: ${testUrl}`);
        console.log(`   🏷️  Source: ${video.source || 'unknown'}`);
        
        // Create a test video element to check if the video loads
        const testVideo = document.createElement('video');
        testVideo.crossOrigin = 'anonymous';
        testVideo.muted = true;
        
        testVideo.onloadeddata = () => {
          console.log(`✅ Video loads successfully: ${video.id} - ${video.title}`);
        };
        
        testVideo.onerror = (e) => {
          console.error(`❌ Video failed to load: ${video.id} - ${video.title}`, {
            error: testVideo.error,
            networkState: testVideo.networkState,
            readyState: testVideo.readyState,
            src: testVideo.src
          });
        };
        
        testVideo.src = testUrl;
      });
    }
  }, [videos, backendUrl]);

  // Filter videos based on category and search query
  const filteredVideos = videos.filter(video => {
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          video.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Unknown date';
    }
  };

  // Handle video play
  const handleVideoPlay = (videoId: string) => {
    // Pause all other videos first (but not the one that just started playing)
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      const videoElementId = video.getAttribute('data-video-id');
      if (!video.paused && videoElementId !== videoId) {
        console.log('Pausing other video:', videoElementId);
        video.pause();
      }
    });
    
    setPlayingVideo(videoId);
  };

  // Handle video pause
  const handleVideoPause = () => {
    setPlayingVideo(null);
  };

  // Handle video error with delay to avoid false positives
  const handleVideoError = (videoId: string) => {
    // Wait a bit before marking as error to avoid false positives
    setTimeout(() => {
      const videoElement = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLVideoElement;
      if (videoElement && videoElement.error) {
        console.log(`Marking video ${videoId} as error after verification`);
        setVideoErrors(prev => new Set([...Array.from(prev), videoId]));
      } else {
        console.log(`Video ${videoId} recovered, not marking as error`);
      }
    }, 1000);
  };

  // Handle video load success
  const handleVideoLoadSuccess = (videoId: string) => {
    console.log(`Video loaded successfully: ${videoId}`);
    setVideoErrors(prev => {
      const newSet = new Set(Array.from(prev));
      newSet.delete(videoId);
      return newSet;
    });
  };

  // Function to clear all video errors and retry
  const clearVideoErrors = () => {
    console.log('Clearing all video errors and retrying...');
    setVideoErrors(new Set());
    
    // Force reload all video elements
    const allVideos = document.querySelectorAll('video[data-video-id]');
    allVideos.forEach((video) => {
      (video as HTMLVideoElement).load();
    });
  };

  // Handle video deletion
  const handleDeleteVideo = async (videoId: string) => {
    try {
      // Remove from local state immediately for better UX
      setVideos(prev => prev.filter(video => video.id !== videoId));
      
      // If the deleted video was playing, stop playback
      if (playingVideo === videoId) {
        setPlayingVideo(null);
      }
      
      // Remove from error state if present
      setVideoErrors(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.delete(videoId);
        return newSet;
      });

      // Optional: Call backend API to delete the video
      // Note: Uncomment this if you want to actually delete from backend/Pinecone
      /*
      const response = await fetch(`/api/videos/${videoId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        console.error('Failed to delete video from backend');
        // You might want to add the video back to the list here
      }
      */
      
      console.log(`Video ${videoId} deleted successfully`);
    } catch (error) {
      console.error('Error deleting video:', error);
      // You might want to show an error message to the user here
    }
  };

  // Helper function to play specific video
  const playVideo = (videoId: string) => {
    console.log('🎬 Attempting to play video:', videoId);
    
    // First pause all other videos
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach((video) => {
      if (!video.paused) {
        console.log('⏸️ Pausing other video:', video.getAttribute('data-video-id'));
        video.pause();
      }
    });

    // Then play the target video
    const targetVideo = document.querySelector(`[data-video-id="${videoId}"]`) as HTMLVideoElement;
    if (targetVideo) {
      console.log('📊 Found target video element:', {
        currentSrc: targetVideo.src,
        readyState: targetVideo.readyState,
        networkState: targetVideo.networkState,
        error: targetVideo.error,
        paused: targetVideo.paused
      });
      
      // Reset video if needed
      if (targetVideo.error) {
        console.warn('⚠️ Video had error, reloading:', targetVideo.error);
        targetVideo.load();
      }
      
      // Ensure video is muted for autoplay compatibility
      targetVideo.muted = true;
      
      targetVideo.play()
        .then(() => {
          console.log('✅ Video playing successfully:', videoId);
          console.log('📊 Video element state after play:', {
            paused: targetVideo.paused,
            currentTime: targetVideo.currentTime,
            duration: targetVideo.duration,
            videoWidth: targetVideo.videoWidth,
            videoHeight: targetVideo.videoHeight,
            controls: targetVideo.controls
          });
          handleVideoPlay(videoId);
        })
        .catch((error) => {
          console.error('❌ Error playing video:', videoId, error);
          
          // Try loading the video first if it failed
          if (targetVideo.readyState === 0) {
            console.log('🔄 Video not loaded, attempting to load first...');
            targetVideo.load();
            
            targetVideo.addEventListener('loadeddata', () => {
              console.log('🔄 Video loaded, retrying play...');
              targetVideo.muted = true;
              targetVideo.play()
                .then(() => {
                  console.log('✅ Video playing after reload:', videoId);
                  handleVideoPlay(videoId);
                })
                .catch((retryError) => {
                  console.error('❌ Video still failed after reload:', retryError);
                  handleVideoError(videoId);
                });
            }, { once: true });
          } else {
            handleVideoError(videoId);
          }
        });
    } else {
      console.error('❌ Could not find video element for ID:', videoId);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Video Gallery</h1>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <span className="ml-4 text-gray-600">Loading videos...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shine {
          animation: shine 0.8s ease-in-out;
        }
      `}</style>
      
      <div className="container mx-auto px-4 py-8">
        {/* Header with title and editor button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-center md:text-left mb-4 md:mb-0">Video Gallery</h1>
          
          {/* Cool Editor Button */}
          <Link 
            href="/editor"
            className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-4 focus:ring-purple-300"
          >
            {/* Gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl opacity-100 group-hover:opacity-90 transition-opacity duration-300"></div>
            
            {/* Animated border */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
            
            {/* Button content */}
            <div className="relative flex items-center gap-3">
              {/* Video editor icon */}
              <svg 
                className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" 
                />
              </svg>
              
              <span className="relative">
                Video Editor
                {/* Underline animation */}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-white transition-all duration-300 group-hover:w-full"></span>
              </span>
              
              {/* Arrow icon */}
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M13 7l5 5m0 0l-5 5m5-5H6" 
                />
              </svg>
            </div>
            
            {/* Shine effect */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 group-hover:animate-shine"></div>
          </Link>
        </div>
        
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {error}. Showing {videos.length} videos from cache.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row justify-between mb-8 gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search videos..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-4">
            {videoErrors.size > 0 && (
              <button
                onClick={clearVideoErrors}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry Failed Videos ({videoErrors.size})
              </button>
            )}
            
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {CATEGORIES.map(category => (
                <button
                  key={category}
                  className={`px-4 py-2 rounded-md whitespace-nowrap ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map(video => (
            <div key={video.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
              <div className="aspect-video bg-gray-200 relative flex-shrink-0">
                {/* Video preview */}
                <video 
                  className="w-full h-full object-cover cursor-pointer bg-black"
                  preload="metadata"
                  controls={playingVideo === video.id}
                  data-video-id={video.id}
                  crossOrigin="anonymous"
                  muted={true}
                  playsInline
                  src={video.video_url.startsWith('http') ? video.video_url : `${backendUrl}${video.video_url}`}
                  style={{ minHeight: '200px' }}
                  onPlay={() => handleVideoPlay(video.id)}
                  onPause={handleVideoPause}
                  onEnded={handleVideoPause}
                  onLoadedData={() => {
                    console.log('✅ Video loaded successfully:', video.id);
                    console.log('📊 Video element details:', {
                      id: video.id,
                      src: (document.querySelector(`[data-video-id="${video.id}"]`) as HTMLVideoElement)?.src,
                      readyState: (document.querySelector(`[data-video-id="${video.id}"]`) as HTMLVideoElement)?.readyState,
                      videoWidth: (document.querySelector(`[data-video-id="${video.id}"]`) as HTMLVideoElement)?.videoWidth,
                      videoHeight: (document.querySelector(`[data-video-id="${video.id}"]`) as HTMLVideoElement)?.videoHeight,
                    });
                    handleVideoLoadSuccess(video.id);
                  }}
                  onCanPlay={() => {
                    console.log('✅ Video can play:', video.id);
                    handleVideoLoadSuccess(video.id);
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLVideoElement;
                    console.error('❌ Video error for', video.id, ':', {
                      error: target.error,
                      networkState: target.networkState,
                      readyState: target.readyState,
                      src: target.src
                    });
                    handleVideoError(video.id);
                  }}
                  onClick={(e) => {
                    const videoElement = e.target as HTMLVideoElement;
                    if (videoElement.paused) {
                      playVideo(video.id);
                    } else {
                      videoElement.pause();
                      handleVideoPause();
                    }
                  }}
                >
                  Your browser does not support the video tag.
                </video>
                
                {/* Error overlay for failed videos */}
                {videoErrors.has(video.id) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-75">
                    <div className="text-center text-white">
                      <svg className="mx-auto h-12 w-12 text-red-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-sm">Video unavailable</p>
                    </div>
                  </div>
                )}
                
                {/* Video playing indicator */}
                {playingVideo === video.id && (
                  <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                    PLAYING
                  </div>
                )}
                
                {/* Play button overlay - hide when video is playing or has error */}
                {playingVideo !== video.id && !videoErrors.has(video.id) && (
                  <div 
                    className="absolute inset-0 flex items-center justify-center cursor-pointer"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation(); // Prevent event bubbling
                      playVideo(video.id);
                    }}
                  >
                    <div className="w-16 h-16 bg-indigo-600 bg-opacity-80 rounded-full flex items-center justify-center hover:bg-opacity-100 transition-all transform hover:scale-110">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-4 flex flex-col h-full">
                {/* Title section - always 2 lines */}
                <div className="mb-3">
                  <h3 className="text-lg font-semibold line-clamp-2 min-h-[3.5rem] leading-7">{video.title}</h3>
                </div>
                
                {/* Description section - if different from title */}
                {video.description && video.description.toLowerCase() !== video.title.toLowerCase() && (
                  <div className="mb-3">
                    <p className="text-gray-600 text-sm line-clamp-2">{video.description}</p>
                  </div>
                )}
                
                {/* Spacer to push bottom content down */}
                <div className="flex-grow"></div>
                
                {/* Bottom section - always at same level */}
                <div className="flex justify-between items-end mt-auto">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-700">
                      {video.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(video.creation_time)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent event bubbling
                        if (playingVideo === video.id) {
                          const videoElement = document.querySelector(`[data-video-id="${video.id}"]`) as HTMLVideoElement;
                          if (videoElement) {
                            videoElement.pause();
                            handleVideoPause();
                          }
                        } else {
                          playVideo(video.id);
                        }
                      }}
                      className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
                    >
                      {playingVideo === video.id ? 'Pause' : 'Play'}
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation(); // Prevent event bubbling
                        if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                          handleDeleteVideo(video.id);
                        }
                      }}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 flex items-center gap-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Empty state */}
        {filteredVideos.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No videos found</h3>
            <p className="text-gray-500 mb-4">
              {videos.length === 0 
                ? "No videos have been generated yet. Create your first video!"
                : "No videos match your search criteria."
              }
            </p>
            {filteredVideos.length === 0 && videos.length > 0 && (
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </button>
            )}
            {videos.length === 0 && (
              <Link 
                href="/"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Create First Video
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
} 