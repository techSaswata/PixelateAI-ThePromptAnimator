declare module 'react-draggable' {
  import * as React from 'react';

  export interface DraggableProps {
    axis?: 'both' | 'x' | 'y' | 'none';
    bounds?: { left?: number; right?: number; top?: number; bottom?: number } | string;
    defaultClassName?: string;
    defaultClassNameDragging?: string;
    defaultClassNameDragged?: string;
    defaultPosition?: { x: number; y: number };
    position?: { x: number; y: number };
    disabled?: boolean;
    grid?: [number, number];
    handle?: string;
    cancel?: string;
    scale?: number;
    onStart?: (e: React.MouseEvent, data: DraggableData) => void | false;
    onDrag?: (e: React.MouseEvent, data: DraggableData) => void | false;
    onStop?: (e: React.MouseEvent, data: DraggableData) => void | false;
    onMouseDown?: (e: React.MouseEvent) => void;
    children?: React.ReactNode;
  }

  export interface DraggableData {
    node: HTMLElement;
    x: number;
    y: number;
    deltaX: number;
    deltaY: number;
    lastX: number;
    lastY: number;
  }

  export default class Draggable extends React.Component<DraggableProps> {}

  export class DraggableCore extends React.Component<DraggableProps> {}
} 