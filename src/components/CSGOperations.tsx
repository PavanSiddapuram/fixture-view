import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GitMerge, 
  Minus, 
  Plus, 
  RotateCcw, 
  Settings, 
  Zap,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight
} from 'lucide-react';
import { CSGEngine } from '@/lib/csgEngine';
import * as THREE from 'three';

interface CSGOperationsProps {
  baseMesh: THREE.Mesh | null;
  fixtureComponents: THREE.Mesh[];
  onResultGenerated: (result: THREE.Mesh) => void;
  className?: string;
}

interface CSGOperation {
  id: string;
  type: 'subtract' | 'union' | 'intersect';
  targetMesh: THREE.Mesh;
  toolMeshes: THREE.Mesh[];
  parameters: {
    depth: number;
    angle: number;
    offset: number;
    direction: THREE.Vector3;
  };
}

const CSGOperations: React.FC<CSGOperationsProps> = ({
  baseMesh,
  fixtureComponents,
  onResultGenerated,
  className = ''
}) => {
  const [operations, setOperations] = useState<CSGOperation[]>([]);
  const [selectedOperation, setSelectedOperation] = useState<CSGOperation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState<'wireframe' | 'solid' | 'transparent'>('solid');

  const csgEngine = React.useMemo(() => new CSGEngine(), []);

  // Predefined removal directions
  const removalDirections = [
    { name: 'Down (-Y)', vector: new THREE.Vector3(0, -1, 0), icon: ArrowDown },
    { name: 'Up (+Y)', vector: new THREE.Vector3(0, 1, 0), icon: ArrowUp },
    { name: 'Left (-X)', vector: new THREE.Vector3(-1, 0, 0), icon: ArrowLeft },
    { name: 'Right (+X)', vector: new THREE.Vector3(1, 0, 0), icon: ArrowRight },
    { name: 'Back (-Z)', vector: new THREE.Vector3(0, 0, -1), icon: ArrowUpLeft },
    { name: 'Forward (+Z)', vector: new THREE.Vector3(0, 0, 1), icon: ArrowUpRight },
  ];

  const createNegativeOperation = useCallback(() => {
    if (!baseMesh || fixtureComponents.length === 0) return;

    const newOperation: CSGOperation = {
      id: `operation-${Date.now()}`,
      type: 'subtract',
      targetMesh: baseMesh,
      toolMeshes: fixtureComponents,
      parameters: {
        depth: 10,
        angle: 0,
        offset: 0,
        direction: new THREE.Vector3(0, -1, 0)
      }
    };

    setOperations(prev => [...prev, newOperation]);
    setSelectedOperation(newOperation);
  }, [baseMesh, fixtureComponents]);

  const updateOperationParameters = useCallback((operationId: string, parameters: Partial<CSGOperation['parameters']>) => {
    setOperations(prev => prev.map(op => 
      op.id === operationId 
        ? { ...op, parameters: { ...op.parameters, ...parameters } }
        : op
    ));
    
    if (selectedOperation?.id === operationId) {
      setSelectedOperation(prev => prev ? { ...prev, parameters: { ...prev.parameters, ...parameters } } : null);
    }
  }, [selectedOperation]);

  const executeOperation = useCallback(async (operation: CSGOperation) => {
    if (!operation.targetMesh || operation.toolMeshes.length === 0) return;

    setIsProcessing(true);
    
    try {
      let result: THREE.Mesh;

      switch (operation.type) {
        case 'subtract':
          result = csgEngine.createNegativeSpace(
            operation.targetMesh,
            operation.toolMeshes,
            operation.parameters.direction,
            {
              depth: operation.parameters.depth,
              angle: operation.parameters.angle,
              offset: operation.parameters.offset
            }
          );
          break;
        case 'union':
          // TODO: Implement union operation
          result = operation.targetMesh.clone();
          break;
        case 'intersect':
          // TODO: Implement intersection operation
          result = operation.targetMesh.clone();
          break;
        default:
          result = operation.targetMesh.clone();
      }

      onResultGenerated(result);
    } catch (error) {
      console.error('CSG operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [csgEngine, onResultGenerated]);

  const executeAllOperations = useCallback(async () => {
    if (operations.length === 0) return;

    setIsProcessing(true);
    
    try {
      let currentMesh = baseMesh;
      if (!currentMesh) return;

      for (const operation of operations) {
        const tempOperation = { ...operation, targetMesh: currentMesh };
        await executeOperation(tempOperation);
        // In a real implementation, you'd get the result from executeOperation
        // and use it as the input for the next operation
      }
    } catch (error) {
      console.error('Batch CSG operations failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [operations, baseMesh, executeOperation]);

  const deleteOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.filter(op => op.id !== operationId));
    if (selectedOperation?.id === operationId) {
      setSelectedOperation(null);
    }
  }, [selectedOperation]);

  const resetOperations = useCallback(() => {
    setOperations([]);
    setSelectedOperation(null);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-blue-600" />
            CSG Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              onClick={createNegativeOperation}
              disabled={!baseMesh || fixtureComponents.length === 0}
              className="flex-1"
            >
              <Minus className="w-4 h-4 mr-2" />
              Create Negative
            </Button>
            <Button
              onClick={executeAllOperations}
              disabled={operations.length === 0 || isProcessing}
              variant="outline"
            >
              <Zap className="w-4 h-4 mr-2" />
              Execute All
            </Button>
            <Button
              onClick={resetOperations}
              disabled={operations.length === 0}
              variant="outline"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset
            </Button>
          </div>

          {/* Status */}
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="secondary">
              {operations.length} Operations
            </Badge>
            {baseMesh && (
              <Badge variant="outline">
                Base Mesh: {baseMesh.geometry.attributes.position.count / 3} triangles
              </Badge>
            )}
            {fixtureComponents.length > 0 && (
              <Badge variant="outline">
                {fixtureComponents.length} Fixture Components
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Operations List */}
      {operations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {operations.map((operation) => (
              <div
                key={operation.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedOperation?.id === operation.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSelectedOperation(operation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={operation.type === 'subtract' ? 'destructive' : 'secondary'}>
                      {operation.type.toUpperCase()}
                    </Badge>
                    <span className="text-sm font-medium">
                      {operation.toolMeshes.length} components
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteOperation(operation.id);
                    }}
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Operation Parameters */}
      {selectedOperation && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Operation Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Removal Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Removal Direction</label>
              <div className="grid grid-cols-2 gap-2">
                {removalDirections.map((direction) => {
                  const IconComponent = direction.icon;
                  const isSelected = selectedOperation.parameters.direction.equals(direction.vector);
                  
                  return (
                    <Button
                      key={direction.name}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateOperationParameters(selectedOperation.id, { direction: direction.vector })}
                      className="justify-start"
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {direction.name}
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Depth */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Depth: {selectedOperation.parameters.depth}mm
              </label>
              <Slider
                value={[selectedOperation.parameters.depth]}
                onValueChange={([value]) => updateOperationParameters(selectedOperation.id, { depth: value })}
                min={1}
                max={50}
                step={1}
                className="w-full"
              />
            </div>

            {/* Angle */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Angle: {selectedOperation.parameters.angle}°
              </label>
              <Slider
                value={[selectedOperation.parameters.angle]}
                onValueChange={([value]) => updateOperationParameters(selectedOperation.id, { angle: value })}
                min={-45}
                max={45}
                step={1}
                className="w-full"
              />
            </div>

            {/* Offset */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Offset: {selectedOperation.parameters.offset}mm
              </label>
              <Slider
                value={[selectedOperation.parameters.offset]}
                onValueChange={([value]) => updateOperationParameters(selectedOperation.id, { offset: value })}
                min={-10}
                max={10}
                step={0.5}
                className="w-full"
              />
            </div>

            <Separator />

            {/* Execute Button */}
            <Button
              onClick={() => executeOperation(selectedOperation)}
              disabled={isProcessing}
              className="w-full"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Execute Operation
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Preview Mode */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={previewMode} onValueChange={(value: any) => setPreviewMode(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="solid">Solid</SelectItem>
              <SelectItem value="wireframe">Wireframe</SelectItem>
              <SelectItem value="transparent">Transparent</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSGOperations;
