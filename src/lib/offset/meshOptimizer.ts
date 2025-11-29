import * as THREE from 'three';

export function removeDegenerateTriangles(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const positions = geometry.attributes.position.array as ArrayLike<number>;
  const indices = geometry.index?.array as ArrayLike<number>;
  if (!indices) return geometry;

  const newIndices: number[] = [];
  let removedTriangles = 0;
  const epsilon = 1e-10;

  for (let i = 0; i < indices.length; i += 3) {
    const i0 = indices[i] * 3;
    const i1 = indices[i + 1] * 3;
    const i2 = indices[i + 2] * 3;

    const v0x = positions[i0], v0y = positions[i0 + 1], v0z = positions[i0 + 2];
    const v1x = positions[i1], v1y = positions[i1 + 1], v1z = positions[i1 + 2];
    const v2x = positions[i2], v2y = positions[i2 + 1], v2z = positions[i2 + 2];

    const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
    const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

    const cx = e1y * e2z - e1z * e2y;
    const cy = e1z * e2x - e1x * e2z;
    const cz = e1x * e2y - e1y * e2x;
    const areaSq = cx * cx + cy * cy + cz * cz;

    if (areaSq > epsilon) {
      newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
    } else {
      removedTriangles++;
    }
  }

  if (removedTriangles > 0) {
    console.log(`Removed ${removedTriangles} degenerate triangles`);
    const cleanedGeometry = new THREE.BufferGeometry();
    cleanedGeometry.setAttribute('position', geometry.attributes.position.clone());
    cleanedGeometry.setIndex(newIndices);
    cleanedGeometry.computeVertexNormals();
    return cleanedGeometry;
  }

  return geometry;
}

export function verifyWatertightness(geometry: THREE.BufferGeometry) {
  const indices = geometry.index?.array as ArrayLike<number>;
  const positions = geometry.attributes.position.array as ArrayLike<number>;
  if (!indices) {
    return {
      isWatertight: false,
      totalEdges: 0,
      manifoldEdges: 0,
      boundaryEdges: 0,
      overSharedEdges: 0,
      nonManifoldEdges: 0,
      edgeTriangles: new Map<string, number[]>(),
    };
  }

  const edges = new Map<string, number>();
  const edgeTriangles = new Map<string, number[]>();

  for (let i = 0; i < indices.length; i += 3) {
    const triIdx = i / 3;
    const v0 = indices[i];
    const v1 = indices[i + 1];
    const v2 = indices[i + 2];

    const edgesInTri: [number, number][] = [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ];

    for (const [va, vb] of edgesInTri) {
      const key = va < vb ? `${va}_${vb}` : `${vb}_${va}`;
      edges.set(key, (edges.get(key) || 0) + 1);

      if (!edgeTriangles.has(key)) {
        edgeTriangles.set(key, []);
      }
      edgeTriangles.get(key)!.push(triIdx);
    }
  }

  let nonManifoldEdges = 0;
  const edgesByCount: Record<string, number> = { '0': 0, '1': 0, '2': 0, '3+': 0 };

  for (const [, count] of edges) {
    if (count === 2) {
      edgesByCount['2']++;
    } else {
      nonManifoldEdges++;
      if (count === 1) edgesByCount['1']++;
      else if (count === 0) edgesByCount['0']++;
      else edgesByCount['3+']++;
    }
  }

  console.log(`Manifold check: ${edges.size} total edges`);
  console.log(`  - Manifold (count=2): ${edgesByCount['2']}`);
  console.log(`  - Boundary (count=1): ${edgesByCount['1']}`);
  console.log(`  - Over-shared (count=3+): ${edgesByCount['3+']}`);
  console.log(`  - Non-manifold total: ${nonManifoldEdges}`);

  return {
    isWatertight: nonManifoldEdges === 0,
    totalEdges: edges.size,
    manifoldEdges: edgesByCount['2'],
    boundaryEdges: edgesByCount['1'],
    overSharedEdges: edgesByCount['3+'],
    nonManifoldEdges,
    edgeTriangles,
  };
}

export function repairNonManifoldMesh(
  geometry: THREE.BufferGeometry,
  maxIterations = 5,
): THREE.BufferGeometry {
  console.log('Attempting to repair non-manifold geometry...');

  let currentGeometry = geometry;
  let iteration = 0;

  while (iteration < maxIterations) {
    const indices = Array.from(currentGeometry.index!.array as ArrayLike<number>);
    const positions = currentGeometry.attributes.position.array as ArrayLike<number>;

    const edgeTriangles = new Map<string, number[]>();

    for (let i = 0; i < indices.length; i += 3) {
      const triIdx = i / 3;
      const v0 = indices[i];
      const v1 = indices[i + 1];
      const v2 = indices[i + 2];

      const edgesInTri: [number, number][] = [
        [v0, v1],
        [v1, v2],
        [v2, v0],
      ];

      for (const [va, vb] of edgesInTri) {
        const key = va < vb ? `${va}_${vb}` : `${vb}_${va}`;
        if (!edgeTriangles.has(key)) {
          edgeTriangles.set(key, []);
        }
        edgeTriangles.get(key)!.push(triIdx);
      }
    }

    const overSharedEdges: Array<{ edge: string; triangles: number[] }> = [];
    const boundaryEdges: Array<{ edge: string; triangles: number[] }> = [];

    for (const [edge, tris] of edgeTriangles) {
      if (tris.length > 2) {
        overSharedEdges.push({ edge, triangles: tris });
      } else if (tris.length === 1) {
        boundaryEdges.push({ edge, triangles: tris });
      }
    }

    if (overSharedEdges.length === 0 && boundaryEdges.length === 0) {
      console.log(`✓ Repair complete after ${iteration} iteration(s)`);
      return currentGeometry;
    }

    console.log(`Iteration ${iteration + 1}: Found ${overSharedEdges.length} over-shared edges, ${boundaryEdges.length} boundary edges`);

    if (overSharedEdges.length === 0 && iteration > 0) {
      console.log(`✓ Repair stopped - only boundary edges remain (${boundaryEdges.length})`);
      return currentGeometry;
    }

    const getTriangleArea = (triIdx: number): number => {
      const i = triIdx * 3;
      const i0 = indices[i] * 3;
      const i1 = indices[i + 1] * 3;
      const i2 = indices[i + 2] * 3;

      const v0x = positions[i0], v0y = positions[i0 + 1], v0z = positions[i0 + 2];
      const v1x = positions[i1], v1y = positions[i1 + 1], v1z = positions[i1 + 2];
      const v2x = positions[i2], v2y = positions[i2 + 1], v2z = positions[i2 + 2];

      const e1x = v1x - v0x, e1y = v1y - v0y, e1z = v1z - v0z;
      const e2x = v2x - v0x, e2y = v2y - v0y, e2z = v2z - v0z;

      const cx = e1y * e2z - e1z * e2y;
      const cy = e1z * e2x - e1x * e2z;
      const cz = e1x * e2y - e1y * e2x;

      return Math.sqrt(cx * cx + cy * cy + cz * cz) * 0.5;
    };

    const trianglesToRemove = new Set<number>();

    for (const { triangles } of overSharedEdges) {
      const sortedTris = triangles.slice().sort((a, b) => getTriangleArea(b) - getTriangleArea(a));
      for (let i = 2; i < sortedTris.length; i++) {
        trianglesToRemove.add(sortedTris[i]);
      }
    }

    if (trianglesToRemove.size === 0) {
      console.log('✓ No triangles to remove');
      return currentGeometry;
    }

    console.log(`  Removing ${trianglesToRemove.size} triangles to fix over-shared edges`);

    const newIndices: number[] = [];
    for (let i = 0; i < indices.length; i += 3) {
      const triIdx = i / 3;
      if (!trianglesToRemove.has(triIdx)) {
        newIndices.push(indices[i], indices[i + 1], indices[i + 2]);
      }
    }

    const repairedGeometry = new THREE.BufferGeometry();
    repairedGeometry.setAttribute('position', currentGeometry.attributes.position.clone());
    repairedGeometry.setIndex(newIndices);
    repairedGeometry.computeVertexNormals();

    console.log(`  ${indices.length / 3} → ${newIndices.length / 3} triangles`);

    currentGeometry = repairedGeometry;
    iteration++;
  }

  console.log(`⚠ Repair incomplete after ${maxIterations} iterations`);
  return currentGeometry;
}
