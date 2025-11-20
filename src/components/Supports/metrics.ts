import * as THREE from 'three';
import { AnySupport } from './types';

export interface SupportMetricOptions {
  support: AnySupport;
  baseTopY: number;
  contactOffset?: number;
  baseTarget?: THREE.Object3D | null;
  modelTargets?: THREE.Object3D[] | null;
  maxRayHeight?: number;
  raycaster?: THREE.Raycaster;
}

export interface SupportMetrics {
  baseY: number;
  height: number;
}

const DEFAULT_MAX_RAY_HEIGHT = 2000;
 
const unitVecUp = new THREE.Vector3(0, 1, 0);
const unitVecDown = new THREE.Vector3(0, -1, 0);

const tempOrigin = new THREE.Vector3();

export const getSupportSamples = (support: AnySupport): Array<[number, number]> => {
  const { center } = support;
  const samples: Array<[number, number]> = [[center.x, center.y]];

  if (support.type === 'cylindrical') {
    const r = Math.max(1, (support as any).radius as number);
    const d = Math.SQRT1_2;
    const spreads: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [d, d],
      [d, -d],
      [-d, d],
      [-d, -d],
    ];
    spreads.forEach(([dx, dz]) => samples.push([center.x + dx * r, center.y + dz * r]));
  } else if (support.type === 'rectangular') {
    const width = (support as any).width as number;
    const depth = (support as any).depth as number;
    const hw = width / 2;
    const hd = depth / 2;
    const corners: Array<[number, number]> = [
      [-hw, -hd],
      [-hw, hd],
      [hw, hd],
      [hw, -hd],
    ];
    corners.forEach(([dx, dz]) => samples.push([center.x + dx, center.y + dz]));
  } else if (support.type === 'conical') {
    const r = Math.max(1, (support as any).baseRadius as number);
    const d = Math.SQRT1_2;
    const spreads: Array<[number, number]> = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
      [d, d],
      [d, -d],
      [-d, d],
      [-d, -d],
    ];
    spreads.forEach(([dx, dz]) => samples.push([center.x + dx * r, center.y + dz * r]));
  } else if (support.type === 'custom') {
    const polygon = (support as any).polygon as Array<[number, number]>;
    if (Array.isArray(polygon)) {
      polygon.forEach(([x, z]) => samples.push([center.x + x, center.y + z]));
      for (let i = 0; i < polygon.length; i++) {
        const [ax, az] = polygon[i];
        const [bx, bz] = polygon[(i + 1) % polygon.length];
        samples.push([center.x + (ax + bx) / 2, center.y + (az + bz) / 2]);
      }
      const maxRadius = polygon.reduce((max, [x, z]) => Math.max(max, Math.hypot(x, z)), 0);
      if (maxRadius > 0.5) {
        const r = Math.max(1, maxRadius * 0.75);
        const d = Math.SQRT1_2;
        const dirs: Array<[number, number]> = [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
          [d, d],
          [d, -d],
          [-d, d],
          [-d, -d],
        ];
        dirs.forEach(([dx, dz]) => samples.push([center.x + dx * r, center.y + dz * r]));
      }
    }
  }

  return samples;
};

const getRaycaster = (raycaster?: THREE.Raycaster) => {
  const rc = raycaster ?? new THREE.Raycaster();
  // Ensure BVH accelerated raycasting returns the nearest hit only
  (rc as any).firstHitOnly = true;
  return rc;
};

const raycastBaseY = (
  raycaster: THREE.Raycaster,
  baseTarget: THREE.Object3D | null | undefined,
  baseTopY: number,
  maxRayHeight: number,
  x: number,
  z: number,
) => {
  if (!baseTarget) return baseTopY;
  tempOrigin.set(x, baseTopY + maxRayHeight, z);
  raycaster.set(tempOrigin, unitVecDown);
  const hits = raycaster.intersectObject(baseTarget, true);
  return hits && hits.length ? hits[0].point.y : baseTopY;
};

const raycastModelHitY = (
  raycaster: THREE.Raycaster,
  modelTargets: THREE.Object3D[] | null | undefined,
  maxRayHeight: number,
  fromY: number,
  x: number,
  z: number,
) => {
  if (!modelTargets || modelTargets.length === 0) return null;
  const originY = fromY - 0.001;
  tempOrigin.set(x, originY, z);
  raycaster.near = 0;
  raycaster.far = maxRayHeight;
  raycaster.set(tempOrigin, unitVecUp);
  const hits = raycaster.intersectObjects(modelTargets, true);
  return hits && hits.length ? hits[0].point.y : null;
};

export const computeSupportMetrics = ({
  support,
  baseTopY,
  contactOffset = 0,
  baseTarget,
  modelTargets,
  maxRayHeight = DEFAULT_MAX_RAY_HEIGHT,
  raycaster,
}: SupportMetricOptions): SupportMetrics | null => {
  const rc = getRaycaster(raycaster);
  if (baseTarget) {
    baseTarget.updateMatrixWorld(true);
  }
  if (modelTargets && modelTargets.length) {
    for (const target of modelTargets) {
      target.updateMatrixWorld(true);
    }
  }
  const samples = getSupportSamples(support);
  let effectiveBaseY = baseTopY;
  const hitYs: number[] = [];

  for (const [sx, sz] of samples) {
    const baseY = raycastBaseY(rc, baseTarget, baseTopY, maxRayHeight, sx, sz);
    if (!Number.isFinite(baseY)) {
      continue;
    }
    effectiveBaseY = Math.max(effectiveBaseY, baseY);
    const hitY = raycastModelHitY(rc, modelTargets, maxRayHeight, baseY, sx, sz);
    if (hitY == null || !Number.isFinite(hitY)) {
      continue;
    }
    hitYs.push(hitY);
  }

  if (!hitYs.length) {
    return null;
  }

  const minModelY = hitYs.reduce((min, y) => Math.min(min, y), hitYs[0]);
  const height = Math.max(0.5, minModelY - effectiveBaseY - contactOffset);
  return { baseY: effectiveBaseY, height };
};

export interface FootprintBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export const getSupportFootprintBounds = (support: AnySupport): FootprintBounds => {
  const { center } = support;
  let minX = center.x;
  let maxX = center.x;
  let minZ = center.y;
  let maxZ = center.y;

  const expand = (x: number, z: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;
  };

  if (support.type === 'cylindrical') {
    const radius = (support as any).radius as number;
    expand(center.x - radius, center.y - radius);
    expand(center.x + radius, center.y + radius);
  } else if (support.type === 'rectangular') {
    const width = (support as any).width as number;
    const depth = (support as any).depth as number;
    const hw = width / 2;
    const hd = depth / 2;
    expand(center.x - hw, center.y - hd);
    expand(center.x + hw, center.y + hd);
  } else if (support.type === 'conical') {
    const radius = (support as any).baseRadius as number;
    expand(center.x - radius, center.y - radius);
    expand(center.x + radius, center.y + radius);
  } else if (support.type === 'custom') {
    const polygon = (support as any).polygon as Array<[number, number]>;
    if (Array.isArray(polygon)) {
      polygon.forEach(([x, z]) => {
        expand(center.x + x, center.y + z);
      });
    }
  }

  return { minX, maxX, minZ, maxZ };
};
