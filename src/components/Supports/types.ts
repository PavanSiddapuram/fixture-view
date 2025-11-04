import * as THREE from 'three';

export type SupportType = 'rectangular' | 'cylindrical' | 'conical' | 'custom';

export interface SupportBase {
  id: string;
  type: SupportType;
  center: THREE.Vector2; // on plate, units mm
  height: number; // mm
  rotationZ?: number; // radians, for rectangular/custom
}

export interface RectSupport extends SupportBase {
  type: 'rectangular';
  width: number;
  depth: number;
  cornerRadius?: number;
}

export interface CylSupport extends SupportBase {
  type: 'cylindrical';
  radius: number;
}

export interface ConicalSupport extends SupportBase {
  type: 'conical';
  baseRadius: number;
  topRadius: number; // 0 for cone
}

export interface CustomSupport extends SupportBase {
  type: 'custom';
  polygon: Array<[number, number]>; // centered at center
  offset?: number;
}

export type AnySupport = RectSupport | CylSupport | ConicalSupport | CustomSupport;
