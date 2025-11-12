import React from 'react';
import * as THREE from 'three';
import { AnySupport } from './types';

interface SupportMeshProps {
  support: AnySupport;
  preview?: boolean;
  baseTopY?: number;
}

const materialFor = (preview?: boolean) =>
  new THREE.MeshStandardMaterial({
    color: preview ? 0x3b82f6 : 0x6b7280,
    transparent: !!preview,
    opacity: preview ? 0.5 : 1,
    roughness: 0.6,
    metalness: 0.1,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });

const SupportMesh: React.FC<SupportMeshProps> = ({ support, preview, baseTopY = 0 }) => {
  const { type, height, center } = support as any;
  const rotY = (support as any).rotationZ ?? 0; // orientation for rectangular/custom
  const effectiveBaseY = (support as any).baseY ?? baseTopY;
  const yCenter = effectiveBaseY + height / 2; // base sits on support's local baseY
  const skirtHeight = 0.6; // mm visual chamfer/fillet at base
  const skirtExpand = 0.4; // mm outward expansion to create slope

  if (type === 'cylindrical') {
    const { radius } = support as any;
    const geo = React.useMemo(() => new THREE.CylinderGeometry(radius, radius, height, 192), [radius, height]);
    const skirtGeo = React.useMemo(() => new THREE.CylinderGeometry(radius, radius + skirtExpand, skirtHeight, 192), [radius]);
    return (
      <>
        <group position={[center.x, effectiveBaseY + skirtHeight / 2, center.y]}>
          <mesh geometry={skirtGeo} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[skirtGeo, 70]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
        <group position={[center.x, yCenter, center.y]}>
          <mesh geometry={geo} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[geo, 70]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
      </>
    );
  }

  if (type === 'rectangular') {
    const { width, depth, cornerRadius = 0 } = support as any;
    if (cornerRadius <= 0) {
      const geo = React.useMemo(() => new THREE.BoxGeometry(width, height, depth), [width, height, depth]);
      const skirtGeo = React.useMemo(() => new THREE.BoxGeometry(width + 2 * skirtExpand, skirtHeight, depth + 2 * skirtExpand), [width, depth]);
      return (
        <>
          <group position={[center.x, effectiveBaseY + skirtHeight / 2, center.y]} rotation={[0, rotY, 0]}>
            <mesh geometry={skirtGeo} material={materialFor(preview)} />
            <lineSegments renderOrder={2}>
              <edgesGeometry args={[skirtGeo]} />
              <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
            </lineSegments>
          </group>
          <group position={[center.x, yCenter, center.y]} rotation={[0, rotY, 0]}>
            <mesh geometry={geo} material={materialFor(preview)} />
            <lineSegments renderOrder={2}>
              <edgesGeometry args={[geo]} />
              <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
            </lineSegments>
          </group>
        </>
      );
    }
    const rrShape = React.useMemo(() => {
      const hw = width / 2;
      const hd = depth / 2;
      const r = Math.min(cornerRadius, hw, hd);
      const s = new THREE.Shape();
      s.moveTo(-hw + r, -hd);
      s.lineTo(hw - r, -hd);
      s.quadraticCurveTo(hw, -hd, hw, -hd + r);
      s.lineTo(hw, hd - r);
      s.quadraticCurveTo(hw, hd, hw - r, hd);
      s.lineTo(-hw + r, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - r);
      s.lineTo(-hw, -hd + r);
      s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      return s;
    }, [width, depth, cornerRadius]);
    const rrGeo = React.useMemo(() => {
      const e = new THREE.ExtrudeGeometry(rrShape, { depth: height, bevelEnabled: false, curveSegments: 64 });
      e.rotateX(Math.PI / 2);
      e.translate(0, height / 2, 0);
      return e;
    }, [rrShape, height]);
    // Skirt (rounded rectangle slightly larger)
    const rrShapeSkirt = React.useMemo(() => {
      const hw = (width + 2 * skirtExpand) / 2;
      const hd = (depth + 2 * skirtExpand) / 2;
      const r = Math.min(cornerRadius + skirtExpand, hw, hd);
      const s = new THREE.Shape();
      s.moveTo(-hw + r, -hd);
      s.lineTo(hw - r, -hd);
      s.quadraticCurveTo(hw, -hd, hw, -hd + r);
      s.lineTo(hw, hd - r);
      s.quadraticCurveTo(hw, hd, hw - r, hd);
      s.lineTo(-hw + r, hd);
      s.quadraticCurveTo(-hw, hd, -hw, hd - r);
      s.lineTo(-hw, -hd + r);
      s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
      return s;
    }, [width, depth, cornerRadius]);
    const rrGeoSkirt = React.useMemo(() => {
      const e = new THREE.ExtrudeGeometry(rrShapeSkirt, { depth: skirtHeight, bevelEnabled: false, curveSegments: 64 });
      e.rotateX(Math.PI / 2);
      e.translate(0, skirtHeight / 2, 0);
      return e;
    }, [rrShapeSkirt]);
    return (
      <>
        <group position={[center.x, effectiveBaseY, center.y]} rotation={[0, rotY, 0]}>
          <mesh geometry={rrGeoSkirt} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[rrGeoSkirt, 45]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
        <group position={[center.x, effectiveBaseY, center.y]} rotation={[0, rotY, 0]}>
          <mesh geometry={rrGeo} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[rrGeo, 45]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
      </>
    );
  }

  if (type === 'conical') {
    const { baseRadius, topRadius } = support as any;
    const geo = React.useMemo(() => new THREE.CylinderGeometry(topRadius, baseRadius, height, 192), [topRadius, baseRadius, height]);
    const skirtGeo = React.useMemo(() => new THREE.CylinderGeometry(baseRadius, baseRadius + skirtExpand, skirtHeight, 192), [baseRadius]);
    return (
      <>
        <group position={[center.x, effectiveBaseY + skirtHeight / 2, center.y]}>
          <mesh geometry={skirtGeo} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[skirtGeo, 70]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
        <group position={[center.x, yCenter, center.y]}>
          <mesh geometry={geo} material={materialFor(preview)} />
          <lineSegments renderOrder={2}>
            <edgesGeometry args={[geo, 70]} />
            <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
          </lineSegments>
        </group>
      </>
    );
  }

  if (type === 'custom') {
    const { polygon } = support as any;
    const shape = new THREE.Shape();
    if (polygon.length > 0) {
      shape.moveTo(polygon[0][0], polygon[0][1]);
      for (let i = 1; i < polygon.length; i++) shape.lineTo(polygon[i][0], polygon[i][1]);
      shape.closePath();
    }
    const geo = React.useMemo(() => {
      const e = new THREE.ExtrudeGeometry(shape, { depth: height, bevelEnabled: false, curveSegments: 64 });
      e.rotateX(Math.PI / 2);
      e.translate(0, height / 2, 0);
      return e;
    }, [JSON.stringify(polygon), height]);
    return (
      <group position={[center.x, effectiveBaseY + height / 2, center.y]} rotation={[0, rotY, 0]}>
        <mesh geometry={geo} material={materialFor(preview)} />
        <lineSegments renderOrder={2}>
          <edgesGeometry args={[geo]} />
          <lineBasicMaterial color={0x9ca3af} depthTest={false} depthWrite={false} />
        </lineSegments>
      </group>
    );
  }

  return null;
};

export default SupportMesh;
