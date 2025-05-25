'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
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
          <h2 className="text-xl font-semibold text-white">Export Video</h2>
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
            <option value="mp4">MP4 Video (Recommended)</option>
            <option value="webm">WebM Video</option>
            <option value="gif">GIF Animation (Coming Soon)</option>
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
            <option value="high">High Quality (1080p)</option>
            <option value="medium">Medium Quality (720p)</option>
            <option value="low">Low Quality (480p)</option>
          </select>
        </div>

        {selectedFormat === 'gif' && (
          <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              ⚠️ GIF export is coming soon. Please use MP4 or WebM for now.
            </p>
          </div>
        )}
        
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
            disabled={isExporting || selectedFormat === 'gif'}
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
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Video
              </>
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

// Add after AudioClip interface
type TextOverlay = {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: 'top' | 'center' | 'bottom';
  fontSize: number;
};

// Component to handle search params
function EditorWithSearchParams() {
  const searchParams = useSearchParams();
  const promptParam = searchParams ? searchParams.get('prompt') || '' : '';
  const projectIdParam = searchParams ? searchParams.get('projectId') : null;
  
  return <EditorPageContent promptParam={promptParam} projectIdParam={projectIdParam} />;
}

// Main editor component
function EditorPageContent({ promptParam, projectIdParam }: { promptParam: string; projectIdParam: string | null }) {
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
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showAutoSaveNotification, setShowAutoSaveNotification] = useState(false);
  
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
  
  // Text overlay state
  const [textOverlays, setTextOverlays] = useState<TextOverlay[]>([]);
  const [showTextOverlayModal, setShowTextOverlayModal] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState<TextOverlay | null>(null);
  const [editingOverlayDraft, setEditingOverlayDraft] = useState<Partial<TextOverlay>>({ text: '', startTime: 0, endTime: 0, position: 'center', fontSize: 32 });
  const [showTextOverlayPanel, setShowTextOverlayPanel] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimeRef = useRef<number>(0);
  
  // Backend URL with fallback
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  
  console.log('🔧 Editor page initialized with backend URL:', backendUrl);
  console.log('🔧 Environment check:', {
    hasBackendUrl: !!process.env.NEXT_PUBLIC_BACKEND_URL,
    backendUrlValue: process.env.NEXT_PUBLIC_BACKEND_URL,
    fallbackUsed: !process.env.NEXT_PUBLIC_BACKEND_URL
  });

  // Helper function to get the correct video URL
  const getVideoUrl = (url: string | null) => {
    if (!url) return '';
    // If URL already starts with http, use it as-is (Supabase direct URL)
    if (url.startsWith('http')) {
      console.log('🔗 Using absolute URL:', url);
      return url;
    }
    // Otherwise, prepend backend URL
    const fullUrl = `${backendUrl}${url}`;
    console.log('🔗 Constructed URL:', { original: url, backend: backendUrl, full: fullUrl });
    return fullUrl;
  };

  // Animation scenes data for the timeline
  const [scenes, setScenes] = useState<any[]>([]);
  
  // Auto-save key for localStorage
  const AUTO_SAVE_KEY = 'pixelateai_timeline_autosave';
  
  // Auto-save function to save entire timeline state
  const saveTimelineState = () => {
    setAutoSaveStatus('saving');
    
    const timelineState = {
      timestamp: Date.now(),
      projectTitle,
      projectDescription,
      prompt,
      scenes,
      timelineClips,
      audioClips,
      textOverlays,
      clips, // Available clips in the media library
      currentTime,
      totalDuration,
      // Add any other state that should be preserved
      version: '1.0' // For future compatibility
    };
    
    try {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(timelineState));
      const saveTime = new Date();
      setLastAutoSave(saveTime);
      setAutoSaveStatus('saved');
      console.log('💾 Auto-saved timeline state at', saveTime.toLocaleTimeString());
      
      // Reset status after 2 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('❌ Failed to auto-save timeline state:', error);
      setAutoSaveStatus('error');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setAutoSaveStatus('idle');
      }, 3000);
    }
  };
  
  // Load timeline state from localStorage
  const loadTimelineState = () => {
    try {
      const savedState = localStorage.getItem(AUTO_SAVE_KEY);
      if (savedState) {
        const timelineState = JSON.parse(savedState);
        console.log('📂 Loading auto-saved timeline state from', new Date(timelineState.timestamp).toLocaleString());
        
        // Restore all state
        setProjectTitle(timelineState.projectTitle || 'My First Vlog');
        setProjectDescription(timelineState.projectDescription || '');
        setPrompt(timelineState.prompt || '');
        setScenes(timelineState.scenes || []);
        setTimelineClips(timelineState.timelineClips || []);
        setAudioClips(timelineState.audioClips || []);
        setTextOverlays(timelineState.textOverlays || []);
        setClips(timelineState.clips || []);
        setCurrentTime(timelineState.currentTime || 0);
        setTotalDuration(timelineState.totalDuration || 30);
        setLastAutoSave(new Date(timelineState.timestamp));
        
        // Show notification that auto-saved state was loaded
        setShowAutoSaveNotification(true);
        setTimeout(() => {
          setShowAutoSaveNotification(false);
        }, 5000); // Hide after 5 seconds
        
        return true; // Successfully loaded
      }
    } catch (error) {
      console.error('❌ Failed to load auto-saved timeline state:', error);
    }
    return false; // No saved state or error
  };
  
  // Clear auto-save (useful for starting fresh)
  const clearAutoSave = () => {
    localStorage.removeItem(AUTO_SAVE_KEY);
    console.log('🗑️ Cleared auto-saved timeline state');
  };
  
  // Clear entire timeline - everything
  const clearEntireTimeline = () => {
    console.log('🗑️ Clearing entire timeline...');
    
    // Clear all timeline content
    setTimelineClips([]);
    setAudioClips([]);
    setTextOverlays([]);
    setScenes([]);
    setClips([]);
    
    // Reset playback state
    setCurrentTime(0);
    setTotalDuration(30);
    setIsPlaying(false);
    setSelectedClip(null);
    
    // Reset UI state
    setShowPromptPanel(false);
    setShowMediaPanel(false);
    setShowVoiceRecorder(false);
    setShowTextOverlayPanel(false);
    
    // Reset recording state
    setIsRecording(false);
    setRecordingTime(0);
    recordingTimeRef.current = 0;
    
    // Stop any active recording
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    // Clear auto-save as well
    clearAutoSave();
    setLastAutoSave(null);
    setAutoSaveStatus('idle');
    
    console.log('✅ Timeline cleared completely');
  };
  
  // Load project data if projectId is provided
  useEffect(() => {
    if (projectIdParam) {
      const loadProject = async () => {
        setIsLoadingProject(true);
        try {
          // First check if project data is in sessionStorage (from projects page)
          const loadProjectData = sessionStorage.getItem('loadProjectData');
          
          if (loadProjectData) {
            console.log('📂 Loading project from sessionStorage');
            const project = JSON.parse(loadProjectData);
            
            // Load all project data
            setProjectId(project.id);
            setProjectTitle(project.title);
            setProjectDescription(project.description || '');
            setPrompt(project.prompt || '');
            setScenes(project.scenes || []);
            setClips(project.clips || []);
            setTimelineClips(project.timelineClips || []);
            setAudioClips(project.audioClips || []);
            setTextOverlays(project.textOverlays || []);
            setCurrentTime(project.currentTime || 0);
            setTotalDuration(project.totalDuration || 30);
            
            // Clear sessionStorage after loading
            sessionStorage.removeItem('loadProjectData');
            console.log('✅ Project loaded successfully:', project.title);
            
          } else {
            // Fallback: try to load from localStorage directly
            console.log('📂 Loading project from localStorage');
            const projectsJson = localStorage.getItem('pixelateai_projects');
            
            if (projectsJson) {
              const projects = JSON.parse(projectsJson);
              const project = projects.find((p: any) => p.id === projectIdParam);
              
              if (project) {
                setProjectId(project.id);
                setProjectTitle(project.title);
                setProjectDescription(project.description || '');
                setPrompt(project.prompt || '');
                setScenes(project.scenes || []);
                setClips(project.clips || []);
                setTimelineClips(project.timelineClips || []);
                setAudioClips(project.audioClips || []);
                setTextOverlays(project.textOverlays || []);
                setCurrentTime(project.currentTime || 0);
                setTotalDuration(project.totalDuration || 30);
                console.log('✅ Project loaded from localStorage:', project.title);
              } else {
                console.warn('⚠️ Project not found in localStorage:', projectIdParam);
              }
            } else {
              console.warn('⚠️ No projects found in localStorage');
            }
          }
        } catch (error) {
          console.error('❌ Error loading project:', error);
        } finally {
          setIsLoadingProject(false);
        }
      };
      
      loadProject();
    } else {
      // No project ID provided, try to load auto-saved state first
      const hasAutoSave = loadTimelineState();
      
      if (!hasAutoSave) {
        // No auto-save found, check for session storage (new project data)
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
    }
  }, [projectIdParam]);
  
  // Auto-save interval - save every 5 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      // Only auto-save if there's meaningful content
      if (timelineClips.length > 0 || audioClips.length > 0 || textOverlays.length > 0 || scenes.length > 0 || prompt.trim()) {
        saveTimelineState();
      }
    }, 5000); // 5 seconds
    
    // Save immediately when any important state changes
    const timeoutId = setTimeout(() => {
      if (timelineClips.length > 0 || audioClips.length > 0 || textOverlays.length > 0 || scenes.length > 0 || prompt.trim()) {
        saveTimelineState();
      }
    }, 1000); // 1 second delay after state change
    
    return () => {
      clearInterval(autoSaveInterval);
      clearTimeout(timeoutId);
    };
  }, [timelineClips, audioClips, textOverlays, scenes, prompt, projectTitle, projectDescription, currentTime]);
  
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
    
    // Check if we've reached the end of all content
    const lastVideoClip = timelineClips
      .filter(clip => clip.type === 'video')
      .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
    const lastAudioClip = audioClips
      .sort((a, b) => b.endTime - a.endTime)[0];
    
    const contentEndTime = Math.max(
      lastVideoClip?.endTime || 0,
      lastAudioClip?.endTime || 0,
      totalDuration
    );
    
    // If we've reached the end of content, stop playing
    if (time >= contentEndTime && isPlaying) {
      console.log('🛑 Editor: Reached end of content, stopping playback at', time);
      setIsPlaying(false);
    }
  };

  const handleLoadedMetadata = (duration: number) => {
    setTotalDuration(duration);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const formatTimeFromSeconds = (seconds: number): string => {
    // Handle invalid values
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      console.warn('⚠️ formatTimeFromSeconds: Invalid seconds value:', seconds, 'using 0 instead');
      seconds = 0;
    }
    
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
    
    // Clear existing scenes immediately when starting regeneration
    setScenes([]);
    
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
        } else {
          // If no scenes returned, keep them cleared
          setScenes([]);
        }
        
        // Update clips if returned from the backend
        if (responseData.clips) {
          setClips(responseData.clips);
        }
      } else {
        console.error('Error from backend:', response.data.error);
        // Keep scenes cleared even on error
        setScenes([]);
      }
      
    } catch (error) {
      console.error('Error regenerating animation:', error);
      // Keep scenes cleared even on error
      setScenes([]);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleExport = async (format: string, quality: string) => {
    setIsExporting(true);
    
    try {
      console.log(`🎬 Starting export in ${format} format with ${quality} quality`);
      
      // Check if we have any content to export
      if (timelineClips.length === 0 && audioClips.length === 0 && scenes.length === 0) {
        alert('No content found to export. Please add video clips, audio, or generate scenes first.');
        setIsExporting(false);
        return;
      }
      
      // Set canvas dimensions based on quality
      let width = 1920, height = 1080; // Default high quality
      if (quality === 'medium') {
        width = 1280;
        height = 720;
      } else if (quality === 'low') {
        width = 854;
        height = 480;
      }

      // Check MediaRecorder support
      if (!MediaRecorder.isTypeSupported('video/webm') && !MediaRecorder.isTypeSupported('video/mp4')) {
        console.error('❌ MediaRecorder not supported');
        alert('Video export is not supported in your browser. Please try using Chrome or Firefox.');
        setIsExporting(false);
        return;
      }

      // Create a canvas for rendering
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Could not get canvas context');
        alert('Export failed: Canvas not supported in your browser');
        setIsExporting(false);
        return;
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // Create MediaRecorder for video capture
      const stream = canvas.captureStream(30); // 30 FPS
      
      const mimeType = format === 'webm' ? 'video/webm' : 'video/mp4';
      const supportedMimeType = MediaRecorder.isTypeSupported(mimeType) ? mimeType : 'video/webm';
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: supportedMimeType,
        videoBitsPerSecond: quality === 'high' ? 8000000 : quality === 'medium' ? 4000000 : 2000000
      });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: supportedMimeType });
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const a = document.createElement('a');
        a.href = url;
        const fileExtension = supportedMimeType.includes('webm') ? 'webm' : 'mp4';
        a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.${fileExtension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Cleanup
        URL.revokeObjectURL(url);
        
        console.log('✅ Export completed successfully');
        setIsExporting(false);
        setShowExportModal(false);
        
        // Show success message
        alert(`Video exported successfully as ${a.download}!`);
      };

      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
        alert('Export failed during recording. Please try again.');
        setIsExporting(false);
        setShowExportModal(false);
      };

      // Start recording
      mediaRecorder.start(100); // Collect data every 100ms
      
      // Create a map of video elements for each clip
      const videoElements = new Map<string, HTMLVideoElement>();
      
      // Preload all video clips for export
      const videoClips = timelineClips.filter(clip => clip.type === 'video' && clip.url);
      
      if (videoClips.length > 0) {
        console.log(`📹 Preloading ${videoClips.length} video clips for export...`);
        
        const loadPromises = videoClips.map(clip => {
          return new Promise<void>((resolve, reject) => {
            const video = document.createElement('video');
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.preload = 'auto';
            
            video.onloadeddata = () => {
              console.log(`✅ Loaded video for export: ${clip.name}`);
              videoElements.set(clip.id, video);
              resolve();
            };
            
            video.onerror = () => {
              console.error(`❌ Failed to load video for export: ${clip.name}`);
              reject(new Error(`Failed to load video: ${clip.name}`));
            };
            
            video.src = clip.url!;
          });
        });
        
        try {
          await Promise.all(loadPromises);
          console.log('✅ All videos loaded for export');
        } catch (error) {
          console.error('❌ Failed to load some videos for export:', error);
          alert('Failed to load some videos for export. The export may be incomplete.');
        }
      }

      // Reset video to beginning and start playback
      setCurrentTime(0);
      setIsPlaying(true);
      
      // Export duration - calculate actual content end time
      const lastVideoClip = timelineClips
        .filter(clip => clip.type === 'video')
        .sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0];
      const lastAudioClip = audioClips
        .sort((a, b) => b.endTime - a.endTime)[0];
      const lastTextOverlay = textOverlays
        .sort((a, b) => b.endTime - a.endTime)[0];
      
      const contentEndTime = Math.max(
        lastVideoClip?.endTime || 0,
        lastAudioClip?.endTime || 0,
        lastTextOverlay?.endTime || 0,
        5 // Minimum 5 seconds
      );
      
      const exportDuration = contentEndTime; // Use actual content end time, not totalDuration
      const frameRate = 30;
      const totalFrames = Math.floor(exportDuration * frameRate);
      let currentFrame = 0;
      
      console.log(`🎬 Starting export: ${exportDuration}s (content ends at ${contentEndTime}s), ${totalFrames} frames`, {
        lastVideoEnd: lastVideoClip?.endTime || 0,
        lastAudioEnd: lastAudioClip?.endTime || 0,
        lastTextEnd: lastTextOverlay?.endTime || 0,
        totalDuration: totalDuration,
        exportDuration: exportDuration
      });
      
      // Function to render a frame at a specific time
      const renderFrame = (time: number) => {
        // Clear canvas with black background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        
        // Find active video clip at this time
        const activeClip = timelineClips.find(clip => 
          clip.type === 'video' && 
          (clip.startTime || 0) <= time && 
          (clip.endTime || 0) > time
        );
        
        if (activeClip && videoElements.has(activeClip.id)) {
          const video = videoElements.get(activeClip.id)!;
          
          // Calculate time within the clip
          const clipStartTime = activeClip.startTime || 0;
          const timeInClip = time - clipStartTime;
          
          // Set video time
          video.currentTime = timeInClip;
          
          // Draw video frame if it has dimensions
          if (video.videoWidth > 0 && video.videoHeight > 0) {
            const videoAspectRatio = video.videoWidth / video.videoHeight;
            const canvasAspectRatio = width / height;
            
            let drawWidth = width;
            let drawHeight = height;
            let offsetX = 0;
            let offsetY = 0;
            
            if (videoAspectRatio > canvasAspectRatio) {
              drawHeight = width / videoAspectRatio;
              offsetY = (height - drawHeight) / 2;
            } else {
              drawWidth = height * videoAspectRatio;
              offsetX = (width - drawWidth) / 2;
            }
            
            ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
          }
        } else {
          // No video clip active, draw a placeholder or project info
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, width, height);
          
          // Draw project title
          ctx.fillStyle = 'white';
          ctx.font = `bold ${Math.floor(width / 30)}px Arial`;
          ctx.textAlign = 'center';
          ctx.fillText(projectTitle, width / 2, height / 2);
          
          // Draw time indicator
          ctx.font = `${Math.floor(width / 50)}px Arial`;
          ctx.fillText(`${Math.floor(time)}s / ${Math.floor(exportDuration)}s`, width / 2, height / 2 + 60);
        }
        
        // Draw text overlays
        textOverlays.forEach(overlay => {
          if (time >= overlay.startTime && time <= overlay.endTime) {
            ctx.fillStyle = 'white';
            ctx.font = `bold ${Math.floor(overlay.fontSize * (width / 1920))}px Arial`;
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'black';
            ctx.lineWidth = 3;
            
            let textY = height * 0.15; // top
            if (overlay.position === 'center') textY = height * 0.5;
            if (overlay.position === 'bottom') textY = height * 0.85;
            
            // Draw text with outline
            ctx.strokeText(overlay.text, width / 2, textY);
            ctx.fillText(overlay.text, width / 2, textY);
          }
        });
      };
      
      // Animation loop for export
      const exportFrame = () => {
        const time = (currentFrame / frameRate);
        
        if (time <= exportDuration) {
          renderFrame(time);
          currentFrame++;
          
          // Continue to next frame
          setTimeout(exportFrame, 1000 / frameRate); // Maintain frame rate
        } else {
          // Export complete
          console.log('🎬 Export rendering complete, stopping recorder...');
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
          
          // Cleanup video elements
          videoElements.forEach(video => {
            video.src = '';
          });
          videoElements.clear();
        }
      };
      
      // Start the export animation
      exportFrame();
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Alternative export method for when video capture fails
  const handleAlternativeExport = async (format: string, quality: string) => {
    try {
      console.log('🔄 Using alternative export method');
      
      // Create a simple video file with project information
      const projectData = {
        title: projectTitle,
        description: projectDescription,
        clips: timelineClips.length,
        audioClips: audioClips.length,
        textOverlays: textOverlays.length,
        duration: totalDuration,
        exportedAt: new Date().toISOString()
      };
      
      const jsonBlob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(jsonBlob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_project_data.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      alert('Video export not available. Project data has been exported instead. Please use a modern browser with video recording support for full video export.');
      
    } catch (error) {
      console.error('❌ Alternative export failed:', error);
      alert('Export failed completely. Please check your browser compatibility.');
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handleSaveProject = async (title: string, description: string) => {
    setIsSaving(true);
    
    try {
      // Generate unique project ID if not exists
      const newProjectId = projectId || `project-${Date.now()}`;
      
      // Prepare comprehensive project data
      const projectData = {
        id: newProjectId,
        title,
        description,
        prompt,
        scenes,
        clips,
        timelineClips,
        audioClips,
        textOverlays,
        currentTime,
        totalDuration,
        createdAt: projectId ? undefined : new Date().toISOString(), // Only set on creation
        updatedAt: new Date().toISOString(),
        version: '1.0'
      };
      
      // Get existing projects from localStorage
      const existingProjectsJson = localStorage.getItem('pixelateai_projects');
      const existingProjects = existingProjectsJson ? JSON.parse(existingProjectsJson) : [];
      
      // Check if project already exists (update) or is new (create)
      const existingProjectIndex = existingProjects.findIndex((p: any) => p.id === newProjectId);
      
      if (existingProjectIndex >= 0) {
        // Update existing project
        existingProjects[existingProjectIndex] = {
          ...existingProjects[existingProjectIndex],
          ...projectData
        };
        console.log('📝 Updated existing project:', title);
      } else {
        // Add new project
        projectData.createdAt = new Date().toISOString();
        existingProjects.push(projectData);
        console.log('✨ Created new project:', title);
      }
      
      // Save back to localStorage
      localStorage.setItem('pixelateai_projects', JSON.stringify(existingProjects));
      
      // Update component state
      setProjectTitle(title);
      setProjectDescription(description);
      setProjectId(newProjectId);
      setShowSaveModal(false);
      
      // Show success notification
      console.log('💾 Project saved successfully to local storage');
      
    } catch (error) {
      console.error('❌ Error saving project to local storage:', error);
      // You could add a toast notification here for user feedback
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate total duration when clips change
  useEffect(() => {
    const maxVideoTime = timelineClips.length > 0 
      ? Math.max(...timelineClips.map(clip => {
          const endTime = clip.endTime || 0;
          return typeof endTime === 'number' && !isNaN(endTime) ? endTime : 0;
        }))
      : 0;
    const maxAudioTime = audioClips.length > 0 
      ? Math.max(...audioClips.map(clip => {
          const endTime = clip.endTime;
          return typeof endTime === 'number' && !isNaN(endTime) ? endTime : 0;
        }))
      : 0;
    const maxSceneTime = scenes.length > 0 
      ? scenes.reduce((acc, scene, index) => {
          const duration = scene.duration / 1000;
          return acc + (typeof duration === 'number' && !isNaN(duration) ? duration : 0);
        }, 0)
      : 0;
      
    const calculatedDuration = Math.max(maxVideoTime, maxAudioTime, maxSceneTime, 30);
    
    // Ensure the calculated duration is always a valid positive number
    const safeDuration = typeof calculatedDuration === 'number' && !isNaN(calculatedDuration) && calculatedDuration > 0 
      ? calculatedDuration 
      : 30;
    
    setTotalDuration(safeDuration);
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
      
      // Split video at playhead position with Ctrl+X or Cmd+X
      if (e.key === 'x' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        
        // Find the video clip that the playhead is currently over
        const activeVideoClip = timelineClips.find(clip => 
          clip.type === 'video' && 
          (clip.startTime || 0) <= currentTime && 
          (clip.endTime || 0) > currentTime
        );
        
        if (activeVideoClip) {
          // Calculate the split time relative to the clip's start
          const splitTimeInClip = currentTime - (activeVideoClip.startTime || 0);
          
          // Only split if the playhead is not at the very beginning or end of the clip
          const clipDuration = (activeVideoClip.endTime || 0) - (activeVideoClip.startTime || 0);
          if (splitTimeInClip > 0.1 && splitTimeInClip < clipDuration - 0.1) {
            console.log('🔪 Splitting video clip at playhead position:', {
              clipId: activeVideoClip.id,
              clipName: activeVideoClip.name,
              currentTime: currentTime,
              clipStartTime: activeVideoClip.startTime,
              splitTimeInClip: splitTimeInClip,
              clipDuration: clipDuration
            });
            
            handleTimelineClipCut(activeVideoClip.id, splitTimeInClip);
          } else {
            console.log('⚠️ Cannot split: playhead too close to clip boundaries');
          }
        } else {
          console.log('⚠️ No video clip found at current playhead position:', currentTime);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedClip, timelineClips, isPlaying, currentTime]);

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
        let duration = audio.duration;
        
        // Ensure duration is a valid positive number
        if (typeof duration !== 'number' || isNaN(duration) || duration <= 0) {
          console.warn('⚠️ Invalid audio file duration, using default 10 seconds');
          duration = 10; // Default to 10 seconds
        }
        
        const newAudioClip: AudioClip = {
          id: `audio-${Date.now()}`,
          name: file.name,
          duration: duration,
          url,
          file,
          startTime: 0,
          endTime: duration
        };
        
        setAudioClips(prev => [...prev, newAudioClip]);
      };
      
      audio.onerror = () => {
        console.error('❌ Error loading audio file metadata');
        // Create clip with default duration if metadata loading fails
        const defaultDuration = 10;
        const newAudioClip: AudioClip = {
          id: `audio-${Date.now()}`,
          name: file.name,
          duration: defaultDuration,
          url,
          file,
          startTime: 0,
          endTime: defaultDuration
        };
        
        setAudioClips(prev => [...prev, newAudioClip]);
      };
      
      audio.src = url;
    }
  };

  const handleGalleryVideoSelect = (video: any) => {
    // Use the helper function to get the correct video URL
    const fullVideoUrl = getVideoUrl(video.video_url);
    const fullThumbnailUrl = video.thumbnail ? getVideoUrl(video.thumbnail) : '';
    
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
      
      // Try different formats in order of preference
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'audio/mp4';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'audio/wav';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = ''; // Let browser choose
            }
          }
        }
      }
      
      console.log('🎙️ Using audio format:', mimeType || 'browser default');
      
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('📊 Recording data available:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped, processing', chunks.length, 'chunks');
        console.log('⏱️ Recording time values at onstop:', {
          recordingTimeState: recordingTime,
          recordingTimeRef: recordingTimeRef.current,
          willUseRef: true
        });
        
        const finalMimeType = mediaRecorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: finalMimeType });
        const url = URL.createObjectURL(blob);
        
        console.log('🎵 Created audio blob:', {
          size: blob.size,
          type: blob.type,
          detectedMimeType: finalMimeType,
          timerDuration: recordingTimeRef.current,
          url: url.substring(0, 50) + '...'
        });
        
        // Create audio element to get actual duration
        const audio = document.createElement('audio');
        audio.src = url;
        
        audio.onloadedmetadata = () => {
          const actualDuration = audio.duration;
          const currentRecordingTime = recordingTimeRef.current;
          console.log('⏱️ Audio duration comparison:', {
            timerDuration: currentRecordingTime,
            actualDuration: actualDuration,
            difference: Math.abs(actualDuration - currentRecordingTime)
          });
          
          // Use the actual audio duration instead of timer, with validation
          let finalDuration = actualDuration || currentRecordingTime;
          
          // Ensure duration is a valid positive number
          if (typeof finalDuration !== 'number' || isNaN(finalDuration) || finalDuration < 0) {
            console.warn('⚠️ Invalid audio duration detected, using timer duration:', finalDuration);
            finalDuration = currentRecordingTime > 0 ? currentRecordingTime : 1; // Minimum 1 second
          }
          
          console.log('🎵 Final duration calculation:', {
            actualDuration,
            recordingTime: currentRecordingTime,
            finalDuration,
            formattedTime: formatTime(finalDuration),
            isValidNumber: typeof finalDuration === 'number' && !isNaN(finalDuration) && finalDuration > 0
          });
          
          // Check if this is a voiceover for timeline
          const voiceoverStartTime = sessionStorage.getItem('voiceoverStartTime');
          
          if (voiceoverStartTime) {
            const startTime = parseFloat(voiceoverStartTime);
            // Validate startTime as well
            const validStartTime = typeof startTime === 'number' && !isNaN(startTime) ? startTime : 0;
            
            const newAudioClip: AudioClip = {
              id: `voiceover-${Date.now()}`,
              name: `Voiceover ${formatTime(finalDuration)}`,
              duration: finalDuration,
              url,
              startTime: validStartTime,
              endTime: validStartTime + finalDuration
            };
            
            console.log('✅ Created voiceover clip:', {
              ...newAudioClip,
              calculatedWidth: `${(newAudioClip.endTime - newAudioClip.startTime) * 100}px`,
              durationDifference: newAudioClip.endTime - newAudioClip.startTime
            });
            setAudioClips(prev => [...prev, newAudioClip]);
            sessionStorage.removeItem('voiceoverStartTime');
            setShowVoiceRecorder(false);
          } else {
            const newAudioClip: AudioClip = {
              id: `recording-${Date.now()}`,
              name: `Voice Recording ${formatTime(finalDuration)}`,
              duration: finalDuration,
              url,
              startTime: 0,
              endTime: finalDuration
            };
            
            console.log('✅ Created voice recording clip:', {
              ...newAudioClip,
              calculatedWidth: `${(newAudioClip.endTime - newAudioClip.startTime) * 100}px`,
              durationDifference: newAudioClip.endTime - newAudioClip.startTime
            });
            setAudioClips(prev => [...prev, newAudioClip]);
          }
          
          // Reset the recording state after successful clip creation (fallback case)
          setIsRecording(false);
          setRecordingTime(0);
          recordingTimeRef.current = 0;
          
          audio.remove();
        };
        
        audio.onerror = () => {
          console.error('❌ Error loading audio metadata, using timer duration');
          // Fallback to timer duration if audio loading fails
          const currentRecordingTime = recordingTimeRef.current;
          let fallbackDuration = currentRecordingTime;
          
          // Ensure fallback duration is valid
          if (typeof fallbackDuration !== 'number' || isNaN(fallbackDuration) || fallbackDuration < 0) {
            console.warn('⚠️ Invalid timer duration, using default 1 second');
            fallbackDuration = 1; // Minimum 1 second
          }
          
          console.log('🎵 Fallback duration calculation:', {
            recordingTime: currentRecordingTime,
            fallbackDuration,
            formattedTime: formatTime(fallbackDuration),
            isValidNumber: typeof fallbackDuration === 'number' && !isNaN(fallbackDuration) && fallbackDuration > 0
          });
          
          const voiceoverStartTime = sessionStorage.getItem('voiceoverStartTime');
          
          if (voiceoverStartTime) {
            const startTime = parseFloat(voiceoverStartTime);
            const validStartTime = typeof startTime === 'number' && !isNaN(startTime) ? startTime : 0;
            
            const newAudioClip: AudioClip = {
              id: `voiceover-${Date.now()}`,
              name: `Voiceover ${formatTime(fallbackDuration)}`,
              duration: fallbackDuration,
              url,
              startTime: validStartTime,
              endTime: validStartTime + fallbackDuration
            };
            
            console.log('✅ Created fallback voiceover clip:', {
              ...newAudioClip,
              calculatedWidth: `${(newAudioClip.endTime - newAudioClip.startTime) * 100}px`,
              durationDifference: newAudioClip.endTime - newAudioClip.startTime
            });
            setAudioClips(prev => [...prev, newAudioClip]);
            sessionStorage.removeItem('voiceoverStartTime');
            setShowVoiceRecorder(false);
          } else {
            const newAudioClip: AudioClip = {
              id: `recording-${Date.now()}`,
              name: `Voice Recording ${formatTime(fallbackDuration)}`,
              duration: fallbackDuration,
              url,
              startTime: 0,
              endTime: fallbackDuration
            };
            
            console.log('✅ Created fallback voice recording clip:', {
              ...newAudioClip,
              calculatedWidth: `${(newAudioClip.endTime - newAudioClip.startTime) * 100}px`,
              durationDifference: newAudioClip.endTime - newAudioClip.startTime
            });
            setAudioClips(prev => [...prev, newAudioClip]);
          }
          
          // Reset the recording state after successful clip creation (fallback case)
          setIsRecording(false);
          setRecordingTime(0);
          recordingTimeRef.current = 0;
          
          audio.remove();
        };
        
        // Load the audio to get metadata
        audio.load();
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      
      // Start recording with data collection every 100ms for better capture
      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimeRef.current = 0; // Initialize ref
      
      console.log('🎙️ Started recording with format:', mediaRecorder.mimeType);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          recordingTimeRef.current = newTime; // Keep ref in sync
          console.log('⏱️ Timer tick - Recording time:', newTime, 'seconds (state will be:', newTime, ', ref is:', recordingTimeRef.current, ')');
          return newTime;
        });
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    // LOG EVERYTHING FIRST - before any processing
    console.log('🚨 STOP BUTTON CLICKED - Current time values:');
    console.log('📊 recordingTime state:', recordingTime);
    console.log('📊 recordingTimeRef.current:', recordingTimeRef.current);
    console.log('📊 isRecording:', isRecording);
    console.log('📊 mediaRecorderRef.current exists:', !!mediaRecorderRef.current);
    console.log('📊 recordingTimerRef.current exists:', !!recordingTimerRef.current);
    
    console.log('🛑 Stopping recording...');
    if (mediaRecorderRef.current && isRecording) {
      console.log('📊 MediaRecorder state:', mediaRecorderRef.current.state);
      console.log('⏱️ Final recording time before stop:', recordingTimeRef.current, 'seconds');
      console.log('⏱️ Recording time state before stop:', recordingTime, 'seconds');
      
      // Stop the media recorder (this will trigger the onstop callback)
      mediaRecorderRef.current.stop();
      
      // Clear the timer immediately to stop counting
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      // DON'T reset isRecording or recordingTime here - let the onstop callback handle it
      // This ensures the values are preserved when the audio clip is created
      
      console.log('✅ Recording stop initiated, waiting for onstop callback...');
    } else {
      console.log('⚠️ No active recording to stop');
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
      
      // If timeline is empty, always start at 0
      if (sortedClips.length === 0) {
        startTime = 0;
        console.log('Timeline: Empty timeline, placing clip at start (0s)');
      } else {
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
              console.log('Timeline: Placing clip in gap at', startTime, 's');
              break;
            }
          }
          
          // Move to after this clip
          startTime = clipEnd;
        }
        console.log('Timeline: Placing clip after existing clips at', startTime, 's');
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
        endTime: newTimelineClip.endTime,
        originalClipUrl: draggedClip.url,
        urlType: newTimelineClip.url?.startsWith('http') ? 'absolute' : 'relative'
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
    // Handle invalid values - only reject NaN, Infinity, and negative numbers
    if (typeof seconds !== 'number' || isNaN(seconds) || !isFinite(seconds) || seconds < 0) {
      console.warn('⚠️ formatTime: Invalid seconds value:', seconds, 'using 0 instead');
      seconds = 0;
    }
    
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

  // At the top of EditorPageContent (after useState declarations)
  console.log('🔄 EditorPageContent render:', {
    isRecording,
    recordingTime,
    recordingTimeRef: recordingTimeRef.current
  });

  // In startRecording, at the very top
  console.log('🚦 startRecording called. isRecording:', isRecording, 'recordingTime:', recordingTime, 'recordingTimeRef:', recordingTimeRef.current);

  // In startRecording, after setInterval
  console.log('⏰ setInterval created for timer.');

  // In stopRecording, after clearInterval
  console.log('⏰ setInterval cleared for timer.');

  const openTextOverlayModal = (overlay?: TextOverlay) => {
    if (overlay) {
      setEditingOverlay(overlay);
      setEditingOverlayDraft({ ...overlay });
    } else {
      setEditingOverlay(null);
      setEditingOverlayDraft({ text: '', startTime: 0, endTime: 0, position: 'center', fontSize: 32 });
    }
    setShowTextOverlayModal(true);
  };

  const handleSaveTextOverlay = () => {
    const overlay = { ...editingOverlayDraft } as TextOverlay;
    if (editingOverlay) {
      overlay.id = editingOverlay.id;
      setTextOverlays(prev => prev.map(o => o.id === overlay.id ? overlay : o));
    } else {
      overlay.id = `text-${Date.now()}`;
      setTextOverlays(prev => [...prev, overlay]);
    }
    setShowTextOverlayModal(false);
    setEditingOverlay(null);
  };

  const handleDeleteTextOverlay = (id: string) => {
    setTextOverlays(prev => prev.filter(o => o.id !== id));
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
              <button 
                onClick={() => window.location.href = '/projects'}
                className="px-3 py-2 bg-[#222] text-white/70 rounded-lg hover:bg-[#333] hover:text-white transition-colors border border-[#333] flex items-center gap-2"
                title="View all projects"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Projects
              </button>
              <div className="text-lg font-semibold text-white">{projectTitle}</div>
              <div className="text-sm text-white/50">Video Editor</div>
              
              {/* Auto-save status indicator */}
              <div className="flex items-center gap-2 text-xs">
                {autoSaveStatus === 'saving' && (
                  <div className="flex items-center gap-1 text-yellow-400">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                    <span>Saving...</span>
                  </div>
                )}
                {autoSaveStatus === 'saved' && (
                  <div className="flex items-center gap-1 text-green-400">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Auto-saved</span>
                  </div>
                )}
                {autoSaveStatus === 'error' && (
                  <div className="flex items-center gap-1 text-red-400">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <span>Save failed</span>
                  </div>
                )}
                {autoSaveStatus === 'idle' && lastAutoSave && (
                  <div className="text-white/40">
                    Last saved: {lastAutoSave.toLocaleTimeString()}
                  </div>
                )}
              </div>
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
              
              {/* Manual auto-save controls */}
              <button 
                onClick={saveTimelineState}
                className="px-3 py-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/30 transition-colors border border-blue-600/30 flex items-center gap-2"
                title="Save timeline now"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Save Now
              </button>
              
              <button 
                onClick={() => {
                  if (confirm('Clear entire timeline? This will remove ALL content including videos, audio, text overlays, and scenes. This action cannot be undone.')) {
                    clearEntireTimeline();
                  }
                }}
                className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors border border-red-600/30 flex items-center gap-2"
                title="Clear entire timeline - removes all content"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear
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
                title="Cut Tool - Manual split or use Ctrl+X to split at playhead"
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
                  textOverlays={textOverlays}
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
                    <button 
                      onClick={() => {
                        setIsPlaying(false);
                        handleSeek(0);
                      }}
                      className="p-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors border border-[#444]"
                      title="Stop and reset to beginning"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                      </svg>
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
                      
                      {/* Keyboard shortcuts hint */}
                      <span className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30">
                        💡 Ctrl+X: Split at playhead | Del: Delete selected
                      </span>
                      
                      {/* Debug button to seek to 0 */}
                      <button 
                        onClick={() => handleSeek(0)}
                        className="text-xs bg-blue-600/20 text-blue-400 px-2 py-1 rounded border border-blue-600/30 hover:bg-blue-600/30"
                        title="Seek to start"
                      >
                        ⏮ 0s
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={handleArrangeClips}
                      className="p-2 text-white/70 hover:text-white transition-colors bg-green-600/20 text-green-400 rounded border border-green-600/30"
                      title="Arrange clips from start (no gaps)"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                    <span className="text-xs text-white/40">
                      Clips: {timelineClips.length} | Videos: {timelineClips.filter(c => c.type === 'video').length}
                    </span>
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
                  onClipSelect={setSelectedClip}
                  selectedClipId={selectedClip?.id}
                  onAddVoiceover={handleAddVoiceover}
                  currentTime={currentTime}
                  totalDuration={typeof totalDuration === 'number' && !isNaN(totalDuration) && totalDuration > 0 ? totalDuration : 30}
                  onSeek={handleSeek}
                  textOverlays={textOverlays}
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
                  <button 
                    onClick={() => setShowTextOverlayPanel(!showTextOverlayPanel)}
                    className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                      showTextOverlayPanel 
                        ? 'bg-yellow-600/30 text-yellow-300 border border-yellow-600/50' 
                        : 'bg-[#222] text-white/50 hover:bg-[#333] border border-[#333]'
                    }`}
                  >
                    Text
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
                      className="w-full bg-[#111] border border-[#333] rounded-lg p-3 text-sm h-32 text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder:text-white/40"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe what you want to animate..."
                      style={{ color: '#ffffff' }}
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

                {/* Text Overlay Panel */}
                {showTextOverlayPanel && (
                  <div className="bg-[#222] border border-[#333] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-semibold text-white flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        Text Overlays
                      </h3>
                      <button 
                        onClick={() => setShowTextOverlayPanel(false)}
                        className="text-white/50 hover:text-white/70 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    
                    <button 
                      onClick={() => openTextOverlayModal()}
                      className="w-full mb-3 px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition-colors flex items-center justify-center gap-2 border border-yellow-600/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add Text Overlay
                    </button>
                    
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {textOverlays.length === 0 ? (
                        <div className="text-center py-6">
                          <div className="w-12 h-12 mx-auto mb-3 bg-[#111] rounded-full flex items-center justify-center border border-[#333]">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          </div>
                          <p className="text-white/50 text-sm">No text overlays</p>
                          <p className="text-white/30 text-xs mt-1">Click "Add Text Overlay" to get started</p>
                        </div>
                      ) : (
                        textOverlays.map((overlay) => (
                          <div
                            key={overlay.id}
                            className="bg-[#111] border border-[#333] rounded-lg p-3 hover:bg-[#333] transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                  📝 {overlay.text}
                                </div>
                                <div className="text-xs text-white/50 mt-1">
                                  {formatTime(overlay.startTime)} - {formatTime(overlay.endTime)}
                                </div>
                                <div className="text-xs text-white/40">
                                  Position: {overlay.position} • Size: {overlay.fontSize}px
                                </div>
                              </div>
                              <div className="flex space-x-1 ml-2">
                                <button
                                  onClick={() => openTextOverlayModal(overlay)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors p-1"
                                  title="Edit overlay"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteTextOverlay(overlay.id)}
                                  className="text-red-400 hover:text-red-300 transition-colors p-1"
                                  title="Delete overlay"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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
                  <button 
                      onClick={() => openTextOverlayModal()}
                      className="w-full px-3 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm hover:bg-yellow-600/30 transition-colors flex items-center justify-center gap-2 border border-yellow-600/30"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                      </svg>
                      Add Text
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
          
          {/* Auto-save notification */}
          {showAutoSaveNotification && (
            <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-in slide-in-from-right">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium">Timeline Restored</div>
                <div className="text-sm text-green-100">Auto-saved progress loaded successfully</div>
              </div>
              <button 
                onClick={() => setShowAutoSaveNotification(false)}
                className="ml-2 text-green-200 hover:text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Text Overlay Modal */}
          {showTextOverlayModal && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
              <div className="bg-[#222] border border-[#333] rounded-lg p-6 w-full max-w-md">
                <h2 className="text-lg font-semibold text-white mb-4">{editingOverlay ? 'Edit' : 'Add'} Text Overlay</h2>
                <form onSubmit={e => { e.preventDefault(); handleSaveTextOverlay(); }}>
                  <label className="block text-xs text-white/50 mb-1">Text</label>
                  <input
                    className="w-full mb-3 px-3 py-2 rounded bg-[#111] border border-[#333] text-white placeholder:text-white/40"
                    value={editingOverlayDraft.text || ''}
                    onChange={e => setEditingOverlayDraft(d => ({ ...d, text: e.target.value }))}
                    placeholder="Enter text to display..."
                    style={{ color: '#ffffff' }}
                    required
                  />
                  <div className="flex space-x-2 mb-3">
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Start Time (s)</label>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded bg-[#111] border border-[#333] text-white placeholder:text-white/40"
                        value={editingOverlayDraft.startTime ?? 0}
                        min={0}
                        onChange={e => setEditingOverlayDraft(d => ({ ...d, startTime: Number(e.target.value) }))}
                        style={{ color: '#ffffff' }}
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">End Time (s)</label>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded bg-[#111] border border-[#333] text-white placeholder:text-white/40"
                        value={editingOverlayDraft.endTime ?? 0}
                        min={0}
                        onChange={e => setEditingOverlayDraft(d => ({ ...d, endTime: Number(e.target.value) }))}
                        style={{ color: '#ffffff' }}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2 mb-4">
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Position</label>
                      <select
                        className="w-full px-2 py-1 rounded bg-[#111] border border-[#333] text-white"
                        value={editingOverlayDraft.position || 'center'}
                        onChange={e => setEditingOverlayDraft(d => ({ ...d, position: e.target.value as 'top' | 'center' | 'bottom' }))}
                        style={{ color: '#ffffff' }}
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-white/50 mb-1">Font Size</label>
                      <input
                        type="number"
                        className="w-full px-2 py-1 rounded bg-[#111] border border-[#333] text-white placeholder:text-white/40"
                        value={editingOverlayDraft.fontSize ?? 32}
                        min={8}
                        max={128}
                        onChange={e => setEditingOverlayDraft(d => ({ ...d, fontSize: Number(e.target.value) }))}
                        style={{ color: '#ffffff' }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button type="button" className="px-4 py-2 bg-[#333] text-white rounded hover:bg-[#444]" onClick={() => { setShowTextOverlayModal(false); setEditingOverlay(null); }}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 

// Loading component for Suspense fallback
function EditorLoading() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white/70">Loading Editor...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorWithSearchParams />
    </Suspense>
  );
}