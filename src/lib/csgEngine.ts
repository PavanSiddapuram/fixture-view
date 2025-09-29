import * as THREE from 'three';
import { SUBTRACTION, Brush, Evaluator } from 'three-bvh-csg';

export interface CSGOperation {
  type: 'union' | 'subtract' | 'intersect';
  targetMesh: THREE.Mesh;
  toolMeshes: THREE.Mesh[];
  resultMesh?: THREE.Mesh;
}

export interface FixtureNegative {
  id: string;
  operation: CSGOperation;
  removalDirection: THREE.Vector3;
  parameters: {
    depth: number;
    angle: number;
    offset: number;
  };
}

export class CSGEngine {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
  }

  /**
   * Create a negative space by subtracting fixture components from the base part
   */
  createNegativeSpace(
    baseMesh: THREE.Mesh,
    fixtureComponents: THREE.Mesh[],
    removalDirection: THREE.Vector3 = new THREE.Vector3(0, -1, 0),
    options: {
      depth?: number;
      angle?: number;
      offset?: number;
    } = {}
  ): THREE.Mesh {
    const {
      depth = 10,
      angle = 0,
      offset = 0
    } = options;

    // Create a brush from the base mesh
    const baseBrush = new Brush(baseMesh.geometry.clone());

    // Create subtraction brushes from fixture components
    const subtractionBrushes = fixtureComponents.map(mesh => {
      const brush = new Brush(mesh.geometry.clone());

      // Apply transformation to create the negative space
      const matrix = new THREE.Matrix4();
      matrix.makeTranslation(0, -depth / 2, 0); // Move down by half depth
      matrix.multiply(new THREE.Matrix4().makeRotationFromEuler(
        new THREE.Euler(angle * Math.PI / 180, 0, 0)
      ));
      brush.applyMatrix4(matrix);

      return brush;
    });

    // Perform CSG subtraction
    let resultBrush = baseBrush;
    subtractionBrushes.forEach(brush => {
      resultBrush = this.evaluator.evaluate(resultBrush, brush, SUBTRACTION);
    });

    // Convert back to mesh
    const resultGeometry = resultBrush.geometry;
    const resultMesh = new THREE.Mesh(resultGeometry, baseMesh.material.clone());

    return resultMesh;
  }

  /**
   * Create a pocket/hole in the base mesh
   */
  createPocket(
    baseMesh: THREE.Mesh,
    pocketShape: THREE.BufferGeometry,
    position: THREE.Vector3,
    depth: number = 5,
    direction: THREE.Vector3 = new THREE.Vector3(0, -1, 0)
  ): THREE.Mesh {
    // Create pocket brush
    const pocketBrush = new Brush(pocketShape);

    // Position the pocket
    const matrix = new THREE.Matrix4();
    matrix.setPosition(position);
    matrix.multiply(new THREE.Matrix4().makeRotationFromEuler(
      new THREE.Euler(
        Math.atan2(direction.z, direction.y),
        Math.atan2(direction.x, direction.y),
        0
      )
    ));
    pocketBrush.applyMatrix4(matrix);

    // Create base brush
    const baseBrush = new Brush(baseMesh.geometry.clone());

    // Perform subtraction
    const resultBrush = this.evaluator.evaluate(baseBrush, pocketBrush, SUBTRACTION);

    // Convert to mesh
    const resultGeometry = resultBrush.geometry;
    const resultMesh = new THREE.Mesh(resultGeometry, baseMesh.material.clone());

    return resultMesh;
  }

  /**
   * Create a chamfer or bevel on edges
   */
  createChamfer(
    baseMesh: THREE.Mesh,
    chamferSize: number = 2,
    chamferAngle: number = 45
  ): THREE.Mesh {
    // This is a simplified chamfer implementation
    // In a real implementation, you'd detect edges and create chamfer geometry

    const baseBrush = new Brush(baseMesh.geometry.clone());

    // Create a slightly smaller version offset inward
    const offsetGeometry = this.createOffsetGeometry(baseMesh.geometry, -chamferSize);
    if (offsetGeometry) {
      const offsetBrush = new Brush(offsetGeometry);
      const resultBrush = this.evaluator.evaluate(baseBrush, offsetBrush, SUBTRACTION);

      const resultGeometry = resultBrush.geometry;
      const resultMesh = new THREE.Mesh(resultGeometry, baseMesh.material.clone());

      return resultMesh;
    }

    return baseMesh.clone();
  }

  /**
   * Create a fillet (rounded edge)
   */
  createFillet(
    baseMesh: THREE.Mesh,
    filletRadius: number = 2
  ): THREE.Mesh {
    // This would require more complex geometry processing
    // For now, return the original mesh
    console.warn('Fillet creation not yet implemented');
    return baseMesh.clone();
  }

  /**
   * Create an offset geometry (shell operation)
   */
  createOffsetGeometry(geometry: THREE.BufferGeometry, offset: number): THREE.BufferGeometry | null {
    // This is a placeholder for offset geometry creation
    // In a real implementation, you'd use a proper offset algorithm
    console.warn('Offset geometry creation not yet implemented');
    return null;
  }

  /**
   * Validate that a CSG operation will produce a valid result
   */
  validateOperation(baseMesh: THREE.Mesh, toolMeshes: THREE.Mesh[]): boolean {
    try {
      // Check if meshes have valid geometry
      if (!baseMesh.geometry || baseMesh.geometry.attributes.position.count === 0) {
        return false;
      }

      for (const toolMesh of toolMeshes) {
        if (!toolMesh.geometry || toolMesh.geometry.attributes.position.count === 0) {
          return false;
        }
      }

      // Check if tool meshes intersect with base mesh
      const baseBox = new THREE.Box3().setFromObject(baseMesh);
      const hasIntersection = toolMeshes.some(toolMesh => {
        const toolBox = new THREE.Box3().setFromObject(toolMesh);
        return baseBox.intersectsBox(toolBox);
      });

      return hasIntersection;
    } catch (error) {
      console.error('Error validating CSG operation:', error);
      return false;
    }
  }

  /**
   * Optimize geometry after CSG operations
   */
  optimizeGeometry(mesh: THREE.Mesh): THREE.Mesh {
    // Merge vertices
    mesh.geometry.mergeVertices();

    // Remove duplicate faces
    mesh.geometry = this.removeDuplicateFaces(mesh.geometry);

    // Compute normals
    mesh.geometry.computeVertexNormals();
    mesh.geometry.computeBoundingBox();
    mesh.geometry.computeBoundingSphere();

    return mesh;
  }

  /**
   * Remove duplicate faces from geometry
   */
  private removeDuplicateFaces(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    // This is a simplified implementation
    // In a real implementation, you'd properly detect and remove duplicate faces
    return geometry;
  }

  /**
   * Create a cutting plane for sectioning
   */
  createCuttingPlane(
    baseMesh: THREE.Mesh,
    planeNormal: THREE.Vector3,
    planePoint: THREE.Vector3
  ): THREE.Mesh {
    const baseBrush = new Brush(baseMesh.geometry.clone());

    // Create cutting plane
    const planeGeometry = new THREE.PlaneGeometry(1000, 1000);
    const plane = new THREE.Mesh(planeGeometry);
    plane.position.copy(planePoint);
    plane.lookAt(planePoint.clone().add(planeNormal));

    const planeBrush = new Brush(plane.geometry);

    // Perform intersection to create section
    const resultBrush = this.evaluator.evaluate(baseBrush, planeBrush, SUBTRACTION);

    const resultGeometry = resultBrush.geometry;
    const resultMesh = new THREE.Mesh(resultGeometry, baseMesh.material.clone());

    return resultMesh;
  }
}

// Utility functions for common operations
export const csgUtils = {
  /**
   * Create a cylindrical hole
   */
  createCylindricalHole(
    baseMesh: THREE.Mesh,
    radius: number,
    depth: number,
    position: THREE.Vector3,
    direction: THREE.Vector3 = new THREE.Vector3(0, -1, 0)
  ): THREE.Mesh {
    const engine = new CSGEngine();
    const holeGeometry = new THREE.CylinderGeometry(radius, radius, depth, 16);
    return engine.createPocket(baseMesh, holeGeometry, position, depth, direction);
  },

  /**
   * Create a rectangular pocket
   */
  createRectangularPocket(
    baseMesh: THREE.Mesh,
    width: number,
    length: number,
    depth: number,
    position: THREE.Vector3,
    rotation: THREE.Euler = new THREE.Euler()
  ): THREE.Mesh {
    const engine = new CSGEngine();
    const pocketGeometry = new THREE.BoxGeometry(width, depth, length);

    // Apply rotation
    pocketGeometry.rotateX(rotation.x);
    pocketGeometry.rotateY(rotation.y);
    pocketGeometry.rotateZ(rotation.z);

    return engine.createPocket(baseMesh, pocketGeometry, position, depth);
  },

  /**
   * Create a counterbore hole
   */
  createCounterboreHole(
    baseMesh: THREE.Mesh,
    holeRadius: number,
    counterboreRadius: number,
    holeDepth: number,
    counterboreDepth: number,
    position: THREE.Vector3
  ): THREE.Mesh {
    const engine = new CSGEngine();

    // Create counterbore
    const counterboreGeometry = new THREE.CylinderGeometry(counterboreRadius, counterboreRadius, counterboreDepth, 16);
    let resultMesh = engine.createPocket(baseMesh, counterboreGeometry, position, counterboreDepth);

    // Create through hole
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16);
    resultMesh = engine.createPocket(resultMesh, holeGeometry, position, holeDepth);

    return resultMesh;
  },

  /**
   * Create a countersink hole
   */
  createCountersinkHole(
    baseMesh: THREE.Mesh,
    holeRadius: number,
    countersinkRadius: number,
    holeDepth: number,
    countersinkAngle: number,
    position: THREE.Vector3
  ): THREE.Mesh {
    const engine = new CSGEngine();

    // Create countersink (conical shape)
    const countersinkHeight = (countersinkRadius - holeRadius) / Math.tan(countersinkAngle * Math.PI / 180);
    const countersinkGeometry = new THREE.ConeGeometry(countersinkRadius, countersinkHeight, 16);
    let resultMesh = engine.createPocket(baseMesh, countersinkGeometry, position, countersinkHeight);

    // Create through hole
    const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, holeDepth, 16);
    resultMesh = engine.createPocket(resultMesh, holeGeometry, position, holeDepth);

    return resultMesh;
  }
};
