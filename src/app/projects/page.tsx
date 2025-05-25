'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SavedProject {
  id: string;
  title: string;
  description: string;
  prompt: string;
  scenes: any[];
  clips: any[];
  timelineClips: any[];
  audioClips: any[];
  textOverlays: any[];
  currentTime: number;
  totalDuration: number;
  createdAt: string;
  updatedAt: string;
  version: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<SavedProject | null>(null);
  const router = useRouter();

  // Load projects from localStorage
  useEffect(() => {
    const loadProjects = () => {
      try {
        const projectsJson = localStorage.getItem('pixelateai_projects');
        if (projectsJson) {
          const loadedProjects = JSON.parse(projectsJson);
          // Sort by updatedAt (most recent first)
          const sortedProjects = loadedProjects.sort((a: SavedProject, b: SavedProject) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
          setProjects(sortedProjects);
          console.log('📂 Loaded', sortedProjects.length, 'projects from local storage');
        } else {
          setProjects([]);
          console.log('📂 No projects found in local storage');
        }
      } catch (error) {
        console.error('❌ Error loading projects:', error);
        setProjects([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadProjects();
  }, []);

  const handleOpenProject = (project: SavedProject) => {
    console.log('🚀 Opening project:', project.title);
    
    // Store project data in sessionStorage for the editor to load
    sessionStorage.setItem('loadProjectData', JSON.stringify(project));
    
    // Navigate to editor with project ID
    router.push(`/editor?projectId=${project.id}`);
  };

  const handleDeleteProject = (project: SavedProject) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const confirmDeleteProject = () => {
    if (!projectToDelete) return;

    try {
      const projectsJson = localStorage.getItem('pixelateai_projects');
      if (projectsJson) {
        const existingProjects = JSON.parse(projectsJson);
        const updatedProjects = existingProjects.filter((p: SavedProject) => p.id !== projectToDelete.id);
        localStorage.setItem('pixelateai_projects', JSON.stringify(updatedProjects));
        setProjects(updatedProjects);
        console.log('🗑️ Deleted project:', projectToDelete.title);
      }
    } catch (error) {
      console.error('❌ Error deleting project:', error);
    }

    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  const handleCreateNewProject = () => {
    router.push('/editor');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProjectStats = (project: SavedProject) => {
    const videoCount = project.timelineClips?.filter(clip => clip.type === 'video').length || 0;
    const audioCount = project.audioClips?.length || 0;
    const textCount = project.textOverlays?.length || 0;
    const sceneCount = project.scenes?.length || 0;
    
    return { videoCount, audioCount, textCount, sceneCount };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-purple-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-white">Loading Projects...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <div className="bg-[#111] border-b border-[#222] px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            <p className="text-white/60 mt-1">Manage your PixelateAI video projects</p>
          </div>
          <button
            onClick={handleCreateNewProject}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="p-6">
        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-[#111] rounded-full flex items-center justify-center border border-[#333]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No Projects Yet</h2>
            <p className="text-white/60 mb-6">Create your first video project to get started</p>
            <button
              onClick={handleCreateNewProject}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              Create First Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => {
              const stats = getProjectStats(project);
              return (
                <div
                  key={project.id}
                  className="bg-[#111] border border-[#222] rounded-lg overflow-hidden hover:border-[#333] transition-colors group"
                >
                  {/* Project Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-purple-600/20 to-blue-500/20 flex items-center justify-center border-b border-[#222]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Project Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1 truncate">{project.title}</h3>
                    {project.description && (
                      <p className="text-sm text-white/60 mb-3 line-clamp-2">{project.description}</p>
                    )}

                    {/* Project Stats */}
                    <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
                      <span className="flex items-center gap-1">
                        🎬 {stats.videoCount}
                      </span>
                      <span className="flex items-center gap-1">
                        🎵 {stats.audioCount}
                      </span>
                      <span className="flex items-center gap-1">
                        📝 {stats.textCount}
                      </span>
                      <span className="flex items-center gap-1">
                        ⏱️ {formatDuration(project.totalDuration)}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="text-xs text-white/40 mb-4">
                      <div>Created: {formatDate(project.createdAt)}</div>
                      <div>Updated: {formatDate(project.updatedAt)}</div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenProject(project)}
                        className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg text-sm hover:opacity-90 transition-opacity"
                      >
                        Open
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project)}
                        className="px-3 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm hover:bg-red-600/30 transition-colors border border-red-600/30"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && projectToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#222] border border-[#333] rounded-lg p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-white mb-4">Delete Project</h2>
            <p className="text-white/70 mb-6">
              Are you sure you want to delete "{projectToDelete.title}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-[#333] text-white rounded-lg hover:bg-[#444] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteProject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 