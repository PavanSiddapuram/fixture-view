import React from 'react';
import * as THREE from 'three';
import { Html } from '@react-three/drei';
import { AnySupport, SupportType } from './types';

interface SupportPlacementProps {
  active: boolean;
  type: SupportType | null;
  initParams?: Record<string, number>;
  onCreate: (support: AnySupport) => void;
  onCancel: () => void;
  defaultCenter?: THREE.Vector2;
  raycastTargets?: THREE.Object3D[];
  baseTopY?: number; // world Y of baseplate top (defaults to 0)
  contactOffset?: number; // gap to keep from model contact in mm
  maxRayHeight?: number; // max height to search above base for intersections
}


const SupportPlacement: React.FC<SupportPlacementProps> = ({ active, type, initParams, onCreate, onCancel, defaultCenter, raycastTargets = [], baseTopY = 0, contactOffset = 0, maxRayHeight = 2000 }) => {
  const [center, setCenter] = React.useState<THREE.Vector2 | null>(null);
  const [previewSupport, setPreviewSupport] = React.useState<AnySupport | null>(null);
  const [dragging, setDragging] = React.useState(false);
  const [hover, setHover] = React.useState<THREE.Vector2 | null>(null);
  const [customPoints, setCustomPoints] = React.useState<THREE.Vector2[]>([]);
  const raycasterRef = React.useRef(new THREE.Raycaster());

  const computeAutoHeight = React.useCallback((cx: number, cz: number): number | null => {
    if (!raycastTargets || raycastTargets.length === 0) return null;
    const origin = new THREE.Vector3(cx, baseTopY + maxRayHeight, cz);
    const dir = new THREE.Vector3(0, -1, 0);
    const rc = raycasterRef.current;
    rc.set(origin, dir);
    const intersects = rc.intersectObjects(raycastTargets, true);
    if (!intersects || intersects.length === 0) return null;
    const hit = intersects[0];
    const yHit = hit.point.y;
    const h = (yHit - baseTopY) - contactOffset;
    if (!isFinite(h)) return null;
    return Math.max(0.5, h);
  }, [raycastTargets, baseTopY, contactOffset, maxRayHeight]);

  React.useEffect(() => {
    if (!active) {
      setCenter(null);
      setPreviewSupport(null);
      setHover(null);
      setCustomPoints([]);
      return;
    }
  }, [active]);

  React.useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (!active) return;
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [active, onCancel]);

  if (!active || !type) return null;

  const toSupport = (c: THREE.Vector2, cursor: THREE.Vector3): AnySupport => {
    const snap = 1; // mm grid for higher precision
    const snapv = (v: number) => Math.round(v / snap) * snap;
    const cx = c.x;
    const cz = c.y;
    const px = snapv(cursor.x);
    const pz = snapv(cursor.z);
    const dx = px - cx;
    const dz = pz - cz;
    const dist = Math.max(1, Math.hypot(dx, dz));
    const autoH = computeAutoHeight(cx, cz);
    const height = autoH ?? Number(initParams?.height ?? 6);
    if (type === 'cylindrical') {
      const radius = Number(initParams?.radius ?? dist);
      return { id: `sup-${Date.now()}`, type, center: new THREE.Vector2(cx, cz), height, radius } as AnySupport;
    }
    if (type === 'rectangular') {
      const width = Number(initParams?.width ?? Math.abs(dx) * 2);
      const depth = Number(initParams?.depth ?? Math.abs(dz) * 2);
      const cornerRadius = Number(initParams?.cornerRadius ?? 0);
      return { id: `sup-${Date.now()}`, type, center: new THREE.Vector2(cx, cz), height, width, depth, cornerRadius } as AnySupport;
    }
    if (type === 'conical') {
      const baseRadius = Number(initParams?.baseRadius ?? dist);
      const topRadius = Number(initParams?.topRadius ?? 0);
      return { id: `sup-${Date.now()}`, type, center: new THREE.Vector2(cx, cz), height, baseRadius, topRadius } as AnySupport;
    }
    // custom placeholder
    return { id: `sup-${Date.now()}`, type: 'custom', center: new THREE.Vector2(cx, cz), height, polygon: [[-5,-5],[5,-5],[5,5],[-5,5]] } as AnySupport;
  };

  // 2D outline preview on baseplate top (y≈baseTopY)
  const OutlinePreview: React.FC<{ s: AnySupport }> = ({ s }) => {
    const y = baseTopY + 0.02; // ensure clearly above baseplate top
    const color = 0x2563eb; // blue-600
    if (s.type === 'cylindrical') {
      const radius = (s as any).radius as number;
      const thickness = Math.max(radius * 0.02, 0.6);
      return (
        <mesh position={[s.center.x, y, s.center.y]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
          <ringGeometry args={[Math.max(0.001, radius - thickness), radius + thickness, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
      );
    }
    if (s.type === 'rectangular') {
      const width = (s as any).width as number;
      const depth = (s as any).depth as number;
      const hw = width / 2;
      const hd = depth / 2;
      const positions = new Float32Array([
        -hw, y, -hd,  hw, y, -hd,
         hw, y, -hd,  hw, y,  hd,
         hw, y,  hd, -hw, y,  hd,
        -hw, y,  hd, -hw, y, -hd,
      ]);
      return (
        <lineSegments position={[s.center.x, baseTopY, s.center.y]} renderOrder={999}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={color} linewidth={1} depthWrite={false} depthTest={false} />
        </lineSegments>
      );
    }
    if (s.type === 'conical') {
      const radius = (s as any).baseRadius as number; // base circle only
      const thickness = Math.max(radius * 0.02, 0.6);
      return (
        <mesh position={[s.center.x, y, s.center.y]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={999}>
          <ringGeometry args={[Math.max(0.001, radius - thickness), radius + thickness, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.9} side={THREE.DoubleSide} depthTest={false} depthWrite={false} />
        </mesh>
      );
    }
    if (s.type === 'custom') {
      const poly = (s as any).polygon as Array<[number, number]>;
      const flat = poly.flatMap(([x, z]) => [x, y, z]);
      const positions = new Float32Array([...flat, flat[0], flat[1], flat[2]]);
      return (
        <lineLoop position={[s.center.x, baseTopY, s.center.y]} renderOrder={999}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={color} linewidth={1} depthWrite={false} depthTest={false} />
        </lineLoop>
      );
    }
    return null;
  };

  const handlePointerMove = (e: any) => {
    const p = e.point as THREE.Vector3;
    setHover(new THREE.Vector2(p.x, p.z));
    if (type === 'custom') {
      // live preview is handled by CustomPreview below
      return;
    }
    if (!center) return;
    const support = toSupport(center, p);
    // refresh height with raycast while previewing
    const autoH = computeAutoHeight(center.x, center.y);
    if (autoH != null) (support as any).height = autoH;
    setPreviewSupport(support);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const p = e.point as THREE.Vector3; // on plane y=0
    if (type === 'custom') {
      const pt = new THREE.Vector2(p.x, p.z);
      // Close if near first point and at least 3 points
      if (customPoints.length >= 3) {
        const first = customPoints[0];
        const dist = first.distanceTo(pt);
        if (dist <= 5) {
          // finalize polygon
          const pts = [...customPoints];
          // compute centroid
          const cx = pts.reduce((s,v)=>s+v.x,0)/pts.length;
          const cz = pts.reduce((s,v)=>s+v.y,0)/pts.length;
          const centerV = new THREE.Vector2(cx, cz);
          const polygon = pts.map(v=>[v.x - cx, v.y - cz] as [number, number]);
          const height = Number(initParams?.height ?? 6);
          const support = { id: `sup-${Date.now()}`, type: 'custom', center: centerV, height, polygon } as AnySupport;
          onCreate(support);
          setCustomPoints([]);
          setCenter(null);
          setPreviewSupport(null);
          setDragging(false);
          return;
        }
      }
      // add new point
      setCustomPoints(prev => [...prev, pt]);
      return;
    }
    if (!center) {
      setCenter(new THREE.Vector2(p.x, p.z));
      setDragging(true);
    } else {
      // second click also finalizes if not dragging
      const support = toSupport(center, p);
      const autoH = computeAutoHeight(center.x, center.y);
      if (autoH != null) (support as any).height = autoH;
      onCreate(support);
      setCenter(null);
      setPreviewSupport(null);
      setDragging(false);
    }
  };

  const handlePointerUp = (e: any) => {
    // finalize only on explicit second click, not on pointer up
  };

  // XY Guides (crosshair + axes through point)
  const XYGuides: React.FC<{ point: THREE.Vector2 }> = ({ point }) => {
    const y = baseTopY + 0.03;
    const len = 2000; // extend across scene
    const px = point.x;
    const pz = point.y;
    const positions = new Float32Array([
      // Horizontal X line through Z = pz
      -len, y, pz,   len, y, pz,
      // Vertical Z line through X = px
      px, y, -len,   px, y, len,
    ]);
    const cross = new Float32Array([
      px - 1.5, y, pz - 1.5,  px + 1.5, y, pz + 1.5,
      px - 1.5, y, pz + 1.5,  px + 1.5, y, pz - 1.5,
    ]);
    return (
      <group renderOrder={1000}>
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={0x9CA3AF} depthWrite={false} depthTest={false} linewidth={1} />
        </lineSegments>
        <lineSegments frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={cross.length / 3} array={cross} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={0x374151} depthWrite={false} depthTest={false} linewidth={1} />
        </lineSegments>
      </group>
    );
  };

  // Custom polygon drawing preview (points + live segment). Standalone so JSX can reference it.
  const CustomPreview: React.FC = () => {
    if (type !== 'custom' || (customPoints.length === 0 && !hover)) return null;
    const y = baseTopY + 0.035;
    const pts = [...customPoints];
    if (hover) pts.push(hover.clone());
    if (pts.length < 2) {
      return (
        <>
          {customPoints.map((v, i) => (
            <mesh key={`p-${i}`} position={[v.x, y, v.y]} renderOrder={1001} rotation={[-Math.PI/2,0,0]}>
              <circleGeometry args={[0.9, 20]} />
              <meshBasicMaterial color={0x2563eb} depthTest={false} depthWrite={false} />
            </mesh>
          ))}
        </>
      );
    }
    const flat = pts.flatMap(v => [v.x, y, v.y]);
    const positions = new Float32Array(flat);
    return (
      <>
        {customPoints.map((v, i) => (
          <mesh key={`p-${i}`} position={[v.x, y, v.y]} renderOrder={1001} rotation={[-Math.PI/2,0,0]}>
            <circleGeometry args={[0.9, 20]} />
            <meshBasicMaterial color={i===0 ? 0xef4444 : 0x2563eb} depthTest={false} depthWrite={false} />
          </mesh>
        ))}
        <lineSegments renderOrder={1000}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={positions.length/3} array={positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color={0x2563eb} depthTest={false} depthWrite={false} />
        </lineSegments>
      </>
    );
  };

  return (
    <>
      {/* Large transparent plane aligned to XZ at y=0 to capture pointer events */}
      <mesh
        position={[0, 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[2000, 2000]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* XY Guides: prefer center, then hover, then defaultCenter for hint */}
      {(center || hover || defaultCenter) && (
        <XYGuides point={(center || hover || defaultCenter) as THREE.Vector2} />
      )}

      {/* Center marker (show only after first click) */}
      {center && (
        <mesh position={[center.x, 0.035, center.y]} renderOrder={1001} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.6, 1.2, 24]} />
          <meshBasicMaterial color={0x374151} transparent opacity={0.9} depthTest={false} depthWrite={false} />
        </mesh>
      )}

      {/* 2D Outline Preview (non-custom) */}
      {previewSupport && type !== 'custom' && <OutlinePreview s={previewSupport} />}

      {/* Custom drawing overlay */}
      <CustomPreview />

      {/* HUD */}
      {previewSupport && (
        <Html position={[ (previewSupport as any).center.x, (previewSupport as any).height + 1.2, (previewSupport as any).center.y ]} distanceFactor={3.2}>
          <div className="bg-black/70 text-white rounded-full shadow whitespace-nowrap" style={{ fontSize: '9px', padding: '1px 6px', border: '1px solid rgba(255,255,255,0.25)' }}>
            {previewSupport.type === 'cylindrical' && (
              <>R {(previewSupport as any).radius.toFixed(1)} mm  H {previewSupport.height.toFixed(1)} mm</>
            )}
            {previewSupport.type === 'rectangular' && (
              <>W {(previewSupport as any).width.toFixed(1)} mm  D {(previewSupport as any).depth.toFixed(1)} mm  H {previewSupport.height.toFixed(1)} mm</>
            )}
            {previewSupport.type === 'conical' && (
              <>Rb {(previewSupport as any).baseRadius.toFixed(1)}  Rt {(previewSupport as any).topRadius.toFixed(1)}  H {previewSupport.height.toFixed(1)} mm</>
            )}
            {previewSupport.type === 'custom' && (
              <>Custom  H {previewSupport.height.toFixed(1)} mm</>
            )}
          </div>
        </Html>
      )}

      {center && (
        <Html position={[center.x, 0.01, center.y]}>
          <div className="px-2 py-1 text-xs bg-primary text-white rounded shadow">Click to set center • Drag/Click again to set size • Esc to cancel</div>
        </Html>
      )}
    </>
  );
};

export default SupportPlacement;