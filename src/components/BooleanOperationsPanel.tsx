import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Minus,
  Plus,
  RotateCcw,
  Settings,
  Eye,
  EyeOff,
  Trash2,
  Copy,
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight
} from 'lucide-react';
import * as THREE from 'three';
import { CSGEngine, FixtureNegative, csgUtils } from '@/lib/csgEngine';

interface BooleanOperationsPanelProps {
  baseMesh: THREE.Mesh | null;
  fixtureComponents: THREE.Mesh[];
  onOperationComplete?: (resultMesh: THREE.Mesh) => void;
  onNegativeCreate?: (negative: FixtureNegative) => void;
  className?: string;
}

interface OperationState {
  type: 'subtract' | 'intersect' | 'union';
  depth: number;
  angle: number;
  offset: number;
  removalDirection: THREE.Vector3;
  preview: boolean;
}

const BooleanOperationsPanel: React.FC<BooleanOperationsPanelProps> = ({
  baseMesh,
  fixtureComponents,
  onOperationComplete,
  onNegativeCreate,
  className = ''
}) => {
  const [operationState, setOperationState] = useState<OperationState>({
    type: 'subtract',
    depth: 10,
    angle: 0,
    offset: 0,
    removalDirection: new THREE.Vector3(0, -1, 0),
    preview: false
  });

  const [createdNegatives, setCreatedNegatives] = useState<FixtureNegative[]>([]);
  const [selectedNegative, setSelectedNegative] = useState<string | null>(null);

  const csgEngine = new CSGEngine();

  const handleOperationTypeChange = (type: 'subtract' | 'intersect' | 'union') => {
    setOperationState(prev => ({ ...prev, type }));
  };

  const handleRunPreview = () => {
    if (!baseMesh || fixtureComponents.length === 0) {
      console.warn('No base mesh or fixture components available');
      return;
    }
    try {
      const resultMesh = csgEngine.createNegativeSpace(
        baseMesh,
        fixtureComponents,
        operationState.removalDirection,
        {
          depth: operationState.depth,
          angle: operationState.angle,
          offset: operationState.offset
        }
      );
      onOperationComplete?.(resultMesh);
    } catch (error) {
      console.error('Error creating preview:', error);
    }
  };

  const handleApply = () => {
    if (!baseMesh || fixtureComponents.length === 0) {
      console.warn('No base mesh or fixture components available');
      return;
    }
    try {
      const resultMesh = csgEngine.createNegativeSpace(
        baseMesh,
        fixtureComponents,
        operationState.removalDirection,
        {
          depth: operationState.depth,
          angle: operationState.angle,
          offset: operationState.offset
        }
      );
      window.dispatchEvent(new CustomEvent('cavity-apply', { detail: { mesh: resultMesh } }));
    } catch (error) {
      console.error('Error applying negative space:', error);
    }
  };

  const handleParameterChange = (parameter: keyof OperationState, value: any) => {
    setOperationState(prev => ({ ...prev, [parameter]: value }));
  };

  const handlePreviewToggle = () => {
    setOperationState(prev => ({ ...prev, preview: !prev.preview }));
  };

  const handleCreateNegative = () => {
    if (!baseMesh || fixtureComponents.length === 0) {
      console.warn('No base mesh or fixture components available');
      return;
    }

    try {
      // Create the negative space
      const resultMesh = csgEngine.createNegativeSpace(
        baseMesh,
        fixtureComponents,
        operationState.removalDirection,
        {
          depth: operationState.depth,
          angle: operationState.angle,
          offset: operationState.offset
        }
      );

      // Create negative record
      const negative: FixtureNegative = {
        id: `negative-${Date.now()}`,
        operation: {
          type: operationState.type,
          targetMesh: baseMesh,
          toolMeshes: fixtureComponents,
          resultMesh
        },
        removalDirection: operationState.removalDirection,
        parameters: {
          depth: operationState.depth,
          angle: operationState.angle,
          offset: operationState.offset
        }
      };

      setCreatedNegatives(prev => [...prev, negative]);
      onNegativeCreate?.(negative);
      onOperationComplete?.(resultMesh);

    } catch (error) {
      console.error('Error creating negative space:', error);
    }
  };

  const handleDeleteNegative = (negativeId: string) => {
    setCreatedNegatives(prev => prev.filter(n => n.id !== negativeId));
  };

  const handleDuplicateNegative = (negativeId: string) => {
    const negative = createdNegatives.find(n => n.id === negativeId);
    if (negative) {
      const duplicated: FixtureNegative = {
        ...negative,
        id: `negative-${Date.now()}`,
        parameters: {
          ...negative.parameters,
          depth: negative.parameters.depth + 2
        }
      };
      setCreatedNegatives(prev => [...prev, duplicated]);
    }
  };

  const handleQuickOperation = (operationType: string) => {
    if (!baseMesh) return;

    let resultMesh: THREE.Mesh;

    switch (operationType) {
      case 'cylindrical-hole':
        resultMesh = csgUtils.createCylindricalHole(
          baseMesh,
          5,
          operationState.depth,
          new THREE.Vector3(0, 0, 0)
        );
        break;
      case 'rectangular-pocket':
        resultMesh = csgUtils.createRectangularPocket(
          baseMesh,
          20,
          20,
          operationState.depth,
          new THREE.Vector3(0, 0, 0)
        );
        break;
      case 'chamfer':
        resultMesh = csgEngine.createChamfer(baseMesh, 2, 45);
        break;
      default:
        return;
    }

    onOperationComplete?.(resultMesh);
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'subtract': return <Minus className="w-4 h-4" />;
      case 'union': return <Plus className="w-4 h-4" />;
      case 'intersect': return <Settings className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getOperationColor = (type: string) => {
    switch (type) {
      case 'subtract': return 'destructive';
      case 'union': return 'default';
      case 'intersect': return 'secondary';
      default: return 'secondary';
    }
  };

  return (
    <div className={`w-80 border-l border-border/50 tech-glass flex flex-col ${className}`}>
      <div className="p-4 border-b border-border/50">
        <h2 className="font-tech font-semibold text-lg mb-1">Boolean Operations</h2>
        <p className="text-xs text-muted-foreground font-tech">
          Create negative spaces in your fixture
        </p>
      </div>

      <Tabs defaultValue="create" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="create" className="text-xs">Create</TabsTrigger>
          <TabsTrigger value="library" className="text-xs">Library</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="create" className="mt-0 h-full">
            <div className="space-y-4">
              {/* Operation Type Selection */}
              <div>
                <h3 className="font-medium text-sm mb-2">Operation Type</h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['subtract', 'union', 'intersect'] as const).map((type) => (
                    <Button
                      key={type}
                      variant={operationState.type === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleOperationTypeChange(type)}
                      className="text-xs"
                    >
                      {getOperationIcon(type)}
                      <span className="ml-1 capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Parameters */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Depth: {operationState.depth}mm
                  </label>
                  <Slider
                    value={[operationState.depth]}
                    onValueChange={([value]) => handleParameterChange('depth', value)}
                    min={1}
                    max={50}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Angle: {operationState.angle}°
                  </label>
                  <Slider
                    value={[operationState.angle]}
                    onValueChange={([value]) => handleParameterChange('angle', value)}
                    min={-90}
                    max={90}
                    step={5}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Offset: {operationState.offset}mm
                  </label>
                  <Slider
                    value={[operationState.offset]}
                    onValueChange={([value]) => handleParameterChange('offset', value)}
                    min={-20}
                    max={20}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Removal Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { name: 'Down (-Y)', vec: new THREE.Vector3(0, -1, 0), Icon: ArrowDown },
                      { name: 'Up (+Y)', vec: new THREE.Vector3(0, 1, 0), Icon: ArrowUp },
                      { name: 'Left (-X)', vec: new THREE.Vector3(-1, 0, 0), Icon: ArrowLeft },
                      { name: 'Right (+X)', vec: new THREE.Vector3(1, 0, 0), Icon: ArrowRight },
                      { name: 'Back (-Z)', vec: new THREE.Vector3(0, 0, -1), Icon: ArrowUpLeft },
                      { name: 'Forward (+Z)', vec: new THREE.Vector3(0, 0, 1), Icon: ArrowUpRight },
                    ].map(({ name, vec, Icon }) => {
                      const isSelected = operationState.removalDirection.equals(vec);
                      return (
                        <Button
                          key={name}
                          variant={isSelected ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleParameterChange('removalDirection', vec)}
                          className="justify-start"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {name}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Separator />

              {/* Quick Operations */}
              <div>
                <h3 className="font-medium text-sm mb-2">Quick Operations</h3>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickOperation('cylindrical-hole')}
                    className="text-xs justify-start"
                  >
                    <Minus className="w-3 h-3 mr-2" />
                    Cylindrical Hole
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickOperation('rectangular-pocket')}
                    className="text-xs justify-start"
                  >
                    <Minus className="w-3 h-3 mr-2" />
                    Rectangular Pocket
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickOperation('chamfer')}
                    className="text-xs justify-start"
                  >
                    <Settings className="w-3 h-3 mr-2" />
                    Chamfer Edges
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={handleRunPreview}
                  className="w-full"
                  disabled={!baseMesh || fixtureComponents.length === 0}
                >
                  Run Preview
                </Button>
                <Button
                  onClick={handleCreateNegative}
                  className="w-full"
                  disabled={!baseMesh || fixtureComponents.length === 0}
                >
                  Create Negative
                </Button>
                <Button
                  onClick={handleApply}
                  className="w-full"
                  disabled={!baseMesh || fixtureComponents.length === 0}
                >
                  Apply
                </Button>

                <Button
                  variant="outline"
                  onClick={handlePreviewToggle}
                  className="w-full"
                >
                  {operationState.preview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                  {operationState.preview ? 'Hide Preview' : 'Show Preview'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-0 h-full">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Negative Library</h3>
              <div className="grid grid-cols-1 gap-2">
                {['Clearance Hole', 'Counterbore', 'Countersink', 'Pocket', 'Slot'].map((type) => (
                  <Card key={type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{type}</span>
                        <Badge variant="secondary" className="text-xs">Template</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0 h-full">
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Operation History</h3>
              {createdNegatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">No operations yet</p>
              ) : (
                <div className="space-y-2">
                  {createdNegatives.map((negative) => (
                    <Card key={negative.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getOperationIcon(negative.operation.type)}
                            <span className="text-sm font-medium capitalize">
                              {negative.operation.type}
                            </span>
                          </div>
                          <Badge variant={getOperationColor(negative.operation.type) as any} className="text-xs">
                            {negative.parameters.depth}mm
                          </Badge>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicateNegative(negative.id)}
                            className="flex-1 text-xs"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNegative(negative.id)}
                            className="flex-1 text-xs"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default BooleanOperationsPanel;
