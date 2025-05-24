'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Project {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get('/api/projects');
        if (response.data.success) {
          setProjects(response.data.projects);
        }
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError('Failed to load projects. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      // In a real implementation, this would call an API to delete the project
      setProjects(projects.filter(project => project.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Projects</h1>
        <Link 
          href="/create"
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Create New Project
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-12 h-12 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No Projects Yet</h2>
          <p className="text-gray-500 mb-6">
            Create your first animation project to get started
          </p>
          <Link 
            href="/create"
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Create Your First Project
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
                {project.description && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{project.description}</p>
                )}
                <div className="text-sm text-gray-500 mb-4">
                  <div>Created: {formatDate(project.createdAt)}</div>
                  <div>Last modified: {formatDate(project.updatedAt)}</div>
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => router.push(`/editor?projectId=${project.id}`)}
                    className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200"
                  >
                    Open
                  </button>
                  <button
                    onClick={() => handleDeleteProject(project.id)}
                    className="px-3 py-1 text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 