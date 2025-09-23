import * as THREE from 'three';

export interface ProcessedFile {
  mesh: THREE.Mesh;
  metadata: FileMetadata;
}

export interface FileMetadata {
  name: string;
  size: number;
  triangles: number;
  boundingBox: THREE.Box3;
  dimensions: THREE.Vector3;
  center: THREE.Vector3;
  processingTime: number;
}

export interface ViewerConfig {
  backgroundColor: number;
  gridSize: number;
  showGrid: boolean;
  showAxes: boolean;
  enableOrbitControls: boolean;
  pixelRatio: number;
  antialias: boolean;
}

export const DEFAULT_VIEWER_CONFIG: ViewerConfig = {
  backgroundColor: 0x111827, // Dark blue-gray
  gridSize: 10,
  showGrid: true,
  showAxes: true,
  enableOrbitControls: true,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  antialias: true,
};

export const SUPPORTED_FORMATS = ['.stl', '.obj', '.ply'];

export type ViewOrientation = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'iso';

export interface ViewerHandle {
  addMesh: (mesh: THREE.Mesh) => void;
  removeMesh: (mesh: THREE.Mesh) => void;
  resetView: () => void;
  setOrientation: (orientation: ViewOrientation) => void;
  fitToView: () => void;
  dispose: () => void;
}