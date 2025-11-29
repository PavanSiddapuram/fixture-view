import * as THREE from 'three';
import { createOffsetHeightMap, loadHeightMapFromTiles, cleanupOffscreenResources } from './offsetHeightmap';
import { createWatertightMeshFromHeightmap } from './meshGenerator';
import { MeshoptSimplifier } from 'meshoptimizer/meshopt_simplifier.module';

export interface OffsetMeshOptions {
  offsetDistance: number;
  pixelsPerUnit: number;
  tileSize?: number;
  simplifyRatio?: number | null;
  verifyManifold?: boolean;
  rotationXZ?: number;
  rotationYZ?: number;
  progressCallback?: (current: number, total: number, stage: string) => void;
}

export interface OffsetMeshMetadata {
  offsetDistance: number;
  pixelsPerUnit: number;
  resolution: number;
  vertexCount: number;
  triangleCount: number;
  originalTriangleCount: number;
  processingTime: number;
  simplificationApplied: boolean;
  simplificationTime: number;
  geometryCreationTime: number;
}

export interface OffsetMeshResult {
  heightmapResult: any;
  geometry: THREE.BufferGeometry;
  metadata: OffsetMeshMetadata;
}

export async function createOffsetMesh(vertices: Float32Array, options: OffsetMeshOptions): Promise<OffsetMeshResult> {
  const {
    offsetDistance,
    pixelsPerUnit,
    tileSize = 2048,
    simplifyRatio = null,
    verifyManifold = true,
    rotationXZ = 0,
    rotationYZ = 0,
    progressCallback = null,
  } = options;

  if (!vertices || vertices.length === 0) {
    throw new Error('No vertices provided');
  }
  if (offsetDistance <= 0) {
    throw new Error('Offset distance must be positive');
  }
  if (pixelsPerUnit <= 0) {
    throw new Error('Pixels per unit must be positive');
  }
  if (simplifyRatio !== null && (simplifyRatio <= 0 || simplifyRatio >= 1)) {
    throw new Error('Simplify ratio must be between 0 and 1 (exclusive)');
  }

  const result: OffsetMeshResult = {
    heightmapResult: null,
    geometry: new THREE.BufferGeometry(),
    metadata: {
      offsetDistance,
      pixelsPerUnit,
      resolution: 0,
      vertexCount: 0,
      triangleCount: 0,
      processingTime: 0,
      simplificationApplied: false,
      simplificationTime: 0,
      originalTriangleCount: 0,
      geometryCreationTime: 0,
    },
  };

  const startTime = performance.now();

  const actualYZ = 180 - rotationYZ;
  const needsRotation = rotationXZ !== 0 || actualYZ !== 0;

  try {
    let workingVertices: Float32Array = vertices;

    if (needsRotation) {
      if (progressCallback) progressCallback(0, 100, 'Applying rotation');
      const rotationMatrix = createRotationMatrix(rotationXZ, actualYZ);
      workingVertices = applyMatrixToVertices(vertices, rotationMatrix);
    }

    if (progressCallback) progressCallback(0, 100, 'Calculating resolution');

    const box = new THREE.Box3();
    box.setFromArray(workingVertices as unknown as number[]);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);

    const effectiveDim = maxDim + offsetDistance * 10;
    const resolution = Math.ceil(effectiveDim * pixelsPerUnit);
    const clampedResolution = Math.max(64, Math.min(16384, resolution));

    result.metadata.resolution = clampedResolution;

    const heightmapProgressCallback = clampedResolution > tileSize
      ? (current: number, total: number) => {
          const percent = 10 + (current / total) * 40;
          if (progressCallback) progressCallback(percent, 100, `Rendering tile ${current}/${total}`);
        }
      : null;

    if (progressCallback) progressCallback(10, 100, 'Generating heightmap');

    const heightmapResult = await createOffsetHeightMap(
      workingVertices,
      offsetDistance,
      clampedResolution,
      tileSize,
      heightmapProgressCallback || undefined,
    );

    result.heightmapResult = heightmapResult;

    if (progressCallback) progressCallback(50, 100, 'Loading heightmap data');

    let heightMap: Float32Array | number[][];
    if ((heightmapResult as any).usesIndexedDB) {
      const loadProgressCallback = (current: number, total: number) => {
        const percent = 50 + (current / total) * 20;
        if (progressCallback) progressCallback(percent, 100, `Loading tile ${current}/${total}`);
      };
      heightMap = await loadHeightMapFromTiles(heightmapResult, loadProgressCallback);
    } else {
      heightMap = (heightmapResult as any).heightMap;
    }

    if (progressCallback) progressCallback(70, 100, 'Calculating mesh settings');

    const meshSettings = {
      downsampleFactor: 1,
      effectiveResolution: clampedResolution,
    };

    if (progressCallback) progressCallback(75, 100, 'Creating watertight mesh');

    const originalBox = box;
    const clipZMin = originalBox.min.z - offsetDistance;
    const clipZMax = originalBox.max.z + offsetDistance;

    const geometry = createWatertightMeshFromHeightmap(
      heightMap,
      clampedResolution,
      (heightmapResult as any).scale,
      (heightmapResult as any).center,
      clipZMin,
      clipZMax,
      meshSettings,
    );

    result.geometry = geometry;
    result.metadata.originalTriangleCount = (geometry.index?.count || 0) / 3;

    if (simplifyRatio !== null && simplifyRatio > 0 && simplifyRatio < 1) {
      if (progressCallback) progressCallback(90, 100, 'Simplifying mesh');
      const simplifyStartTime = performance.now();
      try {
        const simplifiedGeometry = await simplifyGeometry(geometry, simplifyRatio, verifyManifold);
        result.geometry = simplifiedGeometry;
        result.metadata.simplificationApplied = true;
        result.metadata.simplificationTime = performance.now() - simplifyStartTime;
      } catch {
        result.metadata.simplificationApplied = false;
        result.metadata.simplificationTime = 0;
      }
    }

    if (needsRotation) {
      if (progressCallback) progressCallback(95, 100, 'Restoring orientation');
      const inverseMatrix = createInverseRotationMatrix(rotationXZ, actualYZ);
      result.geometry.applyMatrix4(inverseMatrix);
      result.geometry.computeVertexNormals();
    }

    result.metadata.vertexCount = result.geometry.getAttribute('position').count;
    result.metadata.triangleCount = (result.geometry.index?.count || 0) / 3;

    const endTime = performance.now();
    result.metadata.processingTime = endTime - startTime;
    result.metadata.geometryCreationTime = result.metadata.processingTime - result.metadata.simplificationTime;

    if (progressCallback) progressCallback(100, 100, 'Complete');

    return result;
  } catch (error) {
    console.error('Error in createOffsetMesh:', error);
    throw error;
  }
}

async function simplifyGeometry(
  geometry: THREE.BufferGeometry,
  targetRatio: number,
  verifyManifold: boolean,
): Promise<THREE.BufferGeometry> {
  await MeshoptSimplifier.ready;

  if (!geometry.index || !geometry.attributes.position) {
    throw new Error('Geometry must have indices and positions');
  }

  const positions = geometry.attributes.position.array as ArrayLike<number>;
  const indices = geometry.index.array as ArrayLike<number>;

  const uint32Indices = indices instanceof Uint32Array ? indices : new Uint32Array(indices);
  const float32Positions = positions instanceof Float32Array ? positions : new Float32Array(positions as any);

  const minIndexCount = 3;
  const targetIndexCount = Math.max(minIndexCount, Math.floor(uint32Indices.length * targetRatio));
  const adjustedTargetIndexCount = Math.floor(targetIndexCount / 3) * 3;

  const [simplifiedIndices] = MeshoptSimplifier.simplify(
    uint32Indices,
    float32Positions,
    3,
    adjustedTargetIndexCount,
    0.01,
    ['LockBorder'],
  );

  const simplifiedGeometry = new THREE.BufferGeometry();
  simplifiedGeometry.setAttribute('position', geometry.attributes.position.clone());
  simplifiedGeometry.setIndex(Array.from(simplifiedIndices));
  simplifiedGeometry.computeVertexNormals();

  return simplifiedGeometry;
}

export function cleanup(): void {
  cleanupOffscreenResources();
}

export function extractVertices(geometry: THREE.BufferGeometry): Float32Array {
  return geometry.getAttribute('position').array as Float32Array;
}

export function calculateResolution(
  boundingBox: THREE.Box3,
  pixelsPerUnit: number,
  offsetDistance: number,
): number {
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const maxDim = Math.max(size.x, size.y, size.z);
  const effectiveDim = maxDim + offsetDistance * 10;
  const resolution = Math.ceil(effectiveDim * pixelsPerUnit);
  return Math.max(64, Math.min(16384, resolution));
}

function createRotationMatrix(xzAngleDeg: number, actualYZ: number): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  if (xzAngleDeg === 0 && actualYZ === 0) {
    return matrix;
  }
  if (xzAngleDeg !== 0) {
    const rotY = new THREE.Matrix4();
    rotY.makeRotationY((xzAngleDeg * Math.PI) / 180);
    matrix.multiply(rotY);
  }
  if (actualYZ !== 0) {
    const rotX = new THREE.Matrix4();
    rotX.makeRotationX((actualYZ * Math.PI) / 180);
    matrix.multiply(rotX);
  }
  return matrix;
}

function createInverseRotationMatrix(xzAngleDeg: number, actualYZ: number): THREE.Matrix4 {
  const matrix = new THREE.Matrix4();
  if (xzAngleDeg === 0 && actualYZ === 0) {
    return matrix;
  }
  if (actualYZ !== 0) {
    const rotX = new THREE.Matrix4();
    rotX.makeRotationX((-actualYZ * Math.PI) / 180);
    matrix.multiply(rotX);
  }
  if (xzAngleDeg !== 0) {
    const rotY = new THREE.Matrix4();
    rotY.makeRotationY((-xzAngleDeg * Math.PI) / 180);
    matrix.multiply(rotY);
  }
  return matrix;
}

function applyMatrixToVertices(vertices: Float32Array, matrix: THREE.Matrix4): Float32Array {
  const result = new Float32Array(vertices.length);
  const elements = matrix.elements;

  const m11 = elements[0], m12 = elements[4], m13 = elements[8], m14 = elements[12];
  const m21 = elements[1], m22 = elements[5], m23 = elements[9], m24 = elements[13];
  const m31 = elements[2], m32 = elements[6], m33 = elements[10], m34 = elements[14];
  const m41 = elements[3], m42 = elements[7], m43 = elements[11], m44 = elements[15];

  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i];
    const y = vertices[i + 1];
    const z = vertices[i + 2];

    const w = m41 * x + m42 * y + m43 * z + m44 || 1;

    result[i] = (m11 * x + m12 * y + m13 * z + m14) / w;
    result[i + 1] = (m21 * x + m22 * y + m23 * z + m24) / w;
    result[i + 2] = (m31 * x + m32 * y + m33 * z + m34) / w;
  }

  return result;
}
