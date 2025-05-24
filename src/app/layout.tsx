import React from 'react';
import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '../contexts/AuthContext';
import ConditionalLayout from '../components/ConditionalLayout';

export const metadata: Metadata = {
  title: 'PixelateAI - AI-Powered Animation for Educators',
  description: 'Create fully animated explainer videos from simple text prompts without animation or coding expertise.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0a0a]">
        <AuthProvider>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthProvider>
      </body>
    </html>
  );
} 