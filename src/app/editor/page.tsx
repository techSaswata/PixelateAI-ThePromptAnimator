'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Timeline } from '../../components/timeline/Timeline';
import { VideoPreview } from '../../components/preview/VideoPreview';
import { SaveProjectModal } from '../../components/editor/SaveProjectModal';
import axios from 'axios';

// Temporary inline definition of ExportModal until the module is properly imported
const ExportModal = ({
  isOpen,
  onClose,
  onExport,
  isExporting
}: {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, quality: string) => void;
  isExporting: boolean;
}) => {
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState('high');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(selectedFormat, selectedQuality);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-[#111] border border-[#222] rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-white">Export Animation</h2>
          <button 
            onClick={onClose}
            className="text-white/50 hover:text-white/70 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-white mb-2">
            Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isExporting}
          >
            <option value="mp4">MP4 Video</option>
            <option value="gif">GIF Animation</option>
            <option value="webm">WebM Video</option>
            <option value="png">PNG Image Sequence</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-white mb-2">
            Quality
          </label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="w-full bg-[#222] border border-[#333] rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isExporting}
          >
            <option value="high">High (1080p)</option>
            <option value="medium">Medium (720p)</option>
            <option value="low">Low (480p)</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#222] border border-[#333] rounded-lg text-white hover:bg-[#333] transition-colors"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center disabled:opacity-50"
            disabled={isExporting}
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              'Export'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

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

export default function EditorPage() {
  const searchParams = useSearchParams();
  const promptParam = searchParams ? searchParams.get('prompt') || '' : '';
  const projectIdParam = searchParams ? searchParams.get('projectId') : null;
  const [prompt, setPrompt] = useState(promptParam);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [showPromptPanel, setShowPromptPanel] = useState(true);
  const [mergeIntoOneFile, setMergeIntoOneFile] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [projectTitle, setProjectTitle] = useState('My First Vlog');
  const [projectDescription, setProjectDescription] = useState('');
  const [projectId, setProjectId] = useState<string | null>(projectIdParam);
  const [isLoadingProject, setIsLoadingProject] = useState(!!projectIdParam);
  
  // Video and audio clips data
  const [clips, setClips] = useState<Clip[]>([]);
  const [audioClips, setAudioClips] = useState<AudioClip[]>([]);
  const [galleryVideos, setGalleryVideos] = useState<any[]>([]);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [splitTime, setSplitTime] = useState(0);
  const [timelineClips, setTimelineClips] = useState<Clip[]>([]);
  const [draggedClip, setDraggedClip] = useState<Clip | null>(null);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animation scenes data for the timeline
  const [scenes, setScenes] = useState<any[]>([]);
  
  // Load project data if projectId is provided
  useEffect(() => {
    if (projectIdParam) {
      const loadProject = async () => {
        setIsLoadingProject(true);
        try {
          // In a real implementation, this would call the API to get the project data
          const response = await axios.get(`/api/projects?id=${projectIdParam}`);
          
          if (response.data.success && response.data.projects.length > 0) {
            const project = response.data.projects[0];
            setProjectId(project.id);
            setProjectTitle(project.title);
            setProjectDescription(project.description || '');
            setPrompt(project.prompt || '');
            
            if (project.scenes) {
              setScenes(project.scenes);
            }
            
            if (project.clips) {
              setClips(project.clips);
            }
          }
        } catch (error) {
          console.error('Error loading project:', error);
        } finally {
          setIsLoadingProject(false);
        }
      };
      
      loadProject();
    } else {
      // Check if there's new project data in sessionStorage
      const newProjectData = typeof window !== 'undefined' ? 
        sessionStorage.getItem('newProjectData') : null;
      
      if (newProjectData) {
        try {
          const projectData = JSON.parse(newProjectData);
          
          // Update state with the project data
          if (projectData.prompt) {
            setPrompt(projectData.prompt);
          }
          
          if (projectData.scenes && projectData.scenes.length > 0) {
            setScenes(projectData.scenes);
          }
          
          if (projectData.clips && projectData.clips.length > 0) {
            setClips(projectData.clips);
          }
          
          // Clear the sessionStorage after loading
          sessionStorage.removeItem('newProjectData');
        } catch (error) {
          console.error('Error parsing project data from sessionStorage:', error);
        }
      }
    }
  }, [projectIdParam]);
  
  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    // Ensure video starts from current playhead position
    if (!isPlaying) {
      // Force a time update to sync video with playhead
      const currentActiveClip = timelineClips.find(clip => 
        clip.type === 'video' && 
        (clip.startTime || 0) <= currentTime && 
        (clip.endTime || 0) > currentTime
      );
      if (currentActiveClip) {
        // Video will be synced in VideoPreview useEffect
      }
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleLoadedMetadata = (duration: number) => {
    setTotalDuration(duration);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const formatTimeFromSeconds = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };
  
  const handleConfirm = () => {
    // Handle export/confirm logic
    console.log('Confirming edits');
  };
  
  const handleCancel = () => {
    // Handle cancel logic
    console.log('Cancelling edits');
  };
  
  const handleRegenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsRegenerating(true);
    
    try {
      // Call our Python backend through the Next.js API route
      const response = await axios.post('/api/prompt', {
        prompt,
        quality: 'high' // You could make this configurable
      });
      
      if (response.data.success) {
        // Handle the successful response from Python backend
        const responseData = response.data.data;
        
        // Update scenes based on the Python backend response
        // The format will depend on what your Python backend returns
        if (responseData.scenes) {
          setScenes(responseData.scenes);
        }
        
        // Update clips if returned from the backend
        if (responseData.clips) {
          setClips(responseData.clips);
        }
      } else {
        console.error('Error from backend:', response.data.error);
      }
      
    } catch (error) {
      console.error('Error regenerating animation:', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExport = (format: string, quality: string) => {
    setIsExporting(true);
    
    // Simulate export process
    setTimeout(() => {
      console.log(`Exporting in ${format} format with ${quality} quality`);
      setIsExporting(false);
      setShowExportModal(false);
      
      // In a real implementation, this would trigger the export process
      // and potentially download the file or provide a link
    }, 2000);
  };

  const handleSaveProject = async (title: string, description: string) => {
    setIsSaving(true);
    
    try {
      // Prepare project data
      const projectData = {
        id: projectId,
        title,
        description,
        prompt,
        scenes,
        clips,
        audioClips,
        // Include other project data as needed
      };
      
      // Save to API
      const response = await axios.post('/api/projects', projectData);
      
      if (response.data.success) {
        // Update project state
        setProjectTitle(title);
        setProjectDescription(description);
        setProjectId(response.data.project.id);
        setShowSaveModal(false);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total duration when clips change
  useEffect(() => {
    const maxVideoTime = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(clip => clip.endTime || 0))
      : 0;
    const maxAudioTime = audioClips.length > 0 
      ? Math.max(...audioClips.map(clip => clip.endTime))
      : 0;
    const maxSceneTime = scenes.length > 0 
      ? scenes.reduce((acc, scene, index) => acc + (scene.duration / 1000), 0)
      : 0;
      
    const calculatedDuration = Math.max(maxVideoTime, maxAudioTime, maxSceneTime, 30);
    setTotalDuration(calculatedDuration);
  }, [timelineClips, audioClips, scenes]);

  // Load gallery videos
  useEffect(() => {
    const loadGalleryVideos = async () => {
      try {
        // Load videos from gallery
        const response = await axios.get('/api/gallery');
        if (response.data.success) {
          setGalleryVideos(response.data.videos || []);
        }
      } catch (error) {
        console.error('Error loading gallery videos:', error);
      }
    };
    
    loadGalleryVideos();
  }, []);

  // Responsive behavior for sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1200) {
        setShowRightSidebar(false);
      } else {
        setShowRightSidebar(true);
      }
    };

    // Check initial size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Keyboard shortcuts for timeline editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedClip && timelineClips.find(c => c.id === selectedClip.id)) {
        switch (e.key) {
          case 'Delete':
          case 'Backspace':
            e.preventDefault();
            handleTimelineClipDelete(selectedClip.id);
            setSelectedClip(null);
            break;
          case 'c':
            if (e.ctrlKey || e.metaKey) {
              e.preventDefault();
              const time = window.prompt('Enter cut time (seconds from clip start):');
              if (time) {
                handleTimelineClipCut(selectedClip.id, parseFloat(time));
              }
            }
            break;
        }
      }
      
      // Global shortcuts
      if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, timelineClips, isPlaying]);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Cleanup any active recording
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      
      // Cleanup object URLs to prevent memory leaks
      clips.forEach(clip => {
        if (clip.url && clip.url.startsWith('blob:')) {
          URL.revokeObjectURL(clip.url);
        }
      });
      
      audioClips.forEach(clip => {
        if (clip.url.startsWith('blob:')) {
          URL.revokeObjectURL(clip.url);
        }
      });
    };
  }, [clips, audioClips]);

  // File upload handlers
  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      
      video.onloadedmetadata = () => {
        const newClip: Clip = {
          id: `clip-${Date.now()}`,
          name: file.name,
          duration: formatTime(video.duration),
          thumbnail: url,
          type: 'video',
          url,
          file,
          startTime: 0,
          endTime: video.duration
        };
        
        setClips(prev => [...prev, newClip]);
      };
      
      video.src = url;
    }
  };

  const handleAudioUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      
      audio.onloadedmetadata = () => {
        const newAudioClip: AudioClip = {
          id: `audio-${Date.now()}`,
          name: file.name,
          duration: audio.duration,
          url,
          file,
          startTime: 0,
          endTime: audio.duration
        };
        
        setAudioClips(prev => [...prev, newAudioClip]);
      };
      
      audio.src = url;
    }
  };

  const handleGalleryVideoSelect = (video: any) => {
    // Construct full URL for the video
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const fullVideoUrl = `${backendUrl}${video.video_url}`;
    const fullThumbnailUrl = video.thumbnail ? `${backendUrl}${video.thumbnail}` : '';
    
    console.log('Adding gallery video:', {
      id: video.id,
      title: video.title,
      original_url: video.video_url,
      full_url: fullVideoUrl,
      original_thumbnail: video.thumbnail,
      full_thumbnail: fullThumbnailUrl,
      duration: video.duration
    });
    
    // Default duration to 10 seconds if unknown
    const defaultDuration = video.duration === 'Unknown' ? 10 : parseTimeToSeconds(video.duration || '00:00:10');
    
    const newClip: Clip = {
      id: `gallery-${video.id}`,
      name: video.title,
      duration: video.duration === 'Unknown' ? '00:00:10' : (video.duration || '00:00:10'),
      thumbnail: fullThumbnailUrl,
      type: 'video',
      url: fullVideoUrl,
      startTime: 0,
      endTime: defaultDuration
    };
    
    console.log('Created clip:', newClip);
    setClips(prev => [...prev, newClip]);
    setShowMediaPanel(false);
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        // Check if this is a voiceover for timeline
        const voiceoverStartTime = sessionStorage.getItem('voiceoverStartTime');
        
        if (voiceoverStartTime) {
          const startTime = parseFloat(voiceoverStartTime);
          const newAudioClip: AudioClip = {
            id: `voiceover-${Date.now()}`,
            name: `Voiceover ${formatTime(recordingTime)}`,
            duration: recordingTime,
            url,
            startTime,
            endTime: startTime + recordingTime
          };
          
          setAudioClips(prev => [...prev, newAudioClip]);
          sessionStorage.removeItem('voiceoverStartTime');
          setShowVoiceRecorder(false);
        } else {
          const newAudioClip: AudioClip = {
            id: `recording-${Date.now()}`,
            name: `Voice Recording ${formatTime(recordingTime)}`,
            duration: recordingTime,
            url,
            startTime: 0,
            endTime: recordingTime
          };
          
          setAudioClips(prev => [...prev, newAudioClip]);
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Video cutting/splitting functions
  const handleSplitClip = (clipId: string, splitTime: number) => {
    const clipIndex = clips.findIndex(c => c.id === clipId);
    if (clipIndex === -1) return;
    
    const originalClip = clips[clipIndex];
    const duration = parseTimeToSeconds(originalClip.duration);
    
    if (splitTime <= 0 || splitTime >= duration) return;
    
    const clip1: Clip = {
      ...originalClip,
      id: `${originalClip.id}-part1`,
      name: `${originalClip.name} (Part 1)`,
      duration: formatTime(splitTime),
      endTime: splitTime
    };
    
    const clip2: Clip = {
      ...originalClip,
      id: `${originalClip.id}-part2`,
      name: `${originalClip.name} (Part 2)`,
      duration: formatTime(duration - splitTime),
      startTime: splitTime,
      endTime: duration
    };
    
    const newClips = [...clips];
    newClips.splice(clipIndex, 1, clip1, clip2);
    setClips(newClips);
  };

  const handleTrimClip = (clipId: string, startTime: number, endTime: number) => {
    setClips(prev => prev.map(clip => {
      if (clip.id === clipId) {
        return {
          ...clip,
          startTime,
          endTime,
          duration: formatTime(endTime - startTime)
        };
      }
      return clip;
    }));
  };

  const handleDeleteClip = (clipId: string) => {
    setClips(prev => prev.filter(clip => clip.id !== clipId));
  };

  const handleDeleteAudioClip = (clipId: string) => {
    setAudioClips(prev => prev.filter(clip => clip.id !== clipId));
  };

  // Drag and Drop handlers
  const handleDragStart = (clip: Clip) => {
    setDraggedClip(clip);
  };

  const handleDragEnd = () => {
    setDraggedClip(null);
  };

  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedClip) {
      console.log('Timeline: Dropping clip:', {
        clipId: draggedClip.id,
        clipName: draggedClip.name,
        clipUrl: draggedClip.url,
        clipDuration: draggedClip.duration
      });
      
      const timelineRect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - timelineRect.left;
      const dropPosition = Math.max(0, (x - 50) / 100); // Assuming 100px = 1 second
      
      // Find the best position to snap to (no gaps between clips)
      const sortedClips = [...timelineClips].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      let startTime = 0;
      
      // Find the appropriate insertion point
      for (let i = 0; i < sortedClips.length; i++) {
        const clip = sortedClips[i];
        const clipStart = clip.startTime || 0;
        const clipEnd = clip.endTime || 0;
        
        // If dropping before this clip and there's enough space
        if (dropPosition < clipStart) {
          const availableSpace = clipStart - startTime;
          const clipDuration = parseTimeToSeconds(draggedClip.duration);
          
          if (availableSpace >= clipDuration) {
            // Fit the clip in this gap, starting right after previous clip
            break;
          }
        }
        
        // Move to after this clip
        startTime = clipEnd;
      }
      
      const newTimelineClip: Clip = {
        ...draggedClip,
        id: `timeline-${draggedClip.id}-${Date.now()}`,
        startTime: startTime,
        endTime: startTime + parseTimeToSeconds(draggedClip.duration)
      };
      
      console.log('Timeline: Created timeline clip:', {
        id: newTimelineClip.id,
        name: newTimelineClip.name,
        url: newTimelineClip.url,
        startTime: newTimelineClip.startTime,
        endTime: newTimelineClip.endTime
      });
      
      setTimelineClips(prev => {
        const newClips = [...prev, newTimelineClip];
        // Sort clips to maintain order
        const sortedNewClips = newClips.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
        console.log('Timeline: Updated timeline clips:', sortedNewClips.map(c => ({ id: c.id, name: c.name, startTime: c.startTime, endTime: c.endTime })));
        return sortedNewClips;
      });
      setDraggedClip(null);
    }
  };

  const handleTimelineDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleTimelineClipCut = (clipId: string, cutTime: number) => {
    setTimelineClips(prev => {
      const clipIndex = prev.findIndex(c => c.id === clipId);
      if (clipIndex === -1) return prev;
      
      const originalClip = prev[clipIndex];
      const relativeTime = originalClip.startTime! + cutTime;
      
      const clip1: Clip = {
        ...originalClip,
        id: `${originalClip.id}-part1`,
        name: `${originalClip.name} (Part 1)`,
        endTime: relativeTime
      };
      
      const clip2: Clip = {
        ...originalClip,
        id: `${originalClip.id}-part2`,
        name: `${originalClip.name} (Part 2)`,
        startTime: relativeTime
      };
      
      const newClips = [...prev];
      newClips.splice(clipIndex, 1, clip1, clip2);
      return newClips;
    });
  };

  const handleTimelineClipDelete = (clipId: string) => {
    setTimelineClips(prev => prev.filter(clip => clip.id !== clipId));
  };

  const handleArrangeClips = () => {
    setTimelineClips(prev => {
      const sortedClips = [...prev].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
      let currentTime = 0;
      
      return sortedClips.map(clip => {
        const duration = parseTimeToSeconds(clip.duration);
        const arrangedClip = {
          ...clip,
          startTime: currentTime,
          endTime: currentTime + duration
        };
        currentTime += duration;
        return arrangedClip;
      });
    });
  };

  const handleAddVoiceover = (startTime: number) => {
    setShowVoiceRecorder(true);
    // Store the start time for when recording is finished
    sessionStorage.setItem('voiceoverStartTime', startTime.toString());
  };

  // Utility functions
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const parseTimeToSeconds = (timeString: string): number => {
    if (!timeString || timeString === 'Unknown') {
      return 10; // Default to 10 seconds for unknown durations
    }
    
    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      const seconds = parseInt(parts[2], 10) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10) || 0;
      const seconds = parseInt(parts[1], 10) || 0;
      return minutes * 60 + seconds;
    } else if (parts.length === 1) {
      return parseInt(parts[0], 10) || 10;
    }
    
    console.warn('Invalid time format:', timeString, 'defaulting to 10 seconds');
    return 10;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-white">
      {isLoadingProject ? (
        <div className="flex items-center justify-center h-screen bg-[#0a0a0a]">
          <div className="text-center">
            <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-white">Loading Project...</h2>
          </div>
        </div>
      ) : (
        <>
          {/* Top navigation bar */}
          <div className="bg-[#111] border-b border-[#222] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold text-white">{projectTitle}</div>
              <div className="text-sm text-white/50">Video Editor</div>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="px-3 py-2 bg-[#222] text-white/70 rounded-lg hover:bg-[#333] hover:text-white transition-colors border border-[#333] flex items-center gap-2"
                title={showRightSidebar ? "Hide Panels" : "Show Panels"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
                {showRightSidebar ? "Hide" : "Show"}
              </button>
              {!showPromptPanel && (
                <button 
                  onClick={() => setShowPromptPanel(true)} 
                  className="px-4 py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors flex items-center gap-2 border border-purple-600/30"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Show Prompt
                </button>
              )}
              <button 
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
                onClick={() => setShowSaveModal(true)}
              >
                Save
              </button>
              <button 
                className="px-4 py-2 bg-[#222] text-white rounded-lg hover:bg-[#333] transition-colors border border-[#333]"
                onClick={() => setShowExportModal(true)}
              >
                Export
              </button>
            </div>
          </div>
          
          {/* Main content area */}
          <div className="flex flex-1 overflow-hidden min-w-0">
            {/* Left sidebar - Tools */}
            <div className="w-20 bg-[#111] border-r border-[#222] text-white flex flex-col items-center py-6 space-y-4">
              <button 
                className={`p-3 rounded-lg transition-all ${
                  showMediaPanel 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white' 
                    : 'bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]'
                }`}
                onClick={() => setShowMediaPanel(!showMediaPanel)}
                title="Media Library"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              
              <button 
                className="p-3 rounded-lg transition-all bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]"
                onClick={() => fileInputRef.current?.click()}
                title="Upload Video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
              
              <button 
                className={`p-3 rounded-lg transition-all ${
                  showVoiceRecorder 
                    ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white' 
                    : 'bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]'
                }`}
                onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                title="Voice Recorder"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>
              
              <button 
                className="p-3 rounded-lg transition-all bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]"
                onClick={() => audioInputRef.current?.click()}
                title="Upload Audio"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </button>
              
              <button 
                className="p-3 rounded-lg transition-all bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]"
                title="Cut Tool"
                onClick={() => {
                  if (selectedClip) {
                    const time = window.prompt('Enter split time in seconds:');
                    if (time) {
                      handleSplitClip(selectedClip.id, parseFloat(time));
                    }
                  }
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 8.5l9-9M2.5 21.5l9-9m0 0l-2.5-2.5m2.5 2.5l-2.5 2.5M21.5 2.5l-9 9" />
                </svg>
              </button>
              
              <button 
                className="p-3 rounded-lg transition-all bg-[#222] text-white/70 hover:bg-[#333] hover:text-white border border-[#333]"
                title="Effects"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </button>
              
              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <input
                ref={audioInputRef}
                type="file"
                accept="audio/*"
                onChange={handleAudioUpload}
                className="hidden"
              />
            </div>
            
            {/* Main content area with video preview */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Video preview area */}
              <div className="flex-1 p-6 bg-[#0a0a0a]">
                              <div className="h-full rounded-xl overflow-hidden bg-[#111] border border-[#222] flex items-center justify-center">
                <VideoPreview 
                  timelineClips={timelineClips}
                  audioClips={audioClips}
                  isPlaying={isPlaying}
                  currentTime={currentTime}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              </div>
                </div>
                
              {/* Timeline area */}
              <div className="h-56 bg-[#111] border-t border-[#222] p-4 min-w-0" style={{ overflowX: 'hidden', overflowY: 'visible' }}>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-4">
                    <button 
                      onClick={togglePlay}
                      className="p-2 bg-gradient-to-r from-purple-600 to-blue-500 rounded-lg hover:opacity-90 transition-opacity"
                    >
                      {isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </button>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-white/70">
                        {formatTimeFromSeconds(currentTime)} / {formatTimeFromSeconds(totalDuration)}
                      </span>
                      {selectedClip && timelineClips.find(c => c.id === selectedClip.id) && (
                        <span className="text-xs bg-purple-600/20 text-purple-400 px-2 py-1 rounded border border-purple-600/30">
                          Selected: {selectedClip.name} | Del: Delete | Ctrl+C: Cut
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleArrangeClips}
                      className="p-2 text-white/70 hover:text-white transition-colors"
                      title="Arrange clips without gaps"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l6 6m0-6l-6 6m-5-3v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </button>
                    <button className="p-2 text-white/70 hover:text-white transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                {/* Timeline component */}
                <Timeline 
                  scenes={scenes} 
                  audioClips={audioClips} 
                  timelineClips={timelineClips}
                  onDrop={handleTimelineDrop}
                  onDragOver={handleTimelineDragOver}
                  onClipCut={handleTimelineClipCut}
                  onClipDelete={handleTimelineClipDelete}
                  onAddVoiceover={handleAddVoiceover}
                  currentTime={currentTime}
                  totalDuration={totalDuration}
                  onSeek={handleSeek}
                />
              </div>
            </div>

            {/* Right Sidebar - Editor Panels */}
            {showRightSidebar && (
              <div className="w-80 min-w-0 bg-[#111] border-l border-[#222] flex flex-col overflow-hidden">
              <div className="p-4 border-b border-[#222] bg-gradient-to-r from-purple-600/10 to-blue-500/10">
                <h2 className="text-lg font-semibold text-white">✨ Editor Panels</h2>
                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => setShowPromptPanel(!showPromptPanel)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      showPromptPanel 
                        ? 'bg-purple-600/30 text-purple-300 border border-purple-600/50' 
                        : 'bg-[#222] text-white/50 hover:bg-[#333] border border-[#333]'
                    }`}
                  >
                    Prompt
                  </button>
                  <button 
                    onClick={() => setShowMediaPanel(!showMediaPanel)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      showMediaPanel 
                        ? 'bg-blue-600/30 text-blue-300 border border-blue-600/50' 
                        : 'bg-[#222] text-white/50 hover:bg-[#333] border border-[#333]'
                    }`}
                  >
                    Media
                  </button>
                  <button 
                    onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      showVoiceRecorder 
                        ? 'bg-red-600/30 text-red-300 border border-red-600/50' 
                        : 'bg-[#222] text-white/50 hover:bg-[#333] border border-[#333]'
                    }`}
                  >
                    Voice
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Properties Panel - Always visible */}
                <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Properties
                  </h3>
                  {selectedClip ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-white/50 uppercase tracking-wide">Selected Clip</label>
                        <div className="text-sm text-white font-medium">{selectedClip.name}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wide">Type</label>
                          <div className="text-sm text-white capitalize">{selectedClip.type}</div>
                        </div>
                        <div>
                          <label className="text-xs text-white/50 uppercase tracking-wide">Duration</label>
                          <div className="text-sm text-white">{selectedClip.duration}</div>
                        </div>
                      </div>
                      {selectedClip.startTime !== undefined && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-white/50 uppercase tracking-wide">Start Time</label>
                            <div className="text-sm text-white">{formatTime(selectedClip.startTime)}</div>
                          </div>
                          <div>
                            <label className="text-xs text-white/50 uppercase tracking-wide">End Time</label>
                            <div className="text-sm text-white">{formatTime(selectedClip.endTime || 0)}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="w-12 h-12 mx-auto mb-3 bg-[#111] rounded-full flex items-center justify-center border border-[#333]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                      </div>
                      <p className="text-white/50 text-sm">No clip selected</p>
                      <p className="text-white/30 text-xs mt-1">Select a clip to view properties</p>
                    </div>
                  )}
                </div>
                {/* Prompt Panel */}
                {showPromptPanel && (
                  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-white">Prompt</h3>
                      <button 
                        onClick={() => setShowPromptPanel(false)}
                        className="text-white/50 hover:text-white/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <textarea
                      className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-sm h-32 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to animate..."
                    />
                    <button 
                      className="mt-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !prompt.trim()}
                    >
                      {isRegenerating ? (
                        <>
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Regenerating...
                        </>
                      ) : (
                        'Regenerate'
                      )}
                    </button>
                  </div>
                )}

                {/* Media Library Panel */}
                {showMediaPanel && (
                  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-white">Media Library</h3>
                      <button 
                        onClick={() => setShowMediaPanel(false)}
                        className="text-white/50 hover:text-white/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    
                    <div className="space-y-6">
                      {/* Upload Section */}
                      <div>
                        <h4 className="font-medium mb-3 text-white">Upload New</h4>
                        <div className="flex flex-col space-y-2">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
                          >
                            Upload Video
                          </button>
                          <button 
                            onClick={() => audioInputRef.current?.click()}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
                          >
                            Upload Audio
                          </button>
                        </div>
                      </div>
                      
                      {/* Gallery Videos Section */}
                      <div>
                        <h4 className="font-medium mb-3 text-white">Gallery Videos</h4>
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {galleryVideos.length === 0 ? (
                            <p className="text-white/50 text-sm text-center py-8">
                              No videos in gallery
                            </p>
                          ) : (
                            galleryVideos.map((video) => (
                              <div 
                                key={video.id}
                                className="flex items-center space-x-3 p-3 bg-[#111] rounded-lg cursor-pointer hover:bg-[#333] transition-colors border border-[#333]"
                                onClick={() => handleGalleryVideoSelect(video)}
                              >
                                <div className="w-16 h-12 bg-[#0a0a0a] rounded-lg flex-shrink-0 flex items-center justify-center border border-[#333]">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-white truncate">{video.title}</div>
                                  <div className="text-xs text-white/50">{video.category || 'Animation'}</div>
                                  <div className="text-xs text-white/40">{video.duration || '00:00'}</div>
                                </div>
                                <button className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-lg text-xs hover:bg-purple-600/30 transition-colors border border-purple-600/30">
                                  Add
                    </button>
                  </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Voice Recorder Panel */}
                {showVoiceRecorder && (
                  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold text-white">Voice Recorder</h3>
                      <button 
                        onClick={() => setShowVoiceRecorder(false)}
                        className="text-white/50 hover:text-white/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                    </div>
                    
                    <div className="text-center">
                      <div className="mb-6">
                        <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center border-2 ${
                          isRecording 
                            ? 'bg-red-600/20 border-red-600/50 animate-pulse' 
                            : 'bg-[#111] border-[#333]'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className={`h-12 w-12 ${
                            isRecording ? 'text-red-400' : 'text-white/40'
                          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                        </div>
                      </div>
                      
                      <div className="mb-6">
                        <div className="text-2xl font-mono text-white">
                          {formatTime(recordingTime)}
                        </div>
                        <div className="text-sm text-white/50">
                          {isRecording ? 'Recording...' : 'Ready to record'}
                        </div>
                      </div>
                      
                      <div className="flex justify-center">
                        {!isRecording ? (
                          <button 
                            onClick={startRecording}
                            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2 transition-colors"
                          >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                            <span>Start Recording</span>
                    </button>
                        ) : (
                          <button 
                            onClick={stopRecording}
                            className="px-6 py-3 bg-[#333] text-white rounded-lg hover:bg-[#444] flex items-center space-x-2 transition-colors border border-[#444]"
                          >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
                            <span>Stop Recording</span>
                    </button>
                        )}
                  </div>
                      
                      <div className="mt-4 text-xs text-white/40">
                        Click microphone permissions if prompted
                </div>
                    </div>
                  </div>
                )}

                {/* Video and Audio Clips Panel - Always visible */}
                {(
                  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-white">Video Clips</h3>
                      <span className="text-xs text-white/40">Drag to timeline</span>
                    </div>
                    <div className="space-y-3 max-h-48 overflow-y-auto">
                      {clips.length === 0 ? (
                                                  <div className="text-center py-8">
                            <p className="text-white/50 text-sm mb-2">
                              No video clips added yet
                            </p>
                            <p className="text-white/30 text-xs">
                              Upload videos and drag them to the timeline
                            </p>
                          </div>
                      ) : (
                                                 clips.map((clip) => (
                           <div 
                             key={clip.id} 
                             draggable
                             onDragStart={() => handleDragStart(clip)}
                             onDragEnd={handleDragEnd}
                             title="Drag this clip to the timeline"
                             className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                               selectedClip?.id === clip.id 
                                 ? 'bg-purple-600/20 border border-purple-600/30' 
                                 : 'bg-[#111] hover:bg-[#333] border border-[#333]'
                             } ${draggedClip?.id === clip.id ? 'opacity-50' : ''}`}
                             onClick={() => setSelectedClip(clip)}
                           >
                            <div className="w-16 h-12 bg-[#111] rounded-lg flex-shrink-0 relative overflow-hidden border border-[#333]">
                              {clip.thumbnail && clip.type === 'video' ? (
                                <video 
                                  src={clip.url}
                                  className="w-full h-full object-cover"
                                  muted
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
                                  {clip.type === 'video' ? '🎥' : '🎵'}
                      </div>
                              )}
                    </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium truncate text-white">{clip.name}</div>
                              <div className="text-xs text-white/50">
                                {clip.duration}
                  </div>
                              {clip.startTime !== undefined && clip.endTime !== undefined && (
                                <div className="text-xs text-white/40">
                                  {formatTime(clip.startTime)} - {formatTime(clip.endTime)}
                </div>
                              )}
                          </div>
                            <div className="flex flex-col space-y-1">
                              <button 
                                className="text-blue-400 hover:text-blue-300 text-xs transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const time = window.prompt('Enter split time in seconds:');
                                  if (time) {
                                    handleSplitClip(clip.id, parseFloat(time));
                                  }
                                }}
                              >
                                Cut
                              </button>
                              <button 
                                className="text-red-400 hover:text-red-300 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClip(clip.id);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                        </div>
                          </div>
                        ))
                      )}
                        </div>
                    
                    {/* Audio Clips Section */}
                    <div className="mt-6 border-t border-[#333] pt-4">
                      <h4 className="font-medium mb-3 text-white">Audio Clips</h4>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {audioClips.length === 0 ? (
                          <p className="text-white/50 text-sm text-center py-4">
                            No audio clips added yet
                          </p>
                        ) : (
                          audioClips.map((clip) => (
                            <div key={clip.id} className="flex items-center space-x-3 p-3 bg-[#111] rounded-lg border border-[#333] hover:bg-[#333] transition-colors">
                              <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center border border-green-600/30">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate text-white">{clip.name}</div>
                                <div className="text-xs text-white/50">{formatTime(clip.duration)}</div>
                              </div>
                              <button 
                                className="text-red-400 hover:text-red-300 transition-colors"
                                onClick={() => handleDeleteAudioClip(clip.id)}
                              >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                          ))
                        )}
                  </div>
                </div>
                  </div>
                )}

                {/* Effects & Filters Panel - Always visible */}
                <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    Effects & Filters
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-3 bg-[#111] rounded-lg border border-[#333] hover:bg-[#333] transition-colors text-center">
                      <div className="text-xs text-white/70 mb-1">🎨</div>
                      <div className="text-xs text-white">Color</div>
                    </button>
                    <button className="p-3 bg-[#111] rounded-lg border border-[#333] hover:bg-[#333] transition-colors text-center">
                      <div className="text-xs text-white/70 mb-1">✨</div>
                      <div className="text-xs text-white">Blur</div>
                    </button>
                    <button className="p-3 bg-[#111] rounded-lg border border-[#333] hover:bg-[#333] transition-colors text-center">
                      <div className="text-xs text-white/70 mb-1">🔆</div>
                      <div className="text-xs text-white">Brightness</div>
                    </button>
                    <button className="p-3 bg-[#111] rounded-lg border border-[#333] hover:bg-[#333] transition-colors text-center">
                      <div className="text-xs text-white/70 mb-1">📱</div>
                      <div className="text-xs text-white">Vintage</div>
                    </button>
                  </div>
                </div>

                {/* Quick Actions Panel - Always visible */}
                <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                  <h3 className="font-semibold mb-3 text-white flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Actions
                  </h3>
                  <div className="space-y-2">
                  <button
                      onClick={() => setShowMediaPanel(true)}
                      className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Add Media
                  </button>
                  <button
                      onClick={() => setShowVoiceRecorder(true)}
                      className="w-full px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors flex items-center justify-center gap-2 border border-red-600/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      Record Voice
                    </button>
                    <button 
                      onClick={() => setShowPromptPanel(true)}
                      className="w-full px-3 py-2 bg-purple-600/20 text-purple-400 rounded-lg text-sm hover:bg-purple-600/30 transition-colors flex items-center justify-center gap-2 border border-purple-600/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      AI Prompt
                  </button>
                </div>
              </div>
            </div>
            </div>
            )}
          </div>

          {/* Export Modal */}
          <ExportModal 
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            onExport={handleExport}
            isExporting={isExporting}
          />

          {/* Save Project Modal */}
          <SaveProjectModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onSave={handleSaveProject}
            isSaving={isSaving}
            initialTitle={projectTitle}
            initialDescription={projectDescription}
          />
        </>
      )}
    </div>
  );
} 