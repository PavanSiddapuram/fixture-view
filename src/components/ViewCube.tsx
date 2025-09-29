import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

interface ViewCubeProps {
  onViewChange: (orientation: string) => void;
  className?: string;
  size?: number;
}

const ViewCube: React.FC<ViewCubeProps> = ({ onViewChange, className = '', size = 120 }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const cubeRef = useRef<THREE.Group>();
  const [hoveredFace, setHoveredFace] = useState<string | null>(null);
  const edgeMaterialRef = useRef<THREE.LineBasicMaterial | null>(null);
  const arrowMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);

  useEffect(() => {

    
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    
    renderer.setSize(size, size);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Cube setup
    const cubeGroup = new THREE.Group();
    const geometry = new THREE.BoxGeometry(1, 1, 1);

    // Invisible interaction mesh with 6 materials to preserve face indices for raycasting
    const invisibleMats: THREE.Material[] = [0,1,2,3,4,5].map(() => new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
      side: THREE.FrontSide,
    }));
    const interactionCube = new THREE.Mesh(geometry, invisibleMats);
    cubeGroup.add(interactionCube);

    // Clean edges using EdgesGeometry (outer cube)
    const edges = new THREE.EdgesGeometry(geometry, 1);
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x4d4d4d, transparent: true, opacity: 1 })
    );
    edgeLines.renderOrder = 1;
    cubeGroup.add(edgeLines);
    edgeMaterialRef.current = edgeLines.material as THREE.LineBasicMaterial;

    // Inner cube for contrast (slightly smaller)
    const innerGeom = new THREE.BoxGeometry(1, 1, 1);
    const innerEdges = new THREE.EdgesGeometry(innerGeom, 1);
    const innerLines = new THREE.LineSegments(
      innerEdges,
      new THREE.LineBasicMaterial({ color: 0x4d4d4d, transparent: true, opacity: 1 })
    );
    innerLines.scale.set(0.85, 0.85, 0.85);
    innerLines.renderOrder = 0;
    cubeGroup.add(innerLines);

    // Slightly enlarge the entire cube group for better visibility
    cubeGroup.scale.set(1.2, 1.2, 1.2);
    // Nudge cube a bit downward to avoid top arrow clipping
    cubeGroup.position.y = -0.1;

    // Add labels (uppercase) using canvas sprites
    const labelTexts = ['RIGHT', 'LEFT', 'TOP', 'BOTTOM', 'FRONT', 'BACK'];
    const labelPositions = [
      new THREE.Vector3(0.6, 0, 0),    // Right
      new THREE.Vector3(-0.6, 0, 0),   // Left  
      new THREE.Vector3(0, 0.6, 0),    // Top
      new THREE.Vector3(0, -0.6, 0),   // Bottom
      new THREE.Vector3(0, 0, 0.6),    // Front
      new THREE.Vector3(0, 0, -0.6)    // Back
    ];
    // All labels are rendered; depth testing hides back faces naturally
    
    labelTexts.forEach((text, index) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.width = 128;
      canvas.height = 128;
      
      context.fillStyle = '#000000';
      context.font = '500 36px system-ui';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(text, 64, 64);
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.generateMipmaps = false;
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.needsUpdate = true;
      const spriteMaterial = new THREE.SpriteMaterial({ 
        map: texture, 
        transparent: true,
        opacity: 1,
        depthTest: true,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.copy(labelPositions[index]);
      sprite.scale.set(0.38, 0.38, 1);
      sprite.renderOrder = 1000;
      sprite.frustumCulled = false;
      cubeGroup.add(sprite);
    });

    // Add decorative top arcs similar to screenshot
    const makeArc = (radius: number, start: number, end: number, segments = 32) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= segments; i++) {
        const t = start + (end - start) * (i / segments);
        const x = Math.cos(t) * radius;
        const z = Math.sin(t) * radius;
        pts.push(new THREE.Vector3(x, 0, z));
      }
      const geom = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color: 0x9a9a9a, transparent: true, opacity: 0.8, depthTest: false });
      const line = new THREE.Line(geom, mat);
      line.renderOrder = 1000;
      return line;
    };
    const arcLeft = makeArc(1.6, Math.PI * 0.65, Math.PI * 1.05);   // left side arc
    const arcRight = makeArc(1.6, -Math.PI * 0.05, Math.PI * 0.35); // right side arc
    arcLeft.position.y = 1.25;
    arcRight.position.y = 1.25;
    cubeGroup.add(arcLeft);
    cubeGroup.add(arcRight);

    // Corner arrows as small triangles near corners (screen plane-ish)
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0x666666, transparent: true, opacity: 0.95, depthTest: false, depthWrite: false });
    const tri = new THREE.ConeGeometry(0.07, 0.18, 3);
    const arrows: { mesh: THREE.Mesh; id: string }[] = [];
    const addArrow = (id: string, pos: THREE.Vector3, rot: THREE.Euler) => {
      const m = new THREE.Mesh(tri, arrowMat);
      m.position.copy(pos);
      m.rotation.copy(rot);
      m.renderOrder = 999;
      cubeGroup.add(m);
      arrows.push({ mesh: m, id });
    };
    // Place arrows with a gap away from the cube on 4 sides
    const gap = 1.25; // distance from center
    addArrow('right', new THREE.Vector3(gap, 0, 0), new THREE.Euler(0, 0, -Math.PI / 2));   // +X
    addArrow('left', new THREE.Vector3(-gap, 0, 0), new THREE.Euler(0, 0, Math.PI / 2));   // -X
    addArrow('top', new THREE.Vector3(0, gap, 0), new THREE.Euler(0, 0, 0));               // +Y
    addArrow('bottom', new THREE.Vector3(0, -gap, 0), new THREE.Euler(Math.PI, 0, 0));     // -Y
    arrowMaterialRef.current = arrowMat;

    scene.add(cubeGroup);
    camera.position.set(2, 2, 2);
    camera.lookAt(0, 0, 0);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;
    cubeRef.current = cubeGroup;

    // Raycaster for mouse interaction
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaMove = {
          x: event.clientX - previousMousePosition.x,
          y: event.clientY - previousMousePosition.y
        };
        cubeGroup.rotation.y += deltaMove.x * 0.01;
        cubeGroup.rotation.x += deltaMove.y * 0.01;
        // Publish inverse cube quaternion so main viewer rotates accordingly
        const q = new THREE.Quaternion();
        cubeGroup.getWorldQuaternion(q);
        q.invert();
        const arr: [number, number, number, number] = [q.x, q.y, q.z, q.w];
        window.dispatchEvent(new CustomEvent('viewer-camera-set-quaternion', { detail: { q: arr } }));
        event.stopPropagation();
        event.preventDefault();
      } else {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects([interactionCube, ...arrows.map(a => a.mesh)]);

        if (intersects.length > 0) {
          const faceIndex = intersects[0].face?.materialIndex;
          const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
          setHoveredFace(faceNames[faceIndex || 0]);
          renderer.domElement.style.cursor = 'pointer';
        } else {
          setHoveredFace(null);
          renderer.domElement.style.cursor = 'default';
        }
      }

      previousMousePosition = { x: event.clientX, y: event.clientY };
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      event.stopPropagation();
      event.preventDefault();
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleClick = (event: MouseEvent) => {
      if (isDragging) return; // Don't handle click if we were dragging
      
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([interactionCube, ...arrows.map(a => a.mesh)]);

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj === interactionCube) {
          const faceIndex = intersects[0].face?.materialIndex;
          const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];
          onViewChange(faceNames[faceIndex || 0]);
        } else {
          const arrow = arrows.find(a => a.mesh === obj);
          if (arrow) {
            onViewChange(arrow.id);
          }
        }
      }
    };

    renderer.domElement.addEventListener('mousemove', handleMouseMove);
    renderer.domElement.addEventListener('mousedown', handleMouseDown);
    renderer.domElement.addEventListener('mouseup', handleMouseUp);
    renderer.domElement.addEventListener('click', handleClick);

    // Double-click: advance to next face based on last hovered face, or trigger arrow orientation
    const handleDblClick = (event: MouseEvent) => {
      if (!renderer || !camera) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([interactionCube, ...arrows.map(a => a.mesh)]);

      const cycleOrder = ['front', 'right', 'back', 'left'];
      const faceNames = ['right', 'left', 'top', 'bottom', 'front', 'back'];

      if (intersects.length > 0) {
        const obj = intersects[0].object;
        if (obj === interactionCube) {
          const idx = intersects[0].face?.materialIndex ?? 0;
          const face = faceNames[idx];
          if (face === 'top' || face === 'bottom') {
            onViewChange(face === 'top' ? 'bottom' : 'top');
          } else {
            const i = cycleOrder.indexOf(face);
            const next = cycleOrder[(i + 1) % cycleOrder.length];
            onViewChange(next);
          }
        } else {
          const arrow = arrows.find(a => a.mesh === obj);
          if (arrow) onViewChange(arrow.id);
        }
      } else if (hoveredFace) {
        if (hoveredFace === 'top' || hoveredFace === 'bottom') {
          onViewChange(hoveredFace === 'top' ? 'bottom' : 'top');
        } else {
          const i = cycleOrder.indexOf(hoveredFace);
          const next = cycleOrder[(i + 1) % cycleOrder.length];
          onViewChange(next);
        }
      }
      event.preventDefault();
      event.stopPropagation();
    };
    renderer.domElement.addEventListener('dblclick', handleDblClick);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    // Listen to camera changes from main viewer so cube follows camera
    const handleCameraChanged = (e: CustomEvent<{ q: [number, number, number, number] }>) => {
      if (!cubeGroup) return;
      const [x, y, z, w] = e.detail.q;
      // Apply inverse so the cube acts as a navigator gizmo (industry standard)
      // This makes labeled faces align with selected views consistently, including isometric.
      const q = new THREE.Quaternion(x, y, z, w).invert();
      cubeGroup.setRotationFromQuaternion(q);
    };

    window.addEventListener('viewer-camera-changed', handleCameraChanged as EventListener);

    return () => {
      renderer.domElement.removeEventListener('mousemove', handleMouseMove);
      renderer.domElement.removeEventListener('mousedown', handleMouseDown);
      renderer.domElement.removeEventListener('mouseup', handleMouseUp);
      renderer.domElement.removeEventListener('click', handleClick);
      renderer.domElement.removeEventListener('dblclick', handleDblClick);
      mountRef.current?.removeChild(renderer.domElement);
      renderer.dispose();
      window.removeEventListener('viewer-camera-changed', handleCameraChanged as EventListener);
    };
  }, [onViewChange]);

  // Hover styling: slightly darken edges and arrows when hovering a face
  useEffect(() => {
    if (edgeMaterialRef.current) {
      edgeMaterialRef.current.color.set(hoveredFace ? 0x333333 : 0x666666);
    }
    if (arrowMaterialRef.current) {
      arrowMaterialRef.current.color.set(hoveredFace ? 0x444444 : 0x666666);
      arrowMaterialRef.current.opacity = hoveredFace ? 1 : 0.95;
      arrowMaterialRef.current.needsUpdate = true;
    }
  }, [hoveredFace]);

  return (
    <div
      ref={mountRef}
      className={`view-cube ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        background: 'transparent',
        borderRadius: '12px',
        overflow: 'hidden'
      }}
    />
  );
};

export default ViewCube;