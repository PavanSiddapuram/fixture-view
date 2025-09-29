import * as THREE from 'three';

// Support and clamp component definitions
export interface FixtureComponent {
  id: string;
  name: string;
  category: 'support' | 'clamp' | 'baseplate' | 'fastener';
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  defaultPosition?: THREE.Vector3;
  defaultRotation?: THREE.Euler;
  defaultScale?: THREE.Vector3;
  parameters?: Record<string, any>;
}

export interface ComponentLibrary {
  supports: FixtureComponent[];
  clamps: FixtureComponent[];
  baseplates: FixtureComponent[];
  fasteners: FixtureComponent[];
}

// Create basic support shapes
export function createSupportComponents(): ComponentLibrary {
  const supports: FixtureComponent[] = [
    {
      id: 'rectangular-block',
      name: 'Rectangular Block',
      category: 'support',
      geometry: new THREE.BoxGeometry(20, 10, 20),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.7,
        metalness: 0.1
      }),
      parameters: {
        width: 20,
        height: 10,
        depth: 20
      }
    },
    {
      id: 'cylindrical-support',
      name: 'Cylindrical Support',
      category: 'support',
      geometry: new THREE.CylinderGeometry(8, 8, 15, 16),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.7,
        metalness: 0.1
      }),
      parameters: {
        radius: 8,
        height: 15
      }
    },
    {
      id: 'triangular-support',
      name: 'Triangular Support',
      category: 'support',
      geometry: new THREE.ConeGeometry(12, 20, 3),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.7,
        metalness: 0.1
      }),
      parameters: {
        radius: 12,
        height: 20
      }
    },
    {
      id: 'v-block',
      name: 'V-Block Support',
      category: 'support',
      geometry: new THREE.BufferGeometry(),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.7,
        metalness: 0.1
      }),
      parameters: {
        width: 30,
        height: 15,
        angle: 90
      }
    }
  ];

  // Create V-block geometry
  const vBlockGeometry = createVBlockGeometry(30, 15, Math.PI / 2);
  supports[3].geometry = vBlockGeometry;

  const clamps: FixtureComponent[] = [
    {
      id: 'c-clamp',
      name: 'C-Clamp',
      category: 'clamp',
      geometry: new THREE.BufferGeometry(),
      material: new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.5,
        metalness: 0.8
      }),
      parameters: {
        jawWidth: 25,
        throatDepth: 20,
        height: 30
      }
    },
    {
      id: 'toggle-clamp',
      name: 'Toggle Clamp',
      category: 'clamp',
      geometry: new THREE.BufferGeometry(),
      material: new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.5,
        metalness: 0.8
      }),
      parameters: {
        baseWidth: 40,
        height: 25,
        armLength: 35
      }
    },
    {
      id: 'edge-clamp',
      name: 'Edge Clamp',
      category: 'clamp',
      geometry: new THREE.BufferGeometry(),
      material: new THREE.MeshStandardMaterial({
        color: 0x2d3748,
        roughness: 0.5,
        metalness: 0.8
      }),
      parameters: {
        length: 50,
        width: 15,
        height: 20
      }
    }
  ];

  // Create clamp geometries
  clamps[0].geometry = createCClampGeometry(25, 20, 30);
  clamps[1].geometry = createToggleClampGeometry(40, 25, 35);
  clamps[2].geometry = createEdgeClampGeometry(50, 15, 20);

  const baseplates: FixtureComponent[] = [
    {
      id: 'perforated-plate',
      name: 'Perforated Baseplate',
      category: 'baseplate',
      geometry: new THREE.BoxGeometry(200, 5, 150),
      material: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.8,
        metalness: 0.1
      }),
      parameters: {
        width: 200,
        depth: 150,
        height: 5,
        holeDiameter: 8,
        holeSpacing: 25
      }
    },
    {
      id: 'solid-plate',
      name: 'Solid Baseplate',
      category: 'baseplate',
      geometry: new THREE.BoxGeometry(200, 5, 150),
      material: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.8,
        metalness: 0.1
      }),
      parameters: {
        width: 200,
        depth: 150,
        height: 5
      }
    },
    {
      id: 'grid-plate',
      name: 'Grid Baseplate',
      category: 'baseplate',
      geometry: new THREE.BoxGeometry(200, 5, 150),
      material: new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        roughness: 0.8,
        metalness: 0.1
      }),
      parameters: {
        width: 200,
        depth: 150,
        height: 5,
        gridSize: 20
      }
    }
  ];

  // Create perforated plate geometry
  baseplates[0].geometry = createPerforatedPlateGeometry(200, 150, 5, 8, 25);

  const fasteners: FixtureComponent[] = [
    {
      id: 'socket-head-screw',
      name: 'Socket Head Screw',
      category: 'fastener',
      geometry: new THREE.CylinderGeometry(3, 3, 20),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.3,
        metalness: 0.9
      }),
      parameters: {
        diameter: 6,
        length: 20,
        headDiameter: 10,
        headHeight: 6
      }
    },
    {
      id: 'washer',
      name: 'Washer',
      category: 'fastener',
      geometry: new THREE.CylinderGeometry(5, 5, 2),
      material: new THREE.MeshStandardMaterial({
        color: 0x4a5568,
        roughness: 0.3,
        metalness: 0.9
      }),
      parameters: {
        outerDiameter: 10,
        innerDiameter: 6,
        thickness: 2
      }
    }
  ];

  return {
    supports,
    clamps,
    baseplates,
    fasteners
  };
}

function createVBlockGeometry(width: number, height: number, angle: number): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  const halfWidth = width / 2;
  const halfAngle = angle / 2;

  // Create vertices for V-block
  vertices.push(
    -halfWidth, 0, 0,      // Bottom left
    halfWidth, 0, 0,       // Bottom right
    0, height, 0,          // Top center
    -halfWidth, 0, -10,    // Bottom left back
    halfWidth, 0, -10,     // Bottom right back
    0, height, -10         // Top center back
  );

  // Create faces
  indices.push(
    0, 1, 2,    // Front face
    3, 4, 5,    // Back face
    0, 3, 4, 0, 4, 1,  // Bottom face
    0, 3, 5, 0, 5, 2,  // Left face
    1, 4, 5, 1, 5, 2   // Right face
  );

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

function createCClampGeometry(jawWidth: number, throatDepth: number, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  // Create C-clamp profile
  shape.moveTo(0, 0);
  shape.lineTo(jawWidth, 0);
  shape.lineTo(jawWidth, throatDepth);
  shape.lineTo(jawWidth + 10, throatDepth);
  shape.lineTo(jawWidth + 10, height);
  shape.lineTo(0, height);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    depth: 15,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1,
    bevelOffset: 0,
    bevelSegments: 5
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function createToggleClampGeometry(baseWidth: number, height: number, armLength: number): THREE.BufferGeometry {
  const group = new THREE.Group();

  // Base
  const baseGeometry = new THREE.BoxGeometry(baseWidth, 8, 20);
  const base = new THREE.Mesh(baseGeometry);
  base.position.set(0, 4, 0);

  // Arm
  const armGeometry = new THREE.BoxGeometry(8, height, armLength);
  const arm = new THREE.Mesh(armGeometry);
  arm.position.set(0, height / 2 + 4, armLength / 2);

  // Combine geometries
  const combinedGeometry = new THREE.BufferGeometry();

  // This is a simplified approach - in a real implementation,
  // you'd merge the geometries properly
  return new THREE.BoxGeometry(baseWidth, height + 8, 20);
}

function createEdgeClampGeometry(length: number, width: number, height: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();

  shape.moveTo(0, 0);
  shape.lineTo(length, 0);
  shape.lineTo(length, height);
  shape.lineTo(length - 10, height);
  shape.lineTo(length - 10, width);
  shape.lineTo(0, width);
  shape.lineTo(0, 0);

  const extrudeSettings = {
    depth: 20,
    bevelEnabled: true,
    bevelThickness: 1,
    bevelSize: 1
  };

  return new THREE.ExtrudeGeometry(shape, extrudeSettings);
}

function createPerforatedPlateGeometry(width: number, depth: number, height: number, holeDiameter: number, holeSpacing: number): THREE.BufferGeometry {
  // Create base plate
  const baseGeometry = new THREE.BoxGeometry(width, height, depth);

  // Create holes pattern
  const holes: THREE.Vector3[] = [];
  const halfWidth = width / 2;
  const halfDepth = depth / 2;

  for (let x = -halfWidth + holeSpacing; x < halfWidth; x += holeSpacing) {
    for (let z = -halfDepth + holeSpacing; z < halfDepth; z += holeSpacing) {
      holes.push(new THREE.Vector3(x, height / 2, z));
    }
  }

  // For simplicity, return the base geometry
  // In a real implementation, you'd subtract the holes using CSG
  return baseGeometry;
}
