import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Box,
  Circle,
  Triangle,
  Wrench,
  Square,
  Grid3X3,
  Settings,
  Search,
  Plus,
  Minus,
  RotateCw,
  Move3D
} from 'lucide-react';
import { FixtureComponent, createSupportComponents } from '@/lib/fixtureComponents';
import * as THREE from 'three';

interface EnhancedComponentLibraryProps {
  onComponentSelect?: (component: FixtureComponent) => void;
  onComponentPlace?: (component: FixtureComponent, position: THREE.Vector3) => void;
  className?: string;
}

interface ComponentPreview {
  component: FixtureComponent;
  isSelected: boolean;
  isPlacing: boolean;
}

const EnhancedComponentLibrary: React.FC<EnhancedComponentLibraryProps> = ({
  onComponentSelect,
  onComponentPlace,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('supports');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedComponent, setSelectedComponent] = useState<FixtureComponent | null>(null);
  const [componentPreviews, setComponentPreviews] = useState<ComponentPreview[]>([]);
  const [placementMode, setPlacementMode] = useState<boolean>(false);

  // Get component library
  const componentLibrary = React.useMemo(() => createSupportComponents(), []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'support': return <Box className="w-4 h-4" />;
      case 'clamp': return <Wrench className="w-4 h-4" />;
      case 'baseplate': return <Square className="w-4 h-4" />;
      case 'fastener': return <Settings className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getCategoryComponents = (category: string): FixtureComponent[] => {
    const categoryKey = category as keyof typeof componentLibrary;
    const components = componentLibrary[categoryKey] || [];
    return components.filter(component =>
      component.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleComponentSelect = useCallback((component: FixtureComponent) => {
    setSelectedComponent(component);
    setPlacementMode(true);
    onComponentSelect?.(component);

    // Add to previews
    setComponentPreviews(prev => [...prev, {
      component,
      isSelected: true,
      isPlacing: true
    }]);

    // Dispatch event for R3F viewer
    window.dispatchEvent(new CustomEvent('component-selected', { detail: component }));
  }, [onComponentSelect]);

  const handleComponentPlace = useCallback((position: THREE.Vector3) => {
    if (selectedComponent) {
      onComponentPlace?.(selectedComponent, position);
      setPlacementMode(false);
      setSelectedComponent(null);
      
      // Update previews
      setComponentPreviews(prev => prev.map(preview => 
        preview.component.id === selectedComponent.id 
          ? { ...preview, isPlacing: false, isSelected: false }
          : preview
      ));
    }
  }, [selectedComponent, onComponentPlace]);

  const cancelPlacement = useCallback(() => {
    setPlacementMode(false);
    setSelectedComponent(null);
    setComponentPreviews(prev => prev.filter(preview => !preview.isPlacing));
  }, []);

  const ComponentCard: React.FC<{ component: FixtureComponent }> = ({ component }) => {
    const isSelected = selectedComponent?.id === component.id;
    const isPlacing = componentPreviews.some(preview => 
      preview.component.id === component.id && preview.isPlacing
    );

    return (
      <Card
        className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
        } ${isPlacing ? 'animate-pulse' : ''}`}
        onClick={() => handleComponentSelect(component)}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0 ${
              isSelected ? 'bg-primary/20' : ''
            }`}>
              {getCategoryIcon(component.category)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm truncate">{component.name}</h4>
                {isPlacing && (
                  <Badge variant="default" className="text-xs">
                    Placing
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="text-xs mt-1">
                {component.category}
              </Badge>
              <div className="mt-2 text-xs text-muted-foreground">
                {Object.entries(component.parameters || {}).slice(0, 2).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span>{key}:</span>
                    <span>{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`w-80 border-l border-border/50 tech-glass flex flex-col ${className}`}>
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-tech font-semibold text-lg">Component Library</h2>
          {placementMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={cancelPlacement}
              className="text-xs"
            >
              Cancel
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground font-tech">
          {placementMode ? 'Click to place component' : 'Drag and drop fixture elements'}
        </p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-4">
          <TabsTrigger value="supports" className="text-xs">
            <Box className="w-3 h-3 mr-1" />
            Supports
          </TabsTrigger>
          <TabsTrigger value="clamps" className="text-xs">
            <Wrench className="w-3 h-3 mr-1" />
            Clamps
          </TabsTrigger>
          <TabsTrigger value="baseplates" className="text-xs">
            <Square className="w-3 h-3 mr-1" />
            Plates
          </TabsTrigger>
          <TabsTrigger value="fasteners" className="text-xs">
            <Settings className="w-3 h-3 mr-1" />
            Parts
          </TabsTrigger>
        </TabsList>

        <div className="p-4 flex-1">
          <div className="mb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {getCategoryComponents(selectedCategory).map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Category-specific content */}
        <TabsContent value="supports" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('supports').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clamps" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('clamps').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="baseplates" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('baseplates').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="fasteners" className="flex-1 mt-0">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              {getCategoryComponents('fasteners').map((component) => (
                <ComponentCard key={component.id} component={component} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      {/* Placement Instructions */}
      {placementMode && selectedComponent && (
        <div className="p-4 border-t border-border/50 bg-primary/5">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Move3D className="w-4 h-4 text-primary" />
              <span className="font-medium">Placing: {selectedComponent.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Click in the 3D view to place the component
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedComponentLibrary;
