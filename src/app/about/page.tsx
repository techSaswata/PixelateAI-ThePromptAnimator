import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center">About PixelateAI</h1>
        
        <div className="prose prose-lg mx-auto">
          <p className="lead text-xl text-gray-600 mb-8">
            PixelateAI is an AI-powered animation platform designed specifically for educators to create
            engaging visual explanations without animation expertise.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
          <p>
            We believe that complex concepts are best understood through visual learning. Our mission is to empower
            educators with tools to create beautiful, animated explanations that make learning more engaging and effective.
          </p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              <strong>Enter a prompt</strong> - Describe what you want to explain in natural language
            </li>
            <li>
              <strong>AI generates animation</strong> - Our AI creates a mathematical animation based on your prompt
            </li>
            <li>
              <strong>Edit and customize</strong> - Fine-tune the animation with our intuitive editor
            </li>
            <li>
              <strong>Export and share</strong> - Download your animation in multiple formats or share directly
            </li>
          </ol>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Technology</h2>
          <p>
            PixelateAI combines large language models with the Manim mathematical animation engine to transform
            text descriptions into beautiful, mathematically accurate animations. Our platform handles all the
            technical complexity, allowing you to focus on the content.
          </p>
          
          <div className="bg-indigo-50 p-6 rounded-lg mt-8">
            <h3 className="text-xl font-semibold mb-2">Get Started Today</h3>
            <p className="mb-4">
              Join thousands of educators who are already using PixelateAI to create engaging visual content
              for their students.
            </p>
            <Link 
              href="/create" 
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Create Your First Animation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 