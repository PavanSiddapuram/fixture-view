import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  GitMerge,
  GitBranch,
  Minus,
  Plus,
  Play,
  Square,
  Circle,
  Triangle
} from "lucide-react";
import { CADOperations, BooleanParams } from "@/lib/cadOperations";

interface BooleanOperationsProps {
  onBooleanOperation: (params: BooleanParams) => void;
  onPrimitiveCreate: (type: 'box' | 'cylinder' | 'sphere', params: any) => void;
  isProcessing?: boolean;
}

const BooleanOperations: React.FC<BooleanOperationsProps> = ({
  onBooleanOperation,
  onPrimitiveCreate,
  isProcessing = false
}) => {
  const [operation, setOperation] = useState<'union' | 'subtract' | 'intersect'>('union');
  const [selectedPrimitive, setSelectedPrimitive] = useState<'box' | 'cylinder' | 'sphere'>('box');
  const [primitiveParams, setPrimitiveParams] = useState({
    box: { width: 10, height: 10, depth: 10 },
    cylinder: { radius: 5, height: 10 },
    sphere: { radius: 5 }
  });

  const handleParamChange = (primitive: string, param: string, value: number) => {
    setPrimitiveParams(prev => ({
      ...prev,
      [primitive]: {
        ...prev[primitive as keyof typeof prev],
        [param]: value
      }
    }));
  };

  const performBooleanOperation = () => {
    // This would need to be connected to actual shape selection
    // For now, create a primitive and use it for the operation
    const params = primitiveParams[selectedPrimitive];
    onPrimitiveCreate(selectedPrimitive, params);
  };

  const quickPrimitives = [
    {
      type: 'box' as const,
      name: 'Box',
      icon: Square,
      params: { width: 20, height: 20, depth: 20 }
    },
    {
      type: 'cylinder' as const,
      name: 'Cylinder',
      icon: Circle,
      params: { radius: 10, height: 20 }
    },
    {
      type: 'sphere' as const,
      name: 'Sphere',
      icon: Circle,
      params: { radius: 10 }
    }
  ];

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitMerge className="w-4 h-4" />
          Boolean Operations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operation Type */}
        <div>
          <Label className="text-sm font-medium">Operation</Label>
          <Select value={operation} onValueChange={(value: any) => setOperation(value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="union">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Union
                </div>
              </SelectItem>
              <SelectItem value="subtract">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4" />
                  Subtract
                </div>
              </SelectItem>
              <SelectItem value="intersect">
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Intersect
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Primitive Creation */}
        <div>
          <Label className="text-sm font-medium">Create Primitive</Label>
          <Select value={selectedPrimitive} onValueChange={(value: any) => setSelectedPrimitive(value)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="box">
                <div className="flex items-center gap-2">
                  <Square className="w-4 h-4" />
                  Box
                </div>
              </SelectItem>
              <SelectItem value="cylinder">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4" />
                  Cylinder
                </div>
              </SelectItem>
              <SelectItem value="sphere">
                <div className="flex items-center gap-2">
                  <Circle className="w-4 h-4" />
                  Sphere
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Primitive Parameters */}
          <div className="mt-3 space-y-2">
            {selectedPrimitive === 'box' && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Width</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={primitiveParams.box.width}
                    onChange={(e) => handleParamChange('box', 'width', parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={primitiveParams.box.height}
                    onChange={(e) => handleParamChange('box', 'height', parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Depth</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={primitiveParams.box.depth}
                    onChange={(e) => handleParamChange('box', 'depth', parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-xs border rounded"
                  />
                </div>
              </>
            )}

            {selectedPrimitive === 'cylinder' && (
              <>
                <div>
                  <Label className="text-xs text-muted-foreground">Radius</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={primitiveParams.cylinder.radius}
                    onChange={(e) => handleParamChange('cylinder', 'radius', parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-xs border rounded"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Height</Label>
                  <input
                    type="number"
                    step="0.1"
                    value={primitiveParams.cylinder.height}
                    onChange={(e) => handleParamChange('cylinder', 'height', parseFloat(e.target.value))}
                    className="w-full h-8 px-2 text-xs border rounded"
                  />
                </div>
              </>
            )}

            {selectedPrimitive === 'sphere' && (
              <div>
                <Label className="text-xs text-muted-foreground">Radius</Label>
                <input
                  type="number"
                  step="0.1"
                  value={primitiveParams.sphere.radius}
                  onChange={(e) => handleParamChange('sphere', 'radius', parseFloat(e.target.value))}
                  className="w-full h-8 px-2 text-xs border rounded"
                />
              </div>
            )}
          </div>

          <Button
            onClick={() => onPrimitiveCreate(selectedPrimitive, primitiveParams[selectedPrimitive])}
            disabled={isProcessing}
            className="w-full mt-2"
          >
            Create Primitive
          </Button>
        </div>

        <Separator />

        {/* Quick Primitives */}
        <div>
          <Label className="text-sm font-medium">Quick Primitives</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {quickPrimitives.map((primitive, index) => {
              const IconComponent = primitive.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onPrimitiveCreate(primitive.type, primitive.params)}
                  disabled={isProcessing}
                  className="justify-start"
                >
                  <IconComponent className="w-4 h-4 mr-2" />
                  {primitive.name}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Execute Operation */}
        <Button
          onClick={performBooleanOperation}
          disabled={isProcessing}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          Execute {operation.charAt(0).toUpperCase() + operation.slice(1)} Operation
        </Button>
      </CardContent>
    </Card>
  );
};

export default BooleanOperations;
