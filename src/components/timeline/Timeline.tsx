'use client';

import React, { useEffect, useRef } from 'react';

interface Scene {
  id: string;
  name: string;
  duration: number;
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

interface TextOverlay {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: 'top' | 'center' | 'bottom';
  fontSize: number;
}

interface TimelineProps {
  scenes: Scene[];
  audioClips?: AudioClip[];
  timelineClips?: Clip[];
  onDrop?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onClipCut?: (clipId: string, cutTime: number) => void;
  onClipDelete?: (clipId: string) => void;
  onClipSelect?: (clip: Clip) => void;
  selectedClipId?: string;
  onAddVoiceover?: (startTime: number) => void;
  currentTime?: number;
  totalDuration?: number;
  onSeek?: (time: number) => void;
  textOverlays?: TextOverlay[];
}

export const Timeline: React.FC<TimelineProps> = ({ 
  scenes, 
  audioClips = [], 
  timelineClips = [],
  onDrop,
  onDragOver,
  onClipCut,
  onClipDelete,
  onClipSelect,
  selectedClipId,
  onAddVoiceover,
  currentTime = 0,
  totalDuration = 30,
  onSeek,
  textOverlays = [],
}) => {
  // Convert milliseconds to a visual width
  const msToWidth = (ms: number) => {
    // 1 second = 100px
    return ms / 10;
  };

  // Ensure totalDuration is always a valid positive number first
  const safeTotalDuration = typeof totalDuration === 'number' && !isNaN(totalDuration) && totalDuration > 0 
    ? totalDuration 
    : 30; // Default to 30 seconds

  // Calculate timeline width based on validated duration
  const timelineWidth = Math.max(safeTotalDuration * 100, 3000); // Minimum 30 seconds
  
  // Ensure numMarkers is always a valid positive integer
  const numMarkers = Math.max(1, Math.ceil(safeTotalDuration));
  
  // Additional safety check for array creation
  const safeNumMarkers = typeof numMarkers === 'number' && !isNaN(numMarkers) && numMarkers > 0 && numMarkers < 10000
    ? numMarkers 
    : 30; // Fallback to 30 markers if something is still wrong
  
  // Debug logging to help identify issues
  if (typeof totalDuration !== 'number' || isNaN(totalDuration)) {
    console.warn('⚠️ Timeline: Invalid totalDuration received:', totalDuration, 'using fallback:', safeTotalDuration);
  }
  
  if (typeof numMarkers !== 'number' || isNaN(numMarkers) || numMarkers <= 0) {
    console.warn('⚠️ Timeline: Invalid numMarkers calculated:', numMarkers, 'using fallback:', safeNumMarkers);
  }
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to keep playhead visible
  useEffect(() => {
    if (containerRef.current) {
      const container = containerRef.current;
      const playheadPosition = currentTime * 100 + 50;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      
      // Scroll if playhead is near the edges
      if (playheadPosition < scrollLeft + 100) {
        container.scrollLeft = Math.max(0, playheadPosition - 200);
      } else if (playheadPosition > scrollLeft + containerWidth - 100) {
        container.scrollLeft = playheadPosition - containerWidth + 200;
      }
    }
  }, [currentTime]);

      return (
      <div className="relative w-full overflow-x-auto overflow-y-visible" ref={containerRef}>
      {/* Timeline ruler */}
      <div 
        className="h-8 bg-[#222] mb-2 relative border border-[#333] rounded cursor-pointer" 
        style={{ width: `${timelineWidth}px` }}
        onClick={(e) => {
          if (onSeek) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const time = Math.max(0, (x - 50) / 100);
            onSeek(time);
          }
        }}
      >
        {(() => {
          try {
            return [...Array(safeNumMarkers + 1)].map((_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-[#333] flex items-end pb-1"
                style={{ left: `${i * 100 + 50}px` }}
              >
                <span className="text-xs text-white/50 ml-1">{i}s</span>
              </div>
            ));
          } catch (error) {
            console.error('❌ Timeline: Error creating markers array:', error, 'safeNumMarkers:', safeNumMarkers);
            // Fallback to a simple set of markers
            return Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className="absolute top-0 h-full border-l border-[#333] flex items-end pb-1"
                style={{ left: `${i * 100 + 50}px` }}
              >
                <span className="text-xs text-white/50 ml-1">{i}s</span>
              </div>
            ));
          }
        })()}
      </div>

      {/* Tracks */}
      <div className="space-y-2" style={{ width: `${timelineWidth}px` }}>
        {/* Video Track */}
        <div 
          className="h-16 bg-[#222] rounded border border-[#333] relative group"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onContextMenu={(e) => {
            e.preventDefault();
            if (onAddVoiceover) {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const timePosition = Math.max(0, (x - 50) / 100);
              onAddVoiceover(timePosition);
            }
          }}
        >
          <div className="absolute left-2 top-1 text-xs font-medium text-white/70 flex items-center space-x-2">
            <span>Video & Animation</span>
            <button
              onClick={() => onAddVoiceover && onAddVoiceover(0)}
              className="text-xs bg-red-600/20 text-red-400 px-2 py-1 rounded hover:bg-red-600/30 transition-colors"
              title="Add voiceover at timeline start"
            >
              + Voiceover
            </button>
            <span className="text-white/40 text-[10px]">
              Right-click: Add voiceover | Hover clips: Edit options
            </span>
          </div>
          
          {/* Drop zone indicator */}
          <div className="absolute inset-2 top-6 border-2 border-dashed border-white/20 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-xs text-white/50">Drop video clips & animations here</span>
          </div>
          
          {/* Video clips */}
          {timelineClips.map((clip) => (
            <div
              key={clip.id}
              className={`absolute top-6 h-8 rounded cursor-pointer flex items-center px-2 border group transition-all ${
                selectedClipId === clip.id 
                  ? 'bg-blue-700 border-blue-400 ring-2 ring-blue-400/50' 
                  : 'bg-blue-600 border-blue-500/30 hover:bg-blue-700'
              }`}
              style={{ 
                left: `${(clip.startTime || 0) * 100 + 50}px`,
                width: `${((clip.endTime || 0) - (clip.startTime || 0)) * 100}px`,
                minWidth: '50px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                if (onClipSelect) {
                  onClipSelect(clip);
                }
              }}
              title="Click to select, then use Del to delete or Ctrl+X to split at playhead"
            >
              <span className="text-xs text-white truncate flex-1">
                🎥 {clip.name}
              </span>
              <div className="hidden group-hover:flex space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const cutTime = window.prompt('Enter cut time (seconds from clip start):');
                    if (cutTime && onClipCut) {
                      onClipCut(clip.id, parseFloat(cutTime));
                    }
                  }}
                  className="text-xs bg-yellow-600/20 text-yellow-400 px-1 rounded hover:bg-yellow-600/30"
                  title="Cut clip"
                >
                  ✂
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onClipDelete) {
                      onClipDelete(clip.id);
                    }
                  }}
                  className="text-xs bg-red-600/20 text-red-400 px-1 rounded hover:bg-red-600/30"
                  title="Delete clip"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          
          {/* Animation scenes */}
          {scenes.map((scene, index) => (
            <div
              key={scene.id}
              className="absolute top-6 h-8 bg-gradient-to-r from-purple-600 to-blue-500 rounded cursor-move flex items-center px-2 border border-purple-500/30"
              style={{ 
                left: `${index * 120 + 50}px`,
                width: `${msToWidth(scene.duration)}px`,
                minWidth: '50px'
              }}
            >
              <span className="text-xs text-white truncate">
                ✨ {scene.name}
              </span>
            </div>
          ))}
        </div>


        
        <div className="h-16 bg-[#222] rounded border border-[#333] relative">
          <div className="absolute left-2 top-1 text-xs font-medium text-white/70">
            Audio
          </div>
          
          {audioClips.map((clip) => {
            // Calculate the end of the timeline (max end of all video/audio clips or totalDuration)
            const allEnds = [
              ...(timelineClips?.map(c => c.endTime || 0) || []),
              ...audioClips.map(a => a.endTime),
              totalDuration
            ];
            const timelineEnd = Math.max(...allEnds);
            const calculatedWidth = (timelineEnd - clip.startTime) * 100;
            const calculatedLeft = clip.startTime * 100 + 50;
            
            // No timestamp in label
            return (
              <div
                key={clip.id}
                className="absolute top-6 h-8 bg-green-600 rounded flex items-center px-2 border border-green-500/30"
                style={{ 
                  left: `${calculatedLeft}px`,
                  width: `${calculatedWidth}px`,
                  minWidth: '50px'
                }}
              >
                <span className="text-xs text-white truncate">
                  🎵 Voice Recording
                </span>
              </div>
            );
          })}
        </div>
        
        <div className="h-16 bg-[#222] rounded border border-[#333] relative">
          <div className="absolute left-2 top-1 text-xs font-medium text-white/70">
            Text Overlays
          </div>
          {textOverlays.map((overlay) => {
            const calculatedWidth = (overlay.endTime - overlay.startTime) * 100;
            const calculatedLeft = overlay.startTime * 100 + 50;
            return (
              <div
                key={overlay.id}
                className="absolute top-6 h-8 bg-yellow-500/80 rounded flex items-center px-2 border border-yellow-400/50 shadow"
                style={{
                  left: `${calculatedLeft}px`,
                  width: `${calculatedWidth}px`,
                  minWidth: '50px',
                  fontSize: overlay.fontSize,
                  fontWeight: 600,
                  color: '#222',
                  zIndex: 2,
                }}
              >
                <span className="truncate w-full text-center">📝 {overlay.text}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Playhead */}
      <div 
        className="absolute top-0 h-full border-l-2 border-red-500 z-10 pointer-events-none"
        style={{ left: `${currentTime * 100 + 50}px` }}
      >
        <div className="w-3 h-3 bg-red-500 rounded-full -ml-1.5 shadow-lg"></div>
        <div className="absolute top-6 -ml-8 text-xs text-red-400 bg-black/50 px-1 rounded">
          {Math.floor(currentTime)}s
        </div>
      </div>
    </div>
  );
}; 