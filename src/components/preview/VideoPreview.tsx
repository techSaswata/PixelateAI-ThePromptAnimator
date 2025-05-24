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

interface VideoPreviewProps {
  timelineClips?: Clip[];
  audioClips?: AudioClip[];
  isPlaying?: boolean;
  currentTime?: number;
  onTimeUpdate?: (time: number) => void;
  onLoadedMetadata?: (duration: number) => void;
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  timelineClips = [],
  audioClips = [],
  isPlaying = false,
  currentTime = 0,
  onTimeUpdate,
  onLoadedMetadata
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<HTMLAudioElement[]>([]);
  const [currentClip, setCurrentClip] = useState<Clip | null>(null);
  const [hasError, setHasError] = useState(false);
  const animationFrameRef = useRef<number>();

  // Find the active video clip at current time
  const getActiveClip = (time: number): Clip | null => {
    return timelineClips.find(clip => 
      clip.type === 'video' && 
      (clip.startTime || 0) <= time && 
      (clip.endTime || 0) > time
    ) || null;
  };

  // Update current clip based on timeline position
  useEffect(() => {
    const activeClip = getActiveClip(currentTime);
    if (activeClip?.id !== currentClip?.id) {
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
      currentVideoSrc: video.src
    });
    
    if (currentClip.url && video.src !== currentClip.url) {
      console.log('VideoPreview: Changing video source from', video.src, 'to', currentClip.url);
      
      // Reset video state before changing source
      video.pause();
      video.currentTime = 0;
      
      // Set new source and load
      video.src = currentClip.url;
      video.load();
      
      // Wait for video to be ready before proceeding
      video.addEventListener('canplay', () => {
        console.log('VideoPreview: Video ready to play:', currentClip.url);
      }, { once: true });
    }

    // Calculate the time within the clip
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
              onTimeUpdate(nextClip.startTime || 0);
            } else {
              // No more clips, we've reached the end of content - loop back to beginning
              onTimeUpdate(0);
            }
          }
        } else {
          // No current clip but timeline is playing
          // Check if we're beyond the content end time
          if (currentTime >= contentEndTime && contentEndTime > 0) {
            // Loop back to beginning
            onTimeUpdate(0);
          } else {
            // Check if there's a next clip to jump to
            const nextClip = timelineClips
              .filter(clip => clip.type === 'video' && (clip.startTime || 0) > currentTime)
              .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))[0];
            
            if (nextClip) {
              // Jump to the next clip
              onTimeUpdate(nextClip.startTime || 0);
            } else if (contentEndTime > 0) {
              // No more clips and we have content, loop back
              onTimeUpdate(0);
            } else {
              // No clips at all, advance normally but with a reasonable limit
              const nextTime = currentTime + 0.016; // ~60fps
              if (nextTime >= 30) { // 30 second limit when no clips
                onTimeUpdate(0);
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

  // Handle video end - advance to next clip or loop
  const handleVideoEnded = () => {
    if (currentClip && onTimeUpdate) {
      const clipEndTime = currentClip.endTime || 0;
      
      // Find the next video clip after this one
      const nextClip = timelineClips
        .filter(clip => clip.type === 'video' && (clip.startTime || 0) > clipEndTime)
        .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))[0];
      
      if (nextClip) {
        // Move to the start of the next clip
        onTimeUpdate(nextClip.startTime || 0);
      } else {
        // No more clips, loop back to beginning
        onTimeUpdate(0);
      }
    }
  };

  return (
    <div className="w-full h-full bg-[#0a0a0a] rounded-lg overflow-hidden flex items-center justify-center relative">
      {currentClip && currentClip.url ? (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleVideoEnded}
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            console.error('Video error details:', {
              error: e,
              networkState: target.networkState,
              readyState: target.readyState,
              currentSrc: target.currentSrc,
              clipUrl: currentClip?.url
            });
            setHasError(true);
          }}
          onLoadStart={() => {
            console.log('Video load started:', currentClip?.url);
            setHasError(false);
          }}
          onCanPlay={() => {
            console.log('Video can play:', currentClip?.url);
          }}
          onLoadedData={() => {
            console.log('Video data loaded:', currentClip?.url);
          }}
          crossOrigin="anonymous"
          playsInline
          muted={true}
          preload="metadata"
          controls={false}
        />
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
          <div className="text-sm font-medium">{currentClip.name}</div>
          <div className="text-xs text-white/70">
            Playing: {Math.floor((currentTime - (currentClip.startTime || 0)))}s / {Math.floor(((currentClip.endTime || 0) - (currentClip.startTime || 0)))}s
          </div>
        </div>
      )}
    </div>
  );
}; 