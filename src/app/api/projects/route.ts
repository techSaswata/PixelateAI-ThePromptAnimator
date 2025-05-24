import { NextResponse } from 'next/server';

// In a real application, this would be stored in a database
let savedProjects: any[] = [];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      projects: savedProjects
    });
  } catch (error) {
    console.error('Error retrieving projects:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const project = await request.json();
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project data is required' },
        { status: 400 }
      );
    }
    
    // Generate an ID if one doesn't exist
    if (!project.id) {
      project.id = `project-${Date.now()}`;
    } else {
      // If project exists, update it
      const existingIndex = savedProjects.findIndex(p => p.id === project.id);
      if (existingIndex !== -1) {
        savedProjects[existingIndex] = project;
        return NextResponse.json({
          success: true,
          project
        });
      }
    }
    
    // Add timestamp
    project.updatedAt = new Date().toISOString();
    if (!project.createdAt) {
      project.createdAt = project.updatedAt;
    }
    
    // Add to projects
    savedProjects.push(project);
    
    return NextResponse.json({
      success: true,
      project
    });
    
  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
} 