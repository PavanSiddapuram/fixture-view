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
  useModel: boolean;
  useSupports: 'none' | 'all';
  useAdvancedOffset: boolean;
  qualityPreset: 'fast' | 'balanced' | 'high';
  pixelsPerUnit: number;
  simplifyRatio: number | null;
  verifyManifold: boolean;
  rotationXZ: number;
  rotationYZ: number;
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
    preview: false,
    useModel: true,
    useSupports: 'all',
    useAdvancedOffset: true,
    qualityPreset: 'balanced',
    pixelsPerUnit: 14,
    simplifyRatio: 0.5,
    verifyManifold: true,
    rotationXZ: 0,
    rotationYZ: 0
  });

  const [createdNegatives, setCreatedNegatives] = useState<FixtureNegative[]>([]);
  const [selectedNegative, setSelectedNegative] = useState<string | null>(null);

  const csgEngine = new CSGEngine();

  const handleOperationTypeChange = (type: 'subtract' | 'intersect' | 'union') => {
    setOperationState(prev => ({ ...prev, type }));
  };

  const handleApply = () => {
    // For now we focus solely on trimming supports, not updating the base cavity here.
    // Notify the scene that supports should be trimmed using the current boolean parameters.
    // ThreeDScene will interpret this as: for each support, treat it as the target and use the
    // model (and optionally other cutters) as tools, applying the same depth/offset/direction.
    window.dispatchEvent(new CustomEvent('supports-trim-request', {
      detail: {
        depth: operationState.depth,
        offset: operationState.offset,
        removalDirection: operationState.removalDirection,
        useModel: operationState.useModel,
        useSupports: operationState.useSupports,
        useAdvancedOffset: operationState.useAdvancedOffset,
        advancedOffsetOptions: {
          offsetDistance: Math.abs(operationState.offset) || 0.2,
          pixelsPerUnit: operationState.pixelsPerUnit,
          simplifyRatio: operationState.simplifyRatio,
          verifyManifold: operationState.verifyManifold,
          rotationXZ: operationState.rotationXZ,
          rotationYZ: operationState.rotationYZ
        }
      }
    }));
  };

  const handleParameterChange = (parameter: keyof OperationState, value: any) => {
    setOperationState(prev => ({ ...prev, [parameter]: value }));
  };

  const applyQualityPreset = (preset: 'fast' | 'balanced' | 'high') => {
    switch (preset) {
      case 'fast':
        setOperationState(prev => ({
          ...prev,
          qualityPreset: preset,
          pixelsPerUnit: 8,
          simplifyRatio: 0.7,
          verifyManifold: false,
        }));
        break;
      case 'high':
        setOperationState(prev => ({
          ...prev,
          qualityPreset: preset,
          pixelsPerUnit: 24,
          simplifyRatio: 0.3,
          verifyManifold: true,
        }));
        break;
      case 'balanced':
      default:
        setOperationState(prev => ({
          ...prev,
          qualityPreset: 'balanced',
          pixelsPerUnit: 14,
          simplifyRatio: 0.5,
          verifyManifold: true,
        }));
        break;
    }
  };

  const handlePreviewToggle = () => {
    setOperationState(prev => ({ ...prev, preview: !prev.preview }));
  };

  const handleToolSelectionChange = (field: 'useModel' | 'useSupports', value: any) => {
    setOperationState(prev => ({ ...prev, [field]: value }));
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
    <div className={`w-full rounded-lg border border-border/50 bg-background/80 shadow-sm flex flex-col ${className}`}>
      <div className="p-4 border-b border-border/50">
        <h2 className="font-tech font-semibold text-lg mb-1">Support Trimming</h2>
        <p className="text-xs text-muted-foreground font-tech">
          Trim parametric supports against the model using swept subtraction
        </p>
      </div>

      <Tabs defaultValue="trim" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-1 mx-4 mt-4">
          <TabsTrigger value="trim" className="text-xs">Support Trim</TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="trim" className="mt-0 h-full">
            <div className="space-y-4">
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

              {/* Advanced Offset (GPU) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-sm">Advanced Offset</h3>
                    <p className="text-[11px] text-muted-foreground">
                      GPU offset for model cutter (supports trimming)
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={operationState.useAdvancedOffset}
                      onChange={(e) => handleParameterChange('useAdvancedOffset', e.target.checked)}
                    />
                    <span>Enable</span>
                  </label>
                </div>

                {operationState.useAdvancedOffset && (
                  <div className="space-y-3 border border-border/40 rounded-md p-3 bg-muted/40">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <label className="text-xs font-medium mb-1 block">
                          Quality preset
                        </label>
                        <Select
                          value={operationState.qualityPreset}
                          onValueChange={(value) => applyQualityPreset(value as 'fast' | 'balanced' | 'high')}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fast">Fast</SelectItem>
                            <SelectItem value="balanced">Balanced</SelectItem>
                            <SelectItem value="high">High quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="text-[11px] text-muted-foreground text-right w-28">
                        <div>px/unit: {operationState.pixelsPerUnit}</div>
                        <div>simplify: {(operationState.simplifyRatio ?? 0.5).toFixed(2)}</div>
                      </div>
                    </div>

                    <label className="inline-flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={operationState.verifyManifold}
                        onChange={(e) => handleParameterChange('verifyManifold', e.target.checked)}
                      />
                      <span>Verify &amp; repair manifold</span>
                    </label>
                  </div>
                )}
              </div>
              {/* Action Button */}
              <div className="space-y-2 pt-2">
                <Button
                  onClick={handleApply}
                  className="w-full"
                >
                  Trim Supports
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default BooleanOperationsPanel;
