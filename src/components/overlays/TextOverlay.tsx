'use client';

import React, { useState } from 'react';
import { TextOverlay as TextOverlayType } from '../../lib/store';

interface TextOverlayProps {
  overlay: TextOverlayType;
  onUpdate: (id: string, updates: Partial<TextOverlayType>) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  overlay,
  onUpdate,
  onDelete,
  isSelected,
  onSelect,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(overlay.text);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (text !== overlay.text) {
      onUpdate(overlay.id, { text });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onUpdate(overlay.id, { text });
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', overlay.id);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (!e.clientX || !e.clientY) return;
    
    // Calculate new position
    const x = e.clientX;
    const y = e.clientY;
    
    // Update position
    onUpdate(overlay.id, {
      position: { x, y }
    });
  };

  return (
    <div
      className={`absolute p-2 cursor-move ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        left: `${overlay.position.x}px`,
        top: `${overlay.position.y}px`,
        fontSize: overlay.style?.fontSize ? `${overlay.style.fontSize}px` : '16px',
        color: overlay.style?.color || '#ffffff',
        fontWeight: overlay.style?.fontWeight || 'normal',
        backgroundColor: isSelected ? 'rgba(0, 0, 0, 0.1)' : 'transparent',
      }}
      onClick={() => onSelect(overlay.id)}
      onDoubleClick={handleDoubleClick}
      draggable
      onDragStart={handleDragStart}
      onDrag={handleDrag}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="bg-transparent border border-gray-300 p-1 focus:outline-none focus:border-blue-500"
          autoFocus
        />
      ) : (
        <div>{overlay.text}</div>
      )}
      
      {isSelected && (
        <div className="absolute top-0 right-0 -mt-2 -mr-2">
          <button
            onClick={() => onDelete(overlay.id)}
            className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}; 