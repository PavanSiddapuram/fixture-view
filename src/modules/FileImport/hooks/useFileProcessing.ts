import { useState, useCallback } from 'react';
import * as THREE from 'three';
import { ProcessedFile, FileMetadata, SUPPORTED_FORMATS } from '../types';

interface UseFileProcessingReturn {
  processFile: (file: File) => Promise<ProcessedFile>;
  isProcessing: boolean;
  error: string | null;
  clearError: () => void;
}

export function useFileProcessing(): UseFileProcessingReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateFile = (file: File): void => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(extension)) {
      throw new Error(`Unsupported file format: ${extension}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      throw new Error('File too large. Maximum size is 50MB.');
    }
  };

  const parseSTL = async (arrayBuffer: ArrayBuffer): Promise<THREE.BufferGeometry> => {
    const view = new DataView(arrayBuffer);
    
    // Check if it's binary STL (first 80 bytes are header, then 4-byte triangle count)
    const isBinary = arrayBuffer.byteLength > 84;
    
    if (isBinary) {
      return parseBinarySTL(arrayBuffer);
    } else {
      return parseASCIISTL(new TextDecoder().decode(arrayBuffer));
    }
  };

  const parseBinarySTL = (arrayBuffer: ArrayBuffer): THREE.BufferGeometry => {
    const view = new DataView(arrayBuffer);
    const triangleCount = view.getUint32(80, true);
    
    const vertices: number[] = [];
    const normals: number[] = [];
    
    let offset = 84; // Skip header (80 bytes) + triangle count (4 bytes)
    
    for (let i = 0; i < triangleCount; i++) {
      // Normal vector (3 floats)
      const nx = view.getFloat32(offset, true);
      const ny = view.getFloat32(offset + 4, true);
      const nz = view.getFloat32(offset + 8, true);
      offset += 12;
      
      // Three vertices (9 floats total)
      for (let j = 0; j < 3; j++) {
        const vx = view.getFloat32(offset, true);
        const vy = view.getFloat32(offset + 4, true);
        const vz = view.getFloat32(offset + 8, true);
        offset += 12;
        
        vertices.push(vx, vy, vz);
        normals.push(nx, ny, nz);
      }
      
      // Skip attribute byte count (2 bytes)
      offset += 2;
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  };

  const parseASCIISTL = (text: string): THREE.BufferGeometry => {
    const vertices: number[] = [];
    const normals: number[] = [];
    
    const lines = text.split('\n');
    let currentNormal: number[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('facet normal')) {
        const parts = trimmed.split(/\s+/);
        currentNormal = [
          parseFloat(parts[2]) || 0,
          parseFloat(parts[3]) || 0,
          parseFloat(parts[4]) || 0
        ];
      } else if (trimmed.startsWith('vertex')) {
        const parts = trimmed.split(/\s+/);
        vertices.push(
          parseFloat(parts[1]) || 0,
          parseFloat(parts[2]) || 0,
          parseFloat(parts[3]) || 0
        );
        normals.push(...currentNormal);
      }
    }
    
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    
    return geometry;
  };

  const computeMetadata = (geometry: THREE.BufferGeometry, file: File, processingTime: number): FileMetadata => {
    // Compute bounding box
    geometry.computeBoundingBox();
    const boundingBox = geometry.boundingBox!;
    
    // Get dimensions and center
    const dimensions = new THREE.Vector3();
    boundingBox.getSize(dimensions);
    
    const center = new THREE.Vector3();
    boundingBox.getCenter(center);
    
    // Count triangles
    const positionAttribute = geometry.getAttribute('position');
    const triangles = positionAttribute.count / 3;
    
    return {
      name: file.name,
      size: file.size,
      triangles: Math.floor(triangles),
      boundingBox,
      dimensions,
      center,
      processingTime
    };
  };

  const processFile = useCallback(async (file: File): Promise<ProcessedFile> => {
    const startTime = performance.now();
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // Validate file
      validateFile(file);
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Parse geometry based on file type
      let geometry: THREE.BufferGeometry;
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      switch (extension) {
        case '.stl':
          geometry = await parseSTL(arrayBuffer);
          break;
        default:
          throw new Error(`Parser for ${extension} not yet implemented`);
      }
      
      // Ensure we have normals
      if (!geometry.attributes.normal) {
        geometry.computeVertexNormals();
      }
      
      // Create material and mesh
      const material = new THREE.MeshStandardMaterial({
        color: 0x00bcd4, // Cyan color
        roughness: 0.3,
        metalness: 0.1,
        flatShading: false,
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      // Compute metadata
      const processingTime = performance.now() - startTime;
      const metadata = computeMetadata(geometry, file, processingTime);
      
      return { mesh, metadata };
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    processFile,
    isProcessing,
    error,
    clearError,
  };
}