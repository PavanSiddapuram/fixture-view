import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Wrench,
  Settings,
  Triangle,
  Circle,
  Square,
  Plus,
  Save
} from "lucide-react";

interface ClampParams {
  type: 'c-clamp' | 'bar-clamp' | 'toggle-clamp' | 'edge-clamp';
  size: number;
  force: number;
  material: 'steel' | 'aluminum' | 'plastic';
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number };
}

interface ClampCreationProps {
  onClampCreate: (params: ClampParams) => void;
  isProcessing?: boolean;
}

const ClampCreation: React.FC<ClampCreationProps> = ({
  onClampCreate,
  isProcessing = false
}) => {
  const [clampParams, setClampParams] = useState<ClampParams>({
    type: 'c-clamp',
    size: 100,
    force: 500,
    material: 'steel',
    position: { x: 0, y: 0, z: 0 },
    orientation: { x: 0, y: 0, z: 0 }
  });

  const handleParamChange = (key: keyof ClampParams, value: any) => {
    setClampParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handlePositionChange = (axis: string, value: number) => {
    setClampParams(prev => ({
      ...prev,
      position: {
        ...prev.position,
        [axis]: value
      }
    }));
  };

  const handleOrientationChange = (axis: string, value: number) => {
    setClampParams(prev => ({
      ...prev,
      orientation: {
        ...prev.orientation,
        [axis]: value
      }
    }));
  };

  const createClamp = () => {
    onClampCreate(clampParams);
  };

  const clampTypes = [
    {
      value: 'c-clamp' as const,
      label: 'C-Clamp',
      description: 'Traditional C-shaped clamp',
      icon: 'C',
      defaultSize: 100,
      defaultForce: 500
    },
    {
      value: 'bar-clamp' as const,
      label: 'Bar Clamp',
      description: 'Long bar with sliding jaw',
      icon: '━',
      defaultSize: 300,
      defaultForce: 800
    },
    {
      value: 'toggle-clamp' as const,
      label: 'Toggle Clamp',
      description: 'Quick action toggle mechanism',
      icon: '⊏',
      defaultSize: 150,
      defaultForce: 300
    },
    {
      value: 'edge-clamp' as const,
      label: 'Edge Clamp',
      description: 'Clamps to edge of workpiece',
      icon: '⌞',
      defaultSize: 80,
      defaultForce: 400
    }
  ];

  const materials = [
    { value: 'steel' as const, label: 'Steel', color: 'bg-gray-600' },
    { value: 'aluminum' as const, label: 'Aluminum', color: 'bg-gray-400' },
    { value: 'plastic' as const, label: 'Plastic', color: 'bg-blue-400' }
  ];

  const quickPresets = [
    {
      name: 'Small C-Clamp',
      type: 'c-clamp' as const,
      size: 75,
      force: 300,
      material: 'steel' as const
    },
    {
      name: 'Large Bar Clamp',
      type: 'bar-clamp' as const,
      size: 600,
      force: 1000,
      material: 'aluminum' as const
    },
    {
      name: 'Precision Toggle',
      type: 'toggle-clamp' as const,
      size: 100,
      force: 200,
      material: 'steel' as const
    }
  ];

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-4 h-4" />
          Clamp Creation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Clamp Type */}
        <div>
          <Label className="text-sm font-medium">Clamp Type</Label>
          <Select
            value={clampParams.type}
            onValueChange={(value: any) => handleParamChange('type', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {clampTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{type.icon}</span>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Clamp Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Size (mm)</Label>
            <Input
              type="number"
              step="1"
              value={clampParams.size}
              onChange={(e) => handleParamChange('size', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Force (N)</Label>
            <Input
              type="number"
              step="10"
              value={clampParams.force}
              onChange={(e) => handleParamChange('force', parseFloat(e.target.value) || 0)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* Material */}
        <div>
          <Label className="text-sm font-medium">Material</Label>
          <div className="flex gap-2 mt-2">
            {materials.map((material) => (
              <Button
                key={material.value}
                variant={clampParams.material === material.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleParamChange('material', material.value)}
                className="flex-1"
              >
                <div className={`w-3 h-3 rounded mr-2 ${material.color}`} />
                {material.label}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Position */}
        <div>
          <Label className="text-sm font-medium">Position</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis}>
                <Label className="text-xs text-muted-foreground">{axis.toUpperCase()}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={clampParams.position[axis as keyof typeof clampParams.position]}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Orientation */}
        <div>
          <Label className="text-sm font-medium">Orientation (°)</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis}>
                <Label className="text-xs text-muted-foreground">{axis.toUpperCase()}</Label>
                <Input
                  type="number"
                  step="1"
                  value={clampParams.orientation[axis as keyof typeof clampParams.orientation]}
                  onChange={(e) => handleOrientationChange(axis, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Quick Presets */}
        <div>
          <Label className="text-sm font-medium">Quick Presets</Label>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {quickPresets.map((preset, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => setClampParams({ ...clampParams, ...preset })}
                disabled={isProcessing}
                className="justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Create Clamp Button */}
        <Button
          onClick={createClamp}
          disabled={isProcessing}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Clamp
        </Button>
      </CardContent>
    </Card>
  );
};

export default ClampCreation;
