  const [center, setCenter] = React.useState<THREE.Vector2 | null>(null);
  const [previewSupport, setPreviewSupport] = React.useState<AnySupport | null>(null);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setCenter(null);
      setPreviewSupport(null);
    }
  }, [active]);

  // No keyboard contr}

const SupportPlacement: React.FC<SupportPlacementProps> = ({ active, type, initParams, onCreate, onCancel }) => {
  const [center, setCenter] = React.useState<THREE.Vector2 | null>(null);
  const [previewSupport, setPreviewSupport] = React.useState<AnySupport | null>(null);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    if (!active) {
      setCenter(null);
      setPreviewSupport(null);
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
    const snap = 5; // mm grid
    const snapv = (v: number) => Math.round(v / snap) * snap;
    const cx = c.x;
    const cz = c.y;
    const px = snapv(cursor.x);
    const pz = snapv(cursor.z);
    const dx = px - cx;
    const dz = pz - cz;
    const dist = Math.max(1, Math.hypot(dx, dz));
    const height = Number(initParams?.height ?? 10);
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

  const handlePointerMove = (e: any) => {
    if (!center) return;
    const c = center;
    const support = toSupport(c, e.point);
    setPreviewSupport(support);
  };

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    const p = e.point as THREE.Vector3; // on plane y=0
    if (!center) {
      setCenter(new THREE.Vector2(p.x, p.z));
      setDragging(true);
    } else {
      // second click also finalizes if not dragging
      const support = toSupport(center, p);
      onCreate(support);
      setCenter(null);
      setPreviewSupport(null);
      setDragging(false);
    }
  };

  const handlePointerUp = (e: any) => {
    if (!dragging || !center) return;
    e.stopPropagation();
    const p = e.point as THREE.Vector3;
    const support = toSupport(center, p);
    onCreate(support);
    setCenter(null);
    setPreviewSupport(null);
    setDragging(false);
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
(previewSupport as any).width.toFixed(1)} mm • D {(previewSupport as any).depth.toFixed(1)} mm • H {previewSupport.height} mm
                </>
              )}
              {previewSupport.type === 'conical' && (
                <>
                  Rb {(previewSupport as any).baseRadius.toFixed(1)} • Rt {(previewSupport as any).topRadius.toFixed(1)} • H {previewSupport.height} mm
                </>
              )}
            </div>
          </Html>
        </>
      )}

      {center && (
        <Html position={[center.x, 0.01, center.y]}>
          <div className="px-2 py-1 text-xs bg-primary text-white rounded shadow">Click to set center • Drag/Click again to set size • Esc to cancel</div>
