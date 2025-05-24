'use client';

import React, { useState } from 'react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: string, quality: string) => void;
  isExporting: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting
}) => {
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState('high');

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(selectedFormat, selectedQuality);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Export Animation</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Format
          </label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            disabled={isExporting}
          >
            <option value="mp4">MP4 Video</option>
            <option value="gif">GIF Animation</option>
            <option value="webm">WebM Video</option>
            <option value="png">PNG Image Sequence</option>
          </select>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quality
          </label>
          <select
            value={selectedQuality}
            onChange={(e) => setSelectedQuality(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
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
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            disabled={isExporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
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