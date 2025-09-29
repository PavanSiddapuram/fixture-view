import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  RotateCcw,
  Move,
  Scale,
  RotateCw,
  Save,
  Undo,
  Redo
} from "lucide-react";
import { CADOperations, TransformationParams } from "@/lib/cadOperations";

interface STLEditorProps {
  onTransformationApply: (params: TransformationParams) => void;
  onReset: () => void;
  isProcessing?: boolean;
}

const STLEditor: React.FC<STLEditorProps> = ({
  onTransformationApply,
  onReset,
  isProcessing = false
}) => {
  const [transformParams, setTransformParams] = useState<TransformationParams>({
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 },
    translation: { x: 0, y: 0, z: 0 }
  });

  const [history, setHistory] = useState<TransformationParams[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleParamChange = (category: keyof TransformationParams, axis: string, value: number) => {
    setTransformParams(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [axis]: value
      }
    }));
  };

  const applyTransformation = () => {
    onTransformationApply(transformParams);
    // Add to history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ ...transformParams });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevParams = history[prevIndex];
      setTransformParams(prevParams);
      setHistoryIndex(prevIndex);
      onTransformationApply(prevParams);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const nextParams = history[nextIndex];
      setTransformParams(nextParams);
      setHistoryIndex(nextIndex);
      onTransformationApply(nextParams);
    }
  };

  const reset = () => {
    const resetParams: TransformationParams = {
      scale: { x: 1, y: 1, z: 1 },
      rotation: { x: 0, y: 0, z: 0 },
      translation: { x: 0, y: 0, z: 0 }
    };
    setTransformParams(resetParams);
    onReset();
    setHistory([]);
    setHistoryIndex(-1);
  };

  const quickActions = [
    {
      name: 'Scale 50%',
      icon: Scale,
      action: () => {
        handleParamChange('scale', 'x', 0.5);
        handleParamChange('scale', 'y', 0.5);
        handleParamChange('scale', 'z', 0.5);
      }
    },
    {
      name: 'Scale 200%',
      icon: Scale,
      action: () => {
        handleParamChange('scale', 'x', 2);
        handleParamChange('scale', 'y', 2);
        handleParamChange('scale', 'z', 2);
      }
    },
    {
      name: 'Rotate 90° X',
      icon: RotateCw,
      action: () => handleParamChange('rotation', 'x', (transformParams.rotation?.x || 0) + 90)
    },
    {
      name: 'Rotate 90° Y',
      icon: RotateCw,
      action: () => handleParamChange('rotation', 'y', (transformParams.rotation?.y || 0) + 90)
    },
    {
      name: 'Rotate 90° Z',
      icon: RotateCw,
      action: () => handleParamChange('rotation', 'z', (transformParams.rotation?.z || 0) + 90)
    },
    {
      name: 'Center',
      icon: Move,
      action: () => {
        handleParamChange('translation', 'x', 0);
        handleParamChange('translation', 'y', 0);
        handleParamChange('translation', 'z', 0);
      }
    }
  ];

  return (
    <Card className="w-80">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scale className="w-4 h-4" />
          STL Editor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div>
          <Label className="text-sm font-medium">Quick Actions</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={action.action}
                  className="text-xs"
                >
                  <IconComponent className="w-3 h-3 mr-1" />
                  {action.name}
                </Button>
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Scale Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Scale className="w-4 h-4" />
            Scale
          </Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis}>
                <Label className="text-xs text-muted-foreground">{axis.toUpperCase()}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={transformParams.scale?.[axis as keyof typeof transformParams.scale] || 1}
                  onChange={(e) => handleParamChange('scale', axis, parseFloat(e.target.value) || 1)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Rotation Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Rotation (°)
          </Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis}>
                <Label className="text-xs text-muted-foreground">{axis.toUpperCase()}</Label>
                <Input
                  type="number"
                  step="1"
                  value={transformParams.rotation?.[axis as keyof typeof transformParams.rotation] || 0}
                  onChange={(e) => handleParamChange('rotation', axis, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Translation Controls */}
        <div>
          <Label className="text-sm font-medium flex items-center gap-2">
            <Move className="w-4 h-4" />
            Translation
          </Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {['x', 'y', 'z'].map((axis) => (
              <div key={axis}>
                <Label className="text-xs text-muted-foreground">{axis.toUpperCase()}</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={transformParams.translation?.[axis as keyof typeof transformParams.translation] || 0}
                  onChange={(e) => handleParamChange('translation', axis, parseFloat(e.target.value) || 0)}
                  className="h-8 text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* History Controls */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="flex-1"
          >
            <Undo className="w-3 h-3 mr-1" />
            Undo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="flex-1"
          >
            <Redo className="w-3 h-3 mr-1" />
            Redo
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={applyTransformation}
            disabled={isProcessing}
            className="flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            Apply
          </Button>
          <Button
            variant="outline"
            onClick={reset}
            disabled={isProcessing}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default STLEditor;
