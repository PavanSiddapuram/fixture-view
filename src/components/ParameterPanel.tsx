import React, { useState, useEffect } from 'react';
import { useControls, folder, button } from 'leva';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  RotateCw,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';

interface ParameterPanelProps {
  selectedComponents: any[];
  onParameterChange?: (componentId: string, parameter: string, value: any) => void;
  onComponentDuplicate?: (componentId: string) => void;
  onComponentDelete?: (componentId: string) => void;
  onComponentVisibility?: (componentId: string, visible: boolean) => void;
  onComponentLock?: (componentId: string, locked: boolean) => void;
  className?: string;
}

interface ComponentParameter {
  id: string;
  name: string;
  value: any;
  min?: number;
  max?: number;
  step?: number;
  options?: any[];
  type: 'number' | 'boolean' | 'select' | 'color' | 'vector3';
}

const ParameterPanel: React.FC<ParameterPanelProps> = ({
  selectedComponents,
  onParameterChange,
  onComponentDuplicate,
  onComponentDelete,
  onComponentVisibility,
  onComponentLock,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<string>('properties');
  const [componentParameters, setComponentParameters] = useState<Record<string, ComponentParameter[]>>({});

  // Generate Leva controls for selected components
  const levaControls = useControls(() => {
    if (selectedComponents.length === 0) {
      return {};
    }

    const controls: any = {};

    selectedComponents.forEach((component, index) => {
      const componentId = component.id || `component_${index}`;
      const folderName = component.component?.name || `Component ${index + 1}`;

      controls[componentId] = folder({
        [`${componentId}_position_x`]: {
          value: component.position?.x || 0,
          min: -100,
          max: 100,
          step: 0.1,
          label: 'Position X'
        },
        [`${componentId}_position_y`]: {
          value: component.position?.y || 0,
          min: -100,
          max: 100,
          step: 0.1,
          label: 'Position Y'
        },
        [`${componentId}_position_z`]: {
          value: component.position?.z || 0,
          min: -100,
          max: 100,
          step: 0.1,
          label: 'Position Z'
        },
        [`${componentId}_rotation_x`]: {
          value: component.rotation?.x || 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: 'Rotation X'
        },
        [`${componentId}_rotation_y`]: {
          value: component.rotation?.y || 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: 'Rotation Y'
        },
        [`${componentId}_rotation_z`]: {
          value: component.rotation?.z || 0,
          min: -Math.PI,
          max: Math.PI,
          step: 0.01,
          label: 'Rotation Z'
        },
        [`${componentId}_scale_x`]: {
          value: component.scale?.x || 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: 'Scale X'
        },
        [`${componentId}_scale_y`]: {
          value: component.scale?.y || 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: 'Scale Y'
        },
        [`${componentId}_scale_z`]: {
          value: component.scale?.z || 1,
          min: 0.1,
          max: 5,
          step: 0.1,
          label: 'Scale Z'
        }
      }, { collapsed: true, color: getComponentColor(index) });

      // Add component-specific parameters
      if (component.component?.parameters) {
        Object.entries(component.component.parameters).forEach(([paramKey, paramValue]) => {
          const controlKey = `${componentId}_${paramKey}`;
          controls[controlKey] = {
            value: paramValue,
            label: paramKey.charAt(0).toUpperCase() + paramKey.slice(1)
          };
        });
      }
    });

    return controls;
  }, [selectedComponents]);

  // Handle parameter changes
  const handleParameterChange = (componentId: string, parameter: string, value: any) => {
    onParameterChange?.(componentId, parameter, value);
  };

  // Handle component actions
  const handleDuplicate = (componentId: string) => {
    onComponentDuplicate?.(componentId);
  };

  const handleDelete = (componentId: string) => {
    onComponentDelete?.(componentId);
  };

  const handleVisibilityToggle = (componentId: string, visible: boolean) => {
    onComponentVisibility?.(componentId, visible);
  };

  const handleLockToggle = (componentId: string, locked: boolean) => {
    onComponentLock?.(componentId, locked);
  };

  const getComponentColor = (index: number): string => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[index % colors.length];
  };

  if (selectedComponents.length === 0) {
    return (
      <div className={`w-80 border-l border-border/50 tech-glass flex flex-col ${className}`}>
        <div className="p-4 border-b border-border/50">
          <h2 className="font-tech font-semibold text-lg mb-1">Parameter Controls</h2>
          <p className="text-xs text-muted-foreground font-tech">
            Select components to edit parameters
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No components selected</p>
            <p className="text-xs mt-1">Click on components in the 3D view to select them</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 border-l border-border/50 tech-glass flex flex-col ${className}`}>
      <div className="p-4 border-b border-border/50">
        <h2 className="font-tech font-semibold text-lg mb-1">Parameter Controls</h2>
        <p className="text-xs text-muted-foreground font-tech">
          {selectedComponents.length} component{selectedComponents.length > 1 ? 's' : ''} selected
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="properties" className="text-xs">
            Properties
          </TabsTrigger>
          <TabsTrigger value="transform" className="text-xs">
            Transform
          </TabsTrigger>
          <TabsTrigger value="actions" className="text-xs">
            Actions
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 p-4">
          <TabsContent value="properties" className="mt-0 h-full">
            <div className="space-y-4">
              {selectedComponents.map((component, index) => {
                const componentId = component.id || `component_${index}`;
                const componentName = component.component?.name || `Component ${index + 1}`;
                const color = getComponentColor(index);

                return (
                  <Card key={componentId} className="border-l-4" style={{ borderLeftColor: color }}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">{componentName}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {component.category || 'Component'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Component-specific parameters */}
                        {component.component?.parameters && (
                          <div className="space-y-2">
                            <h5 className="text-xs font-medium text-muted-foreground">Parameters</h5>
                            {Object.entries(component.component.parameters).map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">{key}:</span>
                                <span className="font-mono text-xs">{String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <Separator />

                        {/* Transform controls */}
                        <div className="space-y-2">
                          <h5 className="text-xs font-medium text-muted-foreground">Transform</h5>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">X:</span>
                              <span className="font-mono">{component.position?.x?.toFixed(1) || '0.0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Y:</span>
                              <span className="font-mono">{component.position?.y?.toFixed(1) || '0.0'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Z:</span>
                              <span className="font-mono">{component.position?.z?.toFixed(1) || '0.0'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="transform" className="mt-0 h-full">
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                Use the controls above to adjust transform parameters
              </div>
              {/* Leva controls will be rendered here */}
            </div>
          </TabsContent>

          <TabsContent value="actions" className="mt-0 h-full">
            <div className="space-y-3">
              {selectedComponents.map((component, index) => {
                const componentId = component.id || `component_${index}`;
                const componentName = component.component?.name || `Component ${index + 1}`;

                return (
                  <Card key={componentId}>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{componentName}</span>
                          <Badge variant="outline" className="text-xs">
                            ID: {componentId.slice(-4)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(componentId)}
                            className="text-xs"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            Duplicate
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVisibilityToggle(componentId, !component.visible)}
                            className="text-xs"
                          >
                            {component.visible !== false ? (
                              <Eye className="w-3 h-3 mr-1" />
                            ) : (
                              <EyeOff className="w-3 h-3 mr-1" />
                            )}
                            {component.visible !== false ? 'Hide' : 'Show'}
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleLockToggle(componentId, !component.locked)}
                            className="text-xs"
                          >
                            {component.locked ? (
                              <Lock className="w-3 h-3 mr-1" />
                            ) : (
                              <Unlock className="w-3 h-3 mr-1" />
                            )}
                            {component.locked ? 'Unlock' : 'Lock'}
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(componentId)}
                            className="text-xs"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

export default ParameterPanel;
