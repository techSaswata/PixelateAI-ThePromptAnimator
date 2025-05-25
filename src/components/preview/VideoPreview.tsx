'use client';

import React, { useRef, useEffect, useState } from 'react';

interface Clip {
  id: string;
  name: string;
  duration: string;
  thumbnail: string;
  type: 'video' | 'audio';
  url?: string;
  file?: File;
  startTime?: number;
  endTime?: number;
}

interface AudioClip {
  id: string;
  name: string;
  duration: number;
  url: string;
  file?: File;
  startTime: number;
  endTime: number;
}

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: 'top' | 'center' | 'bottom';
  fontSize: number;
}

interface VideoPreviewProps {
  timelineClips?: Clip[];
  audioClips?: AudioClip[];
  isPlaying?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
  textOverlays?: TextOverlay[];
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  timelineClips = [],
  audioClips = [],
  isPlaying = false,
  currentTime = 0,
  onTimeUpdate,
  onLoadedMetadata,
  textOverlays = [],
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<Map<string, number>>(new Map());
  const animationFrameRef = useRef<number>();
  const preloadedVideos = useRef<Map<string, HTMLVideoElement>>(new Map());

  // Helper function to check if a video is preloaded and ready
  const isVideoReady = (url: string): boolean => {
    const preloadedVideo = preloadedVideos.current.get(url);
    return preloadedVideo ? preloadedVideo.readyState >= 3 : false;
  };

  // Find the active video clip at current time
  const getActiveClip = (time: number): Clip | null => {
    const activeClip = timelineClips.find(clip => 
      clip.type === 'video' && 
      (clip.startTime || 0) <= time && 
      (clip.endTime || 0) > time
    ) || null;
    
    console.log('🎬 VideoPreview: Finding active clip at time', time, {
      totalClips: timelineClips.length,
      videoClips: timelineClips.filter(c => c.type === 'video').length,
      activeClip: activeClip ? {
        id: activeClip.id,
        name: activeClip.name,
        startTime: activeClip.startTime,
        endTime: activeClip.endTime,
        url: activeClip.url
      } : null,
      allVideoClips: timelineClips.filter(c => c.type === 'video').map(c => ({
        id: c.id,
        name: c.name,
        startTime: c.startTime,
        endTime: c.endTime,
        url: c.url?.substring(0, 50) + '...'
      }))
    });
    
    return activeClip;
  };

  // Update current clip based on timeline position
  useEffect(() => {
    const activeClip = getActiveClip(currentTime);
    if (activeClip?.id !== currentClip?.id) {
      console.log('🔄 VideoPreview: Current clip changing:', {
        from: currentClip ? {
          id: currentClip.id,
          name: currentClip.name,
          url: currentClip.url?.substring(0, 50) + '...'
        } : null,
        to: activeClip ? {
          id: activeClip.id,
          name: activeClip.name,
          url: activeClip.url?.substring(0, 50) + '...'
        } : null,
        currentTime,
        timelineClipsCount: timelineClips.length
      });
      setCurrentClip(activeClip);
    }
  }, [currentTime, timelineClips, currentClip]);

  // Handle video playback
  useEffect(() => {
    if (!videoRef.current || !currentClip) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      return;
    }

    const video = videoRef.current;
    
    console.log('VideoPreview: Setting up video playback for clip:', {
      clipId: currentClip.id,
      clipName: currentClip.name,
      clipUrl: currentClip.url,
      currentVideoSrc: video.src,
      urlStartsWithHttp: currentClip.url?.startsWith('http'),
      urlLength: currentClip.url?.length
    });
    
    if (currentClip.url && video.src !== currentClip.url) {
      console.log('VideoPreview: Changing video source from', video.src, 'to', currentClip.url);
      
      // Check if we have a preloaded version of this video
      const preloadedVideo = preloadedVideos.current.get(currentClip.url);
      
      if (preloadedVideo && preloadedVideo.readyState >= 3) { // HAVE_FUTURE_DATA or better
        console.log('✅ VideoPreview: Using preloaded video for instant switch:', currentClip.name);
        
        // Copy the preloaded video source to main video element
        video.src = currentClip.url;
        
        // Set the correct time within the clip immediately
        const clipStartTime = currentClip.startTime || 0;
        const timeInClip = Math.max(0, currentTime - clipStartTime);
        video.currentTime = timeInClip;
        
        // No loading state needed - instant switch
        setHasError(false);
        setIsLoading(false);
        
        // Resume playing if we should be playing
        if (isPlaying && timeInClip < (currentClip.endTime || 0) - clipStartTime) {
          video.play().catch(error => {
            console.error('VideoPreview: Error playing preloaded video:', error);
          });
        }
      } else {
        console.log('⏳ VideoPreview: No preloaded video available, loading normally:', currentClip.name);
        
        // Set loading state for non-preloaded videos
        setIsLoading(true);
        setHasError(false);
        
        // Pause current video but don't reset time yet
        video.pause();
        
        // Set new source without calling load() immediately
        video.src = currentClip.url;
        
        // Use a more gentle loading approach
        const handleCanPlay = () => {
          console.log('✅ VideoPreview: Video ready to play:', currentClip.url);
          setHasError(false);
          setIsLoading(false);
          
          // Now set the correct time within the clip
          const clipStartTime = currentClip.startTime || 0;
          const timeInClip = Math.max(0, currentTime - clipStartTime);
          
          if (Math.abs(video.currentTime - timeInClip) > 0.1) {
            video.currentTime = timeInClip;
          }
          
          // Resume playing if we should be playing
          if (isPlaying && timeInClip < (currentClip.endTime || 0) - clipStartTime) {
            video.play().catch(error => {
              console.error('VideoPreview: Error playing video:', error);
            });
          }
        };
        
        const handleError = (e: Event) => {
          console.error('❌ VideoPreview: Video error during load:', {
            error: e,
            src: video.src,
            networkState: video.networkState,
            readyState: video.readyState
          });
          setHasError(true);
          setIsLoading(false);
        };
        
        // Add event listeners
        video.addEventListener('canplay', handleCanPlay, { once: true });
        video.addEventListener('error', handleError, { once: true });
        
        // Load the video
        video.load();
        
        // Cleanup function to remove listeners if component unmounts
        return () => {
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('error', handleError);
        };
      }
    } else {
      // Same video source, just update time and play state
      const clipStartTime = currentClip.startTime || 0;
      const timeInClip = Math.max(0, currentTime - clipStartTime);
      
      // Set video time to match timeline position
      if (Math.abs(video.currentTime - timeInClip) > 0.1) {
        console.log('VideoPreview: Seeking video to time:', timeInClip);
        video.currentTime = timeInClip;
      }

      if (isPlaying && timeInClip < (currentClip.endTime || 0) - clipStartTime) {
        console.log('VideoPreview: Playing video at time:', timeInClip);
        video.play().catch(error => {
          console.error('VideoPreview: Error playing video:', error);
        });
      } else {
        console.log('VideoPreview: Pausing video');
        video.pause();
      }
    }
  }, [currentClip, isPlaying, currentTime]);

  // Handle audio playback
  useEffect(() => {
    audioRefs.current.forEach((audio, index) => {
      if (!audio || !audioClips[index]) return;

      const audioClip = audioClips[index];
      const isActive = audioClip.startTime <= currentTime && audioClip.endTime > currentTime;
      
      if (isActive && isPlaying) {
        const timeInClip = currentTime - audioClip.startTime;
        if (Math.abs(audio.currentTime - timeInClip) > 0.1) {
          audio.currentTime = timeInClip;
        }
        audio.play().catch(console.error);
      } else {
        audio.pause();
      }
    });
  }, [audioClips, isPlaying, currentTime]);

  // Time update loop
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const updateTime = () => {
      if (onTimeUpdate && isPlaying) {
        // Find the actual end time of content (last clip's end)
        const lastVideoClip = timelineClips
          .filter(clip => clip.type === 'video')
          .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
        const lastAudioClip = audioClips
          .sort((a, b) => b.endTime - a.endTime)[0];
        
        const contentEndTime = Math.max(
          lastVideoClip?.endTime || 0,
          lastAudioClip?.endTime || 0
        );

        if (currentClip && videoRef.current) {
          const video = videoRef.current;
          const clipStartTime = currentClip.startTime || 0;
          const clipEndTime = currentClip.endTime || 0;
          const newTime = clipStartTime + video.currentTime;
          
          // If we're within the current clip bounds, update normally
          if (newTime < clipEndTime) {
            onTimeUpdate(newTime);
          } else {
            // Clip has ended, check if there's another clip after this one
            const nextClip = timelineClips
              .filter(clip => clip.type === 'video' && (clip.startTime || 0) > clipEndTime)
              .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))[0];
            
            if (nextClip) {
              // Move to the start of the next clip
              console.log('🎬 VideoPreview: Moving to next clip at', nextClip.startTime);
              onTimeUpdate(nextClip.startTime || 0);
            } else {
              // No more clips, stop playback at the end of this clip
              console.log('🛑 VideoPreview: Reached end of content, stopping playback');
              onTimeUpdate(clipEndTime);
              // Stop playing by not requesting another animation frame
              return;
            }
          }
        } else {
          // No current clip but timeline is playing
          // Check if we're beyond the content end time
          if (currentTime >= contentEndTime && contentEndTime > 0) {
            // Stop at the end instead of looping
            console.log('🛑 VideoPreview: Timeline reached end, stopping playback');
            onTimeUpdate(contentEndTime);
            return;
          } else {
            // Check if there's a next clip to jump to
            const nextClip = timelineClips
              .filter(clip => clip.type === 'video' && (clip.startTime || 0) > currentTime)
              .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))[0];
            
            if (nextClip) {
              // Jump to the next clip
              console.log('🎬 VideoPreview: Jumping to next clip at', nextClip.startTime);
              onTimeUpdate(nextClip.startTime || 0);
            } else if (contentEndTime > 0) {
              // No more clips and we have content, stop at the end
              console.log('🛑 VideoPreview: No more clips, stopping at end');
              onTimeUpdate(contentEndTime);
              return;
            } else {
              // No clips at all, advance normally but with a reasonable limit
              const nextTime = currentTime + 0.016; // ~60fps
              if (nextTime >= 30) { // 30 second limit when no clips
                console.log('🛑 VideoPreview: Reached 30s limit, stopping');
                onTimeUpdate(30);
                return;
              } else {
                onTimeUpdate(nextTime);
              }
            }
          }
        }
        
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, currentClip, onTimeUpdate, currentTime, timelineClips, audioClips]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current && onLoadedMetadata) {
      // Calculate total timeline duration
      const totalDuration = Math.max(
        ...timelineClips.map(clip => clip.endTime || 0),
        ...audioClips.map(clip => clip.endTime)
      );
      onLoadedMetadata(totalDuration);
    }
  };

  // Handle video end - advance to next clip or stop
  const handleVideoEnded = () => {
    if (currentClip && onTimeUpdate) {
      const clipEndTime = currentClip.endTime || 0;
      
      // Find the next video clip after this one
      const nextClip = timelineClips
        .filter(clip => clip.type === 'video' && (clip.startTime || 0) > clipEndTime)
        .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))[0];
      
      if (nextClip) {
        // Move to the start of the next clip
        console.log('🎬 VideoPreview: Video ended, moving to next clip at', nextClip.startTime);
        onTimeUpdate(nextClip.startTime || 0);
      } else {
        // No more clips, stop at the end of this clip
        console.log('🛑 VideoPreview: Video ended, no more clips, stopping at', clipEndTime);
        onTimeUpdate(clipEndTime);
      }
    }
  };

  // Preload all timeline videos immediately when they are added
  useEffect(() => {
    console.log('🔄 VideoPreview: Timeline clips changed, preloading all videos...');
    
    timelineClips
      .filter(clip => clip.type === 'video' && clip.url)
      .forEach(clip => {
        if (!preloadedVideos.current.has(clip.url!)) {
          console.log('🔄 VideoPreview: Preloading timeline clip:', clip.name);
          
          const preloadVideo = document.createElement('video');
          preloadVideo.src = clip.url!;
          preloadVideo.preload = 'auto'; // Load the entire video
          preloadVideo.muted = true;
          preloadVideo.playsInline = true;
          
          preloadVideo.addEventListener('canplaythrough', () => {
            console.log('✅ VideoPreview: Timeline clip fully loaded:', clip.name);
            preloadedVideos.current.set(clip.url!, preloadVideo);
            setLoadingProgress(prev => {
              const newProgress = new Map(prev);
              newProgress.set(clip.url!, 100);
              return newProgress;
            });
          }, { once: true });
          
          preloadVideo.addEventListener('progress', () => {
            if (preloadVideo.buffered.length > 0) {
              const bufferedEnd = preloadVideo.buffered.end(preloadVideo.buffered.length - 1);
              const duration = preloadVideo.duration;
              if (duration > 0) {
                const progress = Math.round((bufferedEnd / duration) * 100);
                setLoadingProgress(prev => {
                  const newProgress = new Map(prev);
                  newProgress.set(clip.url!, progress);
                  return newProgress;
                });
              }
            }
          });
          
          preloadVideo.addEventListener('error', (e) => {
            console.log('❌ VideoPreview: Failed to preload timeline clip:', clip.name, e);
            setLoadingProgress(prev => {
              const newProgress = new Map(prev);
              newProgress.delete(clip.url!);
              return newProgress;
            });
          }, { once: true });
          
          // Start loading immediately
          preloadVideo.load();
        }
      });
    
    // Clean up videos that are no longer in the timeline
    const currentUrls = new Set(timelineClips.filter(c => c.type === 'video' && c.url).map(c => c.url!));
    preloadedVideos.current.forEach((video, url) => {
      if (!currentUrls.has(url)) {
        console.log('🗑️ VideoPreview: Cleaning up removed clip:', url.substring(0, 50) + '...');
        video.src = '';
        video.load();
        preloadedVideos.current.delete(url);
      }
    });
  }, [timelineClips]);

  // Cleanup preloaded videos on unmount
  useEffect(() => {
    return () => {
      preloadedVideos.current.forEach((video, url) => {
        video.src = '';
        video.load();
      });
      preloadedVideos.current.clear();
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#0a0a0a] rounded-lg overflow-hidden flex items-center justify-center relative">
      {currentClip && currentClip.url ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            className={`w-full h-full object-contain transition-opacity duration-300 ${
              isLoading ? 'opacity-50' : 'opacity-100'
            }`}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleVideoEnded}
            onError={(e) => {
              const target = e.target as HTMLVideoElement;
              console.error('❌ VideoPreview: Video element error:', {
                error: e,
                errorCode: target.error?.code,
                errorMessage: target.error?.message,
                networkState: target.networkState,
                readyState: target.readyState,
                currentSrc: target.currentSrc,
                clipUrl: currentClip?.url,
                clipId: currentClip?.id,
                clipName: currentClip?.name
              });
              setHasError(true);
              setIsLoading(false);
            }}
            onLoadStart={() => {
              console.log('🔄 VideoPreview: Video load started:', {
                url: currentClip?.url,
                clipId: currentClip?.id,
                clipName: currentClip?.name
              });
              setHasError(false);
            }}
            onCanPlay={() => {
              console.log('✅ VideoPreview: Video can play:', {
                url: currentClip?.url,
                clipId: currentClip?.id,
                duration: videoRef.current?.duration
              });
              setHasError(false);
            }}
            onLoadedData={() => {
              console.log('📊 VideoPreview: Video data loaded:', {
                url: currentClip?.url,
                clipId: currentClip?.id,
                videoWidth: videoRef.current?.videoWidth,
                videoHeight: videoRef.current?.videoHeight
              });
            }}
            playsInline
            muted={true}
            preload="metadata"
            controls={false}
            autoPlay={false}
          />
          
          {/* Render active text overlays */}
          {textOverlays.filter(overlay => overlay.startTime <= currentTime && overlay.endTime > currentTime).map(overlay => (
            <div
              key={overlay.id}
              className="absolute w-full flex justify-center pointer-events-none select-none"
              style={{
                top: overlay.position === 'top' ? '10%' : overlay.position === 'center' ? '45%' : '80%',
                left: 0,
                fontSize: overlay.fontSize,
                color: 'white',
                textShadow: '0 2px 8px #000, 0 0 2px #000',
                fontWeight: 600,
                textAlign: 'center',
                zIndex: 20,
              }}
            >
              <span style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: '0.2em 0.8em' }}>{overlay.text}</span>
            </div>
          ))}
          
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
              <div className="text-center text-white/70">
                <div className="w-8 h-8 border-2 border-white/30 border-t-white/70 rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm">Loading...</p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-white/50">
          <div className="w-24 h-24 mx-auto mb-4 bg-[#222] rounded-full flex items-center justify-center border border-[#333]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-white/70 mb-2">No Video Playing</h3>
          <p className="text-sm text-white/40">
            {timelineClips.length === 0 
              ? "Drag videos or generate animations to start"
              : "Playhead is not over any video content"
            }
          </p>
        </div>
      )}

      {/* Audio elements */}
      {audioClips.map((audioClip, index) => (
        <audio
          key={audioClip.id}
          ref={el => {
            if (el) audioRefs.current[index] = el;
          }}
          src={audioClip.url}
          preload="metadata"
        />
      ))}

      {/* Error overlay */}
      {hasError && (
        <div className="absolute inset-0 bg-red-900/20 flex items-center justify-center">
          <div className="text-center text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">Error loading video</p>
          </div>
        </div>
      )}

      {/* Video info overlay */}
      {currentClip && (
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white">
          <div className="text-sm font-medium flex items-center gap-2">
            {currentClip.name}
            {currentClip.url && isVideoReady(currentClip.url) && (
              <span className="text-green-400 text-xs">●</span>
            )}
            {currentClip.url && !isVideoReady(currentClip.url) && loadingProgress.get(currentClip.url) !== undefined && (
              <span className="text-yellow-400 text-xs">
                {loadingProgress.get(currentClip.url)}%
              </span>
            )}
          </div>
          <div className="text-xs text-white/70">
            Playing: {Math.floor((currentTime - (currentClip.startTime || 0)))}s / {Math.floor(((currentClip.endTime || 0) - (currentClip.startTime || 0)))}s
          </div>
        </div>
      )}
    </div>
  );
}; 